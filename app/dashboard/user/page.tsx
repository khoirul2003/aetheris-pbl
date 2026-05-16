"use client";

import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useEffect, useState } from "react";
import { 
  AlertTriangle,
  Loader2,
  Check,
  BellRing,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Interface untuk Type Safety (Menghilangkan error @typescript-eslint/no-explicit-any)
interface ZoneStatus {
  value: number;
  status: string;
  lastUpdate: string;
}

interface ZonesDataMap {
  [key: string]: ZoneStatus;
}

const ZONES = [
  { id: "Kompor utama", desc: "Area memasak kiri" },
  { id: "Kompor kanan", desc: "Area memasak kanan" },
  { id: "Gudang tabung gas", desc: "Ruang penyimpanan" },
  { id: "Area exhaust", desc: "Plafon dekat kipas" }
];

const chartData = [
  { time: '08:00', utama: 80, kanan: 60 },
  { time: '09:00', utama: 90, kanan: 70 },
  { time: '10:00', utama: 100, kanan: 80 },
  { time: '11:00', utama: 280, kanan: 120 },
  { time: '12:00', utama: 160, kanan: 200 },
  { time: '13:00', utama: 140, kanan: 250 },
  { time: '14:00', utama: 145, kanan: 280 },
];

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [zonesData, setZonesData] = useState<ZonesDataMap>(() => {
    const initialState: ZonesDataMap = {};
    ZONES.forEach(zone => {
      initialState[zone.id] = { value: 0, status: "Memuat...", lastUpdate: "-" };
    });
    return initialState;
  });

  // 1. Auth Checker
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Data Fetcher dari Firebase
  useEffect(() => {
    if (loadingAuth || !user) return;

    const unsubscribes = ZONES.map((zone) => {
      const q = query(
        collection(db, "gas_readings"),
        where("restaurantId", "==", user.uid),
        where("zoneName", "==", zone.id),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const time = data.timestamp?.toDate();
          
          setZonesData((prev: ZonesDataMap) => ({
            ...prev,
            [zone.id]: {
              value: data.value,
              status: data.status,
              lastUpdate: time ? time.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"
            }
          }));
        } else {
          // Fallback data jika belum ada di database
          const dummyStatus = zone.id === "Kompor kanan" ? "WASPADA" : "AMAN";
          setZonesData((prev: ZonesDataMap) => ({
            ...prev,
            [zone.id]: { value: dummyStatus === "WASPADA" ? 280 : 140, status: dummyStatus, lastUpdate: "14:32" }
          }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, loadingAuth]);

  const getOverallStatus = () => {
    const statuses = Object.values(zonesData).map((d: ZoneStatus) => d.status);
    if (statuses.includes("BAHAYA")) return "Bahaya";
    if (statuses.includes("WASPADA")) return "Waspada";
    return "Aman";
  };

  const overallStatus = getOverallStatus();
  const warningCount = Object.values(zonesData).filter((d: ZoneStatus) => d.status === "WASPADA" || d.status === "BAHAYA").length;
  const connectedCount = Object.values(zonesData).filter((d: ZoneStatus) => d.status !== "Memuat..." && d.status !== "BELUM ADA DATA").length;

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mr-3" size={32} />
        <span className="font-bold text-slate-600">Memuat Sistem Keamanan...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-slate-500">Silakan login terlebih dahulu untuk memantau dapur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen font-sans text-slate-800">
      
      {/* Perbaikan Props Sidebar */}
      <Sidebar role="user" userEmail={user.email ?? ""} />

      {/* Perbaikan Props Navbar */}
      <Navbar title="Beranda" />

      <main className="md:ml-64 pt-24 px-6 md:px-8 pb-8 w-full max-w-6xl mx-auto">
        
        {/* WARNING BANNER */}
        {(overallStatus === "Waspada" || overallStatus === "Bahaya") && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm">
            <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="text-orange-800 font-medium text-sm leading-relaxed">
                <span className="font-bold">Perhatian!</span> Kompor kanan mendekati batas aman. Pastikan ventilasi dapur terbuka dan periksa selang gas.
              </p>
            </div>
          </div>
        )}

        {/* TOP STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#F6F5F2] border border-transparent p-5 rounded-xl">
            <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Kondisi Dapur</p>
            <h2 className={`text-2xl font-black mb-1 ${overallStatus === 'Waspada' ? 'text-[#C67023]' : overallStatus === 'Bahaya' ? 'text-red-600' : 'text-[#4A6741]'}`}>
              {overallStatus}
            </h2>
            <p className="text-slate-500 text-xs font-medium">{warningCount > 0 ? `${warningCount} area perlu cek` : 'Semua area aman'}</p>
          </div>
          <div className="bg-[#F6F5F2] border border-transparent p-5 rounded-xl">
            <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Sensor Aktif</p>
            <h2 className="text-2xl font-black text-slate-800 mb-1">{connectedCount} <span className="text-lg text-slate-500">/ {ZONES.length}</span></h2>
            <p className="text-slate-500 text-xs font-medium">Semua terhubung</p>
          </div>
          <div className="bg-[#F6F5F2] border border-transparent p-5 rounded-xl">
            <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Alert Hari Ini</p>
            <h2 className="text-2xl font-black text-slate-800 mb-1">3 <span className="text-lg text-slate-500">kali</span></h2>
            <p className="text-slate-500 text-xs font-medium">1 belum ditangani</p>
          </div>
          <div className="bg-[#F6F5F2] border border-transparent p-5 rounded-xl">
            <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Terakhir Dicek</p>
            <h2 className="text-2xl font-black text-slate-800 mb-1">14:32</h2>
            <p className="text-slate-500 text-xs font-medium">Hari ini</p>
          </div>
        </div>

        {/* MIDDLE ROW: STATUS & MAP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-6 flex items-center gap-2">
              Status Semua Area
            </h3>
            <div className="space-y-0 flex-grow">
              {ZONES.map((zone, index) => {
                const status = zonesData[zone.id].status;
                const isWarning = status === "WASPADA" || status === "BAHAYA";
                return (
                  <div key={zone.id} className={`flex items-center justify-between py-4 ${index !== ZONES.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWarning ? 'bg-[#FDF0E1] text-[#C67023]' : 'bg-[#E9F2E4] text-[#4A6741]'}`}>
                        {isWarning ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{zone.id}</p>
                        <p className="text-xs text-slate-500 truncate">{zone.desc}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 ${isWarning ? 'bg-[#FDF0E1] text-[#A05E1A]' : 'bg-[#E9F2E4] text-[#4A6741]'}`}>
                      {status === "Memuat..." ? "Aman" : status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PETA ZONA DAPUR (Dikembalikan) */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-6">Peta Zona Dapur</h3>
            <div className="bg-[#F6F5F2] p-5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4 flex-grow items-center">
              {ZONES.map((zone) => {
                const status = zonesData[zone.id].status;
                const isWarning = status === "WASPADA" || status === "BAHAYA";
                return (
                  <div key={zone.id} className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center h-28 transition-all ${isWarning ? 'bg-[#FDF0E1] border-[#F3D5B5]' : 'bg-[#E9F2E4] border-[#D1E2C7]'}`}>
                    <p className={`font-bold text-xs mb-3 line-clamp-2 ${isWarning ? 'text-[#99551A]' : 'text-[#4A6741]'}`}>
                      {zone.id}
                      {isWarning && <span className="block text-[10px] opacity-80 font-normal mt-0.5">! Waspada</span>}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isWarning ? 'bg-[#F59E0B]' : 'bg-[#558B2F]'}`}></div>
                      {!isWarning && <span className="text-[10px] font-bold text-[#4A6741]">Aman</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: CHART & ALERTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">Grafik Tren Gas Hari Ini</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} ticks={[0, 200, 400]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="linear" dataKey="kanan" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="linear" dataKey="utama" stroke="#558B2F" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ALERT TERBARU (Dikembalikan) */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[350px]">
            <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">Alert Terbaru</h3>
            <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
              <div className="flex gap-4 relative py-2 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#FDF0E1] text-[#C67023] flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="w-full pb-2">
                  <p className="text-sm font-bold text-slate-800 leading-snug mb-1">Kompor kanan mendekati batas aman</p>
                  <p className="text-xs text-slate-500">14:32 — <span className="text-[#A05E1A] font-semibold">Belum ditangani</span></p>
                </div>
              </div>
              <div className="flex gap-4 relative py-2 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <BellRing size={18} />
                </div>
                <div className="w-full pb-2">
                  <p className="text-sm font-bold text-slate-800 leading-snug mb-1">Gas terdeteksi tinggi di kompor utama. Kipas otomatis menyala.</p>
                  <p className="text-xs text-slate-500">11:07 — <span className="text-[#4A6741] font-semibold">Selesai</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}