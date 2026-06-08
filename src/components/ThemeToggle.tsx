"use client";

import { useTheme } from "@/src/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export default function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-button"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
      className={`group relative flex items-center rounded-xl transition-all duration-300 ease-in-out h-10 cursor-pointer border-none
        ${isCollapsed 
          ? "w-10 px-0 mx-auto justify-center" 
          : "w-full justify-start px-3 border border-slate-200/60 dark:border-slate-600/60"
        }
        ${isDark 
          ? "bg-slate-700/50 text-amber-400 hover:bg-slate-600/60" 
          : "bg-white/60 text-slate-600 hover:bg-slate-100/80"
        }`}
    >
      {/* Ikon animasi berputar saat berganti tema */}
      <div className="relative w-[18px] h-[18px] shrink-0">
        <Sun 
          size={18} 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            isDark 
              ? "opacity-100 rotate-0 scale-100" 
              : "opacity-0 -rotate-90 scale-50"
          }`} 
          strokeWidth={2} 
        />
        <Moon 
          size={18} 
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            isDark 
              ? "opacity-0 rotate-90 scale-50" 
              : "opacity-100 rotate-0 scale-100"
          }`} 
          strokeWidth={2} 
        />
      </div>

      {/* Label teks */}
      <span 
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-xs font-semibold ${
          isCollapsed 
            ? "max-w-0 opacity-0 ml-0" 
            : "max-w-37.5 opacity-100 ml-2.5"
        }`}
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>

      {/* Tooltip untuk collapsed sidebar */}
      {isCollapsed && (
        <span className="fixed left-21.25 px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-100 shadow-md border border-[#1A1F24]">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
