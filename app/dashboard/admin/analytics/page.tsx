"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { Filter, FileText, BarChart3, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("bulan_ini");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fungsi Cetak PDF Resmi (Merah Premium Gradasi)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    /* Mengunci layout agar tidak bergeser saat data berubah atau di-scroll */
    <div 
      className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll" 
      style={{ scrollbarGutter: "stable" }}
    >
      {/* Sidebar disembunyikan otomatis saat mencetak laporan ke PDF */}
      <div className="print:hidden">
        <Sidebar role="admin" />
      </div>
      
      <main className="ml-64 p-8 w-full print:ml-0 print:p-0 transition-all">
        {/* Header Section */}
        <header className="flex justify-between items-start mb-8 border-b border-slate-200 pb-5 print:mb-4 print:pb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Analitik Platform</h1>
            <p className="text-slate-500 text-sm mt-1 print:text-xs">Analisis data performa, pertumbuhan user, pendapatan, serta metrik kerusakan alat.</p>
          </div>
          
          {/* Identitas Cetak Dokumen Resmi (Hanya Muncul di PDF) */}
          <div className="hidden print:block text-right text-xs text-slate-400 font-mono">
            Aetheris Analytics Report // Generated: {new Date().toLocaleDateString('id-ID')}
          </div>

          {/* Tombol Cetak PDF Merah Gradasi Premium */}
          <div className="flex gap-2.5 print:hidden">
            {/* PDF: Latar Belakang Merah/Rose Muda Lembut, Teks Kontras, Border Terang Bersinar */}
            <button 
              onClick={handleExportPDF}
              className="group flex items-center gap-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200 hover:border-rose-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-rose-100/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FileText size={15} className="text-rose-500 transition-transform group-hover:scale-110" /> 
              <span>Export PDF Report</span>
            </button>
          </div>
        </header>

        {/* Filter Toolbar Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-slate-900 font-medium text-xs uppercase tracking-wider shrink-0">
              <Filter size={15} className="text-blue-600" />
              <span>Rentang Waktu Laporan:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="minggu_ini">Minggu Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="3_bulan">3 Bulan Terakhir</option>
                <option value="custom">📅 Rentang Custom Tanggal</option>
              </select>

              {/* Input Muncul Dinamis Jika Memilih Filter Custom Rentang Waktu */}
              {timeRange === "custom" && (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                  />
                  <span className="text-xs text-slate-400 font-medium">s/d</span>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 1: Grafik Representatif Komparatif (Tampilan Bar Chart Modern) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Grafik Kiri: Pertumbuhan User & Tren Pendapatan bulanan */}
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
            
            {/* Grafik Batang Flexbox */}
            <div className="h-56 flex items-end justify-between gap-4 px-2 pt-4 border-b border-l border-slate-200 font-mono text-[10px] text-slate-400">
              {[
                { label: "Jan", revenue: 40, users: 25, valRev: "Rp 4.0M", valUsr: "+25" },
                { label: "Feb", revenue: 55, users: 35, valRev: "Rp 5.5M", valUsr: "+35" },
                { label: "Mar", revenue: 70, users: 50, valRev: "Rp 7.0M", valUsr: "+50" },
                { label: "Apr", revenue: 65, users: 45, valRev: "Rp 6.5M", valUsr: "+45" },
                { label: "Mei", revenue: 90, users: 75, valRev: "Rp 9.0M", valUsr: "+75" },
              ].map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full flex items-end gap-1.5 h-full max-w-[50px]">
                    {/* Bar Revenue */}
                    <div 
                      style={{ height: `${data.revenue}%` }} 
                      className="flex-1 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600 relative"
                      title={data.valRev}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none">{data.valRev}</span>
                    </div>
                    {/* Bar Users */}
                    <div 
                      style={{ height: `${data.users}%` }} 
                      className="flex-1 bg-emerald-500 rounded-t-sm transition-all group-hover:bg-emerald-600 relative"
                      title={data.valUsr}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-sans text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none">{data.valUsr}</span>
                    </div>
                  </div>
                  <span className="font-sans text-xs text-slate-500 font-medium mt-1">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grafik Kanan: Jumlah Alert Komparatif Per Restoran */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Rasio Frekuensi Alert</h4>
              <p className="text-xs text-slate-400 mt-0.5">Komparasi total insiden kebocoran gas mitra.</p>
            </div>

            {/* Linear Progress Bars Chart */}
            <div className="space-y-4 my-auto pt-4">
              {[
                { name: "Lalapan Purnama", count: 14, percent: 100, color: "bg-rose-500" },
                { name: "Bakso Solo Baru", count: 8, percent: 57, color: "bg-amber-500" },
                { name: "Restoran Padang Restu", count: 3, percent: 21, color: "bg-amber-400" },
                { name: "Ayam Kita Tlogomas", count: 1, percent: 7, color: "bg-emerald-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{item.name}</span>
                    <span className="font-mono text-slate-900 font-bold">{item.count} Alert</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${item.percent}%` }} className={`${item.color} h-full rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Row 2: Metric Data Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tabel Kiri: Restoran Paling Sering Alert */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2">
              <BarChart3 size={15} className="text-red-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Restoran Paling Sering Alert Bahaya</h4>
            </div>
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase font-medium">
                <tr>
                  <th className="px-5 py-3">ID Restoran</th>
                  <th className="px-5 py-3">Nama Mitra Restoran</th>
                  <th className="px-5 py-3 text-right">Frekuensi Insiden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">RES-004</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Lalapan Purnama</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600 bg-rose-50/30">14 Kali Alert</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">RES-002</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Bakso Solo Baru</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600 bg-amber-50/30">8 Kali Alert</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">RES-001</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Restoran Padang Restu</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-600">3 Kali Alert</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel Kanan: Sensor Paling Sering Offline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2">
              <BarChart3 size={15} className="text-slate-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Perangkat Sensor Paling Sering Offline</h4>
            </div>
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase font-medium">
                <tr>
                  <th className="px-5 py-3">ID Sensor</th>
                  <th className="px-5 py-3">Nama Perangkat Sensor</th>
                  <th className="px-5 py-3 text-right">Durasi Terputus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">SN-092</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Sensor Dapur Utama (Lalapan Purnama)</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-700 bg-slate-50">5 Hari Terputus</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">SN-011</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Sensor Cadangan Kiri (Bakso Solo Baru)</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-700 bg-slate-50">2 Hari Terputus</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">SN-004</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">Sensor Gas Depan (Padang Restu)</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-600">6 Jam Terputus</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}