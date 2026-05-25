"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
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
        // PERBAIKAN UTAMA: Mengubah dari any[] menjadi tipe structural object yang aman
        const history: Record<string, string | number>[] = [];
        
        summarySnapshot.forEach((doc) => {
          const data = doc.data();
          const rawDate = data.date ? data.date.split("-") : [];
          const formattedDate = rawDate.length === 3 ? `${rawDate[2]}/${rawDate[1]}` : data.date;
          
          // Deklarasi object row grafik dengan tipe data aman
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
    <div className="flex bg-gray-50 min-h-screen font-sans text-slate-900 antialiased">
      <Sidebar role="user" userEmail={user.email || "khoirul@email.com"} />

      <main className="ml-64 p-6 w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500">Overview of your restaurant's telemetry</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <input
                className="pl-4 pr-4 py-2 w-72 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Search operations, sensors..."
              />
            </div>
            <button className="rounded-full bg-rose-50 text-rose-700 px-4 py-2 text-sm font-semibold border border-rose-100 shadow-sm">Emergency Shutdown</button>
            <button className="rounded-full bg-black text-white px-4 py-2 text-sm font-medium shadow-sm">Add Device</button>
            <button className="p-2 rounded-lg bg-white border border-slate-200"><BellRing size={18} /></button>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">UM</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kondisi Dapur</span>
                <span className="text-xs text-slate-400">Status</span>
              </div>
              <h2 className={`text-xl font-black mb-0.5 ${overallStatus === 'Waspada' ? 'text-[#C67023]' : overallStatus === 'Bahaya' ? 'text-red-600' : 'text-[#4A6741]'}`}>{overallStatus}</h2>
              <p className="text-slate-500 text-[12px] font-semibold">{stats.unresolved > 0 ? `${stats.unresolved} sektor butuh tindakan` : 'Zona memasak aman'}</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sensor Aktif</span>
                <span className="text-xs text-slate-400">Nodes</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-0.5">{connectedCount} <span className="text-xs text-slate-600 font-bold">/ {dynamicSensors.length} Node</span></h2>
              <p className="text-slate-500 text-[12px] font-semibold">Otomatis Terdeteksi</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alert Hari Ini</span>
                <span className="text-xs text-slate-400">24h</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-0.5">{stats.totalToday} <span className="text-xs text-slate-600 font-bold">Kali</span></h2>
              <p className="text-slate-500 text-[12px] font-semibold">{stats.unresolved} Perlu perhatian</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">Alerts Today</h4>
              <div className="text-xs text-slate-400">LAST SYNC: JUST NOW</div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-rose-600">{stats.totalToday || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Alert Trend (7 Days)</h5>
                <div className="h-40 bg-gradient-to-b from-slate-50 to-white rounded" />
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">User Growth</h5>
                <div className="h-40 bg-gradient-to-b from-slate-50 to-white rounded" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Status Keamanan Restoran Terkini</h3>
                <button className="text-blue-600 text-sm font-bold hover:underline">Lihat Semua</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Informasi Restoran</th>
                      <th className="px-6 py-4">Lokasi</th>
                      <th className="px-6 py-4">Kadar Gas</th>
                      <th className="px-6 py-4">Status Keamanan</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dynamicSensors.map((sensor) => (
                      <tr key={sensor.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">{sensor.name}</p>
                          <p className="text-xs text-slate-400">ID: {sensor.id}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm italic">{sensor.location}</td>
                        <td className="px-6 py-4"><span className="font-mono font-bold text-slate-700">{liveSensors[sensor.id]?.gas ?? '-' } PPM</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit ${
                            liveSensors[sensor.id]?.status === "safe" ? "bg-emerald-100 text-emerald-700" : liveSensors[sensor.id]?.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          }`}>{liveSensors[sensor.id]?.status ?? 'Offline'}</span>
                        </td>
                        <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-800 transition-colors"><MoreVertical size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800">Real-time Alerts</h4>
                <button className="text-slate-400">↻</button>
              </div>
              <div className="space-y-3">
                {latestAlerts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-600">Tidak ada alert terbaru.</div>
                ) : (
                  latestAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-3 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-md ${alert.level === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center font-bold`}>{alert.level === 'danger' ? '!' : '!'}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{alert.message.slice(0, 28)}</div>
                          <div className="text-xs text-amber-600 font-bold">{alert.level.toUpperCase()}</div>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{alert.message}</div>
                        <div className="text-xs text-slate-400 mt-2">{alert.timeStr} WIB</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 text-center"><button className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded">View All Activity Logs</button></div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}