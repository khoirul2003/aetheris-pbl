"use client";

import { Search, Menu } from "lucide-react";

interface UserHeaderProps {
  title: string;
  description?: string;
  onToggleMobileMenu: () => void;
  searchPlaceholder?: string;
}

export default function UserHeader({ 
  title, 
  description, 
  onToggleMobileMenu,
  searchPlaceholder = "Search sensors, areas, or alerts..."
}: UserHeaderProps) {
  return (
    <header className="sticky top-4 z-40 rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-4 shadow-xs backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        
        {/* KIRI: Titles & Menu Button */}
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-none mb-1.5 md:ml-0 ml-[44px]">
            User Dashboard
          </p>
          
          {/* Baris Judul Sejajar dengan Hamburger */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleMobileMenu}
              className="md:hidden shrink-0 p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Open Menu"
            >
              <Menu size={18} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate leading-tight">
              {title}
            </h1>
          </div>

          {description && (
            <p className="text-xs text-slate-500 font-medium leading-relaxed truncate md:ml-0 ml-[44px] mt-1">
              {description}
            </p>
          )}
        </div>

        {/* KANAN: Search & Profile (Support Dihapus) */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* Search Bar - Sekarang bisa sejajar dengan profil di mobile */}
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#4D6344] focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 transition-all"
              placeholder={searchPlaceholder}
            />
          </div>

          {/* Partner Profile Avatar */}
          <button 
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#1A1F24] text-white text-[11px] font-bold shadow-xs hover:bg-[#333C45] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Partner Profile"
          >
            PR
          </button>
        </div>

      </div>
    </header>
  );
}