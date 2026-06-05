"use client";

import { 
  Home, MapPin, Bell, BarChart2, Cpu, Users, Settings, 
  LogOut, ShieldAlert, History, Radio, CreditCard, 
  ChevronLeft, ChevronRight, X
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

  // PERBAIKAN: Gunakan flag global agar Sidebar ingat bahwa web sudah di-load 
  // sehingga tidak perlu mengulang efek dari awal saat pindah halaman
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window !== "undefined" && (window as any).__sidebar_hydrated) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      (window as any).__sidebar_hydrated = true;
    }
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); router.push("/login"); } catch (error) { console.error("Logout failed:", error); }
  };

  const isActive = (path: string) => pathname === path;
  const handleToggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem("aetheris_sidebar_collapsed", JSON.stringify(nextValue));
  };

  const safeCollapsed = isMounted ? isCollapsed : false;
  const transClass = isMounted ? "transition-all duration-300 ease-in-out" : "";

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

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-[#FCFBF8]/80 backdrop-blur-md text-[#1A1F24] border-r border-slate-200/60 relative select-none">
      
      {/* 1. HEADER LOGO */}
      <div className={`flex items-center border-b border-slate-200/60 h-16 ${transClass} ${safeCollapsed ? "justify-center px-0" : "justify-between px-6"}`}>
        <div className="flex items-center">
          <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <h1 className={`flex items-center text-lg font-bold overflow-hidden whitespace-nowrap ${transClass} ${safeCollapsed ? "w-0 opacity-0 ml-0" : "w-40 opacity-100 ml-2.5"}`}>
            Aetheris <span className="text-[10px] bg-[#EAF2EB] text-[#4D6344] px-1.5 py-0.5 rounded ml-2 uppercase shrink-0">{role}</span>
          </h1>
        </div>
        {!safeCollapsed && (
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-200"><X size={18} /></button>
        )}
      </div>

      <button onClick={handleToggleCollapse} className={`hidden md:flex absolute -right-3.5 top-5 h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm z-50 hover:bg-slate-100 ${transClass}`}>
        {safeCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* 2. MENU */}
      <nav className={`grow py-6 space-y-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar ${transClass} ${safeCollapsed ? "px-2" : "px-3"}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => { router.push(item.path); setIsMobileOpen(false); }} className={`group relative flex items-center rounded-xl h-11 cursor-pointer w-full ${transClass} ${safeCollapsed ? "justify-center" : "px-4"} ${active ? "bg-[#EAF2EB] text-[#4D6344] font-bold" : "text-slate-600 hover:bg-slate-100"}`}>
              <Icon size={20} className="shrink-0" />
              <span className={`font-medium overflow-hidden whitespace-nowrap text-left ${transClass} ${safeCollapsed ? "max-w-0 opacity-0 ml-0" : "max-w-40 opacity-100 ml-3"}`}>
                {item.name}
              </span>
              
              {safeCollapsed && isMounted && (
                <span className="fixed left-20 px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. FOOTER (PROFIL & LOGOUT) */}
      <div className={`border-t border-slate-200/60 mt-auto bg-[#F6F5F0]/50 ${transClass} ${safeCollapsed ? "p-2" : "p-4"}`}>
        <div className={`flex flex-col gap-3`}>
          
          <div className={`flex items-center h-10 ${transClass} ${safeCollapsed ? "justify-center" : "px-1"}`}>
            <div className="w-10 h-10 rounded-full bg-[#EAF2EB] text-[#4D6344] flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
              {role === "admin" ? "AD" : "PR"}
            </div>
            
            <div className={`overflow-hidden whitespace-nowrap text-left ${transClass} ${safeCollapsed ? "max-w-0 opacity-0 ml-0" : "max-w-45 opacity-100 ml-3"}`}>
              <p className="text-sm font-bold text-[#1A1F24] leading-tight truncate">
                {role === "admin" ? "Administrator" : "Partner Restaurant"}
              </p>
              <p className="text-[11px] text-[#5B636B] truncate mt-0.5 font-medium">
                {userEmail || (role === "admin" ? "Platform Control" : "Pro Plan")}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className={`group flex items-center text-[#5B636B] hover:bg-red-50 hover:text-red-600 rounded-xl h-10 cursor-pointer ${transClass} ${safeCollapsed ? "w-10 px-0 mx-auto justify-center" : "w-full justify-start px-3 bg-white border border-slate-200/60 shadow-xs"}`}
          >
            <LogOut size={16} className={`shrink-0 ${safeCollapsed ? "" : "group-hover:translate-x-0.5 transition-transform"}`} />
            
            <span className={`text-xs font-semibold overflow-hidden whitespace-nowrap text-left ${transClass} ${safeCollapsed ? "max-w-0 opacity-0 ml-0" : "max-w-36 opacity-100 ml-2"}`}>
              Log Out
            </span>

            {safeCollapsed && isMounted && (
              <span className="fixed left-20 px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-red-700">
                Log Out
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:flex flex-col h-screen sticky top-0 z-40 shrink-0 will-change-width ${transClass} ${safeCollapsed ? "w-20" : "w-64"}`}>
        {sidebarContent}
      </aside>

      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#FCFBF8] h-screen transition-transform duration-300 ease-in-out shadow-2xl ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
      
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="md:hidden fixed inset-0 z-40 bg-[#1A1F24]/40 backdrop-blur-sm transition-opacity duration-300" />
      )}
    </>
  );
}