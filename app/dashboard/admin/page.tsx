"use client";

import Sidebar from "@/app/components/Sidebar";
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  MoreVertical,
  Search
} from "lucide-react";

export default function AdminDashboard() {
  // Data dummy untuk statistik
  const stats = [
    { label: "Total Restoran", value: "12", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sensor Aktif", value: "48", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Peringatan Bahaya", value: "2", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  // Data dummy untuk tabel restoran
  const restaurants = [
    { id: 1, name: "Restoran Padang Restu", location: "Malang, Lowokwaru", status: "AMAN", level: "120 PPM" },
    { id: 2, name: "Bakso Solo Baru", location: "Malang, Suhat", status: "WASPADA", level: "450 PPM" },
    { id: 3, name: "Ayam Kita Tlogomas", location: "Malang, Tlogomas", status: "AMAN", level: "98 PPM" },
    { id: 4, name: "Lalapan Purnama", location: "Malang, Sigura-gura", status: "BAHAYA", level: "820 PPM" },
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar role="admin" />

      {/* Main Content */}
      <main className="ml-64 p-8 w-full">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Admin</h1>
            <p className="text-slate-500 text-sm">Pantau keamanan gas seluruh mitra restoran Aetheris.</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari restoran..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
              />
            </div>
            <button className="bg-white p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
              <BellRing size={20} />
            </button>
          </div>
        </header>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl transition-transform group-hover:scale-110`}>
                  <stat.icon size={24} />
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                  <ArrowUpRight size={20} />
                </button>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tables Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Status Keamanan Restoran Terkini</h3>
            <button className="text-blue-600 text-sm font-bold hover:underline">Lihat Semua</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                <tr>
                  <th className="px-6 py-4">Informasi Restoran</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Kadar Gas</th>
                  <th className="px-6 py-4">Status Keamanan</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{res.name}</p>
                      <p className="text-xs text-slate-400">ID: RES-00{res.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm italic">{res.location}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-700">{res.level}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 w-fit ${
                        res.status === "AMAN" ? "bg-emerald-100 text-emerald-700" : 
                        res.status === "WASPADA" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          res.status === "AMAN" ? "bg-emerald-500" : 
                          res.status === "WASPADA" ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                        }`} />
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-800 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// Komponen ikon tambahan yang dibutuhkan
function BellRing({ size }: { size: number }) {
  return (
    <div className="relative">
      <Activity size={size} />
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
    </div>
  );
}