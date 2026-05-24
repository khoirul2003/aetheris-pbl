"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { Search, Download, FileSpreadsheet, FileText, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminAlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  
  // State untuk Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Data Dummy Riwayat Alerts Lengkap
  const [alertsData] = useState([
    { id: "RES-001", time: "2026-05-24 14:20", restaurant: "Lalapan Purnama", sensor: "Sensor Dapur Utama", level: "BAHAYA", action: "Buzzer Aktif & Notifikasi SMS", status: "TERTANGANI" },
    { id: "RES-002", time: "2026-05-24 11:05", restaurant: "Bakso Solo Baru", sensor: "Sensor Gas Belakang", level: "WASPADA", action: "Kirim Notifikasi Aplikasi", status: "PROSES" },
    { id: "RES-003", time: "2026-05-23 19:40", restaurant: "Restoran Padang Restu", sensor: "Sensor Depan", level: "BAHAYA", action: "Buzzer Aktif", status: "TERTANGANI" },
    { id: "RES-004", time: "2026-05-22 09:15", restaurant: "Ayam Kita Tlogomas", sensor: "Sensor Gudang", level: "WASPADA", action: "Kirim Notifikasi Aplikasi", status: "TERTANGANI" },
  ]);

  // Logika Penyaringan / Filter Data
  const filteredAlerts = alertsData.filter((item) => {
    const matchesSearch = 
      item.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sensor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = filterLevel === "ALL" || item.level === filterLevel;
    const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
    const matchesDate = !filterDate || item.time.startsWith(filterDate);

    return matchesSearch && matchesLevel && matchesStatus && matchesDate;
  });

  // Fungsi Implementasi Ekspor CSV (Hijau Gradasi)
  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    const headers = ["ID Restoran", "Waktu", "Nama Restoran", "Nama Sensor", "Tingkat Bahaya", "Tindakan Sistem", "Status Penanganan"];
    const rows = filteredAlerts.map(item => [
      item.id,
      item.time,
      `"${item.restaurant}"`,
      `"${item.sensor}"`,
      item.level,
      `"${item.action}"`,
      item.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aetheris_Riwayat_Alert.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi Cetak PDF (Merah Gradasi)
  const handleExportPDF = () => {
    window.print();
  };

  // Komponen Reusable untuk Pagination Controls (Atas & Bawah)
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border-b border-t border-slate-200 print:hidden text-slate-700 text-sm">
      <div className="flex items-center gap-2">
        <span>Tampilkan</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>data per halaman</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500 font-medium">
          Menampilkan 1 - {Math.min(pageSize, filteredAlerts.length)} dari {filteredAlerts.length} log
        </span>
        <div className="flex gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={true} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll" 
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="print:hidden">
        <Sidebar role="admin" />
      </div>
      
      <main className="ml-64 p-8 w-full print:ml-0 print:p-0 transition-all">
        {/* Header Section */}
        <header className="flex justify-between items-start mb-8 border-b border-slate-200 pb-5 print:mb-4 print:pb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Alert (Semua Restoran)</h1>
            <p className="text-slate-500 text-sm mt-1 print:text-xs">Daftar log peringatan bahaya dari seluruh sistem sensor mitra.</p>
          </div>
          
          {/* Action Buttons Panel - Soft Modern Minimalist Style */}
          <div className="flex gap-3 print:hidden">
            {/* CSV: Latar Belakang Hijau Muda Lembut, Teks Kontras, Border Terang Bersinar */}
            <button 
              onClick={handleExportCSV}
              className="group flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600 border border-emerald-200 hover:border-emerald-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-100/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-500 transition-transform group-hover:scale-110" /> 
              <span>Export Excel / CSV</span>
            </button>
            
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

        {/* Panel Kontrol Filter & Pencarian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Bagian Kiri: Urutan Filter (Tanggal Utama di Kiri Sendiri) */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* 1. Filter Tanggal (Paling Kiri) */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-44 transition-colors"
                />
              </div>

              {/* 2. Filter Tingkat Bahaya */}
              <select 
                value={filterLevel} 
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Semua Tingkat Bahaya</option>
                <option value="WASPADA">Waspada</option>
                <option value="BAHAYA">Bahaya</option>
              </select>

              {/* 3. Filter Status */}
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Semua Status</option>
                <option value="PROSES">Dalam Proses</option>
                <option value="TERTANGANI">Tertangani</option>
              </select>
            </div>

            {/* Bagian Kanan: Search Input (Kanan Sendiri) */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Cari restoran atau sensor..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
              />
            </div>

          </div>
        </div>

        {/* Container Tabel Utama */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          
          {/* 1. Control Pagination Bagian Atas */}
          <PaginationControls />

          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID Restoran</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Nama Restoran</th>
                  <th className="px-6 py-4">Nama Sensor</th>
                  <th className="px-6 py-4">Tingkat Bahaya</th>
                  <th className="px-6 py-4">Tindakan Sistem</th>
                  <th className="px-6 py-4">Status Penanganan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {/* Kolom ID: Jelas, Berwarna Gelap & Menggunakan Font Mono */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {item.id}
                      </td>
                      
                      {/* Kolom Waktu */}
                      <td className="px-6 py-4 text-slate-500">
                        {item.time}
                      </td>
                      
                      {/* Kolom Nama Restoran (Font Biasa Jelas) */}
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {item.restaurant}
                      </td>
                      
                      {/* Kolom Sensor */}
                      <td className="px-6 py-4 text-slate-600">
                        {item.sensor}
                      </td>
                      
                      {/* Kolom Tingkat Bahaya */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.level === "BAHAYA" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.level}
                        </span>
                      </td>
                      
                      {/* Kolom Tindakan */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {item.action}
                      </td>
                      
                      {/* Kolom Status Penanganan */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "TERTANGANI" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                      Tidak ditemukan riwayat log alert yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. Control Pagination Bagian Bawah */}
          <PaginationControls />

        </div>
      </main>
    </div>
  );
}