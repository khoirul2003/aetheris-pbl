"use client";

import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel"; 
import { ClientProfileModel } from "@/models/clientProfileModel"; 
import { ClientSubscriptionModel, UserSubscriptionLog } from "@/models/clientSubscriptionModel";
import { Filter, FileText, BarChart3 } from "lucide-react";

interface IncidentStat {
  name: string;
  count: number;
  percent: number;
  color: string;
}

// Format IDR standard
const formatIDR = (amount: number) => {
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `Rp ${Math.round(amount / 1000)}K`;
  return `Rp ${amount}`;
};

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("semua_bulan");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [incidentStats, setIncidentStats] = useState<IncidentStat[]>([]);
  
  // Data State dari Firestore
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscriptionLog[]>([]);

  // 1. Ambil data nama dan profil pengguna
  useEffect(() => {
    // Berlangganan data mentah user (untuk chart pertumbuhan user)
    const unsubscribeUsers = ClientProfileModel.subscribeToAllUsers((mapping) => {
      setUsersMap(mapping);
    });

    // Kita butuh data user lengkap untuk melihat tanggal dibuat (createdAt)
    const fetchFullUsersData = async () => {
      const usersData = await ClientProfileModel.getAllProfiles(); 
      setAllUsers(usersData);
    };
    fetchFullUsersData();

    return () => unsubscribeUsers();
  }, []);

  // 2. Ambil data transaksi berlangganan untuk chart pendapatan (Revenue)
  useEffect(() => {
    const unsubSubs = ClientSubscriptionModel.subscribeToAllUserSubscriptions((data) => {
      // Hanya ambil transaksi yang sudah dibayar (paid)
      const paidSubs = data.filter(log => log.paymentStatus === 'paid');
      setAllSubscriptions(paidSubs);
    });
    return () => unsubSubs();
  }, []);

  // 3. Ambil data insiden (Alerts)
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

  // 4. LOGIKA PERHITUNGAN CHART DINAMIS BERDASARKAN WAKTU SEKARANG (REAL-TIME)
  const dynamicChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Template dasar 12 bulan (Januari - Desember)
    const monthlyData = [
      { label: "Jan", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Feb", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Mar", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Apr", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Mei", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Jun", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Jul", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Agu", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Sep", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Okt", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Nov", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
      { label: "Des", revenueRaw: 0, usersRaw: 0, valRev: "Rp 0", valUsr: "+0" },
    ];

    // Proses Data Pertumbuhan Pengguna (Berdasarkan field 'createdAt')
    allUsers.forEach((user) => {
      // Validasi tanggal pembuatan
      let createdDate = new Date();
      if (user.createdAt) {
         if (typeof user.createdAt === 'object' && 'toDate' in user.createdAt) {
             createdDate = user.createdAt.toDate();
         } else {
             createdDate = new Date(user.createdAt);
         }
      }

      // Hitung hanya jika tahunnya sesuai
      if (createdDate.getFullYear() === currentYear) {
        const monthIndex = createdDate.getMonth();
        monthlyData[monthIndex].usersRaw += 1;
      }
    });

    // Proses Data Pemasukan/Revenue (Berdasarkan field 'startDate' pada log berlangganan)
    allSubscriptions.forEach((sub) => {
      let paidDate = new Date();
      if (sub.startDate) {
        if (typeof sub.startDate === 'object' && 'toDate' in sub.startDate) {
            paidDate = (sub.startDate as any).toDate();
        } else {
            paidDate = new Date(sub.startDate as any);
        }
      }

      if (paidDate.getFullYear() === currentYear) {
        const monthIndex = paidDate.getMonth();
        monthlyData[monthIndex].revenueRaw += (sub.amount || 0);
      }
    });

    // Menghitung Nilai Maksimal untuk Skala Bar Chart (Persentase)
    const maxRevenue = Math.max(...monthlyData.map(m => m.revenueRaw), 1); // minimal 1 untuk hindari bagi 0
    const maxUsers = Math.max(...monthlyData.map(m => m.usersRaw), 1);

    // Format Data Akhir
    const finalMonthlyData = monthlyData.map(data => ({
        label: data.label,
        // PERBAIKAN: Gunakan batas maksimal 85% (bukan 100%) agar selalu ada sisa ruang untuk label angka di bagian atas.
        revenue: Math.min(85, Math.max(0, (data.revenueRaw / maxRevenue) * 85)),
        users: Math.min(85, Math.max(0, (data.usersRaw / maxUsers) * 85)),
        // Label teks hover
        valRev: formatIDR(data.revenueRaw),
        valUsr: `+${data.usersRaw}`,
    }));

    // Filter Berdasarkan Pilihan Dropdown Waktu
    if (timeRange === "semua_bulan") {
      return finalMonthlyData;
    } else if (timeRange === "3_bulan") {
      // Ambil 3 bulan terakhir (termasuk bulan ini)
      const startMonth = Math.max(0, currentMonth - 2);
      return finalMonthlyData.slice(startMonth, currentMonth + 1);
    } else if (timeRange === "bulan_ini") {
       // Hanya kembalikan data bulan ini (dalam simulasi bar tunggal)
       return [finalMonthlyData[currentMonth]];
    } else {
      // Custom (saat ini kembalikan semua untuk mempermudah contoh)
      return finalMonthlyData;
    }

  }, [allUsers, allSubscriptions, timeRange]);


  return (
    <AdminLayout
      title="Laporan & Analitik Platform"
      description="Analisis data performa, pertumbuhan user, pendapatan, serta metrik kerusakan alat."
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-5 print:mb-4 print:pb-2">
          <div className="hidden print:block text-right text-xs text-slate-400 font-mono">Aetheris Analytics Report // Generated: {new Date().toLocaleDateString('id-ID')}</div>
          <div className="flex gap-2.5 print:hidden ml-auto">
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
                  <option value="semua_bulan">Tahun Ini (12 Bulan)</option>
                  <option value="bulan_ini">Bulan Ini Saja</option>
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
                  <p className="text-xs text-slate-400 mt-0.5">Dihitung otomatis (Live) dari database log pendaftaran & pembayaran.</p>
                </div>
                <div className="flex gap-4 print:hidden text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Pendapatan Total</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> User Mendaftar</span>
                </div>
              </div>
              
              {/* PERBAIKAN: Menambah tinggi container (h-64) dan memastikan overflow terlihat */}
              <div className="h-64 flex items-end justify-between gap-1.5 px-2 pt-6 border-b border-l border-slate-200 font-mono text-[10px] text-slate-400 overflow-visible">
                {dynamicChartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[20px]">
                    <div className="w-full flex items-end gap-1 h-full">
                      {/* BAR PENDAPATAN (REVENUE) */}
                      <div style={{ height: `${Math.max(data.revenue, 1)}%` }} className="flex-1 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600 relative" title={data.valRev}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none whitespace-nowrap z-10 shadow-md">{data.valRev}</span>
                      </div>
                      {/* BAR PENGGUNA (USERS) */}
                      <div style={{ height: `${Math.max(data.users, 1)}%` }} className="flex-1 bg-emerald-500 rounded-t-sm transition-all group-hover:bg-emerald-600 relative" title={data.valUsr}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none whitespace-nowrap z-10 shadow-md">{data.valUsr}</span>
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
      </div>
    </AdminLayout>
  );
}