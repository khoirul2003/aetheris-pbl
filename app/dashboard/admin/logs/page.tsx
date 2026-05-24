"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { Search, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight, Info } from "lucide-react";

export default function AdminActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterActor, setFilterActor] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  
  // State untuk Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Data Dummy Rekaman Log Aktivitas Lengkap Sesuai Ketentuan
  const [logsData] = useState([
    { id: "LOG-001", time: "2026-05-24 15:00", actor: "Admin", action: "Threshold Diubah", target: "Restoran Lalapan Purnama", desc: "Mengubah batas bahaya default menjadi 750 PPM" },
    { id: "LOG-002", time: "2026-05-24 10:15", actor: "Sistem", action: "Sensor Didaftarkan", target: "Sensor Gas Baru #49", desc: "Instalasi perangkat firmware v2.1 sukses" },
    { id: "LOG-003", time: "2026-05-23 08:00", actor: "Admin", action: "User Dinonaktifkan", target: "Mitra Depot Hijau", desc: "Penangguhan akun karena masa langganan berakhir" },
    { id: "LOG-004", time: "2026-05-22 11:30", actor: "Admin", action: "Paket Diganti", engine: "Restoran Padang Restu", target: "Restoran Padang Restu", desc: "Upgrade paket langganan dari Starter ke Paket Pro" },
    { id: "LOG-005", time: "2026-05-21 04:12", actor: "Sistem", action: "Firmware Diupdate", target: "Gateway Node Lowokwaru", desc: "Otomatisasi pembaruan OTA firmware keamanan v2.2" },
  ]);

  // Logika Penyaringan / Filter Data secara Dinamis
  const filteredLogs = logsData.filter((item) => {
    const matchesSearch = 
      item.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === "ALL" || item.action === filterAction;
    const matchesActor = filterActor === "ALL" || item.actor === filterActor;
    const matchesDate = !filterDate || item.time.startsWith(filterDate);

    return matchesSearch && matchesAction && matchesActor && matchesDate;
  });

  // Komponen Reusable untuk Pagination Controls (Atas & Bawah)
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border-b border-t border-slate-200 text-slate-700 text-sm">
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
          Menampilkan 1 - {Math.min(pageSize, filteredLogs.length)} dari {filteredLogs.length} log
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
    /* Mengunci layout agar tidak bergeser ke kanan saat perpindahan halaman filter */
    <div 
      className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll" 
      style={{ scrollbarGutter: "stable" }}
    >
      <Sidebar role="admin" />
      
      <main className="ml-64 p-8 w-full transition-all">
        {/* Header Section */}
        <header className="mb-8 border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar rekaman seluruh aktivitas krusial sistem otomatis serta tindakan penyesuaian administrator.</p>
        </header>

        {/* Panel Kontrol Filter & Pencarian (Sesuai Layout Standar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Bagian Kiri: Urutan Filter (Tanggal Paling Kiri) */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* 1. Filter Tanggal */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-44 transition-colors"
                />
              </div>

              {/* 2. Filter Jenis Aksi */}
              <select 
                value={filterAction} 
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Semua Jenis Aksi</option>
                <option value="Sensor Didaftarkan">Sensor Didaftarkan</option>
                <option value="User Dinonaktifkan">User Dinonaktifkan</option>
                <option value="Threshold Diubah">Threshold Diubah</option>
                <option value="Paket Diganti">Paket Diganti</option>
                <option value="Firmware Diupdate">Firmware Diupdate</option>
              </select>

              {/* 3. Filter Pelaku */}
              <select 
                value={filterActor} 
                onChange={(e) => setFilterActor(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="ALL">Semua Pelaku</option>
                <option value="Admin">Admin / Sistem Utama</option>
                <option value="Sistem">Sistem Otomatis</option>
              </select>
            </div>

            {/* Bagian Kanan: Kotak Pencarian (Kanan Sendiri) */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Cari target atau keterangan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
              />
            </div>

          </div>
        </div>

        {/* Container Tabel Utama */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Banner Informasi Read-Only Khas Audit Trail */}
          <div className="p-4 bg-amber-50/50 border-b border-slate-200 flex items-center gap-2.5 text-xs text-amber-800 font-medium">
            <Info size={15} className="text-amber-600 shrink-0" />
            <span>Catatan audit log bersifat <strong>Read-Only</strong>. Data ini disimpan permanen dan tidak dapat diedit atau dihapus demi pemenuhan validitas keamanan data platform.</span>
          </div>

          {/* 1. Control Pagination Bagian Atas */}
          <PaginationControls />

          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID Log</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pelaku</th>
                  <th className="px-6 py-4">Aksi / Operasi</th>
                  <th className="px-6 py-4">Target Obyek</th>
                  <th className="px-6 py-4">Keterangan Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID Log Terbaca Jelas */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {log.id}
                      </td>
                      
                      {/* Waktu Operasi */}
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {log.time}
                      </td>
                      
                      {/* Pelaku Otoritas */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.actor === "Sistem" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {log.actor}
                        </span>
                      </td>
                      
                      {/* Nama Tindakan */}
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {log.action}
                      </td>
                      
                      {/* Target Mutasi */}
                      <td className="px-6 py-4 text-blue-600 font-medium">
                        {log.target}
                      </td>
                      
                      {/* Deskripsi Lengkap Audit */}
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-sm">
                        {log.desc}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                      Tidak ditemukan rekaman aktivitas sistem yang cocok dengan kriteria penapisan filter.
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