"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }
  return (
    <button onClick={toggle} aria-label="切換深色/淺色模式" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg cursor-pointer">
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </button>
  );
}
