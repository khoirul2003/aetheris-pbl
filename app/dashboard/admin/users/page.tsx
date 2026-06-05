"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
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

const DEFAULT_PACKAGE = "Basic";

function formatDate(value?: Timestamp | Date | string | null) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return value.toDate().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: Timestamp | Date | string | null) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return value.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return value.toDate().toLocaleString("en-US", {
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
  if (!plan) return "Not Active";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function packagePrice(plan: string | undefined, packages: SubscriptionPackage[]) {
  const matched = packages.find((pkg) => pkg.id === plan);
  return matched?.price ?? 0;
}

function packageBadgeClass(plan?: string) {
  // Case insensitive check
  const normalizedPlan = plan?.toLowerCase();
  if (!normalizedPlan || normalizedPlan === "basic") return "bg-slate-100 text-slate-700";
  if (normalizedPlan === "pro") return "bg-blue-50 text-blue-700";
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
  if (status === "danger") return "Danger";
  if (status === "warning") return "Warning";
  return "Safe";
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
          message: data.message || "Anomaly detected",
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
      
      // PERBAIKAN: Gunakan toLowerCase() agar filter kebal terhadap perbedaan Case (huruf besar/kecil)
      const matchesPackage = 
        packageFilter === "" || 
        user.plan?.toLowerCase() === packageFilter.toLowerCase();
        
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
    <AdminLayout
      title="User Management"
      description="Manage all registered user accounts in the system."
    >
      <div className="flex w-full flex-col gap-6">

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Restaurants" value={summary.total.toString()} icon={UserRound} tone="blue" note="All user accounts" />
            <StatCard title="Active Accounts" value={summary.active.toString()} icon={CircleCheck} tone="emerald" note="Currently operational" />
            <StatCard title="Inactive Accounts" value={summary.inactive.toString()} icon={CircleOff} tone="rose" note="Needs action" />
            <StatCard title="Total Sensors" value={summary.totalSensors.toString()} icon={Database} tone="amber" note="Registered sensors" />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Filter & Search</h2>
                <p className="mt-1 text-sm text-slate-500">Filter by active package and account status.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Packages</option>
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
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip label="All" active={packageFilter === "" && statusFilter === ""} onClick={() => { setPackageFilter(""); setStatusFilter(""); }} />
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
                    <th className="px-6 py-4">Restaurant Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Active Package</th>
                    <th className="px-6 py-4">Sensor Count</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4">Registration Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Loading user data...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">No users match the filters.</td>
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
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {/* DITAMBAHKAN whitespace-nowrap AGAR TEKS TIDAK MENUMPUK */}
                              <button onClick={() => openDetail(user)} className="inline-flex items-center gap-2 bg-[#EAF2EB] text-[#4D6344] font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#C2D1C0] transition-colors cursor-pointer whitespace-nowrap">
                                <Eye size={14} />
                                View Details
                              </button>
                              
                              <button onClick={() => toggleUserActive(user)} className={`inline-flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer whitespace-nowrap ${active ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
                                {active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                {active ? "Deactivate" : "Activate"}
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

      {selectedUser && (
        <Modal onClose={() => setSelectedUser(null)} widthClass="max-w-6xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User Details</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{selectedUser.restaurantName}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditProfileOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Edit3 size={15} />
                  Edit Profile
                </button>
                <button onClick={() => setChangePackageOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                  <CreditCard size={15} />
                  Change Package
                </button>
                <button onClick={deactivateSelectedUser} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <Shield size={15} />
                  Deactivate Account
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-sm text-slate-500">Loading user details...</div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <Panel title="Restaurant Profile Information" icon={UserRound}>
                    <DetailGrid items={[
                      ["Restaurant Name", selectedUser.restaurantName],
                      ["Email", selectedUser.email],
                      ["Phone Number", selectedUser.phone],
                      ["Address", selectedUser.address],
                      ["Operational Hours", `${selectedUser.operationalHours?.open || "08:00"} - ${selectedUser.operationalHours?.close || "22:00"}`],
                    ]} />
                  </Panel>

                  <Panel title="Subscription Status" icon={CreditCard}>
                    <DetailGrid items={[
                      ["Active Package", activePackageLabel],
                      ["Start Date", formatDate(subscriptionHistory[0]?.startDate || selectedUser.createdAt || null)],
                      ["End Date", formatDate(selectedUser.planExpiry || subscriptionHistory[0]?.endDate || null)],
                      ["Payment Status", subscriptionHistory[0]?.paymentStatus ? paymentLabel(subscriptionHistory[0].paymentStatus) : "-"],
                    ]} />
                  </Panel>

                  <Panel title="Restaurant Sensor List" icon={Database}>
                    {detailSensors.length === 0 ? (
                      <EmptyState text="No registered sensors yet." />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full text-left">
                          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Sensor</th>
                              <th className="px-4 py-3">Location</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Condition</th>
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

                  <Panel title="Recent 10 Alerts History" icon={AlertTriangle}>
                    {detailAlerts.length === 0 ? (
                      <EmptyState text="No alerts for this restaurant yet." />
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
                                {alert.level === "danger" ? "Danger" : "Warning"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <span>{formatDateTime(alert.createdAt)}</span>
                              <span>{alert.isResolved ? "Resolved" : "Pending"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>

                <div className="space-y-5">
                  <Panel title="Previous Subscription History" icon={Clock3}>
                    {subscriptionHistory.length === 0 ? (
                      <EmptyState text="No subscription history yet." />
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
                            <p className="mt-3 text-sm text-slate-600">Rp {log.amount.toLocaleString("en-US")}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  <Panel title="Quick Status" icon={BadgeCheck}>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Account Status</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedUser.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {selectedUser.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Active Package</span>
                        <span className="font-semibold text-slate-900">{activePackageLabel}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-slate-500">Package Value</span>
                        <span className="font-semibold text-slate-900">Rp {activePackagePrice.toLocaleString("en-US")}</span>
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
          <ModalFormTitle title="Add New User" description="Create a new restaurant profile and initialize its active package." />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Restaurant Name" value={newUserForm.restaurantName} onChange={(value) => setNewUserForm((prev) => ({ ...prev, restaurantName: value }))} />
            <InputField label="Email" value={newUserForm.email} onChange={(value) => setNewUserForm((prev) => ({ ...prev, email: value }))} />
            <InputField label="Phone Number" value={newUserForm.phone} onChange={(value) => setNewUserForm((prev) => ({ ...prev, phone: value }))} />
            <InputField label="Address" value={newUserForm.address} onChange={(value) => setNewUserForm((prev) => ({ ...prev, address: value }))} />
            <InputField label="Opening Time" value={newUserForm.openHour} onChange={(value) => setNewUserForm((prev) => ({ ...prev, openHour: value }))} />
            <InputField label="Closing Time" value={newUserForm.closeHour} onChange={(value) => setNewUserForm((prev) => ({ ...prev, closeHour: value }))} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Initial Package"
              value={newUserForm.plan}
              onChange={(value) => setNewUserForm((prev) => ({ ...prev, plan: value }))}
              options={packages.map((pkg) => ({ label: pkg.name, value: pkg.id }))}
              fallbackOption={{ label: "Basic", value: DEFAULT_PACKAGE }}
            />
            <SelectField
              label="Account Status"
              value={newUserForm.isActive ? "active" : "inactive"}
              onChange={(value) => setNewUserForm((prev) => ({ ...prev, isActive: value === "active" }))}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setNewUserOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={savingAction} onClick={createUser} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Save User</button>
          </div>
        </Modal>
      )}

      {selectedUser && editProfileOpen && (
        <Modal onClose={() => setEditProfileOpen(false)} widthClass="max-w-3xl">
          <ModalFormTitle title="Edit Restaurant Profile" description="Update name, contact, address, and operational hours." />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Restaurant Name" value={editForm.restaurantName} onChange={(value) => setEditForm((prev) => ({ ...prev, restaurantName: value }))} />
            <InputField label="Email" value={editForm.email} onChange={(value) => setEditForm((prev) => ({ ...prev, email: value }))} />
            <InputField label="Phone Number" value={editForm.phone} onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))} />
            <InputField label="Address" value={editForm.address} onChange={(value) => setEditForm((prev) => ({ ...prev, address: value }))} />
            <InputField label="Opening Time" value={editForm.openHour} onChange={(value) => setEditForm((prev) => ({ ...prev, openHour: value }))} />
            <InputField label="Closing Time" value={editForm.closeHour} onChange={(value) => setEditForm((prev) => ({ ...prev, closeHour: value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditProfileOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={savingAction} onClick={saveProfile} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Save Changes</button>
          </div>
        </Modal>
      )}

      {selectedUser && changePackageOpen && (
        <Modal onClose={() => setChangePackageOpen(false)} widthClass="max-w-xl">
          <ModalFormTitle title="Change Package" description="Update the active package and record a new subscription history." />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="New Package"
              value={packageForm.plan}
              onChange={(value) => setPackageForm((prev) => ({ ...prev, plan: value }))}
              options={packages.map((pkg) => ({ label: pkg.name, value: pkg.id }))}
              fallbackOption={{ label: "Basic", value: DEFAULT_PACKAGE }}
            />
            <SelectField
              label="Payment Status"
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
            <button onClick={() => setChangePackageOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={savingAction} onClick={savePackage} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">Save Package</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
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
  const hasDuplicate = fallbackOption 
    ? options.some((opt) => opt.value === fallbackOption.value) 
    : false;

  const list = fallbackOption && !hasDuplicate 
    ? [fallbackOption, ...options] 
    : options;

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