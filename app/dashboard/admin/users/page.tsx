"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { ClientProfileModel } from "@/models/clientProfileModel";
import { type FirestoreSensor, type LiveSensorData } from "@/models/clientSensorModel";
import { ClientSubscriptionModel, type SubscriptionPackage, type UserSubscriptionLog } from "@/models/clientSubscriptionModel";
import { db } from "@/lib/firebase";
import { 
  addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, Timestamp,
  writeBatch, getDocs 
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "@/lib/firebase";
import {
  AlertTriangle, CircleCheck, CircleOff, Clock3, CreditCard,
  Database, Edit3, Eye, Plus, ToggleLeft, ToggleRight, UserRound, X, Copy, Search, Save, Loader2, Trash2
} from "lucide-react";

// ============================================================================
// 1. TYPES & UTILS
// ============================================================================
type AdminUserRow = {
  id: string; name: string; email: string; restaurantName: string; phone: string; address: string;
  operationalHours?: { open?: string; close?: string; };
  plan?: string; planExpiry?: Timestamp | null; isActive?: boolean; role?: string; createdAt?: Timestamp | Date | null;
};

type DetailSensorRow = FirestoreSensor & { live?: LiveSensorData; };

const DEFAULT_PACKAGE = "Basic";

function formatDate(value?: Timestamp | Date | string | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert(`User ID [${text}] successfully copied!`);
};

// ============================================================================
// 2. MAIN PAGE COMPONENT
// ============================================================================
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [sensorCounts, setSensorCounts] = useState<Record<string, number>>({});
  
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const rows: AdminUserRow[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<AdminUserRow, "id">;
        if ((data.role ?? "user") === "user") {
          rows.push({ id: docSnap.id, ...data, isActive: data.isActive ?? true });
        }
      });
      rows.sort((a, b) => (a.restaurantName || a.name).localeCompare(b.restaurantName || b.name));
      setUsers(rows);
      setLoadingUsers(false);
    });

    const unsubscribePackages = ClientSubscriptionModel.subscribeToPackages(setPackages);
    
    const unsubscribeSensors = onSnapshot(collection(db, "sensors"), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const userId = docSnap.data().userId;
        if (userId) counts[userId] = (counts[userId] || 0) + 1;
      });
      setSensorCounts(counts);
    });

    return () => { unsubscribeUsers(); unsubscribePackages(); unsubscribeSensors(); };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = q === "" || u.restaurantName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
      const matchPkg = packageFilter === "" || u.plan?.toLowerCase() === packageFilter.toLowerCase();
      const matchStatus = statusFilter === "" || (statusFilter === "active" ? u.isActive !== false : u.isActive === false);
      return matchSearch && matchPkg && matchStatus;
    });
  }, [users, search, packageFilter, statusFilter]);

  const summary = useMemo(() => {
    const active = users.filter((u) => u.isActive !== false).length;
    return { 
      total: users.length, active, inactive: users.length - active, 
      sensors: Object.values(sensorCounts).reduce((a, b) => a + b, 0) 
    };
  }, [users, sensorCounts]);

  const toggleUserActive = async (user: AdminUserRow) => {
    await updateDoc(doc(db, "users", user.id), { isActive: !(user.isActive ?? true) });
  };

  return (
    <AdminLayout title="User Management" description="Manage users, account statuses, and create new clients.">
      <div className="flex w-full flex-col gap-6">

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Restaurants" value={summary.total.toString()} icon={UserRound} tone="blue" note="All users" />
          <StatCard title="Active Accounts" value={summary.active.toString()} icon={CircleCheck} tone="emerald" note="Operating normally" />
          <StatCard title="Inactive Accounts" value={summary.inactive.toString()} icon={CircleOff} tone="rose" note="Needs action" />
          <StatCard title="Total Sensors" value={summary.sensors.toString()} icon={Database} tone="amber" note="Registered sensors" />
        </section>

        <section className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold" style={{ color: "var(--card-title)" }}>User Directory</h2>
            <button onClick={() => setNewUserOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all shadow-sm w-full lg:w-auto cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus size={18} /> Add New User
            </button>
          </div>
          <hr className="my-5" style={{ borderColor: "var(--card-surface-border)" }} />
          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--card-text-faint)" }} size={16} />
              <input type="text" placeholder="Search name, email, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-11 rounded-xl border pl-9 pr-4 text-sm outline-none focus:ring-2 transition-all" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip label="All" active={packageFilter === "" && statusFilter === ""} onClick={() => { setPackageFilter(""); setStatusFilter(""); }} />
            {packages.map((pkg) => (
              <FilterChip key={pkg.id} label={pkg.name} active={packageFilter === pkg.id} onClick={() => setPackageFilter((prev) => (prev === pkg.id ? "" : pkg.id))} />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)" }}>
                <tr>
                  <th className="px-6 py-4">Restaurant / ID</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Active Package</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--table-border)", backgroundColor: "var(--table-body-bg)", color: "var(--card-text)" }}>
                {loadingUsers ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: "var(--card-text-faint)" }}>Loading data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: "var(--card-text-faint)" }}>No users match the filters.</td></tr>
                ) : filteredUsers.map((user) => {
                  const active = user.isActive !== false;
                  return (
                    <tr key={user.id} className="transition-colors hover:opacity-90">
                      <td className="px-6 py-4">
                        <div className="font-bold" style={{ color: "var(--card-title)" }}>{user.restaurantName}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <code className="text-[10px] border px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" }}>ID: {user.id}</code>
                          <button onClick={() => copyToClipboard(user.id)} className="transition-colors cursor-pointer border-none bg-transparent p-0 hover:text-emerald-500" style={{ color: "var(--card-text-faint)" }}><Copy size={13} /></button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--card-text-muted)" }}>{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                          {packages.find(p => p.id === user.plan)?.name || user.plan || "Basic"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelectedUser(user)} className="inline-flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                            <Eye size={14} /> Details
                          </button>
                          <button onClick={() => toggleUserActive(user)} className={`inline-flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer whitespace-nowrap ${active ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"}`}>
                            {active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                            {active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {newUserOpen && <AddUserModal packages={packages} onClose={() => setNewUserOpen(false)} />}
      {selectedUser && <UserDetailModal user={selectedUser} packages={packages} onClose={() => setSelectedUser(null)} />}
    </AdminLayout>
  );
}

// ============================================================================
// 3. COMPONENT: ADD NEW USER MODAL
// ============================================================================
function AddUserModal({ packages, onClose }: { packages: SubscriptionPackage[], onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "", email: "", password: "", phone: "", address: "", 
    openHour: "08:00", closeHour: "22:00", plan: DEFAULT_PACKAGE, planDurationDays: 30
  });

  const handlePlanChange = (val: string) => {
    const selectedPkg = packages.find((p) => p.id === val);
    setForm({ ...form, plan: val, planDurationDays: selectedPkg?.historyDurationDays || 30 }); 
  };

  const createUser = async () => {
    if (!form.email || !form.password) {
      alert("Email and Password are required for login.");
      return;
    }
    
    setSaving(true);
    try {
      // 1. Buat user di Firebase Auth (Gunakan secondary app agar admin tidak ter-logout)
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      const uid = userCredential.user.uid;
      
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      // 2. Simpan profil ke Firestore
      const newRef = doc(db, "users", uid);
      const now = new Date();
      const endDate = addDays(now, form.planDurationDays);

      await setDoc(newRef, {
        name: form.restaurantName, restaurantName: form.restaurantName, email: form.email,
        phone: form.phone, address: form.address,
        operationalHours: { open: form.openHour, close: form.closeHour },
        plan: form.plan, planExpiry: endDate, role: "user", isActive: true, 
        createdAt: serverTimestamp(),
      });

      // 3. Catat log berlangganan
      await addDoc(collection(db, "userSubscriptions"), {
        userId: uid, userName: form.restaurantName, userEmail: form.email, restaurantName: form.restaurantName,
        packageName: packages.find(p => p.id === form.plan)?.name || form.plan,
        startDate: now, endDate, paymentStatus: "paid", 
        amount: packages.find(p => p.id === form.plan)?.price || 0,
      });

      onClose();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert("Failed to add new user: " + (error.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClass="max-w-3xl">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold" style={{ color: "var(--card-title)" }}>Add New Client</h3>
        <p className="text-sm mt-1" style={{ color: "var(--card-text-muted)" }}>Create a restaurant profile, set a login password, and select an initial package.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <InputField label="Restaurant Name" value={form.restaurantName} onChange={(v: string) => setForm({ ...form, restaurantName: v })} />
        <InputField label="WhatsApp Number" type="tel" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} />
        <InputField label="Login Email" type="email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} />
        <InputField label="Login Password" type="password" value={form.password} onChange={(v: string) => setForm({ ...form, password: v })} />
        <div className="md:col-span-2">
          <InputField label="Full Address" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} />
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <InputField label="Opening Time" type="time" value={form.openHour} onChange={(v: string) => setForm({ ...form, openHour: v })} />
          <InputField label="Closing Time" type="time" value={form.closeHour} onChange={(v: string) => setForm({ ...form, closeHour: v })} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 p-5 rounded-2xl border shadow-inner" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
        <SelectField label="Select Initial Package" value={form.plan} onChange={handlePlanChange} options={packages.map((p) => ({ label: p.name, value: p.id }))} />
        <InputField label="Active Duration (Days)" type="number" value={form.planDurationDays.toString()} onChange={(v: string) => setForm({ ...form, planDurationDays: parseInt(v) || 0 })} />
      </div>

      <div className="mt-8 flex justify-end gap-3" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)", paddingTop: "1rem" }}>
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Cancel</button>
        <button disabled={saving} onClick={createUser} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-colors flex items-center gap-2 border-none cursor-pointer shadow-sm hover:opacity-80" style={{ backgroundColor: "var(--accent-primary)" }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Register Client
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// 4. COMPONENT: USER DETAIL MODAL (DENGAN INLINE EDITING & PERMANENT DELETE)
// ============================================================================
function UserDetailModal({ user, packages, onClose }: { user: AdminUserRow, packages: SubscriptionPackage[], onClose: () => void }) {
  const [localUser, setLocalUser] = useState(user);
  const [detailSensors, setDetailSensors] = useState<DetailSensorRow[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ ...user, openHour: user.operationalHours?.open || "08:00", closeHour: user.operationalHours?.close || "22:00" });

  const [isChangingPackage, setIsChangingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState<{ plan: string; extendDays: number; paymentStatus: "paid" | "pending" }>({ 
    plan: user.plan || DEFAULT_PACKAGE, 
    extendDays: 30, 
    paymentStatus: "paid" 
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    const unsubSensors = onSnapshot(query(collection(db, "sensors"), where("userId", "==", localUser.id)), (snap) => {
      setDetailSensors(snap.docs.map(d => ({ ...(d.data() as FirestoreSensor), id: d.id })));
    });
    const unsubSubs = onSnapshot(query(collection(db, "userSubscriptions"), where("userId", "==", localUser.id)), (snap) => {
      const rows = snap.docs.map(d => ({ ...(d.data() as UserSubscriptionLog), id: d.id }));
      rows.sort((a, b) => (b.startDate?.toDate?.().getTime() || 0) - (a.startDate?.toDate?.().getTime() || 0));
      setSubscriptionHistory(rows);
      setLoading(false);
    });
    return () => { unsubSensors(); unsubSubs(); };
  }, [localUser.id]);

  const saveProfile = async () => {
    setSaving(true);
    await ClientProfileModel.updateSettings(localUser.id, {
      name: editForm.restaurantName, restaurantName: editForm.restaurantName, email: editForm.email,
      phone: editForm.phone, address: editForm.address, operationalHours: { open: editForm.openHour, close: editForm.closeHour }
    });
    setLocalUser({ ...localUser, ...editForm, operationalHours: { open: editForm.openHour, close: editForm.closeHour }});
    setIsEditingProfile(false);
    setSaving(false);
  };

  const savePackage = async () => {
    setSaving(true);
    const selectedPackage = packages.find(p => p.id === packageForm.plan);
    const now = new Date();
    const endDate = addDays(now, packageForm.extendDays);

    await updateDoc(doc(db, "users", localUser.id), { plan: packageForm.plan, planExpiry: endDate });
    await addDoc(collection(db, "userSubscriptions"), {
      userId: localUser.id, userName: localUser.name, userEmail: localUser.email, restaurantName: localUser.restaurantName,
      packageName: selectedPackage?.name || packageForm.plan, startDate: now, endDate, paymentStatus: packageForm.paymentStatus,
      amount: selectedPackage?.price || 0,
    });
    
    setLocalUser({ ...localUser, plan: packageForm.plan, planExpiry: Timestamp.fromDate(endDate) });
    setIsChangingPackage(false);
    setSaving(false);
  };

  const executePermanentDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      batch.delete(doc(db, "users", localUser.id));

      const qSensors = query(collection(db, "sensors"), where("userId", "==", localUser.id));
      const snapSensors = await getDocs(qSensors);
      snapSensors.forEach(d => batch.delete(d.ref));

      const qAlerts = query(collection(db, "alerts"), where("userId", "==", localUser.id));
      const snapAlerts = await getDocs(qAlerts);
      snapAlerts.forEach(d => batch.delete(d.ref));

      const qSubs = query(collection(db, "userSubscriptions"), where("userId", "==", localUser.id));
      const snapSubs = await getDocs(qSubs);
      snapSubs.forEach(d => batch.delete(d.ref));

      await batch.commit();
      onClose();
    } catch (error) {
      console.error("Failed to delete user data:", error);
      alert("An error occurred while deleting the user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClass="max-w-6xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--card-text-faint)" }}>Client Details</p>
          <div className="flex items-center gap-3 mt-1">
            <h3 className="text-2xl font-extrabold" style={{ color: "var(--card-title)" }}>{localUser.restaurantName}</h3>
            <button onClick={() => copyToClipboard(localUser.id)} className="p-1.5 rounded-lg transition-all border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text-muted)" }} title="Copy ID"><Copy size={16} /></button>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--card-text-muted)" }}>{localUser.email}</p>
        </div>
        
        {!isDeleting && (
          <button onClick={() => setIsDeleting(true)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold cursor-pointer transition-colors" style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.2)", color: "rgb(244, 63, 94)" }}>
            <Trash2 size={14} /> Permanent Delete
          </button>
        )}
      </div>

      {isDeleting ? (
        <div className="rounded-2xl border p-6 md:p-8 animate-in fade-in zoom-in-95" style={{ backgroundColor: "rgba(244, 63, 94, 0.05)", borderColor: "rgba(244, 63, 94, 0.2)" }}>
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(244, 63, 94, 0.2)", color: "rgb(244, 63, 94)" }}>
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: "rgb(225, 29, 72)" }}>Warning: Permanent Deletion</h3>
            <p className="text-sm mb-6 font-medium" style={{ color: "rgb(225, 29, 72)" }}>
              You are about to permanently delete <strong>{localUser.restaurantName}</strong>. This action will erase their profile, ALL assigned sensors, ALL alert history, and ALL billing records. <strong>This cannot be undone.</strong>
            </p>
            
            <div className="w-full text-left p-4 rounded-xl border shadow-sm mb-6" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "rgba(244, 63, 94, 0.3)" }}>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--card-text-faint)" }}>Type &quot;DELETE&quot; to confirm</label>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                className="w-full h-11 rounded-lg border px-4 text-sm font-bold outline-none focus:ring-2 transition-all" 
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "rgb(244, 63, 94)" } as React.CSSProperties}
                placeholder="DELETE"
              />
            </div>

            <div className="flex w-full gap-3">
              <button onClick={() => { setIsDeleting(false); setDeleteConfirmText(""); }} className="flex-1 py-3 rounded-xl border font-bold transition-colors cursor-pointer shadow-sm hover:opacity-80" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-border)", color: "var(--card-text)" }}>
                Cancel
              </button>
              <button 
                onClick={executePermanentDelete} 
                disabled={deleteConfirmText !== "DELETE" || saving} 
                className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer border-none shadow-md hover:opacity-80" style={{ backgroundColor: "rgb(225, 29, 72)" }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Destroy Data
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (<div className="py-16 text-center text-sm" style={{ color: "var(--card-text-faint)" }}>Loading client details...</div>) : (
        <div className="grid gap-6 xl:grid-cols-2">
          
          <div className="space-y-6">
            <Panel title="Restaurant Profile Information" icon={UserRound}>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InputField label="Restaurant Name" value={editForm.restaurantName} onChange={(v: string) => setEditForm({...editForm, restaurantName: v})} />
                    <InputField label="WhatsApp Number" value={editForm.phone} onChange={(v: string) => setEditForm({...editForm, phone: v})} />
                    <div className="md:col-span-2">
                      <InputField label="Address" value={editForm.address} onChange={(v: string) => setEditForm({...editForm, address: v})} />
                    </div>
                    <InputField label="Opening Time" type="time" value={editForm.openHour} onChange={(v: string) => setEditForm({...editForm, openHour: v})} />
                    <InputField label="Closing Time" type="time" value={editForm.closeHour} onChange={(v: string) => setEditForm({...editForm, closeHour: v})} />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 mt-2" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                    <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-xs font-bold rounded-xl transition-all border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Cancel</button>
                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--accent-primary)" }}>
                      {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Save Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <DetailGrid items={[
                    ["Restaurant Name", localUser.restaurantName], ["WhatsApp Number", localUser.phone],
                    ["Operational Address", localUser.address], ["Working Hours", `${localUser.operationalHours?.open || "08:00"} - ${localUser.operationalHours?.close || "22:00"}`]
                  ]} />
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-[11px] font-bold border px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                      <Edit3 size={14} /> Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Installed Sensors List" icon={Database}>
              {detailSensors.length === 0 ? (<EmptyState text="No sensors allocated yet." />) : (
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--table-border)" }}>
                  <table className="min-w-full text-left text-sm" style={{ backgroundColor: "var(--table-body-bg)" }}>
                    <thead className="text-[10px] font-bold uppercase" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-faint)" }}>
                      <tr><th className="px-4 py-3">Sensor ID</th><th className="px-4 py-3">Location</th></tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--table-border)" }}>
                      {detailSensors.map(s => (
                        <tr key={s.id}><td className="px-4 py-3 font-bold" style={{ color: "var(--card-title)" }}>{s.id}</td><td className="px-4 py-3" style={{ color: "var(--card-text)" }}>{s.location || "-"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Package & Billing Status" icon={CreditCard}>
              {isChangingPackage ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <SelectField label="Change Package" value={packageForm.plan} onChange={(v: string) => setPackageForm({...packageForm, plan: v})} options={packages.map(p => ({label: p.name, value: p.id}))} />
                    <InputField label="Manual Extend (Days)" type="number" value={packageForm.extendDays.toString()} onChange={(v: string) => setPackageForm({...packageForm, extendDays: parseInt(v)||0})} />
                    <div className="md:col-span-2">
                      <SelectField label="Payment Status" value={packageForm.paymentStatus} onChange={(v: string) => setPackageForm({...packageForm, paymentStatus: v as "paid" | "pending"})} options={[{label: "Paid", value: "paid"}, {label: "Pending", value: "pending"}]} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 mt-2" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                    <button onClick={() => setIsChangingPackage(false)} className="px-4 py-2 text-xs font-bold rounded-xl transition-all border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Cancel</button>
                    <button onClick={savePackage} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border rounded-xl transition-all disabled:opacity-50 cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}>
                      {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Apply Package
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border shadow-inner" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Current Package</p>
                      <p className="text-xl font-black mt-1" style={{ color: "var(--card-title)" }}>{packages.find(p => p.id === localUser.plan)?.name || localUser.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--card-text-faint)" }}>Expires On</p>
                      <p className="text-sm font-bold mt-1" style={{ color: "var(--card-title)" }}>{formatDate(localUser.planExpiry)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setIsChangingPackage(true)} className="flex items-center gap-2 text-[11px] font-bold border px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)", color: "var(--accent-primary)" }}>
                      <CreditCard size={14} /> Change Package / Extend
                    </button>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Transaction Log History" icon={Clock3}>
              {subscriptionHistory.length === 0 ? (<EmptyState text="No transaction history yet." />) : (
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {subscriptionHistory.map((log) => (
                    <div key={log.id} className="rounded-xl border p-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--card-title)" }}>{log.packageName}</p>
                        <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--card-text-muted)" }}>{formatDate(log.startDate)} - {formatDate(log.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${log.paymentStatus === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                          {log.paymentStatus}
                        </span>
                        <p className="mt-2 text-xs font-black" style={{ color: "var(--card-title)" }}>Rp {log.amount.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// 5. UI MICRO-COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "rose" | "amber";
  note: string;
}

function StatCard({ title, value, icon: Icon, tone, note }: StatCardProps) {
  const tones: Record<string, string> = { 
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400", 
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", 
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400", 
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" 
  };
  return (
    <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--card-text-faint)" }}>{title}</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "var(--card-title)" }}>{value}</p>
          <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--card-text-muted)" }}>{note}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={18} /></div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer`}
      style={{
        backgroundColor: active ? "var(--accent-primary)" : "var(--card-surface)",
        borderColor: active ? "var(--accent-primary-border)" : "var(--card-surface-border)",
        color: active ? "white" : "var(--card-text)"
      }}
    >
      {label}
    </button>
  );
}

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  widthClass?: string;
}

function Modal({ children, onClose, widthClass = "max-w-md" }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className={`w-full ${widthClass} rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar`} style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", borderWidth: 1 }}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full transition-colors border-none cursor-pointer hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text-muted)" }}><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}

function InputField({ label, value, onChange, type = "text" }: InputFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--card-text-faint)" }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border px-4 text-xs font-bold outline-none focus:ring-2 transition-all" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties} />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--card-text-faint)" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border px-4 text-xs font-bold outline-none focus:ring-2 transition-all cursor-pointer" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

interface PanelProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Panel({ title, icon: Icon, children }: PanelProps) {
  return (
    <section className="rounded-2xl border p-5 shadow-inner" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="p-1.5 border rounded-lg shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}><Icon size={16} style={{ color: "var(--accent-primary)" }} /></div>
        <h4 className="font-extrabold text-sm tracking-wide" style={{ color: "var(--card-title)" }}>{title}</h4>
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ items }: { items: [string, string | null | undefined][] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border p-3.5 shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--card-text-faint)" }}>{label}</p>
          <p className="mt-1.5 text-xs font-bold wrap-break-word" style={{ color: "var(--card-title)" }}>{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed px-4 py-8 text-center text-xs font-medium shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" }}>{text}</div>;
}