"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type FilterType = "all" | "danger" | "warning" | "unresolved" | "resolved";

export default function AlertsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = ClientAlertModel.subscribeToAlerts(userId, (data) => {
      setAlerts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await ClientAlertModel.resolveAlertById(alertId);
    } catch (err) {
      console.error("Failed to resolve incident:", err);
      alert("Failed to process kitchen issue resolution.");
    } finally {
      setResolvingId(null);
    }
  };

  const countAll = alerts.length;
  const countDanger = alerts.filter((a) => a.level === "danger").length;
  const countWarning = alerts.filter((a) => a.level === "warning").length;
  const countUnresolved = alerts.filter((a) => !a.isResolved).length;
  const countResolved = alerts.filter((a) => a.isResolved).length;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === "danger") return alert.level === "danger";
    if (activeFilter === "warning") return alert.level === "warning";
    if (activeFilter === "unresolved") return !alert.isResolved;
    if (activeFilter === "resolved") return alert.isResolved;
    return true;
  });

  const formatAlertTime = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "-";
    const date = timestamp.toDate();
    const today = new Date();
    
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeString = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    if (isToday) {
      return `Today, ${dateString} - ${timeString}`;
    } else {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return `${days[date.getDay()]}, ${dateString} - ${timeString}`;
    }
  };

  return (
    <UserLayout 
      title="Alerts & Notifications" 
      description="Monitor incident logs and handle alert warnings from your kitchen sensors."
      userEmail="khoirul@email.com"
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin mx-auto" size={28} style={{ color: "var(--accent-primary)" }} />
            <p className="font-semibold text-xs tracking-wide" style={{ color: "var(--card-text-muted)" }}>Syncing log data...</p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* CATEGORY FILTER TABS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "shadow-sm ring-1"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: activeFilter === "all" ? "var(--card-bg-solid)" : "var(--card-surface)",
                borderColor: activeFilter === "all" ? "var(--accent-primary-border)" : "var(--card-surface-border)",
                color: activeFilter === "all" ? "var(--accent-primary)" : "var(--card-text-muted)",
                ...(activeFilter === "all" ? { "--tw-ring-color": "var(--accent-primary-border)" } : {}) as React.CSSProperties
              }}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">All</p>
              <p className="text-lg md:text-xl font-black mt-1" style={{ color: activeFilter === "all" ? "var(--accent-primary)" : "var(--card-title)" }}>({countAll})</p>
            </button>

            <button
              onClick={() => setActiveFilter("danger")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "danger"
                  ? "bg-red-50 dark:bg-rose-500/10 border-red-200 dark:border-rose-500/20 text-red-700 dark:text-rose-400 shadow-sm ring-1 ring-red-100 dark:ring-rose-500/30"
                  : "hover:opacity-80"
              }`}
              style={activeFilter !== "danger" ? { backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" } : {}}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Danger</p>
              <p className="text-lg md:text-xl font-black mt-1" style={activeFilter !== "danger" ? { color: "var(--card-title)" } : {}}>({countDanger})</p>
            </button>

            <button
              onClick={() => setActiveFilter("warning")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "warning"
                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-100 dark:ring-amber-500/30"
                  : "hover:opacity-80"
              }`}
              style={activeFilter !== "warning" ? { backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" } : {}}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Warning</p>
              <p className="text-lg md:text-xl font-black mt-1" style={activeFilter !== "warning" ? { color: "var(--card-title)" } : {}}>({countWarning})</p>
            </button>

            <button
              onClick={() => setActiveFilter("unresolved")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "unresolved"
                  ? "shadow-sm"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: activeFilter === "unresolved" ? "var(--card-title)" : "var(--card-surface)",
                borderColor: activeFilter === "unresolved" ? "var(--card-title)" : "var(--card-surface-border)",
                color: activeFilter === "unresolved" ? "var(--card-bg)" : "var(--card-text-muted)"
              }}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Unresolved</p>
              <p className="text-lg md:text-xl font-black mt-1" style={{ color: activeFilter === "unresolved" ? "var(--card-bg)" : "var(--card-title)" }}>({countUnresolved})</p>
            </button>

            <button
              onClick={() => setActiveFilter("resolved")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "resolved"
                  ? "shadow-sm ring-1"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: activeFilter === "resolved" ? "var(--accent-primary-hover)" : "var(--card-surface)",
                borderColor: activeFilter === "resolved" ? "var(--accent-primary-border)" : "var(--card-surface-border)",
                color: activeFilter === "resolved" ? "var(--accent-primary)" : "var(--card-text-muted)",
                ...(activeFilter === "resolved" ? { "--tw-ring-color": "var(--accent-primary-border)" } : {}) as React.CSSProperties
              }}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Resolved</p>
              <p className="text-lg md:text-xl font-black mt-1" style={{ color: activeFilter === "resolved" ? "var(--accent-primary)" : "var(--card-title)" }}>({countResolved})</p>
            </button>
          </div>

          {/* ALERTS LOG DATA TABLE CONTAINER */}
          <div className="border rounded-3xl shadow-xs overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-widest border-b" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderColor: "var(--table-border)" }}>
                    <th className="py-5 px-4 md:px-6 hidden sm:table-cell">Time</th>
                    <th className="py-5 px-4 md:px-6">Location / Sector</th>
                    <th className="py-5 px-4 md:px-6">Level</th>
                    <th className="py-5 px-4 md:px-6 hidden lg:table-cell">System Action</th>
                    <th className="py-5 px-4 md:px-6 text-center">Action / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-medium" style={{ borderColor: "var(--table-border)", color: "var(--card-text)", backgroundColor: "var(--table-body-bg)" }}>
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 size={36} className="text-emerald-400 dark:text-emerald-500 mb-2" />
                          <p className="font-bold text-base" style={{ color: "var(--card-title)" }}>No alerts found.</p>
                          <p className="text-sm" style={{ color: "var(--card-text-muted)" }}>All kitchen operational conditions are monitored as safe.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const isDanger = alert.level === "danger";
                      const isResolved = alert.isResolved;

                      return (
                        <tr key={alert.id} className="transition-colors hover:opacity-90">
                          <td className="py-5 px-4 md:px-6 font-semibold whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--card-text-muted)" }}>
                            {formatAlertTime(alert.createdAt)}
                          </td>

                          <td className="py-5 px-4 md:px-6 font-bold" style={{ color: "var(--card-title)" }}>
                            <span className="block truncate">{alert.location || alert.sensorName}</span>
                            <span className="block sm:hidden text-[11px] font-semibold mt-1" style={{ color: "var(--card-text-faint)" }}>
                              {formatAlertTime(alert.createdAt)}
                            </span>
                          </td>

                          <td className="py-5 px-4 md:px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest ${
                              isDanger 
                                ? "bg-red-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 border border-red-100 dark:border-rose-500/20" 
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
                            }`}>
                              {isDanger ? "Danger" : "Warning"}
                            </span>
                          </td>

                          <td className="py-5 px-4 md:px-6 font-medium truncate hidden lg:table-cell">
                            {isDanger 
                              ? `${alert.message} (Fan Active)` 
                              : alert.message}
                          </td>

                          <td className="py-5 px-4 md:px-6 text-center whitespace-nowrap">
                            <div className="flex justify-center items-center">
                              {isResolved ? (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 min-w-25 md:min-w-27.5 justify-center">
                                  <CheckCircle2 size={16} /> Resolved
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleResolve(alert.id)}
                                  disabled={resolvingId === alert.id}
                                  className="px-3 py-2 md:px-4 md:py-2.5 rounded-xl disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-sm active:scale-95 flex items-center gap-2 min-w-25 md:min-w-27.5 justify-center cursor-pointer border-none hover:opacity-80"
                                  style={{ backgroundColor: "var(--card-title)", color: "var(--card-bg)" }}
                                >
                                  {resolvingId === alert.id ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" /> Processing
                                    </>
                                  ) : (
                                    "Resolve"
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </UserLayout>
  );
}