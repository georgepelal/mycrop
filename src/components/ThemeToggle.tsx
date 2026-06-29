import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useSettings();
  
  const currentTheme = theme || "light";

  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    console.log("ThemeToggle clicked. Current:", currentTheme, "Next:", nextTheme);
    setTheme(nextTheme);
    
    // Guaranteed direct DOM update
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs mr-4 z-50"
      title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      id="theme-toggle-btn"
    >
      {currentTheme === "dark" ? (
        <Sun className="w-4.5 h-4.5 text-amber-500 animate-[spin_10s_linear_infinite]" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
      )}
    </button>
  );
}
