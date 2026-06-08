"use client";

import { AlertTriangle } from "lucide-react";

export default function EmergencyButton() {
  const handleShutdown = () => {
    if (confirm("⚠️ WARNING: Are you sure you want to perform an Emergency Shutdown on the entire system?")) {
      // Masukkan logika shutdown Anda di sini
      console.log("System shutting down...");
    }
  };

  return (
    <button
      onClick={handleShutdown}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
    >
      <AlertTriangle size={18} />
      Emergency Shutdown
    </button>
  );
}