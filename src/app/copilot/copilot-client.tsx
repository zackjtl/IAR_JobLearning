"use client";

import { useState } from "react";
import { Badge, Button, Callout, Textarea } from "@/components/ui";
import { SpeakButtons } from "@/components/english/speak-buttons";
import { api, cn } from "@/lib/utils";

type Res = { method: "ai" | "match"; zh: string; intent: string; quick: string; extended: string; matches?: { id: string; en: string; score: number }[] };

export function CopilotClient({ ai }: { ai: boolean }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [showExt, setShowExt] = useState(false);
  const [big, setBig] = useState(true);

  async function go(text = q) {
    if (!text.trim()) return;
    setBusy(true); setShowExt(false);
    try { setRes(await api<Res>("/api/copilot", { method: "POST", json: { question: text } })); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-semibold">Interview Copilot</h1>
        <Badge tone={ai ? "accent" : "warn"}>{ai ? "AI 模式" : "題庫比對模式（未連接 AI）"}</Badge>
        <label className="ml-auto flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={big} onChange={(e) => setBig(e.target.checked)} />大字體</label>
      </div>
      <p className="text-[13px] text-muted">貼上或輸入英文問題，取得中文翻譯、問題意圖與 2–3 句的 Quick Answer。僅供練習，或在對方同意的情況下作為會議輔助；本工具不擷取任何會議音訊。</p>
      <Textarea rows={3} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. How would you handle a customer who says our compiler generates wrong code?" className="text-[16px]" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }} />
      <div className="flex gap-2"><Button size="lg" onClick={() => go()} disabled={busy || !q.trim()}>{busy ? "分析中…" : "Quick Answer"}</Button><Button size="lg" variant="ghost" onClick={() => { setQ(""); setRes(null); }}>清除</Button></div>
      {res && (
        <div className={cn("space-y-4", big ? "text-[19px] leading-relaxed" : "text-[15px]")}>
          <div><div className="text-[12.5px] font-medium text-muted">中文翻譯</div><div>{res.zh}</div></div>
          <div><div className="text-[12.5px] font-medium text-muted">問題意圖</div><div>{res.intent}</div></div>
          <Callout title="Quick Answer"><div className={big ? "text-[21px] leading-relaxed" : ""}>{res.quick}</div><div className="mt-2"><SpeakButtons text={res.quick} /></div></Callout>
          {res.extended && (
            <div>
              <Button variant="outline" onClick={() => setShowExt((s) => !s)}>{showExt ? "隱藏延伸回答" : "顯示延伸回答"}</Button>
              {showExt && <div className="mt-3 rounded-md bg-surface-2/60 p-4">{res.extended}</div>}
            </div>
          )}
          {res.method === "match" && res.matches && (
            <div className="text-[13px] text-muted">
              相近題目：{res.matches.map((m) => <button key={m.id} className="mr-2 cursor-pointer underline-offset-2 hover:underline" onClick={() => { setQ(m.en); go(m.en); }}>{m.en}（{m.score}%）</button>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
