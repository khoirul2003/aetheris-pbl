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
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper function to calculate final price with discount
function getPackageFinalPrice(pkg: SubscriptionPackage | undefined) {
  if (!pkg) return 0;
  const discountPercent = (pkg as any).discount || 0;
  return pkg.price - (pkg.price * discountPercent / 100);
}

export default function AdminSubscriptionsManagementPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);

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
    return () => { unsubPacks(); };
  }, []);

  const handleUpdatePackage = async () => {
    if (!editingPack) return;
    try {
      await ClientSubscriptionModel.savePackage(editingPack.id, { 
        price: Number(packPrice) || 0, 
        discount: Number(packDiscount) || 0, 
        maxSensors: Number(packMaxSensors) || 0,
        historyDurationDays: Number(packHistoryDurationDays) || 0 
      });
      alert(`Commercial specs for ${editingPack.name} successfully updated!`);
      setEditingPack(null);
    } catch (err) { console.error(err); }
  };

  const handleDeletePackage = async (pkg: SubscriptionPackage) => {
    if (confirm(`WARNING: Are you sure you want to PERMANENTLY DELETE the "${pkg.name}" tier package?\n\nThis action cannot be undone!`)) {
      try {
        if ('deletePackage' in ClientSubscriptionModel) {
          await (ClientSubscriptionModel as any).deletePackage(pkg.id);
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
      
      await ClientSubscriptionModel.savePackage(generatedId, {
        name: newPackage.name.trim().toUpperCase(), 
        price: Number(newPackage.price) || 0, 
        discount: Number(newPackage.discount) || 0,
        maxSensors: Number(newPackage.maxSensors) || 0,
        historyDurationDays: Number(newPackage.historyDurationDays) || 0, 
        features: featuresArray, 
        isActive: true,
      });
      
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

  return (
    <AdminLayout title="Package & Billing Management" description="Manage subscription packages, limits, and pricing structures.">
      <div className="space-y-8">
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={20} className="text-[#4D6344]" /> Partnership Package Configuration
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Manage feature limits, automated sensor quotas, and platform commercial pricing schemes.</p>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#4D6344] hover:bg-[#3B4D34] text-white px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Plus size={14} /> Add New Tier
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="md:col-span-3 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#EAF2EB] p-1.5 rounded-lg text-[#4D6344]"><Zap size={14} /></div>
                    <span className="text-xs font-bold text-[#4D6344] uppercase tracking-wider">New Subscription Tier Registration Form</span>
                  </div>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Package Tier Name</label>
                  <input
                    type="text" required placeholder="e.g. Enterprise" value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    className="border border-slate-200 focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] px-4 py-2.5 rounded-xl text-xs w-full bg-slate-50 font-bold outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Normal Price (IDR)</label>
                  <div className="relative flex items-center">
                    <DollarSign size={12} className="absolute left-3 text-slate-400" />
                    <input
                      type="number" required placeholder="0" value={newPackage.price}
                      onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="border border-slate-200 focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-mono bg-slate-50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Discount Percentage (%)</label>
                  <div className="relative flex items-center">
                    <Percent size={12} className="absolute left-3 text-rose-400" />
                    <input
                      type="number" min="0" max="100" required placeholder="0" value={newPackage.discount}
                      onChange={(e) => setNewPackage({ ...newPackage, discount: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="border border-rose-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 pl-8 pr-3 py-2.5 rounded-xl text-xs w-full font-mono bg-rose-50/50 outline-none transition-all text-rose-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Maximum Device Quota</label>
                  <input 
                    type="number" required placeholder="0" value={newPackage.maxSensors} 
                    onChange={(e) => setNewPackage({ ...newPackage, maxSensors: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="border border-slate-200 focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] px-4 py-2.5 rounded-xl text-xs w-full font-mono bg-slate-50 font-bold text-slate-700 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Data History Duration (Days)</label>
                  <input
                    type="number" required placeholder="0" value={newPackage.historyDurationDays}
                    onChange={(e) => setNewPackage({ ...newPackage, historyDurationDays: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="border border-slate-200 p-2.5 rounded-xl text-xs w-full font-mono bg-slate-50 outline-none focus:ring-2 focus:ring-[#4D6344]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Features List (Comma separated)</label>
                  <input
                    type="text" placeholder="SMS Alert, Premium Chart" value={newPackage.features}
                    onChange={(e) => setNewPackage({ ...newPackage, features: e.target.value })}
                    className="border border-slate-200 p-2.5 rounded-xl text-xs w-full bg-slate-50 outline-none focus:ring-2 focus:ring-[#4D6344]/20"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer">Cancel</button>
                  <button type="submit" onClick={handleCreatePackage} className="px-4 py-2 text-xs bg-[#4D6344] text-white rounded-xl font-bold shadow-sm hover:bg-[#3B4D34] cursor-pointer">Register Package</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => {
                const isEditing = editingPack?.id === pkg.id;
                const pkgDiscount = (pkg as any).discount || 0; 
                const hasDiscount = pkgDiscount > 0;
                const finalPrice = getPackageFinalPrice(pkg);

                return (
                  <div key={pkg.id} className={`bg-white rounded-2xl border transition-all duration-300 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md relative overflow-hidden ${isEditing ? "border-[#4D6344] shadow-md ring-4 ring-[#4D6344]/5" : "border-slate-200"}`}>
                    {pkg.isActive && !isEditing && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                        <div className="absolute transform rotate-45 bg-[#4D6344] text-white text-[8px] font-bold text-center py-0.5 w-24 top-2 -right-6 shadow-sm">
                          ACTIVE
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">ID: <span className="font-mono text-slate-500">{pkg.id}</span></p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pkg.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                          {pkg.isActive ? "OPERATIONAL" : "INACTIVE"}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Max Quota</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packMaxSensors} 
                                onChange={(e) => setPackMaxSensors(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-14 px-2 py-1 bg-white border border-slate-300 rounded focus:border-[#4D6344] focus:ring-1 focus:ring-[#4D6344] outline-none font-bold text-slate-900 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-500">Devices</span>
                            </div>
                          ) : (
                            <p className="text-slate-900 font-bold mt-0.5">{pkg.maxSensors} Devices</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">History Log Period</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packHistoryDurationDays} 
                                onChange={(e) => setPackHistoryDurationDays(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-14 px-2 py-1 bg-white border border-slate-300 rounded focus:border-[#4D6344] focus:ring-1 focus:ring-[#4D6344] outline-none font-bold text-slate-900 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-500">Days Log</span>
                            </div>
                          ) : (
                            <p className="text-slate-900 font-bold mt-0.5">{pkg.historyDurationDays} Days Log</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Normal Price (Rp)</span>
                              <input 
                                type="number" 
                                placeholder="0"
                                value={packPrice} 
                                onChange={(e) => setPackPrice(e.target.value === "" ? "" : Number(e.target.value))} 
                                className="w-28 text-right bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:border-[#4D6344] outline-none text-sm font-mono font-bold text-slate-900 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  className="w-16 text-right bg-rose-50 border border-rose-200 rounded px-2 py-1 focus:border-rose-500 outline-none text-sm font-mono font-bold text-rose-600 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-xs font-bold text-rose-500">%</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {hasDiscount && (
                              <p className="text-sm font-mono font-bold text-slate-400 line-through decoration-rose-500/50 mb-0.5 flex items-center gap-2">
                                Rp {pkg.price.toLocaleString("en-US")}
                                <span className="no-underline bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-bold">-{pkgDiscount}%</span>
                              </p>
                            )}
                            <p className="text-2xl font-mono font-black text-slate-900 flex items-baseline gap-1">
                              Rp {finalPrice.toLocaleString("en-US")} <span className="text-xs font-normal text-slate-400 font-sans">/ month</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tier Main Features:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.features.map((feat, idx) => (
                              <span key={idx} className="bg-[#EAF2EB] text-[#4D6344] border border-[#4D6344]/20 px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                                <Check size={10} strokeWidth={3} className="text-[#4D6344]" /> {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => setEditingPack(null)} className="flex-1 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer mt-2">
                            Cancel
                          </button>
                          <button type="button" onClick={handleUpdatePackage} className="flex-1 bg-[#4D6344] text-white hover:bg-[#3B4D34] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm mt-2">
                            <Check size={14} /> Save Specs
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { 
                            setEditingPack(pkg); 
                            setPackPrice(pkg.price); 
                            setPackDiscount((pkg as any).discount || 0); 
                            setPackMaxSensors(pkg.maxSensors); 
                            setPackHistoryDurationDays(pkg.historyDurationDays);
                          }} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2">
                            <Edit size={13} /> Edit Specs
                          </button>
                          <button type="button" onClick={() => handleTogglePackActive(pkg)} className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-colors cursor-pointer mt-2 ${pkg.isActive ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/60" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/60"}`}>
                            {pkg.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button type="button" onClick={() => handleDeletePackage(pkg)} title="Hapus Paket" className="px-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer mt-2 shadow-sm">
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
      </div>
    </AdminLayout>
  );
}