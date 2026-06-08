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
  Percent,
  Trash2,
} from "lucide-react";
import { doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [subLogs, setSubLogs] = useState<UserSubscriptionLog[]>([]);
  const [logFilter, setLogFilter] = useState("ALL");

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
    const unsubLogs = ClientSubscriptionModel.subscribeToAllUserSubscriptions((data) => setSubLogs(data));
    return () => { unsubPacks(); unsubLogs(); };
  }, []);

  const handleUpdatePackage = async () => {
    if (!editingPack) return;
    try {
      const payload = { 
        price: Number(packPrice) || 0, 
        discount: Number(packDiscount) || 0, 
        maxSensors: Number(packMaxSensors) || 0,
        historyDurationDays: Number(packHistoryDurationDays) || 0 
      } as Partial<SubscriptionPackage> & { discount?: number };

      await ClientSubscriptionModel.savePackage(editingPack.id, payload);
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
        discount: Number(newPackage.discount) || 0,
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
      
      await ClientSubscriptionModel.updateUserSubscription(log.id, { 
        endDate: Timestamp.fromDate(currentEnd), 
        paymentStatus: "paid" 
      });
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
        await ClientSubscriptionModel.updateUserSubscription(log.id, { amount: newAmount });
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
    <AdminLayout title="Package & Billing Management" description="Manage subscription packages, billing, and payment history.">
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
                      type="number" min="0" max="100" required placeholder="0" value={newPackage.discount}
                      onChange={(e) => setNewPackage({ ...newPackage, discount: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="border border-rose-200 dark:border-rose-500/50 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-mono bg-rose-50 dark:bg-rose-500/10 outline-none transition-all text-rose-600 dark:text-rose-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Maximum Device Quota</label>
                  <input 
                    type="number" required placeholder="0" value={newPackage.maxSensors} 
                    onChange={(e) => setNewPackage({ ...newPackage, maxSensors: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="border focus:ring-2 px-4 py-2.5 rounded-xl text-xs w-full font-mono font-bold outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Data History Duration (Days)</label>
                  <input
                    type="number" required placeholder="0" value={newPackage.historyDurationDays}
                    onChange={(e) => setNewPackage({ ...newPackage, historyDurationDays: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="border p-2.5 rounded-xl text-xs w-full font-mono outline-none focus:ring-2 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--card-text-faint)" }}>Features List (Comma separated)</label>
                  <input
                    type="text" placeholder="SMS Alert, Premium Chart" value={newPackage.features}
                    onChange={(e) => setNewPackage({ ...newPackage, features: e.target.value })}
                    className="border p-2.5 rounded-xl text-xs w-full outline-none focus:ring-2 shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-3" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs rounded-xl font-bold cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Cancel</button>
                  <button type="submit" onClick={handleCreatePackage} className="px-4 py-2 text-xs text-white rounded-xl font-bold shadow-sm cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--accent-primary)" }}>Register Package</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => {
                const extendedPkg = pkg as ExtendedPackage;
                const isEditing = editingPack?.id === pkg.id;
                const pkgDiscount = extendedPkg.discount || 0; 
                const hasDiscount = pkgDiscount > 0;
                const finalPrice = getPackageFinalPrice(pkg);

                return (
                  <div key={pkg.id} className={`rounded-2xl border transition-all duration-300 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md relative overflow-hidden ${isEditing ? "shadow-md ring-4" : ""}`} style={{ backgroundColor: "var(--card-bg)", borderColor: isEditing ? "var(--accent-primary)" : "var(--card-border)", "--tw-ring-color": "var(--accent-primary-hover)" } as React.CSSProperties}>
                    {pkg.isActive && !isEditing && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                        <div className="absolute transform rotate-45 text-white text-[8px] font-bold text-center py-0.5 w-24 top-2 -right-6 shadow-sm" style={{ backgroundColor: "var(--accent-primary)" }}>
                          ACTIVE
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base" style={{ color: "var(--card-title)" }}>{pkg.name}</h4>
                          <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--card-text-faint)" }}>ID: <span className="font-mono" style={{ color: "var(--card-text-muted)" }}>{pkg.id}</span></p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pkg.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                          {pkg.isActive ? "OPERATIONAL" : "INACTIVE"}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl grid grid-cols-2 gap-4 text-xs font-medium" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>
                        <div>
                          <span className="text-[10px] font-bold block uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Max Quota</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packMaxSensors} 
                                onChange={(e) => setPackMaxSensors(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-14 px-2 py-1 border rounded focus:ring-1 outline-none font-bold transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                              />
                              <span style={{ color: "var(--card-text-muted)" }}>Devices</span>
                            </div>
                          ) : (
                            <p className="font-bold mt-0.5" style={{ color: "var(--card-title)" }}>{pkg.maxSensors} Devices</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold block uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>History Log Period</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packHistoryDurationDays} 
                                onChange={(e) => setPackHistoryDurationDays(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-14 px-2 py-1 border rounded focus:ring-1 outline-none font-bold transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                              />
                              <span style={{ color: "var(--card-text-muted)" }}>Days Log</span>
                            </div>
                          ) : (
                            <p className="font-bold mt-0.5" style={{ color: "var(--card-title)" }}>{pkg.historyDurationDays} Days Log</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between pb-2" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)" }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--card-text-faint)" }}>Normal Price (Rp)</span>
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packPrice} 
                                onChange={(e) => setPackPrice(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-28 text-right border rounded px-2 py-1 outline-none text-sm font-mono font-bold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-title)" }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Discount (%)</span>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" min="0" max="100"
                                  placeholder="0"
                                  value={packDiscount} 
                                  onChange={(e) => setPackDiscount(e.target.value === "" ? "" : Number(e.target.value))} 
                                  className="w-16 text-right bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/50 rounded px-2 py-1 focus:border-rose-500 outline-none text-sm font-mono font-bold text-rose-600 dark:text-rose-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                />
                                <span className="text-xs font-bold text-rose-500">%</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {hasDiscount && (
                              <p className="text-sm font-mono font-bold line-through decoration-rose-500/50 mb-0.5 flex items-center gap-2" style={{ color: "var(--card-text-faint)" }}>
                                Rp {pkg.price.toLocaleString("en-US")}
                                <span className="no-underline bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold">-{pkgDiscount}%</span>
                              </p>
                            )}
                            <p className="text-2xl font-mono font-black flex items-baseline gap-1" style={{ color: "var(--card-title)" }}>
                              Rp {finalPrice.toLocaleString("en-US")} <span className="text-xs font-normal font-sans" style={{ color: "var(--card-text-faint)" }}>/ month</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--card-text-faint)" }}>Tier Main Features:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.features.map((feat, idx) => (
                              <span key={idx} className="border px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)", borderColor: "var(--accent-primary-border)" }}>
                                <Check size={10} strokeWidth={3} style={{ color: "var(--accent-primary)" }} /> {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2 mt-2" style={{ borderTopWidth: 1, borderTopColor: "var(--card-surface-border)" }}>
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => setEditingPack(null)} className="flex-1 border text-xs font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer mt-2" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                            Cancel
                          </button>
                          <button type="button" onClick={handleUpdatePackage} className="flex-1 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm mt-2 border-none" style={{ backgroundColor: "var(--accent-primary)" }}>
                            <Check size={14} /> Save Specs
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { 
                            setEditingPack(pkg); 
                            setPackPrice(pkg.price); 
                            setPackDiscount(pkgDiscount); 
                            setPackMaxSensors(pkg.maxSensors); 
                            setPackHistoryDurationDays(pkg.historyDurationDays);
                          }} className="flex-1 border text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2 hover:opacity-80" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                            <Edit size={13} /> Edit Specs
                          </button>
                          <button type="button" onClick={() => handleTogglePackActive(pkg)} className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-colors cursor-pointer mt-2 ${pkg.isActive ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/60" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100/60"}`}>
                            {pkg.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button type="button" onClick={() => handleDeletePackage(pkg)} title="Delete Package" className="px-3 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer mt-2 shadow-sm hover:opacity-80" style={{ backgroundColor: "var(--card-bg)" }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: "var(--card-surface-border)" }}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-1.5" style={{ color: "var(--card-title)" }}>
                  <CreditCard size={18} style={{ color: "var(--accent-primary)" }} /> Transaction Log & Subscription Billing Status
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--card-text-muted)" }}>Record list of all active packages and commercial billing history of all users.</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} style={{ color: "var(--accent-primary)" }} />
                <select
                  value={logFilter} onChange={(e) => setLogFilter(e.target.value)}
                  className="border p-2 rounded-xl text-xs font-semibold shadow-sm outline-none focus:ring-2 cursor-pointer" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                >
                  <option value="ALL">All Partner Payments</option>
                  <option value="paid">✅ Active / Paid</option>
                  <option value="pending">⏳ Pending Payment</option>
                  <option value="expired">❌ Expired</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead className="text-xs font-bold uppercase tracking-wider border-b" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderColor: "var(--table-border)" }}>
                    <tr>
                      <th className="px-6 py-4">Restaurant Name</th>
                      <th className="px-6 py-4">Tier Package</th>
                      <th className="px-6 py-4">Validity Period</th>
                      <th className="px-6 py-4">Billing Amount</th>
                      <th className="px-6 py-4">Transaction Status</th>
                      <th className="px-6 py-4 text-center">Authority Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs" style={{ borderColor: "var(--table-border)", backgroundColor: "var(--table-body-bg)", color: "var(--card-text)" }}>
                    {filteredLogs.map((log) => {
                      const startStr = log.startDate ? log.startDate.toDate().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "-";
                      const endStr = log.endDate ? log.endDate.toDate().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "-";
                      return (
                        <tr key={log.id} className="hover:opacity-90 transition-colors">
                          <td className="px-6 py-4 font-bold" style={{ color: "var(--card-title)" }}>{log.restaurantName}</td>
                          <td className="px-6 py-4"><span className="font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-mono" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>{log.packageName}</span></td>
                          <td className="px-6 py-4 font-medium" style={{ color: "var(--card-text-muted)" }}><div className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" /><span>{startStr} to <span className="font-bold" style={{ color: "var(--card-title)" }}>{endStr}</span></span></div></td>
                          <td className="px-6 py-4 font-mono font-bold" style={{ color: "var(--card-title)" }}>Rp {log.amount.toLocaleString("en-US")}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${log.paymentStatus === "paid" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : log.paymentStatus === "pending" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"}`}>
                              {log.paymentStatus === "paid" ? "PAID / ACTIVE" : log.paymentStatus === "pending" ? "PENDING" : "EXPIRED"}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex flex-wrap gap-2 justify-center items-center">
                            <button type="button" onClick={() => handleManualExtend(log)} className="border font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm hover:opacity-80" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>Manual Extend</button>
                            <button type="button" onClick={() => { const pack = prompt("Enter new package name (basic / pro):", "pro"); if (pack) alert(`Tier transfer session for ${log.restaurantName} to ${pack} tier was successful.`); }} className="font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer border-none hover:opacity-80" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                              Change Tier
                            </button>
                            <button type="button" onClick={() => handleGiveDiscount(log)} className="font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm border" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.2)", color: "rgb(99, 102, 241)" }}>
                              Give Discount
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-12 text-xs font-medium" style={{ color: "var(--card-text-faint)" }}>No user subscription billing history found.</td></tr>
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