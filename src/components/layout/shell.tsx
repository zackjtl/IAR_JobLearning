"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ENABLED_ROUTES } from "./enabled";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The drawer is open only for the path it was opened on, so navigating closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  if (pathname === "/login") return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <Sidebar enabled={ENABLED_ROUTES} open={open} />
      {open && <button aria-label="關閉選單" className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-surface px-4 md:hidden">
          <button aria-label="開啟選單" className="-ml-1 rounded p-1.5 hover:bg-surface-2" onClick={() => setOpen(true)}><Menu size={19} /></button>
          <span className="text-[14px] font-semibold">IAR FAE Academy</span>
        </div>
        <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
