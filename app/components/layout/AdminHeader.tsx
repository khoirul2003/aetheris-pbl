"use client";

import { Search, Bell } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export default function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200/70 bg-white/90 px-6 py-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side */}
        <div>
          <p className="text-[13px] font-semibold tracking-tight text-slate-500">
            Admin Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {/* Right Side */}
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Cari restoran, sensor, atau alert..."
            />
          </div>

          {/* Support Button */}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100">
            <Bell size={16} />
            Support
          </button>

          {/* Profile Avatar */}
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm font-semibold hover:bg-slate-800 transition-colors">
            AD
          </button>
        </div>
      </div>
    </header>
  );
}
