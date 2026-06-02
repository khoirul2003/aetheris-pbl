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
  Receipt,
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

  // Helper untuk mengecek menu aktif secara akurat
  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 text-slate-800 flex flex-col border-r border-slate-200 z-50">
      {/* Header / Logo Section */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
        <div className="relative">
          <Flame className="text-orange-500" size={24} strokeWidth={2.5} />
          <div className="absolute inset-2 bg-yellow-400 blur-sm -z-10 rounded-full"></div>
        </div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          <span className="text-blue-900">
            AETHERIS{" "}
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1 uppercase font-semibold">
              {role}
            </span>
          </span>
        </h1>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {role === "admin" ? (
          // ================= MENU KHUSUS ADMIN =================
          <>
            <button
              onClick={() => router.push("/dashboard/admin")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Home
                size={18}
                strokeWidth={isActive("/dashboard/admin") ? 2.5 : 2}
              />
              <span>Dashboard Admin</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/sensors")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/sensors")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Radio
                size={18}
                strokeWidth={isActive("/dashboard/admin/sensors") ? 2.5 : 2}
              />
              <span>Manajemen Sensor</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/alerts")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/alerts")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <ShieldAlert
                size={18}
                strokeWidth={isActive("/dashboard/admin/alerts") ? 2.5 : 2}
              />
              <span>Riwayat Alert</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/analytics")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/analytics")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <BarChart2
                size={18}
                strokeWidth={isActive("/dashboard/admin/analytics") ? 2.5 : 2}
              />
              <span>Laporan & Analitik</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/subscriptions")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/subscriptions")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <CreditCard
                size={18}
                strokeWidth={
                  isActive("/dashboard/admin/subscriptions") ? 2.5 : 2
                }
              />
              <span>Paket Langganan</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/billing")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/billing")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Receipt
                size={18}
                strokeWidth={
                  isActive("dashboard/admin/billing") ? 2.5 : 2}
              />
              <span>Billing User</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/logs")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/logs")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <History
                size={18}
                strokeWidth={isActive("/dashboard/admin/logs") ? 2.5 : 2}
              />
              <span>Activity Log</span>
            </button>

            <button 
              onClick={() => router.push("/dashboard/admin/users")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${isActive("/dashboard/admin/users") 
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}
            >
              <Users size={18} strokeWidth={isActive("/dashboard/admin/users") ? 2.5 : 2} /> 
              <span>Manajemen User</span>
            </button>

            <button 
              onClick={() => router.push("/dashboard/admin/sensors")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${isActive("/dashboard/admin/sensors") 
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}
            >
              <Cpu size={18} strokeWidth={isActive("/dashboard/admin/sensors") ? 2.5 : 2} /> 
              <span>Manajemen Sensor</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/settings")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/admin/settings")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Settings
                size={18}
                strokeWidth={isActive("/dashboard/admin/settings") ? 2.5 : 2}
              />
              <span>Pengaturan Admin</span>
            </button>
          </>
        ) : (
          // ================= MENU KHUSUS USER / RESTORAN =================
          <>
            <button
              onClick={() => router.push("/dashboard/user")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/user")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Home
                size={18}
                strokeWidth={isActive("/dashboard/user") ? 2.5 : 2}
              />
              <span>Beranda</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/user/sensors")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/user/sensors")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <MapPin
                size={18}
                strokeWidth={isActive("/dashboard/user/sensors") ? 2.5 : 2}
              />
              <span>Area & Sensor</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/user/alerts")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/user/alerts")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Bell
                size={18}
                strokeWidth={isActive("/dashboard/user/alerts") ? 2.5 : 2}
              />
              <span>Alert</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/user/reports")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/user/reports")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <BarChart2
                size={18}
                strokeWidth={isActive("/dashboard/user/reports") ? 2.5 : 2}
              />
              <span>Laporan</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/user/settings")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer
                ${
                  isActive("/dashboard/user/settings")
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
            >
              <Settings
                size={18}
                strokeWidth={isActive("/dashboard/user/settings") ? 2.5 : 2}
              />
              <span>Pengaturan</span>
            </button>
          </>
        )}
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
            <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
              {role === "admin" ? "Administrator" : "Restoran Warung"}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
              {userEmail ||
                (role === "admin" ? "Platform Control" : "Paket Pro")}
            </p>
          </div>
        </div>
        <LogOut
          size={16}
          className="text-slate-400 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        />
      </div>
    </div>
  );
}