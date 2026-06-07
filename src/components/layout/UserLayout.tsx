"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Sidebar from "./Sidebar";
import UserHeader from "./UserHeader";

interface UserLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function UserLayout({ 
  title, 
  description, 
  children,
  userEmail
}: UserLayoutProps) {
  
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("aetheris_user_auth") === "true") {
      return true;
    }
    return false;
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aetheris_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [, setMounted] = useState<boolean>(false);

 useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        sessionStorage.removeItem("aetheris_user_auth");
        router.replace("/login");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists() && userDoc.data().role === "admin") {
            sessionStorage.removeItem("aetheris_user_auth");
            router.replace("/dashboard/admin"); 
          } else {
            sessionStorage.setItem("aetheris_user_auth", "true");
            if (!isAuthorized) setIsAuthorized(true); 
          }
        } catch (error) {
          console.error("Gagal memeriksa role:", error);
          router.replace("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [router, isAuthorized]);

  return (
    <div className="relative flex min-h-screen text-[#1A1F24] font-sans antialiased overflow-hidden">
      
      {/* MESH GRADIENT BACKGROUND */}
      <div className="fixed inset-0 z-[-1] bg-linear-to-br from-[#F6F8F4] via-[#F0F4EC] to-[#E6ECE0]">
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-linear-to-br from-[#C4D0B7]/50 to-[#9EAF8C]/20 blur-[120px] mix-blend-multiply opacity-80 pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-linear-to-tl from-[#B3C2A4]/50 to-[#D5DFCB]/20 blur-[120px] mix-blend-multiply opacity-80 pointer-events-none" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#FFFFFF]/70 blur-[100px] pointer-events-none" />
      </div>

      <div className="z-40 relative shrink-0">
        <Sidebar 
          role="user"
          userEmail={userEmail}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 z-10">
        <div className="px-4 md:px-6 pt-4 md:pt-6">
          <div className="w-full">
            <UserHeader 
              title={title} 
              description={description} 
              onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
            />
          </div>
        </div>

        <main className="flex-1 px-4 md:px-6 py-6">
          {/* Konten akan muncul secara mulus (fade-in) setelah otorisasi selesai */}
          <div 
            className={`w-full transition-opacity duration-500 ease-out ${
              isAuthorized ? "opacity-100" : "opacity-0"
            }`}
          >
            {isAuthorized && children}
          </div>
        </main>
      </div>
    </div>
  );
}