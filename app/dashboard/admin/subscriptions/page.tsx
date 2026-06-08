/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import {
  ClientSubscriptionModel,
  SubscriptionPackage,
} from "@/models/clientSubscriptionModel";
import {
  Layers,
  Edit,
  Plus,
  Check,
  X,
  DollarSign,
  Zap,
  Percent,
  Trash2,
  AlertCircle,
  CreditCard,
  Filter,
  Calendar,
} from "lucide-react";
import { doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Tipe untuk Log Langganan User (Disesuaikan dari branch-baihaqi)
interface UserSubscriptionLog {
  id: string;
  restaurantName: string;
  packageName: string;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  amount: number;
  paymentStatus: "paid" | "pending" | "expired";
}

// Tipe ekstensi untuk paket yang memiliki properti discount
type ExtendedPackage = SubscriptionPackage & { discount?: number };

// Helper function to calculate final price with discount
function getPackageFinalPrice(pkg: SubscriptionPackage | undefined) {
  if (!pkg) return 0;
  const extendedPkg = pkg as ExtendedPackage;
  const discountPercent = extendedPkg.discount || 0;
  return pkg.price - (pkg.price * discountPercent / 100);
}

export default function AdminSubscriptionsManagementPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subLogs, setSubLogs] = useState<UserSubscriptionLog[]>([]); // State tambahan dari branch-baihaqi
  const [logFilter, setLogFilter] = useState<string>("ALL");

  const [editingPack, setEditingPack] = useState<SubscriptionPackage | null>(null);
  const [packPrice, setPackPrice] = useState<number | string>("");
  const [packDiscount, setPackDiscount] = useState<number | string>("");
  const [packMaxSensors, setPackMaxSensors] = useState<number | string>("");
  const [packHistoryDurationDays, setPackHistoryDurationDays] = useState<number | string>("");

  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newPackage, setNewPackage] = useState<{
    name: string;
    price: number | string;
    discount: number | string;
    maxSensors: number | string;
    historyDurationDays: number | string;
    features: string;
  }>({
    name: "",
    price: "",
    discount: "",
    maxSensors: "",
    historyDurationDays: "",
    features: "",
  });

  useEffect(() => {
    const unsubPacks = ClientSubscriptionModel.subscribeToPackages((data) => setPackages(data));
    
    // Fallback atau inisialisasi untuk subLogs jika model menyediakannya
    // Jika ada real-time subscription untuk logs, pasang di sini.
    
    return () => { unsubPacks(); };
  }, []);

  const handleUpdatePackage = async () => {
    if (!editingPack) return;
    try {
      await ClientSubscriptionModel.savePackage(editingPack.id, {
        price: Number(packPrice) || 0,
        discount: Number(packDiscount) || 0,
        maxSensors: Number(packMaxSensors) || 0,
        historyDurationDays: Number(packHistoryDurationDays) || 0,
      } as any);
      alert(`Commercial specs for ${editingPack.name} successfully updated!`);
      setEditingPack(null);
    } catch (err) { console.error(err); }
  };

  const handleDeletePackage = async (pkg: SubscriptionPackage) => {
    if (confirm(`WARNING: Are you sure you want to PERMANENTLY DELETE the "${pkg.name}" tier package?\n\nThis action cannot be undone!`)) {
      try {
        interface ModelWithDelete {
          deletePackage?: (id: string) => Promise<void>;
        }
        
        const model = ClientSubscriptionModel as ModelWithDelete;
        
        if (typeof model.deletePackage === 'function') {
          await model.deletePackage(pkg.id);
        } else {
          await deleteDoc(doc(db, "packages", pkg.id));
        }
        alert(`Package "${pkg.name}" successfully deleted.`);
      } catch (err) {
        console.error(err);
        alert("Failed to delete package.");
      }
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.name.trim()) { alert("Package Tier Name must be filled!"); return; }
    
    try {
      const generatedId = newPackage.name.trim().toLowerCase().replace(/\s+/g, '-');
      const featuresArray = newPackage.features.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
      
      const payload = {
        name: newPackage.name.trim().toUpperCase(), 
        price: Number(newPackage.price) || 0, 
        maxSensors: Number(newPackage.maxSensors) || 0,
        historyDurationDays: Number(newPackage.historyDurationDays) || 0, 
        features: featuresArray, 
        isActive: true,
      } as Partial<SubscriptionPackage> & { discount?: number };

      await ClientSubscriptionModel.savePackage(generatedId, payload);
      
      alert(`New tier package "${newPackage.name.toUpperCase()}" successfully registered!`);
      setShowAddForm(false);
      setNewPackage({ name: "", price: "", discount: "", maxSensors: "", historyDurationDays: "", features: "" });
    } catch (err) {
      console.error(err); alert("Failed to add new package tier.");
    }
  };

  const handleTogglePackActive = async (pkg: SubscriptionPackage) => {
    await ClientSubscriptionModel.savePackage(pkg.id, { isActive: !pkg.isActive });
  };

  const handleManualExtend = async (log: UserSubscriptionLog) => {
    if (confirm(`Are you sure you want to manually extend the active period of the package for ${log.restaurantName} by 30 days?`)) {
      const currentEnd = log.endDate ? log.endDate.toDate() : new Date();
      currentEnd.setDate(currentEnd.getDate() + 30);
      await ClientSubscriptionModel.updateUserSubscription(log.id, { endDate: Timestamp.fromDate(currentEnd), paymentStatus: "paid" });
      alert("User package validity period successfully extended!");
    }
  };

  const handleGiveDiscount = async (log: UserSubscriptionLog) => {
    const discountInput = prompt(`Enter discount percentage (0-100) for ${log.restaurantName}:\nCurrent Bill: Rp ${log.amount.toLocaleString("en-US")}`, "0");
    if (!discountInput) return;

    const discountPercent = Number(discountInput);
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      alert("Invalid discount. Please enter a valid percentage between 0 and 100.");
      return;
    }

    const discountAmount = log.amount * (discountPercent / 100);
    const newAmount = log.amount - discountAmount;

    if (confirm(`Apply ${discountPercent}% discount?\nThe new billing amount will be Rp ${newAmount.toLocaleString("en-US")}.`)) {
      try {
        await (ClientSubscriptionModel as any).updateUserSubscription(log.id, { amount: newAmount });
        alert(`Discount successfully applied! New bill is Rp ${newAmount.toLocaleString("en-US")}.`);
      } catch (err) {
        console.error(err);
        alert("Failed to apply discount. Please try again.");
      }
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
    <AdminLayout title="Package & Billing Management" description="Manage subscription packages, limits, and pricing structures.">
      <div className="space-y-8">
          {expiringLogs.length > 0 && (
            <div className="p-4 rounded-2xl flex items-start gap-3.5 text-xs font-semibold shadow-sm" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", borderWidth: 1, color: "var(--card-title)" }}>
              <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0"><AlertCircle size={18} /></div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-700 dark:text-amber-500">User Subscription Expiry Warning</p>
                <p style={{ color: "var(--card-text)" }}>There are <span className="text-amber-700 dark:text-amber-500 font-bold">{expiringLogs.length} restaurant partners</span> whose feature license will expire in less than 7 days.</p>
              </div>
            </div>
          )}

          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--card-title)" }}>
                  <Layers size={20} style={{ color: "var(--accent-primary)" }} /> Partnership Package Configuration
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--card-text-muted)" }}>Manage feature limits, automated sensor quotas, and platform commercial pricing schemes.</p>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="text-white px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus size={14} /> Add New Tier
              </button>
            </div>

            {showAddForm && (
              <div className="p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                <div className="md:col-span-3 pb-2 flex justify-between items-center" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}><Zap size={14} /></div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>New Subscription Tier Registration Form</span>
                  </div>
                  <button type="button" onClick={() => setShowAddForm(false)} className="cursor-pointer p-1 rounded-lg hover:opacity-80 border-none bg-transparent" style={{ color: "var(--card-text-muted)" }}><X size={16} /></button>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Package Tier Name</label>
                  <input
                    type="text" required placeholder="e.g. Enterprise" value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    className="border focus:ring-2 px-4 py-2.5 rounded-xl text-xs w-full font-bold outline-none transition-all shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Normal Price (IDR)</label>
                  <div className="relative flex items-center">
                    <DollarSign size={12} className="absolute left-3" style={{ color: "var(--card-text-muted)" }} />
                    <input
                      type="number" required placeholder="0" value={newPackage.price}
                      onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="border focus:ring-2 pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-mono outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Discount Percentage (%)</label>
                  <div className="relative flex items-center">
                    <Percent size={12} className="absolute left-3 text-rose-500" />
                    <input
                      type