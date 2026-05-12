"use client";

import { 
  LayoutDashboard, 
  Users, 
  Database, 
  LogOut, 
  ShieldCheck, 
  Bell,
  Settings
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";

interface SidebarProps {
  role: "admin" | "user";
  userEmail?: string | null; // Tambahan prop untuk menerima email dari luar
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
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col border-r border-white/5 z-50">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 mb-8 mt-8">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">AETHERIS</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">PBL Project</p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto custom-scrollbar">
        <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        
        <button 
          onClick={() => router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/user")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive("/dashboard/admin") || isActive("/dashboard/user")
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <LayoutDashboard size={20} /> 
          <span className="font-medium">Dashboard</span>
        </button>

        {role === "admin" && (
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400">
            <Users size={20} /> 
            <span className="font-medium">Kelola Restoran</span>
          </button>
        )}

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400">
          <Database size={20} /> 
          <span className="font-medium">Riwayat Data</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400 relative">
          <Bell size={20} /> 
          <span className="font-medium">Notifikasi</span>
          <span className="absolute right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

        <div className="pt-4 mt-4 border-t border-white/5">
          <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">System</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400">
            <Settings size={20} /> 
            <span className="font-medium">Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-white/10 shadow-inner">
            {role === "admin" ? "AD" : "RS"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">
              {role === "admin" ? "Administrator" : "Pemilik Restoran"}
            </p>
            {/* Menggunakan prop userEmail yang dikirim dari page.tsx */}
            <p className="text-[11px] text-slate-400 truncate">
              {userEmail || "Memuat..."}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-semibold text-sm border border-transparent hover:border-red-500/20"
        >
          <LogOut size={18} className="transition-transform group-hover:-translate-x-1" /> 
          Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}