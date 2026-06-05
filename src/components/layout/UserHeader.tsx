"use client";

import { Search, Bell, Menu } from "lucide-react";

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
    <>
      {/* WADAH STICKY 0-HEIGHT 
        Ini akan memastikan tombol selalu melayang di atas tanpa peduli adanya animasi atau overflow di parent.
        'h-0' (height 0) memastikan ini tidak merusak margin/layout dari headernya.
      */}
      <div className="sticky top-4 z-[99] w-full h-0 pointer-events-none">
        <button 
          onClick={onToggleMobileMenu}
          /* absolute left-5 top-4 akan menaruh posisinya persis bertumpuk dengan letak aslinya di dalam card header */
          className="md:hidden pointer-events-auto absolute left-5 top-4 p-2 rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-md text-slate-700 shadow-md hover:bg-white hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
          title="Open Menu"
        >
          <Menu size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* HEADBAR NORMAL (Akan ikut ter-scroll ke atas dan menghilang) */}
      <header className="rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-4 shadow-xs backdrop-blur transition-all duration-300">
        <div className="flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
          
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* SPACER (Ruang Kosong) - Menggantikan posisi tombol agar teks judul tidak geser ke kiri */}
            <div className="md:hidden w-[38px] shrink-0" />
            
            <div className="min-w-0 flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-none mb-1">
                User Dashboard
              </p>
              {/* pb-1 untuk mencegah huruf g/y terpotong */}
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate leading-tight pb-1">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Search, Support, Profile */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
            <div className="relative w-full xl:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#4D6344] focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 transition-all"
                placeholder={searchPlaceholder}
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button className="grow sm:grow-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#4D6344] shadow-xs transition-all hover:bg-[#EAF2EB] active:bg-slate-100 cursor-pointer">
                <Bell size={14} className="text-[#4D6344]" />
                <span>Support</span>
              </button>

              <button 
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#1A1F24] text-white text-[11px] font-bold shadow-xs hover:bg-[#333C45] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Partner Profile"
              >
                PR
              </button>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}