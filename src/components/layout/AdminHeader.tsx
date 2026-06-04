"use client";

import { Search, Bell, Menu } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  description?: string;
  onToggleMobileMenu: () => void;
  searchPlaceholder?: string;
}

export default function AdminHeader({ 
  title, 
  description, 
  onToggleMobileMenu,
  searchPlaceholder = "Cari restoran, sensor, atau alert..."
}: AdminHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200/70 bg-white/90 px-6 py-5 shadow-xs backdrop-blur transition-all duration-300">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        
        {/* Left Side: Hamburger Trigger & Title Details */}
        <div className="flex items-start gap-3">
          {/* Hamburger Menu Trigger (Mobile/Tablet only) */}
          <button 
            onClick={onToggleMobileMenu}
            className="md:hidden mt-1 p-2 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Buka Menu"
          >
            <Menu size={18} strokeWidth={2.5} />
          </button>
          
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Search, Support, Profile */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
          {/* Search Bar */}
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-11 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#4D6344] focus:outline-none focus:ring-4 focus:ring-[#4D6344]/20 transition-all"
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Support/Notification Button */}
            <button className="grow sm:grow-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#4D6344] shadow-xs transition-all hover:bg-[#EAF2EB] active:bg-slate-100 cursor-pointer">
              <Bell size={14} className="text-[#4D6344]" />
              <span>Support</span>
            </button>

            {/* User Profile Avatar */}
            <button 
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#1A1F24] text-white text-xs font-bold shadow-xs hover:bg-[#333C45] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Profil Admin"
            >
              AD
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}