"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { RefreshCw } from "lucide-react";

type FilterType = "semua" | "bahaya" | "waspada" | "belum_ditangani";

export default function AlertsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("semua");

  useEffect(() => {
    const unsubscribe = ClientAlertModel.subscribeToAlerts(userId, (data) => {
      setAlerts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  // Logika Menghitung Angka Statistik di Dalam Tab Tombol
  const countAll = alerts.length;
  const countBahaya = alerts.filter((a) => a.level === "danger").length;
  const countWaspada = alerts.filter((a) => a.level === "warning").length;
  const countBelumDitangani = alerts.filter((a) => !a.isResolved).length;

  // Proses Filter Data yang Ditampilkan Sesuai Tab yang Aktif
  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === "bahaya") return alert.level === "danger";
    if (activeFilter === "waspada") return alert.level === "warning";
    if (activeFilter === "belum_ditangani") return !alert.isResolved;
    return true;
  });

  // Fungsi Format Waktu agar Tampil Sesuai Gambar Mockup (Contoh: "Hari ini, 14:32")
  const formatAlertTime = (timestamp: any) => {
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
          <RefreshCw className="animate-spin text-amber-700 mx-auto" size={28} />
          <p className="text-slate-600 font-medium text-xs">Menyelaraskan data log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      <Navbar title="Alert" />

      <main className="md:ml-64 pt-20 px-6 md:px-8 pb-8 w-full max-w-5xl mx-auto">
        
        {/* TAB FILTER KATEGORI (ATAS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <button
            onClick={() => setActiveFilter("semua")}
            className={`p-3 rounded-xl border text-center transition-all ${
              activeFilter === "semua"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">Semua</p>
            <p className="text-base font-black mt-0.5">({countAll})</p>
          </button>

          <button
            onClick={() => setActiveFilter("bahaya")}
            className={`p-3 rounded-xl border text-center transition-all ${
              activeFilter === "bahaya"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">Bahaya</p>
            <p className="text-base font-black mt-0.5">({countBahaya})</p>
          </button>

          <button
            onClick={() => setActiveFilter("waspada")}
            className={`p-3 rounded-xl border text-center transition-all ${
              activeFilter === "waspada"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">Waspada</p>
            <p className="text-base font-black mt-0.5">({countWaspada})</p>
          </button>

          <button
            onClick={() => setActiveFilter("belum_ditangani")}
            className={`p-3 rounded-xl border text-center transition-all ${
              activeFilter === "belum_ditangani"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">Belum ditangani</p>
            <p className="text-base font-black mt-0.5">({countBelumDitangani})</p>
          </button>
        </div>

        {/* CONTAINER TABEL DATA (BAWAH) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Waktu</th>
                  <th className="py-4 px-6">Lokasi</th>
                  <th className="py-4 px-6">Tingkat</th>
                  <th className="py-4 px-6">Yang dilakukan sistem</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium bg-white">
                      Tidak ada rekaman data log peringatan untuk kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isDanger = alert.level === "danger";
                    const isResolved = alert.isResolved;

                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. KOLOM WAKTU */}
                        <td className="py-4 px-6 font-medium text-slate-500 white-space-nowrap">
                          {formatAlertTime(alert.createdAt)}
                        </td>

                        {/* 2. KOLOM LOKASI */}
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {alert.location || alert.sensorName}
                        </td>

                        {/* 3. KOLOM TINGKAT BADGE */}
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isDanger 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-[#FDF0E1] text-[#A05E1A] border border-[#F3D5B5]"
                          }`}>
                            {isDanger ? "Bahaya" : "Waspada"}
                          </span>
                        </td>

                        {/* 4. KOLOM AKSI SISTEM */}
                        <td className="py-4 px-6 text-slate-600 font-medium max-w-xs truncate">
                          {isDanger 
                            ? "Kipas menyala + WhatsApp ke manajer" 
                            : "Notifikasi dikirim ke manajer"}
                        </td>

                        {/* 5. KOLOM STATUS PENANGANAN */}
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide text-center min-w-[90px] ${
                            isResolved 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-[#FDF0E1] text-[#9A622D] border border-[#ECD1B4]"
                          }`}>
                            {isResolved ? "Selesai" : "Perlu perhatian"}
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

      </main>
    </div>
  );
}