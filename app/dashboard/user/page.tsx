"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout"; // Menggunakan layout User yang baru
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import {
  ClientSensorModel,
  FirestoreSensor,
  LiveSensorData,
} from "@/models/clientSensorModel";
import {
  AlertTriangle,
  Loader2,
  Check,
  BellRing,
  AlertCircle,
  LayoutDashboard,
  Cpu,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AlertLog {
  id: string;
  message: string;
  level: string;
  isResolved: boolean;
  timeStr: string;
}

const LINE_COLORS = [
  "#4A6741",
  "#C67023",
  "#2E5A88",
  "#A04040",
  "#6D4C41",
  "#7B1FA2",
];

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [dynamicSensors, setDynamicSensors] = useState<FirestoreSensor[]>([]);
  const [liveSensors, setLiveSensors] = useState<{
    [key: string]: LiveSensorData;
  }>({});
  const [latestAlerts, setLatestAlerts] = useState<AlertLog[]>([]);
  const [chartHistory, setChartHistory] = useState<
    Record<string, string | number>[]
  >([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    unresolved: 0,
    lastCheck: "-",
  });

  // 1. Auth Checker
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Connect All Components to Database 100% Dynamically
  useEffect(() => {
    if (loadingAuth || !user) return;

    const currentUserId = user.uid;
    let unsubscribeSummary: (() => void) | undefined;

    const sensorsQ = query(
      collection(db, "sensors"),
      where("userId", "==", currentUserId),
    );
    const unsubscribeSensors = onSnapshot(
      sensorsQ,
      (snapshot) => {
        const sensorList: FirestoreSensor[] = [];
        snapshot.forEach((doc) => {
          sensorList.push({ id: doc.id, ...doc.data() } as FirestoreSensor);
        });

        setDynamicSensors(sensorList);
        setLoadingData(false);

        if (unsubscribeSummary) unsubscribeSummary();

        const summaryQ = query(
          collection(db, "dailySummaries"),
          where("userId", "==", currentUserId),
          orderBy("date", "asc"),
          limit(7),
        );

        unsubscribeSummary = onSnapshot(summaryQ, (summarySnapshot) => {
          const history: Record<string, string | number>[] = [];

          summarySnapshot.forEach((doc) => {
            const data = doc.data();
            const rawDate = data.date ? data.date.split("-") : [];
            const formattedDate =
              rawDate.length === 3 ? `${rawDate[1]}/${rawDate[2]}` : data.date; // Changed to MM/DD format

            const chartRow: Record<string, string | number> = {
              time: formattedDate,
            };

            sensorList.forEach((sensor) => {
              chartRow[sensor.name] = data.avgGasPerSensor?.[sensor.id] || 0;
            });

            history.push(chartRow);
          });

          if (history.length > 0) {
            setChartHistory(history);
          }
        });
      },
      (error) => {
        console.error("Failed to load sensors in real-time:", error);
        setLoadingData(false);
      },
    );

    const alertsQ = query(
      collection(db, "alerts"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc"),
      limit(5),
    );
    const unsubscribeAlerts = onSnapshot(alertsQ, (snapshot) => {
      const logs: AlertLog[] = [];
      let unresolvedCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isResolved) unresolvedCount++;

        const timestamp = data.createdAt?.toDate();
        const timeStr = timestamp
          ? timestamp.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-";

        logs.push({
          id: doc.id,
          message: data.message || "Anomaly detected",
          level: data.level || "warning",
          isResolved: !!data.isResolved,
          timeStr,
        });
      });

      setLatestAlerts(logs);
      setStats((prev) => ({
        ...prev,
        unresolved: unresolvedCount,
        totalToday: snapshot.size,
      }));
    });

    return () => {
      unsubscribeSensors();
      unsubscribeAlerts();
      if (unsubscribeSummary) unsubscribeSummary();
    };
  }, [user, loadingAuth]);

  // 3. Fetch Realtime Live Sensor Status
  useEffect(() => {
    if (dynamicSensors.length === 0) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const unsubscribers = dynamicSensors.map((sensor) => {
      return ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
        setLiveSensors((prev: Record<string, LiveSensorData>) => ({
          ...prev,
          [sensor.id]: data,
        }));

        setStats((prev: typeof stats) => ({
          ...prev,
          lastCheck: timeString,
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [dynamicSensors]);

  const getOverallStatus = () => {
    if (dynamicSensors.length === 0) return "Safe";
    const statuses = dynamicSensors.map(
      (sensor) => liveSensors[sensor.id]?.status || "safe",
    );
    if (statuses.includes("danger")) return "Danger";
    if (statuses.includes("warning")) return "Warning";
    return "Safe";
  };

  const overallStatus = getOverallStatus();
  const connectedCount = dynamicSensors.filter(
    (sensor) => liveSensors[sensor.id]?.isOnline,
  ).length;

  if (loadingAuth || loadingData) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center space-y-2">
          <Loader2
            className="animate-spin text-emerald-600 dark:text-emerald-400 mx-auto"
            size={32}
          />
          <p className="font-medium text-sm" style={{ color: "var(--card-text)" }}>
            Connecting to Dynamic Database...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-8">Access Denied. Please Login.</div>;

  return (
    <UserLayout
      title="Overview"
      description="Overview of your restaurant's telemetry"
      userEmail={user.email}
    >
      <div className="w-full box-border pb-8">
        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <button className="rounded-xl flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-2.5 text-xs md:text-sm font-bold border border-rose-200 dark:border-rose-500/30 shadow-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer">
            <AlertTriangle size={16} />
            Emergency Shutdown
          </button>
          <button className="p-2.5 rounded-xl shadow-sm hover:opacity-80 cursor-pointer" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
            <BellRing size={18} />
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {overallStatus !== "Safe" && (
          <div
            className={`border p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm ${
              overallStatus === "Danger"
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 animate-pulse"
                : "bg-[#FDF0E1] dark:bg-amber-500/10 border-[#F3D5B5] dark:border-amber-500/30"
            }`}
          >
            <AlertCircle
              className={
                overallStatus === "Danger" ? "text-red-500" : "text-[#C67023]"
              }
              size={20}
            />
            <div>
              <p
                className={`text-xs font-semibold leading-relaxed ${overallStatus === "Danger" ? "text-red-900 dark:text-red-300" : "text-amber-950 dark:text-amber-300"}`}
              >
                <span className="font-black uppercase tracking-wider">
                  Security Warning!
                </span>{" "}
                Gas volume increase detected. Please check your kitchen area
                immediately.
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="p-4 md:p-5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--card-text-muted)" }}>
              Kitchen Condition
            </p>
            <h2
              className={`text-base md:text-xl font-black mb-0.5 ${overallStatus === "Warning" ? "text-[#C67023]" : overallStatus === "Danger" ? "text-red-600 dark:text-red-400" : "text-[#4A6741] dark:text-[#8fac7e]"}`}
            >
              {overallStatus}
            </h2>
            <p className="text-[10px] md:text-xs font-medium truncate" style={{ color: "var(--card-text-muted)" }}>
              {stats.unresolved > 0
                ? `${stats.unresolved} danger zones`
                : "Cooking zones are safe"}
            </p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--card-text-muted)" }}>
              Active Sensors
            </p>
            <h2 className="text-base md:text-xl font-black mb-0.5" style={{ color: "var(--card-title)" }}>
              {connectedCount}{" "}
              <span className="text-[10px] md:text-xs font-bold" style={{ color: "var(--card-text-muted)" }}>
                / {dynamicSensors.length} Nodes
              </span>
            </h2>
            <p className="text-[10px] md:text-xs font-medium" style={{ color: "var(--card-text-muted)" }}>
              Automatically Detected
            </p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--card-text-muted)" }}>
              Alerts Today
            </p>
            <h2 className="text-base md:text-xl font-black mb-0.5" style={{ color: "var(--card-title)" }}>
              {stats.totalToday}{" "}
              <span className="text-[10px] md:text-xs font-bold" style={{ color: "var(--card-text-muted)" }}>
                Times
              </span>
            </h2>
            <p className="text-[10px] md:text-xs font-medium truncate" style={{ color: "var(--card-text-muted)" }}>
              {stats.unresolved} Needs attention
            </p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--card-text-muted)" }}>
              Last Checked
            </p>
            <h2 className="text-base md:text-xl font-black mb-0.5" style={{ color: "var(--card-title)" }}>
              {stats.lastCheck}
            </h2>
            <p className="text-[10px] md:text-xs font-medium" style={{ color: "var(--card-text-muted)" }}>
              Real-time Sync
            </p>
          </div>
        </div>

        {/* MIDDLE LAYOUT SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ALL AREAS STATUS TABLE */}
          <div className="p-4 md:p-6 rounded-2xl shadow-sm flex flex-col h-full" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <h3 className="text-xs font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: "var(--card-text-muted)" }}>
              <LayoutDashboard size={14} /> All Areas
              Status
            </h3>
            <div className="space-y-0 flex-grow divide-y" style={{ borderColor: "var(--card-surface-border)" }}>
              {dynamicSensors.length === 0 ? (
                <p className="text-xs py-6 text-center font-medium" style={{ color: "var(--card-text-muted)" }}>
                  No sensors found.
                </p>
              ) : (
                dynamicSensors.map((sensor) => {
                  const live = liveSensors[sensor.id];
                  const isWarning =
                    live?.status === "warning" || live?.status === "danger";

                  return (
                    <div
                      key={sensor.id}
                      className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-2"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isWarning
                              ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                              : "bg-[#E9F2E4] dark:bg-[#4A6741]/15 text-[#4A6741] dark:text-[#8fac7e]"
                          }`}
                        >
                          {isWarning ? (
                            <AlertTriangle size={16} />
                          ) : (
                            <Check size={16} strokeWidth={3} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate" style={{ color: "var(--card-title)" }}>
                            {sensor.name}
                          </p>
                          <p className="text-[11px] md:text-xs font-medium truncate" style={{ color: "var(--card-text-muted)" }}>
                            {sensor.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            live?.status === "danger"
                              ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                              : live?.status === "warning"
                                ? "bg-[#FDF0E1] dark:bg-amber-500/10 text-[#A05E1A] dark:text-amber-400"
                                : "bg-[#E9F2E4] dark:bg-[#4A6741]/15 text-[#4A6741] dark:text-[#8fac7e]"
                          }`}
                        >
                          {live
                            ? live.status === "safe"
                              ? "Safe"
                              : live.status === "warning"
                                ? "Warning"
                                : "Danger"
                            : "Offline"}
                        </span>
                        <p className="font-mono text-[11px] md:text-xs font-bold mt-1" style={{ color: "var(--card-text)" }}>
                          {live ? `${live.gas} PPM` : "-"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KITCHEN ZONE MAP MATRIX */}
          <div className="p-4 md:p-6 rounded-2xl shadow-sm flex flex-col h-full" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <h3 className="text-xs font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: "var(--card-text-muted)" }}>
              <Cpu size={14} /> Kitchen Zone Map
            </h3>
            <div className="p-3 md:p-4 rounded-xl grid grid-cols-2 gap-3 md:gap-4 flex-grow items-center" style={{ backgroundColor: "var(--card-surface)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
              {dynamicSensors.map((sensor) => {
                const live = liveSensors[sensor.id];
                const isWarning =
                  live?.status === "warning" || live?.status === "danger";

                return (
                  <div
                    key={sensor.id}
                    className={`p-3 md:p-4 rounded-xl border flex flex-col justify-between h-24 shadow-sm ${
                      isWarning
                        ? "border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5"
                        : ""
                    }`}
                    style={isWarning ? undefined : { backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}
                  >
                    <p className="font-bold text-[11px] md:text-xs line-clamp-2 leading-tight" style={{ color: "var(--card-title)" }}>
                      {sensor.name}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-2">
                      <span className="text-[11px] md:text-xs font-bold font-mono shrink-0" style={{ color: "var(--card-text)" }}>
                        {live ? `${live.temperature}°C` : "-"}
                      </span>
                      <div className="flex items-center gap-1 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            live?.status === "danger"
                              ? "bg-red-500 animate-ping"
                              : live?.status === "warning"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--card-text-muted)" }}>
                          {live
                            ? live.status === "safe"
                              ? "Safe"
                              : live.status === "warning"
                                ? "Warning"
                                : "Danger"
                            : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHARTS & REALTIME LOGS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* WEEKLY CHART TREND */}
          <div className="p-4 md:p-6 rounded-2xl shadow-sm flex flex-col w-full h-full overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <h3 className="text-xs font-black tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: "var(--card-text-muted)" }}>
              <TrendingUp size={14} /> Weekly Average
              Gas Trend
            </h3>
            <div className="h-[260px] w-full text-[10px] md:text-[11px] flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartHistory}
                  margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-axis)"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--card-text-faint)", fontWeight: "bold" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--card-text-faint)", fontWeight: "bold" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      backgroundColor: "var(--card-bg-solid)",
                      color: "var(--card-text)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      paddingTop: "10px",
                      color: "var(--card-text-muted)",
                    }}
                  />
                  {dynamicSensors.map((sensor, index) => (
                    <Line
                      key={sensor.id}
                      name={sensor.name}
                      type="monotone"
                      dataKey={sensor.name}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ALERTS ACTIVITY LOG HISTORY */}
          <div className="p-4 md:p-6 rounded-2xl shadow-sm flex flex-col h-full" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
            <h3 className="text-xs font-black tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: "var(--card-text-muted)" }}>
              <BellRing size={14} /> Alert Activity
              Log History
            </h3>
            <div className="space-y-3 overflow-y-auto pr-1 flex-grow custom-scrollbar max-h-[260px]">
              {latestAlerts.length === 0 ? (
                <div className="text-center py-20 text-xs font-medium" style={{ color: "var(--card-text-muted)" }}>
                  Kitchen condition is sterile. No history of danger.
                </div>
              ) : (
                latestAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex gap-3 py-2.5 last:border-0 items-start"
                    style={{ borderBottom: "1px solid var(--card-surface-border)" }}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        alert.level === "danger"
                          ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                          : "bg-[#FDF0E1] dark:bg-amber-500/10 text-[#C67023] dark:text-amber-400"
                      }`}
                    >
                      <AlertTriangle size={14} />
                    </div>
                    <div className="w-full min-w-0">
                      <p className="text-xs font-bold leading-tight mb-1 line-clamp-2" style={{ color: "var(--card-title)" }}>
                        {alert.message}
                      </p>
                      <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold" style={{ color: "var(--card-text-muted)" }}>
                        <span>{alert.timeStr}</span>
                        <span
                          className={
                            alert.isResolved
                              ? "text-[#4A6741] dark:text-[#8fac7e]"
                              : "text-[#A05E1A] dark:text-amber-400"
                          }
                        >
                          {alert.isResolved
                            ? "✓ Resolved"
                            : "• Needs Attention"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}