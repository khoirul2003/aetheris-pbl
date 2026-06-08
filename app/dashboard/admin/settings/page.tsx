"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientProfileModel, AdminUser, SystemConfig } from "@/models/clientProfileModel"; 
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { doc, updateDoc } from "firebase/firestore";
import { UserPlus, Shield, BellRing, Save, X, Trash2, Edit2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

interface ToastNotification {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function AdminSettingsPage() {
  const [currentAdmin, setCurrentAdmin] = useState({ name: "Memuat nama...", email: "Memuat email..." });
  const [notifyOnDanger, setNotifyOnDanger] = useState(true);
  const [defaultThreshold, setDefaultThreshold] = useState(400);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [modalPasswordError, setModalPasswordError] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleModalPasswordBlur = () => {
    if (newAdmin.password && newAdmin.password.length < 6) {
      setModalPasswordError("Password harus minimal 6 karakter!");
    } else {
      setModalPasswordError("");
    }
  };

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await ClientProfileModel.getSystemConfig();
        if (data) {
          setDefaultThreshold(data.defaultThreshold || 400);
          setNotifyOnDanger(data.notifyOnDanger ?? true);
        } else {
          setDefaultThreshold(400);
          setNotifyOnDanger(true);
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal memuat konfigurasi dari database", "error");
      }
    }
    loadConfig();

    const unsubscribeAdmins = ClientProfileModel.subscribeToAdmins((admins) => {
      setAdminList(admins);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const currentAdminRef = doc(db, "users", user.uid);
          await updateDoc(currentAdminRef, { isActive: true });
          
          const adminSnap = await ClientProfileModel.getUserProfile(user.uid);
          if (adminSnap) {
            setCurrentAdmin({
              name: adminSnap.name || "Aetheris Admin",
              email: adminSnap.email || user.email || ""
            });
          }
        } catch (e) {
          console.error("Gagal sinkronisasi data sesi login aktif admin:", e);
        }
      }
    });

    return () => {
      unsubscribeAdmins();
      unsubscribeAuth();
    };
  }, []);

  const handleSubmitSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatePayload: SystemConfig = {
        defaultThreshold: Number(defaultThreshold),
        notifyOnDanger: Boolean(notifyOnDanger)
      };

      await ClientProfileModel.saveSystemConfig(updatePayload);
      showToast("Konfigurasi parameter sistem platform berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan konfigurasi", "error");
    }
  };

  const handleSelectEditAdmin = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setNewAdmin({ name: admin.name, email: admin.email, password: "" });
    setModalPasswordError("");
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const handleDeleteAdmin = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (confirm(`Apakah Anda yakin ingin menghapus akun admin ${name}?`)) {
      try {
        await ClientProfileModel.deleteAdmin(id);
        showToast("Akun admin " + name + " berhasil dihapus!");
      } catch (err) {
        console.error(err);
        showToast("Gagal menghapus akun admin", "error");
      }
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) {
      showToast("Nama dan Email wajib diisi!", "error");
      return;
    }

    try {
      if (editingAdminId) {
        if (newAdmin.password && newAdmin.password.length < 6) {
          setModalPasswordError("Password harus minimal 6 karakter!");
          return;
        }

        const updateData: { name: string; email: string; password?: string } = { 
          name: newAdmin.name, 
          email: newAdmin.email 
        };
        if (newAdmin.password) {
          updateData.password = newAdmin.password; 
        }

        await ClientProfileModel.updateAdmin(editingAdminId, updateData);
        showToast("Data admin " + newAdmin.name + " berhasil diperbarui!");
      } else {
        if (!newAdmin.password || newAdmin.password.length < 6) {
          setModalPasswordError("Password harus minimal 6 karakter!");
          return;
        }

        await ClientProfileModel.createAdmin({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          isActive: false 
        });

        showToast("Akun admin untuk " + newAdmin.name + " berhasil didaftarkan!");
      }

      setNewAdmin({ name: "", email: "", password: "" });
      setEditingAdminId(null);
      setModalPasswordError("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Gagal memproses pendaftaran ke database", "error");
    }
  };

  return (
    <AdminLayout
      title="Pengaturan Admin"
      description="Kelola informasi kredensial profil, preferensi threshold platform, dan hak akses rekan admin."
    >
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((toast) => (
          <div key={toast.id} className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === "error" ? "border-rose-200 text-rose-800 bg-rose-50" : ""}`} style={{ backgroundColor: toast.type === "error" ? "" : "var(--card-bg)", borderColor: toast.type === "error" ? "" : "var(--card-border)", color: toast.type === "error" ? "" : "var(--card-title)" }}>
            {toast.type === "error" ? <AlertCircle className="text-rose-500 shrink-0" size={18} /> : <CheckCircle className="text-emerald-500 shrink-0" size={18} />}
            <span className="text-xs font-bold leading-tight">{toast.message}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSubmitSystemConfig} className="space-y-6 lg:col-span-2">
              <div className="p-6 rounded-2xl shadow-sm space-y-5" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                <div className="flex items-center gap-2 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)", color: "var(--card-title)" }}>
                  <Shield size={18} style={{ color: "var(--accent-primary)" }} />
                  <h4 className="font-bold text-sm">Profil Akun Terbuka</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 px-1">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Nama Administrator Aktif</span>
                    <p className="text-sm font-semibold font-sans" style={{ color: "var(--card-title)" }}>{currentAdmin.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Alamat Email Sesi Login</span>
                    <p className="text-sm font-semibold font-mono" style={{ color: "var(--card-text-muted)" }}>{currentAdmin.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl shadow-sm space-y-5" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                <div className="flex items-center gap-2 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)", color: "var(--card-title)" }}>
                  <BellRing size={18} style={{ color: "var(--accent-primary)" }} />
                  <h4 className="font-bold text-sm">Ambivalensi & Parameter Sistem</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--card-title)" }}>Threshold Kebocoran Default Baru (PPM)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={defaultThreshold} onChange={(e) => setDefaultThreshold(Number(e.target.value))} className="w-32 border rounded-xl p-2.5 text-sm font-mono font-medium focus:outline-none focus:ring-2 shadow-inner transition-colors" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--card-title)" }}>PPM (Parts Per Million)</span>
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--card-text-muted)" }}>Dipakai otomatis sebagai batas deteksi awal ketika perangkat sensor baru didaftarkan ke sistem mitra.</p>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--card-title)" }}>Kirim Notifikasi Alert ke Sistem Admin</p>
                    <p className="text-xs" style={{ color: "var(--card-text-muted)" }}>Dapatkan peringatan real-time instan jika ada salah satu mitra berstatus BAHAYA.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifyOnDanger} onChange={(e) => setNotifyOnDanger(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer" style={{ backgroundColor: notifyOnDanger ? "var(--accent-primary)" : "var(--card-surface-border)" }}></div>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full text-white font-medium py-3 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer border-none" style={{ backgroundColor: "var(--accent-primary)" }}>
                <Save size={16} /> Simpan Konfigurasi Parameter Sistem
              </button>
            </form>

            <div className="p-6 rounded-2xl shadow-sm h-fit space-y-4" style={{ backgroundColor: "var(--card-bg)", borderWidth: 1, borderColor: "var(--card-border)" }}>
              <div className="pb-2" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)" }}>
                <h4 className="font-bold text-sm" style={{ color: "var(--card-title)" }}>Manajemen Akun Admin</h4>
                <p className="text-[11px]" style={{ color: "var(--card-text-muted)" }}>Daftar otoritas tim admin. Status aktif sinkron otomatis dengan login perangkat.</p>
              </div>
              
              <div className="space-y-3">
                {adminList.length > 0 ? (
                  adminList.map((admin) => (
                    <div key={admin.id} onClick={() => handleSelectEditAdmin(admin)} className="flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer group hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                      <div className="overflow-hidden pr-2 grow">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate transition-colors" style={{ color: "var(--card-title)" }}>{admin.name}</p>
                          <Edit2 size={10} style={{ color: "var(--card-text-faint)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--card-text-muted)" }}>{admin.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded transition-all ${
                          admin.isActive ? 'bg-emerald-100/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>{admin.isActive ? "AKTIF" : "TIDAK AKTIF"}</span>
                        <button onClick={(e) => handleDeleteAdmin(admin.id, admin.name, e)} className="p-1 rounded transition-colors border-none bg-transparent cursor-pointer hover:text-rose-500" style={{ color: "var(--card-text-muted)" }} title="Hapus Akun Admin"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs py-6 font-medium" style={{ color: "var(--card-text-faint)" }}>Belum ada akun admin terdaftar.</p>
                )}
              </div>
              
              <button type="button" onClick={() => { setEditingAdminId(null); setNewAdmin({ name: "", email: "", password: "" }); setModalPasswordError(""); setShowModalPassword(false); setIsModalOpen(true); }} className="w-full border-2 border-dashed font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-80" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text)", backgroundColor: "transparent" }}>
                <UserPlus size={14} /> + Tambah Admin Baru
              </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="rounded-2xl border shadow-xl max-w-md w-full overflow-hidden" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-border)" }}>
            <div className="p-5 flex justify-between items-center" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)", backgroundColor: "var(--card-surface)" }}>
              <div className="flex items-center gap-2" style={{ color: "var(--card-title)" }}><UserPlus size={18} style={{ color: "var(--accent-primary)" }} /><h3 className="font-bold text-sm">{editingAdminId ? "Ubah Data Akun Admin" : "Tambah Akun Admin Baru"}</h3></div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg transition-colors cursor-pointer border-none bg-transparent hover:opacity-80" style={{ color: "var(--card-text-muted)" }}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--card-title)" }}>Nama Lengkap</label>
                <input type="text" placeholder="Contoh: John Doe" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="w-full border rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 transition-all shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--card-title)" }}>Email Otoritas</label>
                <input type="email" placeholder="Contoh: john@aetheris.com" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full border rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 transition-all shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--card-title)" }}>{editingAdminId ? "Password Baru (Kosongkan jika tetap)" : "Password Akses Awal"}</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    placeholder="•••••••• (Min. 6 karakter)"
                    value={newAdmin.password}
                    onChange={(e) => {
                      setNewAdmin({ ...newAdmin, password: e.target.value });
                      if (e.target.value.length >= 6 || e.target.value === "") setModalPasswordError("");
                    }}
                    onBlur={handleModalPasswordBlur}
                    className={`w-full border rounded-xl pl-2.5 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 transition-all shadow-inner ${modalPasswordError ? "border-rose-500 focus:ring-rose-500" : ""}`}
                    style={{ backgroundColor: "var(--card-bg)", borderColor: modalPasswordError ? "" : "var(--card-surface-border)", color: "var(--card-text)", WebkitTextSecurity: showModalPassword ? "none" : "disc" } as React.CSSProperties}
                  />
                  {newAdmin.password && (
                    <button type="button" onClick={() => setShowModalPassword(!showModalPassword)} className={`absolute right-3 focus:outline-none select-none z-10 border-none bg-transparent cursor-pointer ${modalPasswordError ? 'text-rose-500' : ''}`} style={{ color: modalPasswordError ? "" : "var(--card-text-muted)" }}>{showModalPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  )}
                </div>
                {modalPasswordError && <p className="text-rose-500 text-[11px] font-semibold mt-1.5 flex items-center gap-1"><AlertCircle size={11} /> {modalPasswordError}</p>}
              </div>

              <div className="flex gap-2 pt-2 justify-end mt-4" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Batal</button>
                <button type="submit" disabled={!!modalPasswordError} className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-all shadow-sm border-none ${modalPasswordError ? "opacity-50 cursor-not-allowed shadow-none" : "cursor-pointer hover:opacity-80"}`} style={{ backgroundColor: modalPasswordError ? "var(--card-text-faint)" : "var(--accent-primary)" }}>{editingAdminId ? "Simpan Perubahan" : "Daftarkan Admin"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}