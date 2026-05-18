"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientProfileModel, UserProfile } from "@/models/clientProfileModel";
import { RefreshCw, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const data = await ClientProfileModel.getUserProfile(userId);
      if (data) setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  // Fungsi untuk menangani perubahan sakelar (toggle switch) notifikasi
  const handleToggle = async (field: keyof UserProfile, currentValue: boolean) => {
    if (!profile) return;
    
    // Update state di UI terlebih dahulu secara optimis
    const updatedProfile = { ...profile, [field]: !currentValue };
    setProfile(updatedProfile);

    try {
      // Simpan perubahan ke Firestore
      await ClientProfileModel.updateSettings(userId, { [field]: !currentValue });
    } catch (error) {
      console.error("Gagal memperbarui pengaturan:", error);
      // Kembalikan ke state semula jika gagal
      setProfile(profile);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <RefreshCw className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      <Navbar title="Pengaturan" />

      <main className="md:ml-64 pt-24 px-6 md:px-8 pb-8 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI */}
          <div className="space-y-6">
            
            {/* KARTU 1: PROFIL RESTORAN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Profil Restoran</h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-slate-400 font-medium">Nama restoran</p>
                    <p className="font-bold text-slate-900 mt-0.5">{profile?.restaurantName || "Warung Pak Budi"}</p>
                  </div>
                  <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50">Edit</button>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-slate-400 font-medium">Alamat</p>
                    <p className="font-bold text-slate-900 mt-0.5 max-w-[240px] truncate">{profile?.address || "Jl. Raya Sidoarjo No. 12"}</p>
                  </div>
                  <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50">Edit</button>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-slate-400 font-medium">Jam operasional</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {profile?.operationalHours?.open || "08:00"} — {profile?.operationalHours?.close || "22:00"}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50">Edit</button>
                </div>
              </div>
            </div>

            {/* KARTU 2: NOTIFIKASI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Notifikasi</h3>
              <div className="space-y-4 text-xs">
                {/* WHATSAPP */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Notifikasi WhatsApp</p>
                    <p className="text-slate-400 mt-0.5">{profile?.phone || "+62 812-3456-7890"}</p>
                  </div>
                  <button 
                    onClick={() => handleToggle("notifWhatsapp", !!profile?.notifWhatsapp)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${profile?.notifWhatsapp ? "bg-[#4A6741]" : "bg-slate-200"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifWhatsapp ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                {/* PUSH NOTIF */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Notifikasi push</p>
                    <p className="text-slate-400 mt-0.5">Browser / aplikasi</p>
                  </div>
                  <button 
                    onClick={() => handleToggle("notifPush", !!profile?.notifPush)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${profile?.notifPush ? "bg-[#4A6741]" : "bg-slate-200"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifPush ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                {/* HANYA JAM OPERASIONAL */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Hanya jam operasional</p>
                    <p className="text-slate-400 mt-0.5">Matikan notif di luar jam buka</p>
                  </div>
                  <button 
                    onClick={() => handleToggle("notifOnlyOperational", !!profile?.notifOnlyOperational)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${profile?.notifOnlyOperational ? "bg-[#4A6741]" : "bg-slate-200"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifOnlyOperational ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-6">
            
            {/* KARTU 3: PAKET LANGGANAN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Paket Langganan</h3>
              <div className="bg-[#E9F2E4] border border-[#D1E2C7] p-4 rounded-xl mb-4">
                <p className="text-sm font-black text-[#4A6741]">Paket Pro</p>
                <p className="text-[11px] text-[#4A6741]/80 font-medium mt-1">Aktif hingga 31 Desember 2025</p>
                <p className="text-[11px] text-[#4A6741]/80 font-medium">Maks. 8 sensor • Laporan 3 bulan</p>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Menggunakan 4 dari 8 sensor tersedia</span>
                </div>
                {/* BAR PROGRESS */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#4A6741] h-full rounded-full" style={{ width: "50%" }}></div>
                </div>
              </div>
            </div>

            {/* KARTU 4: BANTUAN & SUPPORT */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Bantuan & Support</h3>
              <div className="divide-y divide-slate-100 text-xs">
                <button className="w-full flex justify-between items-center py-3 font-bold text-slate-800 hover:text-slate-900 group text-left">
                  <span>Hubungi support</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button className="w-full flex justify-between items-center py-3 font-bold text-slate-800 hover:text-slate-900 group text-left">
                  <span>Panduan penggunaan</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button className="w-full flex justify-between items-center py-3 font-bold text-slate-800 hover:text-slate-900 group text-left">
                  <span>Pertanyaan umum (FAQ)</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}