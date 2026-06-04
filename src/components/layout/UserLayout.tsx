"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

interface UserLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full bg-[#F6F5F0] overflow-hidden text-slate-900 font-sans">
      <div className="z-40 relative h-full">
        <Sidebar
          role="user" // Mengatur menu sidebar agar yang muncul adalah menu User
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        {/* Header Sederhana Khusus User (Hanya untuk tombol menu mobile & Judul) */}
        <header className="flex md:hidden items-center gap-3 bg-white px-4 py-3 border-b border-slate-200">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-bold text-slate-800 text-lg">{title}</h1>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}