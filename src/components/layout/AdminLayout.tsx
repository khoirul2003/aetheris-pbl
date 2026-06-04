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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Safely load sidebar collapse state from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem("aetheris_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-[#f4f6ff] text-slate-900 font-sans antialiased">
      {/* Background radial highlights */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] bg-size-[18px_18px] opacity-40 z-0" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent z-0" />

      {/* Sidebar Container */}
      <div className="z-40 relative flex-shrink-0">
        <Sidebar 
          role="admin"
          userEmail={userEmail}
          isCollapsed={mounted ? isCollapsed : false}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 z-10">
        
        {/* Header Section - Margin diperkecil (hanya px-4 atau px-6) */}
        <div className="px-4 md:px-6 pt-4 md:pt-6">
          <div className="w-full">
            <AdminHeader 
              title={title} 
              description={description} 
              onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
            />
          </div>
        </div>

        {/* Content Wrapper - Margin diperkecil, max-width dilepas agar melebar */}
        <main className="flex-1 px-4 md:px-6 py-6">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}