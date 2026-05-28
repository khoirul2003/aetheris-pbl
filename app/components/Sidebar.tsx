"use client";

import { 
  Home, 
  MapPin, 
  Bell, 
  BarChart2, 
  Cpu,
  Users,
  Settings,
  Flame,
  LogOut,
  ShieldAlert,
  History,
  Radio,
  CreditCard,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";

interface SidebarProps {
  role: "admin" | "user";
  userEmail?: string | null;
}

export default function Sidebar({ role, userEmail }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  // Struktur Data Navigasi Dinamis (Sudah menggabungkan menu baru dari branch-baihaqi)
  const menuItems = role === "admin" 
    ? [
        { name: "Dashboard Admin", path: "/dashboard/admin", icon: Home },
        { name: "Manajemen Sensor", path: "/dashboard/admin/sensors", icon: Radio },
        { name: "Riwayat Alert", path: "/dashboard/admin/alerts", icon: ShieldAlert },
        { name: "Laporan & Analitik", path: "/dashboard/admin/analytics", icon: BarChart2 },
        { name: "Paket & Billing", path: "/dashboard/admin/subscriptions", icon: CreditCard },
        { name: "Activity Log", path: "/dashboard/admin/logs", icon: History },
        { name: "Manajemen User", path: "/dashboard/admin/users", icon: Users },
        { name: "Manajemen Sistem", path: "/dashboard/admin/sensors-dev", icon: Cpu }, // Sesuai ikon Cpu punyamu
        { name: "Pengaturan Admin", path: "/dashboard/admin/settings", icon: Settings },
      ]
    : [
        { name: "Beranda", path: "/dashboard/user", icon: Home },
        { name: "Area & Sensor", path: "/dashboard/user/sensors", icon: MapPin },
        { name: "Alert", path: "/dashboard/user/alerts", icon: Bell },
        { name: "Laporan", path: "/dashboard/user/reports", icon: BarChart2 },
        { name: "Pengaturan", path: "/dashboard/user/settings", icon: Settings },
      ];

  return (
    <>
      {/* ==================================================================== */}
      {/* 1. TAMPILAN DESKTOP: SIDEBAR KIRI (hidden md:flex)                   */}
      {/* ==================================================================== */}
      <aside className="hidden md:flex w-64 bg-white h-screen fixed left-0 top-0 text-slate-800 flex-col border-r border-slate-200 z-50">
        
        {/* Header / Logo Section */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
          <div className="relative">
            <Flame className="text-orange-500" size={24} strokeWidth={2.5} />
            <div className="absolute inset-2 bg-yellow-400 blur-sm -z-10 rounded-full"></div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            <span className="text-blue-900">AETHERIS <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1 uppercase font-semibold">{role}</span></span>
          </h1>
        </div>

        {/* Navigation Section Desktop */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button 
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                  ${active 
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} /> 
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Profile Section Desktop */}
        <div 
          onClick={handleLogout}
          className="p-5 border-t border-slate-200 mt-auto hover:bg-slate-50 cursor-pointer transition-colors group flex items-center justify-between"
          title="Klik untuk Keluar"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {role === "admin" ? "AD" : "RW"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                {role === "admin" ? "Administrator" : "Restoran Warung"}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                {userEmail || (role === "admin" ? "Platform Control" : "Paket Pro")}
              </p>
            </div>
          </div>
          <LogOut size={16} className="text-slate-400 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. TAMPILAN MOBILE: BOTTOM NAVIGATION BAR (md:hidden)                */}
      {/* ==================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative border-none bg-transparent cursor-pointer
                ${active ? "text-blue-900 font-bold scale-105" : "text-slate-400 font-medium"}`}
            >
              {/* Garis Indikator Aktif di Atas Ikon */}
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-blue-900 rounded-full animate-fade-in" />
              )}
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] tracking-tight truncate max-w-[60px]">{item.name.split(" ")[0]}</span>
            </button>
          );
        })}
        
        {/* Tombol Logout Khusus Versi Mobile */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-14 h-full gap-1 text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
        >
          <LogOut size={19} />
          <span className="text-[9px] tracking-tight">Keluar</span>
        </button>
      </nav>
    </>
  );
}