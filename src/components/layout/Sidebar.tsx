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
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";

interface SidebarProps {
  role?: "admin" | "user";
  userEmail?: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  role = "admin", 
  userEmail, 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
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

  const handleToggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem("aetheris_sidebar_collapsed", JSON.stringify(nextValue));
  };

  const menuItems = role === "admin" 
    ? [
        { name: "Dashboard Admin", path: "/dashboard/admin", icon: Home },
        { name: "Manajemen Sensor", path: "/dashboard/admin/sensors", icon: Radio },
        { name: "Riwayat Alert", path: "/dashboard/admin/alerts", icon: ShieldAlert },
        { name: "Laporan & Analitik", path: "/dashboard/admin/analytics", icon: BarChart2 },
        { name: "Paket & Billing", path: "/dashboard/admin/subscriptions", icon: CreditCard },
        { name: "Activity Log", path: "/dashboard/admin/logs", icon: History },
        { name: "Manajemen User", path: "/dashboard/admin/users", icon: Users },
        { name: "Manajemen Sistem", path: "/dashboard/admin/sensors-dev", icon: Cpu },
        { name: "Pengaturan Admin", path: "/dashboard/admin/settings", icon: Settings },
      ]
    : [
        { name: "Beranda", path: "/dashboard/user", icon: Home },
        { name: "Area & Sensor", path: "/dashboard/user/sensors", icon: MapPin },
        { name: "Alert", path: "/dashboard/user/alerts", icon: Bell },
        { name: "Laporan", path: "/dashboard/user/reports", icon: BarChart2 },
        { name: "Pengaturan", path: "/dashboard/user/settings", icon: Settings },
      ];

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-white text-slate-800 border-r border-slate-200 relative select-none">
      
      {/* 1. Header / Logo Section */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 min-h-[65px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative shrink-0">
            <Flame className="text-orange-500" size={24} strokeWidth={2.5} />
            <div className="absolute inset-2 bg-yellow-400 blur-sm -z-10 rounded-full"></div>
          </div>
          <h1 className={`text-lg font-bold text-slate-900 tracking-tight transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 pointer-events-none" : "opacity-100 w-auto"}`}>
            <span className="text-blue-900">
              AETHERIS 
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1.5 uppercase font-semibold">
                {role}
              </span>
            </span>
          </h1>
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Collapse Trigger Button (Desktop/Tablet Float) */}
      <button
        onClick={handleToggleCollapse}
        className="hidden md:flex absolute -right-3.5 top-[20px] h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all z-50 cursor-pointer"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
      </button>

      {/* 2. Navigation Section */}
      <nav className="flex-grow px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button 
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setIsMobileOpen(false); // Close drawer on mobile navigation
              }}
              className={`group relative w-full flex items-center gap-3 rounded-xl transition-all text-sm cursor-pointer py-2.5
                ${isCollapsed ? "justify-center px-0" : "px-4"}
                ${active 
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs" 
                  : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 font-medium"}`}
            >
              <Icon size={18} className="shrink-0" strokeWidth={active ? 2.5 : 2} /> 
              
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"}`}>
                {item.name}
              </span>

              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-md border border-slate-800">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer Profile & Logout Section */}
      <div className="border-t border-slate-200 mt-auto bg-slate-50/50">
        <div className={`p-4 flex flex-col gap-3 ${isCollapsed ? "items-center" : ""}`}>
          
          {/* Profile Container */}
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
              {role === "admin" ? "AD" : "RW"}
            </div>
            
            <div className={`transition-all duration-300 flex-grow min-w-0 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                {role === "admin" ? "Administrator" : "Restoran Warung"}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                {userEmail || (role === "admin" ? "Platform Control" : "Paket Pro")}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-xs font-semibold cursor-pointer group relative
              ${isCollapsed ? "justify-center" : "justify-start border border-slate-200/60 bg-white shadow-xs"}`}
            title="Keluar dari Akun"
          >
            <LogOut size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            <span className={`transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 pointer-events-none hidden" : "w-auto opacity-100 block"}`}>
              Keluar Akun
            </span>

            {/* Tooltip for Collapsed Logout */}
            {isCollapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-red-650 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-md border border-red-800">
                Keluar Akun
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* A. Desktop/Tablet Sidebar (screen >= md) */}
      <aside 
        className={`hidden md:flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? "w-[80px]" : "w-[260px]"}`}
      >
        {sidebarContent}
      </aside>

      {/* B. Mobile Drawer Sidebar (screen < md) */}
      <aside
        className={`md:hidden fixed flex-col inset-y-0 left-0 z-50 w-[260px] bg-white h-screen transition-transform duration-300 ease-in-out shadow-2xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>

      {/* C. Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        />
      )}
    </>
  );
}