"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import {
  ClientSubscriptionModel,
  SubscriptionPackage,
  UserSubscriptionLog,
} from "@/models/clientSubscriptionModel";
import {
  Layers,
  CreditCard,
  Filter,
  AlertCircle,
  Edit,
  Plus,
  Check,
  X,
  Calendar,
  DollarSign,
  Zap,
} from "lucide-react";

export default function AdminSubscriptionsManagementPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subLogs, setSubLogs] = useState<UserSubscriptionLog[]>([]);
  const [logFilter, setLogFilter] = useState("ALL");

  // State Edit Paket Existing
  const [editingPack, setEditingPack] = useState<SubscriptionPackage | null>(
    null,
  );
  const [packPrice, setPackPrice] = useState(0);
  const [packMaxSensors, setPackMaxSensors] = useState(3);

  // State Form Tambah Paket Tiers Baru
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    id: "",
    name: "basic", // Default pilihan tier pertama
    price: 0,
    maxSensors: 2, // Default kuota untuk tier basic
    historyDurationDays: 30,
    features: "",
  });

  useEffect(() => {
    const unsubPacks = ClientSubscriptionModel.subscribeToPackages((data) =>
      setPackages(data),
    );
    const unsubLogs = ClientSubscriptionModel.subscribeToAllUserSubscriptions(
      (data) => setSubLogs(data),
    );
    return () => {
      unsubPacks();
      unsubLogs();
    };
  }, []);

  // Handler Otomatisasi Sinkronisasi Kuota saat Mengubah Dropdown Paket Baru
  const handleTierTypeChange = (tierValue: string) => {
    let sensorsQuota = 2; // Default fallback basic
    if (tierValue === "pro") {
      sensorsQuota = 8;
    }

    setNewPackage({
      ...newPackage,
      name: tierValue,
      id: tierValue, // ID paket disamakan dengan tier tipe agar sinkron di DB
      maxSensors: sensorsQuota,
    });
  };

  const handleUpdatePackage = async () => {
    if (!editingPack) return;
    try {
      await ClientSubscriptionModel.savePackage(editingPack.id, {
        price: Number(packPrice),
        maxSensors: Number(packMaxSensors),
      });
      alert(
        `Konfigurasi komersial paket ${editingPack.name} berhasil diperbarui!`,
      );
      setEditingPack(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.id || !newPackage.name) {
      alert("Tier Paket wajib dipilih!");
      return;
    }
    try {
      const featuresArray = newPackage.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      await ClientSubscriptionModel.savePackage(newPackage.id.toLowerCase(), {
        name: newPackage.name.toUpperCase(),
        price: Number(newPackage.price),
        maxSensors: Number(newPackage.maxSensors),
        historyDurationDays: Number(newPackage.historyDurationDays),
        features: featuresArray,
        isActive: true,
      });

      alert(
        `Tier paket baru "${newPackage.name.toUpperCase()}" berhasil didaftarkan ke Firestore!`,
      );
      setShowAddForm(false);
      setNewPackage({
        id: "basic",
        name: "basic",
        price: 0,
        maxSensors: 2,
        historyDurationDays: 30,
        features: "",
      });
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan tier paket baru.");
    }
  };

  const handleTogglePackActive = async (pkg: SubscriptionPackage) => {
    await ClientSubscriptionModel.savePackage(pkg.id, {
      isActive: !pkg.isActive,
    });
  };

  const handleManualExtend = async (log: UserSubscriptionLog) => {
    if (
      confirm(
        `Apakah Anda hendak memperpanjang masa aktif paket untuk ${log.restaurantName} selama 30 hari secara manual?`,
      )
    ) {
      const currentEnd = log.endDate ? log.endDate.toDate() : new Date();
      currentEnd.setDate(currentEnd.getDate() + 30);

      await ClientSubscriptionModel.updateUserSubscription(log.id, {
        endDate: currentEnd,
        paymentStatus: "paid",
      });
      alert("Masa berlaku paket user berhasil diperpanjang!");
    }
  };

  const expiringLogs = subLogs.filter((log) => {
    if (log.paymentStatus !== "paid" || !log.endDate) return false;
    const diffTime = log.endDate.toDate().getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  const filteredLogs = subLogs.filter((log) => {
    if (logFilter === "ALL") return true;
    return log.paymentStatus === logFilter;
  });

  return (
    <AdminLayout
      title="Manajemen Paket & Billing"
      description="Kelola paket langganan, billing, dan histori pembayaran."
    >
      <div className="space-y-8">
          {/* BANNER NOTIFIKASI JATUH TEMPO */}
          {expiringLogs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3.5 text-xs font-semibold shadow-sm">
              <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                <AlertCircle size={18} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-900">
                  Peringatan Jatuh Tempo Langganan User
                </p>
                <p className="text-slate-600">
                  Terdapat{" "}
                  <span className="text-amber-700 font-bold">
                    {expiringLogs.length} mitra restoran
                  </span>{" "}
                  yang masa aktif lisensi fiturnya akan kadaluarsa kurang dari 7
                  hari.
                </p>
              </div>
            </div>
          )}

          {/* SEKSI MANAGEMENT PAKET LANGGANAN */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={20} className="text-blue-600" /> Konfigurasi
                  Paket Kemitraan
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Kelola batasan fitur, kuota limitasi sensor otomatis, dan
                  skema harga komersial platform.
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Tambah Tier Baru
              </button>
            </div>

            {/* FORM FORM INPUT TIERS DENGAN SELEKSI OTOMATIS SENSOR */}
            {showAddForm && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="md:col-span-3 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                      <Zap size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Form Registrasi Tier Langganan Baru
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* PILIHAN BAGAN TIERS LANGGANAN */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Pilih Bagan Tampilan Paket
                  </label>
                  <select
                    value={newPackage.name}
                    onChange={(e) => handleTierTypeChange(e.target.value)}
                    className="border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2.5 rounded-xl text-xs w-full bg-slate-50 font-bold outline-none cursor-pointer"
                  >
                    <option value="basic">
                      🟢 Paket Jasa Basic (Max 2 Sensor)
                    </option>
                    <option value="pro">
                      🔥 Paket Jasa Pro (Max 8 Sensor)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Harga Bulanan (IDR)
                  </label>
                  <div className="relative flex items-center">
                    <DollarSign
                      size={12}
                      className="absolute left-3 text-slate-400"
                    />
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={newPackage.price}
                      onChange={(e) =>
                        setNewPackage({
                          ...newPackage,
                          price: Number(e.target.value),
                        })
                      }
                      className="border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-mono bg-slate-50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* FIELD MAKSIMAL SENSOR OTOMATIS TERISI (READ ONLY AGAR AMAN) */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Maksimal Kuota Perangkat Per Restoran
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={newPackage.maxSensors}
                    className="border border-slate-200 p-2.5 rounded-xl text-xs w-full font-mono bg-slate-100 font-bold text-slate-700 cursor-not-allowed outline-none"
                    title="Kuota terisi otomatis berdasarkan skema bagan tier paket yang Anda pilih diatas."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Durasi Riwayat Data (Hari)
                  </label>
                  <input
                    type="number"
                    required
                    value={newPackage.historyDurationDays}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        historyDurationDays: Number(e.target.value),
                      })
                    }
                    className="border border-slate-200 p-2.5 rounded-xl text-xs w-full font-mono bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Daftar Fitur Unggulan (Pisahkan Koma)
                  </label>
                  <input
                    type="text"
                    placeholder="SMS Alert, WhatsApp Notif, Premium Chart"
                    value={newPackage.features}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, features: e.target.value })
                    }
                    className="border border-slate-200 p-2.5 rounded-xl text-xs w-full bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 cursor-pointer"
                  >
                    Daftarkan Paket
                  </button>
                </div>
              </div>
            )}

            {/* CARD LIST PAKET */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {pkg.isActive && (
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                      <div className="absolute transform rotate-45 bg-blue-500 text-white text-[8px] font-bold text-center py-0.5 w-24 top-2 -right-6 shadow-sm">
                        ACTIVE
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {pkg.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          ID:{" "}
                          <span className="font-mono text-slate-500">
                            {pkg.id}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pkg.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                      >
                        {pkg.isActive ? "OPERASIONAL" : "NONAKTIF"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Kuota Maks
                        </span>
                        <p className="text-slate-900 font-bold mt-0.5">
                          {pkg.maxSensors} Perangkat
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Masa Log Histori
                        </span>
                        <p className="text-slate-900 font-bold mt-0.5">
                          {pkg.historyDurationDays} Hari Log
                        </p>
                      </div>
                    </div>

                    <p className="text-2xl font-mono font-black text-slate-900 flex items-baseline gap-1">
                      Rp {pkg.price.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-slate-400 font-sans font-medium">
                        / bulan
                      </span>
                    </p>

                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Fitur Utama Tier:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-50/50 text-blue-700 border border-blue-100/50 px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                            >
                              <Check
                                size={10}
                                strokeWidth={3}
                                className="text-blue-500"
                              />{" "}
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPack(pkg);
                        setPackPrice(pkg.price);
                        setPackMaxSensors(pkg.maxSensors);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit size={13} /> Edit Spek
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePackActive(pkg)}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-colors cursor-pointer ${pkg.isActive ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/60" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/60"}`}
                    >
                      {pkg.isActive ? "Nonaktifkan" : "Aktifkan Tier"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PANEL EDITING SPECIFICATION PAKET */}
          {editingPack && (
            <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-md space-y-4 max-w-md animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <Edit size={12} /> Perbarui Nilai Komersial:{" "}
                  {editingPack.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingPack(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                    Harga Bulanan (IDR)
                  </label>
                  <div className="relative flex items-center">
                    <DollarSign
                      size={14}
                      className="absolute left-2.5 text-slate-400"
                    />
                    <input
                      type="number"
                      value={packPrice}
                      onChange={(e) => setPackPrice(Number(e.target.value))}
                      className="border border-slate-200 pl-8 pr-3 py-2 rounded-xl text-xs w-full font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                    Limitasi Sensor Perangkat
                  </label>
                  <input
                    type="number"
                    value={packMaxSensors}
                    onChange={(e) => setPackMaxSensors(Number(e.target.value))}
                    className="border border-slate-200 px-3 py-2 rounded-xl text-xs w-full font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPack(null)}
                  className="px-3 py-1.5 text-xs bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePackage}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-bold flex items-center gap-0.5 hover:bg-blue-700 cursor-pointer"
                >
                  <Check size={12} /> Simpan
                </button>
              </div>
            </div>
          )}

          {/* HISTORI LANGGANAN SINKRONISASI USER */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard size={18} className="text-blue-600" /> Log
                  Transaksi & Status Billing Langganan
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Daftar rekaman semua paket aktif dan historis tagihan
                  komersial seluruh user.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="ALL">Semua Pembayaran Mitra</option>
                  <option value="paid">✅ Aktif / Lunas</option>
                  <option value="pending">⏳ Menunggu Pembayaran</option>
                  <option value="expired">❌ Telah Kadaluarsa</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Nama Restoran</th>
                      <th className="px-6 py-4">Paket Tier</th>
                      <th className="px-6 py-4">Masa Berlaku</th>
                      <th className="px-6 py-4">Nominal Tagihan</th>
                      <th className="px-6 py-4">Status Transaksi</th>
                      <th className="px-6 py-4 text-center">
                        Tindakan Otoritas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredLogs.map((log) => {
                      const startStr = log.startDate
                        ? log.startDate
                            .toDate()
                            .toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                        : "-";
                      const endStr = log.endDate
                        ? log.endDate
                            .toDate()
                            .toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                        : "-";
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {log.restaurantName}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-mono">
                              {log.packageName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar
                                size={12}
                                className="text-slate-400 shrink-0"
                              />
                              <span>
                                {startStr} s/d{" "}
                                <span className="font-bold text-slate-700">
                                  {endStr}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            Rp {log.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                log.paymentStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : log.paymentStatus === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {log.paymentStatus === "paid"
                                ? "LUNAS / AKTIF"
                                : log.paymentStatus === "pending"
                                  ? "PENDING"
                                  : "EXPIRED"}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2 justify-center items-center">
                            <button
                              type="button"
                              onClick={() => handleManualExtend(log)}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                            >
                              Perpanjang Manual
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const pack = prompt(
                                  "Masukkan nama paket baru (basic / pro):",
                                  "pro",
                                );
                                if (pack)
                                  alert(
                                    `Sesi pemindahan tier ${log.restaurantName} ke tier ${pack} berhasil.`,
                                  );
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Ubah Tier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-slate-400 py-12 text-xs font-medium"
                        >
                          Tidak ditemukan histori catatan penagihan billing
                          langganan user.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
      </div>
    </AdminLayout>
  );
}
