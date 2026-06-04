"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientReportModel, DailySummary } from "@/models/clientReportModel";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Minggu ini");

  useEffect(() => {
    let isMounted = true;
    let unsubscribeAlerts: (() => void) | undefined;

    async function fetchReportData() {
      try {
        // 1. Ambil Rangkuman Harian dari Firestore
        const summaryData = await ClientReportModel.getWeeklySummaries(userId);
        if (!isMounted) return;
        setSummaries(summaryData);
        
        // 2. Langganan Log Alerts Secara Real-time Snapshot
        unsubscribeAlerts = ClientAlertModel.subscribeToAlerts(userId, (data) => {
          if (isMounted) {
            setAlerts(data);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Gagal memuat data laporan:", error);
        if (isMounted) setLoading(false);
      }
    }

    fetchReportData();

    return () => {
      isMounted = false;
      if (unsubscribeAlerts) unsubscribeAlerts();
    };
  }, [userId]);

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
        mostFrequent = sensor === "sensor_001" ? "Kompor Utama" : sensor === "sensor_002" ? "Kompor Kanan" : sensor;
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
      return `${days[date.getDay()]}, ${timeString}`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={28} />
          <p className="text-slate-600 font-medium text-xs">Mengompilasi ringkasan rekapitulasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased overflow-x-hidden">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      

      <main className="md:ml-64 print:ml-0 pt-24 print:pt-4 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-6xl mx-auto box-border">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-row justify-between items-center gap-4 mb-6 print:hidden">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {["Minggu ini", "Bulan ini", "3 bulan"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 md:px-6 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all cursor-pointer border-none ${
                  activeTab === tab ? "bg-[#F6F5F2] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600 bg-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] md:text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer border-none"
          >
            <Download size={14} />
            <span>Unduh PDF</span>
          </button>
        </div>

        {/* CONTAINER UTAMA DOKUMEN CETAK */}
        <div className="space-y-6">
          
          <div className="hidden print:block mb-6 border-b-2 border-slate-300 pb-4 text-center sm:text-left">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AETHERIS KITCHEN MONITORING SYSTEM</h1>
            <p className="text-xs text-slate-500 font-bold mt-1">Laporan Rekapitulasi Gas & Log Aktivitas Dapur — Kategori: {activeTab}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAFIK AREA TUNGGAL INTUITIF */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={16} className="text-[#4A6741]" />
                <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-slate-400">Tren Tingkat Kebocoran Gas Dapur</h3>
              </div>
              <div className="h-[280px] md:h-[300px] w-full text-[10px] md:text-xs">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Tidak ada data tren mingguan.</div>
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
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}}
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

            {/* KARTU METRIK AGREGASI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Statistik {activeTab}</h3>
                <div className="space-y-2">
                  <StatItem label="Total deteksi alarm" value={`${totalAlertsSum} Kali`} />
                  <StatItem label="Insiden level kritis" value={`${totalDangerSum} Kali`} isDanger={totalDangerSum > 0} />
                  <StatItem label="Sektor tersering pemicu" value={getMostProblematicArea()} />
                  <StatItem label="Suhu rata-rata area" value={summaries.length > 0 ? `${Math.round(summaries.reduce((a,c) => a + (c.avgTemperature || 0), 0) / summaries.length)}°C` : "-"} />
                  <StatItem label="Status penanganan otomatis" value="100% Terintegrasi" />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-50 uppercase tracking-wider text-center lg:text-left">
                * Sinkronisasi berkala sistem Firebase
              </div>
            </div>
          </div>

          {/* RIWAYAT DETEKSI TERKINI */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText size={15} className="text-slate-400" />
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-slate-400">Riwayat Deteksi Terkini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-4 md:px-6">Waktu</th>
                    <th className="py-4 px-4 md:px-6">Sektor / Lokasi</th>
                    <th className="py-4 px-4 md:px-6">Tingkat</th>
                    <th className="py-4 px-4 md:px-6 hidden sm:table-cell">Aksi Hardware</th>
                    <th className="py-4 px-4 md:px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        Belum ada data log aktivitas terekam.
                      </td>
                    </tr>
                  ) : (
                    alerts.slice(0, 15).map((alert) => {
                      const isDanger = alert.level === "danger";
                      return (
                        <tr key={alert.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-4 md:px-6 font-medium text-slate-500 whitespace-nowrap">
                            {formatAlertTime(alert.createdAt)}
                          </td>
                          <td className="py-4 px-4 md:px-6 font-bold text-slate-900">
                            {alert.location || alert.sensorName}
                          </td>
                          <td className="py-4 px-4 md:px-6">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                              isDanger ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {isDanger ? 'Bahaya' : 'Waspada'}
                            </span>
                          </td>
                          <td className="py-4 px-4 md:px-6 text-slate-600 font-medium hidden sm:table-cell max-w-[180px] truncate">
                            {isDanger ? 'Exhaust Fan + WhatsApp' : 'Notifikasi WhatsApp'}
                          </td>
                          <td className="py-4 px-4 md:px-6 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-black uppercase text-[9px] border ${
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
      </main>
    </div>
  );
}

function StatItem({ label, value, isDanger = false }: { label: string; value: string; isDanger?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-black ${isDanger ? "text-red-600 animate-pulse" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}