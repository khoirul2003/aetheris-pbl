"use client";

import { useTheme } from "@/src/components/ThemeProvider";
import { Moon } from "lucide-react";

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
      className={`group relative flex items-center rounded-xl h-10 cursor-pointer border-none
        ${isCollapsed 
          ? "w-10 px-0 mx-auto justify-center" 
          : "w-full justify-start px-3"
        }
        ${isDark 
          ? "text-[var(--sidebar-badge-text)] hover:bg-[var(--sidebar-hover)]" 
          : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)]"
        }`}
      style={{ backgroundColor: "transparent" }}
    >
      {/* Ikon Moon — hanya Moon, berubah gaya saat aktif */}
      <Moon 
        size={18} 
        className="shrink-0"
        strokeWidth={2}
        fill={isDark ? "currentColor" : "none"}
      />

      {/* Label teks */}
      <span 
        className={`overflow-hidden whitespace-nowrap text-xs font-semibold ${
          isCollapsed 
            ? "max-w-0 opacity-0 ml-0" 
            : "max-w-37.5 opacity-100 ml-2.5"
        }`}
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>

      {/* Tooltip untuk collapsed sidebar */}
      {isCollapsed && (
        <span className="fixed left-21.25 px-2.5 py-1.5 bg-[#1A1F24] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-100 shadow-md border border-[#1A1F24]">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
