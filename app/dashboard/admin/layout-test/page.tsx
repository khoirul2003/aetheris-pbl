"use client";

import AdminLayout from "@/src/components/layout/AdminLayout";
import { Laptop, Tablet, Smartphone, Compass } from "lucide-react";

export default function LayoutTestPage() {
  return (
    <AdminLayout 
      title="Layout Test & Verification" 
      description="Halaman ini digunakan untuk menguji fungsionalitas visual dan interaktif dari AdminLayout baru (Sidebar, Header, Drawer Mobile)."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Responsive Info Card 1 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
            <Laptop size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Desktop View</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Pada layar desktop (lebar &gt;= 768px), sidebar akan terpasang (sticky) di sebelah kiri. 
            Gunakan tombol panah di sudut kanan atas sidebar untuk melipatnya (collapse) menjadi 80px 
            atau memperluasnya (expand) menjadi 260px.
          </p>
        </div>

        {/* Responsive Info Card 2 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "rgb(16, 185, 129)" }}>
            <Tablet size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Tablet View & Persistence</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Status lipatan sidebar disimpan di <code className="px-1 py-0.5 rounded font-mono text-[10px]" style={{ backgroundColor: "var(--card-surface)" }}>localStorage</code>. 
            Ketika Anda me-refresh halaman, status sidebar (lipat/lebar) akan dipertahankan tanpa menyebabkan pergeseran layout (layout shift) yang mengganggu.
          </p>
        </div>

        {/* Responsive Info Card 3 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "rgb(168, 85, 247)" }}>
            <Smartphone size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Mobile View Drawer</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Pada layar seluler (&lt; 768px), sidebar akan disembunyikan dan diubah menjadi laci menu (drawer). 
            Tekan tombol hamburger di header untuk memunculkan menu dengan latar belakang gelap blur (overlay backdrop).
          </p>
        </div>
      </div>

      {/* Main Content Area Demo */}
      <div className="mt-8 rounded-2xl border border-dashed p-12 text-center shadow-xs" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
        <Compass className="mx-auto" size={40} style={{ color: "var(--card-text-faint)" }} />
        <h2 className="mt-4 text-base font-bold" style={{ color: "var(--card-title)" }}>Flexbox Responsive Layout Demo</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
          Seluruh kontainer konten ini dibungkus menggunakan tata letak Flexbox dinamis. 
          Ketika sidebar dilipat, lebar area utama ini akan melebar secara otomatis secara halus dan mulus.
        </p>
      </div>
    </AdminLayout>
  );
}
