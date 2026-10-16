"use client";

import { useState } from "react";
import { Cpu, Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else setErr("密碼錯誤");
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-fg"><Cpu size={18} /></span>
          <div>
            <div className="font-semibold">IAR FAE Interview Academy</div>
            <div className="text-[12px] text-faint">個人學習平台 · 需要密碼</div>
          </div>
        </div>
        <label className="mb-1.5 block text-[13px] font-medium text-muted" htmlFor="pw">密碼</label>
        <Input id="pw" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        {err && <p className="mt-2 text-[13px] text-bad">{err}</p>}
        <Button className="mt-4 w-full" disabled={busy || !pw}>
          <Lock size={15} /> {busy ? "驗證中…" : "登入"}
        </Button>
      </form>
    </div>
  );
}
