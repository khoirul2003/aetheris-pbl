"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import {
  collection,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { onValue, ref } from "firebase/database";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Building2,
  Download,
  MoreVertical,
  Radio,
  WifiOff,
} from "lucide-react";
import { db, getRtdb } from "@/lib/firebase";

interface UserDoc { id: string; name?: string; email?: string; restaurantName?: string; role?: string; createdAt?: Timestamp | Date | null; }
interface SensorDoc { id: string; userId?: string; name?: string; location?: string; isActive?: boolean; isOnline?: boolean; lastOnline?: Timestamp | Date | number | null; }
interface AlertDoc { id: string; userId?: string; sensorName?: string; restaurantName?: string; location?: string; level?: "warning" | "danger" | string; message?: string; isResolved?: boolean; createdAt?: Timestamp | Date | number | null; }
interface SubscriptionLog { id: string; restaurantName?: string; packageName?: string; paymentStatus?: "paid" | "pending" | "expired" | string; amount?: number; startDate?: Timestamp | Date | number | null; endDate?: Timestamp | Date | number | null; }
interface LiveSensorStatus { gas?: number; temperature?: number; humidity?: number; status?: string; isOnline?: boolean; lastUpdate?: number; }
interface DashboardStat { label: string; value: string; detail: string; icon: typeof Building2; tone: "olive" | "emerald" | "amber" | "rose"; }
interface AlertTrendPoint { day: string; value: number; }
interface UserTrendPoint { month: string; value: number; }

function toDate(value: AlertDoc["createdAt"] | SubscriptionLog["startDate"] | SensorDoc["lastOnline"] | UserDoc["createdAt"]): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value) { return value.toDate(); }
  return null;
}

function formatRelativeTime(value: SensorDoc["lastOnline"] | number | null | undefined) {
  const date = toDate(value ?? null);
  if (!date) return "N/A";
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
}

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString("en-US")}`;
}

function getRestaurantName(userId: string | undefined, restaurantNameByUserId: Record<string, string>) {
  if (!userId) return "Partner Restaurant";
  return restaurantNameByUserId[userId] || "Partner Restaurant";
}

function getMonthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function getMonthLabel(date: Date) { return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date); }
function getDayLabel(date: Date) { return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date).slice(0, 3); }
function getStartOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }

function getLastNDays(count: number) {
  const days: { key: string; label: string; date: Date }[] = [];
  const today = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push({ key: getMonthKey(date) + `-${date.getDate()}`, label: getDayLabel(date), date });
  }
  return days;
}

function SectionHeading({ title, description, compact = false }: { title: string; description?: string; compact?: boolean; }) {
  return (
    <div>
      <h3 className={`font-bold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>{title}</h3>
      {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
    </div>
  );
}

function ChartPanel({ title, accent, data, labels }: { title: string; accent: "olive" | "rose" | "emerald"; data: number[]; labels: string[]; }) {
  const accentClass = accent === "olive" ? "bg-[#4D6344]" : accent === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm overflow-hidden w-full h-full">
      <div className="mb-5 flex items-center justify-between gap-4 shrink-0">
        <SectionHeading title={title} description="Data fetched directly from Firestore." />
      </div>
      
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar mt-auto">
        <div className="flex h-56 min-w-70 items-end gap-2 border-b border-l border-slate-200 px-2 pt-4 text-[10px] text-slate-400">
          {data.map((value, index) => (
            <div key={labels[index] ?? index} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex w-full items-end justify-center gap-1">
                <div 
                  className={`${accentClass} relative flex-1 rounded-t-md transition-all group-hover:opacity-90 min-w-4`} 
                  style={{ height: `${Math.max(8, value)}%` }}
                >
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1A1F24] px-2 py-1 font-sans text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block z-10 shadow-md pointer-events-none">
                    {value}
                  </span>
                </div>
              </div>
              <span className="font-medium text-slate-500 truncate w-full text-center">
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [sensors, setSensors] = useState<SensorDoc[]>([]);
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [subscriptionLogs, setSubscriptionLogs] = useState<SubscriptionLog[]>([]);
  const [liveSensors, setLiveSensors] = useState<Record<string, LiveSensorStatus>>({});

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => { setUsers(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<UserDoc, "id">) }))); });
    const unsubSensors = onSnapshot(collection(db, "sensors"), (snapshot) => { setSensors(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SensorDoc, "id">) }))); });
    const unsubAlerts = onSnapshot(collection(db, "alerts"), (snapshot) => { setAlerts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<AlertDoc, "id">) }))); });
    const unsubSubscriptions = onSnapshot(collection(db, "userSubscriptions"), (snapshot) => { setSubscriptionLogs(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SubscriptionLog, "id">) }))); });
    const liveRef = ref(getRtdb(), "sensorLive");
    const unsubLive = onValue(liveRef, (snapshot) => { setLiveSensors((snapshot.val() as Record<string, LiveSensorStatus>) || {}); });
    return () => { unsubUsers(); unsubSensors(); unsubAlerts(); unsubSubscriptions(); unsubLive(); };
  }, []);

  const restaurantUsers = useMemo(() => users.filter((user) => user.role === "user" || Boolean(user.restaurantName)), [users]);

  const restaurantNameByUserId = useMemo(() => {
    return restaurantUsers.reduce<Record<string, string>>((mapping, user) => { mapping[user.id] = user.restaurantName || user.name || "Partner Restaurant"; return mapping; }, {});
  }, [restaurantUsers]);

  const dashboardStats: DashboardStat[] = useMemo(() => {
    const activeSensorCount = sensors.filter((sensor) => { const live = liveSensors[sensor.id]; const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false; return sensor.isActive !== false && effectiveOnline; }).length;
    const offlineSensorCount = sensors.filter((sensor) => { const live = liveSensors[sensor.id]; const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false; return !effectiveOnline; }).length;
    const today = getStartOfDay(new Date());
    const todayAlertCount = alerts.filter((alert) => { const alertDate = toDate(alert.createdAt); return Boolean(alertDate && alertDate >= today); }).length;

    return [
      { label: "Total Registered Outlets", value: String(restaurantUsers.length), detail: `${restaurantUsers.filter((user) => user.role === "user").length} active partner accounts`, icon: Building2, tone: "olive" },
      { label: "Total Active Sensors", value: String(activeSensorCount), detail: `${sensors.length} sensors connected to platform`, icon: Radio, tone: "emerald" },
      { label: "Total Alerts Today", value: String(todayAlertCount), detail: `${alerts.filter((alert) => alert.level === "danger").length} in critical status`, icon: Bell, tone: "amber" },
      { label: "Total Offline Sensors", value: String(offlineSensorCount), detail: `${Math.max(0, sensors.length - offlineSensorCount)} online sensors`, icon: WifiOff, tone: "rose" },
    ];
  // PERBAIKAN: Mengganti restaurantUsers.length menjadi restaurantUsers secara keseluruhan.
  }, [alerts, liveSensors, restaurantUsers, sensors]);

  const realtimeRestaurants = useMemo(() => {
    const activeAlerts = alerts.filter((alert) => (alert.level === "warning" || alert.level === "danger") && alert.isResolved !== true).sort((left, right) => { const rightDate = toDate(right.createdAt)?.getTime() || 0; const leftDate = toDate(left.createdAt)?.getTime() || 0; return rightDate - leftDate; });
    const unique = new Map<string, AlertDoc & { restaurant: string }>();
    activeAlerts.forEach((alert) => { const restaurant = alert.restaurantName || getRestaurantName(alert.userId, restaurantNameByUserId); if (!unique.has(restaurant)) { unique.set(restaurant, { ...alert, restaurant }); } });
    return Array.from(unique.values()).slice(0, 4).map((item) => ({ restaurant: item.restaurant, location: item.location || item.sensorName || "Location unavailable", status: item.level === "danger" ? "DANGER" : "WARNING", tone: item.level === "danger" ? "rose" : "amber", message: item.message || "Needs operator review" }));
  }, [alerts, restaurantNameByUserId]);

  const alertTrend = useMemo<AlertTrendPoint[]>(() => {
    const days = getLastNDays(7);
    return days.map((day) => {
      const count = alerts.filter((alert) => { const alertDate = toDate(alert.createdAt); if (!alertDate) return false; return getMonthKey(alertDate) === getMonthKey(day.date) && alertDate.getDate() === day.date.getDate(); }).length;
      return { day: day.label, value: count };
    });
  }, [alerts]);

  const userGrowthTrend = useMemo<UserTrendPoint[]>(() => {
    const buckets = new Map<string, UserTrendPoint>();
    const today = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) { const date = new Date(today.getFullYear(), today.getMonth() - offset, 1); const key = getMonthKey(date); buckets.set(key, { month: getMonthLabel(date), value: 0 }); }
    restaurantUsers.forEach((user) => { const createdAt = toDate(user.createdAt); if (!createdAt) return; const key = getMonthKey(createdAt); if (buckets.has(key)) { buckets.get(key)!.value += 1; } });
    return Array.from(buckets.values());
  }, [restaurantUsers]);

  const offlineSensorRows = useMemo(() => {
    return sensors.map((sensor) => {
        const live = liveSensors[sensor.id]; const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false; const restaurant = getRestaurantName(sensor.userId, restaurantNameByUserId); const lastSeen = sensor.lastOnline ?? live?.lastUpdate ?? null;
        return { sensor: sensor.name || sensor.id, restaurant, lastOnline: formatRelativeTime(lastSeen), isOffline: !effectiveOnline };
      }).filter((row) => row.isOffline).slice(0, 5);
  }, [liveSensors, restaurantNameByUserId, sensors]);

  const monthlyRevenue = useMemo(() => {
    const monthKey = getMonthKey(new Date());
    const paidLogs = subscriptionLogs.filter((log) => { if (log.paymentStatus !== "paid") return false; const paymentDate = toDate(log.startDate) || toDate(log.endDate); return paymentDate ? getMonthKey(paymentDate) === monthKey : true; });
    const total = paidLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
    const byPackage = paidLogs.reduce<Record<string, number>>((accumulator, log) => { const key = log.packageName || "unknown"; accumulator[key] = (accumulator[key] || 0) + Number(log.amount || 0); return accumulator; }, {});
    return { total, paidCount: paidLogs.length, pendingCount: subscriptionLogs.filter((log) => log.paymentStatus === "pending").length, byPackage };
  }, [subscriptionLogs]);

  const alertValues = alertTrend.map((entry) => entry.value);
  const userValues = userGrowthTrend.map((entry) => entry.value);
  const maxAlertValue = Math.max(...alertValues, 1);
  const maxUserValue = Math.max(...userValues, 1);

  return (
    <AdminLayout title="Dashboard" description="All figures below are fetched directly from Firestore and Realtime Database.">
      <div className="flex w-full flex-col gap-5 h-full">
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div><SectionHeading title="Platform Overview" description="Today's operational conditions of the industrial monitoring platform." /></div>
              <button className="inline-flex items-center gap-2 self-start rounded-xl border border-[#4D6344]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#4D6344] shadow-sm transition-colors hover:bg-[#EAF2EB] cursor-pointer">
                <Download size={16} />
                Export Data
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardStats.map((stat) => {
                const Icon = stat.icon;
                const accentClass = stat.tone === "olive" ? "border-t-[#4D6344]" : stat.tone === "emerald" ? "border-t-emerald-500" : stat.tone === "amber" ? "border-t-amber-500" : "border-t-rose-500";
                const pillClass = stat.tone === "olive" ? "border-[#4D6344]/30 text-[#4D6344] bg-[#EAF2EB]" : stat.tone === "emerald" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : stat.tone === "amber" ? "border-amber-500 text-amber-700 bg-amber-50" : "border-rose-500 text-rose-700 bg-rose-50";

                return (
                  <div key={stat.label} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] border-t-4 ${accentClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                        <div className="mt-4 flex items-end gap-3">
                          <p className="text-4xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${pillClass}`}>{stat.detail}</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Icon size={18} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3 items-stretch">
            
            {/* LEFT COLUMN (Wider: 2/3) */}
            <div className="space-y-5 lg:col-span-2 flex flex-col h-full">
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><AlertTriangle size={18} /></div>
                      <SectionHeading title="Restaurants in Danger/Warning" description="Locations requiring quick action, sorted by most recent events." compact />
                    </div>
                    <button className="inline-flex items-center gap-1 text-sm font-bold text-[#4D6344] hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap">
                      View All
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {realtimeRestaurants.length > 0 ? (
                      realtimeRestaurants.map((item) => {
                        const badgeClass = item.tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600";
                        return (
                          <div key={`${item.restaurant}-${item.location}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500"><AlertTriangle size={16} /></div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{item.restaurant}</h4>
                                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                    <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>{item.status}</span>
                                    <button className="text-sm font-bold text-[#4D6344] hover:underline cursor-pointer">Investigate</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No restaurants currently in danger or warning condition.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <SectionHeading title="This Month's Revenue Summary" description="Calculated from Firestore payment logs." compact />
                    <button className="text-slate-400 transition-colors hover:text-[#4D6344]"><MoreVertical size={18} /></button>
                  </div>

                  <div className="mt-10">
                    <p className="text-4xl font-extrabold tracking-tight text-[#4D6344]">
                      {formatCurrency(monthlyRevenue.total)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{monthlyRevenue.paidCount} paid payments this month</p>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Payment pending</p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Subscription logs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{monthlyRevenue.pendingCount} pending</p>
                        <p className="mt-1 text-sm font-semibold text-[#4D6344]">Live Firestore data</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-6 gap-3">
                      {Object.entries(monthlyRevenue.byPackage).length > 0 ? (
                        Object.entries(monthlyRevenue.byPackage).slice(0, 6).map(([packageName, amount]) => (
                          <div key={packageName} className="flex flex-col items-center gap-2">
                            <div className="flex h-32 w-full items-end justify-center rounded-xl bg-[#F6F5F0] px-2 py-2">
                              <div className="w-full rounded-t-lg bg-[#C2D1C0]" style={{ height: `${Math.min(100, Math.max(18, (amount / Math.max(monthlyRevenue.total, 1)) * 100))}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">{packageName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No payment logs for this month yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flex-grow to stretch charts downward filling remaining space */}
              <div className="grid gap-5 md:grid-cols-2 grow">
                <ChartPanel title="Alert Trend (Last 7 Days)" accent="rose" data={alertTrend.map((entry) => Math.max(10, Math.round((entry.value / maxAlertValue) * 100)))} labels={alertTrend.map((entry) => entry.day)} />
                <ChartPanel title="New User Growth per Month" accent="olive" data={userGrowthTrend.map((entry) => Math.max(10, Math.round((entry.value / maxUserValue) * 100)))} labels={userGrowthTrend.map((entry) => entry.month)} />
              </div>
            </div>

            {/* RIGHT COLUMN (Narrower: 1/3) with flex flex-col and h-full */}
            <div className="flex flex-col gap-5 lg:col-span-1 h-full">
              
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shrink-0">
                <SectionHeading title="Real-time Restaurant Conditions" description="Data fetched from the latest unresolved Firestore alerts." />
                <div className="mt-4 space-y-3">
                  {realtimeRestaurants.length > 0 ? (
                    realtimeRestaurants.slice(0, 3).map((item) => (
                      <div key={item.restaurant} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-semibold text-slate-900">{item.restaurant}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 ${item.tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{item.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No active emergencies at the moment.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm flex flex-col shrink-0">
                <SectionHeading title="Platform Status" description="Quick snapshot of current live database data." />
                <div className="mt-4 space-y-3 text-sm grow">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">Total active alerts</span><span className="font-semibold text-slate-900">{alerts.filter((alert) => alert.isResolved !== true).length}</span></div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">Total partner users</span><span className="font-semibold text-slate-900">{restaurantUsers.length}</span></div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-slate-600">Live online sensors</span>
                    <span className="font-semibold text-slate-900">
                      {sensors.filter((sensor) => { const live = liveSensors[sensor.id]; const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false; return sensor.isActive !== false && effectiveOnline; }).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* OFFLINE SENSORS CARD: Uses flex-1 to stretch dynamically to fill column height */}
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm flex flex-col flex-1">
                <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                  <div><SectionHeading title="Offline Sensors" description="Sensors currently disconnected from the network." /></div>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 whitespace-nowrap">{offlineSensorRows.length} item(s)</span>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 flex-1">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Sensor Name</th>
                        <th className="px-4 py-3 font-semibold">Restaurant</th>
                        <th className="px-4 py-3 font-semibold">Last online</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                      {offlineSensorRows.length > 0 ? (
                        offlineSensorRows.map((sensor) => (
                          <tr key={sensor.sensor}>
                            <td className="px-4 py-4 font-medium text-slate-900">{sensor.sensor}</td>
                            <td className="px-4 py-4 max-w-30 truncate" title={sensor.restaurant}>{sensor.restaurant}</td>
                            <td className="px-4 py-4 text-slate-500">{sensor.lastOnline}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">All sensors are currently online.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>
        </div>
    </AdminLayout>
  );
}