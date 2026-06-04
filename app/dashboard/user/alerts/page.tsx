"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { RefreshCw, CheckCircle2, Loader2 } from "lucide-react";

type FilterType = "semua" | "bahaya" | "waspada" | "belum_ditangani";

export default function AlertsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("semua");

  useEffect(() => {
    const unsubscribe = ClientAlertModel.subscribeToAlerts(userId, (data) => {
      setAlerts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  // Fungsi aksi eksekusi penanganan tombol klik
  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await ClientAlertModel.resolveAlertById(alertId);
    } catch (err) {
      console.error("Gagal mereset insiden:", err);
      alert("Gagal memproses penanganan kendala dapur.");
    } finally {
      setResolvingId(null);
    }
  };

  const countAll = alerts.length;
  const countBahaya = alerts.filter((a) => a.level === "danger").length;
  const countWaspada = alerts.filter((a) => a.level === "warning").length;
  const countBelumDitangani = alerts.filter((a) => !a.isResolved).length;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === "bahaya") return alert.level === "danger";
    if (activeFilter === "waspada") return alert.level === "warning";
    if (activeFilter === "belum_ditangani") return !alert.isResolved;
    return true;
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
      return `${days[date.getDay()]} ${timeString}`;
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
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased overflow-x-hidden">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      

      {/* PERBAIKAN: Padding bawah pb-24 agar baris akhir tidak tertutup bottom nav mobile */}
      <main className="md:ml-64 pt-24 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-6xl mx-auto box-border">
        
        {/* TAB FILTER KATEGORI: grid-cols-2 untuk mobile, sm:grid-cols-4 untuk desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setActiveFilter("semua")}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              activeFilter === "semua"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Semua</p>
            <p className="text-sm md:text-base font-black mt-0.5">({countAll})</p>
          </button>

          <button
            onClick={() => setActiveFilter("bahaya")}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              activeFilter === "bahaya"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Bahaya</p>
            <p className="text-sm md:text-base font-black mt-0.5">({countBahaya})</p>
          </button>

          <button
            onClick={() => setActiveFilter("waspada")}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              activeFilter === "waspada"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Waspada</p>
            <p className="text-sm md:text-base font-black mt-0.5">({countWaspada})</p>
          </button>

          <button
            onClick={() => setActiveFilter("belum_ditangani")}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              activeFilter === "belum_ditangani"
                ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Belum ditangani</p>
            <p className="text-sm md:text-base font-black mt-0.5">({countBelumDitangani})</p>
          </button>
        </div>

        {/* CONTAINER TABEL DATA LOG ALERTS */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 md:px-6 hidden sm:table-cell">Waktu</th>
                  <th className="py-4 px-4 md:px-6">Lokasi / Sektor</th>
                  <th className="py-4 px-4 md:px-6">Tingkat</th>
                  <th className="py-4 px-4 md:px-6 hidden lg:table-cell">Yang dilakukan sistem</th>
                  <th className="py-4 px-4 md:px-6 text-center">Aksi / Status</th>
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
                        {/* Waktu Desktop */}
                        <td className="py-4 px-4 md:px-6 font-medium text-slate-500 whitespace-nowrap hidden sm:table-cell">
                          {formatAlertTime(alert.createdAt)}
                        </td>

                        {/* Lokasi + Waktu Tambahan khusus Mobile */}
                        <td className="py-4 px-4 md:px-6 font-bold text-slate-900">
                          <span className="block truncate">{alert.location || alert.sensorName}</span>
                          <span className="block sm:hidden text-[10px] font-medium text-slate-400 mt-0.5">
                            {formatAlertTime(alert.createdAt)}
                          </span>
                        </td>

                        <td className="py-4 px-4 md:px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isDanger 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-[#FDF0E1] text-[#A05E1A] border border-[#F3D5B5]"
                          }`}>
                            {isDanger ? "Bahaya" : "Waspada"}
                          </span>
                        </td>

                        {/* Yang dilakukan sistem (Disembunyikan di Mobile/Tablet, hanya muncul di Layar Lebar) */}
                        <td className="py-4 px-4 md:px-6 text-slate-600 font-medium max-w-xs truncate hidden lg:table-cell">
                          {isDanger 
                            ? `${alert.message} (Kipas Aktif)` 
                            : alert.message}
                        </td>

                        {/* KOLOM AKSI STATUS PENANGANAN - TOMBOL DINAMIS REAKTIF */}
                        <td className="py-4 px-4 md:px-6 text-center whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            {isResolved ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 min-w-[90px] md:min-w-[100px] justify-center">
                                <CheckCircle2 size={12} /> Selesai
                              </span>
                            ) : (
                              <button
                                onClick={() => handleResolve(alert.id)}
                                disabled={resolvingId === alert.id}
                                className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black uppercase tracking-wider text-[10px] transition-all shadow-sm shadow-orange-200 active:scale-95 flex items-center gap-1 min-w-[90px] md:min-w-[100px] justify-center cursor-pointer border-none"
                              >
                                {resolvingId === alert.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  "Tangani"
                                )}
                              </button>
                            )}
                          </div>
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