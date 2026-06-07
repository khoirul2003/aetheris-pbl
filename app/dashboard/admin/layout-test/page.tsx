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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Laptop size={20} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-sm">Desktop View</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Pada layar desktop (lebar &gt;= 768px), sidebar akan terpasang (sticky) di sebelah kiri. 
            Gunakan tombol panah di sudut kanan atas sidebar untuk melipatnya (collapse) menjadi 80px 
            atau memperluasnya (expand) menjadi 260px.
          </p>
        </div>

        {/* Responsive Info Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Tablet size={20} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-sm">Tablet View & Persistence</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Status lipatan sidebar disimpan di <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">localStorage</code>. 
            Ketika Anda me-refresh halaman, status sidebar (lipat/lebar) akan dipertahankan tanpa menyebabkan pergeseran layout (layout shift) yang mengganggu.
          </p>
        </div>

        {/* Responsive Info Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Smartphone size={20} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-sm">Mobile View Drawer</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Pada layar seluler (&lt; 768px), sidebar akan disembunyikan dan diubah menjadi laci menu (drawer). 
            Tekan tombol hamburger di header untuk memunculkan menu dengan latar belakang gelap blur (overlay backdrop).
          </p>
        </div>
      </div>

      {/* Main Content Area Demo */}
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white/40 p-12 text-center shadow-xs">
        <Compass className="mx-auto text-slate-400" size={40} />
        <h2 className="mt-4 text-base font-bold text-slate-800">Flexbox Responsive Layout Demo</h2>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
          Seluruh kontainer konten ini dibungkus menggunakan tata letak Flexbox dinamis. 
          Ketika sidebar dilipat, lebar area utama ini akan melebar secara otomatis secara halus dan mulus.
        </p>
      </div>
    </AdminLayout>
  );
}
