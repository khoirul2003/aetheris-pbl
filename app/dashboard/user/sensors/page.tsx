"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { db, rtdb } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { AlertTriangle, Check, RefreshCw, Radio, Flame, ShieldAlert } from "lucide-react";

// Kontrak Interface yang aman dari ESLint Linting
interface FirestoreSensor {
  id: string;
  userId: string;
  name: string;
  location: string;
  thresholds: {
    safe: number;
    warning: number;
    danger: number;
  };
}

interface LiveSensorData {
  gas: number;
  temperature: number;
  humidity: number;
  status: string;
  lpgLevel?: string;
  smokeLevel?: string;
  isOnline: boolean;
}

export default function SensorsPage() {
  const currentUserId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [sensors, setSensors] = useState<FirestoreSensor[]>([]);
  const [liveData, setLiveData] = useState<Record<string, LiveSensorData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil data konfigurasi sensor dari Firestore secara Real-Time
  useEffect(() => {
    const sensorsRef = collection(db, "sensors");
    const q = query(sensorsRef, where("userId", "==", currentUserId));

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const fetchedSensors: FirestoreSensor[] = [];
      snapshot.forEach((doc) => {
        fetchedSensors.push({ id: doc.id, ...doc.data() } as FirestoreSensor);
      });
      setSensors(fetchedSensors);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Gagal menyelaraskan konfigurasi sensor.");
      setLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [currentUserId]);

  // 2. Dengarkan data telemetri live terintegrasi dari Realtime Database
  useEffect(() => {
    const liveRef = ref(rtdb, "sensorLive");
    
    onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveData(snapshot.val() as Record<string, LiveSensorData>);
      }
    });

    return () => {
      off(liveRef);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={32} />
          <p className="text-slate-600 font-medium text-sm"> Sinkronisasi Frekuensi Node...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center p-6 border border-red-200 bg-white rounded-2xl">
          <p className="text-red-500 font-bold text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen font-sans text-slate-800 antialiased">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      <Navbar title="Area & Sensor" />

      <main className="md:ml-64 pt-24 px-6 md:px-8 pb-8 w-full max-w-6xl mx-auto">
        
        {/* HEADER HALAMAN */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Status Semua Area</h1>
            <p className="text-slate-500 text-xs mt-0.5">Pemantauan real-time sirkulasi, kadar gas LPG, dan kepulan asap dapur.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <Radio size={12} className="text-emerald-600 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Live MCU Node</span>
          </div>
        </div>

        {sensors.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 text-xs font-semibold">
            Belum ada area atau modul sensor hardware yang terdaftar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensors.map((sensor) => {
              const currentLive = liveData[sensor.id];
              const status = currentLive?.status || "safe";
              const isWarningOrDanger = status === "warning" || status === "danger";

              return (
                <div 
                  key={sensor.id} 
                  className={`border p-6 rounded-2xl transition-all shadow-sm flex flex-col justify-between h-full bg-white ${
                    status === "danger" ? "border-red-200 bg-red-50/20" : 
                    status === "warning" ? "border-amber-200 bg-[#FDF0E1]/40" : "border-slate-100"
                  }`}
                >
                  {/* BARIS ATAS: KARTU IDENTITAS SENSOR */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isWarningOrDanger ? "bg-red-50 text-red-500" : "bg-[#E9F2E4] text-[#4A6741]"
                      }`}>
                        {isWarningOrDanger ? <AlertTriangle size={16} /> : <Check size={16} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-xs uppercase font-mono tracking-wide">{sensor.id}</h3>
                        <p className="text-[11px] font-bold text-slate-700 truncate">{sensor.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{sensor.location}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      status === "danger" ? "bg-red-100 text-red-700" :
                      status === "warning" ? "bg-[#FDF0E1] text-[#A05E1A]" : "bg-[#E9F2E4] text-[#4A6741]"
                    }`}>
                      {status === "safe" ? "Aman" : status === "warning" ? "Waspada" : "Bahaya"}
                    </span>
                  </div>

                  {/* BARIS TENGAH: PARAMETER DARI ARDUINO */}
                  <div className="space-y-2.5 bg-slate-50/60 p-4 rounded-xl border border-slate-100/70 mb-4 flex-grow flex flex-col justify-center">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Kadar Gas Mentah:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLive ? `${currentLive.gas} PPM` : "-"}
                      </span>
                    </div>

                    {/* PENAMBAHAN DINAMIS: PARAMETER LPG LEVEL */}
                    <div className="flex justify-between items-center text-xs border-t border-slate-100/50 pt-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Flame size={12} className="text-orange-500" /> Kepadatan LPG:
                      </span>
                      <span className="font-mono font-black text-slate-900 text-[11px]">
                        {currentLive?.lpgLevel || "LOW"}
                      </span>
                    </div>

                    {/* PENAMBAHAN DINAMIS: PARAMETER SMOKE LEVEL */}
                    <div className="flex justify-between items-center text-xs border-t border-slate-100/50 pt-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <ShieldAlert size={12} className="text-slate-500" /> Tingkat Asap:
                      </span>
                      <span className="font-mono font-black text-slate-900 text-[11px]">
                        {currentLive?.smokeLevel || "CLEAR"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs border-t border-slate-100/50 pt-2">
                      <span className="text-slate-500 font-semibold">Suhu & Kelembapan:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {currentLive ? `${currentLive.temperature}°C / ${currentLive.humidity}%` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* BARIS BAWAH: DATA AMBANG BATAS HARDWARE */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wide">
                    <div>
                      <span>BATAS WARNING: {sensor.thresholds.warning} PPM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentLive?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                      <span className="text-[9px] uppercase font-black">{currentLive?.isOnline ? "Online" : "Offline"}</span>
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