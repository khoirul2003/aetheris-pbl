"use client";

import { 
  Home, 
  MapPin, 
  Bell, 
  Database,
  Flame,
  LogOut
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";

interface TopbarProps {
  role: "admin" | "user";
  userEmail?: string | null;
}

export default function Topbar({ role, userEmail }: TopbarProps) {
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

  // Definisi Menu Admin
  const adminMenus = [
    { name: "Dashboard", path: "/dashboard/admin", icon: <Home size={18} strokeWidth={isActive("/dashboard/admin") ? 2.5 : 2} /> },
    { name: "Area Sensor", path: "/dashboard/sensors", icon: <MapPin size={18} strokeWidth={isActive("/dashboard/sensors") ? 2.5 : 2} /> },
  ];

  // Definisi Menu User
  const userMenus = [
    { name: "Dashboard", path: "/dashboard/user", icon: <Home size={18} strokeWidth={isActive("/dashboard/user") ? 2.5 : 2} /> },
    { name: "Data", path: "/dashboard/user/data", icon: <Database size={18} strokeWidth={isActive("/dashboard/user/data") ? 2.5 : 2} /> },
    { name: "Alert", path: "/dashboard/user/alert", icon: <Bell size={18} strokeWidth={isActive("/dashboard/user/alert") ? 2.5 : 2} /> },
  ];

  const menus = role === "admin" ? adminMenus : userMenus;

  return (
    <header className="fixed top-0 left-0 right-0 h-[73px] bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6 md:px-8">
      
      {/* SEBELAH KIRI: Logo & Tulisan Aetheris (Sudah Diperbaiki) */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer" 
        onClick={() => router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/user")}
      >
        <div className="relative">
          <Flame className="text-orange-500" size={24} strokeWidth={2.5} />
          <div className="absolute inset-2 bg-yellow-400 blur-sm -z-10 rounded-full"></div>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          <span className="text-blue-900">AETHERIS.</span>
        </h1>
      </div>

      {/* BAGIAN TENGAH: Menu Navigasi Sesuai Role */}
      <nav className="hidden md:flex items-center gap-2">
        {menus.map((menu) => (
          <button 
            key={menu.path}
            onClick={() => router.push(menu.path)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors text-sm
              ${isActive(menu.path)
                ? "bg-[#F6F5F2] text-slate-900 font-bold" 
                : "text-slate-600 hover:bg-slate-50 font-medium"
              }`}
          >
            {menu.icon}
            <span>{menu.name}</span>
          </button>
        ))}
      </nav>

      {/* SEBELAH KANAN: Profile & Logout Bersebelahan */}
      <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {role === "admin" ? "AD" : "US"}
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">
              {role === "admin" ? "Administrator" : "User Account"}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {userEmail || (role === "admin" ? "admin@aetheris.com" : "user@aetheris.com")}
            </p>
          </div>
        </div>
        
        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold group"
          title="Logout"
        >
          <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
      
    </header>
  );
}