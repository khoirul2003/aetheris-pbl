"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";

// Struktur Tipe Data untuk Keamanan TypeScript
interface SensorData {
  id: string;
  name?: string;
  location?: string;
  userId?: string;
  isOnline?: boolean;
  condition?: string;
  gas?: number;
  firmwareVersion?: string;
  disabled?: boolean;
  lastSeen?: { seconds: number };
}

interface AlertData {
  id: string;
  message?: string;
  level?: string;
  createdAt?: { seconds: number };
}

interface UserData {
  name?: string;
  displayName?: string;
}

export default function AdminSensorsPage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connFilter, setConnFilter] = useState<string>("");
  const [condFilter, setCondFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SensorData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAlerts, setDetailAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const q = query(collection(db, "sensors"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: SensorData[] = [];
      snap.forEach(d => {
        const data = d.data() as Omit<SensorData, 'id'>;
        rows.push({ id: d.id, ...data });
      });
      setSensors(rows);
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });

    // load owners mapping
    (async () => {
      try {
        const uSnap = await getDocs(collection(db, "users"));
        const map: Record<string, string> = {};
        uSnap.forEach(d => { 
          const data = d.data() as UserData; 
          map[d.id] = data.name || data.displayName || d.id; 
        });
        setOwners(map);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => unsub();
  }, []);

  const filtered = sensors.filter(s => {
    const matchesSearch = search === "" || s.name?.toLowerCase().includes(search.toLowerCase()) || s.id?.toLowerCase().includes(search.toLowerCase());
    const matchesConn = connFilter === "" || (connFilter === "online" ? s.isOnline : !s.isOnline);
    const matchesCond = condFilter === "" || (s.condition || "safe") === condFilter;
    const matchesOwner = ownerFilter === "" || (s.userId === ownerFilter);
    return matchesSearch && matchesConn && matchesCond && matchesOwner;
  });

  async function openDetail(sensor: SensorData) {
    setSelected(sensor);
    setDetailLoading(true);
    try {
      const aQ = query(collection(db, "alerts"), where("sensorId", "==", sensor.id), orderBy("createdAt", "desc"));
      const aSnap = await getDocs(aQ);
      const alerts: AlertData[] = [];
      aSnap.forEach(d => {
        const data = d.data() as Omit<AlertData, 'id'>;
        alerts.push({ id: d.id, ...data });
      });
      setDetailAlerts(alerts.slice(0, 10));
    } catch (err) { console.error(err); }
    setDetailLoading(false);
  }

  async function toggleSensor(sensor: SensorData) {
    try {
      const ref = doc(db, "sensors", sensor.id);
      await updateDoc(ref, { disabled: !sensor.disabled });
    } catch (err) { console.error(err); }
  }

  async function updateFirmware(sensor: SensorData) {
    try {
      const ref = doc(db, "sensors", sensor.id);
      const curr = sensor.firmwareVersion || "v1";
      const match = curr.match(/v(\d+)/);
      const next = match ? `v${parseInt(match[1], 10) + 1}` : curr + "-b";
      await updateDoc(ref, { firmwareVersion: next });
    } catch (err) { console.error(err); }
  }

  return (
    <AdminLayout
      title="Manajemen Sensor"
      description="Pantau dan kelola seluruh sensor yang terhubung."
    >
      <div className="space-y-6">

        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--card-text-faint)" }}>Status Koneksi</label>
              <select value={connFilter} onChange={(e) => setConnFilter(e.target.value)} className="mt-1 block px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 cursor-pointer" style={{ backgroundColor: "var(--card-surface)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                <option value="">Semua</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--card-text-faint)" }}>Kondisi</label>
              <select value={condFilter} onChange={(e) => setCondFilter(e.target.value)} className="mt-1 block px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 cursor-pointer" style={{ backgroundColor: "var(--card-surface)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                <option value="">Semua</option>
                <option value="safe">Aman</option>
                <option value="warning">Waspada</option>
                <option value="danger">Bahaya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--card-text-faint)" }}>Pemilik Restoran</label>
              <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="mt-1 block px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 cursor-pointer" style={{ backgroundColor: "var(--card-surface)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                <option value="">Semua</option>
                {Object.entries(owners).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm font-semibold px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--card-surface)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" }}>{filtered.length} hasil</div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderWidth: 1, borderColor: "var(--card-border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] uppercase font-bold tracking-wider" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderBottomWidth: 1, borderBottomColor: "var(--table-border)" }}>
                <tr>
                  <th className="px-6 py-4">Nama Sensor</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Restoran Pemilik</th>
                  <th className="px-6 py-4">Status Koneksi</th>
                  <th className="px-6 py-4">Kondisi Gas</th>
                  <th className="px-6 py-4">Firmware</th>
                  <th className="px-6 py-4">Terakhir Online</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ backgroundColor: "var(--table-body-bg)", color: "var(--card-text)", borderColor: "var(--table-border)" }}>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center font-medium" style={{ color: "var(--card-text-muted)" }}>Memuat data sensor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center font-medium" style={{ color: "var(--card-text-muted)" }}>Tidak ada hasil yang cocok.</td></tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} className="hover:opacity-90 transition-colors">
                      <td className="px-6 py-4 font-bold" style={{ color: "var(--card-title)" }}>{s.name || s.id}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--card-text-muted)" }}>{s.location || '-'}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--card-title)" }}>{s.userId ? (owners[s.userId] || s.userId) : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.isOnline ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                          {s.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{s.gas ?? '-'} PPM</td>
                      <td className="px-6 py-4 font-mono" style={{ color: "var(--card-text-muted)" }}>{s.firmwareVersion || '-'}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--card-text-muted)" }}>{s.lastSeen ? new Date(s.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        
                        <div className="inline-flex items-center gap-2">
                          
                          <button onClick={() => openDetail(s)} className="font-bold px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-colors cursor-pointer" style={{ backgroundColor: "var(--accent-primary-hover)", color: "var(--accent-primary)" }}>
                            Lihat
                          </button>
                          
                          <button onClick={() => toggleSensor(s)} className={`font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${s.disabled ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}`}>
                            {s.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                          </button>
                          
                          <button onClick={() => updateFirmware(s)} className="font-bold px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-colors shadow-sm cursor-pointer" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)", color: "var(--card-text)" }}>
                            Update FW
                          </button>
                          
                          <button className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer" style={{ color: "var(--card-text-muted)" }}>
                            <MoreHorizontal size={16} />
                          </button>

                        </div>

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl w-190 max-w-[95%] p-6 shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--card-bg)", borderWidth: 1, borderColor: "var(--card-border)" }}>
              <div className="flex items-start justify-between mb-5 pb-4" style={{ borderBottomWidth: 1, borderColor: "var(--card-surface-border)" }}>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--card-title)" }}>Detail Sensor</h3>
                  <p className="text-sm font-medium mt-1" style={{ color: "var(--card-text-muted)" }}>Informasi perangkat dan riwayat alert.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl font-bold text-xs hover:opacity-80 transition-colors cursor-pointer" style={{ backgroundColor: "var(--card-surface)", color: "var(--card-text)" }}>Tutup</button>
                </div>
              </div>

              {detailLoading ? (
                <div className="py-12 text-center text-sm font-bold" style={{ color: "var(--accent-primary)" }}>Memuat detail sensor...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--chart-bg)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                      <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--card-title)" }}>Informasi Sensor</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: "var(--card-text)" }}>
                        <div><span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Nama</span> <span className="font-semibold">{selected.name || '-'}</span></div>
                        <div><span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>ID Sensor</span> <span className="font-mono text-xs">{selected.id}</span></div>
                        <div><span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Lokasi</span> <span className="font-medium">{selected.location || '-'}</span></div>
                        <div><span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Status & Kondisi</span> 
                          <span className="font-bold">{selected.isOnline ? 'Online' : 'Offline'} • {selected.condition || 'Safe'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                      <h4 className="font-bold mb-3" style={{ color: "var(--card-title)" }}>Riwayat Alert (10 terbaru)</h4>
                      {detailAlerts.length === 0 ? (
                        <div className="text-sm font-medium py-4 text-center rounded-lg border border-dashed" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)", color: "var(--card-text-muted)" }}>Belum ada alert terekam.</div>
                      ) : (
                        <ul className="space-y-3 text-sm">
                          {detailAlerts.map(a => (
                            <li key={a.id} className="p-3 rounded-xl border" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="font-semibold" style={{ color: "var(--card-title)" }}>{a.message?.slice?.(0, 60) || 'Alert'}</div>
                                <div className="text-[10px] font-bold shrink-0" style={{ color: "var(--card-text-faint)" }}>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('id-ID') : '-'}</div>
                              </div>
                              <div className="text-[11px] font-bold mt-2 uppercase tracking-wide" style={{ color: "var(--card-text-muted)" }}>Level: <span className={a.level === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>{a.level || 'warning'}</span></div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)", borderWidth: 1, borderColor: "var(--card-surface-border)" }}>
                      <h4 className="font-bold mb-4" style={{ color: "var(--card-title)" }}>Metadata System</h4>
                      <div className="space-y-4 text-sm" style={{ color: "var(--card-text)" }}>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Versi Firmware</span> 
                          <span className="font-mono px-2 py-1 rounded text-xs" style={{ backgroundColor: "var(--card-surface)" }}>{selected.firmwareVersion || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Terakhir Terdeteksi</span> 
                          <span className="font-medium text-xs">{selected.lastSeen ? new Date(selected.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--card-text-faint)" }}>Kepemilikan</span> 
                          <span className="font-bold" style={{ color: "var(--accent-primary)" }}>{selected.userId ? (owners[selected.userId] || selected.userId) : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}