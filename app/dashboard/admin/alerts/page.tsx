"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Search, FileSpreadsheet, FileText, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminAlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  
  // State untuk Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Ambil struktur tipe data aseli dari model real-time proyek
  const [alertsData, setAlertsData] = useState<AlertData[]>([]);
  const [usersMap, setUsersMap] = useState<{ [uid: string]: string }>({});

  // 1. Ambil data peta nama restoran dari koleksi 'users' secara real-time
  useEffect(() => {
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const mapping: { [uid: string]: string } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        mapping[doc.id] = data.restaurantName || data.name || "Restoran Tanpa Nama";
      });
      setUsersMap(mapping);
    });

    return () => unsubscribeUsers();
  }, []);

  // 2. Mengambil log alert secara global bypass khusus untuk akun Admin
  useEffect(() => {
    const unsubscribeAlerts = ClientAlertModel.subscribeToAlerts("ALL", (data: AlertData[]) => {
      setAlertsData(data);
    });
    
    return () => unsubscribeAlerts();
  }, []);

  // Konversi Timestamp aman tanpa explicit any
  const formatAlertTime = (createdAt: { toDate?: () => Date } | Date | string | number | null | undefined) => {
  if (!createdAt) return "-";
  
  // Deteksi jika merupakan objek Timestamp dari Firestore
  const date = (createdAt && typeof createdAt === "object" && "toDate" in createdAt && typeof createdAt.toDate === "function")
    ? createdAt.toDate()
    : new Date(createdAt as string | number | Date);

  return date.toISOString().replace('T', ' ').substring(0, 16);
};

  // Filter & Transformasi Data
  const filteredAlerts = alertsData.filter((item) => {
    const timeStr = formatAlertTime(item.createdAt);
    const itemLevel = item.level === "danger" ? "BAHAYA" : "WASPADA";
    const itemStatus = item.isResolved ? "TERTANGANI" : "PROSES";
    
    const restaurantName = usersMap[item.userId] || item.sensorName || "Memuat Mitra...";
    const sensorName = item.sensorName || item.location || "Sensor Perangkat";

    const matchesSearch = 
      restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = filterLevel === "ALL" || itemLevel === filterLevel;
    const matchesStatus = filterStatus === "ALL" || itemStatus === filterStatus;
    const matchesDate = !filterDate || timeStr.startsWith(filterDate);

    return matchesSearch && matchesLevel && matchesStatus && matchesDate;
  }).map((item) => {
    const timeStr = formatAlertTime(item.createdAt);
    return {
      id: item.userId ? `RES-${item.userId.substring(0, 4).toUpperCase()}` : "RES-000",
      time: timeStr,
      restaurant: usersMap[item.userId] || item.sensorName || "Restoran Mitra",
      sensor: item.sensorName || item.location || "Sensor Utama",
      level: item.level === "danger" ? "BAHAYA" : "WASPADA",
      action: item.level === "danger" ? "Buzzer Aktif & Notifikasi SMS" : "Kirim Notifikasi Aplikasi",
      status: item.isResolved ? "TERTANGANI" : "PROSES",
    };
  });

  // Logika Pagination
  const indexOfLastRow = currentPage * pageSize;
  const indexOfFirstRow = indexOfLastRow - pageSize;
  const currentRows = filteredAlerts.slice(indexOfFirstRow, indexOfLastRow);

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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aetheris_Riwayat_Alert.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const renderPaginationControls = () => (
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
          Menampilkan {filteredAlerts.length === 0 ? 0 : indexOfFirstRow + 1} - {Math.min(indexOfLastRow, filteredAlerts.length)} dari {filteredAlerts.length} log
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
            disabled={indexOfLastRow >= filteredAlerts.length}
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
    <AdminLayout
      title="Riwayat Alert"
      description="Lihat dan tindak lanjuti seluruh alert terdeteksi."
    >
      <div className="flex w-full flex-col gap-5">

          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 print:hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-44 transition-colors"
                  />
                </div>

                <select 
                  value={filterLevel} 
                  onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Tingkat Bahaya</option>
                  <option value="WASPADA">Waspada</option>
                  <option value="BAHAYA">Bahaya</option>
                </select>

                <select 
                  value={filterStatus} 
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PROSES">Dalam Proses</option>
                  <option value="TERTANGANI">Tertangani</option>
                </select>
              </div>

              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input 
                  type="text" 
                  placeholder="Cari restoran atau sensor..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-all"
                />
              </div>
            </div>
          </section>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            {renderPaginationControls()}

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
                  {currentRows.length > 0 ? (
                    currentRows.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{item.id}</td>
                        <td className="px-6 py-4 text-slate-500">{item.time}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{item.restaurant}</td>
                        <td className="px-6 py-4 text-slate-600">{item.sensor}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.level === "BAHAYA" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>{item.level}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{item.action}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "TERTANGANI" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>{item.status}</span>
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

            {renderPaginationControls()}
          </div>
        </div>
    </AdminLayout>
  );
}