"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/ Sidebar";
import { 
  Flame, 
  Wind, 
  BellRing, 
  History, 
  ShieldAlert, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function UserDashboard() {
  const [gasLevel, setGasLevel] = useState(0);
  const [status, setStatus] = useState("Memuat...");
  const [lastUpdate, setLastUpdate] = useState("-");

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query untuk mengambil 1 data terbaru berdasarkan restaurantId (UID User)
    const q = query(
      collection(db, "gas_readings"),
      where("restaurantId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setGasLevel(data.value);
        setStatus(data.status);
        
        // Format waktu update terakhir
        const time = data.timestamp?.toDate();
        if (time) {
          setLastUpdate(time.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        setStatus("TIDAK ADA DATA");
      }
    });

    return () => unsubscribe();
  }, []);

  // Konfigurasi warna berdasarkan status
  const getStatusColor = () => {
    if (status === "BAHAYA") return "text-rose-500 bg-rose-500";
    if (status === "WASPADA") return "text-amber-500 bg-amber-500";
    return "text-emerald-500 bg-emerald-500";
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar khusus User */}
      <Sidebar role="user" />

      {/* Main Content */}
      <main className="ml-64 p-8 w-full">
        {/* Header Dashboard */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Status Keamanan Dapur</h1>
            <p className="text-slate-500 text-sm italic">Monitoring real-time sensor gas MQ-2</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
            TERKONEKSI • Update Terakhir: {lastUpdate}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Utama Visualisasi Gas */}
          <div className="lg:col-span-2 bg-white p-12 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Dekorasi Background */}
            <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
              <Flame size={300} />
            </div>

            <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-6">Konsentrasi Gas Saat Ini</h3>
            
            <div className="relative flex items-center justify-center">
              <div className="text-[10rem] font-black text-slate-800 leading-none tracking-tighter">
                {gasLevel}
              </div>
              <span className="absolute -right-16 bottom-6 text-2xl font-bold text-slate-400">PPM</span>
            </div>

            <div className={`mt-8 px-10 py-3 rounded-2xl font-black text-xl tracking-widest text-white shadow-lg flex items-center gap-3 ${getStatusColor().split(' ')[1]}`}>
              {status === "AMAN" && <CheckCircle2 size={24} />}
              {status === "WASPADA" && <AlertTriangle size={24} />}
              {status === "BAHAYA" && <ShieldAlert size={24} className="animate-bounce" />}
              {status}
            </div>
          </div>

          {/* Kolom Informasi & Aksi Cepat */}
          <div className="space-y-6">
            {/* Widget Notifikasi WhatsApp */}
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                <BellRing size={40} />
              </div>
              <h4 className="font-bold text-lg mb-3">Sistem Alert Aktif</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pesan WhatsApp otomatis akan dikirim ke nomor Anda jika terdeteksi kebocoran di atas <span className="text-amber-400 font-bold">400 PPM</span>.
              </p>
              <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                Pengaturan Kontak
              </button>
            </div>
            
            {/* Widget Tips Keamanan */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Wind className="text-blue-500" size={20} /> Protokol Keamanan
              </h4>
              <ul className="text-sm text-slate-500 space-y-4">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500">01.</span>
                  <span>Pastikan ventilasi mekanis (exhaust) menyala saat jam operasional.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500">02.</span>
                  <span>Lakukan pengecekan visual pada selang regulator setiap pagi.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-500">03.</span>
                  <span>Hubungi teknisi jika status WASPADA muncul lebih dari 10 menit.</span>
                </li>
              </ul>
            </div>

            {/* Tombol Lihat Riwayat */}
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
              <History size={20} /> Lihat Riwayat Laporan
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}