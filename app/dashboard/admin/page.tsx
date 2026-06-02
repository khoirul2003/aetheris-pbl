"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
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
  Search,
  WifiOff,
} from "lucide-react";
import { db, getRtdb } from "@/lib/firebase";

interface UserDoc {
  id: string;
  name?: string;
  email?: string;
  restaurantName?: string;
  role?: string;
  createdAt?: Timestamp | Date | null;
}

interface SensorDoc {
  id: string;
  userId?: string;
  name?: string;
  location?: string;
  isActive?: boolean;
  isOnline?: boolean;
  lastOnline?: Timestamp | Date | number | null;
}

interface AlertDoc {
  id: string;
  userId?: string;
  sensorName?: string;
  restaurantName?: string;
  location?: string;
  level?: "warning" | "danger" | string;
  message?: string;
  isResolved?: boolean;
  createdAt?: Timestamp | Date | number | null;
}

interface SubscriptionLog {
  id: string;
  restaurantName?: string;
  packageName?: string;
  paymentStatus?: "paid" | "pending" | "expired" | string;
  amount?: number;
  startDate?: Timestamp | Date | number | null;
  endDate?: Timestamp | Date | number | null;
}

interface LiveSensorStatus {
  gas?: number;
  temperature?: number;
  humidity?: number;
  status?: string;
  isOnline?: boolean;
  lastUpdate?: number;
}

interface DashboardStat {
  label: string;
  value: string;
  detail: string;
  icon: typeof Building2;
  tone: "blue" | "emerald" | "amber" | "rose";
}

interface AlertTrendPoint {
  day: string;
  value: number;
}

interface UserTrendPoint {
  month: string;
  value: number;
}

function toDate(value: AlertDoc["createdAt"] | SubscriptionLog["startDate"] | SensorDoc["lastOnline"] | UserDoc["createdAt"]): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  return null;
}

function formatRelativeTime(value: SensorDoc["lastOnline"] | number | null | undefined) {
  const date = toDate(value ?? null);
  if (!date) return "Tidak tersedia";

  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRestaurantName(userId: string | undefined, restaurantNameByUserId: Record<string, string>) {
  if (!userId) return "Restoran Mitra";
  return restaurantNameByUserId[userId] || "Restoran Mitra";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);
}

function getDayLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date).slice(0, 3);
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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

function buildPath(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = step * index;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function SectionHeading({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <h3 className={`font-bold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>{title}</h3>
      {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
    </div>
  );
}

function ChartPanel({
  title,
  accent,
  data,
  labels,
}: {
  title: string;
  accent: "blue" | "rose" | "emerald";
  data: number[];
  labels: string[];
}) {
  const accentClass =
    accent === "blue"
      ? "bg-blue-500"
      : accent === "emerald"
        ? "bg-emerald-500"
        : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <SectionHeading title={title} description="Data diambil langsung dari Firestore." />
      </div>
      <div className="flex h-56 items-end gap-2 border-b border-l border-slate-200 px-2 pt-4 text-[10px] text-slate-400">
        {data.map((value, index) => (
          <div key={labels[index] ?? index} className="group flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex w-full items-end justify-center gap-1">
              <div
                className={`${accentClass} relative flex-1 rounded-t-md transition-all group-hover:opacity-90`}
                style={{ height: `${Math.max(8, value)}%` }}
              >
                <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 font-sans text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                  {value}
                </span>
              </div>
            </div>
            <span className="font-medium text-slate-500">{labels[index]}</span>
          </div>
        ))}
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
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<UserDoc, "id">) })));
    });

    const unsubSensors = onSnapshot(collection(db, "sensors"), (snapshot) => {
      setSensors(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SensorDoc, "id">) })));
    });

    const unsubAlerts = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setAlerts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<AlertDoc, "id">) })));
    });

    const unsubSubscriptions = onSnapshot(collection(db, "userSubscriptions"), (snapshot) => {
      setSubscriptionLogs(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SubscriptionLog, "id">) })),
      );
    });

    const liveRef = ref(getRtdb(), "sensorLive");
    const unsubLive = onValue(liveRef, (snapshot) => {
      setLiveSensors((snapshot.val() as Record<string, LiveSensorStatus>) || {});
    });

    return () => {
      unsubUsers();
      unsubSensors();
      unsubAlerts();
      unsubSubscriptions();
      unsubLive();
    };
  }, []);

  const restaurantUsers = useMemo(
    () => users.filter((user) => user.role === "user" || Boolean(user.restaurantName)),
    [users],
  );

  const restaurantNameByUserId = useMemo(() => {
    return restaurantUsers.reduce<Record<string, string>>((mapping, user) => {
      mapping[user.id] = user.restaurantName || user.name || "Restoran Mitra";
      return mapping;
    }, {});
  }, [restaurantUsers]);

  const dashboardStats: DashboardStat[] = useMemo(() => {
    const activeSensorCount = sensors.filter((sensor) => {
      const live = liveSensors[sensor.id];
      const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false;
      return sensor.isActive !== false && effectiveOnline;
    }).length;

    const offlineSensorCount = sensors.filter((sensor) => {
      const live = liveSensors[sensor.id];
      const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false;
      return !effectiveOnline;
    }).length;

    const today = getStartOfDay(new Date());
    const todayAlertCount = alerts.filter((alert) => {
      const alertDate = toDate(alert.createdAt);
      return Boolean(alertDate && alertDate >= today);
    }).length;

    return [
      {
        label: "Total restoran terdaftar",
        value: String(restaurantUsers.length),
        detail: `${restaurantUsers.filter((user) => user.role === "user").length} akun mitra aktif`,
        icon: Building2,
        tone: "blue",
      },
      {
        label: "Total sensor aktif",
        value: String(activeSensorCount),
        detail: `${sensors.length} sensor terhubung di platform`,
        icon: Radio,
        tone: "emerald",
      },
      {
        label: "Total alert hari ini",
        value: String(todayAlertCount),
        detail: `${alerts.filter((alert) => alert.level === "danger").length} berstatus bahaya`,
        icon: Bell,
        tone: "amber",
      },
      {
        label: "Total sensor offline",
        value: String(offlineSensorCount),
        detail: `${Math.max(0, sensors.length - offlineSensorCount)} sensor online`,
        icon: WifiOff,
        tone: "rose",
      },
    ];
  }, [alerts, liveSensors, restaurantUsers.length, sensors]);

  const realtimeRestaurants = useMemo(() => {
    const activeAlerts = alerts
      .filter((alert) => (alert.level === "warning" || alert.level === "danger") && alert.isResolved !== true)
      .sort((left, right) => {
        const rightDate = toDate(right.createdAt)?.getTime() || 0;
        const leftDate = toDate(left.createdAt)?.getTime() || 0;
        return rightDate - leftDate;
      });

    const unique = new Map<string, AlertDoc & { restaurant: string }>();
    activeAlerts.forEach((alert) => {
      const restaurant = alert.restaurantName || getRestaurantName(alert.userId, restaurantNameByUserId);
      if (!unique.has(restaurant)) {
        unique.set(restaurant, { ...alert, restaurant });
      }
    });

    return Array.from(unique.values()).slice(0, 4).map((item) => ({
      restaurant: item.restaurant,
      location: item.location || item.sensorName || "Lokasi tidak tersedia",
      status: item.level === "danger" ? "BAHAYA" : "WASPADA",
      tone: item.level === "danger" ? "rose" : "amber",
      message: item.message || "Butuh peninjauan operator",
    }));
  }, [alerts, restaurantNameByUserId]);

  const alertTrend = useMemo<AlertTrendPoint[]>(() => {
    const days = getLastNDays(7);
    return days.map((day) => {
      const count = alerts.filter((alert) => {
        const alertDate = toDate(alert.createdAt);
        if (!alertDate) return false;
        return getMonthKey(alertDate) === getMonthKey(day.date) && alertDate.getDate() === day.date.getDate();
      }).length;

      return {
        day: day.label,
        value: count,
      };
    });
  }, [alerts]);

  const userGrowthTrend = useMemo<UserTrendPoint[]>(() => {
    const buckets = new Map<string, UserTrendPoint>();
    const today = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = getMonthKey(date);
      buckets.set(key, { month: getMonthLabel(date), value: 0 });
    }

    restaurantUsers.forEach((user) => {
      const createdAt = toDate(user.createdAt);
      if (!createdAt) return;
      const key = getMonthKey(createdAt);
      if (buckets.has(key)) {
        buckets.get(key)!.value += 1;
      }
    });

    return Array.from(buckets.values());
  }, [restaurantUsers]);

  const offlineSensorRows = useMemo(() => {
    return sensors
      .map((sensor) => {
        const live = liveSensors[sensor.id];
        const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false;
        const restaurant = getRestaurantName(sensor.userId, restaurantNameByUserId);
        const lastSeen = sensor.lastOnline ?? live?.lastUpdate ?? null;

        return {
          sensor: sensor.name || sensor.id,
          restaurant,
          lastOnline: formatRelativeTime(lastSeen),
          isOffline: !effectiveOnline,
        };
      })
      .filter((row) => row.isOffline)
      .slice(0, 5);
  }, [liveSensors, restaurantNameByUserId, sensors]);

  const monthlyRevenue = useMemo(() => {
    const monthKey = getMonthKey(new Date());
    const paidLogs = subscriptionLogs.filter((log) => {
      if (log.paymentStatus !== "paid") return false;
      const paymentDate = toDate(log.startDate) || toDate(log.endDate);
      return paymentDate ? getMonthKey(paymentDate) === monthKey : true;
    });

    const total = paidLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);

    const byPackage = paidLogs.reduce<Record<string, number>>((accumulator, log) => {
      const key = log.packageName || "unknown";
      accumulator[key] = (accumulator[key] || 0) + Number(log.amount || 0);
      return accumulator;
    }, {});

    return {
      total,
      paidCount: paidLogs.length,
      pendingCount: subscriptionLogs.filter((log) => log.paymentStatus === "pending").length,
      byPackage,
    };
  }, [subscriptionLogs]);

  const alertValues = alertTrend.map((entry) => entry.value);
  const userValues = userGrowthTrend.map((entry) => entry.value);
  const alertPath = buildPath(alertValues.length ? alertValues : [0], 340, 120);
  const userPath = buildPath(userValues.length ? userValues : [0], 340, 120);
  const maxAlertValue = Math.max(...alertValues, 1);
  const maxUserValue = Math.max(...userValues, 1);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-size-[18px_18px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/80 to-transparent" />

      <Sidebar role="admin" />

      <main className="relative ml-64 min-h-screen px-4 py-4 md:px-6 md:py-5">
        <div className="flex w-full flex-col gap-5">
          <header className="rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-slate-500">Admin Dashboard</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Beranda</h1>
                <p className="mt-1 text-sm text-slate-500">Semua angka di bawah ini diambil langsung dari Firestore dan Realtime Database.</p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                <div className="relative w-full lg:w-90">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Cari restoran, sensor, atau alert..."
                  />
                </div>

                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                  <Bell size={16} />
                  Support
                </button>

                <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm">
                  AD
                </button>
              </div>
            </div>
          </header>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading
                  title="Ringkasan platform"
                  description="Kondisi operasional platform monitoring industri hari ini."
                />
              </div>

              <button className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                <Download size={16} />
                Export Data
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardStats.map((stat) => {
                const Icon = stat.icon;
                const accentClass =
                  stat.tone === "blue"
                    ? "border-t-blue-500"
                    : stat.tone === "emerald"
                      ? "border-t-emerald-500"
                      : stat.tone === "amber"
                        ? "border-t-amber-500"
                        : "border-t-rose-500";

                const pillClass =
                  stat.tone === "blue"
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : stat.tone === "emerald"
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : stat.tone === "amber"
                        ? "border-amber-500 text-amber-700 bg-amber-50"
                        : "border-rose-500 text-rose-700 bg-rose-50";

                return (
                  <div
                    key={stat.label}
                    className={`rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] border-t-4 ${accentClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                        <div className="mt-4 flex items-end gap-3">
                          <p className="text-4xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${pillClass}`}>{stat.detail}</span>
                        </div>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        <Icon size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <AlertTriangle size={18} />
                      </div>
                      <SectionHeading
                        title="Restoran dalam Bahaya/Waspada"
                        description="Lokasi yang membutuhkan tindakan cepat, diurutkan dari kejadian terbaru."
                        compact
                      />
                    </div>

                    <button className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                      Lihat Semua
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {realtimeRestaurants.length > 0 ? (
                      realtimeRestaurants.map((item) => {
                        const badgeClass =
                          item.tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600";

                        return (
                          <div key={`${item.restaurant}-${item.location}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <AlertTriangle size={16} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{item.restaurant}</h4>
                                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                    <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>{item.status}</span>
                                    <button className="text-sm font-semibold text-blue-600">Investigasi</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Belum ada restoran dalam kondisi bahaya atau waspada.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <SectionHeading title="Ringkasan Pendapatan Bulan Ini" description="Dihitung dari log pembayaran Firestore." compact />
                    <button className="text-slate-400 transition-colors hover:text-slate-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mt-10">
                    <p className="text-4xl font-extrabold tracking-tight text-blue-600">
                      {formatCurrency(monthlyRevenue.total)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{monthlyRevenue.paidCount} pembayaran paid bulan ini</p>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Payment pending</p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Subscription logs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{monthlyRevenue.pendingCount} pending</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600">Live Firestore data</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-6 gap-3">
                      {Object.entries(monthlyRevenue.byPackage).length > 0 ? (
                        Object.entries(monthlyRevenue.byPackage).slice(0, 6).map(([packageName, amount]) => (
                          <div key={packageName} className="flex flex-col items-center gap-2">
                            <div className="flex h-32 w-full items-end justify-center rounded-xl bg-slate-50 px-2 py-2">
                              <div className="w-full rounded-t-lg bg-blue-200" style={{ height: `${Math.min(100, Math.max(18, (amount / Math.max(monthlyRevenue.total, 1)) * 100))}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">{packageName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          Belum ada log pembayaran untuk bulan ini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ChartPanel
                  title="Grafik Alert 7 Hari Terakhir"
                  accent="rose"
                  data={alertTrend.map((entry) => Math.max(10, Math.round((entry.value / maxAlertValue) * 100)))}
                  labels={alertTrend.map((entry) => entry.day)}
                />
                <ChartPanel
                  title="Pertumbuhan User Baru per Bulan"
                  accent="blue"
                  data={userGrowthTrend.map((entry) => Math.max(10, Math.round((entry.value / maxUserValue) * 100)))}
                  labels={userGrowthTrend.map((entry) => entry.month)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <SectionHeading
                      title="Sensor Offline"
                      description="Sensor yang tidak terhubung beserta restoran terakhir yang terdeteksi."
                    />
                  </div>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                    {offlineSensorRows.length} item
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nama sensor</th>
                        <th className="px-4 py-3 font-semibold">Restoran</th>
                        <th className="px-4 py-3 font-semibold">Terakhir online</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                      {offlineSensorRows.length > 0 ? (
                        offlineSensorRows.map((sensor) => (
                          <tr key={sensor.sensor}>
                            <td className="px-4 py-4 font-medium text-slate-900">{sensor.sensor}</td>
                            <td className="px-4 py-4">{sensor.restaurant}</td>
                            <td className="px-4 py-4 text-slate-500">{sensor.lastOnline}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                            Semua sensor sedang online.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-1">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                <SectionHeading
                  title="Restoran dalam kondisi realtime"
                  description="Data diambil dari alert Firestore terbaru yang belum terselesaikan."
                />
                <div className="mt-4 space-y-3">
                  {realtimeRestaurants.length > 0 ? (
                    realtimeRestaurants.slice(0, 3).map((item) => (
                      <div key={item.restaurant} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.restaurant}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Tidak ada kondisi darurat aktif saat ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                <SectionHeading
                  title="Status platform"
                  description="Cuplikan singkat data terkini dari live database."
                />
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-slate-600">Total alert aktif</span>
                    <span className="font-semibold text-slate-900">{alerts.filter((alert) => alert.isResolved !== true).length}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-slate-600">Total user mitra</span>
                    <span className="font-semibold text-slate-900">{restaurantUsers.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-slate-600">Sensor live online</span>
                    <span className="font-semibold text-slate-900">
                      {sensors.filter((sensor) => {
                        const live = liveSensors[sensor.id];
                        const effectiveOnline = typeof live?.isOnline === "boolean" ? live.isOnline : sensor.isOnline !== false;
                        return sensor.isActive !== false && effectiveOnline;
                      }).length}
                    </span>

                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
