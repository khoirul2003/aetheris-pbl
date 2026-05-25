"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
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

        const updateData: any = { name: newAdmin.name, email: newAdmin.email };
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
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll relative select-none" style={{ scrollbarGutter: "stable" }}>
      <Sidebar role="admin" />
      
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((toast) => (
          <div key={toast.id} className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-white pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === "error" ? "border-rose-200 text-rose-800" : "border-emerald-200 text-emerald-800"}`}>
            {toast.type === "error" ? <AlertCircle className="text-rose-500 shrink-0" size={18} /> : <CheckCircle className="text-emerald-500 shrink-0" size={18} />}
            <span className="text-xs font-bold leading-tight">{toast.message}</span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col flex-grow min-w-0">
        <Navbar title="Pengaturan Sistem" />

        <main className="ml-0 md:ml-64 pt-24 px-8 pb-8 w-auto transition-all flex-grow">
          <header className="mb-8 border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola informasi kredensial profil, preferensi threshold platform, dan hak akses rekan admin.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSubmitSystemConfig} className="space-y-6 lg:col-span-2">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                  <Shield size={18} className="text-blue-600" />
                  <h4 className="font-bold text-sm">Profil Akun Terbuka</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 px-1">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Administrator Aktif</span>
                    <p className="text-sm font-semibold text-slate-900 font-sans">{currentAdmin.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email Sesi Login</span>
                    <p className="text-sm font-semibold text-slate-600 font-mono">{currentAdmin.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900"><BellRing size={18} className="text-blue-600" /><h4 className="font-bold text-sm">Ambivalensi & Parameter Sistem</h4></div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Threshold Kebocoran Default Baru (PPM)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={defaultThreshold} onChange={(e) => setDefaultThreshold(Number(e.target.value))} className="w-32 bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                    <span className="text-xs text-slate-900 font-bold">PPM (Parts Per Million)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">Dipakai otomatis sebagai batas deteksi awal ketika perangkat sensor baru didaftarkan ke sistem mitra.</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Kirim Notifikasi Alert ke Sistem Admin</p>
                    <p className="text-xs text-slate-500">Dapatkan peringatan real-time instan jika ada salah satu mitra berstatus BAHAYA.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifyOnDanger} onChange={(e) => setNotifyOnDanger(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"></div>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full text-white font-medium bg-blue-600 hover:bg-blue-700 py-3 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
                <Save size={16} /> Simpan Konfigurasi Parameter Sistem
              </button>
            </form>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Manajemen Akun Admin</h4>
                <p className="text-[11px] text-slate-500">Daftar otoritas tim admin. Status aktif sinkron otomatis dengan login perangkat.</p>
              </div>
              
              <div className="space-y-3">
                {adminList.length > 0 ? (
                  adminList.map((admin) => (
                    <div key={admin.id} onClick={() => handleSelectEditAdmin(admin)} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/70 cursor-pointer group">
                      <div className="overflow-hidden pr-2 flex-grow">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{admin.name}</p>
                          <Edit2 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] text-slate-600 truncate mt-0.5">{admin.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded transition-all ${
                          admin.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>{admin.isActive ? "AKTIF" : "TIDAK AKTIF"}</span>
                        <button onClick={(e) => handleDeleteAdmin(admin.id, admin.name, e)} className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors" title="Hapus Akun Admin"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6 font-medium">Belum ada akun admin terdaftar.</p>
                )}
              </div>
              
              <button type="button" onClick={() => { setEditingAdminId(null); setNewAdmin({ name: "", email: "", password: "" }); setModalPasswordError(""); setShowModalPassword(false); setIsModalOpen(true); }} className="w-full border-2 border-dashed border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-400 font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50/30 cursor-pointer"><UserPlus size={14} /> + Tambah Admin Baru</button>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900"><UserPlus size={18} className="text-blue-600" /><h3 className="font-bold text-sm">{editingAdminId ? "Ubah Data Akun Admin" : "Tambah Akun Admin Baru"}</h3></div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg transition-colors cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" placeholder="Contoh: John Doe" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Otoritas</label>
                <input type="email" placeholder="Contoh: john@aetheris.com" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{editingAdminId ? "Password Baru (Kosongkan jika tetap)" : "Password Akses Awal"}</label>
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
                    className={`w-full bg-white border rounded-xl pl-2.5 pr-10 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-inner ${modalPasswordError ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 focus:ring-blue-500"}`}
                    style={{ WebkitTextSecurity: showModalPassword ? "none" : "disc" } as any}
                  />
                  {newAdmin.password && (
                    <button type="button" onClick={() => setShowModalPassword(!showModalPassword)} className={`absolute right-3 focus:outline-none select-none z-10 ${modalPasswordError ? 'text-rose-500' : 'text-slate-400'}`}>{showModalPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  )}
                </div>
                {modalPasswordError && <p className="text-rose-500 text-[11px] font-semibold mt-1.5 flex items-center gap-1"><AlertCircle size={11} /> {modalPasswordError}</p>}
              </div>

              <div className="flex gap-2 pt-2 justify-end border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all cursor-pointer">Batal</button>
                <button type="submit" disabled={!!modalPasswordError} className={`px-4 py-2 text-white font-medium text-xs rounded-xl transition-all shadow-sm ${modalPasswordError ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}>{editingAdminId ? "Simpan Perubahan" : "Daftarkan Admin"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}