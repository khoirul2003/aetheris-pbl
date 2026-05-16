"use client";

import { 
  Home, 
  MapPin, 
  Bell, 
  BarChart2, 
  Settings,
  Flame,
  LogOut
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

  // Helper untuk mengecek menu aktif
  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 text-slate-800 flex flex-col border-r border-slate-200 z-50">
      
      {/* Header / Logo Section */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-200">
        <div className="relative">
          <Flame className="text-orange-500" size={24} strokeWidth={2.5} />
          {/* Efek aksen warna di dalam api (opsional untuk mempercantik) */}
          <div className="absolute inset-2 bg-yellow-400 blur-sm -z-10 rounded-full"></div>
        </div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          <span className="text-blue-900">AETHERIS.</span>
        </h1>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        
        <button 
          onClick={() => router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/user")}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm
            ${isActive("/dashboard/admin") || isActive("/dashboard/user")
              ? "bg-[#F6F5F2] text-slate-900 font-bold" 
              : "text-slate-600 hover:bg-slate-50 font-medium"
            }`}
        >
          <Home size={18} strokeWidth={isActive("/dashboard/user") ? 2.5 : 2} /> 
          <span>Beranda</span>
        </button>

        <button 
          onClick={() => router.push("/dashboard/sensors")}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm
            ${isActive("/dashboard/sensors")
              ? "bg-[#F6F5F2] text-slate-900 font-bold" 
              : "text-slate-600 hover:bg-slate-50 font-medium"
            }`}
        >
          <MapPin size={18} strokeWidth={isActive("/dashboard/sensors") ? 2.5 : 2} /> 
          <span>Area & sensor</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
          <Bell size={18} /> 
          <span>Alert</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
          <BarChart2 size={18} /> 
          <span>Laporan</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
          <Settings size={18} /> 
          <span>Pengaturan</span>
        </button>

      </nav>

      {/* Footer / User Profile Section */}
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
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">
              {role === "admin" ? "Administrator" : "Restoran Warung"}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {userEmail || "Paket Pro"}
            </p>
          </div>
        </div>
        
        {/* Ikon Logout yang muncul saat di-hover */}
        <LogOut size={16} className="text-slate-400 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
      </div>

    </div>
  );
}