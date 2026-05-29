"use client";

import Sidebar from "@/app/components/Sidebar";
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Bell,
  Building2,
  Download,
  MoreVertical,
  Radio,
  Search,
  WifiOff
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Restoran", value: "124", delta: "+4%", tone: "blue", icon: Building2 },
    { label: "Sensor Aktif", value: "1,562", delta: "Healthy", tone: "emerald", icon: Radio },
    { label: "Alert Hari Ini", value: "18", delta: "Warning", tone: "amber", icon: Bell },
    { label: "Sensor Offline", value: "5", delta: "Danger", tone: "rose", icon: WifiOff },
  ] as const;

  const warnings = [
    {
      name: "Steak House Central",
      message: "High Temp Anomaly di Ruang Pendingin B",
      badge: "BAHAYA",
      badgeTone: "rose",
      action: "Investigasi",
      icon: AlertTriangle,
    },
    {
      name: "Pasta Palace",
      message: "Low Humidity Alert di Area Gudang Kering",
      badge: "WASPADA",
      badgeTone: "amber",
      action: "Investigasi",
      icon: Activity,
    },
    {
      name: "The Burger Joint",
      message: "Power Outage pada Panel Utama",
      badge: "BAHAYA",
      badgeTone: "rose",
      action: "Investigasi",
      icon: WifiOff,
    },
  ] as const;

  const chartLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const alertBars = [34, 26, 52, 30, 68, 42, 58];
  const userBars = [22, 28, 18, 40, 52, 66, 78];

  const revenueBars = [
    { label: "Jan", value: 28 },
    { label: "Feb", value: 34 },
    { label: "Mar", value: 26 },
    { label: "Apr", value: 48 },
    { label: "Mei", value: 62 },
    { label: "Jun", value: 74 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-size-[18px_18px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/80 to-transparent" />

      <Sidebar role="admin" />

      <main className="relative ml-64 min-h-screen px-4 py-4 md:px-6 md:py-5">
        <div className="flex w-full flex-col gap-5">
          <header className="rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-slate-500">Admin Dashboard</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Beranda</h1>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                <div className="relative w-full lg:w-90">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Cari restoran, sensor, atau alert..."
                  />
                </div>

                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                  <Bell size={16} />
                  Support
                </button>

                <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm">
                  OM
                </button>
              </div>
            </div>
          </header>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading
                  title="Beranda"
                  description="Ringkasan operasional platform monitoring industri hari ini."
                />
              </div>

              <button className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                <Download size={16} />
                Export Data
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                const accentClass =
                  stat.tone === "blue"
                    ? "border-t-blue-500"
                    : stat.tone === "emerald"
                      ? "border-t-emerald-500"
                      : stat.tone === "amber"
                        ? "border-t-amber-500"
                        : "border-t-rose-500";

                const pillClass =
                  stat.tone === "blue"
                    ? "border-blue-500 text-blue-700 bg-blue-50"
                    : stat.tone === "emerald"
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : stat.tone === "amber"
                        ? "border-amber-500 text-amber-700 bg-amber-50"
                        : "border-rose-500 text-rose-700 bg-rose-50";

                return (
                  <div key={stat.label} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] border-t-4 ${accentClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                        <div className="mt-4 flex items-end gap-3">
                          <p className="text-4xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${pillClass}`}>{stat.delta}</span>
                        </div>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        <Icon size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <AlertTriangle size={18} />
                      </div>
                      <SectionHeading
                        title="Restoran dalam Bahaya/Waspada"
                        description="Ringkasan lokasi yang membutuhkan tindakan cepat."
                        compact
                      />
                    </div>

                    <button className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                      Lihat Semua
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {warnings.map((item) => {
                      const Icon = item.icon;
                      const badgeClass = item.badgeTone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600";

                      return (
                        <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>{item.badge}</span>
                                  <button className="text-sm font-semibold text-blue-600">{item.action}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <SectionHeading title="Ringkasan Pendapatan Bulan Ini" compact />
                    <button className="text-slate-400 transition-colors hover:text-slate-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mt-10">
                    <p className="text-4xl font-extrabold tracking-tight text-blue-600">Rp 452M</p>
                    <p className="mt-2 text-sm text-slate-600">Total Tagihan Berjalan</p>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Bulan Lalu</p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Pertumbuhan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">Rp 410M</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600">↗ 10.2%</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-6 gap-3">
                      {revenueBars.map((bar) => (
                        <div key={bar.label} className="flex flex-col items-center gap-2">
                          <div className="flex h-32 w-full items-end justify-center rounded-xl bg-slate-50 px-2 py-2">
                            <div className="w-full rounded-t-lg bg-blue-200" style={{ height: `${bar.value}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ChartPanel title="Grafik Alert (7 Hari Terakhir)" accent="rose" bars={alertBars} labels={chartLabels} />
                <ChartPanel title="Pertumbuhan User Baru" accent="blue" bars={userBars} labels={chartLabels} />
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <SectionHeading
                      title="Sensor Offline"
                      description="Perangkat yang belum mengirim data dalam dua jam terakhir."
                      compact
                    />
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">5 items</span>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                  <div className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr] bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Sensor ID</span>
                    <span>Restaurant</span>
                    <span>Last Seen</span>
                    <span className="text-right">Action</span>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {[
                      { id: "SN-491", name: "Restoran Padang Restu", lastSeen: "2 hours ago" },
                      { id: "SN-492", name: "Bakso Solo Baru", lastSeen: "2 hours ago" },
                      { id: "SN-493", name: "Ayam Kita Tlogomas", lastSeen: "2 hours ago" },
                      { id: "SN-494", name: "Lalapan Purnama", lastSeen: "2 hours ago" },
                    ].map((row) => (
                      <div key={row.id} className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr] items-center px-4 py-4 text-sm transition-colors hover:bg-slate-50">
                        <span className="font-mono font-bold text-slate-900">{row.id}</span>
                        <span className="text-slate-700">{row.name}</span>
                        <span className="text-slate-500">{row.lastSeen}</span>
                        <div className="text-right">
                          <button className="font-semibold text-blue-600">Diagnose</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeading title="Real-time Alerts" compact />
                  <button className="text-slate-400 transition-colors hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      title: "Kitchen Pusat - McD",
                      status: "DANGER",
                      statusTone: "rose",
                      message: "Exhaust hood temperature exceeded 85°C.",
                      time: "10 mins ago",
                    },
                    {
                      title: "Cabang Sudirman",
                      status: "WARNING",
                      statusTone: "amber",
                      message: "Freezer ambient temp rising slowly (+2°C).",
                      time: "45 mins ago",
                    },
                    {
                      title: "Wendy&apos;s - Blok M",
                      status: "RESOLVED",
                      statusTone: "emerald",
                      message: "Gas valve pressure normalized.",
                      time: "2 hrs ago",
                    },
                  ].map((item) => {
                    const statusClass =
                      item.statusTone === "rose"
                        ? "bg-rose-50 text-rose-600"
                        : item.statusTone === "amber"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600";

                    const edgeClass =
                      item.statusTone === "rose"
                        ? "bg-rose-500"
                        : item.statusTone === "amber"
                          ? "bg-amber-500"
                          : "bg-emerald-500";

                    return (
                      <div key={item.title} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className={`absolute left-0 top-3 h-10 w-1.5 rounded-r-md ${edgeClass}`} />
                        <div className="flex items-start gap-3 pl-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusClass}`}>
                            {item.statusTone === "emerald" ? "✓" : "!"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">{item.title}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>{item.status}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                            <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
                  View All Activity Logs
                </button>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function ChartPanel({
  title,
  accent,
  bars,
  labels,
}: {
  title: string;
  accent: "rose" | "blue";
  bars: number[];
  labels: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
      <SectionHeading title={title} compact />

      <div className="mt-5 flex h-56 items-end gap-4 rounded-xl bg-slate-50 px-5 py-5">
        {bars.map((bar, index) => (
          <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={`w-full max-w-12 rounded-t-lg ${accent === "rose" ? "bg-rose-200" : "bg-blue-200"}`}
                style={{ height: `${bar}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "min-w-0" : ""}>
      <h3 className={compact ? "text-sm font-bold tracking-tight text-slate-900" : "text-2xl font-extrabold tracking-tight text-slate-900"}>
        {title}
      </h3>
      {description ? <p className={compact ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-600"}>{description}</p> : null}
    </div>
  );
}