"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { ClientProfileModel, UserProfile } from "@/models/clientProfileModel";
import { RefreshCw, X, Save, Loader2, Wifi, HelpCircle } from "lucide-react";

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
  const [editPhone, setEditPhone] = useState("");
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
          setEditPhone(data.phone || "");
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

  const handleSaveChanges = async () => {
    if (!profile) return;
    setIsSaving(true);

    let updatedFields: Partial<UserProfile> = {};

    if (activeModal === "name") updatedFields = { restaurantName: editName };
    if (activeModal === "address") updatedFields = { address: editAddress };
    if (activeModal === "phone") updatedFields = { phone: editPhone };
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
    if (!timestamp || typeof timestamp.toDate !== "function") return "31 Desember 2026";
    const date = timestamp.toDate();
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <UserLayout 
      title="Pengaturan" 
      description="Kelola profil restoran, konfigurasi notifikasi peringatan, dan panduan perangkat Anda."
      userEmail="khoirul@email.com"
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin text-[#4D6344] mx-auto" size={28} />
            <p className="text-[#5B636B] font-semibold text-xs tracking-wide">Menyelaraskan profil...</p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* KOLOM KIRI */}
            <div className="space-y-6">
              
              {/* KARTU 1: PROFIL RESTORAN */}
              <div className="bg-white/80 backdrop-blur border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-xs">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Profil Restoran</h3>
                <div className="divide-y divide-slate-100/60 text-xs">
                  
                  <div className="flex justify-between items-center pb-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nama Restoran</p>
                      <p className="font-bold text-slate-900 mt-1.5 text-sm truncate">{profile?.restaurantName || "Warung Pak Budi"}</p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("name")}
                      className="px-4 py-2 bg-white/60 border border-slate-200/70 rounded-xl font-bold hover:bg-white shrink-0 shadow-sm transition-all cursor-pointer border-none"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Alamat Operasional</p>
                      <p className="font-bold text-slate-900 mt-1.5 text-sm break-words line-clamp-2 leading-relaxed">{profile?.address || "Jl. Raya Sidoarjo No. 12"}</p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("address")}
                      className="px-4 py-2 bg-white/60 border border-slate-200/70 rounded-xl font-bold hover:bg-white shrink-0 shadow-sm transition-all cursor-pointer border-none"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jam Operasional</p>
                      <p className="font-bold text-slate-900 mt-1.5 text-sm font-mono">
                        {profile?.operationalHours?.open || "08:00"} — {profile?.operationalHours?.close || "22:00"}
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("hours")}
                      className="px-4 py-2 bg-white/60 border border-slate-200/70 rounded-xl font-bold hover:bg-white shrink-0 shadow-sm transition-all cursor-pointer border-none"
                    >
                      Edit
                    </button>
                  </div>

                </div>
              </div>

              {/* KARTU 2: NOTIFIKASI */}
              <div className="bg-white/80 backdrop-blur border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-xs">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Notifikasi & Kontak</h3>
                <div className="space-y-6 text-xs">
                  
                  <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">Notifikasi WhatsApp</p>
                      <p className="text-slate-500 mt-1 font-mono font-medium truncate">{profile?.phone || "+62 812-3456-7890"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => setActiveModal("phone")}
                        className="px-3 py-1.5 bg-white/60 border border-slate-200/70 rounded-xl font-bold hover:bg-white text-[11px] shadow-sm transition-all cursor-pointer border-none"
                      >
                        Edit HP
                      </button>
                      <button 
                        onClick={() => handleToggle("notifWhatsapp", !!profile?.notifWhatsapp)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer border-none shadow-inner ${profile?.notifWhatsapp ? "bg-[#4D6344]" : "bg-slate-300"}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifWhatsapp ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Notifikasi Push</p>
                      <p className="text-slate-500 mt-1 font-medium">Browser / aplikasi dashboard</p>
                    </div>
                    <button 
                      onClick={() => handleToggle("notifPush", !!profile?.notifPush)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none shadow-inner ${profile?.notifPush ? "bg-[#4D6344]" : "bg-slate-300"}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifPush ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Hanya Jam Operasional</p>
                      <p className="text-slate-500 mt-1 font-medium">Matikan alert di luar jam buka</p>
                    </div>
                    <button 
                      onClick={() => handleToggle("notifOnlyOperational", !!profile?.notifOnlyOperational)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none shadow-inner ${profile?.notifOnlyOperational ? "bg-[#4D6344]" : "bg-slate-300"}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifOnlyOperational ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-6">

              {/* KARTU INSTRUKSI PANDUAN PENGATURAN WI-FI UNTUK USER */}
              <div className="bg-white/80 backdrop-blur border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#EAF2EB] flex items-center justify-center shrink-0">
                    <Wifi size={16} className="text-[#4D6344]" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Panduan Ganti Wi-Fi Perangkat</h3>
                </div>
                <div className="bg-white/50 backdrop-blur-sm border border-slate-100 p-5 rounded-2xl text-xs space-y-4 leading-relaxed text-slate-600 shadow-inner">
                  <p className="font-bold text-slate-800 text-sm">Jika Wi-Fi restoran Anda diganti atau berubah password:</p>
                  <ol className="list-decimal list-inside space-y-2.5 font-medium">
                    <li>Perangkat sensor otomatis akan mendeteksi putusnya koneksi.</li>
                    <li>Layar LCD pada alat akan menampilkan tulisan <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-slate-800 border border-slate-300/50">Wi-Fi Lost!</span></li>
                    <li>Ambil HP Anda, buka pengaturan Wi-Fi, lalu sambungkan ke hotspot sementara bernama <span className="font-bold text-slate-900 border-b border-dashed border-slate-400">&quot;Aetheris-Setup&quot;</span>.</li>
                    <li>Halaman konfigurasi otomatis akan muncul di layar HP Anda.</li>
                    <li>Pilih nama Wi-Fi baru Anda, masukkan kata sandi, lalu klik <span className="font-bold text-[#4D6344]">Save</span>.</li>
                  </ol>
                  <div className="flex items-start gap-2.5 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-amber-700">
                    <HelpCircle size={16} className="shrink-0 mt-0.5" />
                    <span>Alat akan otomatis merestart dan terhubung kembali ke Dashboard tanpa perlu bongkar kode program!</span>
                  </div>
                </div>
              </div>

              {/* KARTU PAKET LANGGANAN */}
              <div className="bg-white/80 backdrop-blur border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-xs">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Paket Langganan</h3>
                <div className="bg-[#EAF2EB]/80 border border-[#C4D0B7]/50 p-5 rounded-2xl mb-5 shadow-inner">
                  <p className="text-base font-black text-[#4D6344] uppercase tracking-wide">
                    Paket {profile?.plan || "Pro"}
                  </p>
                  <p className="text-[11px] text-[#4D6344]/80 font-bold mt-1.5">
                    Aktif hingga: {formatExpiryDate(profile?.planExpiry)}
                  </p>
                  <p className="text-[11px] text-[#4D6344]/70 font-semibold mt-1">Maks. 8 kuota sensor • Cloud Laporan 3 bulan</p>
                </div>
                <div className="text-xs space-y-3">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Menggunakan 4 dari 8 alokasi sensor aktif</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-[#4D6344] h-full rounded-full transition-all duration-500" style={{ width: "50%" }}></div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* POP-UP MODAL EDITING DENGAN GLASSMORPHISM */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 z-[999] transition-opacity">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/50">
            
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">
                {activeModal === "name" && "Edit Nama Restoran"}
                {activeModal === "address" && "Edit Alamat Operasional"}
                {activeModal === "phone" && "Edit Nomor WhatsApp"}
                {activeModal === "hours" && "Edit Jam Operasional"}
              </h4>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-full transition-all cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 mb-8">
              {activeModal === "name" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Restoran Baru</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 text-xs border border-slate-200/70 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-medium transition-all"
                  />
                </div>
              )}

              {activeModal === "address" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Alamat Lengkap</label>
                  <textarea 
                    rows={3}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-3 text-xs border border-slate-200/70 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-medium resize-none leading-relaxed transition-all"
                  />
                </div>
              )}

              {activeModal === "phone" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Nomor WhatsApp Gateway</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 08999020805"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 text-xs border border-slate-200/70 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all"
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">Pastikan nomor aktif agar bot WhatsApp script dapat mengirim pesan dengan lancar.</p>
                </div>
              )}

              {activeModal === "hours" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Jam Buka</label>
                    <input 
                      type="time" 
                      value={editOpenHour}
                      onChange={(e) => setEditOpenHour(e.target.value)}
                      className="w-full px-4 py-3 text-xs border border-slate-200/70 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Jam Tutup</label>
                    <input 
                      type="time" 
                      value={editCloseHour}
                      onChange={(e) => setEditCloseHour(e.target.value)}
                      className="w-full px-4 py-3 text-xs border border-slate-200/70 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </UserLayout>
  );
}