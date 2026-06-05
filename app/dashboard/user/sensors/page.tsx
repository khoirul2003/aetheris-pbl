"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
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

  return (
    <UserLayout 
      title="Area & Sensor" 
      description="Daftar perangkat monitoring gas dan kondisi real-time dapur Anda."
      userEmail="khoirul@email.com"
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
            <p className="text-[#5B636B] font-semibold text-xs tracking-wide">Menghubungkan ke Sensor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* HEADER JUDUL AREA - Indikator Live Monitoring */}
          <div className="flex flex-row items-center justify-between gap-3 bg-white/60 backdrop-blur border border-slate-200/70 p-4 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">Status Semua Area</h2>
              <p className="text-slate-500 text-xs mt-0.5">Telemetri sensor terus diperbarui secara instan.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shrink-0 shadow-inner">
              <Radio size={14} className="text-emerald-600 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live</span>
            </div>
          </div>

          {sensors.length === 0 ? (
            <div className="bg-white/80 backdrop-blur border border-slate-200/70 p-12 rounded-3xl text-center shadow-xs">
              <p className="text-slate-500 font-semibold">Belum ada area atau sensor yang terdaftar untuk akun ini.</p>
            </div>
          ) : (
            /* GRID MONITORING KARTU SENSOR (Otomatis meregang) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {sensors.map((sensor) => {
                const currentLive = liveData[sensor.id];
                const status = currentLive?.status || "safe";
                const isWarningOrDanger = status === "warning" || status === "danger";

                return (
                  <div 
                    key={sensor.id} 
                    className={`p-5 md:p-6 rounded-3xl transition-all shadow-sm flex flex-col justify-between h-full backdrop-blur-sm border ${
                      status === "danger" ? "bg-red-50/90 border-red-200 shadow-red-100/50" : 
                      status === "warning" ? "bg-[#FDF0E1]/90 border-[#F3D5B5]" : 
                      "bg-white/80 border-slate-200/70"
                    }`}
                  >
                    {/* BARIS ATAS: IDENTITY & BADGE */}
                    <div className="flex items-center justify-between mb-6 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                          isWarningOrDanger 
                            ? (status === "danger" ? "bg-red-100 text-red-600" : "bg-[#F3D5B5] text-[#C67023]") 
                            : "bg-[#EAF2EB] text-[#4D6344]"
                        }`}>
                          {isWarningOrDanger ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{sensor.id}</h3>
                          <p className="text-[11px] text-slate-500 font-bold truncate tracking-wide">{sensor.name} — {sensor.location}</p>
                        </div>
                      </div>

                      {/* LABEL STATUS BADGE */}
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 uppercase tracking-widest shadow-sm ${
                        status === "danger" ? "bg-red-500 text-white animate-pulse" :
                        status === "warning" ? "bg-[#9A622D] text-white" : 
                        "bg-[#4D6344] text-white"
                      }`}>
                        {status === "safe" ? "Aman" : status === "warning" ? "Waspada" : "Bahaya"}
                      </span>
                    </div>

                    {/* BARIS TENGAH: DETAIL PARAMETER TELEMETRI SENSOR */}
                    <div className="space-y-3 bg-white/70 p-4 rounded-2xl border border-slate-100 mb-5 flex-grow flex flex-col justify-center shadow-inner">
                      <div className="flex justify-between items-center text-xs md:text-sm">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Kadar Gas</span>
                        <span className={`font-mono font-black ${isWarningOrDanger ? "text-red-600 text-base" : "text-slate-800"}`}>
                          {currentLive ? `${currentLive.gas} PPM` : "-"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs md:text-sm">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Suhu Ruangan</span>
                        <span className="font-mono font-bold text-slate-800">
                          {currentLive ? `${currentLive.temperature} °C` : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs md:text-sm">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Kelembapan</span>
                        <span className="font-mono font-bold text-slate-800">
                          {currentLive ? `${currentLive.humidity} %` : "-"}
                        </span>
                      </div>
                    </div>

                    {/* BARIS BAWAH: METRICS THRESHOLD & ONLINE STATUS */}
                    <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-widest gap-1">
                      <div className="truncate uppercase">
                        <span>Batas Aman: &lt; {sensor.thresholds.warning} PPM</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 bg-white/60 px-2 py-1 rounded-md border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${currentLive?.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
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
        </div>
      )}
    </UserLayout>
  );
}