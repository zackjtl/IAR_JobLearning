"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardCheck, Target, CalendarDays, BookOpen, FlaskConical, Repeat,
  Languages, Mic, MessagesSquare, Zap, NotebookPen, Settings, Cpu,
} from "lucide-react";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const ICONS = { LayoutDashboard, ClipboardCheck, Target, CalendarDays, BookOpen, FlaskConical, Repeat, Languages, Mic, MessagesSquare, Zap, NotebookPen, Settings };

export function Sidebar({ enabled, open = false }: { enabled: string[]; open?: boolean }) {
  const pathname = usePathname();
  const groups = Array.from(new Set(NAV.filter((n) => enabled.includes(n.href)).map((n) => n.group)));
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform md:sticky md:top-0 md:translate-x-0", open ? "translate-x-0 shadow-xl" : "-translate-x-full")}>
      <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-fg">
          <Cpu size={17} strokeWidth={2.2} />
        </span>
        <span className="leading-tight">
          <span className="block text-[14px] font-semibold">IAR FAE Academy</span>
          <span className="block text-[11px] text-faint">Interview Preparation</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g} className="mt-3">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-faint">{g}</div>
            {NAV.filter((n) => n.group === g && enabled.includes(n.href)).map((n) => {
              const Icon = ICONS[n.icon as keyof typeof ICONS];
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] transition-colors",
                    active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon size={16} strokeWidth={1.9} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-[11px] text-faint">v0.1 · 個人學習用</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
