"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or Crashlytics here
    console.error("High Availability Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-full mb-6">
        <AlertTriangle size={48} className="text-rose-500" />
      </div>
      <h2 className="text-2xl font-black mb-3" style={{ color: "var(--card-title)" }}>
        Terjadi Gangguan Sistem
      </h2>
      <p className="max-w-md text-sm font-medium mb-8" style={{ color: "var(--card-text-muted)" }}>
        Fitur *High Availability* kami telah mengisolasi *error* ini agar tidak merusak sisa aplikasi. Detail: {error.message || "Unknown rendering error."}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
      >
        <RefreshCw size={18} />
        Coba Muat Ulang
      </button>
    </div>
  );
}
