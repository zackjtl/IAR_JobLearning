"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { ENABLED_ROUTES } from "./enabled";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <Sidebar enabled={ENABLED_ROUTES} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1180px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
