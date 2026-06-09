"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reload halaman penuh untuk mereset semua state dan koneksi database
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="fixed bottom-6 right-6 p-3 md:p-4 rounded-full shadow-lg z-50 transition-all hover:scale-110 active:scale-95 group backdrop-blur-md bg-white/70 dark:bg-[#1A1F24]/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-[#252A30]"
      title="Refresh Data & Sensors"
    >
      <RefreshCw
        size={20}
        className={`${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
      />
    </button>
  );
}
