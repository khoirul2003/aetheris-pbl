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
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar role="admin" />

      <main className="ml-64 p-6 w-full">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500">Real-time telemetry and operational status</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="pl-10 pr-4 py-2 w-80 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Search operations, sensors..."
              />
            </div>

            <button className="rounded-full bg-rose-50 text-rose-700 px-4 py-2 text-sm font-semibold border border-rose-100 shadow-sm">
              Emergency Shutdown
            </button>

            <button className="rounded-full bg-black text-white px-4 py-2 text-sm font-medium shadow-sm">
              Add Device
            </button>

            <button className="p-2 rounded-lg bg-white border border-slate-200">
              <BellRing size={18} />
            </button>
            <button className="p-2 rounded-lg bg-white border border-slate-200">?</button>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">OM</div>
          </div>
        </div>

        {/* Top summary cards + content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary cards row (3) */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`${stat.bg} ${stat.color} p-2 rounded-md flex items-center justify-center`}>
                        <stat.icon size={18} />
                      </div>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 uppercase tracking-wide rounded-md px-2 py-1 bg-slate-50">{stat.label}</span>
                    </div>
                    <button className="text-slate-300"><ArrowUpRight size={20} /></button>
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Today card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">Alerts Today</h4>
              <div className="text-xs text-slate-400">LAST SYNC: JUST NOW</div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-rose-600">12</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Charts and table area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Alert Trend (7 Days)</h5>
                <div className="h-40 bg-linear-to-b from-slate-50 to-white rounded" />
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">User Growth</h5>
                <div className="h-40 bg-linear-to-b from-slate-50 to-white rounded" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Offline Sensors</h3>
                <div className="text-sm text-slate-500">4 Items</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Sensor ID</th>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4">Last Seen</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {restaurants.map((r) => (
                      <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold">SN-49{r.id}</td>
                        <td className="px-6 py-4">{r.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">2 hours ago</td>
                        <td className="px-6 py-4 text-right"><button className="text-blue-600 font-medium">Diagnose</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column: Real-time Alerts */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800">Real-time Alerts</h4>
                <button className="text-slate-400">↻</button>
              </div>
              <div className="space-y-3">
                <div className="border rounded-lg p-3 flex items-start gap-3 relative bg-white">
                  <div className="absolute -left-1 top-3 h-10 w-1.5 bg-rose-500 rounded-md"></div>
                  <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center text-rose-600 font-bold">!</div>
                  <div className="flex-1 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Kitchen Pusat - McD</div>
                      <div className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md">DANGER</div>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Exhaust hood temperature exceeded 85°C.</div>
                    <div className="text-xs text-slate-400 mt-2">10 mins ago</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3 flex items-start gap-3 relative bg-white">
                  <div className="absolute -left-1 top-3 h-10 w-1.5 bg-amber-500 rounded-md"></div>
                  <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 font-bold">!</div>
                  <div className="flex-1 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Cabang Sudirman</div>
                      <div className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">WARNING</div>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Freezer ambient temp rising slowly (+2°C).</div>
                    <div className="text-xs text-slate-400 mt-2">45 mins ago</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3 flex items-start gap-3 relative bg-white">
                  <div className="absolute -left-1 top-3 h-10 w-1.5 bg-emerald-500 rounded-md"></div>
                  <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">✓</div>
                  <div className="flex-1 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Wendy's - Blok M</div>
                      <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">RESOLVED</div>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Gas valve pressure normalized.</div>
                    <div className="text-xs text-slate-400 mt-2">2 hrs ago</div>
                  </div>
                </div>

              </div>
              <div className="mt-4 text-center">
                <button className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded">View All Activity Logs</button>
              </div>
            </div>
          </aside>
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