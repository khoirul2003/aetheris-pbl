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

  // Safely load sidebar collapse state from localStorage after mount (prevents SSR hydration issues)
  useEffect(() => {
    const saved = localStorage.getItem("aetheris_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-[#f4f6ff] text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* Background radial highlights for premium look */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] bg-size-[18px_18px] opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent" />

      {/* Sidebar - Mounted state controls visibility styling to avoid layout shift */}
      <Sidebar 
        role="admin"
        userEmail={userEmail}
        isCollapsed={mounted ? isCollapsed : false}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        {/* Header Section */}
        <div className="p-4 md:p-6 pb-0">
          <AdminHeader 
            title={title} 
            description={description} 
            onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
          />
        </div>

        {/* Content Wrapper */}
        <main className="flex-grow p-4 md:p-6 transition-all duration-300">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
