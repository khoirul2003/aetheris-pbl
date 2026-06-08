/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  // Ganti fungsi formatAlertTime lamamu dengan definisi tipe data aman ini:
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
      return `${days[date.getDay()]}, ${timeString}`;
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center print:hidden">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
          <p className="text-[#5B636B] font-semibold text-xs tracking-wide">Mengompilasi ringkasan rekapitulasi Hadoop...</p>
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
          <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            {["Minggu ini", "Bulan ini", "3 bulan"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 md:px-6 md:py-2.5 text-[11px] md:text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
                  activeTab === tab ? "bg-[#F6F5F2] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600 bg-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-[11px] md:text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Unduh Laporan PDF</span>
            <span className="sm:hidden">Unduh</span>
          </button>
        </div>

        {/* KONTEN DOKUMEN YANG AKAN DI-EXPORT */}
        <div className="space-y-6 print:m-0 print:p-0">
          
          {/* Header Tambahan Fisik PDF */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-300 pb-4 text-center sm:text-left">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AETHERIS KITCHEN MONITORING SYSTEM</h1>
            <p className="text-xs text-slate-500 font-bold mt-1">Laporan Rekapitulasi Gas & Log Aktivitas Dapur — Kategori: {activeTab}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAFIK AREA TUNGGAL INTUITIF */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#EAF2EB] text-[#4D6344] flex items-center justify-center shrink-0">
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-slate-500">Tren Tingkat Kebocoran Gas Dapur</h3>
              </div>
              <div className="h-[280px] md:h-[300px] w-full text-[10px] md:text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">Tidak ada data tren komputasi Big Data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4A6741" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4A6741" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontWeight: 'bold'}} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontWeight: 'bold'}} />
                      <Tooltip 
                        cursor={{ stroke: '#4A6741', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value) => [`${value} PPM`, "Kadar Gas Tertinggi"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Tingkat Risiko Gas" 
                        stroke="#4A6741" 
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
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Statistik {activeTab}</h3>
                <div className="space-y-3">
                  <StatItem label="Total deteksi alarm" value={`${totalAlertsSum} Kali`} />
                  <StatItem label="Insiden level kritis" value={`${totalDangerSum} Kali`} isDanger={totalDangerSum > 0} />
                  <StatItem label="Sektor tersering pemicu" value={getMostProblematicArea()} />
                  <StatItem label="Suhu rata-rata area" value={summaries.length > 0 ? `${Math.round(summaries.reduce((a,c) => a + (c.avgTemperature || 0), 0) / summaries.length)}°C` : "-"} />
                  <StatItem label="Status penanganan otomatis" value="100% Terintegrasi" />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-6 pt-4 border-t border-slate-200/60 uppercase tracking-widest text-center lg:text-left">
                * Diolah otomatis oleh Kluster Hadoop
              </div>
            </div>
          </div>

          {/* TABLE LOGS */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-slate-500">Riwayat Deteksi Terkini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                    <th className="py-4 px-6">Waktu</th>
                    <th className="py-4 px-6">Sektor / Lokasi</th>
                    <th className="py-4 px-6">Tingkat</th>
                    <th className="py-4 px-6 hidden sm:table-cell">Aksi Hardware</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {alerts.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-medium">
                      Belum ada data log aktivitas terekam.
                    </div>
                  ) : (
                    alerts.slice(0, 15).map((alert) => {
                      const isDanger = alert.level === "danger";
                      return (
                        <tr key={alert.id} className="hover:bg-white transition-colors">
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                            {formatAlertTime(alert.createdAt)}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {alert.location || alert.sensorName}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                              isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#FDF0E1] text-[#A05E1A] border border-[#F3D5B5]'
                            }`}>
                              {isDanger ? 'Bahaya' : 'Waspada'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 hidden sm:table-cell max-w-[180px] truncate">
                            {isDanger ? 'Exhaust Fan + WhatsApp' : 'Notifikasi WhatsApp'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-3 py-1 rounded-lg font-black uppercase text-[9px] tracking-widest border ${
                              alert.isResolved 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-orange-50 text-orange-700 border-orange-100'
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
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100/50 last:border-0">
      <span className="text-[11px] md:text-xs text-slate-500 font-semibold">{label}</span>
      <span className={`text-[11px] md:text-xs font-black tracking-wide ${isDanger ? "text-red-600 animate-pulse" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}