"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ClientSensorModel, FirestoreSensor, LiveSensorData } from "@/models/clientSensorModel";
import { 
  AlertTriangle, 
  Loader2, 
  Check, 
  BellRing, 
  AlertCircle, 
  LayoutDashboard, 
  Cpu, 
  TrendingUp 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Navbar from "@/app/components/Navbar";

interface AlertLog {
  id: string;
  message: string;
  level: string;
  isResolved: boolean;
  timeStr: string;
}

const LINE_COLORS = ["#4A6741", "#C67023", "#2E5A88", "#A04040", "#6D4C41", "#7B1FA2"];

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [dynamicSensors, setDynamicSensors] = useState<FirestoreSensor[]>([]);
  const [liveSensors, setLiveSensors] = useState<{ [key: string]: LiveSensorData }>({});
  const [latestAlerts, setLatestAlerts] = useState<AlertLog[]>([]);
  const [chartHistory, setChartHistory] = useState<Record<string, string | number>[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, unresolved: 0, lastCheck: "-" });

  // 1. Auth Checker
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Hubungkan Semua Komponen ke Database secara 100% Dinamis
  useEffect(() => {
    if (loadingAuth || !user) return;
    
    const currentUserId = user.uid;
    let unsubscribeSummary: (() => void) | undefined;

    const sensorsQ = query(collection(db, "sensors"), where("userId", "==", currentUserId));
    const unsubscribeSensors = onSnapshot(sensorsQ, (snapshot) => {
      const sensorList: FirestoreSensor[] = [];
      snapshot.forEach((doc) => {
        sensorList.push({ id: doc.id, ...doc.data() } as FirestoreSensor);
      });
      
      setDynamicSensors(sensorList);
      setLoadingData(false);

      if (unsubscribeSummary) unsubscribeSummary();
      
      const summaryQ = query(
        collection(db, "dailySummaries"),
        where("userId", "==", currentUserId),
        orderBy("date", "asc"),
        limit(7)
      );

      unsubscribeSummary = onSnapshot(summaryQ, (summarySnapshot) => {
        const history: Record<string, string | number>[] = [];
        
        summarySnapshot.forEach((doc) => {
          const data = doc.data();
          const rawDate = data.date ? data.date.split("-") : [];
          const formattedDate = rawDate.length === 3 ? `${rawDate[2]}/${rawDate[1]}` : data.date;
          
          const chartRow: Record<string, string | number> = { time: formattedDate };
          
          sensorList.forEach((sensor) => {
            chartRow[sensor.name] = data.avgGasPerSensor?.[sensor.id] || 0;
          });

          history.push(chartRow);
        });

        if (history.length > 0) {
          setChartHistory(history);
        }
      });
    }, (error) => {
      console.error("Gagal memuat sensor secara real-time:", error);
      setLoadingData(false);
    });

    const alertsQ = query(
      collection(db, "alerts"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeAlerts = onSnapshot(alertsQ, (snapshot) => {
      const logs: AlertLog[] = [];
      let unresolvedCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isResolved) unresolvedCount++;
        
        const timestamp = data.createdAt?.toDate();
        const timeStr = timestamp 
          ? timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
          : "-";

        logs.push({
          id: doc.id,
          message: data.message || "Anomali terdeteksi",
          level: data.level || "warning",
          isResolved: !!data.isResolved,
          timeStr
        });
      });

      setLatestAlerts(logs);
      setStats(prev => ({ ...prev, unresolved: unresolvedCount, totalToday: snapshot.size }));
    });

    return () => {
      unsubscribeSensors();
      unsubscribeAlerts();
      if (unsubscribeSummary) unsubscribeSummary();
    };
  }, [user, loadingAuth]);

  // 3. Ambil data realtime status sensor live
  useEffect(() => {
    if (dynamicSensors.length === 0) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

    const unsubscribers = dynamicSensors.map((sensor) => {
      return ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
        setLiveSensors((prev: Record<string, LiveSensorData>) => ({
          ...prev,
          [sensor.id]: data,
        }));
        
        setStats((prev: typeof stats) => ({
          ...prev,
          lastCheck: timeString
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [dynamicSensors]);

  const getOverallStatus = () => {
    if (dynamicSensors.length === 0) return "Aman";
    const statuses = dynamicSensors.map(sensor => liveSensors[sensor.id]?.status || "safe");
    if (statuses.includes("danger")) return "Bahaya";
    if (statuses.includes("warning")) return "Waspada";
    return "Aman";
  };

  const overallStatus = getOverallStatus();
  const connectedCount = dynamicSensors.filter(sensor => liveSensors[sensor.id]?.isOnline).length;

  if (loadingAuth || loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-emerald-600 mx-auto" size={32} />
          <p className="text-slate-700 font-medium text-sm">Menghubungkan Database Dinamis...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-8">Akses Ditolak. Silakan Login.</div>;

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen font-sans text-slate-900 antialiased overflow-x-hidden">
      <Sidebar role="user" userEmail={user.email} />
      

      {/* TAMPILAN RESPONSIVE UTAMA */}
      <main className="md:ml-64 pt-6 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-6xl mx-auto box-border">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between gap-4 mb-6">
          

          <div className="flex items-center gap-3">
            <button className="rounded-full bg-rose-50 text-rose-700 px-4 py-2 text-xs md:text-sm font-semibold border border-rose-100 shadow-sm transition-all hover:bg-rose-100">
              Emergency Shutdown
            </button>
            <button className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50">
              <BellRing size={18} />
            </button>
          </div>
        </div>
        
        {/* BANNER NOTIFIKASI */}
        {overallStatus !== "Aman" && (
          <div className={`border p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm ${
            overallStatus === "Bahaya" ? "bg-red-50 border-red-200 animate-pulse" : "bg-[#FDF0E1] border-[#F3D5B5]"
          }`}>
            <AlertCircle className={overallStatus === "Bahaya" ? "text-red-500" : "text-[#C67023]"} size={20} />
            <div>
              <p className={`text-xs font-semibold leading-relaxed ${overallStatus === "Bahaya" ? "text-red-900" : "text-amber-950"}`}>
                <span className="font-black uppercase tracking-wider">Peringatan Keamanan!</span> Terdeteksi kenaikan volume gas. Segera periksa area dapur Anda.
              </p>
            </div>
          </div>
        )}

        {/* KARTU RINGKASAN DATA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl shadow-sm">
            <p className="text-slate-600 text-[10px] md:text-[12px] font-black mb-1 uppercase tracking-widest">Kondisi Dapur</p>
            <h2 className={`text-base md:text-xl font-black mb-0.5 ${overallStatus === 'Waspada' ? 'text-[#C67023]' : overallStatus === 'Bahaya' ? 'text-red-600' : 'text-[#4A6741]'}`}>
              {overallStatus}
            </h2>
            <p className="text-slate-500 text-[10px] md:text-[12px] font-semibold truncate">
              {stats.unresolved > 0 ? `${stats.unresolved} sektor bahaya` : 'Zona memasak aman'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl shadow-sm">
            <p className="text-slate-600 text-[10px] md:text-[12px] font-black mb-1 uppercase tracking-widest">Sensor Aktif</p>
            <h2 className="text-base md:text-xl font-black text-slate-800 mb-0.5">{connectedCount} <span className="text-[10px] md:text-xs text-slate-600 font-bold">/ {dynamicSensors.length} Node</span></h2>
            <p className="text-slate-500 text-[10px] md:text-[12px] font-semibold">Otomatis Terdeteksi</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl shadow-sm">
            <p className="text-slate-600 text-[10px] md:text-[12px] font-black mb-1 uppercase tracking-widest">Alert Hari Ini</p>
            <h2 className="text-base md:text-xl font-black text-slate-800 mb-0.5">{stats.totalToday} <span className="text-[10px] md:text-xs text-slate-600 font-bold">Kali</span></h2>
            <p className="text-slate-500 text-[10px] md:text-[12px] font-semibold truncate">{stats.unresolved} Perlu perhatian</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-xl shadow-sm">
            <p className="text-slate-600 text-[10px] md:text-[12px] font-black mb-1 uppercase tracking-widest">Terakhir Dicek</p>
            <h2 className="text-base md:text-xl font-black text-slate-800 mb-0.5">{stats.lastCheck.split(" ")[0]}</h2>
            <p className="text-slate-500 text-[10px] md:text-[12px] font-semibold">Real-time Sinkron</p>
          </div>
        </div>

        {/* SECTION LAYOUT TENGAH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* TABEL STATUS SEMUA AREA */}
          <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-xl shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-600 tracking-widest uppercase mb-4 flex items-center gap-2">
              <LayoutDashboard size={14} className="text-slate-600" /> Status Semua Area
            </h3>
            <div className="space-y-0 flex-grow divide-y divide-slate-100">
              {dynamicSensors.length === 0 ? (
                <p className="text-xs text-slate-600 py-6 text-center font-medium">Tidak ada sensor yang ditemukan.</p>
              ) : (
                dynamicSensors.map((sensor) => {
                  const live = liveSensors[sensor.id];
                  const isWarning = live?.status === "warning" || live?.status === "danger";

                  return (
                    <div key={sensor.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-2">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isWarning ? 'bg-red-50 text-red-500' : 'bg-[#E9F2E4] text-[#4A6741]'
                        }`}>
                          {isWarning ? <AlertTriangle size={16} /> : <Check size={16} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{sensor.name}</p>
                          <p className="text-[11px] md:text-[12px] text-slate-600 font-medium truncate">{sensor.location}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wide ${
                          live?.status === "danger" ? 'bg-red-100 text-red-700' : 
                          live?.status === "warning" ? 'bg-[#FDF0E1] text-[#A05E1A]' : 'bg-[#E9F2E4] text-[#4A6741]'
                        }`}>
                          {live ? (live.status === "safe" ? "Aman" : live.status === "warning" ? "Waspada" : "Bahaya") : "Offline"}
                        </span>
                        <p className="font-mono text-[11px] md:text-[12px] text-slate-600 font-bold mt-1">{live ? `${live.gas} PPM` : "-"}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DENAH MATRIKS ZONA DAPUR */}
          <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-xl shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-600 tracking-widest uppercase mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-slate-600" /> Peta Denah Zona Dapur
            </h3>
            <div className="bg-slate-50/60 p-3 md:p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 md:gap-4 flex-grow items-center">
              {dynamicSensors.map((sensor) => {
                const live = liveSensors[sensor.id];
                const isWarning = live?.status === "warning" || live?.status === "danger";

                return (
                  <div key={sensor.id} className={`p-3 md:p-4 rounded-xl border flex flex-col justify-between h-24 transition-all bg-white shadow-sm ${
                    isWarning ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
                  }`}>
                    <p className="font-bold text-[11px] text-slate-800 line-clamp-2 leading-tight">
                      {sensor.name}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-2">
                      <span className="text-[11px] md:text-[12px] text-slate-600 font-bold font-mono shrink-0">{live ? `${live.temperature}°C` : "-"}</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          live?.status === "danger" ? 'bg-red-500 animate-ping' : 
                          live?.status === "warning" ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-[9px] md:text-[11px] font-black uppercase text-slate-500 tracking-wide truncate">
                          {live ? (live.status === "safe" ? "Aman" : live.status === "warning" ? "Waspada" : "Bahaya") : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* GRAFIK & LOGS JALUR REALTIME */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TREN GRAFIK */}
          <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-xl shadow-sm flex flex-col w-full overflow-hidden">
            <h3 className="text-xs font-black text-slate-600 tracking-widest uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-600" /> Tren Rata-rata Gas Mingguan
            </h3>
            <div className="h-[260px] w-full text-[11px] md:text-[12px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                  
                  {dynamicSensors.map((sensor, index) => (
                    <Line 
                      key={sensor.id}
                      name={sensor.name} 
                      type="monotone" 
                      dataKey={sensor.name} 
                      stroke={LINE_COLORS[index % LINE_COLORS.length]} 
                      strokeWidth={2.5} 
                      dot={false} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIWAYAT LOG ALERTS */}
          <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-xl shadow-sm flex flex-col h-[324px]">
            <h3 className="text-xs font-black text-slate-600 tracking-widest uppercase mb-4 flex items-center gap-2">
              <BellRing size={14} className="text-slate-600" /> Riwayat Log Aktivitas Peringatan
            </h3>
            <div className="space-y-3 overflow-y-auto pr-1 flex-grow custom-scrollbar">
              {latestAlerts.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-600 font-medium">
                  Kondisi dapur steril. Tidak ada riwayat bahaya.
                </div>
              ) : (
                latestAlerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0 items-start">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.level === "danger" ? "bg-red-50 text-red-500" : "bg-[#FDF0E1] text-[#C67023]"
                    }`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="w-full min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{alert.message}</p>
                      <div className="flex justify-between items-center text-[11px] md:text-[12px] text-slate-600 font-bold">
                        <span>Pukul {alert.timeStr} WIB</span>
                        <span className={alert.isResolved ? "text-[#4A6741]" : "text-[#A05E1A]"}>
                          {alert.isResolved ? "✓ Selesai" : "• Perlu Atensi"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}