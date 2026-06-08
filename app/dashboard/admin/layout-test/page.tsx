"use client";

import AdminLayout from "@/src/components/layout/AdminLayout";
import { Laptop, Tablet, Smartphone, Compass } from "lucide-react";

export default function LayoutTestPage() {
  return (
    <AdminLayout 
      title="Layout Test & Verification" 
      description="This page is used to test the visual and interactive functionality of the new AdminLayout (Sidebar, Header, Mobile Drawer)."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Responsive Info Card 1 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "rgb(59, 130, 246)" }}>
            <Laptop size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Desktop View</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            On desktop screens (width &gt;= 768px), the sidebar will be sticky on the left. 
            Use the arrow button at the top right corner of the sidebar to collapse it to 80px 
            or expand it to 260px.
          </p>
        </div>

        {/* Responsive Info Card 2 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "rgb(16, 185, 129)" }}>
            <Tablet size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Tablet View & Persistence</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            Sidebar fold status is saved in <code className="px-1 py-0.5 rounded font-mono text-[10px]" style={{ backgroundColor: "var(--card-surface)" }}>localStorage</code>. 
            When you refresh the page, the sidebar status (collapsed/expanded) will be retained without causing disruptive layout shifts.
          </p>
        </div>

        {/* Responsive Info Card 3 */}
        <div className="rounded-2xl border p-6 shadow-xs" style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "rgb(168, 85, 247)" }}>
            <Smartphone size={20} />
          </div>
          <h3 className="mt-4 font-bold text-sm" style={{ color: "var(--card-title)" }}>Mobile View Drawer</h3>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
            On mobile screens (&lt; 768px), the sidebar will be hidden and converted into a menu drawer. 
            Press the hamburger button in the header to reveal the menu with a blurred dark backdrop overlay.
          </p>
        </div>
      </div>

      {/* Main Content Area Demo */}
      <div className="mt-8 rounded-2xl border border-dashed p-12 text-center shadow-xs" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
        <Compass className="mx-auto" size={40} style={{ color: "var(--card-text-faint)" }} />
        <h2 className="mt-4 text-base font-bold" style={{ color: "var(--card-title)" }}>Flexbox Responsive Layout Demo</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed" style={{ color: "var(--card-text-muted)" }}>
          This entire content container is wrapped using a dynamic Flexbox layout. 
          When the sidebar is collapsed, the width of this main area will automatically expand smoothly.
        </p>
      </div>
    </AdminLayout>
  );
}
