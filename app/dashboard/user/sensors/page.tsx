"use client";

import { useEffect, useState } from "react";
import UserLayout from "@/src/components/layout/UserLayout";
import { ClientSensorModel, FirestoreSensor, LiveSensorData } from "@/models/clientSensorModel";
import { AlertTriangle, Check, RefreshCw, Radio, PowerOff, Edit2, X, Loader2 } from "lucide-react";
import { auth, db, getRtdb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { onAuthStateChanged, User } from "firebase/auth";

// Menyesuaikan struktur interface lokal dengan isi asli Firebase kamu
interface CustomLiveSensorData extends LiveSensorData {
  lpgLevel?: string;
  smokeLevel?: string;
}

export default function SensorsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sensors, setSensors] = useState<FirestoreSensor[]>([]);
  const [liveData, setLiveData] = useState<{ [sensorId: string]: CustomLiveSensorData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSensorId, setEditSensorId] = useState("");
  const [editSensorName, setEditSensorName] = useState("");
  const [editSensorLocation, setEditSensorLocation] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 1. Dengarkan Status Login User
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserId(user ? user.uid : null);
      if (!user) {
        setLoading(false);
        setError("You are not logged in.");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  async function forceOffline(sensorId: string) {
    try {
      const liveRef = ref(getRtdb(), `sensorLive/${sensorId}`);
      await set(liveRef, {
        isOnline: false,
        status: "safe",
        gas: 0,
        temperature: 0,
        humidity: 0,
        lastUpdate: new Date().getTime()
      });
      const firestoreRef = doc(db, "sensors", sensorId);
      await updateDoc(firestoreRef, { isOnline: false, condition: "safe" });
    } catch (err) { console.error("Failed to force offline:", err); }
  }

  function openEditModal(sensor: FirestoreSensor) {
    setEditSensorId(sensor.id);
    setEditSensorName(sensor.name || "");
    setEditSensorLocation(sensor.location || "");
    setIsEditModalOpen(true);
  }

  async function handleEditSensor(e: React.FormEvent) {
    e.preventDefault();
    if (!editSensorId || !editSensorName) return;
    setIsEditing(true);
    try {
      const refDoc = doc(db, "sensors", editSensorId);
      await updateDoc(refDoc, {
        name: editSensorName,
        location: editSensorLocation,
      });
      // Update local state so UI reflects the change immediately
      setSensors(prev => prev.map(s => 
        s.id === editSensorId ? { ...s, name: editSensorName, location: editSensorLocation } : s
      ));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update sensor");
    }
    setIsEditing(false);
  }

  // 2. Ambil data konseptual statis sensor dari Firestore
  useEffect(() => {
    if (!userId) return;
    
    async function fetchSensors() {
      setLoading(true);
      try {
        const fetchedSensors = await ClientSensorModel.getSensorsByUserId(userId as string);
        setSensors(fetchedSensors);
      } catch (err) {
        console.error("Failed to load sensor collection profile:", err);
        setError("Failed to load area & sensor configuration.");
      } finally {
        setLoading(false);
      }
    }
    fetchSensors();
  }, [userId]);

  // 2. Dengarkan data live telemetri dari Realtime Database
  useEffect(() => {
    if (sensors.length === 0) return;

    const unsubscribers = sensors.map((sensor) => {
      return ClientSensorModel.subscribeToLiveStatus(sensor.id, (data) => {
        setLiveData((prev) => ({
          ...prev,
          [sensor.id]: data as CustomLiveSensorData,
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sensors]);

  return (
    <UserLayout 
      title="Areas & Sensors" 
      description="List of gas monitoring devices and your kitchen's real-time condition."
      userEmail={currentUser?.email || ""}
    >
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="animate-spin mx-auto" size={28} style={{ color: "var(--accent-primary)" }} />
            <p className="font-semibold text-xs tracking-wide" style={{ color: "var(--card-text-muted)" }}>Connecting to Sensors...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 rounded-2xl text-red-600 dark:text-rose-400 font-bold text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="w-full space-y-6">
          
          {/* HEADER JUDUL AREA - Indikator Live Monitoring */}
          <div className="flex flex-row items-center justify-between gap-3 border p-4 rounded-2xl shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
            <div>
              <h2 className="text-sm font-black tracking-tight uppercase" style={{ color: "var(--card-title)" }}>All Areas Status</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--card-text-muted)" }}>Sensor telemetry is constantly updated instantly.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border rounded-full shrink-0 shadow-inner" style={{ backgroundColor: "var(--accent-primary-hover)", borderColor: "var(--accent-primary-border)" }}>
              <Radio size={14} className="animate-pulse" style={{ color: "var(--accent-primary)" }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>Live</span>
            </div>
          </div>

          {sensors.length === 0 ? (
            <div className="border p-12 rounded-3xl text-center shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
              <p className="font-semibold" style={{ color: "var(--card-text-muted)" }}>No areas or sensors registered for this account yet.</p>
            </div>
          ) : (
            /* GRID MONITORING KARTU SENSOR */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {sensors.map((sensor) => {
                const currentLive = liveData[sensor.id];
                
                // Validasi Online: Hanya True jika field isOnline dari Firebase bernilai true eksplisit
                const isDeviceOnline = !!currentLive?.isOnline;
                
                // Status alat berubah jadi offline abu-abu jika alat dimatikan
                const status = isDeviceOnline ? (currentLive?.status || "safe") : "offline";
                const isWarningOrDanger = status === "warning" || status === "danger";

                return (
                  <div 
                    key={sensor.id} 
                    className={`p-5 md:p-6 rounded-3xl transition-all shadow-sm flex flex-col justify-between h-full backdrop-blur-sm border`}
                    style={{
                      backgroundColor: status === "danger" ? "rgba(244, 63, 94, 0.05)" : status === "warning" ? "rgba(245, 158, 11, 0.05)" : status === "offline" ? "var(--card-surface)" : "var(--card-bg-solid)",
                      borderColor: status === "danger" ? "rgba(244, 63, 94, 0.2)" : status === "warning" ? "rgba(245, 158, 11, 0.2)" : "var(--card-surface-border)",
                      opacity: status === "offline" ? 0.75 : 1
                    }}
                  >
                    {/* BARIS ATAS: IDENTITY & BADGE */}
                    <div className="flex items-center justify-between mb-6 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}
                          style={{
                            backgroundColor: status === "offline" ? "var(--card-bg)" : isWarningOrDanger ? (status === "danger" ? "rgba(244, 63, 94, 0.1)" : "rgba(245, 158, 11, 0.1)") : "var(--accent-primary-hover)",
                            color: status === "offline" ? "var(--card-text-muted)" : isWarningOrDanger ? (status === "danger" ? "rgb(244, 63, 94)" : "rgb(245, 158, 11)") : "var(--accent-primary)"
                          }}
                        >
                          {status === "offline" ? <Radio size={18} /> : isWarningOrDanger ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-xs md:text-sm truncate uppercase tracking-tight" style={{ color: "var(--card-title)" }}>{sensor.id.toUpperCase()}</h3>
                          <p className="text-[11px] font-bold truncate tracking-wide" style={{ color: "var(--card-text-muted)" }}>{sensor.name} — {sensor.location}</p>
                        </div>
                      </div>

                      {/* LABEL STATUS BADGE */}
                      <span className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-xl text-[10px] md:text-xs font-black shrink-0 uppercase tracking-widest shadow-sm ${status === "danger" ? "animate-pulse" : ""}`}
                        style={{
                          backgroundColor: status === "danger" ? "rgb(244, 63, 94)" : status === "warning" ? "rgb(245, 158, 11)" : status === "offline" ? "var(--card-text-muted)" : "var(--accent-primary)",
                          color: "white"
                        }}
                      >
                        {status === "safe" ? "Safe" : status === "warning" ? "Warning" : status === "danger" ? "Danger" : "Offline"}
                      </span>
                    </div>

                    {/* BARIS TENGAH: DETAIL PARAMETER TELEMETRI SENSOR */}
                    <div className="space-y-2.5 p-4 rounded-2xl border mb-5 flex-grow flex flex-col justify-center shadow-inner" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-surface-border)" }}>
                      <div className="flex justify-between items-center text-xs md:text-sm">
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Total Gas Level:</span>
                        <span className={`font-mono font-black ${isWarningOrDanger ? "text-red-600 dark:text-rose-400 text-sm md:text-base" : ""}`} style={!isWarningOrDanger ? { color: "var(--card-title)" } : {}}>
                          {isDeviceOnline ? `${currentLive?.gas} PPM` : "-"}
                        </span>
                      </div>

                      {/* STATUS LPG LEVEL */}
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>LPG Leak Status:</span>
                        <span className={`font-black uppercase text-xs ${isDeviceOnline && currentLive?.lpgLevel !== "LOW" ? "text-amber-600 dark:text-amber-400" : ""}`} style={!(isDeviceOnline && currentLive?.lpgLevel !== "LOW") ? { color: "var(--card-text)" } : {}}>
                          {isDeviceOnline ? (currentLive?.lpgLevel || "LOW") : "-"}
                        </span>
                      </div>

                      {/* STATUS SMOKE LEVEL */}
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Smoke Density Condition:</span>
                        <span className={`font-black uppercase text-xs ${isDeviceOnline && currentLive?.smokeLevel !== "CLEAR" ? "text-red-600 dark:text-rose-400" : ""}`} style={!(isDeviceOnline && currentLive?.smokeLevel !== "CLEAR") ? { color: "var(--card-text)" } : {}}>
                          {isDeviceOnline ? (currentLive?.smokeLevel || "CLEAR") : "-"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Room Temperature:</span>
                        <span className="font-mono font-bold" style={{ color: "var(--card-title)" }}>
                          {isDeviceOnline ? `${currentLive?.temperature} °C` : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs md:text-sm border-t pt-2" style={{ borderColor: "var(--card-surface-border)" }}>
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--card-text-muted)" }}>Humidity:</span>
                        <span className="font-mono font-bold" style={{ color: "var(--card-title)" }}>
                          {isDeviceOnline ? `${currentLive?.humidity} %` : "-"}
                        </span>
                      </div>
                    </div>

                    {/* BARIS BAWAH: METRICS THRESHOLD & ONLINE STATUS */}
                    <div className="pt-4 border-t flex items-center justify-between text-[9px] md:text-[10px] font-bold tracking-widest gap-2" style={{ borderColor: "var(--card-surface-border)", color: "var(--card-text-faint)" }}>
                      <div className="truncate uppercase">
                        <span>Safe Limit: &lt; {sensor.thresholds?.warning || 200} PPM</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEditModal(sensor)} title="Edit Sensor Name/Location" className="p-1 rounded hover:opacity-80 transition-opacity bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                          <Edit2 size={12} />
                        </button>
                        {isDeviceOnline && (
                          <button onClick={() => forceOffline(sensor.id)} title="Force Turn Off Device" className="p-1 rounded hover:opacity-80 transition-opacity bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-pointer">
                            <PowerOff size={12} />
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isDeviceOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span className={`uppercase font-black ${isDeviceOnline ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {isDeviceOnline ? "Connected" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT SENSOR MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111612]/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest" style={{ color: "var(--card-title)" }}>Edit Sensor</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:opacity-80 transition-opacity border-none bg-transparent cursor-pointer" style={{ color: "var(--card-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSensor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--card-text-faint)" }}>Sensor ID</label>
                <input disabled type="text" value={editSensorId} className="w-full px-4 py-3 rounded-xl text-sm outline-none border font-mono opacity-50 cursor-not-allowed" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
                <p className="text-[10px] mt-1 font-medium text-rose-500">Hardware ID cannot be changed.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--card-text-faint)" }}>Sensor Name</label>
                <input required type="text" placeholder="e.g. Main Kitchen" value={editSensorName} onChange={e => setEditSensorName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[#4D6344]/20 transition-all" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--card-text-faint)" }}>Placement Location</label>
                <input required type="text" placeholder="e.g. Frying Area" value={editSensorLocation} onChange={e => setEditSensorLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-[#4D6344]/20 transition-all" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text)" }} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm hover:opacity-80 transition-all border-none cursor-pointer" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isEditing} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                  {isEditing ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  );
}