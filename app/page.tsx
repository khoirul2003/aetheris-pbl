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
            <a href="#fitur" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Fitur Utama</a>
            <a href="#arsitektur" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Arsitektur</a>
            <a href="#harga" className="hover:opacity-80 transition-opacity" style={{ color: "inherit" }}>Paket Layanan</a>
            
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
                <>Masuk Dashboard <ArrowRight size={16} /></>
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
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Fitur Utama</a>
            <a href="#arsitektur" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Arsitektur</a>
            <a href="#harga" onClick={() => setMobileMenuOpen(false)} className="py-2" style={{ color: "var(--card-text-muted)" }}>Paket Layanan</a>
            
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
                <>Masuk Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}>
            <Zap size={14} /> Berbasis IoT Khusus Industri Jasa Boga & Restoran
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]" style={{ color: "var(--card-title)" }}>
            Sistem Deteksi Dini Kebocoran Gas <span style={{ color: "var(--accent-primary)" }}>Real-Time</span>
          </h1>
          <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Proteksi dapur komersial Anda dari risiko fatal kebocoran LPG dan kebakaran. Terintegrasi sensor cerdas ESP32, alarm fisik reaktif, serta dashboard Next.js interaktif dengan gateway WhatsApp otomatis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <a 
              href="#fitur" 
              className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg text-center transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              Pelajari Fitur
            </a>
            <a 
              href="#harga" 
              className="px-8 py-4 font-bold rounded-2xl border text-center shadow-sm transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-title)" }}
            >
              Lihat Demo & Harga
            </a>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="w-full max-w-120 border rounded-3xl p-6 shadow-xl relative overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: "var(--card-surface-border)" }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: "rgb(244, 63, 94)" }}></span>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Live Telemetri Alat</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black font-mono" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "rgb(16, 185, 129)" }}>NODE_SENSOR_002</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-2xl" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                  <span className="text-[11px] font-bold uppercase" style={{ color: "var(--card-text-faint)" }}>Kadar Gas/Asap</span>
                  <p className="text-2xl font-black mt-1 font-mono" style={{ color: "var(--card-title)" }}>380 <span className="text-xs" style={{ color: "var(--card-text-muted)" }}>PPM</span></p>
                </div>
                <div className="border p-4 rounded-2xl" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)" }}>
                  <span className="text-[11px] font-bold uppercase" style={{ color: "var(--accent-primary)" }}>Status</span>
                  <p className="text-xl font-black mt-1 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>Aman</p>
                </div>
              </div>

              <div className="border rounded-2xl p-4 space-y-2.5 text-xs" style={{ borderColor: "var(--card-surface-border)" }}>
                <div className="flex justify-between font-medium">
                  <span style={{ color: "var(--card-text-muted)" }}>Suhu Ruang Dapur</span>
                  <span className="font-bold" style={{ color: "var(--card-title)" }}>29°C</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-surface)" }}>
                  <div className="h-full" style={{ width: "45%", backgroundColor: "var(--accent-primary)" }}></div>
                </div>
                <div className="flex justify-between font-medium">
                  <span style={{ color: "var(--card-text-muted)" }}>Kelembapan Udara</span>
                  <span className="font-bold" style={{ color: "var(--card-title)" }}>62%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--card-surface)" }}>
                  <div className="h-full" style={{ width: "62%", backgroundColor: "rgb(59, 130, 246)" }}></div>
                </div>
              </div>

              <div className="border p-3.5 rounded-xl flex gap-2.5 text-[11px] font-medium leading-relaxed" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", color: "rgb(245, 158, 11)" }}>
                <Smartphone className="shrink-0" size={16} />
                <span>WhatsApp Gateway siaga mengirim alert otomatis ke nomor manager jika indikator gas melampaui batas aman.</span>
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
          <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Keunggulan Perangkat</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-title)" }}>
            Perlindungan Menyeluruh Tanpa Batas Ruang
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--card-text-muted)" }}>
            Dikembangkan dengan standar arsitektur handal untuk menjamin akurasi data sensor serta kecepatan transmisi sinyal darurat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
              <Flame size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Sensor MQ-2 Sensitif</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Mendeteksi konsentrasi gas LPG, asap dapur, dan gas mudah terbakar lainnya sejak dini sebelum memicu letupan api.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
              <Wifi size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Wireless Provisioning</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Ganti Wi-Fi restoran Anda kapan saja dengan mudah secara nirkabel lewat Captive Portal HP tanpa perlu membongkar program alat.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "rgb(245, 158, 11)" }}>
              <Smartphone size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Alert WhatsApp Kilat</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Notifikasi bahaya langsung terkirim ke nomor telepon manager atau pemilik restoran di luar jam operasional kerja dapur.
            </p>
          </div>

          <div className="border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "rgb(168, 85, 247)" }}>
              <BarChart3 size={22} />
            </div>
            <h3 className="font-bold text-base" style={{ color: "var(--card-title)" }}>Dashboard Real-Time</h3>
            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--card-text-muted)" }}>
              Sinkronisasi data instan di bawah 1 detik memanfaatkan Firebase Realtime Database terintegrasi Next.js 14 App Router.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ARSITEKTUR TEKNOLOGI */}
      <section id="arsitektur" className="scroll-mt-20 py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--card-title)", color: "var(--card-bg)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgb(163, 230, 53)" }}>
              <Layers size={14} /> Teknologi Industri Terkini
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-bg-solid)" }}>
              Arsitektur Sistem Terintegrasi End-to-End
            </h2>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
              Aetheris dibangun menggunakan ekosistem teknologi modern untuk memastikan reaktivitas tinggi dan ketersediaan data secara konstan 24/7.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Hardware Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>Microcontroller ESP32, Sensor Suhu & Kelembapan DHT11, Gas MQ-2, Layar LCD 16x2 I2C, Alarm Buzzer, dan LED Aktuasi.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Cloud Infrastructure Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>Firebase Realtime Database untuk sinkronisasi data sensor instan dan Firestore Database untuk tata kelola dokumen akun pelanggan.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0" size={18} style={{ color: "rgb(163, 230, 53)" }} />
                <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--card-bg-solid)" }}>Application Layer</h4>
                  <p className="mt-0.5" style={{ color: "rgba(255, 255, 255, 0.6)" }}>Dashboard multi-role (Admin & User) berbasis Framework Next.js menggunakan TailwindCSS yang di-hosting pada Vercel Serverless Jaringan Super Cepat.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-3xl p-6 space-y-4" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.1)" }}>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "rgb(163, 230, 53)" }}>Alur Kerja Sistem Darurat</h3>
            <div className="divide-y font-medium text-xs" style={{ borderColor: "rgba(255, 255, 255, 0.05)", color: "rgba(255, 255, 255, 0.8)" }}>
              <div className="py-3 flex justify-between">
                <span>1. Kebocoran Gas Terjadi</span>
                <span style={{ color: "rgb(248, 113, 113)" }}>Kadar Gas &gt; 600 PPM</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>2. Aktuasi Fisik Dapur</span>
                <span style={{ color: "rgb(251, 191, 36)" }}>Buzzer Berbunyi & LED Berkedip</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>3. Transmisi Cloud Firebase</span>
                <span style={{ color: "rgb(96, 165, 250)" }}>Status Node Berubah &quot;danger&quot;</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>4. Alert Dashboard Web</span>
                <span style={{ color: "rgb(192, 132, 252)" }}>Layar Alert Merah Berkedip Instan</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>5. WhatsApp Gateway</span>
                <span style={{ color: "rgb(163, 230, 53)" }}>Pesan Darurat Terkirim ke HP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HARGA & PAKET */}
      <section id="harga" className="scroll-mt-24 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Rencana Investasi</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--card-title)" }}>
            Paket Layanan Sesuai Skala Bisnis Anda
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--card-text-muted)" }}>
            Investasi perlindungan aset restoran terbaik demi kenyamanan bekerja dan rasa aman operasional harian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {/* Paket Basic */}
          <div className="border p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--card-title)" }}>Paket Basic</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--card-text-muted)" }}>Cocok untuk UMKM, Depot, atau Warung Makan Kecil</p>
              </div>
              <div className="text-3xl font-black" style={{ color: "var(--card-title)" }}>
                Rp 49.000 <span className="text-xs font-medium font-sans" style={{ color: "var(--card-text-muted)" }}>/ bulan</span>
              </div>
              <hr style={{ borderColor: "var(--card-surface-border)" }} />
              <ul className="space-y-2.5 text-xs font-semibold" style={{ color: "var(--card-text)" }}>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> 1 Alokasi Perangkat Sensor Utama</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Monitoring Dashboard Web Standar</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Riwayat Laporan Cloud 7 Hari</li>
                <li className="flex items-center gap-2" style={{ color: "var(--card-text-faint)" }}><CheckCircle2 size={14} /> Integrasi Sistem WhatsApp Gateway</li>
              </ul>
            </div>
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="w-full py-3 font-bold rounded-xl text-center text-xs transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 hover:opacity-80"
              style={{ backgroundColor: "var(--card-surface)", color: "var(--card-title)" }}
            >
              {isNavigating ? <Loader2 size={14} className="animate-spin" style={{ color: "var(--card-text-muted)" }} /> : "Mulai Langganan"}
            </button>
          </div>

          {/* Paket Pro */}
          <div className="border-2 p-8 rounded-3xl shadow-md relative space-y-6 flex flex-col justify-between overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--accent-primary)" }}>
            <div className="absolute top-3 right-3 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--accent-primary)" }}>
              Paling Populer
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--accent-primary)" }}>Paket Pro</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--card-text-muted)" }}>Sangat Ideal untuk Restoran Waralaba & Dapur Hotel</p>
              </div>
              <div className="text-3xl font-black" style={{ color: "var(--card-title)" }}>
                Rp 149.000 <span className="text-xs font-medium font-sans" style={{ color: "var(--card-text-muted)" }}>/ bulan</span>
              </div>
              <hr style={{ borderColor: "var(--card-surface-border)" }} />
              <ul className="space-y-2.5 text-xs font-semibold" style={{ color: "var(--card-text)" }}>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Hingga 8 Alokasi Kuota Sensor Aktif</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Monitoring Dashboard Multi-Role</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Riwayat Laporan Cloud Hingga 3 Bulan</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-primary)" }} /> Integrasi Otomatis Alert WhatsApp Gateway</li>
              </ul>
            </div>
            <button 
              onClick={handleNavigateToLogin}
              disabled={isNavigating}
              className="w-full py-3 text-white font-bold rounded-xl text-center text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2 hover:opacity-80"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
               {isNavigating ? <Loader2 size={14} className="animate-spin" /> : "Pilih Paket Pro"}
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t py-12 text-xs font-medium text-center" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)", color: "var(--card-text-muted)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="font-bold text-sm" style={{ color: "var(--card-title)" }}>Aetheris Safety Infrastructure System</p>
          <p>© 2026 Proyek Berbasis Kebencanaan Kelompok 1 JTI Polinema. Hak Cipta Dilindungi.</p>
        </div>
      </footer>

    </div>
  );
}