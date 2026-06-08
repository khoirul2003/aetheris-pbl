"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { ClientSensorModel, FirestoreSensor, LiveSensorData } from "@/models/clientSensorModel";
import { AlertTriangle, Check, RefreshCw, Radio } from "lucide-react";

// Menyesuaikan struktur interface lokal dengan isi asli Firebase kamu
interface CustomLiveSensorData extends LiveSensorData {
  lpgLevel?: string;
  smokeLevel?: string;
}

export default function SensorsPage() {
  // ID Pengguna utama sesuai data database Anda
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [sensors, setSensors] = useState<FirestoreSensor[]>([]);
  const [liveData, setLiveData] = useState<{ [sensorId: string]: CustomLiveSensorData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Trik Hydration: Pastikan komponen sudah terpasang di browser
  const [isMounted, setIsMounted] = useState(false);

  // Efek untuk menandai bahwa komponen sudah berjalan di client side
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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
          [sensor.id]: data as CustomLiveSensorData,
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sensors]);

  // JIKA BELUM MOUNTED, KITA TAMPILKAN LOADING YANG SAMA DENGAN SSR
  // Ini mencegah ketidakcocokan HTML antara Server dan Client
  if (!isMounted) {
    return (
      <UserLayout 
        title="Area & Sensor" 
        description="Daftar perangkat monitoring gas dan kondisi real-time dapur Anda."
        userEmail="khoirul@email.com"
      >
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
            <p className="text-[#5B636B] font-semibold text-xs tracking-wide">Menghubungkan ke Sensor...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout 
      title="Area & Sensor" 
      description="Daftar perangkat monitoring gas dan kondisi real-time dapur Anda."
      userEmail="khoirul@email.com"
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin mx-auto" size={28} style={{ color: "var(--accent-primary)" }} />
            <p className="font-semibold text-xs tracking-wide" style={{ color: "var(--card-text-muted)" }}>Menghubungkan ke Sensor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 rounded-2xl text-red-600 dark:text-rose-400 font-bold text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* HEADER JUDUL AREA - Indikator Live Monitoring */}
          <div className="flex flex-row items-center justify-between gap-3 border p-4 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div>
              <h2 className="text-sm font-black tracking-tight uppercase" style={{ color: "var(--card-title)" }}>Status Semua Area</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--card-text-muted)" }}>Telemetri sensor terus diperbarui secara instan.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border rounded-full shrink-0 shadow-inner" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)" }}>
              <Radio size={14} className="animate-pulse" style={{ color: "var(--accent-primary)" }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Live</span>
            </div>
          </div>

          {sensors.length === 0 ? (
            <div className="border p-12 rounded-3xl text-center shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
              <p className="font-semibold" style={{ color: "var(--card-text-muted)" }}>Belum ada area atau sensor yang terdaftar untuk akun ini.</p>
            </div>
          ) : (
            /* GRID MONITORING KARTU SENSOR */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {sensors.map((sensor) => {
                const currentLive = liveData[sensor.id];
                
                // Validasi Online: Hanya True jika field isOnline dari Firebase bernilai true eksplisit
                const isDeviceOnline = !!currentLive?.isOnline;
                
                // Status alat berubah jadi offline abu-abu jika alat dimatikan
                const status = isDeviceOnline ? (currentLive?.status || "safe") : "offline";
                const isWarningOrDanger = status === "warning" || status === "danger";

                return (
                  <div 
                    key={sensor.id} 
                    className={`p-5 md:p-6 rounded-3xl transition-all shadow-sm flex flex-col justify-between h-full backdrop-blur-sm border`}
                    style={{
                      backgroundColor: status === "danger" ? "rgba(244, 63, 94, 0.05)" : status === "warning" ? "rgba(245, 158, 11, 0.05)" : status === "offline" ? "var(--card-surface)" : "var(--card-bg-solid)",
                      borderColor: status === "danger" ? "rgba(244, 63, 94, 0.2)" : status === "warning" ? "rgba(245, 158, 11, 0.2)" : "var(--card-surface-border)",
                      opacity: status === "offline" ? 0.75 : 1
                    }}
                  >
                    {/* BARIS ATAS: IDENTITY & BADGE */}
                    <div className="flex items-center justify-between mb-6 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}
                          style={{
                            backgroundColor: status === "offline" ? "var(--card-bg)" : isWarningOrDanger ? (status === "danger" ? "rgba(244, 63, 94, 0.1)" : "rgba(245, 158, 11, 0.1)") : "var(--accent-primary-hover)",
                            color: status === "offline" ? "var(--card-text-muted)" : isWarningOrDanger ? (status === "danger" ? "rgb(244, 63, 94)" : "rgb(245, 158, 11)") : "var(--accent-primary)"
                          }}
                        >
                          {status === "offline" ? <Radio size={18} /> : isWarningOrDanger ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-xs md:text-sm truncate uppercase tracking-tight" style={{ color: "var(--card-title)" }}>{sensor.id.toUpperCase()}</h3>
                          <p className="text-[11px] font-bold truncate tracking-wide" style={{ color: "var(--card-text-muted)" }}>{sensor.name} — {sensor.location}</p>
                        </div>
                      </div>

                      {/* LABEL STATUS BADGE */}
                      <span className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-xl text-[10px] md:text-xs font-black shrink-0 uppercase tracking-widest shadow-sm ${status === "danger" ? "animate-pulse" : ""}`}
                        style={{
                          backgroundColor: status === "danger" ? "rgb(244, 63, 94)" : status === "warning" ? "rgb(245, 158, 11)" : status === "offline" ? "var(--card-text-muted)" : "var(--accent-primary)",
                          color: "white"
                        }}
                      >
                        {status === "safe" ? "Aman" : status === "warning" ? "Waspada" : status === "danger" ? "Bahaya" : "Mati"}
                      </span>
                    </div>

                    {/* BARIS TENGAH: DETAIL PARAMETER TELEMETRI SENSOR */}
                    <div className="space-y-2.5 p-4 rounded-2xl border mb-5 flex-grow flex flex-col justify-center shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)" }}>
                      <div className="flex justify-between items-center text-xs md:text-sm">
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Kadar Gas Total:</span>
                        <span className={`font-mono font-black ${isWarningOrDanger ? "text-red-600 dark:text-rose-400 text-sm md:text-base" : ""}`} style={!isWarningOrDanger ? { color: "var(--card-title)" } : {}}>
                          {isDeviceOnline ? `${currentLive?.gas} PPM` : "-"}
                        </span>
                      </div>

                      {/* STATUS LPG LEVEL */}
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Status Kebocoran LPG:</span>
                        <span className={`font-black uppercase text-xs ${isDeviceOnline && currentLive?.lpgLevel !== "LOW" ? "text-amber-600 dark:text-amber-400" : ""}`} style={!(isDeviceOnline && currentLive?.lpgLevel !== "LOW") ? { color: "var(--card-text)" } : {}}>
                          {isDeviceOnline ? (currentLive?.lpgLevel || "LOW") : "-"}
                        </span>
                      </div>

                      {/* STATUS SMOKE LEVEL */}
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Kondisi Kepekatan Asap:</span>
                        <span className={`font-black uppercase text-xs ${isDeviceOnline && currentLive?.smokeLevel !== "CLEAR" ? "text-red-600 dark:text-rose-400" : ""}`} style={!(isDeviceOnline && currentLive?.smokeLevel !== "CLEAR") ? { color: "var(--card-text)" } : {}}>
                          {isDeviceOnline ? (currentLive?.smokeLevel || "CLEAR") : "-"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Suhu Ruangan:</span>
                        <span className="font-mono font-bold" style={{ color: "var(--card-title)" }}>
                          {isDeviceOnline ? `${currentLive?.temperature} °C` : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Kelembapan:</span>
                        <span className="font-mono font-bold" style={{ color: "var(--card-title)" }}>
                          {isDeviceOnline ? `${currentLive?.humidity} %` : "-"}
                        </span>
                      </div>
                    </div>

                    {/* BARIS BAWAH: METRICS THRESHOLD & ONLINE STATUS */}
                    <div className="pt-4 border-t flex items-center justify-between text-[9px] md:text-[10px] font-bold tracking-widest gap-1" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text-faint)" }}>
                      <div className="truncate uppercase">
                        <span>Batas Aman: &lt; {sensor.thresholds?.warning || 200} PPM</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md border" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isDeviceOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span className={`uppercase font-black ${isDeviceOnline ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {isDeviceOnline ? "Connected" : "Offline"}
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