"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users as UsersIcon, Plus, Search, MoreHorizontal } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  package?: string;
  sensorCount?: number;
  status?: string;
  createdAt?: { seconds: number } | string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState<string | "">("");
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPackage, setNewPackage] = useState("basic");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const rows: UserRow[] = [];

      for (const docSnap of snap.docs) {
        const data: any = docSnap.data();
        rows.push({
          id: docSnap.id,
          name: data.name || data.displayName || "-",
          email: data.email || "-",
          package: data.package || data.plan || "basic",
          sensorCount: data.sensorCount || 0,
          status: data.disabled ? "nonaktif" : "aktif",
          createdAt: data.createdAt || null,
        });
      }

      setUsers(rows);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filtered = users.filter(u => {
    const matchesSearch = search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesPackage = packageFilter === "" || u.package === packageFilter;
    const matchesStatus = statusFilter === "" || u.status === statusFilter;
    return matchesSearch && matchesPackage && matchesStatus;
  });

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newName) return;
    try {
      await addDoc(collection(db, "users"), {
        name: newName,
        email: newEmail,
        package: newPackage,
        disabled: false,
        createdAt: serverTimestamp(),
      });
      setNewEmail(""); setNewName(""); setNewPackage("basic"); setShowAdd(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleStatus(userId: string, currentStatus?: string) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { disabled: currentStatus === "aktif" });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar role="admin" />

      <main className="ml-64 p-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold">Manajemen User — Daftar Restoran</h2>
            <p className="text-sm text-slate-500">Kelola akun restoran: paket, sensor, dan status.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="pl-10 pr-4 py-2 w-64 rounded-full border border-slate-200 bg-white text-sm" />
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm">
              <Plus size={16} /> Tambah User
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-slate-500">Filter Paket</label>
              <select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)} className="mt-1 block px-3 py-2 border rounded-md text-sm">
                <option value="">Semua</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Status Akun</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block px-3 py-2 border rounded-md text-sm">
                <option value="">Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-slate-500 self-end">{filtered.length} hasil</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[12px] uppercase font-bold tracking-wide">
              <tr>
                <th className="px-6 py-3">Nama Restoran</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Paket Aktif</th>
                <th className="px-6 py-3">Jumlah Sensor</th>
                <th className="px-6 py-3">Status Akun</th>
                <th className="px-6 py-3">Tanggal Daftar</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-6 text-center text-slate-500">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-6 text-center text-slate-500">Tidak ada hasil.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm">{u.package}</td>
                    <td className="px-6 py-4 text-sm">{u.sensorCount ?? 0}</td>
                    <td className="px-6 py-4 text-sm">{u.status}</td>
                    <td className="px-6 py-4 text-sm">{u.createdAt ? new Date((u.createdAt as any).seconds * 1000).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/admin/users/${u.id}`)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Lihat
                        </button>

                        <button
                          onClick={() => toggleStatus(u.id, u.status)}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-md ${u.status === 'aktif' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        <button className="p-2 rounded-md text-slate-500 hover:bg-slate-50">
                          <MoreHorizontal />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add user modal (simple) */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-[520px]">
              <h3 className="text-lg font-bold mb-3">Tambah User Baru</h3>
              <form onSubmit={handleAddUser} className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500">Nama Restoran</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Email</label>
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Paket</label>
                  <select value={newPackage} onChange={(e) => setNewPackage(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-md">Batal</button>
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">Buat User</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
