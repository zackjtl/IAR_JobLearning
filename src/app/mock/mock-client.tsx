"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, Play, Square, Flag } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Textarea } from "@/components/ui";
import { SpeakButtons } from "@/components/english/speak-buttons";
import { FeedbackView, type EvalResult } from "@/components/english/feedback-view";
import { useRecognition } from "@/components/english/use-recognition";
import { speak } from "@/lib/speech";
import { api, cn, fmtDate } from "@/lib/utils";

type Turn = { role: "interviewer" | "candidate"; text: string; zh?: string; followUp?: boolean; eval?: EvalResult };
type Summary = { avg: number; count: number; method: "ai" | "rule"; comment?: string; strengths?: string[]; improvements?: string[]; nextSteps?: string[]; dims?: Record<string, number> };
type Mode = { id: string; label: string; persona: string; desc: string };

const DIM: Record<string, string> = { technical: "技術正確性", clarity: "清晰度", english: "英文品質", structure: "結構", completeness: "完整度", content: "重點涵蓋" };

export function MockClient({ initialMode, modes, ai, history }: { initialMode: string; modes: Mode[]; ai: boolean; history: { id: number; mode: string; status: string; createdAt: string; avg: number | null }[] }) {
  const [mode, setMode] = useState(initialMode);
  const [session, setSession] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showZh, setShowZh] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const rec = useRecognition((t) => { setAnswer(t); setUsedVoice(true); });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns.length, summary]);

  function speakLast(ts: Turn[]) {
    const last = ts[ts.length - 1];
    if (autoSpeak && last?.role === "interviewer") speak(last.text);
  }
  async function start() {
    setBusy(true);
    const r = await api<{ id: number; transcript: Turn[] }>("/api/mock", { method: "POST", json: { action: "start", mode } });
    setSession(r.id); setTurns(r.transcript); setDone(false); setSummary(null); setAnswer(""); setUsedVoice(false);
    speakLast(r.transcript);
    setBusy(false);
  }
  async function send() {
    if (!session || !answer.trim()) return;
    if (rec.listening) rec.stop();
    setBusy(true);
    try {
      const r = await api<{ transcript: Turn[]; done: boolean }>("/api/mock", { method: "POST", json: { action: "answer", id: session, answer } });
      setTurns(r.transcript); setDone(r.done); setAnswer(""); rec.setTranscript("");
      if (!r.done) speakLast(r.transcript);
    } finally { setBusy(false); }
  }
  async function finish() {
    if (!session) return;
    setBusy(true);
    const r = await api<{ summary: Summary }>("/api/mock", { method: "POST", json: { action: "finish", id: session, spoken: usedVoice } });
    setSummary(r.summary); setDone(true); setBusy(false);
  }

  const cur = modes.find((m) => m.id === mode)!;
  const answered = turns.filter((t) => t.role === "candidate").length;

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={cn("cursor-pointer rounded-lg border p-4 text-left transition-colors", m.id === mode ? "border-accent bg-accent-soft/50" : "border-border bg-surface hover:bg-surface-2")}>
              <div className="font-semibold">{m.label}</div>
              <div className="mt-0.5 text-[12.5px] text-muted">{m.persona}</div>
              <div className="mt-2 text-[13px]">{m.desc}</div>
            </button>
          ))}
        </div>
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3 pt-5">
            <Button size="lg" onClick={start} disabled={busy}><Play size={16} />開始「{cur.label}」</Button>
            <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />自動朗讀面試官問題</label>
            {!ai && <Badge tone="warn">規則式模式（未連接 AI）</Badge>}
          </CardBody>
        </Card>
        {history.length > 0 && (
          <Card>
            <CardHeader title="最近的模擬面試" />
            <CardBody>
              <ul className="divide-y divide-border text-[13.5px]">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-2">
                    <span>{modes.find((m) => m.id === h.mode)?.label ?? h.mode} · {fmtDate(h.createdAt)}</span>
                    <span className="text-muted">{h.status === "finished" ? `平均 ${h.avg ?? "—"}` : "未完成"}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <Badge tone="accent">{cur.label}</Badge><span className="text-muted">{cur.persona}</span><span className="text-faint">已回答 {answered} 題</span>
        <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" checked={showZh} onChange={(e) => setShowZh(e.target.checked)} />顯示中文翻譯</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />自動朗讀</label>
      </div>
      <div className="space-y-3">
        {turns.map((t, i) => t.role === "interviewer" ? (
          <div key={i} className="max-w-[85%] rounded-lg border border-border bg-surface p-4">
            <div className="mb-1 flex items-center gap-2 text-[12px] text-faint">{cur.persona}{t.followUp && <Badge tone="neutral">追問</Badge>}</div>
            <div className="text-[15px]">{t.text}</div>
            {showZh && t.zh && <div className="mt-1 text-[13px] text-muted">{t.zh}</div>}
            <div className="mt-2"><SpeakButtons text={t.text} /></div>
          </div>
        ) : (
          <div key={i} className="ml-auto max-w-[85%] space-y-2">
            <div className="rounded-lg bg-accent-soft/60 p-4 text-[14.5px]">{t.text}</div>
            {t.eval && <details className="rounded-md"><summary className="cursor-pointer text-[12.5px] text-muted">這題的回饋（{t.eval.overall}）</summary><div className="mt-2"><FeedbackView e={t.eval} /></div></details>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {!done && (
        <Card>
          <CardBody className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {rec.supported ? (!rec.listening ? <Button variant="outline" onClick={rec.start}><Mic size={15} />用說的回答</Button> : <Button variant="danger" onClick={rec.stop}><MicOff size={15} />停止錄音</Button>) : <span className="text-[12.5px] text-faint">瀏覽器不支援語音辨識，請打字回答</span>}
              {rec.listening && <Badge tone="bad">● 錄音中</Badge>}
              {rec.confidence !== null && <Badge tone="neutral">辨識可信度 {Math.round(rec.confidence * 100)}%</Badge>}
              {rec.error && <span className="text-[12.5px] text-bad">{rec.error}</span>}
            </div>
            {rec.interim && <div className="text-[13px] text-faint">{rec.interim}</div>}
            <Textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type or speak your answer in English…" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={send} disabled={busy || !answer.trim()}>{busy ? "面試官思考中…" : "送出回答"}</Button>
              <Button variant="outline" onClick={finish} disabled={busy || answered === 0}><Flag size={14} />結束並看總結</Button>
              <Button variant="ghost" onClick={() => { setSession(null); setTurns([]); }}><Square size={13} />放棄</Button>
              <span className="self-center text-[12px] text-faint">Ctrl/⌘ + Enter 送出</span>
            </div>
          </CardBody>
        </Card>
      )}
      {done && !summary && <Callout title="面試結束">題目已問完。<Button size="sm" className="ml-2" onClick={finish} disabled={busy}>產生總結</Button></Callout>}
      {summary && (
        <Card>
          <CardHeader title={`總結：平均 ${summary.avg} 分（${summary.count} 題）`} subtitle={summary.method === "ai" ? "AI 總結" : "規則式評估（未連接 AI）"} />
          <CardBody className="space-y-3 text-[14px]">
            {summary.comment && <p>{summary.comment}</p>}
            {summary.dims && <div className="flex flex-wrap gap-2">{Object.entries(summary.dims).map(([k, v]) => <Badge key={k} tone="neutral">{DIM[k] ?? k} {v}</Badge>)}</div>}
            {summary.strengths && summary.strengths.length > 0 && <div><div className="text-[12.5px] font-medium text-ok">做得好</div><ul className="list-disc pl-5">{summary.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            {summary.improvements && summary.improvements.length > 0 && <div><div className="text-[12.5px] font-medium text-warn">優先改進</div><ul className="list-disc pl-5">{summary.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            {summary.nextSteps && summary.nextSteps.length > 0 && <div><div className="text-[12.5px] font-medium">下一步</div><ul className="list-disc pl-5">{summary.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul></div>}
            <div className="flex gap-2"><Button onClick={() => { setSession(null); setTurns([]); setSummary(null); }}>再來一場</Button><Link href="/english" className="self-center text-[13px] text-accent hover:underline">到英文題庫加強</Link></div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
