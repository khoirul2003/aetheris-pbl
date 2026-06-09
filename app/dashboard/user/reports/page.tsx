/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { DailySummary } from "@/models/clientReportModel";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";
import { auth, db } from "@/lib/firebase"; // Menggunakan impor db untuk Firestore
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"; // Impor snapshot mendalam

export default function ReportsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  
  // SOLUSI: Mengunci nilai default awal ke true untuk menghindari pemanggilan setState sinkron di dalam effect
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("This week");
  const [isMounted, setIsMounted] = useState(false); // Solusi anti-hydration error

  // 1. Pengunci Kesiapan Hidrasi Client-Side
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 2. Auth Checker
  useEffect(() => {
    if (!isMounted) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [isMounted]);

  // 3. Berlangganan Data dailySummaries & Alerts Secara Real-time Snapshot
  useEffect(() => {
    if (!userId || !isMounted) return;
    const uid = userId;

    // A. Langganan Real-time dailySummaries dari hasil Reduce Hadoop
    const summariesQ = query(
      collection(db, "dailySummaries"),
      where("userId", "==", uid),
      orderBy("date", "asc"),
      limit(7) // Batasi 7 hari terakhir untuk grafik mingguan terstruktur
    );

    const unsubscribeSummaries = onSnapshot(
      summariesQ,
      (snapshot) => {
        const summaryList: DailySummary[] = [];
        snapshot.forEach((doc) => {
          summaryList.push({ id: doc.id, ...doc.data() } as DailySummary);
        });
        setSummaries(summaryList);
      },
      (error) => {
        console.error("Failed to stream daily summaries:", error);
      }
    );
    
    // B. Langganan Log Alerts Secara Real-time Snapshot
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts(uid, (data) => {
      setAlerts(data);
      setLoading(false); // Matikan loading setelah data pertama sukses mendarat
    });

    return () => {
      unsubscribeSummaries();
      if (unsubscribeAlerts) unsubscribeAlerts();
    };
  }, [userId, isMounted]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const totalAlertsSum = summaries.reduce((acc, curr) => acc + (curr.totalAlerts || 0), 0);
  const totalDangerSum = summaries.reduce((acc, curr) => acc + (curr.dangerCount || 0), 0);

  const getMostProblematicArea = () => {
    if (summaries.length === 0) return "-";
    const counts: Record<string, number> = {};
    summaries.forEach(s => {
      if (s.mostProblematicSensor) {
        counts[s.mostProblematicSensor] = (counts[s.mostProblematicSensor] || 0) + 1;
      }
    });
    
    let mostFrequent = "-";
    let maxCount = 0;
    for (const [sensor, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = sensor === "sensor_001" ? "Main Stove" : sensor === "sensor_002" ? "Right Stove" : sensor;
      }
    }
    return mostFrequent;
  };

  // Konversi data multi-sensor menjadi representasi tunggal (Maksimum PPM) yang ramah orang awam
  const chartData = summaries.map(s => {
    const rawDate = s.date ? s.date.split('-') : [];
    const nameStr = rawDate.length === 3 ? `${rawDate[2]}/${rawDate[1]}` : s.date;
    
    let maxGasValue = 0;
    if (s.avgGasPerSensor) {
      maxGasValue = Math.max(...Object.values(s.avgGasPerSensor).map(v => Number(v) || 0));
    }

    return {
      name: nameStr,
      "Gas Risk Level": maxGasValue,
    };
  });

  const formatAlertTime = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "-";
    const date = timestamp.toDate();
    const today = new Date();
    
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    const timeString = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    if (isToday) {
      return `Today, ${timeString}`;
    } else {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return `${days[date.getDay()]}, ${timeString}`;
    }
  };

  // Render Pengaman Selama Kesiapan Hidrasi Komponen
  if (!isMounted || loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center print:hidden">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
          <p className="font-semibold text-xs tracking-wide" style={{ color: "var(--card-text-muted)" }}>Compiling summary recapitulation...</p>
        </div>
      </div>
    );
  }

  return (
    <UserLayout 
      title="Reports & Analytics" 
      description="Download your kitchen sensor data summary and incident history for evaluation reports."
      userEmail={userId ? "khoirul@email.com" : ""}
    >
      <div className="w-full space-y-6" suppressHydrationWarning>
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-row justify-between items-center gap-4 print:hidden">
          <div className="flex border p-1.5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            {["This week", "This month", "3 months"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 md:px-6 md:py-2.5 text-[11px] md:text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                  activeTab === tab ? "shadow-sm" : "bg-transparent hover:opacity-80"
                }`}
                style={activeTab === tab ? { backgroundColor: "var(--card-surface)", color: "var(--card-title)" } : { color: "var(--card-text-muted)" }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] md:text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer border-none hover:opacity-80"
            style={{ backgroundColor: "var(--card-title)", color: "var(--card-bg)" }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download PDF Report</span>
            <span className="sm:hidden">Download</span>
          </button>
        </div>

        {/* KONTEN DOKUMEN YANG AKAN DI-EXPORT */}
        <div className="space-y-6 print:m-0 print:p-0">
          
          {/* Header Tambahan Khusus: Hanya Muncul di Lembar Cetak PDF Fisik */}
          <div className="hidden print:block mb-6 border-b-2 pb-4 text-center sm:text-left" style={{ borderColor: "var(--card-surface-border)" }}>
            <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--card-title)" }}>AETHERIS KITCHEN MONITORING SYSTEM</h1>
            <p className="text-xs font-bold mt-1" style={{ color: "var(--card-text-muted)" }}>Gas Summary & Kitchen Activity Log Report — Category: {activeTab}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAFIK AREA TUNGGAL INTUITIF */}
            <div className="lg:col-span-2 border rounded-3xl p-5 md:p-6 shadow-xs overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: "var(--card-text-muted)" }}>Kitchen Gas Leak Level Trend</h3>
              </div>
              <div className="h-[280px] md:h-[300px] w-full text-[10px] md:text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center font-medium" style={{ color: "var(--card-text-faint)" }}>No weekly trend data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4D6344" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4D6344" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-surface-border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--card-text-muted)', fontWeight: 'bold'}} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--card-text-muted)', fontWeight: 'bold'}} />
                      <Tooltip 
                        cursor={{ stroke: '#4D6344', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{borderRadius: '16px', border: '1px solid var(--card-surface-border)', backgroundColor: 'var(--card-bg-solid)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{ color: "var(--card-title)" }}
                        formatter={(value) => [`${value} PPM`, "Highest Gas Level"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Gas Risk Level" 
                        stroke="#4D6344" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorGas)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* KARTU METRIK AGREGASI INTELLIGENT RINGKASAN */}
            <div className="border rounded-3xl p-6 shadow-xs flex flex-col justify-between" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-6" style={{ color: "var(--card-text-faint)" }}>Statistics {activeTab}</h3>
                <div className="space-y-3">
                  <StatItem label="Total alarm detections" value={`${totalAlertsSum} Times`} />
                  <StatItem label="Critical level incidents" value={`${totalDangerSum} Times`} isDanger={totalDangerSum > 0} />
                  <StatItem label="Most frequent trigger sector" value={getMostProblematicArea()} />
                  <StatItem label="Average area temperature" value={summaries.length > 0 ? `${Math.round(summaries.reduce((a,c) => a + (c.avgTemperature || 0), 0) / summaries.length)}°C` : "-"} />
                  <StatItem label="Auto-handling status" value="100% Integrated" />
                </div>
              </div>
              <div className="text-[10px] font-bold mt-6 pt-4 border-t uppercase tracking-widest text-center lg:text-left" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text-faint)" }}>
                * Periodic system synchronization
              </div>
            </div>
          </div>

          {/* RIWAYAT DETEKSI TERKINI */}
          <div className="border rounded-3xl shadow-xs overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "var(--card-surface-border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
                <FileText size={16} />
              </div>
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: "var(--card-text-muted)" }}>Recent Detection History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest border-b" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-faint)", borderColor: "var(--card-surface-border)" }}>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6">Sector / Location</th>
                    <th className="py-4 px-6">Level</th>
                    <th className="py-4 px-6 hidden sm:table-cell">Hardware Action</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-medium" style={{ borderColor: "var(--table-border)", backgroundColor: "var(--table-body-bg)", color: "var(--card-text)" }}>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center font-medium" style={{ color: "var(--card-text-faint)" }}>
                        No activity log data recorded yet.
                      </td>
                    </tr>
                  ) : (
                    alerts.slice(0, 15).map((alert) => {
                      const isDanger = alert.level === "danger";
                      return (
                        <tr key={alert.id} className="transition-colors hover:opacity-90">
                          <td className="py-4 px-6 whitespace-nowrap" style={{ color: "var(--card-text-muted)" }}>
                            {formatAlertTime(alert.createdAt)}
                          </td>
                          <td className="py-4 px-6 font-bold" style={{ color: "var(--card-title)" }}>
                            {alert.location || alert.sensorName}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                              isDanger ? 'bg-red-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 border border-red-100 dark:border-rose-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'
                            }`}>
                              {isDanger ? 'Danger' : 'Warning'}
                            </span>
                          </td>
                          <td className="py-4 px-6 hidden sm:table-cell max-w-[180px] truncate" style={{ color: "var(--card-text)" }}>
                            {isDanger ? 'Exhaust Fan + WhatsApp' : 'WhatsApp Notification'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg font-black uppercase text-[9px] tracking-widest border ${
                              alert.isResolved 
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                                : 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                            }`}>
                              {alert.isResolved ? 'Resolved' : 'Needs attention'}
                            </span>
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
      </div>
    </UserLayout>
  );
}

function StatItem({ label, value, isDanger = false }: { label: string; value: string; isDanger?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: "var(--card-surface-border)" }}>
      <span className="text-[11px] md:text-xs font-semibold" style={{ color: "var(--card-text-muted)" }}>{label}</span>
      <span className={`text-[11px] md:text-xs font-black tracking-wide ${isDanger ? "text-red-600 dark:text-rose-400 animate-pulse" : ""}`} style={isDanger ? {} : { color: "var(--card-title)" }}>{value}</span>
    </div>
  );
}