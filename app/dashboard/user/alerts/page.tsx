"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientAlertModel, AlertData } from "@/models/clientAlertModel";
import { RefreshCw } from "lucide-react";
import { Timestamp } from "firebase/firestore";

type FilterType = "semua" | "bahaya" | "waspada" | "belum_ditangani";

export default function AlertsPage() {
  // ID Pengguna utama sesuai data database Anda
  const currentUserId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("semua");

  // 1. Mendengarkan data log insiden secara real-time dari Firestore
  useEffect(() => {
    const unsubscribe = ClientAlertModel.subscribeToAlerts(currentUserId, (data) => {
      setAlerts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Logika Menghitung Angka Statistik di Atas Tab Tombol Kategori
  const countAll = alerts.length;
  const countBahaya = alerts.filter((a) => a.level === "danger").length;
  const countWaspada = alerts.filter((a) => a.level === "warning").length;
  const countBelumDitangani = alerts.filter((a) => !a.isResolved).length;

  // 3. Proses Filter Data untuk Ditampilkan di Tabel Sesuai Tab Aktif
  const filteredAlerts = alerts.filter((item) => {
    if (activeFilter === "bahaya") return item.level === "danger";
    if (activeFilter === "waspada") return item.level === "warning";
    if (activeFilter === "belum_ditangani") return !item.isResolved;
    return true;
  });

  // 4. Fungsi Format Waktu tanpa Tipe 'any' (Aman dari ESLint)
  const formatAlertTime = (timestamp: Timestamp | null) => {
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

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased font-sans">
      {/* KONTROL NAVIGASI KIRI */}
      <Sidebar role="user" userEmail="khoirul@email.com" />
      
      {/* BAR ATAS */}
      <Navbar title="Alert" />

      {/* KONTEN UTAMA */}
      <main className="md:ml-64 pt-20 px-6 md:px-8 pb-8 w-full max-w-5xl mx-auto">
        
        {/* TAB FILTER KATEGORI (ATAS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {(["semua", "bahaya", "waspada", "belum_ditangani"] as FilterType[]).map((filter) => {
            const label = filter === "semua" ? "Semua" : filter === "bahaya" ? "Bahaya" : filter === "waspada" ? "Waspada" : "Belum ditangani";
            const count = filter === "semua" ? countAll : filter === "bahaya" ? countBahaya : filter === "waspada" ? countWaspada : countBelumDitangani;
            
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  activeFilter === filter
                    ? "bg-white border-slate-400 font-bold text-slate-900 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-base font-black mt-0.5">({count})</p>
              </button>
            );
          })}
        </div>

        {/* CONTAINER TABEL DATA LOG ALERTS */}
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center bg-white">
                      <RefreshCw className="animate-spin text-amber-700 mx-auto mb-2" size={24} />
                      <p className="text-slate-400 font-medium text-[11px]">Menyelaraskan data log...</p>
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium bg-white">
                      Tidak ada rekaman data log peringatan untuk kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((item) => {
                    const isDanger = item.level === "danger";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. KOLOM FORMAT WAKTU */}
                        <td className="py-4 px-6 font-medium text-slate-500">{formatAlertTime(item.createdAt)}</td>
                        
                        {/* 2. KOLOM IDENTITAS LOKASI SENSOR */}
                        <td className="py-4 px-6 font-bold text-slate-900">{item.location || item.sensorName}</td>
                        
                        {/* 3. KOLOM BADGE STATUS INTENSITAS */}
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isDanger ? "bg-red-50 text-red-600 border border-red-100" : "bg-[#FDF0E1] text-[#A05E1A] border border-[#F3D5B5]"
                          }`}>
                            {isDanger ? "Bahaya" : "Waspada"}
                          </span>
                        </td>
                        
                        {/* 4. KOLOM LOGIKA DELEGASI RESPONS */}
                        <td className="py-4 px-6 text-slate-600 font-medium max-w-xs truncate">
                          {isDanger ? "Kipas menyala + WhatsApp ke manajer" : "Notifikasi dikirim ke manajer"}
                        </td>
                        
                        {/* 5. KOLOM AKSI: TOMBOL TANGANI DUA ARAH (Sudah Bebas Bentrok Nama) */}
                        <td className="py-4 px-6">
                          {item.isResolved ? (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide text-center min-w-[90px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Selesai
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                if (confirm("Apakah Anda sudah memeriksa area dapur dan memastikan kondisi kebocoran gas aman?")) {
                                  try {
                                    await ClientAlertModel.resolveAlert(item.id);
                                  } catch (err) {
                                    console.error(err);
                                    window.alert("Gagal memperbarui status penanganan.");
                                  }
                                }
                              }}
                              className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide text-center min-w-[90px] bg-[#FDF0E1] text-[#9A622D] border border-[#ECD1B4] hover:bg-emerald-600 hover:text-white hover:border-emerald-700 transition-all cursor-pointer shadow-sm active:scale-95 animate-pulse"
                            >
                              Tangani •
                            </button>
                          )}
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