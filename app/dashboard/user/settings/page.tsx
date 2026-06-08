"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { ClientProfileModel, UserProfile } from "@/models/clientProfileModel";
import { RefreshCw, X, Save, Loader2, Wifi, HelpCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type ModalType = "name" | "address" | "hours" | "phone" | null;

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserId(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
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
    if (!timestamp || typeof timestamp.toDate !== "function") return "31 Desember 2025";
    const date = timestamp.toDate();
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <UserLayout 
      title="Pengaturan" 
      description="Kelola profil restoran, konfigurasi notifikasi peringatan, dan panduan perangkat Anda."
      userEmail={currentUser?.email || ""}
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
              <div className=" backdrop-blur border  rounded-3xl p-6 md:p-8 shadow-xs" style={{ borderColor: "var(--card-border)" }} style={{ backgroundColor: "var(--card-bg)" }}>
                <h3 className="text-[11px] font-black uppercase tracking-widest  mb-6" style={{ color: "var(--card-text-faint)" }}>Profil Restoran</h3>
                <div className="divide-y  text-xs" style={{ borderColor: "var(--card-surface-border)" }}>
                  
                  <div className="flex justify-between items-center pb-4 gap-4">
                    <div className="min-w-0">
                      <p className=" font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-faint)" }}>Nama Restoran</p>
                      <p className="font-bold  mt-1.5 text-sm truncate" style={{ color: "var(--card-title)" }}>{profile?.restaurantName || "Warung Pak Budi"}</p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("name")}
                      className="px-4 py-2  border  rounded-xl font-bold hover:opacity-80 shrink-0 shadow-sm transition-all cursor-pointer border-none" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} style={{ borderColor: "var(--card-border)" }}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-4 gap-4">
                    <div className="min-w-0">
                      <p className=" font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-faint)" }}>Alamat Operasional</p>
                      <p className="font-bold  mt-1.5 text-sm break-words line-clamp-2 leading-relaxed" style={{ color: "var(--card-title)" }}>{profile?.address || "Jl. Raya Sidoarjo No. 12"}</p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("address")}
                      className="px-4 py-2  border  rounded-xl font-bold hover:opacity-80 shrink-0 shadow-sm transition-all cursor-pointer border-none" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} style={{ borderColor: "var(--card-border)" }}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4 gap-4">
                    <div className="min-w-0">
                      <p className=" font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-faint)" }}>Jam Operasional</p>
                      <p className="font-bold  mt-1.5 text-sm font-mono" style={{ color: "var(--card-title)" }}>
                        {profile?.operationalHours?.open || "08:00"} — {profile?.operationalHours?.close || "22:00"}
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveModal("hours")}
                      className="px-4 py-2  border  rounded-xl font-bold hover:opacity-80 shrink-0 shadow-sm transition-all cursor-pointer border-none" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} style={{ borderColor: "var(--card-border)" }}
                    >
                      Edit
                    </button>
                  </div>

                </div>
              </div>

              {/* KARTU 2: NOTIFIKASI */}
              <div className=" backdrop-blur border  rounded-3xl p-6 md:p-8 shadow-xs" style={{ borderColor: "var(--card-border)" }} style={{ backgroundColor: "var(--card-bg)" }}>
                <h3 className="text-[11px] font-black uppercase tracking-widest  mb-6" style={{ color: "var(--card-text-faint)" }}>Notifikasi & Kontak</h3>
                <div className="space-y-6 text-xs">
                  
                  <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <p className="font-bold  text-sm" style={{ color: "var(--card-title)" }}>Notifikasi WhatsApp</p>
                      <p className=" mt-1 font-mono font-medium truncate" style={{ color: "var(--card-text-muted)" }}>{profile?.phone || "+62 812-3456-7890"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => setActiveModal("phone")}
                        className="px-3 py-1.5  border  rounded-xl font-bold hover:opacity-80 text-[11px] shadow-sm transition-all cursor-pointer border-none" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} style={{ borderColor: "var(--card-border)" }}
                      >
                        Edit HP
                      </button>
                      <button 
                        onClick={() => handleToggle("notifWhatsapp", !!profile?.notifWhatsapp)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer border-none shadow-inner ${profile?.notifWhatsapp ? "bg-[#4D6344]" : "bg-[var(--card-surface-border)]"}`}
                      >
                        <div className={`bg-[var(--card-bg)] w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifWhatsapp ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold  text-sm" style={{ color: "var(--card-title)" }}>Notifikasi Push</p>
                      <p className=" mt-1 font-medium" style={{ color: "var(--card-text-muted)" }}>Browser / aplikasi dashboard</p>
                    </div>
                    <button 
                      onClick={() => handleToggle("notifPush", !!profile?.notifPush)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none shadow-inner ${profile?.notifPush ? "bg-[#4D6344]" : "bg-[var(--card-surface-border)]"}`}
                    >
                      <div className={`bg-[var(--card-bg)] w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifPush ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold  text-sm" style={{ color: "var(--card-title)" }}>Hanya Jam Operasional</p>
                      <p className=" mt-1 font-medium" style={{ color: "var(--card-text-muted)" }}>Matikan alert di luar jam buka</p>
                    </div>
                    <button 
                      onClick={() => handleToggle("notifOnlyOperational", !!profile?.notifOnlyOperational)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 shrink-0 cursor-pointer border-none shadow-inner ${profile?.notifOnlyOperational ? "bg-[#4D6344]" : "bg-[var(--card-surface-border)]"}`}
                    >
                      <div className={`bg-[var(--card-bg)] w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile?.notifOnlyOperational ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-6">

              {/* KARTU INSTRUKSI PANDUAN PENGATURAN WI-FI UNTUK USER */}
              <div className=" backdrop-blur border  rounded-3xl p-6 md:p-8 shadow-xs" style={{ borderColor: "var(--card-border)" }} style={{ backgroundColor: "var(--card-bg)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#EAF2EB] flex items-center justify-center shrink-0">
                    <Wifi size={16} className="text-[#4D6344]" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest " style={{ color: "var(--card-text-faint)" }}>Panduan Ganti Wi-Fi Perangkat</h3>
                </div>
                <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--card-surface-border)] p-5 rounded-2xl text-xs space-y-4 leading-relaxed text-[var(--card-text)] shadow-inner">
                  <p className="font-bold text-[var(--card-title)] text-sm">Jika Wi-Fi restoran Anda diganti atau berubah password:</p>
                  <ol className="list-decimal list-inside space-y-2.5 font-medium">
                    <li>Perangkat sensor otomatis akan mendeteksi putusnya koneksi.</li>
                    <li>Layar LCD pada alat akan menampilkan tulisan <span className="font-mono bg-[var(--card-surface)] px-1.5 py-0.5 rounded-md text-[11px] font-bold text-[var(--card-title)] border border-[var(--card-border)]">Wi-Fi Lost!</span></li>
                    <li>Ambil HP Anda, buka pengaturan Wi-Fi, lalu sambungkan ke hotspot sementara bernama <span className="font-bold  border-b border-dashed border-slate-400" style={{ color: "var(--card-title)" }}>&quot;Aetheris-Setup&quot;</span>.</li>
                    <li>Halaman konfigurasi otomatis akan muncul di layar HP Anda.</li>
                    <li>Pilih nama Wi-Fi baru Anda, masukkan kata sandi, lalu klik <span className="font-bold text-[#4D6344]">Save</span>.</li>
                  </ol>
                  <div className="flex items-start gap-2.5 pt-3 border-t border-[var(--card-border)] text-[11px] font-semibold text-amber-700">
                    <HelpCircle size={16} className="shrink-0 mt-0.5" />
                    <span>Alat akan otomatis merestart dan terhubung kembali ke Dashboard tanpa perlu bongkar kode program!</span>
                  </div>
                </div>
              </div>

              {/* KARTU PAKET LANGGANAN */}
              <div className=" backdrop-blur border  rounded-3xl p-6 md:p-8 shadow-xs" style={{ borderColor: "var(--card-border)" }} style={{ backgroundColor: "var(--card-bg)" }}>
                <h3 className="text-[11px] font-black uppercase tracking-widest  mb-6" style={{ color: "var(--card-text-faint)" }}>Paket Langganan</h3>
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
                  <div className="flex justify-between  font-bold" style={{ color: "var(--card-text-muted)" }}>
                    <span>Menggunakan 4 dari 8 alokasi sensor aktif</span>
                  </div>
                  <div className="w-full bg-[var(--card-surface)] h-2.5 rounded-full overflow-hidden shadow-inner">
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
        <div className="fixed inset-0 bg-[#111612]/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] transition-opacity">
          <div className="bg-[var(--card-bg)]/95 backdrop-blur-xl w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-[var(--card-border)]">
            
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black uppercase tracking-widest " style={{ color: "var(--card-title)" }}>
                {activeModal === "name" && "Edit Nama Restoran"}
                {activeModal === "address" && "Edit Alamat Operasional"}
                {activeModal === "phone" && "Edit Nomor WhatsApp"}
                {activeModal === "hours" && "Edit Jam Operasional"}
              </h4>
              <button onClick={() => setActiveModal(null)} className=" hover: hover:bg-[var(--card-surface)] p-1.5 rounded-full transition-all cursor-pointer border-none bg-transparent" style={{ color: "var(--card-title)" }} style={{ color: "var(--card-text-faint)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 mb-8">
              {activeModal === "name" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider  mb-2" style={{ color: "var(--card-text-muted)" }}>Nama Restoran Baru</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 text-xs border  bg-[var(--card-bg-solid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-medium transition-all" style={{ borderColor: "var(--card-border)" }}
                  />
                </div>
              )}

              {activeModal === "address" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider  mb-2" style={{ color: "var(--card-text-muted)" }}>Alamat Lengkap</label>
                  <textarea 
                    rows={3}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-3 text-xs border  bg-[var(--card-bg-solid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-medium resize-none leading-relaxed transition-all" style={{ borderColor: "var(--card-border)" }}
                  />
                </div>
              )}

              {activeModal === "phone" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider  mb-2" style={{ color: "var(--card-text-muted)" }}>Nomor WhatsApp Gateway</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 08999020805"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 text-xs border  bg-[var(--card-bg-solid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all" style={{ borderColor: "var(--card-border)" }}
                  />
                  <p className="text-[10px]  font-medium mt-2 leading-relaxed" style={{ color: "var(--card-text-muted)" }}>Pastikan nomor aktif agar bot WhatsApp script dapat mengirim pesan dengan lancar.</p>
                </div>
              )}

              {activeModal === "hours" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider  mb-2" style={{ color: "var(--card-text-muted)" }}>Jam Buka</label>
                    <input 
                      type="time" 
                      value={editOpenHour}
                      onChange={(e) => setEditOpenHour(e.target.value)}
                      className="w-full px-4 py-3 text-xs border  bg-[var(--card-bg-solid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all" style={{ borderColor: "var(--card-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider  mb-2" style={{ color: "var(--card-text-muted)" }}>Jam Tutup</label>
                    <input 
                      type="time" 
                      value={editCloseHour}
                      onChange={(e) => setEditCloseHour(e.target.value)}
                      className="w-full px-4 py-3 text-xs border  bg-[var(--card-bg-solid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] font-mono font-bold transition-all" style={{ borderColor: "var(--card-border)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-[var(--card-surface)] hover:bg-slate-200 text-[var(--card-text)] font-bold rounded-xl transition-all cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[var(--accent-primary)] hover:bg-slate-800 disabled:bg-[var(--card-surface-border)] text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
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