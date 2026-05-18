"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientReportModel, DailySummary } from "@/models/clientReportModel";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Minggu ini");

  useEffect(() => {
    async function fetchReportData() {
      try {
        const summaryData = await ClientReportModel.getWeeklySummaries(userId);
        setSummaries(summaryData);
        
        // Ambil data alert untuk tabel riwayat (limit 5 untuk laporan)
        const unsub = ClientAlertModel.subscribeToAlerts(userId, (data) => {
          setAlerts(data.slice(0, 7));
          setLoading(false);
        });
        return () => unsub();
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    fetchReportData();
  }, [userId]);

  // Data dummy untuk grafik jika database summary masih kosong
  const chartData = summaries.length > 0 ? summaries.map(s => ({
    name: s.date.split('-').slice(2).join('/'), // ambil tgl/bln
    "Kompor utama": s.avgGasPerSensor?.["sensor_001"] || Math.floor(Math.random() * 200),
    "Kompor kanan": s.avgGasPerSensor?.["sensor_002"] || Math.floor(Math.random() * 300),
  })) : [
    { name: 'Sen', "Kompor utama": 120, "Kompor kanan": 210 },
    { name: 'Sel', "Kompor utama": 150, "Kompor kanan": 280 },
    { name: 'Rab', "Kompor utama": 180, "Kompor kanan": 190 },
    { name: 'Kam', "Kompor utama": 110, "Kompor kanan": 320 },
    { name: 'Jum', "Kompor utama": 200, "Kompor kanan": 250 },
    { name: 'Sab', "Kompor utama": 240, "Kompor kanan": 180 },
    { name: 'Min', "Kompor utama": 190, "Kompor kanan": 200 },
  ];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
      <RefreshCw className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      <Navbar title="Laporan" />

      <main className="md:ml-64 pt-20 px-6 md:px-8 pb-8 w-full max-w-6xl mx-auto">
        
        {/* HEADER: TAB & UNDUH */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {["Minggu ini", "Bulan ini", "3 bulan"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab ? "bg-[#F6F5F2] text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Unduh PDF
          </button>
        </div>

        {/* SECTION 1: GRAFIK & RINGKASAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* GRAFIK TREN */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tren Kadar Gas Per Area</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94A3B8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94A3B8'}} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                  <Bar dataKey="Kompor utama" fill="#D1E2C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Kompor kanan" fill="#4A6741" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RINGKASAN STATISTIK */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Ringkasan Minggu Ini</h3>
              <div className="space-y-4">
                <StatItem label="Total peringatan" value="16 kali" />
                <StatItem label="Kejadian bahaya" value="3 kali" isDanger />
                <StatItem label="Area tersering" value="Kompor kanan" />
                <StatItem label="Rata-rata teratasi" value="12 menit" />
                <StatItem label="Sensor paling aktif" value="Sensor 2" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: TABEL RIWAYAT LENGKAP */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Riwayat Lengkap</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Waktu</th>
                <th className="py-4 px-6">Lokasi</th>
                <th className="py-4 px-6">Tingkat</th>
                <th className="py-4 px-6">Tindakan</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-500">Hari ini, 14:32</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{alert.location}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${alert.level === 'danger' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                      {alert.level === 'danger' ? 'Bahaya' : 'Waspada'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{alert.level === 'danger' ? 'Kipas + WA' : 'Notifikasi WA'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] border ${alert.isResolved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                      {alert.isResolved ? 'Selesai' : 'Perlu perhatian'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// Sub-komponen untuk baris statistik
function StatItem({ label, value, isDanger = false }: { label: string; value: string; isDanger?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-black ${isDanger ? "text-red-600" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}