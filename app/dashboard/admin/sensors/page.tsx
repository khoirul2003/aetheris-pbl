"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";

export default function AdminSensorsPage() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connFilter, setConnFilter] = useState<string | "">("");
  const [condFilter, setCondFilter] = useState<string | "">("");
  const [ownerFilter, setOwnerFilter] = useState<string | "">("");
  const [owners, setOwners] = useState<Record<string,string>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAlerts, setDetailAlerts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "sensors"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
      setSensors(rows);
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });

    // load owners mapping
    (async () => {
      try {
        const uSnap = await getDocs(collection(db, "users"));
        const map: Record<string,string> = {};
        uSnap.forEach(d => { const data = d.data() as any; map[d.id] = data.name || data.displayName || d.id; });
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

  async function openDetail(sensor: any) {
    setSelected(sensor);
    setDetailLoading(true);
    try {
      const aQ = query(collection(db, "alerts"), where("sensorId", "==", sensor.id), orderBy("createdAt", "desc"));
      const aSnap = await getDocs(aQ);
      const alerts: any[] = [];
      aSnap.forEach(d => alerts.push({ id: d.id, ...d.data() }));
      setDetailAlerts(alerts.slice(0,10));
    } catch (err) { console.error(err); }
    setDetailLoading(false);
  }

  async function toggleSensor(sensor: any) {
    try {
      const ref = doc(db, "sensors", sensor.id);
      await updateDoc(ref, { disabled: !sensor.disabled });
    } catch (err) { console.error(err); }
  }

  async function updateFirmware(sensor: any) {
    try {
      const ref = doc(db, "sensors", sensor.id);
      // placeholder: bump firmware version string
      const curr = sensor.firmwareVersion || "v1";
      const match = curr.match(/v(\d+)/);
      const next = match ? `v${parseInt(match[1],10)+1}` : curr + "-b";
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
              <label className="text-xs text-slate-500">Status Koneksi</label>
              <select value={connFilter} onChange={(e) => setConnFilter(e.target.value)} className="mt-1 block px-3 py-2 border rounded-md text-sm">
                <option value="">Semua</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Kondisi</label>
              <select value={condFilter} onChange={(e) => setCondFilter(e.target.value)} className="mt-1 block px-3 py-2 border rounded-md text-sm">
                <option value="">Semua</option>
                <option value="safe">Aman</option>
                <option value="warning">Waspada</option>
                <option value="danger">Bahaya</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Restoran</label>
              <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="mt-1 block px-3 py-2 border rounded-md text-sm">
                <option value="">Semua</option>
                {Object.entries(owners).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm text-slate-500">{filtered.length} hasil</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[12px] uppercase font-bold tracking-wide">
              <tr>
                <th className="px-6 py-3">Nama Sensor</th>
                <th className="px-6 py-3">Lokasi</th>
                <th className="px-6 py-3">Restoran Pemilik</th>
                <th className="px-6 py-3">Status Koneksi</th>
                <th className="px-6 py-3">Kondisi Gas</th>
                <th className="px-6 py-3">Firmware</th>
                <th className="px-6 py-3">Terakhir Online</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-6 text-center text-slate-500">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-6 text-center text-slate-500">Tidak ada hasil.</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{s.name || s.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.location || '-'}</td>
                    <td className="px-6 py-4 text-sm">{owners[s.userId] || s.userId}</td>
                    <td className="px-6 py-4 text-sm">{s.isOnline ? 'Online' : 'Offline'}</td>
                    <td className="px-6 py-4 text-sm">{s.gas ?? '-'} PPM</td>
                    <td className="px-6 py-4 text-sm">{s.firmwareVersion || '-'}</td>
                    <td className="px-6 py-4 text-sm">{s.lastSeen ? new Date(s.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openDetail(s)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md">Lihat</button>
                        <button onClick={() => toggleSensor(s)} className="px-3 py-1.5 text-sm font-semibold rounded-md bg-amber-600 text-white">{s.disabled ? 'Aktifkan' : 'Nonaktifkan'}</button>
                        <button onClick={() => updateFirmware(s)} className="px-3 py-1.5 text-sm font-medium rounded-md bg-slate-100">Update FW</button>
                        <button className="p-2 rounded-md text-slate-500 hover:bg-slate-50"><MoreHorizontal /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
            <div className="bg-white rounded-lg w-[760px] max-w-[95%] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Detail Sensor</h3>
                  <p className="text-sm text-slate-500">Informasi perangkat dan riwayat alert.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(null)} className="px-3 py-1 rounded-md">Tutup</button>
                </div>
              </div>

              {detailLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat detail...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50 rounded-md p-4">
                      <h4 className="font-semibold">Informasi Sensor</h4>
                      <div className="mt-2 text-sm text-slate-700">
                        <div><strong>Nama:</strong> {selected.name || '-'}</div>
                        <div><strong>ID:</strong> {selected.id}</div>
                        <div><strong>Lokasi:</strong> {selected.location || '-'}</div>
                        <div><strong>Status:</strong> {selected.isOnline ? 'Online' : 'Offline'}</div>
                        <div><strong>Kondisi:</strong> {selected.condition || 'safe'}</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Riwayat Alert (10 terbaru)</h4>
                      {detailAlerts.length === 0 ? (
                        <div className="text-sm text-slate-500">Belum ada alert.</div>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {detailAlerts.map(a => (
                            <li key={a.id} className="p-2 rounded bg-slate-50">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">{a.message?.slice?.(0,60) || 'Alert'}</div>
                                <div className="text-xs text-slate-400">{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('id-ID') : '-'}</div>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Level: {a.level || 'warning'}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="bg-white rounded-md p-4 border border-slate-100">
                      <h4 className="font-semibold mb-2">Metadata</h4>
                      <div className="text-sm text-slate-700">
                        <div><strong>Firmware:</strong> {selected.firmwareVersion || '-'}</div>
                        <div><strong>Last Seen:</strong> {selected.lastSeen ? new Date(selected.lastSeen.seconds * 1000).toLocaleString('id-ID') : '-'}</div>
                        <div><strong>Owner:</strong> {owners[selected.userId] || selected.userId}</div>
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
