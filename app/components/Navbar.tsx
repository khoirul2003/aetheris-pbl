// file: src/app/components/Navbar.tsx (atau menyesuaikan folder Anda)

import { Bell } from "lucide-react";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-[73px] bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6 md:px-8">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      
      <div className="flex items-center gap-4">
        <span className="bg-[#E9F2E4] text-[#4A6741] text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-[#D1E2C7]">
          Memantau langsung
        </span>
        
        <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-1">
          <Bell size={20} />
          {/* Titik Notifikasi Merah */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}