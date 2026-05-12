"use client";

import Sidebar from "@/app/components/Sidebar"; // Import Sidebar asli dari file terpisah
import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle,
  XCircle, 
  MapPin, 
  PhoneCall, 
  FileText,
  Clock,
  Wind,
  Loader2,
  Fan,
  Activity
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const ZONES = ["Dapur Utama", "Area Bakar", "Gudang Gas"];

const chartData = [
  { time: '08:00', value: 120 },
  { time: '10:00', value: 130 },
  { time: '12:00', value: 250 },
  { time: '14:00', value: 180 },
  { time: '16:00', value: 140 },
  { time: '18:00', value: 450 },
  { time: '20:00', value: 150 },
];

export default function UserDashboard() {
  const [activeZone, setActiveZone] = useState(ZONES[0]);
  
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [zonesData, setZonesData] = useState(() => {
    const initialState: any = {};
    ZONES.forEach(zone => {
      initialState[zone] = { value: 0, status: "Memuat...", lastUpdate: "-" };
    });
    return initialState;
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loadingAuth || !user) return;

    const unsubscribes = ZONES.map((zone) => {
      const q = query(
        collection(db, "gas_readings"),
        where("restaurantId", "==", user.uid),
        where("zoneName", "==", zone),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const time = data.timestamp?.toDate();
          
          setZonesData((prev: any) => ({
            ...prev,
            [zone]: {
              value: data.value,
              status: data.status,
              lastUpdate: time ? time.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"
            }
          }));
        } else {
          setZonesData((prev: any) => ({
            ...prev,
            [zone]: { value: 0, status: "BELUM ADA DATA", lastUpdate: "-" }
          }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, loadingAuth]);

  const getUIConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case "BAHAYA":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          icon: <XCircle className="text-white animate-pulse" size={48} />,
          label: "BAHAYA",
          advice: "Sistem otomatis menyalakan exhaust. Segera evakuasi area ini!"
        };
      case "WASPADA":
        return {
          color: "bg-amber-500",
          textColor: "text-amber-700",
          icon: <AlertTriangle className="text-white" size={48} />,
          label: "WASPADA",
          advice: "Periksa sirkulasi udara dan pastikan tidak ada kompor yang bocor."
        };
      case "BELUM ADA DATA":
      case "Memuat...":
        return {
          color: "bg-slate-400",
          textColor: "text-slate-600",
          icon: <Wind className="text-white opacity-50" size={48} />,
          label: currentStatus === "Memuat..." ? "SINKRONISASI" : "OFFLINE",
          advice: "Sistem sedang mencoba terhubung ke perangkat di ruangan ini."
        };
      default:
        return {
          color: "bg-emerald-500",
          textColor: "text-emerald-700",
          icon: <ShieldCheck className="text-white" size={48} />,
          label: "AMAN",
          advice: "Kadar udara normal. Tetap masak dengan nyaman dan aman."
        };
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-500 mr-3" size={32} />
        <span className="font-bold text-slate-500">Memuat Sistem Keamanan...</span>
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

  const currentZoneData = zonesData[activeZone];
  const config = getUIConfig(currentZoneData.status);

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Sidebar dipanggil dan dilempar prop userEmail */}
      <Sidebar role="user" userEmail={user?.email} />

      {/* Konten Utama - diberi margin kiri md:ml-64 agar tidak tertutup Sidebar */}
      <main className="md:ml-64 p-4 md:p-8 w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">Halo, Pemilik Restoran 👋</h1>
          <p className="text-slate-500 font-medium">Pantau keamanan seluruh area dapur Anda secara real-time.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* KOLOM KIRI (Tab, Traffic Light, Mitigasi) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TAB ZONA SENSOR */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {ZONES.map((zone) => {
                const isActive = activeZone === zone;
                const isDanger = zonesData[zone].status === "BAHAYA";
                
                return (
                  <button
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    className={`relative px-6 py-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-3
                      ${isActive 
                        ? 'bg-slate-800 text-white shadow-lg' 
                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }
                      ${isDanger && !isActive ? 'ring-2 ring-red-500 bg-red-50' : ''}
                    `}
                  >
                    {zone}
                    {isDanger && (
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute top-0 right-0 -mt-1 -mr-1"></span>
                    )}
                    {isDanger && (
                      <span className="w-3 h-3 bg-red-600 rounded-full absolute top-0 right-0 -mt-1 -mr-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TRAFFIC LIGHT CARD */}
            <div className={`${config.color} rounded-xl p-8 text-white shadow-xl transition-colors duration-500 relative overflow-hidden`}>
              <div className="absolute -right-10 -top-10 opacity-10">
                <ShieldCheck size={250} />
              </div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-md">
                  {config.icon}
                </div>
                <div className="text-right">
                  <p className="opacity-80 text-xs font-bold uppercase tracking-widest mb-1">Status Keamanan</p>
                  <p className="text-3xl font-black">{config.label}</p>
                </div>
              </div>

              <div className="mt-8 mb-6 relative z-10">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-6xl font-black tracking-tighter">{currentZoneData.value}</span>
                  <span className="text-xl font-bold opacity-80 pb-1">PPM</span>
                </div>
                <p className="text-sm font-medium opacity-90 max-w-md">
                  {config.advice}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold bg-black/10 w-fit px-4 py-2 rounded-full relative z-10 backdrop-blur-sm">
                <Clock size={14} />
                <span>Update Terakhir: {currentZoneData.lastUpdate}</span>
              </div>
            </div>

            {/* MITIGASI OTOMATIS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${currentZoneData.status === "BAHAYA" ? "bg-red-100 text-red-600 animate-spin" : "bg-slate-100 text-slate-400"}`}>
                  <Fan size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Sistem Exhaust Fan</h3>
                  <p className="text-sm text-slate-500">
                    {currentZoneData.status === "BAHAYA" ? "Menyala otomatis untuk membuang gas" : "Standby"}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${currentZoneData.status === "BAHAYA" ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {currentZoneData.status === "BAHAYA" ? "AKTIF" : "NONAKTIF"}
                </span>
              </div>
            </div>

            {/* GRAFIK RIWAYAT (Mockup) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-blue-500" size={20} /> Riwayat Gas Hari Ini
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (Info Semua Area & AI) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-900 p-8 rounded-xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Wind size={150} />
              </div>
              <h4 className="font-bold text-lg mb-2 relative z-10">Insight Big Data 🧠</h4>
              <p className="text-slate-400 text-sm mb-6 relative z-10 leading-relaxed">
                Berdasarkan analitik, area <strong className="text-white">Gudang Gas</strong> memiliki lonjakan suhu tertinggi setiap hari Jumat malam. Kami sarankan pengecekan ventilasi.
              </p>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all relative z-10">
                Lihat Detail Analitik
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-500" size={20} /> Status Semua Area
              </h3>
              <div className="space-y-3">
                {ZONES.map((zone) => {
                  const status = zonesData[zone].status;
                  let dotColor = "bg-slate-300";
                  if (status === "BAHAYA") dotColor = "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse";
                  else if (status === "WASPADA") dotColor = "bg-amber-500";
                  else if (status === "AMAN") dotColor = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";

                  return (
                    <div 
                      key={zone} 
                      onClick={() => setActiveZone(zone)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors
                        ${activeZone === zone ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}
                      `}
                    >
                      <span className="font-bold text-slate-700 text-sm">{zone}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <div className="bg-blue-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <span className="text-xs font-bold text-slate-600 text-center">Unduh Laporan</span>
              </button>
              <button className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <div className="bg-blue-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <PhoneCall className="text-blue-600" size={20} />
                </div>
                <span className="text-xs font-bold text-slate-600 text-center">Panggil Teknisi</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}