"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { ClientProfileModel, type UserProfile } from "@/models/clientProfileModel";
import {
  ClientSensorModel,
  type FirestoreSensor,
  type LiveSensorData,
} from "@/models/clientSensorModel";
import {
  ClientSubscriptionModel,
  type SubscriptionPackage,
  type UserSubscriptionLog,
} from "@/models/clientSubscriptionModel";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import {
  AlertTriangle,
  BadgeCheck,
  CircleCheck,
  CircleOff,
  Clock3,
  CreditCard,
  Database,
  Edit3,
  Eye,
  Plus,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserRound,
  X,
} from "lucide-react";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  restaurantName: string;
  phone: string;
  address: string;
  operationalHours?: {
    open?: string;
    close?: string;
  };
  plan?: string;
  planExpiry?: Timestamp | null;
  isActive?: boolean;
  role?: string;
  createdAt?: Timestamp | Date | null;
};

type UserDetailAlert = {
  id: string;
  message: string;
  level: "warning" | "danger";
  createdAt: Timestamp | null;
  isResolved: boolean;
  sensorName?: string;
  location?: string;
};

type DetailSensorRow = FirestoreSensor & {
  live?: LiveSensorData;
};

const DEFAULT_PACKAGE = "basic";

function formatDate(value?: Timestamp | Date | string | null) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return value.toDate().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: Timestamp | Date | string | null) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return value.toDate().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function packageLabel(plan: string | undefined, packages: SubscriptionPackage[]) {
  const matched = packages.find((pkg) => pkg.id === plan);
  if (matched) return matched.name;
  if (!plan) return "Belum Aktif";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function packagePrice(plan: string | undefined, packages: SubscriptionPackage[]) {
  const matched = packages.find((pkg) => pkg.id === plan);
  return matched?.price ?? 0;
}

function packageBadgeClass(plan?: string) {
  if (!plan || plan === DEFAULT_PACKAGE) return "bg-slate-100 text-slate-700";
  if (plan === "pro") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
}

function paymentLabel(status: UserSubscriptionLog["paymentStatus"]) {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  return "Expired";
}

function paymentBadgeClass(status: UserSubscriptionLog["paymentStatus"]) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function conditionLabel(status?: string) {
  if (status === "danger") return "Bahaya";
  if (status === "warning") return "Waspada";
  return "Aman";
}

function conditionBadgeClass(status?: string) {
  if (status === "danger") return "bg-rose-50 text-rose-700";
  if (status === "warning") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [sensorCounts, setSensorCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [detailSensors, setDetailSensors] = useState<DetailSensorRow[]>([]);
  const [detailAlerts, setDetailAlerts] = useState<UserDetailAlert[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscriptionLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePackageOpen, setChangePackageOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [liveBySensor, setLiveBySensor] = useState<Record<string, LiveSensorData>>({});

  const [newUserForm, setNewUserForm] = useState({
    restaurantName: "",
    email: "",
    phone: "",
    address: "",
    openHour: "08:00",
    closeHour: "22:00",
    plan: DEFAULT_PACKAGE,
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    restaurantName: "",
    email: "",
    phone: "",
    address: "",
    openHour: "08:00",
    closeHour: "22:00",
  });

  const [packageForm, setPackageForm] = useState({
    plan: DEFAULT_PACKAGE,
    paymentStatus: "paid" as UserSubscriptionLog["paymentStatus"],
  });

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const rows: AdminUserRow[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile & {
          role?: string;
          createdAt?: Timestamp | Date | null;
        };

        if ((data.role ?? "user") !== "user") return;

        rows.push({
          id: docSnap.id,
          name: data.name || data.restaurantName || "-",
          email: data.email || "-",
          restaurantName: data.restaurantName || data.name || "-",
          phone: data.phone || "-",
          address: data.address || "-",
          operationalHours: data.operationalHours,
          plan: data.plan || DEFAULT_PACKAGE,
          planExpiry: data.planExpiry || null,
          isActive: data.isActive ?? true,
          role: data.role,
          createdAt: data.createdAt || null,
        });
      });
      rows.sort((a, b) => (a.restaurantName || a.name).localeCompare(b.restaurantName || b.name));
      setUsers(rows);
      setLoadingUsers(false);
    });

    const unsubscribePackages = ClientSubscriptionModel.subscribeToPackages((data) => {
      setPackages(data);
    });

    const unsubscribeSensors = onSnapshot(collection(db, "sensors"), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as { userId?: string };
        if (!data.userId) return;
        counts[data.userId] = (counts[data.userId] || 0) + 1;
      });
      setSensorCounts(counts);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePackages();
      unsubscribeSensors();
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    setLoadingDetail(true);
    setDetailSensors([]);
    setDetailAlerts([]);
    setSubscriptionHistory([]);
    setLiveBySensor({});

    const sensorQuery = query(collection(db, "sensors"), where("userId", "==", selectedUser.id));
    const alertQuery = query(collection(db, "alerts"), where("userId", "==", selectedUser.id));
    const subscriptionQuery = query(collection(db, "userSubscriptions"), where("userId", "==", selectedUser.id));

    const liveUnsubscribers: Array<() => void> = [];

    const unsubscribeSensors = onSnapshot(
      sensorQuery,
      (snapshot) => {
        const sensorRows: DetailSensorRow[] = [];
        snapshot.forEach((docSnap) => {
          sensorRows.push({ ...(docSnap.data() as FirestoreSensor), id: docSnap.id });
        });

        sensorRows.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        setDetailSensors(sensorRows);

        liveUnsubscribers.forEach((unsub) => unsub());
        liveUnsubscribers.length = 0;

        sensorRows.forEach((sensor) => {
          liveUnsubscribers.push(
            ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
              setLiveBySensor((prev) => ({
                ...prev,
                [sensor.id]: data,
              }));
            }),
          );
        });

        setLoadingDetail(false);
      },
      () => setLoadingDetail(false),
    );

    const unsubscribeAlerts = onSnapshot(alertQuery, (snapshot) => {
      const rows: UserDetailAlert[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as {
          message?: string;
          level?: "warning" | "danger";
          createdAt?: Timestamp | null;
          isResolved?: boolean;
          sensorName?: string;
          location?: string;
        };

        rows.push({
          id: docSnap.id,
          message: data.message || "Anomali terdeteksi",
          level: data.level || "warning",
          createdAt: data.createdAt || null,
          isResolved: !!data.isResolved,
          sensorName: data.sensorName,
          location: data.location,
        });
      });
      rows.sort((a, b) => (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0));
      setDetailAlerts(rows.slice(0, 10));
    });

    const unsubscribeSubscriptions = onSnapshot(subscriptionQuery, (snapshot) => {
      const rows: UserSubscriptionLog[] = [];
      snapshot.forEach((docSnap) => {
        rows.push({ ...(docSnap.data() as UserSubscriptionLog), id: docSnap.id });
      });
      rows.sort((a, b) => (b.startDate?.toDate?.().getTime() || 0) - (a.startDate?.toDate?.().getTime() || 0));
      setSubscriptionHistory(rows);
    });

    return () => {
      unsubscribeSensors();
      unsubscribeAlerts();
      unsubscribeSubscriptions();
      liveUnsubscribers.forEach((unsub) => unsub());
    };
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch === "" ||
        user.restaurantName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesPackage = packageFilter === "" || user.plan === packageFilter;
      const matchesStatus =
        statusFilter === "" ||
        (statusFilter === "active" ? user.isActive !== false : user.isActive === false);

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [users, search, packageFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive !== false).length;
    const inactive = total - active;
    const totalSensors = Object.values(sensorCounts).reduce((acc, value) => acc + value, 0);
    return { total, active, inactive, totalSensors };
  }, [users, sensorCounts]);

  const activePackageLabel = selectedUser ? packageLabel(selectedUser.plan, packages) : "-";
  const activePackagePrice = selectedUser ? packagePrice(selectedUser.plan, packages) : 0;

  const openDetail = (user: AdminUserRow) => {
    setSelectedUser(user);
    setEditForm({
      restaurantName: user.restaurantName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      openHour: user.operationalHours?.open || "08:00",
      closeHour: user.operationalHours?.close || "22:00",
    });
    setPackageForm({
      plan: (user.plan || DEFAULT_PACKAGE) as string,
      paymentStatus: "paid",
    });
  };

  const toggleUserActive = async (user: AdminUserRow) => {
    setSavingAction(true);
    try {
      const nextActive = !(user.isActive ?? true);
      await updateDoc(doc(db, "users", user.id), {
        isActive: nextActive,
      });
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, isActive: nextActive });
      }
    } finally {
      setSavingAction(false);
    }
  };

  const saveProfile = async () => {
    if (!selectedUser) return;
    setSavingAction(true);
    try {
      await ClientProfileModel.updateSettings(selectedUser.id, {
        name: editForm.restaurantName,
        restaurantName: editForm.restaurantName,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        operationalHours: {
          open: editForm.openHour,
          close: editForm.closeHour,
        },
      });
      setEditProfileOpen(false);
    } finally {
      setSavingAction(false);
    }
  };

  const savePackage = async () => {
    if (!selectedUser) return;
    setSavingAction(true);
    try {
      const selectedPackage = packages.find((pkg) => pkg.id === packageForm.plan);
      const now = new Date();
      const endDate = addDays(now, selectedPackage?.historyDurationDays || 30);

      await updateDoc(doc(db, "users", selectedUser.id), {
        plan: packageForm.plan,
        planExpiry: endDate,
      });

      await addDoc(collection(db, "userSubscriptions"), {
        userId: selectedUser.id,
        restaurantName: selectedUser.restaurantName,
        packageName: selectedPackage?.name || packageForm.plan,
        startDate: now,
        endDate,
        paymentStatus: packageForm.paymentStatus,
        amount: selectedPackage?.price || 0,
      });

      setChangePackageOpen(false);
    } finally {
      setSavingAction(false);
    }
  };

  const createUser = async () => {
    setSavingAction(true);
    try {
      const newRef = doc(collection(db, "users"));
      const now = new Date();
      const endDate = addDays(now, 30);

      await setDoc(newRef, {
        name: newUserForm.restaurantName,
        restaurantName: newUserForm.restaurantName,
        email: newUserForm.email,
        phone: newUserForm.phone,
        address: newUserForm.address,
        operationalHours: {
          open: newUserForm.openHour,
          close: newUserForm.closeHour,
        },
        plan: newUserForm.plan,
        planExpiry: endDate,
        role: "user",
        isActive: newUserForm.isActive,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "userSubscriptions"), {
        userId: newRef.id,
        restaurantName: newUserForm.restaurantName,
        packageName: packageLabel(newUserForm.plan, packages),
        startDate: now,
        endDate,
        paymentStatus: "pending",
        amount: packagePrice(newUserForm.plan, packages),
      });

      setNewUserOpen(false);
      setNewUserForm({
        restaurantName: "",
        email: "",
        phone: "",
        address: "",
        openHour: "08:00",
        closeHour: "22:00",
        plan: DEFAULT_PACKAGE,
        isActive: true,
      });
    } finally {
      setSavingAction(false);
    }
  };

  const deactivateSelectedUser = async () => {
    if (!selectedUser || selectedUser.isActive === false) return;
    await toggleUserActive(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar role="admin" />

      <main className="ml-0 min-h-screen px-4 py-4 md:ml-64 md:px-6 md:py-6">
        <div className="flex w-full flex-col gap-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Manajemen User</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Daftar Restoran Terdaftar</h1>
                <p className="mt-1 text-sm text-slate-500">Kelola data restoran, paket aktif, sensor, dan status akun dari Firestore.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama restoran atau email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  onClick={() => setNewUserOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Tambah User Baru
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Restoran" value={summary.total.toString()} icon={UserRound} tone="blue" note="Semua akun user" />
            <StatCard title="Akun Aktif" value={summary.active.toString()} icon={CircleCheck} tone="emerald" note="Sedang operasional" />
            <StatCard title="Akun Nonaktif" value={summary.inactive.toString()} icon={CircleOff} tone="rose" note="Perlu tindakan" />
            <StatCard title="Total Sensor" value={summary.totalSensors.toString()} icon={Database} tone="amber" note="Sensor terdaftar" />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Filter & Pencarian</h2>
                <p className="mt-1 text-sm text-slate-500">Saring berdasarkan paket aktif dan status akun.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Semua Paket</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                  {!packages.length && <option value={DEFAULT_PACKAGE}>Basic</option>}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "inactive")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip label="Semua" active={packageFilter === "" && statusFilter === ""} onClick={() => { setPackageFilter(""); setStatusFilter(""); }} />
              {packages.map((pkg) => (
                <FilterChip key={pkg.id} label={pkg.name} active={packageFilter === pkg.id} onClick={() => setPackageFilter((prev) => (prev === pkg.id ? "" : pkg.id))} />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Nama Restoran</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Paket Aktif</th>
                    <th className="px-6 py-4">Jumlah Sensor</th>
                    <th className="px-6 py-4">Status Akun</th>
                    <th className="px-6 py-4">Tanggal Daftar</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Memuat data user...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Tidak ada user yang cocok dengan filter.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const active = user.isActive !== false;
                      const sensorCount = sensorCounts[user.id] || 0;
                      const activePackage = packageLabel(user.plan, packages);

                      return (
                        <tr key={user.id} className="transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{user.restaurantName}</div>
                            <div className="text-xs text-slate-500">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${packageBadgeClass(user.plan)}`}>{activePackage}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">{sensorCount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openDetail(user)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                <Eye size={14} />
                                Lihat Detail
                              </button>
                              <button onClick={() => toggleUserActive(user)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white ${active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                                {active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                {active ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {selectedUser && (
        <Modal onClose={() => setSelectedUser(null)} widthClass="max-w-6xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Detail User</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{selectedUser.restaurantName}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditProfileOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Edit3 size={15} />
                  Edit Profil
                </button>
                <button onClick={() => setChangePackageOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                  <CreditCard size={15} />
                  Ganti Paket
                </button>
                <button onClick={deactivateSelectedUser} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <Shield size={15} />
                  Nonaktifkan Akun
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-sm text-slate-500">Memuat detail user...</div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <Panel title="Informasi Profil Restoran" icon={UserRound}>
                    <DetailGrid items={[
                      ["Nama Restoran", selectedUser.restaurantName],
                      ["Email", selectedUser.email],
                      ["Nomor HP", selectedUser.phone],
                      ["Alamat", selectedUser.address],
                      ["Jam Operasional", `${selectedUser.operationalHours?.open || "08:00"} - ${selectedUser.operationalHours?.close || "22:00"}`],
                    ]} />
                  </Panel>

                  <Panel title="Status Langganan" icon={CreditCard}>
                    <DetailGrid items={[
                      ["Paket Aktif", activePackageLabel],
                      ["Tanggal Mulai", formatDate(subscriptionHistory[0]?.startDate || selectedUser.createdAt || null)],
                      ["Tanggal Berakhir", formatDate(selectedUser.planExpiry || subscriptionHistory[0]?.endDate || null)],
                      ["Status Pembayaran", subscriptionHistory[0]?.paymentStatus ? paymentLabel(subscriptionHistory[0].paymentStatus) : "-"],
                    ]} />
                  </Panel>

                  <Panel title="Daftar Sensor Restoran" icon={Database}>
                    {detailSensors.length === 0 ? (
                      <EmptyState text="Belum ada sensor terdaftar." />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Sensor</th>
                              <th className="px-4 py-3">Lokasi</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Kondisi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {detailSensors.map((sensor) => {
                              const live = liveBySensor[sensor.id];
                              const online = live?.isOnline ?? true;
                              const condition = live?.status || "safe";

                              return (
                                <tr key={sensor.id}>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900">{sensor.name}</div>
                                    <div className="text-xs font-mono text-slate-500">{sensor.id}</div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600">{sensor.location || "-"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                      {online ? "Online" : "Offline"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${conditionBadgeClass(condition)}`}>
                                      {conditionLabel(condition)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>

                  <Panel title="Riwayat Alert 10 Terbaru" icon={AlertTriangle}>
                    {detailAlerts.length === 0 ? (
                      <EmptyState text="Belum ada alert untuk restoran ini." />
                    ) : (
                      <div className="space-y-3">
                        {detailAlerts.map((alert) => (
                          <div key={alert.id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{alert.message}</p>
                                <p className="mt-1 text-sm text-slate-500">{alert.sensorName || alert.location || "Sensor"}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.level === "danger" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                                {alert.level === "danger" ? "Bahaya" : "Waspada"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <span>{formatDateTime(alert.createdAt)}</span>
                              <span>{alert.isResolved ? "Tertangani" : "Proses"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>

                <div className="space-y-5">
                  <Panel title="Riwayat Langganan Sebelumnya" icon={Clock3}>
                    {subscriptionHistory.length === 0 ? (
                      <EmptyState text="Belum ada riwayat langganan." />
                    ) : (
                      <div className="space-y-3">
                        {subscriptionHistory.map((log) => (
                          <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{log.packageName}</p>
                                <p className="mt-1 text-sm text-slate-500">{formatDate(log.startDate)} - {formatDate(log.endDate)}</p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadgeClass(log.paymentStatus)}`}>
                                {paymentLabel(log.paymentStatus)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Rp {log.amount.toLocaleString("id-ID")}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  <Panel title="Status Ringkas" icon={BadgeCheck}>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Status Akun</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedUser.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {selectedUser.isActive !== false ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Paket Aktif</span>
                        <span className="font-semibold text-slate-900">{activePackageLabel}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Nilai Paket</span>
                        <span className="font-semibold text-slate-900">Rp {activePackagePrice.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {newUserOpen && (
        <Modal onClose={() => setNewUserOpen(false)} widthClass="max-w-3xl">
          <ModalFormTitle title="Tambah User Baru" description="Buat profil restoran baru dan inisialisasi paket aktifnya." />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nama Restoran" value={newUserForm.restaurantName} onChange={(value) => setNewUserForm((prev) => ({ ...prev, restaurantName: value }))} />
            <InputField label="Email" value={newUserForm.email} onChange={(value) => setNewUserForm((prev) => ({ ...prev, email: value }))} />
            <InputField label="Nomor HP" value={newUserForm.phone} onChange={(value) => setNewUserForm((prev) => ({ ...prev, phone: value }))} />
            <InputField label="Alamat" value={newUserForm.address} onChange={(value) => setNewUserForm((prev) => ({ ...prev, address: value }))} />
            <InputField label="Jam Buka" value={newUserForm.openHour} onChange={(value) => setNewUserForm((prev) => ({ ...prev, openHour: value }))} />
            <InputField label="Jam Tutup" value={newUserForm.closeHour} onChange={(value) => setNewUserForm((prev) => ({ ...prev, closeHour: value }))} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Paket Awal"
              value={newUserForm.plan}
              onChange={(value) => setNewUserForm((prev) => ({ ...prev, plan: value }))}
              options={packages.map((pkg) => ({ label: pkg.name, value: pkg.id }))}
              fallbackOption={{ label: "Basic", value: DEFAULT_PACKAGE }}
            />
            <SelectField
              label="Status Akun"
              value={newUserForm.isActive ? "active" : "inactive"}
              onChange={(value) => setNewUserForm((prev) => ({ ...prev, isActive: value === "active" }))}
              options={[
                { label: "Aktif", value: "active" },
                { label: "Nonaktif", value: "inactive" },
              ]}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setNewUserOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button disabled={savingAction} onClick={createUser} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Simpan User</button>
          </div>
        </Modal>
      )}

      {selectedUser && editProfileOpen && (
        <Modal onClose={() => setEditProfileOpen(false)} widthClass="max-w-3xl">
          <ModalFormTitle title="Edit Profil Restoran" description="Perbarui nama, kontak, alamat, dan jam operasional." />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nama Restoran" value={editForm.restaurantName} onChange={(value) => setEditForm((prev) => ({ ...prev, restaurantName: value }))} />
            <InputField label="Email" value={editForm.email} onChange={(value) => setEditForm((prev) => ({ ...prev, email: value }))} />
            <InputField label="Nomor HP" value={editForm.phone} onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))} />
            <InputField label="Alamat" value={editForm.address} onChange={(value) => setEditForm((prev) => ({ ...prev, address: value }))} />
            <InputField label="Jam Buka" value={editForm.openHour} onChange={(value) => setEditForm((prev) => ({ ...prev, openHour: value }))} />
            <InputField label="Jam Tutup" value={editForm.closeHour} onChange={(value) => setEditForm((prev) => ({ ...prev, closeHour: value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditProfileOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button disabled={savingAction} onClick={saveProfile} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Simpan Perubahan</button>
          </div>
        </Modal>
      )}

      {selectedUser && changePackageOpen && (
        <Modal onClose={() => setChangePackageOpen(false)} widthClass="max-w-xl">
          <ModalFormTitle title="Ganti Paket" description="Perbarui paket aktif dan catat histori langganan baru." />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Paket Baru"
              value={packageForm.plan}
              onChange={(value) => setPackageForm((prev) => ({ ...prev, plan: value }))}
              options={packages.map((pkg) => ({ label: pkg.name, value: pkg.id }))}
              fallbackOption={{ label: "Basic", value: DEFAULT_PACKAGE }}
            />
            <SelectField
              label="Status Pembayaran"
              value={packageForm.paymentStatus}
              onChange={(value) => setPackageForm((prev) => ({ ...prev, paymentStatus: value as UserSubscriptionLog["paymentStatus"] }))}
              options={[
                { label: "Paid", value: "paid" },
                { label: "Pending", value: "pending" },
                { label: "Expired", value: "expired" },
              ]}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setChangePackageOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button disabled={savingAction} onClick={savePackage} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Simpan Paket</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  note,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "blue" | "emerald" | "rose" | "amber";
  note: string;
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
}

function Modal({
  children,
  onClose,
  widthClass,
}: {
  children: React.ReactNode;
  onClose: () => void;
  widthClass: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className={`w-full ${widthClass} rounded-3xl bg-white p-6 shadow-2xl`}>
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFormTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  fallbackOption,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  fallbackOption?: { label: string; value: string };
}) {
  const list = [...(fallbackOption ? [fallbackOption] : []), ...options];

  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {list.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={16} className="text-slate-600" />
        <h4 className="font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-900">{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
