"use client";

import { 
  Home, MapPin, Bell, BarChart2, Cpu, Users, Settings, 
  LogOut, ShieldAlert, History, Radio, CreditCard, 
  ChevronLeft, ChevronRight, X, Loader2
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SidebarProps {
  role?: "admin" | "user";
  userEmail?: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  role = "admin", userEmail, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State untuk mengontrol layar loading

  useEffect(() => {
  const timer = setTimeout(() => {
    setIsMounted(true);
  }, 0);
  return () => clearTimeout(timer);
}, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return; // Mencegah double click
    
    setIsLoggingOut(true); // Memunculkan layar loading overlay
    setIsMobileOpen(false); // Tutup sidebar jika di mobile
    
    try {
      await signOut(auth);
      // Hapus session storage cache admin jika ada
      sessionStorage.removeItem("aetheris_admin_auth");
      
      // Sedikit jeda 300ms agar transisinya terlihat sinematik dan tidak terlalu mendadak
      setTimeout(() => {
        router.replace("/login");
      }, 300);
      
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Gagal mengakhiri sesi, periksa koneksi internet Anda.");
      setIsLoggingOut(false); // Tutup loading jika gagal
    }
  };

  const isActive = (path: string) => pathname === path;
  const handleToggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem("aetheris_sidebar_collapsed", JSON.stringify(nextValue));
  };

  const menuItems = role === "admin" 
    ? [
        { name: "Admin Dashboard", path: "/dashboard/admin", icon: Home },
        { name: "Sensor Management", path: "/dashboard/admin/sensors", icon: Radio },
        { name: "Alert History", path: "/dashboard/admin/alerts", icon: ShieldAlert },
        { name: "Reports & Analytics", path: "/dashboard/admin/analytics", icon: BarChart2 },
        { name: "Plans & Billing", path: "/dashboard/admin/subscriptions", icon: CreditCard },
        { name: "Activity Log", path: "/dashboard/admin/logs", icon: History },
        { name: "User Management", path: "/dashboard/admin/users", icon: Users },
        { name: "System Management", path: "/dashboard/admin/sensors-dev", icon: Cpu },
        { name: "Admin Settings", path: "/dashboard/admin/settings", icon: Settings },
      ]
    : [
        { name: "Home", path: "/dashboard/user", icon: Home },
        { name: "Areas & Sensors", path: "/dashboard/user/sensors", icon: MapPin },
        { name: "Alerts", path: "/dashboard/user/alerts", icon: Bell },
        { name: "Reports", path: "/dashboard/user/reports", icon: BarChart2 },
        { name: "Settings", path: "/dashboard/user/settings", icon: Settings },
      ];

  const renderSidebarContent = (isMobile: boolean = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex h-full w-full flex-col bg-[#F0F2EB] text-[#1A1F24] border-r border-slate-200/60 relative select-none">
        
        {/* 1. HEADER LOGO */}
        <div className={`flex items-center border-b border-slate-200/60 min-h-[65px] transition-all duration-300 ease-in-out ${collapsed ? "justify-center px-0" : "justify-between px-6"}`}>
          <div className="flex items-center">
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
              <Image src="/logo.png" alt="Aetheris Logo" width={34} height={34} className="object-contain" priority />
            </div>
            <h1 className={`flex items-center text-lg font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-2.5"}`}>
              <span className="text-[#1A1F24]">Aetheris</span>
              <span className="text-[10px] bg-[#EAF2EB] text-[#4D6344] px-1.5 py-0.5 rounded ml-1.5 uppercase font-bold shrink-0 shadow-sm">
                {role}
              </span>
            </h1>
          </div>

          {!collapsed && (
            <button type="button" onClick={() => setIsMobileOpen(false)} className="md:hidden shrink-0 p-1 rounded-lg text-slate-500 hover:bg-[#E5E8DE] hover:text-slate-800 transition-colors border-none cursor-pointer">
              <X size={18} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-5 h-7 w-7 items-center justify-center rounded-full border border-slate-200/60 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all z-50 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>

        {/* 2. MENU NAVIGASI */}
        <nav className={`grow py-6 space-y-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${collapsed ? "px-2" : "px-3"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button 
                type="button"
                key={item.path}
                onClick={() => { router.push(item.path); setIsMobileOpen(false); }}
                className={`group relative flex items-center rounded-xl transition-all duration-300 h-11 cursor-pointer border-none
                  ${collapsed ? "w-11 px-0 mx-auto justify-center" : "w-full px-4 justify-start"}
                  ${active 
                    ? "bg-[#4D6344] text-white shadow-md shadow-[#4D6344]/10" 
                    : "text-[#5B636B] hover:bg-[#E3E7DC] hover:text-[#1A1F24] font-medium bg-transparent"}`}
              >
                <Icon size={18} className="shrink-0" strokeWidth={active ? 2.5 : 2} /> 
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-left ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-3"}`}>
                  {item.name}
                </span>
                {collapsed && (
                  <span className="fixed left-[85px] px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-md border border-[#1A1F24]">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. FOOTER (PROFIL & LOGOUT) */}
        <div className="border-t border-slate-200/60 mt-auto bg-[#E8EBE1]">
          <div className="py-4 flex flex-col gap-3 px-3">
            <div className={`flex items-center h-10 transition-all duration-300 ease-in-out ${collapsed ? "justify-center" : "px-1"}`}>
              <div className="w-10 h-10 rounded-full bg-white border border-[#D1D7C7] text-[#4D6344] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {role === "admin" ? "AD" : "PR"}
              </div>
              <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-left ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[180px] opacity-100 ml-3"}`}>
                <p className="text-sm font-bold text-[#1A1F24] leading-tight truncate">
                  {role === "admin" ? "Administrator" : "Partner Restaurant"}
                </p>
                <p className="text-[11px] text-[#5B636B] truncate mt-0.5 font-medium">
                  {userEmail || (role === "admin" ? "Platform Control" : "Pro Plan")}
                </p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`group relative flex items-center rounded-xl text-[#5B636B] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 ease-in-out h-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                ${collapsed ? "w-10 px-0 mx-auto justify-center bg-transparent border-none" : "w-full justify-start px-3 border border-[#D1D7C7] bg-[#F0F2EB] shadow-xs"}`}
            >
              {isLoggingOut && collapsed ? (
                <Loader2 size={16} className="shrink-0 animate-spin text-red-500" />
              ) : (
                <LogOut size={16} className={`shrink-0 transition-transform ${collapsed ? "" : "group-hover:translate-x-0.5"}`} />
              )}
              
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-semibold ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[150px] opacity-100 ml-2"}`}>
                {isLoggingOut ? "Sedang Logout..." : "Log Out"}
              </span>

              {collapsed && !isLoggingOut && (
                <span className="fixed left-[85px] px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-md border border-[#1A1F24]">
                  Log Out
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 4. LAYAR LOADING OVERLAY PENUH (Hanya muncul saat Logout) */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-[#111612]/80 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500 ease-in-out animate-in fade-in">
          <Loader2 size={48} className="text-[#A3E635] animate-spin mb-5 drop-shadow-md" />
          <h2 className="text-white text-lg font-bold tracking-widest uppercase animate-pulse drop-shadow-md">
            Mengakhiri Sesi...
          </h2>
          <p className="text-[#C4D0B7] text-xs font-medium mt-2">
            Mengamankan akses gateway Anda
          </p>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:block shrink-0 ${isMounted ? "transition-[width] duration-300 ease-in-out" : ""} ${isCollapsed ? "w-20" : "w-[260px]"}`}>
        <div className={`fixed top-0 left-0 h-screen z-40 flex flex-col ${isMounted ? "transition-[width] duration-300 ease-in-out" : ""} ${isCollapsed ? "w-20" : "w-[260px]"}`}>
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <aside className={`md:hidden fixed flex-col inset-y-0 left-0 z-50 w-[260px] bg-[#F0F2EB] h-screen transition-transform duration-300 ease-in-out shadow-2xl ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {renderSidebarContent(true)}
      </aside>
      
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="md:hidden fixed inset-0 z-45 bg-[#1A1F24]/50 backdrop-blur-sm transition-opacity duration-300" />
      )}
    </>
  );
}