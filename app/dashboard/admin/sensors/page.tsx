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

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Status Koneksi</label>
              <select value={connFilter} onChange={(e) => setConnFilter(e.target.value)} className="mt-1 block px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] cursor-pointer">
                <option value="">Semua</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Kondisi</label>
              <select value={condFilter} onChange={(e) => setCondFilter(e.target.value)} className="mt-1 block px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] cursor-pointer">
                <option value="">Semua</option>
                <option value="safe">Aman</option>
                <option value="warning">Waspada</option>
                <option value="danger">Bahaya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Pemilik Restoran</label>
              <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="mt-1 block px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4D6344]/20 focus:border-[#4D6344] cursor-pointer">
                <option value="">Semua</option>
                {Object.entries(owners).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">{filtered.length} hasil</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Memuat data sensor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Tidak ada hasil yang cocok.</td></tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{s.name || s.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{s.location || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{s.userId ? (owners[s.userId] || s.userId) : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {s.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{s.gas ?? '-'} PPM</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{s.firmwareVersion || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{s.lastSeen ? new Date(s.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        
                        {/* UPDATE TOMBOL DIMULAI DARI SINI */}
                        <div className="inline-flex items-center gap-2">
                          
                          <button onClick={() => openDetail(s)} className="bg-[#EAF2EB] text-[#4D6344] font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#C2D1C0] transition-colors cursor-pointer">
                            Lihat
                          </button>
                          
                          <button onClick={() => toggleSensor(s)} className={`font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${s.disabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
                            {s.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                          </button>
                          
                          <button onClick={() => updateFirmware(s)} className="bg-white border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                            Update FW
                          </button>
                          
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                            <MoreHorizontal size={16} />
                          </button>

                        </div>
                        {/* UPDATE TOMBOL SELESAI */}

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#1A1F24]/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-190 max-w-[95%] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="flex items-start justify-between mb-5 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Detail Sensor</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Informasi perangkat dan riwayat alert.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer">Tutup</button>
                </div>
              </div>

              {detailLoading ? (
                <div className="py-12 text-center text-sm font-bold text-[#4D6344]">Memuat detail sensor...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-5">
                    <div className="bg-[#F6F5F0] rounded-xl p-5 border border-slate-200/60">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">Informasi Sensor</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                        <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama</span> <span className="font-semibold">{selected.name || '-'}</span></div>
                        <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Sensor</span> <span className="font-mono text-xs">{selected.id}</span></div>
                        <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lokasi</span> <span className="font-medium">{selected.location || '-'}</span></div>
                        <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status & Kondisi</span> 
                          <span className="font-bold">{selected.isOnline ? 'Online' : 'Offline'} • {selected.condition || 'Safe'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-3">Riwayat Alert (10 terbaru)</h4>
                      {detailAlerts.length === 0 ? (
                        <div className="text-sm text-slate-500 font-medium py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada alert terekam.</div>
                      ) : (
                        <ul className="space-y-3 text-sm">
                          {detailAlerts.map(a => (
                            <li key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex items-start justify-between gap-4">
                                <div className="font-semibold text-slate-800">{a.message?.slice?.(0, 60) || 'Alert'}</div>
                                <div className="text-[10px] font-bold text-slate-400 shrink-0">{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('id-ID') : '-'}</div>
                              </div>
                              <div className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-wide">Level: <span className={a.level === 'danger' ? 'text-rose-600' : 'text-amber-600'}>{a.level || 'warning'}</span></div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-4">Metadata System</h4>
                      <div className="space-y-4 text-sm text-slate-700">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Versi Firmware</span> 
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{selected.firmwareVersion || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terakhir Terdeteksi</span> 
                          <span className="font-medium text-xs">{selected.lastSeen ? new Date(selected.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kepemilikan</span> 
                          <span className="font-bold text-[#4D6344]">{selected.userId ? (owners[selected.userId] || selected.userId) : '-'}</span>
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