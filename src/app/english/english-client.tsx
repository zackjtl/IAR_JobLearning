"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronDown, Mic } from "lucide-react";
import { Badge, Button, Card, CardBody, Segmented, Textarea } from "@/components/ui";
import { SpeakButtons } from "@/components/english/speak-buttons";
import { FeedbackView, type EvalResult } from "@/components/english/feedback-view";
import type { EnglishCat, EnglishQ } from "@/content/english";
import { api, cn } from "@/lib/utils";

const SUB: Record<EnglishCat, "intro" | "techExplain" | "business"> = {
  recruiter: "business", intro: "intro", career: "intro", technical: "techExplain", toolchain: "techExplain", fae: "techExplain", behavioral: "business", salary: "business", ask: "business",
};
const SKILL: Record<EnglishCat, string> = { recruiter: "english", intro: "english", career: "english", technical: "english", toolchain: "compiler", fae: "fae", behavioral: "english", salary: "english", ask: "english" };

export function EnglishClient({ cat, cats, counts, questions, practiced }: {
  cat: EnglishCat;
  cats: { id: EnglishCat; label: string; en: string; desc: string }[];
  counts: Record<string, { total: number; done: number }>;
  questions: EnglishQ[];
  practiced: Record<string, number | null>;
}) {
  const [open, setOpen] = useState<string | null>(questions[0]?.id ?? null);
  const [done, setDone] = useState(practiced);
  const current = cats.find((c) => c.id === cat)!;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <Link key={c.id} href={`/english?cat=${c.id}`} className={cn("rounded-md border px-2.5 py-1.5 text-[13px]", c.id === cat ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface hover:bg-surface-2")}>
            {c.label} <span className="text-faint">{counts[c.id].done}/{counts[c.id].total}</span>
          </Link>
        ))}
      </div>
      <p className="text-[13px] text-muted">{current.en} — {current.desc}</p>
      {questions.map((q) => (
        <Card key={q.id}>
          <button className="flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left" onClick={() => setOpen(open === q.id ? null : q.id)} aria-expanded={open === q.id}>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{q.en}</div>
              <div className="mt-0.5 text-[13px] text-muted">{q.zh}</div>
            </div>
            {q.id in done && <Badge tone="ok"><CheckCircle2 size={12} />已練習{done[q.id] !== null ? ` · ${done[q.id]}` : ""}</Badge>}
            <ChevronDown size={18} className={cn("mt-1 shrink-0 text-faint transition-transform", open === q.id && "rotate-180")} />
          </button>
          {open === q.id && (
            <CardBody className="border-t border-border pt-4">
              <QuestionDetail q={q} onPracticed={(s) => setDone((d) => ({ ...d, [q.id]: s }))} />
            </CardBody>
          )}
        </Card>
      ))}
    </div>
  );
}

function QuestionDetail({ q, onPracticed }: { q: EnglishQ; onPracticed: (score: number | null) => void }) {
  const [ver, setVer] = useState<"simple" | "advanced" | "zh">("simple");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [evalRes, setEvalRes] = useState<EvalResult | null>(null);
  const [saved, setSaved] = useState(false);

  async function evaluate() {
    setBusy(true);
    try {
      const r = await api<EvalResult>("/api/evaluate", { method: "POST", json: { question: q.en, answer: draft, keywords: q.keywords, context: `Intent: ${q.intent}` } });
      setEvalRes(r);
      await api("/api/activity", { method: "POST", json: { type: "english", refId: q.id, skill: SKILL[q.cat], minutes: 5, score: r.overall, payload: { title: `英文題：${q.en.slice(0, 60)}`, subScores: { [SUB[q.cat]]: r.overall }, method: r.method } } });
      onPracticed(r.overall);
    } finally {
      setBusy(false);
    }
  }
  async function saveNote() {
    await api("/api/notes", { method: "POST", json: { refType: "english", refId: q.id, title: q.en, content: draft } });
    setSaved(true);
  }

  const answer = ver === "simple" ? q.answerSimple : ver === "advanced" ? q.answerAdvanced : q.answerZh;
  return (
    <div className="space-y-4 text-[14px]">
      <div className="flex flex-wrap items-center gap-2"><SpeakButtons text={q.en} /><Link href={`/speaking?q=${q.id}`} className="inline-flex items-center gap-1 text-[13px] text-accent hover:underline"><Mic size={13} />用口說練習這題</Link></div>
      <div><div className="mb-1 text-[12.5px] font-medium text-muted">問題意圖</div><p>{q.intent}</p></div>
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12.5px] font-medium text-muted">建議回答</div>
          <Segmented value={ver} onChange={setVer} options={[{ value: "simple", label: "簡單版" }, { value: "advanced", label: "進階版" }, { value: "zh", label: "中文對照" }]} />
        </div>
        <div className="rounded-md bg-surface-2/60 p-3 leading-relaxed">{answer}</div>
        {ver !== "zh" && <div className="mt-2"><SpeakButtons text={answer} /></div>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><div className="mb-1 text-[12.5px] font-medium text-muted">關鍵句型</div><ul className="list-disc space-y-0.5 pl-5">{q.keyPhrases.map((p) => <li key={p}>{p}</li>)}</ul></div>
        {q.followUps.length > 0 && <div><div className="mb-1 text-[12.5px] font-medium text-muted">常見追問</div><ul className="list-disc space-y-0.5 pl-5">{q.followUps.map((p) => <li key={p}>{p}</li>)}</ul></div>}
      </div>
      <div>
        <div className="mb-1 text-[12.5px] font-medium text-muted">你的回答（英文）</div>
        <Textarea rows={5} value={draft} onChange={(e) => { setDraft(e.target.value); setSaved(false); }} placeholder="先不看建議回答，用自己的話寫一次；寫完再評估。" />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={evaluate} disabled={busy || draft.trim().length < 5}>{busy ? "評估中…" : "評估並記錄練習"}</Button>
          <Button size="sm" variant="outline" onClick={saveNote} disabled={!draft.trim() || saved}>{saved ? "已存成筆記" : "存成筆記"}</Button>
        </div>
      </div>
      {evalRes && <FeedbackView e={evalRes} />}
    </div>
  );
}
