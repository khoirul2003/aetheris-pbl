"use client";

import { 
  Home, MapPin, Bell, BarChart2, Users, Settings, 
  LogOut, ShieldAlert, History, Radio, CreditCard, 
  ChevronLeft, ChevronRight, X, Loader2
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import Image from "next/image";
import ThemeToggle from "@/src/components/ThemeToggle";

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Membungkus setIsMounted dengan setTimeout untuk menghindari cascading render
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    // Sekalian memuat halaman login di latar belakang agar proses logout terasa instan
    router.prefetch("/login");

    // Membersihkan timer jika komponen dilepas (unmount)
    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    
    setIsLoggingOut(true); 
    setIsMobileOpen(false); 
    
    // Hapus sesi secara instan
    sessionStorage.removeItem("aetheris_admin_auth");
    
    // Pindah halaman secara instan (karena sudah di-prefetch)
    router.replace("/login");
    
    // Putus sesi Firebase di latar belakang
    signOut(auth).catch((error) => {
      console.error("Failed to log out from server:", error);
    });
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
      <div className="flex h-full w-full flex-col text-[var(--sidebar-text)] border-r border-[var(--sidebar-border)] relative select-none transition-colors duration-300" style={{ backgroundColor: "var(--sidebar-bg)" }}>
        
        {/* 1. HEADER LOGO */}
        <div className={`flex items-center border-b border-[var(--sidebar-border)] min-h-16.25 transition-all duration-300 ease-in-out ${collapsed ? "justify-center px-0" : "justify-between px-6"}`}>
          <div className="flex items-center">
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
              <Image src="/logo.png" alt="Aetheris Logo" width={34} height={34} className="object-contain" priority />
            </div>
            <h1 className={`flex items-center text-lg font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-50 opacity-100 ml-2.5"}`}>
              <span className="text-[var(--sidebar-text)]">Aetheris</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded ml-1.5 uppercase font-bold shrink-0 shadow-sm" style={{ backgroundColor: "var(--sidebar-badge-bg)", color: "var(--sidebar-badge-text)" }}>
                {role}
              </span>
            </h1>
          </div>

          {!collapsed && (
            <button type="button" onClick={() => setIsMobileOpen(false)} className="md:hidden shrink-0 p-1 rounded-lg text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] transition-colors border-none cursor-pointer">
              <X size={18} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-5 h-7 w-7 items-center justify-center rounded-full border border-[var(--sidebar-border)] text-[var(--sidebar-text-muted)] shadow-sm hover:text-[var(--sidebar-text)] transition-all z-50 cursor-pointer"
          style={{ backgroundColor: "var(--sidebar-collapse-bg)" }}
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
                    ? "text-[var(--sidebar-active-text)] shadow-md" 
                    : "text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] font-medium bg-transparent"}`}
                style={active 
                  ? { backgroundColor: "var(--sidebar-active-bg)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" } 
                  : undefined}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "var(--sidebar-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Icon size={18} className="shrink-0" strokeWidth={active ? 2.5 : 2} /> 
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-left ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-50 opacity-100 ml-3"}`}>
                  {item.name}
                </span>
                {collapsed && (
                  <span className="fixed left-21.25 px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-100 shadow-md border border-[#1A1F24]">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. FOOTER (THEME TOGGLE, PROFIL & LOGOUT) */}
        <div className="border-t border-[var(--sidebar-border)] mt-