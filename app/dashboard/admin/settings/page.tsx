"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { UserPlus, Shield, BellRing, Save, X } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState({ name: "Aetheris Admin", email: "admin@aetheris.com", password: "" });
  const [notifyOnDanger, setNotifyOnDanger] = useState(true);
  const [defaultThreshold, setDefaultThreshold] = useState(400);

  const [adminList, setAdminList] = useState<AdminUser[]>([
    { id: "1", name: "Siti Aminah", email: "siti@aetheris.com", isActive: true },
    { id: "2", name: "Budi Pratama", email: "budi@aetheris.com", isActive: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Konfigurasi profil dan sistem default berhasil diperbarui!");
  };

  const handleToggleAdminStatus = (id: string) => {
    setAdminList(prevList =>
      prevList.map(admin =>
        admin.id === id ? { ...admin, isActive: !admin.isActive } : admin
      )
    );
  };

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert("Harap isi semua kolom!");
      return;
    }

    const createdAdmin: AdminUser = {
      id: Date.now().toString(),
      name: newAdmin.name,
      email: newAdmin.email,
      isActive: true,
    };

    setAdminList([...adminList, createdAdmin]);
    setNewAdmin({ name: "", email: "", password: "" });
    setIsModalOpen(false);
    alert(`Akun admin untuk ${createdAdmin.name} berhasil didaftarkan!`);
  };

  return (
    <div 
      className="flex bg-slate-50 min-h-screen font-sans text-slate-800 overflow-y-scroll" 
      style={{ scrollbarGutter: "stable" }}
    >
      <Sidebar role="admin" />
      
      <main className="ml-64 p-8 w-full transition-all">
        {/* Diubah: border-slate-200 diganti menjadi border-slate-100 agar garis panjang bawah judul menjadi tipis halus */}
        <header className="mb-8 border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola informasi kredensial profil, preferensi threshold platform, dan hak akses rekan admin.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Utama */}
          <form onSubmit={handleSubmitProfile} className="space-y-6 lg:col-span-2">
            
            {/* Box Profil */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                <Shield size={18} className="text-blue-600" />
                <h4 className="font-bold text-sm">Profil Akun Admin</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Administrator</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={(e) => setProfile({...profile, email: e.target.value})} 
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubah Password Baru</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password baru" 
                  value={profile.password} 
                  onChange={(e) => setProfile({...profile, password: e.target.value})} 
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                />
              </div>
            </div>

            {/* Box Parameter Sistem */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                <BellRing size={18} className="text-blue-600" />
                <h4 className="font-bold text-sm">Ambivalensi & Parameter Sistem</h4>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Threshold Kebocoran Default Baru (PPM)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={defaultThreshold} 
                    onChange={(e) => setDefaultThreshold(Number(e.target.value))} 
                    className="w-32 bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" 
                  />
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
                  <input 
                    type="checkbox" 
                    checked={notifyOnDanger} 
                    onChange={(e) => setNotifyOnDanger(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"></div>
                </label>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer">
              <Save size={16} /> Simpan Konfigurasi Admin
            </button>
          </form>

          {/* Kolom Kanan: Manajemen Otoritas Admin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm">Manajemen Akun Admin</h4>
              <p className="text-[11px] text-slate-500">Aktifkan atau nonaktifkan hak otoritas akses tim administrator.</p>
            </div>
            
            <div className="space-y-3">
              {adminList.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/70">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-medium text-slate-900 truncate">{admin.name}</p>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{admin.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-medium tracking-wide px-1.5 py-0.5 rounded transition-all ${admin.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {admin.isActive ? "AKTIF" : "OFF"}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={admin.isActive} 
                        onChange={() => handleToggleAdminStatus(admin.id)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 cursor-pointer"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full border-2 border-dashed border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-400 font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50/30 cursor-pointer"
            >
              <UserPlus size={14} /> + Tambah Admin Baru
            </button>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-md w-full overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900">
                <UserPlus size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm">Tambah Akun Admin Baru</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Contoh: John Doe"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Otoritas</label>
                <input 
                  type="email" 
                  placeholder="Contoh: john@aetheris.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Akses Awal</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Daftarkan Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}