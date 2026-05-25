"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClientProfileModel, UserProfile } from "@/models/clientProfileModel";
import { RefreshCw, ChevronRight, X, Save, Loader2 } from "lucide-react";

// PERBAIKAN: Tambahkan tipe "phone" ke dalam modal
type ModalType = "name" | "address" | "hours" | "phone" | null;

export default function SettingsPage() {
  const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Manajemen Modal
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState(""); // ➔ Tambah state form phone
  const [editOpenHour, setEditOpenHour] = useState("08:00");
  const [editCloseHour, setEditCloseHour] = useState("22:00");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await ClientProfileModel.getUserProfile(userId);
        if (data) {
          setProfile(data);
          setEditName(data.restaurantName || "");
          setEditAddress(data.address || "");
          setEditPhone(data.phone || ""); // ➔ Inisialisasi data phone
          if (data.operationalHours) {
            setEditOpenHour(data.operationalHours.open || "08:00");
            setEditCloseHour(data.operationalHours.close || "22:00");
          }
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  const handleToggle = async (field: keyof UserProfile, currentValue: boolean) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, [field]: !currentValue };
    setProfile(updatedProfile);

    try {
      await ClientProfileModel.updateSettings(userId, { [field]: !currentValue });
    } catch (error) {
      console.error("Gagal memperbarui pengaturan:", error);
      setProfile(profile);
    }
  };

  // Fungsi untuk menyimpan perubahan data modal ke Firestore
  const handleSaveChanges = async () => {
    if (!profile) return;
    setIsSaving(true);

    let updatedFields: Partial<UserProfile> = {};

    if (activeModal === "name") updatedFields = { restaurantName: editName };
    if (activeModal === "address") updatedFields = { address: editAddress };
    if (activeModal === "phone") updatedFields = { phone: editPhone }; // ➔ Kondisi simpan phone
    if (activeModal === "hours") {
      updatedFields = {
        operationalHours: { open: editOpenHour, close: editCloseHour }
      };
    }

    try {
      await ClientProfileModel.updateSettings(userId, updatedFields);
      setProfile({ ...profile, ...updatedFields });
      setActiveModal(null);
    } catch (err) {
      console.error("Gagal menyimpan pembaruan data:", err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatExpiryDate = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "31 Desember 2025";
    const date = timestamp.toDate();
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={28} />
          <p className="text-slate-600 font-medium text-xs">Menyelaraskan profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#FDFBF7] min-h-screen text-slate-800 antialiased overflow-x-hidden">
      <Sidebar role="user" userEmail="khoirul@email.com" />
      <Navbar title="Pengaturan" />

      <main className="md:ml-64 pt-24 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-6xl mx-auto box-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI */}
          <div className="space-y-6">
            
            {/* KARTU 1: PROFIL RESTORAN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Profil Restoran</h3>
              <div className="divide-y divide-slate-100 text-xs">
                
                <div className="flex justify-between items-center py-3.5 gap-4">
                  <div className="min-w-0">
                    <p className="text-slate-400 font-medium">Nama restoran</p>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">{profile?.restaurantName || "Warung Pak Budi"}</p>
                  </div>
                  <button 
                    onClick={() => setActiveModal("name")}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 shrink-0 shadow-sm transition-all cursor-pointer border-none"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex justify-between items-center py-3.5 gap-4">
                  <div className="min-w-0">
                    <p className="text-slate-400 font-medium">Alamat</p>
                    <p className="font-bold text-slate-900 mt-0.5 break-words line-clamp-2 leading-relaxed">{profile?.address || "Jl. Raya Sidoarjo No. 12"}</p>
                  </div>
                  <button 
                    onClick={() => setActiveModal("address")}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 shrink-0 shadow-sm transition-all cursor-pointer border-none"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex justify-between items-center py-3.5 gap-4">
                  <div className="min-w-0">
                    <p className="text-slate-400 font-medium">Jam operasional</p>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">
                      {profile?.operationalHours?.open || "08:00"} — {profile?.operationalHours?.close || "22:00"}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveModal("hours")}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 shrink-0 shadow-sm transition-all cursor-pointer border-none"
                  >
                    Edit
                  </button>
                </div>

              </div>
            </div>

            {/* KARTU 2: NOTIFIKASI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Notifikasi & Kontak</h3>
              <div className="space-y-4 text-xs">
                
                {/* WHATSAPP + TOMBOL EDIT NOMOR */}
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">Notifikasi WhatsApp</p>
                    <p className="text-slate-400 mt-0.5 font-mono truncate">{profile?.phone || "+62 812-3456-7890"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* ➔ PERBAIKAN: Ditambahkan tombol Edit HP */}
                    <button 
                      onClick={() => setActiveModal("phone")}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-50 text-[11px] shadow-sm transition-all cursor-pointer border-none"
                    >
                      Edit HP
                    </button>
                    <button 
                      onClick={() => handleToggle("notifWhatsapp", !!profile?.notifWhatsapp)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer border-none ${profile?.notifWhatsapp ? "bg-[#4A6741]" : "bg-slate-200"}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifWhatsapp ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-slate-900">Notifikasi push</p>
                    <p className="text-slate-400 mt-0.5">Browser / aplikasi dashboard</p>
                  </div>
                  <button 
                    onClick={() => handleToggle("notifPush", !!profile?.notifPush)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none ${profile?.notifPush ? "bg-[#4A6741]" : "bg-slate-200"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifPush ? "translate-x-5" : ""}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-slate-900">Hanya jam operasional</p>
                    <p className="text-slate-400 mt-0.5">Matikan alert WA di luar jam buka</p>
                  </div>
                  <button 
                    onClick={() => handleToggle("notifOnlyOperational", !!profile?.notifOnlyOperational)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none ${profile?.notifOnlyOperational ? "bg-[#4A6741]" : "bg-slate-200"}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${profile?.notifOnlyOperational ? "translate-x-5" : ""}`} />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Paket Langganan</h3>
              <div className="bg-[#E9F2E4] border border-[#D1E2C7] p-4 rounded-xl mb-4">
                <p className="text-sm font-black text-[#4A6741] uppercase tracking-wide">
                  Paket {profile?.plan || "Pro"}
                </p>
                <p className="text-[11px] text-[#4A6741]/80 font-semibold mt-1">
                  Aktif hingga: {formatExpiryDate(profile?.planExpiry)}
                </p>
                <p className="text-[11px] text-[#4A6741]/80 font-medium mt-0.5">Maks. 8 kuota sensor • Cloud Laporan 3 bulan</p>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Menggunakan 4 dari 8 alokasi sensor aktif</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#4A6741] h-full rounded-full transition-all duration-500" style={{ width: "50%" }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Bantuan & Support</h3>
              <div className="divide-y divide-slate-100 text-xs">
                <button className="w-full flex justify-between items-center py-3.5 font-bold text-slate-700 hover:text-slate-900 group text-left border-none bg-transparent cursor-pointer">
                  <span>Hubungi support teknis tim PBL</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button className="w-full flex justify-between items-center py-3.5 font-bold text-slate-700 hover:text-slate-900 group text-left border-none bg-transparent cursor-pointer">
                  <span>Panduan integrasi hardware ESP32</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button className="w-full flex justify-between items-center py-3.5 font-bold text-slate-700 hover:text-slate-900 group text-left border-none bg-transparent cursor-pointer">
                  <span>Pertanyaan umum infrastruktur (FAQ)</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* POP-UP MODAL EDITING */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100">
            
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                {activeModal === "name" && "Edit Nama Restoran"}
                {activeModal === "address" && "Edit Alamat Operasional"}
                {activeModal === "phone" && "Edit Nomor WhatsApp"}
                {activeModal === "hours" && "Edit Jam Operasional"}
              </h4>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {activeModal === "name" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Nama Restoran Baru</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium"
                  />
                </div>
              )}

              {activeModal === "address" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Alamat Lengkap</label>
                  <textarea 
                    rows={3}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* ➔ PERBAIKAN: Form Input Khusus Nomor HP */}
              {activeModal === "phone" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Nomor WhatsApp Gateway</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 08999020805"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pastikan nomor aktif agar bot Fonnte / WhatsApp script dapat mengirim pesan dengan lancar.</p>
                </div>
              )}

              {activeModal === "hours" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jam Buka</label>
                    <input 
                      type="time" 
                      value={editOpenHour}
                      onChange={(e) => setEditOpenHour(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jam Tutup</label>
                    <input 
                      type="time" 
                      value={editCloseHour}
                      onChange={(e) => setEditCloseHour(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-[#4A6741] hover:bg-[#3d5535] disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Save size={14} /> Simpan
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}