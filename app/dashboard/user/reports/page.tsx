"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
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
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";

interface DailySummaryData {
  id: string;
  date: string;
  avgTemperature: number;
  totalAlerts: number;
  dangerCount: number;
  warningCount: number;
  avgGasPerSensor?: Record<string, number>;
}

interface AlertData {
  id: string;
  location?: string;
  sensorName?: string;
  level: string;
  isResolved: boolean;
  createdAt: any;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [summaries, setSummaries] = useState<DailySummaryData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [activeTab, setActiveTab] = useState("Minggu ini");

  // 1. Pemeriksa Autentikasi Pengguna
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Hubungkan Data Ringkasan Hadoop & Log Alerts Secara Real-time
  useEffect(() => {
    if (loadingAuth || !user) return;

    const currentUserId = user.uid;

    // Kueri Ringkasan Harian Global Hasil Olahan Hadoop (Maksimal 7 Hari Terakhir)
    const summaryQ = query(
      collection(db, "dailySummaries"),
      orderBy("date", "desc"),
      limit(7)
    );

    const unsubscribeSummaries = onSnapshot(summaryQ, (snapshot) => {
      const summaryList: DailySummaryData[] = [];
      snapshot.forEach((doc) => {
        summaryList.push({ id: doc.id, ...doc.data() } as DailySummaryData);
      });

      // Urutkan kronologis dari tanggal lampau ke terbaru agar alur grafik mengalir dari kiri ke kanan
      const sortedSummaries = summaryList.sort((a, b) => 
        String(a.date).localeCompare(String(b.date))
      );
      
      setSummaries(sortedSummaries);
      setLoadingData(false);
    }, (error) => {
      console.error("Gagal memuat dailySummaries:", error);
      setLoadingData(false);
    });

    // Kueri Log Alerts Khusus Milik Restoran User Terkait
    const alertsQ = query(
      collection(db, "alerts"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribeAlerts = onSnapshot(alertsQ, (snapshot) => {
      const alertList: AlertData[] = [];
      snapshot.forEach((doc) => {
        alertList.push({ id: doc.id, ...doc.data() } as AlertData);
      });
      setAlerts(alertList);
    }, (error) => {
      console.error("Gagal memuat log alerts real-time:", error);
    });

    return () => {
      unsubscribeSummaries();
      unsubscribeAlerts();
    };
  }, [user, loadingAuth]);

  const handleDownloadPDF = () => {
    window.print();
  };

  // Perhitungan Akumulasi Metrik Agregasi Cerdas
  const totalAlertsSum = summaries.reduce((acc, curr) => acc + (curr.totalAlerts || 0), 0);
  const totalDangerSum = summaries.reduce((acc, curr) => acc + (curr.dangerCount || 0), 0);

  const getMostProblematicArea = () => {
    if (summaries.length === 0) return "-";
    const counts: Record<string, number> = {};
    
    // Melacak sensor mana yang memiliki rata-rata PPM gas tertinggi di setiap harinya
    summaries.forEach(s => {
      if (s.avgGasPerSensor && Object.keys(s.avgGasPerSensor).length > 0) {
        const topSensor = Object.keys(s.avgGasPerSensor).reduce((a, b) => 
          (s.avgGasPerSensor?.[a] || 0) > (s.avgGasPerSensor?.[b] || 0) ? a : b
        );
        counts[topSensor] = (counts[topSensor] || 0) + 1;
      }
    });
    
    let mostFrequent = "-";
    let maxCount = 0;
    for (const [sensor, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = sensor === "sensor_001" ? "Kompor Utama" : sensor === "sensor_002" ? "Kompor Kanan" : sensor;
      }
    }
    return mostFrequent;
  };

  // Transformasi data koordinat grafik: Mencari nilai PPM tertinggi hari itu dari suplai Hadoop
  const chartData = summaries.map(s => {
    const rawDate = s.date ? s.date.split('-') : [];
    const nameStr = rawDate.length === 3 ? `${rawDate[2]}/${rawDate[1]}` : s.date;
    
    let maxGasValue = 0;
    if (s.avgGasPerSensor) {
      maxGasValue = Math.max(...Object.values(s.avgGasPerSensor).map(v => Number(v) || 0));
    }

    return {
      name: nameStr,
      "Tingkat Risiko Gas": maxGasValue,
    };
  });

  const formatAlertTime = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "-";
    const date = timestamp.toDate();
    const today = new Date();
    
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    const timeString = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
    
    if (isToday) {
      return `Hari ini, ${timeString}`;
    } else {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return `${days[date.getDay()]} , ${timeString}`;
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center print:hidden">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin mx-auto" size={28} style={{ color: "var(--accent-primary)" }} />
          <p className="font-semibold text-xs tracking-wide" style={{ color: "var(--card-text-muted)" }}>Mengompilasi ringkasan rekapitulasi Hadoop...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-8">Akses Ditolak. Silakan Login Terlebih Dahulu.</div>;

  return (
    <UserLayout 
      title="Laporan & Analitik" 
      description="Unduh rekapitulasi data sensor dan riwayat insiden dapur Anda untuk laporan evaluasi."
      userEmail={user.email || "user@email.com"}
    >
      <div className="w-full space-y-6">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-row justify-between items-center gap-4 print:hidden">
          <div className="flex border p-1.5 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            {["Minggu ini", "Bulan ini", "3 bulan"].map((tab) => (
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
            <span className="hidden sm:inline">Unduh Laporan PDF</span>
            <span className="sm:hidden">Unduh</span>
          </button>
        </div>

        {/* KONTEN DOKUMEN YANG AKAN DI-EXPORT */}
        <div className="space-y-6 print:m-0 print:p-0">
          
          {/* Header Tambahan Khusus: Hanya Muncul di Lembar Cetak PDF Fisik */}
          <div className="hidden print:block mb-6 border-b-2 pb-4 text-center sm:text-left" style={{ borderColor: "var(--card-surface-border)" }}>
            <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--card-title)" }}>AETHERIS KITCHEN MONITORING SYSTEM</h1>
            <p className="text-xs font-bold mt-1" style={{ color: "var(--card-text-muted)" }}>Laporan Rekapitulasi Gas & Log Aktivitas Dapur — Kategori: {activeTab}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAFIK AREA TUNGGAL INTUITIF */}
            <div className="lg:col-span-2 border rounded-3xl p-5 md:p-6 shadow-xs overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: "var(--card-text-muted)" }}>Tren Tingkat Kebocoran Gas Dapur</h3>
              </div>
              <div className="h-[280px] md:h-[300px] w-full text-[10px] md:text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center font-medium" style={{ color: "var(--card-text-faint)" }}>Tidak ada data tren komputasi Big Data.</div>
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
                        formatter={(value) => [`${value} PPM`, "Kadar Gas Tertinggi"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Tingkat Risiko Gas" 
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
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-6" style={{ color: "var(--card-text-faint)" }}>Statistik {activeTab}</h3>
                <div className="space-y-3">
                  <StatItem label="Total deteksi alarm" value={`${totalAlertsSum} Kali`} />
                  <StatItem label="Insiden level kritis" value={`${totalDangerSum} Kali`} isDanger={totalDangerSum > 0} />
                  <StatItem label="Sektor tersering pemicu" value={getMostProblematicArea()} />
                  <StatItem label="Suhu rata-rata area" value={summaries.length > 0 ? `${Math.round(summaries.reduce((a,c) => a + (c.avgTemperature || 0), 0) / summaries.length)}°C` : "-"} />
                  <StatItem label="Status penanganan otomatis" value="100% Terintegrasi" />
                </div>
              </div>
              <div className="text-[10px] font-bold mt-6 pt-4 border-t uppercase tracking-widest text-center lg:text-left" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text-faint)" }}>
                * Diolah otomatis oleh Kluster Hadoop
              </div>
            </div>
          </div>

          {/* RIWAYAT DETEKSI TERKINI (Tabel Log Utama) */}
          <div className="border rounded-3xl shadow-xs overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "var(--card-surface-border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
                <FileText size={16} />
              </div>
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: "var(--card-text-muted)" }}>Riwayat Deteksi Terkini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest border-b" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-faint)", borderColor: "var(--card-surface-border)" }}>
                    <th className="py-4 px-6">Waktu</th>
                    <th className="py-4 px-6">Sektor / Lokasi</th>
                    <th className="py-4 px-6">Tingkat</th>
                    <th className="py-4 px-6 hidden sm:table-cell">Aksi Hardware</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-medium" style={{ borderColor: "var(--table-border)", backgroundColor: "var(--table-body-bg)", color: "var(--card-text)" }}>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center font-medium" style={{ color: "var(--card-text-faint)" }}>
                        Belum ada data log aktivitas terekam.
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
                              {isDanger ? 'Bahaya' : 'Waspada'}
                            </span>
                          </td>
                          <td className="py-4 px-6 hidden sm:table-cell max-w-[180px] truncate" style={{ color: "var(--card-text)" }}>
                            {isDanger ? 'Exhaust Fan + WhatsApp' : 'Notifikasi WhatsApp'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg font-black uppercase text-[9px] tracking-widest border ${
                              alert.isResolved 
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                                : 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                            }`}>
                              {alert.isResolved ? 'Selesai' : 'Perlu perhatian'}
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