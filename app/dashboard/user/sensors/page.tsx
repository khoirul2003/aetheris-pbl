"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientSensorModel, FirestoreSensor, LiveSensorData } from "@/models/clientSensorModel";
import { AlertTriangle, Check, RefreshCw, Radio } from "lucide-react";

export default function SensorsPage() {
  // Gunakan User ID sesuai data database Anda
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [sensors, setSensors] = useState<FirestoreSensor[]>([]);
  const [liveData, setLiveData] = useState<{ [sensorId: string]: LiveSensorData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil data statis sensor dari Firestore
  useEffect(() => {
    async function fetchSensors() {
      try {
        const fetchedSensors = await ClientSensorModel.getSensorsByUserId(userId);
        setSensors(fetchedSensors);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat konfigurasi area & sensor.");
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, [userId]);

  // 2. Dengarkan data live secara realtime dari Realtime Database
  useEffect(() => {
    if (sensors.length === 0) return;

    const unsubscribers = sensors.map((sensor) => {
      return ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
        setLiveData((prev) => ({
          ...prev,
          [sensor.id]: data,
        }));
      });
    });

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
    <div className="flex bg-[#FDFBF7] min-h-screen font-sans text-slate-800">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar role="user" userEmail="khoirul@email.com" />

      {/* NAVBAR */}
      <Navbar title="Area & Sensor" />

      {/* KONTEN UTAMA */}
      <main className="md:ml-64 pt-24 px-6 md:px-8 pb-8 w-full max-w-6xl mx-auto">
        
        {/* HEADER JUDUL HALAMAN */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Status Semua Area</h1>
            <p className="text-slate-500 text-xs mt-0.5">Daftar perangkat monitoring gas dan kondisi real-time dapur Anda.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <Radio size={14} className="text-emerald-600 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Monitoring</span>
          </div>
        </div>

        {sensors.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 text-sm">
            Belum ada area atau sensor yang terdaftar.
          </div>
        ) : (
          /* GRID RESPONSIVE - MENYESUAIKAN GAMBAR MOCKUP */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensors.map((sensor) => {
              const currentLive = liveData[sensor.id];
              
              // Mengambil status dari RTDB, jika belum ada gunakan default 'safe'
              const status = currentLive?.status || "safe";
              const isWarningOrDanger = status === "warning" || status === "danger";

              return (
                <div 
                  key={sensor.id} 
                  className={`border p-6 rounded-2xl transition-all shadow-sm flex flex-col justify-between h-full ${
                    status === "danger" ? "bg-red-50/60 border-red-200" : 
                    status === "warning" ? "bg-[#FDF0E1] border-[#F3D5B5]" : 
                    "bg-[#E9F2E4] border-[#D1E2C7]"
                  }`}
                >
                  {/* BARIS ATAS: IKON STATUS DAN LABEL BADGE */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWarningOrDanger ? "bg-[#FDF0E1] text-[#C67023]" : "bg-[#E9F2E4] text-[#4A6741]"
                      }`}>
                        {isWarningOrDanger ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 text-sm truncate">{sensor.id}</h3>
                        <p className="text-xs text-slate-500 truncate">{sensor.name} — {sensor.location}</p>
                      </div>
                    </div>

                    {/* BADGE STATUS */}
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black shrink-0 uppercase tracking-wider ${
                      status === "danger" ? "bg-red-100 text-red-700" :
                      status === "warning" ? "bg-[#FDF0E1] text-[#A05E1A]" : 
                      "bg-[#E9F2E4] text-[#4A6741]"
                    }`}>
                      {status === "safe" ? "Aman" : status === "warning" ? "Waspada" : "Bahaya"}
                    </span>
                  </div>

                  {/* BARIS TENGAH: DETAIL INDIKATOR LIVE */}
                  <div className="space-y-3 bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-slate-100/50 mb-4 flex-grow flex flex-col justify-center">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Kadar Gas:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.gas} PPM` : "-"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Suhu Ruangan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.temperature} °C` : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Kelembapan:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.humidity} %` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* BARIS BAWAH: STATUS PARAMETER AMBANG BATAS & KONEKSI */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-semibold tracking-wide">
                    <div>
                      <span>BATAS AMAN: &lt;{sensor.thresholds.warning} PPM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentLive?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      <span className="uppercase">{currentLive?.isOnline ? "Connected" : "Offline"}</span>
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