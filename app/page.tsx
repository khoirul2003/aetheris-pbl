"use client";

import { useState } from "react";
import Link from "next/link";
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
  Layers
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#FDFBF7] text-slate-800 antialiased min-h-screen font-sans overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-[#FDFBF7]/80 backdrop-blur-md z-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            <span className="text-xl font-black tracking-tight text-slate-900">
              Aetheris<span className="text-[#4A6741]">.</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-[#4A6741] transition-colors">Fitur Utama</a>
            <a href="#arsitektur" className="hover:text-[#4A6741] transition-colors">Arsitektur</a>
            <a href="#harga" className="hover:text-[#4A6741] transition-colors">Paket Layanan</a>
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-[#4A6741] hover:bg-[#3d5535] text-white rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              Masuk Dashboard <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-600 hover:text-[#4A6741] cursor-pointer border-none bg-transparent"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FDFBF7] border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 flex flex-col text-sm font-bold">
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-600">Fitur Utama</a>
            <a href="#arsitektur" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-600">Arsitektur</a>
            <a href="#harga" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-600">Paket Layanan</a>
            <Link 
              href="/login" 
              className="w-full py-3 bg-[#4A6741] text-white rounded-xl text-center flex items-center justify-center gap-2"
            >
              Masuk Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E9F2E4] border border-[#D1E2C7] rounded-full text-xs font-bold text-[#4A6741]">
            <Zap size={14} /> Berbasis IoT Khusus Industri Jasa Boga & Restoran
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Sistem Deteksi Dini Kebocoran Gas <span className="text-[#4A6741]">Real-Time</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed">
            Proteksi dapur komersial Anda dari risiko fatal kebocoran LPG dan kebakaran. Terintegrasi sensor cerdas ESP32, alarm fisik reaktif, serta dashboard Next.js interaktif dengan gateway WhatsApp otomatis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <a 
              href="#fitur" 
              className="px-8 py-4 bg-[#4A6741] hover:bg-[#3d5535] text-white font-bold rounded-2xl shadow-lg shadow-[#4A6741]/20 text-center transition-all"
            >
              Pelajari Fitur
            </a>
            <a 
              href="#harga" 
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200 text-center shadow-sm transition-all"
            >
              Lihat Demo & Harga
            </a>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Live Telemetri Alat</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black font-mono">NODE_SENSOR_002</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Kadar Gas/Asap</span>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">380 <span className="text-xs text-slate-400">PPM</span></p>
                </div>
                <div className="bg-[#E9F2E4] border border-[#D1E2C7] p-4 rounded-2xl">
                  <span className="text-[11px] text-[#4A6741] font-bold uppercase">Status</span>
                  <p className="text-xl font-black text-[#4A6741] mt-1 uppercase tracking-wide">Aman</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Suhu Ruang Dapur</span>
                  <span className="font-bold text-slate-800">29°C</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4A6741] h-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Kelembapan Udara</span>
                  <span className="font-bold text-slate-800">62%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: "62%" }}></div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex gap-2.5 text-[11px] font-medium leading-relaxed">
                <Smartphone className="shrink-0 text-amber-700" size={16} />
                <span>WhatsApp Gateway siaga mengirim alert otomatis ke nomor manager jika indikator gas melampaui batas aman.</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Blob */}
          <div className="absolute -z-10 w-72 h-72 bg-[#4A6741]/5 rounded-full blur-3xl -top-10 -right-10"></div>
        </div>
      </section>

      <hr className="border-slate-200/60 max-w-7xl mx-auto" />

      {/* 3. FITUR UTAMA */}
      <section id="fitur" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#4A6741]">Keunggulan Perangkat</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Perlindungan Menyeluruh Tanpa Batas Ruang
          </p>
          <p className="text-slate-500 text-sm font-medium">
            Dikembangkan dengan standar arsitektur handal untuk menjamin akurasi data sensor serta kecepatan transmisi sinyal darurat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 bg-[#E9F2E4] text-[#4A6741] rounded-xl flex items-center justify-center">
              <Flame size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sensor MQ-2 Sensitif</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Mendeteksi konsentrasi gas LPG, asap dapur, dan gas mudah terbakar lainnya sejak dini sebelum memicu letupan api.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wifi size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Wireless Provisioning</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Ganti Wi-Fi restoran Anda kapan saja dengan mudah secara nirkabel lewat Captive Portal HP tanpa perlu membongkar program alat.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Smartphone size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Alert WhatsApp Kilat</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Notifikasi bahaya langsung terkirim ke nomor telepon manager atau pemilik restoran di luar jam operasional kerja dapur.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Dashboard Real-Time</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Sinkronisasi data instan di bawah 1 detik memanfaatkan Firebase Realtime Database terintegrasi Next.js 14 App Router.
            </p>
          </div>

        </div>
      </section>

      {/* 4. ARSITEKTUR TEKNOLOGI */}
      <section id="arsitektur" className="py-20 bg-slate-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#A3E635]">
              <Layers size={14} /> Teknologi Industri Terkini
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Arsitektur Sistem Terintegrasi End-to-End
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Aetheris dibangun menggunakan ekosistem teknologi modern untuk memastikan reaktivitas tinggi dan ketersediaan data secara konstan 24/7.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex gap-3">
                <CheckCircle2 className="text-[#A3E635] shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Hardware Layer</h4>
                  <p className="text-slate-400 mt-0.5">Microcontroller ESP32, Sensor Suhu & Kelembapan DHT11, Gas MQ-2, Layar LCD 16x2 I2C, Alarm Buzzer, dan LED Aktuasi.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="text-[#A3E635] shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Cloud Infrastructure Layer</h4>
                  <p className="text-slate-400 mt-0.5">Firebase Realtime Database untuk sinkronisasi data sensor instan dan Firestore Database untuk tata kelola dokumen akun pelanggan.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="text-[#A3E635] shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Application Layer</h4>
                  <p className="text-slate-400 mt-0.5">Dashboard multi-role (Admin & User) berbasis Framework Next.js menggunakan TailwindCSS yang di-hosting pada Vercel Serverless Jaringan Super Cepat.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#A3E635]">Alur Kerja Sistem Darurat</h3>
            <div className="divide-y divide-white/5 text-xs font-medium text-slate-300">
              <div className="py-3 flex justify-between">
                <span>1. Kebocoran Gas Terjadi</span>
                <span className="text-red-400">Kadar Gas &gt; 600 PPM</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>2. Aktuasi Fisik Dapur</span>
                <span className="text-amber-400">Buzzer Berbunyi & LED Berkedip</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>3. Transmisi Cloud Firebase</span>
                <span className="text-blue-400">Status Node Berubah &quot;danger&quot;</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>4. Alert Dashboard Web</span>
                <span className="text-purple-400">Layar Alert Merah Berkedip Instan</span>
              </div>
              <div className="py-3 flex justify-between">
                <span>5. WhatsApp Gateway</span>
                <span className="text-[#A3E635]">Pesan Darurat Terkirim ke HP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HARGA & PAKET */}
      <section id="harga" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#4A6741]">Rencana Investasi</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Paket Layanan Sesuai Skala Bisnis Anda
          </p>
          <p className="text-slate-500 text-sm font-medium">
            Investasi perlindungan aset restoran terbaik demi kenyamanan bekerja dan rasa aman operasional harian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          
          {/* Paket Standar */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Paket Basic</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Cocok untuk UMKM, Depot, atau Warung Makan Kecil</p>
              </div>
              <div className="text-3xl font-black text-slate-900">
                Rp 49.000 <span className="text-xs text-slate-400 font-medium font-sans">/ bulan</span>
              </div>
              <hr className="border-slate-100" />
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> 1 Alokasi Perangkat Sensor Utama</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Monitoring Dashboard Web Standar</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Riwayat Laporan Cloud 7 Hari</li>
                <li className="flex items-center gap-2 text-slate-300"><CheckCircle2 size={14} /> Integrasi Sistem WhatsApp Gateway</li>
              </ul>
            </div>
            <Link 
              href="/login" 
              className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center text-xs transition-all"
            >
              Mulai Langganan
            </Link>
          </div>

          {/* Paket Pro */}
          <div className="bg-white border-2 border-[#4A6741] p-8 rounded-3xl shadow-md relative space-y-6 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-3 right-3 bg-[#4A6741] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
              Paling Populer
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-[#4A6741]">Paket Pro</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Sangat Ideal untuk Restoran Waralaba & Dapur Hotel</p>
              </div>
              <div className="text-3xl font-black text-slate-900">
                Rp 149.000 <span className="text-xs text-slate-400 font-medium font-sans">/ bulan</span>
              </div>
              <hr className="border-slate-100" />
              <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Hingga 8 Alokasi Kuota Sensor Aktif</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Monitoring Dashboard Multi-Role</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Riwayat Laporan Cloud Hingga 3 Bulan</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4A6741]" /> Integrasi Otomatis Alert WhatsApp Gateway</li>
              </ul>
            </div>
            <Link 
              href="/login" 
              className="block w-full py-3 bg-[#4A6741] hover:bg-[#3d5535] text-white font-bold rounded-xl text-center text-xs shadow-md shadow-[#4A6741]/10 transition-all"
            >
              Pilih Paket Pro
            </Link>
          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-12 text-xs font-medium text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="text-slate-600 font-bold text-sm">Aetheris Safety Infrastructure System</p>
          <p>© 2026 Proyek Berbasis Kebencanaan Kelompok 1 JTI Polinema. Hak Cipta Dilindungi.</p>
        </div>
      </footer>

    </div>
  );
}