"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel"; // Memanggil model alert terpusat
import { ClientProfileModel } from "@/models/clientProfileModel"; // Memanggil model profil untuk lookup relasi
import { Search, Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";

export default function AdminActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterActor, setFilterActor] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  
  // State untuk Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Mengubah data dummy array ke State dinamis terikat model
  const [logsData, setLogsData] = useState<any[]>([]);
  
  // State Kamus Peta LookUp Relasional (userId -> restaurantName)
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});

  // 1. Sinkronisasi Kamus Nama Restoran dari Lapisan Model Profil
  useEffect(() => {
    const unsubscribeUsers = ClientProfileModel.subscribeToAllUsers((mapping) => {
      setUsersMap(mapping);
    });
    return () => unsubscribeUsers();
  }, []);

  // 2. Ambil data aktivitas sistem secara real-time menggunakan fungsi model proyek
  useEffect(() => {
    // Memanggil stream model dengan parameter "ALL" khusus untuk kebutuhan admin global
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (snapshotData: AlertData[]) => {
      let idx = 1;
      const logs = snapshotData.map((item) => {
        const timestamp = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        const timeStr = item.createdAt ? timestamp.toISOString().replace('T', ' ').substring(0, 16) : "-";
        
        // Cari nama restoran terhubung dari usersMap berdasarkan userId dokumen alert
        const currentRestaurantName = usersMap[item.userId] || item.restaurantName || "Sektor Restoran";

        return {
          id: `LOG-0${idx++}`,
          time: timeStr,
          actor: item.level === "danger" ? "Sistem" : "Admin",
          action: item.level === "danger" ? "Threshold Diubah" : "Firmware Diupdate",
          target: currentRestaurantName, // KONEKSI REAL DATABASE: Otomatis membaca nama restoran aktual
          desc: item.message || "Pemicu otomatisasi deteksi sensor gas mitigasi bahaya",
        };
      });
      
      setLogsData(logs);
    });

    return () => unsubscribeAlerts();
  }, [usersMap]); // Me-re-run efek ketika data peta usersMap masuk agar nama langsung ter-render dinamis

  // Logika Penyaringan / Filter Data secara Dinamis langsung dari State atas
  const filteredLogs = logsData.filter((item) => {
    const matchesSearch = 
      item.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === "ALL" || item.action === filterAction;
    const matchesActor = filterActor === "ALL" || item.actor === filterActor;
    const matchesDate = !filterDate || item.time.startsWith(filterDate);

    return matchesSearch && matchesAction && matchesActor && matchesDate;
  });

  // Logika Pemotongan Baris Data Per Halaman (Pagination)
  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

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
          Menampilkan {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, filteredLogs.length)} dari {filteredLogs.length} log
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
            disabled={indexOfLastRow >= filteredLogs.length} 
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
      
      {/* Pembungkus layout utama satu arah kolom agar penempatan komponen Navbar teratur rapi */}
      <div className="flex flex-col flex-grow min-w-0">
        <Navbar title="Log Aktivitas Sistem" />

        <main className="md:ml-64 pt-24 px-8 pb-8 w-auto print:ml-0 print:p-0 transition-all flex-grow">
          {/* Header Section */}
          <header className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
            <p className="text-slate-500 text-sm mt-1">Daftar rekaman seluruh aktivitas krusial sistem otomatis serta tindakan penyesuaian administrator.</p>
          </header>

          {/* Panel Kontrol Filter & Pencarian (Dinamis Instan di Atas Tabel) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Bagian Kiri: Urutan Filter */}
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

              {/* Bagian Kanan: Kotak Pencarian */}
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
                  {currentRows.length > 0 ? (
                    currentRows.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                          {log.id}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {log.time}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.actor === "Sistem" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {log.actor}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-medium">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-blue-600 font-medium">
                          {log.target}
                        </td>
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

            <PaginationControls />

          </div>
        </main>
      </div>
    </div>
  );
}