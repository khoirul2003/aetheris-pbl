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
}

export default function Sidebar({ role }: SidebarProps) {
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
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 p-4 flex flex-col border-r border-white/5">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-2 mb-10 mt-2">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">AETHERIS</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">PBL Project</p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        
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

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400">
          <Bell size={20} /> 
          <span className="font-medium">Notifikasi</span>
        </button>

        <div className="pt-4 mt-4 border-t border-white/5">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">System</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all text-slate-400">
            <Settings size={20} /> 
            <span className="font-medium">Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* User Section & Logout */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
            {role === "admin" ? "AD" : "RS"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {role === "admin" ? "Administrator" : "Pemilik Restoran"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{auth.currentUser?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm"
        >
          <LogOut size={20} /> Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}