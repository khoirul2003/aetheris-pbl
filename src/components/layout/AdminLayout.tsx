"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function AdminLayout({ 
  title, 
  description, 
  children,
  userEmail
}: AdminLayoutProps) {
  // 1. Trik Sinkronisasi Instan: Langsung baca localStorage di nilai awal state
  // Ini mencegah sidebar berkedip terbuka saat pindah page (client-side routing)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aetheris_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-[#FCFBF8] text-[#1A1F24] font-sans antialiased">
      
      {/* Sidebar Container */}
      <div className="z-40 relative shrink-0">
        <Sidebar 
          role="admin"
          userEmail={userEmail}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 z-10">
        <div className="px-4 md:px-6 pt-4 md:pt-6">
          <div className="w-full">
            <AdminHeader 
              title={title} 
              description={description} 
              onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
            />
          </div>
        </div>

        <main className="flex-1 px-4 md:px-6 py-6">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}