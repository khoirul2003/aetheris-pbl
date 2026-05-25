"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientSensorModel, FirestoreSensor, LiveSensorData } from "@/models/clientSensorModel";
import { AlertTriangle, Check, RefreshCw, Radio } from "lucide-react";

export default function SensorsPage() {
  // ID Pengguna utama sesuai data database Anda
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [sensors, setSensors] = useState<FirestoreSensor[]>([]);
  const [liveData, setLiveData] = useState<{ [sensorId: string]: LiveSensorData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil data konseptual statis sensor dari Firestore
  useEffect(() => {
    async function fetchSensors() {
      try {
        const fetchedSensors = await ClientSensorModel.getSensorsByUserId(userId);
        setSensors(fetchedSensors);
      } catch (err) {
        console.error("Gagal memuat profil koleksi sensor:", err);
        setError("Gagal memuat konfigurasi area & sensor.");
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, [userId]);

  // 2. Dengarkan data live telemetri dari Realtime Database
  useEffect(() => {
    if (sensors.length === 0) return;

    // Membuka jembatan pemantauan terpisah untuk masing-masing sensor secara paralel
    const unsubscribers = sensors.map((sensor) => {
      return ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
        setLiveData((prev) => ({
          ...prev,
          [sensor.id]: data,
        }));
      });
    });

    // Jalankan fungsi pembersihan koneksi saat user berpindah halaman
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sensors]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={32} />
          <p className="text-slate-600 font-medium text-sm">Menghubungkan ke Sensor...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen font-sans text-slate-800 antialiased overflow-x-hidden">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar role="user" userEmail="khoirul@email.com" />

      {/* NAVBAR */}
      <Navbar title="Area & Sensor" />

      {/* KONTEN UTAMA - PERBAIKAN: Jarak padding bawah diatur pb-24 untuk mobile */}
      <main className="md:ml-64 pt-24 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-6xl mx-auto box-border">
        
        {/* HEADER JUDUL HALAMAN - PERBAIKAN: flex-row diatur flex-wrap agar tidak luput layar kecil */}
        <div className="mb-6 flex flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Status Semua Area</h1>
            <p className="text-slate-500 text-[11px] md:text-xs mt-0.5">Daftar perangkat monitoring gas dan kondisi real-time dapur Anda.</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full shrink-0">
            <Radio size={12} className="text-emerald-600 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Monitoring</span>
          </div>
        </div>

        {sensors.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 text-sm">
            Belum ada area atau sensor yang terdaftar untuk akun ini.
          </div>
        ) : (
          /* GRID MONITORING KARTU SENSOR - PERBAIKAN: grid-cols-1 untuk HP, md:grid-cols-2 untuk laptop */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {sensors.map((sensor) => {
              const currentLive = liveData[sensor.id];
              
              // Mengambil status realtime, default ke aman jika alat belum aktif
              const status = currentLive?.status || "safe";
              const isWarningOrDanger = status === "warning" || status === "danger";

              return (
                <div 
                  key={sensor.id} 
                  className={`border p-5 md:p-6 rounded-2xl transition-all shadow-sm flex flex-col justify-between h-full ${
                    status === "danger" ? "bg-red-50/60 border-red-200 shadow-red-100/50" : 
                    status === "warning" ? "bg-[#FDF0E1] border-[#F3D5B5]" : 
                    "bg-[#E9F2E4] border-[#D1E2C7]"
                  }`}
                >
                  {/* BARIS ATAS: IDENTITY & BADGE */}
                  <div className="flex items-center justify-between mb-5 md:mb-6 gap-2">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWarningOrDanger 
                          ? (status === "danger" ? "bg-red-100 text-red-600" : "bg-[#F3D5B5] text-[#C67023]") 
                          : "bg-[#D1E2C7] text-[#4A6741]"
                      }`}>
                        {isWarningOrDanger ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 text-xs md:text-sm truncate">{sensor.id.toUpperCase()}</h3>
                        <p className="text-[11px] md:text-xs text-slate-500 font-medium truncate">{sensor.name} — {sensor.location}</p>
                      </div>
                    </div>

                    {/* LABEL STATUS BADGE */}
                    <span className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-black shrink-0 uppercase tracking-wider ${
                      status === "danger" ? "bg-red-500 text-white animate-pulse" :
                      status === "warning" ? "bg-[#9A622D] text-white" : 
                      "bg-[#4A6741] text-white"
                    }`}>
                      {status === "safe" ? "Aman" : status === "warning" ? "Waspada" : "Bahaya"}
                    </span>
                  </div>

                  {/* BARIS TENGAH: DETAIL PARAMETER TELEMETRI SENSOR */}
                  <div className="space-y-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-100/50 mb-4 flex-grow flex flex-col justify-center shadow-inner">
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-500 font-semibold">Kadar Gas:</span>
                      <span className={`font-mono font-black ${isWarningOrDanger ? "text-red-600 text-sm md:text-base" : "text-slate-800"}`}>
                        {currentLive ? `${currentLive.gas} PPM` : "-"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-500 font-semibold">Suhu Ruangan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.temperature} °C` : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-slate-500 font-semibold">Kelembapan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.humidity} %` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* BARIS BAWAH: METRICS THRESHOLD & ONLINE STATUS */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 font-bold tracking-wide gap-1">
                    <div className="truncate">
                      <span>BATAS AMAN: &lt; {sensor.thresholds.warning} PPM</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${currentLive?.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`uppercase font-black ${currentLive?.isOnline ? "text-emerald-600" : "text-slate-400"}`}>
                        {currentLive?.isOnline ? "Connected" : "Offline"}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}