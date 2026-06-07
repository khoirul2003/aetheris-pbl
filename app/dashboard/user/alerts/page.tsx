"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
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

  return (
    <UserLayout 
      title="Alerts & Notifikasi" 
      description="Pantau log insiden dan tangani peringatan kendala dari sensor dapur Anda."
      userEmail="khoirul@email.com"
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
            <p className="text-[#5B636B] font-semibold text-xs tracking-wide">Menyelaraskan data log...</p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* TAB FILTER KATEGORI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <button
              onClick={() => setActiveFilter("semua")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "semua"
                  ? "bg-white border-[#4D6344]/30 text-[#4D6344] shadow-sm ring-1 ring-[#4D6344]/10"
                  : "bg-white/60 backdrop-blur border-slate-200/70 text-slate-500 hover:bg-white"
              }`}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Semua</p>
              <p className="text-lg md:text-xl font-black mt-1">({countAll})</p>
            </button>

            <button
              onClick={() => setActiveFilter("bahaya")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "bahaya"
                  ? "bg-red-50 border-red-200 text-red-700 shadow-sm ring-1 ring-red-100"
                  : "bg-white/60 backdrop-blur border-slate-200/70 text-slate-500 hover:bg-white"
              }`}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Bahaya</p>
              <p className="text-lg md:text-xl font-black mt-1">({countBahaya})</p>
            </button>

            <button
              onClick={() => setActiveFilter("waspada")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "waspada"
                  ? "bg-[#FDF0E1] border-[#F3D5B5] text-[#A05E1A] shadow-sm ring-1 ring-orange-100"
                  : "bg-white/60 backdrop-blur border-slate-200/70 text-slate-500 hover:bg-white"
              }`}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Waspada</p>
              <p className="text-lg md:text-xl font-black mt-1">({countWaspada})</p>
            </button>

            <button
              onClick={() => setActiveFilter("belum_ditangani")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeFilter === "belum_ditangani"
                  ? "bg-slate-800 border-slate-700 text-white shadow-sm"
                  : "bg-white/60 backdrop-blur border-slate-200/70 text-slate-500 hover:bg-white"
              }`}
            >
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Belum ditangani</p>
              <p className="text-lg md:text-xl font-black mt-1">({countBelumDitangani})</p>
            </button>
          </div>

          {/* CONTAINER TABEL DATA LOG ALERTS */}
          <div className="bg-white/80 backdrop-blur border border-slate-200/70 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-5 px-4 md:px-6 hidden sm:table-cell">Waktu</th>
                    <th className="py-5 px-4 md:px-6">Lokasi / Sektor</th>
                    <th className="py-5 px-4 md:px-6">Tingkat</th>
                    <th className="py-5 px-4 md:px-6 hidden lg:table-cell">Yang dilakukan sistem</th>
                    <th className="py-5 px-4 md:px-6 text-center">Aksi / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 size={36} className="text-emerald-400 mb-2" />
                          <p className="text-slate-800 font-bold text-base">Tidak ada peringatan.</p>
                          <p className="text-slate-500 text-sm">Semua kondisi operasional dapur terpantau aman.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const isDanger = alert.level === "danger";
                      const isResolved = alert.isResolved;

                      return (
                        <tr key={alert.id} className="hover:bg-white transition-colors">
                          <td className="py-5 px-4 md:px-6 font-semibold text-slate-500 whitespace-nowrap hidden sm:table-cell">
                            {formatAlertTime(alert.createdAt)}
                          </td>

                          <td className="py-5 px-4 md:px-6 font-bold text-slate-900">
                            <span className="block truncate">{alert.location || alert.sensorName}</span>
                            <span className="block sm:hidden text-[11px] font-semibold text-slate-400 mt-1">
                              {formatAlertTime(alert.createdAt)}
                            </span>
                          </td>

                          <td className="py-5 px-4 md:px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest ${
                              isDanger 
                                ? "bg-red-50 text-red-600 border border-red-100" 
                                : "bg-[#FDF0E1] text-[#A05E1A] border border-[#F3D5B5]"
                            }`}>
                              {isDanger ? "Bahaya" : "Waspada"}
                            </span>
                          </td>

                          <td className="py-5 px-4 md:px-6 font-medium truncate hidden lg:table-cell">
                            {isDanger 
                              ? `${alert.message} (Kipas Aktif)` 
                              : alert.message}
                          </td>

                          <td className="py-5 px-4 md:px-6 text-center whitespace-nowrap">
                            <div className="flex justify-center items-center">
                              {isResolved ? (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 min-w-[100px] md:min-w-[110px] justify-center">
                                  <CheckCircle2 size={16} /> Selesai
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleResolve(alert.id)}
                                  disabled={resolvingId === alert.id}
                                  className="px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-sm active:scale-95 flex items-center gap-2 min-w-[100px] md:min-w-[110px] justify-center cursor-pointer border-none"
                                >
                                  {resolvingId === alert.id ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" /> Proses
                                    </>
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

        </div>
      )}
    </UserLayout>
  );
}