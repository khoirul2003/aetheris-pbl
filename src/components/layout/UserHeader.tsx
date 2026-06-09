"use client";

import { Search, Menu, User } from "lucide-react";

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
    <header 
      className="sticky top-4 z-40 rounded-2xl border px-5 py-4 shadow-xs backdrop-blur-md transition-all duration-300"
      style={{ 
        backgroundColor: "var(--header-bg)", 
        borderColor: "var(--header-border)" 
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        
        {/* KIRI: Titles & Menu Button */}
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] leading-none mb-1.5 md:ml-0 ml-[44px]" style={{ color: "var(--header-subtitle)" }}>
            User Dashboard
          </p>
          
          {/* Baris Judul Sejajar dengan Hamburger */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleMobileMenu}
              className="md:hidden shrink-0 p-1.5 rounded-lg border shadow-sm active:scale-95 transition-all cursor-pointer"
              style={{ 
                borderColor: "var(--header-border)", 
                backgroundColor: "var(--sidebar-collapse-bg)", 
                color: "var(--sidebar-text)" 
              }}
              title="Open Menu"
            >
              <Menu size={18} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate leading-tight" style={{ color: "var(--header-title)" }}>
              {title}
            </h1>
          </div>

          {description && (
            <p className="text-xs font-medium leading-relaxed truncate md:ml-0 ml-[44px] mt-1" style={{ color: "var(--header-text-muted)" }}>
              {description}
            </p>
          )}
        </div>

        {/* KANAN: Search & Profile (Support Dihapus) */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          {/* Search Bar - Sekarang bisa sejajar dengan profil di mobile */}
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: "var(--header-search-placeholder)" }} />
            <input
              className="w-full rounded-xl border py-2 pl-10 pr-4 text-xs font-medium focus:border-[#4D6344] dark:focus:border-[#3fb950] focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 dark:focus:ring-[#3fb950]/20 transition-all"
              style={{
                backgroundColor: "var(--header-search-bg)",
                borderColor: "var(--header-search-border)",
                color: "var(--header-search-text)",
              }}
              placeholder={searchPlaceholder}
            />
          </div>

          {/* Partner Profile Avatar */}
          <button 
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 bg-[#1A1F24] dark:bg-[#238636] text-white text-[11px] font-bold shadow-xs hover:bg-[#333C45] dark:hover:bg-[#2ea043] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Partner Profile"
          >
            <User size={16} />
          </button>
        </div>

      </div>
    </header>
  );
}