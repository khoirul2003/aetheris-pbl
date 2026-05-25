"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel"; 
import { ClientProfileModel } from "@/models/clientProfileModel"; 
import { Filter, FileText, BarChart3 } from "lucide-react";

interface IncidentStat {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("semua_bulan");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [incidentStats, setIncidentStats] = useState<IncidentStat[]>([]);
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});

  // 1. Ambil data nama restoran secara terpusat melalui lapisan model profil
  useEffect(() => {
    const unsubscribeUsers = ClientProfileModel.subscribeToAllUsers((mapping) => {
      setUsersMap(mapping);
    });
    return () => unsubscribeUsers();
  }, []);

  // 2. Berlangganan real-time data alert menggunakan model platform secara reaktif
  useEffect(() => {
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (snapshotData: AlertData[]) => {
      const frequencies: { [key: string]: number } = {};
      
      snapshotData.forEach((item) => {
        const name = usersMap[item.userId] || item.restaurantName || "Restoran Tanpa Nama";
        frequencies[name] = (frequencies[name] || 0) + 1;
      });

      const sorted = Object.keys(frequencies).map(name => ({
        name,
        count: frequencies[name],
        percent: 0,
        color: "bg-rose-500"
      })).sort((a, b) => b.count - a.count);

      const maxCount = sorted[0]?.count || 1;
      const computed = sorted.map((item, index) => ({
        ...item,
        percent: Math.round((item.count / maxCount) * 100),
        color: index === 0 ? "bg-rose-500" : index === 1 ? "bg-amber-500" : index === 2 ? "bg-amber-400" : "bg-emerald-500"
      }));

      setIncidentStats(computed.slice(0, 5));
    });

    return () => unsubscribeAlerts();
  }, [usersMap]);

  const handleExportPDF = () => {
    window.print();
  };

  // Mengembalikan struktur data chart orisinal 12 bulan penuh dengan isi data di bulan Mei
  const getFilteredChartData = () => {
    if (timeRange === "semua_bulan") {
      return [
        { label: "Jan", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Feb", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Mar", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Apr", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Mei", revenue: 30, users: 15, valRev: "Rp 1.2M", valUsr: "+1" }, 
        { label: "Jun", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Jul", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Agu", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Sep", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Okt", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Nov", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Des", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
      ];
    } else if (timeRange === "3_bulan") {
      return [
        { label: "Maret", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "April", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Mei", revenue: 40, users: 20, valRev: "Rp 1.2M", valUsr: "+1" },
      ];
    } else if (timeRange === "bulan_ini") {
      return [
        { label: "Minggu 1", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Minggu 2", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Minggu 3", revenue: 0, users: 0, valRev: "Rp 0", valUsr: "+0" },
        { label: "Minggu 4", revenue: 50, users: 30, valRev: "Rp 1.2M", valUsr: "+1" },
      ];
    } else {
      return [
        { label: "Hari Ini", revenue: 20, users: 10, valRev: "Rp 300K", valUsr: "+1" }
      ];
    }
  };

  const dynamicChartData = getFilteredChartData();

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll" style={{ scrollbarGutter: "stable" }}>
      <div className="print:hidden"><Sidebar role="admin" /></div>
      <div className="flex flex-col flex-grow min-w-0">
        <Navbar title="Analitik Platform" />
        <main className="ml-0 md:ml-64 pt-24 px-8 pb-8 w-auto print:ml-0 print:p-0 transition-all flex-grow">
          <header className="flex justify-between items-start mb-8 border-b border-slate-200 pb-5 print:mb-4 print:pb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Analitik Platform</h1>
              <p className="text-slate-500 text-sm mt-1 print:text-xs">Analisis data performa, pertumbuhan user, pendapatan, serta metrik kerusakan alat.</p>
            </div>
            <div className="hidden print:block text-right text-xs text-slate-400 font-mono">Aetheris Analytics Report // Generated: {new Date().toLocaleDateString('id-ID')}</div>
            <div className="flex gap-2.5 print:hidden">
              <button onClick={handleExportPDF} className="group flex items-center gap-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200 hover:border-rose-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-rose-100/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                <FileText size={15} className="text-rose-500 transition-transform group-hover:scale-110" /> <span>Export PDF Report</span>
              </button>
            </div>
          </header>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
              <div className="flex items-center gap-2 text-slate-900 font-medium text-xs uppercase tracking-wider shrink-0"><Filter size={15} className="text-blue-600" /><span>Rentang Waktu Laporan:</span></div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors">
                  <option value="semua_bulan">Semua Bulan (12 Bulan)</option>
                  <option value="minggu_ini">Minggu Ini</option>
                  <option value="bulan_ini">Bulan Ini</option>
                  <option value="3_bulan">3 Bulan Terakhir</option>
                  <option value="custom">📅 Rentang Custom Tanggal</option>
                </select>
                {timeRange === "custom" && (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-xs text-slate-400 font-medium">s/d</span>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Tren Pertumbuhan User & Pendapatan Bulanan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Akumulasi pertumbuhan profit bulanan terhitung dalam IDR.</p>
                </div>
                <div className="flex gap-4 print:hidden text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Pendapatan</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> User Baru</span>
                </div>
              </div>
              <div className="h-56 flex items-end justify-between gap-1.5 px-2 pt-4 border-b border-l border-slate-200 font-mono text-[10px] text-slate-400 overflow-x-auto">
                {dynamicChartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[20px]">
                    <div className="w-full flex items-end gap-1 h-full">
                      <div style={{ height: `${data.revenue}%` }} className="flex-1 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600 relative" title={data.valRev}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none whitespace-nowrap z-10">{data.valRev}</span>
                      </div>
                      <div style={{ height: `${data.users}%` }} className="flex-1 bg-emerald-500 rounded-t-sm transition-all group-hover:bg-emerald-600 relative" title={data.valUsr}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none whitespace-nowrap z-10">{data.valUsr}</span>
                      </div>
                    </div>
                    <span className="font-sans text-[10px] text-slate-500 font-medium mt-1">{data.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Rasio Frekuensi Alert</h4>
                <p className="text-xs text-slate-400 mt-0.5">Komparasi data insiden kebocoran gas terhitung di database.</p>
              </div>
              <div className="space-y-4 my-auto pt-4">
                {incidentStats.length > 0 ? incidentStats.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700"><span className="truncate max-w-[140px]">{item.name}</span><span className="font-mono text-slate-900 font-bold">{item.count} Alert</span></div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div style={{ width: `${item.percent}%` }} className={`${item.color} h-full rounded-full`} /></div>
                  </div>
                )) : <p className="text-center text-xs text-slate-400 py-6">Belum ditemukan data log alert.</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2"><BarChart3 size={15} className="text-red-500" /><h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Restoran Paling Sering Alert Bahaya</h4></div>
              <table className="w-full text-left table-auto">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase font-medium">
                  <tr><th className="px-5 py-3">ID Baris</th><th className="px-5 py-3">Nama Mitra Restoran</th><th className="px-5 py-3 text-right">Frekuensi Insiden</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {incidentStats.length > 0 ? incidentStats.slice(0, 3).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">RES-00{idx + 1}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{item.name}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600 bg-rose-50/30">{item.count} Kali Alert</td>
                    </tr>
                  )) : <tr><td colSpan={3} className="text-center text-slate-400 py-10 text-xs">Tidak ditemukan riwayat log kebocoran.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2"><BarChart3 size={15} className="text-slate-500" /><h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Perangkat Sensor Paling Sering Offline</h4></div>
              <table className="w-full text-left table-auto">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase font-medium">
                  <tr><th className="px-5 py-3">ID Sensor</th><th className="px-5 py-3">Nama Perangkat Sensor</th><th className="px-5 py-3 text-right">Durasi Terputus</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400 text-xs">Tidak ditemukan perangkat sensor berstatus offline.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}