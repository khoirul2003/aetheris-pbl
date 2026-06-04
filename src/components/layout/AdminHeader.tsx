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
    // Header transparan namun menggunakan efek blur dengan warna dasar krem agar serasi
    <header className="rounded-2xl border border-slate-200/60 bg-white/60 px-6 py-5 shadow-xs backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        
        <div className="flex items-start gap-3">
          <button 
            onClick={onToggleMobileMenu}
            className="md:hidden mt-1 p-2 rounded-xl border border-slate-200/60 bg-white text-[#5B636B] shadow-xs hover:bg-[#F2EFE9] hover:text-[#1A1F24] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Menu size={18} strokeWidth={2.5} />
          </button>
          
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#8C939A]">
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1A1F24] truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-[#5B636B] font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C939A]" size={16} />
            <input
              // Mengubah garis fokus ke warna #4D6344 (Hijau Zaitun)
              className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-11 pr-4 text-xs font-medium text-[#1A1F24] placeholder:text-[#8C939A] focus:border-[#4D6344] focus:outline-none focus:ring-4 focus:ring-[#4D6344]/10 transition-all shadow-inner"
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-[#5B636B] shadow-xs transition-all hover:bg-[#F2EFE9] hover:text-[#1A1F24] active:bg-slate-100 cursor-pointer">
              <Bell size={14} className="text-[#5B636B]" />
              <span>Support</span>
            </button>

            <button className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-[#1A1F24] text-white text-xs font-bold shadow-xs hover:bg-[#333C45] hover:scale-105 active:scale-95 transition-all cursor-pointer">
              AD
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}