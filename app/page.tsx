"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Wifi, 
  Smartphone, 
  BarChart3, 
  CheckCircle2, 
  Menu, 
  X, 
  ArrowRight, 
  Flame, 
  Zap,
  Layers,
  Loader2
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State untuk mengontrol animasi Cinematic (Masuk & Keluar)
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Memicu animasi fade-in segera setelah Landing Page dimuat
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50); // Delay kecil agar browser sempat me-render frame transisi awal
    return () => clearTimeout(timer);
  }, []);

  // Mengaktifkan fitur Smooth Scrolling bawaan browser
  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");
    return () => {
      document.documentElement.classList.remove("scroll-smooth");
    };
  }, []);

  // Fungsi untuk handle klik tombol login dengan transisi Cinematic
  const handleNavigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return; // Cegah double click
    
    setMobileMenuOpen(false); 
    setIsNavigating(true); // Memicu efek blur dan fade out
    
    // Tunggu animasi fade (500ms), lalu pindah halaman
    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  return (
    // Efek transisi diterapkan di kontainer utama (Entrance & Exit)
    <div className={`antialiased min-h-screen font-sans overflow-x-hidden transition-all duration-500 ease-in-out ${
      isMounted && !isNavigating ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-[0.99]"
    }`} style={{ backgroundColor: "var(--background)", color: "var(--card-text)" }}>
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Aetheris Logo" 
              width={60} 
              height={38} 
              className="object-contain dark:invert"
              priority
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold" style={{ color: "var(--card-text-muted)" }}>
            <a href="#fitur" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Main Features</a>
            <a href="#arsitektur" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Architecture</a>
            <a href="#harga" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Service Packages</a>
            
            {/* Tombol Login Desktop */}
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="px-5 py-2.5 text-white rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border-none min-w-[170px] justify-center hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {isNavigating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Enter Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 cursor-pointer border-none bg-transparent hover:opacity-80"
            style={{ color: "var(--card-text-muted)" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b px-4 pt-2 pb-6 space-y-3 flex flex-col text-sm font-bold shadow-lg" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Main Features</a>
            <a href="#arsitektur" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Architecture</a>
            <a href="#harga" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Service Packages</a>
            
            {/* Tombol Login Mobile */}
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="w-full py-3 text-white rounded-xl text-center flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border-none hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {isNavigating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Enter Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}>
            <Zap size={14} /> IoT-Based Specifically for the Catering & Restaurant Industry
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]" style={{ color: "var(--card-title)" }}>
            Early Gas Leak Detection System <span style={{ color: "var(--accent-primary)" }}>Real-Time</span>
          </h1>
          <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Protect your commercial kitchen from the fatal risks of LPG leaks and fires. Integrated with smart ESP32 sensors, reactive physical alarms, and an interactive Next.js dashboard with an automatic WhatsApp gateway.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <a 
              href="#fitur" 
              className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg text-center transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              Learn Features
            </a>
            <a 
              href="#harga" 
              className="px-8 py-4 font-bold rounded-2xl border text-center shadow-sm transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-title)" }}
            >
              View Demo & Pricing
            </a>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="w-full max-w-120 border rounded-3xl p-6 shadow-xl relative overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: "var(--card-surface-border)" }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: "rgb(244, 63, 94)" }}></span>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Live Device Telemetry</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black font-mono" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "rgb(16, 185, 129)" }}>NODE_SENSOR_002</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-2xl" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                  <span className="text-[11px] font-bold uppercase" style={{ color: "var(--card-text-faint)" }}>Gas/Smoke Level</span>
                  <p className="text-2xl font-black mt-1 font-mono" style={{ color: "var(--card-title)" }}>380 <span className="text-xs" style={{ color: "var(--card-text-muted)" }}>PPM</span></p>
                </div>
                <div className="border p-4 rounded-2xl" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)" }}>
                  <span className="text-[11px] font-bold uppercase" style={{ color: "var(--accent-primary)" }}>Status</span>
                  <p className="text-xl font-black mt-1 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>Safe</p>
                </div>
              </div>

              <div className="border rounded-2xl p-4 space-y-2.5 text-xs" style={{ borderColor: "var(--card-surface-border)" }}>
                <div className="flex justify-between font-medium">
                  <span style={{ color: "var(--card-text-muted)" }}>Kitchen Room Temperature</span>
                  <span className="font-bold" style={{ color: "var(--card-title)" }}>29°C</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-surface)" }}>
                  <div className="h-full" style={{ width: "45%", backgroundColor: "var(--accent-primary)" }}></div>
                </div>
                <div className="flex justify-between font-medium">
                  <span style={{ color: "var(--card-text-muted)" }}>Air Humidity</span>
                  <span className="font-bold" style={{ color: "var(--card-title)" }}>62%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-surface)" }}>
                  <div className="h-full" style={{ width: "62%", backgroundColor: "rgb(59, 130, 246)" }}></div>
                </div>
              </div>

              <div className="border p-3.5 rounded-xl flex gap-2.5 text-[11px] font-medium leading-relaxed" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", color: "rgb(245, 158, 11)" }}>
                <Smartphone className="shrink-0" size={16} />
                <span>WhatsApp Gateway stands by to send automatic alerts to the manager's number if the gas indicator exceeds safe limits.</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -z-10 w-72 h-72 rounded-full blur-3xl -top-10 -right-10 opacity-20" style={{ backgroundColor: "var(--accent-primary)" }}></div>
        </div>
      </section>

      <hr className="max-w-7xl mx-auto" style={{ borderColor: "var(--card-border)" }} />

      {/* 3. FITUR UTAMA */}
      <section id="fitur" className="scroll-mt-24 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Device Advantages</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-title)" }}>
            Comprehensive Protection Without Spatial Boundaries
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--card-text-muted)" }}>
            Developed with reliable architectural standards to ensure sensor data accuracy and emergency signal transmission speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
              <Flame size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Sensitive MQ-2 Sensor</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Detects LPG gas concentrations, kitchen smoke, and other flammable gases early before triggering a fire eruption.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
              <Wifi size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Wireless Provisioning</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Change your restaurant's Wi-Fi easily at any time wirelessly via mobile Captive Portal without needing to reprogram the device.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "rgb(245, 158, 11)" }}>
              <Smartphone size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Instant WhatsApp Alert</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Danger notifications are sent directly to the manager's or restaurant owner's phone number outside of kitchen working hours.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "rgb(168, 85, 247)" }}>
              <BarChart3 size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Real-Time Dashboard</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Instant data synchronization in under 1 second utilizing Firebase Realtime Database integrated with Next.js 14 App Router.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ARSITEKTUR TEKNOLOGI */}
      <section id="arsitektur" className="scroll-mt-20 py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--card-title)", color: "var(--card-bg)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgb(163, 230, 53)" }}>
              <Layers size={14} /> Latest Industrial Technology
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-bg-solid)" }}>
              End-to-End Integrated System Architecture
            </h2>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
              Aetheris is built using a modern technology ecosystem to ensure high reactivity and constant data availability 24/7.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Hardware Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>ESP32 Microcontroller, DHT11 Temperature & Humidity Sensor, MQ-2 Gas Sensor, 16x2 I2C LCD Screen, Buzzer Alarm, and Actuation LED.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Cloud Infrastructure Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>Firebase Realtime Database for instant sensor data synchronization and Firestore Database for managing customer account documents.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Application Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>Multi-role dashboard (Admin & User) based on the Next.js Framework using TailwindCSS hosted on the Super Fast Vercel Serverless Network.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-3xl p-6 space-y-4" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.1)" }}>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "rgb(163, 230, 53)" }}>Emergency System Workflow</h3>
            <div className="divide-y font-medium text-xs" style={{ borderColor: "rgba(255, 255, 255, 0.05)", color: "rgba(255, 255, 255, 0.8)" }}>
              <div className="py-3 flex justify-between">
                <span>1. Gas Leak Occurs</span>
                <span style={{ color: "rgb(248, 113, 113)" }}>Gas Level &gt; 600 PPM</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>2. Kitchen Physical Actuation</span>
                <span style={{ color: "rgb(251, 191, 36)" }}>Buzzer Sounds & LED Flashes</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>3. Firebase Cloud Transmission</span>
                <span style={{ color: "rgb(96, 165, 250)" }}>Node Status Changes to &quot;danger&quot;</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>4. Web Dashboard Alert</span>
                <span style={{ color: "rgb(192, 132, 252)" }}>Red Alert Screen Flashes Instantly</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>5. WhatsApp Gateway</span>
                <span style={{ color: "rgb(163, 230, 53)" }}>Emergency Message Sent to Mobile</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HARGA & PAKET */}
      <section id="harga" className="scroll-mt-24 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Investment Plan</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-title)" }}>
            Service Packages According to Your Business Scale
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--card-text-muted)" }}>
            The best restaurant asset protection investment for working comfort and daily operational security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {/* Paket Basic */}
          <div className="border p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--card-title)" }}>Basic Package</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--card-text-muted)" }}>Suitable for SMEs, Depots, or Small Food Stalls</p>
              </div>
              <div className="text-3xl font-black" style={{ color: "var(--card-title)" }}>
                Rp 49.000 <span className="text-xs font-medium font-sans" style={{ color: "var(--card-text-muted)" }}>/ month</span>
              </div>
              <hr style={{ borderColor: "var(--card-surface-border)" }} />
              <ul className="space-y-2.5 text-xs font-semibold" style={{ color: "var(--card-text)" }}>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> 1 Main Sensor Device Allocation</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Standard Web Dashboard Monitoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> 7-Day Cloud Report History</li>
                <li className="flex items-center gap-2" style={{ color: "var(--card-text-faint)" }}><CheckCircle2 size={14} /> WhatsApp Gateway System Integration</li>
              </ul>
            </div>
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="w-full py-3 font-bold rounded-xl text-center text-xs transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 hover:opacity-80"
              style={{ backgroundColor: "var(--card-surface)", color: "var(--card-title)" }}
            >
              {isNavigating ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--card-text-muted)" }} /> : "Start Subscription"}
            </button>
          </div>

          {/* Paket Pro */}
          <div className="border-2 p-8 rounded-3xl shadow-md relative space-y-6 flex flex-col justify-between overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--accent-primary)" }}>
            <div className="absolute top-3 right-3 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--accent-primary)" }}>
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--accent-primary)" }}>Pro Package</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--card-text-muted)" }}>Highly Ideal for Franchise Restaurants & Hotel Kitchens</p>
              </div>
              <div className="text-3xl font-black" style={{ color: "var(--card-title)" }}>
                Rp 149.000 <span className="text-xs font-medium font-sans" style={{ color: "var(--card-text-muted)" }}>/ month</span>
              </div>
              <hr style={{ borderColor: "var(--card-surface-border)" }} />
              <ul className="space-y-2.5 text-xs font-semibold" style={{ color: "var(--card-text)" }}>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Up to 8 Active Sensor Quota Allocations</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Multi-Role Dashboard Monitoring</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Cloud Report History Up to 3 Months</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Automatic WhatsApp Gateway Alert Integration</li>
              </ul>
            </div>
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="w-full py-3 text-white font-bold rounded-xl text-center text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
               {isNavigating ? <Loader2 size={14} className="animate-spin" /> : "Choose Pro Package"}
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t py-12 text-xs font-medium text-center" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)", color: "var(--card-text-muted)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="font-bold text-sm" style={{ color: "var(--card-title)" }}>Aetheris Safety Infrastructure System</p>
          <p>© 2026 Disaster-Based Project Group 1 JTI Polinema. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}