"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, updateDoc, doc, getDoc, limit, Timestamp } from "firebase/firestore";
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
  const [ownerPhone, setOwnerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailSensors, setDetailSensors] = useState<any[]>([]);
  const [detailAlerts, setDetailAlerts] = useState<any[]>([]);
  const [detailSubscriptions, setDetailSubscriptions] = useState<any[]>([]);
  const [detailProfile, setDetailProfile] = useState<any | null>(null);

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
      const userRef = await addDoc(collection(db, "users"), {
        name: newName,
        email: newEmail,
        package: newPackage,
        phone: ownerPhone || null,
        address: address || null,
        disabled: false,
        createdAt: serverTimestamp(),
      });

      // create subscription record (best-effort)
      await addDoc(collection(db, "subscriptions"), {
        userId: userRef.id,
        plan: newPackage,
        startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        paid: false,
        createdAt: serverTimestamp(),
      });

      // attempt to send invite via api route (no-op if not configured)
      try {
        setInviteSending(true);
        await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail, name: newName }),
        });
      } catch (err) {
        console.error('Invite API failed:', err);
      } finally {
        setInviteSending(false);
      }

      setNewEmail(""); setNewName(""); setNewPackage("basic"); setOwnerPhone(""); setAddress(""); setStartDate(""); setEndDate(""); setShowAdd(false);
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

  function closeModal() {
    setModalOpen(false);
    setSelectedUserId(null);
    setDetailAlerts([]);
    setDetailSensors([]);
    setDetailSubscriptions([]);
    setDetailProfile(null);
  }

  // Load detailed info when a user is selected and modal opens
  useEffect(() => {
    if (!modalOpen || !selectedUserId) return;
    let mounted = true;
    (async () => {
      try {
        setModalLoading(true);

        const userRef = doc(db, "users", selectedUserId);
        const userSnap = await getDoc(userRef);
        const profile = userSnap.exists() ? userSnap.data() : null;
        if (!mounted) return;
        setDetailProfile(profile);

        // sensors
        const sensorsQ = query(collection(db, "sensors"), where("userId", "==", selectedUserId));
        const sensorsSnap = await getDocs(sensorsQ);
        const sensorsList = sensorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!mounted) return;
        setDetailSensors(sensorsList);

        // latest 10 alerts
        const alertsQ = query(collection(db, "alerts"), where("userId", "==", selectedUserId), orderBy("createdAt", "desc"), limit(10));
        const alertsSnap = await getDocs(alertsQ);
        const alertsList = alertsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!mounted) return;
        setDetailAlerts(alertsList);

        // subscriptions
        const subsQ = query(collection(db, "subscriptions"), where("userId", "==", selectedUserId), orderBy("startDate", "desc"));
        const subsSnap = await getDocs(subsQ);
        const subsList = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!mounted) return;
        setDetailSubscriptions(subsList);
      } catch (err) {
        console.error("Failed loading user details:", err);
      } finally {
        if (mounted) setModalLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [modalOpen, selectedUserId]);

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
                          onClick={() => { setSelectedUserId(u.id); setModalOpen(true); }}
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
            <div className="bg-white rounded-lg p-6 w-[760px] max-w-[95%]">
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
                  <label className="text-sm text-slate-500">Nomor HP Pemilik</label>
                  <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Alamat Restoran</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>

                <div>
                  <label className="text-sm text-slate-500">Paket</label>
                  <select value={newPackage} onChange={(e) => setNewPackage(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-500">Tanggal Mulai Langganan</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500">Tanggal Berakhir Langganan</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-md">Batal</button>
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">Buat User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail User Modal */}
        {modalOpen && selectedUserId && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
            <div className="bg-white rounded-lg w-[900px] max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Detail Restoran</h3>
                  <p className="text-sm text-slate-500">Informasi lengkap dan riwayat.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => closeModal()} className="px-3 py-1 rounded-md">Tutup</button>
                </div>
              </div>

              {modalLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat detail...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50 rounded-md p-4">
                      <h4 className="font-semibold">Profil Restoran</h4>
                      <div className="mt-2 text-sm text-slate-700">
                        <div><strong>Nama:</strong> {detailProfile?.name || '-'}</div>
                        <div><strong>Email:</strong> {detailProfile?.email || '-'}</div>
                        <div><strong>No. HP:</strong> {detailProfile?.phone || detailProfile?.phoneNumber || '-'}</div>
                        <div><strong>Alamat:</strong> {detailProfile?.address || '-'}</div>
                        <div><strong>Jam Operasional:</strong> {detailProfile?.openingHours || '-'}</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Status Langganan</h4>
                      <div className="text-sm text-slate-700">
                        <div><strong>Paket:</strong> {detailProfile?.package || detailSubscriptions?.[0]?.plan || '-'}</div>
                        <div><strong>Tanggal Mulai:</strong> {detailSubscriptions?.[0]?.startDate ? new Date(detailSubscriptions[0].startDate.seconds * 1000).toLocaleDateString('id-ID') : '-'}</div>
                        <div><strong>Tanggal Berakhir:</strong> {detailSubscriptions?.[0]?.endDate ? new Date(detailSubscriptions[0].endDate.seconds * 1000).toLocaleDateString('id-ID') : '-'}</div>
                        <div><strong>Status Pembayaran:</strong> {detailSubscriptions?.[0]?.paid ? 'Lunas' : 'Belum Lunas'}</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-blue-600 text-white rounded-md">Edit Profil</button>
                        <button className="px-3 py-2 bg-slate-200 rounded-md">Ganti Paket</button>
                        <button onClick={() => { if (detailProfile?.disabled) toggleStatus(selectedUserId, 'nonaktif'); else toggleStatus(selectedUserId, 'aktif'); }} className="px-3 py-2 bg-rose-600 text-white rounded-md">{detailProfile?.disabled ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}</button>
                      </div>
                    </div>

                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Daftar Sensor</h4>
                      {detailSensors.length === 0 ? (
                        <div className="text-sm text-slate-500">Tidak ada sensor terdaftar.</div>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {detailSensors.map(s => (
                            <li key={s.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                              <div>
                                <div className="font-semibold">{s.name || s.id}</div>
                                <div className="text-xs text-slate-500">{s.location || '-'}</div>
                              </div>
                              <div className="text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${s.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.isOnline ? 'Online' : 'Offline'}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Riwayat Alert (10 terbaru)</h4>
                      {detailAlerts.length === 0 ? (
                        <div className="text-sm text-slate-500">Belum ada alert.</div>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {detailAlerts.map(a => (
                            <li key={a.id} className="p-2 rounded bg-slate-50">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">{a.message?.slice?.(0,60) || 'Alert'}</div>
                                <div className="text-xs text-slate-400">{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('id-ID') : '-'}</div>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Level: {a.level || 'warning'}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Riwayat Langganan</h4>
                      {detailSubscriptions.length === 0 ? (
                        <div className="text-sm text-slate-500">Tidak ada riwayat langganan.</div>
                      ) : (
                        <ul className="text-sm space-y-2">
                          {detailSubscriptions.map(s => (
                            <li key={s.id} className="p-2 rounded bg-slate-50">
                              <div className="font-semibold">{s.plan || s.package || '-'}</div>
                              <div className="text-xs text-slate-500">{s.startDate ? new Date(s.startDate.seconds * 1000).toLocaleDateString('id-ID') : '-'} — {s.endDate ? new Date(s.endDate.seconds * 1000).toLocaleDateString('id-ID') : '-'}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
