"use client";

import { useMemo, useState } from "react";
import { Mic, MicOff, RefreshCw, Shuffle } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Segmented, Select, Textarea } from "@/components/ui";
import { SpeakButtons } from "@/components/english/speak-buttons";
import { FeedbackView, type EvalResult } from "@/components/english/feedback-view";
import { useRecognition } from "@/components/english/use-recognition";
import { ENGLISH_CATS } from "@/content/english";
import { api } from "@/lib/utils";

type Q = { id: string; cat: string; en: string; zh: string; keywords: string[]; answerSimple: string; keyPhrases: string[]; intent: string };
type Term = { en: string; zh: string; lesson: string };

export function SpeakingClient({ questions, initialQ, terms }: { questions: Q[]; initialQ?: string; terms: Term[] }) {
  const [mode, setMode] = useState<"answer" | "listen" | "terms">("answer");
  return (
    <div className="space-y-4">
      <Segmented value={mode} onChange={setMode} options={[{ value: "answer", label: "回答練習" }, { value: "listen", label: "聽寫練習" }, { value: "terms", label: "術語練習" }]} />
      <Callout tone="neutral" title="評分說明">
        本頁把三件事分開：<b>文字內容評估</b>（AI 或規則式）、<b>語音辨識可信度</b>（瀏覽器回報的 ASR confidence，只代表辨識引擎的把握程度）、<b>發音評估</b>（未啟用 —— 本站沒有聲學分析能力，不會假裝評分發音）。
      </Callout>
      {mode === "answer" && <AnswerPractice questions={questions} initialQ={initialQ} />}
      {mode === "listen" && <ListenPractice questions={questions} />}
      {mode === "terms" && <TermPractice terms={terms} />}
    </div>
  );
}

function AsrPanel({ rec }: { rec: ReturnType<typeof useRecognition> }) {
  if (!rec.supported) return <p className="text-[13px] text-warn">此瀏覽器不支援語音辨識（建議使用 Chrome 或 Edge）。請在下方手動輸入回答。</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!rec.listening ? (
        <Button onClick={rec.start}><Mic size={15} />開始錄音</Button>
      ) : (
        <Button variant="danger" onClick={rec.stop}><MicOff size={15} />停止</Button>
      )}
      {rec.listening && <Badge tone="bad">● 錄音中</Badge>}
      {rec.confidence !== null && <Badge tone="neutral">語音辨識可信度 {Math.round(rec.confidence * 100)}%</Badge>}
      {rec.error && <span className="text-[13px] text-bad">{rec.error}</span>}
    </div>
  );
}

function AnswerPractice({ questions, initialQ }: { questions: Q[]; initialQ?: string }) {
  const [qid, setQid] = useState(initialQ && questions.some((q) => q.id === initialQ) ? initialQ : questions[0].id);
  const q = questions.find((x) => x.id === qid)!;
  const rec = useRecognition();
  const [manual, setManual] = useState("");
  const [showText, setShowText] = useState(true);
  const [evalRes, setEvalRes] = useState<EvalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const text = (rec.transcript || manual).trim();

  async function evaluate() {
    setBusy(true);
    try {
      const r = await api<EvalResult>("/api/evaluate", { method: "POST", json: { question: q.en, answer: text, keywords: q.keywords, context: `Spoken answer (speech-to-text, may contain recognition errors). Intent: ${q.intent}` } });
      setEvalRes(r);
      setAttempts((a) => a + 1);
      const spoken = !!rec.transcript;
      const sub: Record<string, number> = { [q.cat === "intro" || q.cat === "career" ? "intro" : q.cat === "technical" || q.cat === "toolchain" || q.cat === "fae" ? "techExplain" : "business"]: r.overall };
      if (spoken) sub.speaking = r.overall;
      await api("/api/activity", { method: "POST", json: { type: "speaking", refId: q.id, skill: "english", minutes: 4, score: r.overall, payload: { title: `口說練習：${q.en.slice(0, 50)}`, subScores: sub, asrConfidence: rec.confidence, spoken, method: r.method } } });
    } finally {
      setBusy(false);
    }
  }
  function reset() { rec.setTranscript(""); setManual(""); setEvalRes(null); }
  function random() { const r = questions[Math.floor(Math.random() * questions.length)]; setQid(r.id); reset(); }

  return (
    <Card>
      <CardHeader title="回答練習" subtitle="聽題目 → 用英文口說回答 → 檢查辨識文字 → 評估內容。可重複練習同一題。" action={<Button size="sm" variant="ghost" onClick={random}><Shuffle size={14} />隨機一題</Button>} />
      <CardBody className="space-y-4">
        <Select value={qid} onChange={(e) => { setQid(e.target.value); reset(); }} aria-label="選擇題目">
          {ENGLISH_CATS.map((c) => (
            <optgroup key={c.id} label={c.label}>
              {questions.filter((x) => x.cat === c.id).map((x) => <option key={x.id} value={x.id}>{x.en}</option>)}
            </optgroup>
          ))}
        </Select>
        <div className="rounded-md bg-surface-2/60 p-4">
          <div className="flex flex-wrap items-center gap-2"><SpeakButtons text={q.en} /><Button size="sm" variant="ghost" onClick={() => setShowText((s) => !s)}>{showText ? "隱藏題目文字（練聽力）" : "顯示題目文字"}</Button></div>
          {showText && <div className="mt-3"><div className="text-[16px] font-semibold">{q.en}</div><div className="text-[13px] text-muted">{q.zh}</div></div>}
        </div>
        <AsrPanel rec={rec} />
        {(rec.transcript || rec.interim) && (
          <div className="rounded-md border border-border p-3 text-[14px]">
            <div className="mb-1 text-[12px] text-faint">辨識結果（可在下方修正後再評估）</div>
            {rec.transcript} <span className="text-faint">{rec.interim}</span>
          </div>
        )}
        <Textarea rows={4} value={rec.transcript || manual} onChange={(e) => (rec.transcript ? rec.setTranscript(e.target.value) : setManual(e.target.value))} placeholder="手動輸入模式：直接打字回答，或修正辨識結果" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={evaluate} disabled={busy || text.length < 5}>{busy ? "評估中…" : "評估內容"}</Button>
          <Button variant="outline" onClick={reset}><RefreshCw size={14} />重來一次</Button>
          {attempts > 0 && <span className="self-center text-[12.5px] text-faint">本題已練習 {attempts} 次</span>}
        </div>
        {evalRes && (
          <>
            <FeedbackView e={evalRes} />
            <div className="grid gap-3 sm:grid-cols-3 text-[13px]">
              <div className="rounded-md border border-border p-3"><div className="text-faint">文字內容評估</div><div className="text-[18px] font-semibold">{evalRes.overall}</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-faint">語音辨識可信度</div><div className="text-[18px] font-semibold">{rec.confidence !== null ? `${Math.round(rec.confidence * 100)}%` : "—"}</div><div className="text-[11.5px] text-faint">{rec.transcript ? "瀏覽器回報值，非發音分數" : "未使用語音輸入"}</div></div>
              <div className="rounded-md border border-border p-3 opacity-70"><div className="text-faint">發音評估</div><div className="text-[14px] font-medium">未啟用</div><div className="text-[11.5px] text-faint">需要聲學分析能力，本站未提供</div></div>
            </div>
            <div className="rounded-md bg-surface-2/60 p-3 text-[13.5px]">
              <div className="mb-1 text-[12.5px] font-medium text-muted">參考回答（簡單版）</div>{q.answerSimple}
              <div className="mt-2"><SpeakButtons text={q.answerSimple} /></div>
              <div className="mt-2 text-[12.5px] text-muted">關鍵句型：{q.keyPhrases.join(" · ")}</div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function wordAccuracy(target: string, heard: string) {
  const t = target.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
  const h = heard.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
  // LCS on words
  const dp = Array.from({ length: t.length + 1 }, () => new Array(h.length + 1).fill(0));
  for (let i = 1; i <= t.length; i++) for (let j = 1; j <= h.length; j++) dp[i][j] = t[i - 1] === h[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return t.length ? dp[t.length][h.length] / t.length : 0;
}

function ListenPractice({ questions }: { questions: Q[] }) {
  const pool = useMemo(() => questions.flatMap((q) => [q.en, ...q.answerSimple.split(/(?<=[.!?])\s+/)]).filter((s) => s.length > 25 && s.length < 220 && !s.includes("[")), [questions]);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length));
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const target = pool[idx];
  async function check() {
    const acc = wordAccuracy(target, typed);
    const score = Math.round(acc * 100);
    setResult(score);
    await api("/api/activity", { method: "POST", json: { type: "speaking", refId: `listen:${idx}`, skill: "english", minutes: 2, score, payload: { title: "聽寫練習", subScores: { listening: score } } } });
  }
  return (
    <Card>
      <CardHeader title="聽寫練習（Listening）" subtitle="播放一句面試常見英文，不看文字，把聽到的內容打出來。以字詞比對計分。" />
      <CardBody className="space-y-3">
        <SpeakButtons text={target} size="md" />
        <Textarea rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type what you heard…" />
        <div className="flex gap-2">
          <Button onClick={check} disabled={!typed.trim()}>檢查</Button>
          <Button variant="outline" onClick={() => { setIdx(Math.floor(Math.random() * pool.length)); setTyped(""); setResult(null); }}><Shuffle size={14} />下一句</Button>
        </div>
        {result !== null && (
          <div className="rounded-md bg-surface-2/60 p-3 text-[14px]">
            <div className="font-semibold">字詞正確率 {result}%</div>
            <div className="mt-1">{target}</div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function TermPractice({ terms }: { terms: Term[] }) {
  const [i, setI] = useState(0);
  const rec = useRecognition();
  const [log, setLog] = useState<{ term: string; ok: boolean }[]>([]);
  const t = terms[i % terms.length];
  const heard = rec.transcript.toLowerCase();
  const core = t.en.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9 ]/g, " ").trim();
  const matched = heard ? core.split(/\s+/).filter(Boolean).every((w) => heard.includes(w)) : null;
  function next(ok?: boolean) {
    if (ok !== undefined) setLog((l) => [...l, { term: t.en, ok }]);
    rec.setTranscript("");
    setI((x) => x + 1);
  }
  return (
    <Card>
      <CardHeader title="技術術語練習" subtitle={`共 ${terms.length} 個術語（取自所有課程）。聽 → 跟讀 → 檢查語音辨識是否認得。`} />
      <CardBody className="space-y-3">
        <div className="rounded-md bg-surface-2/60 p-4">
          <div className="text-[20px] font-semibold">{t.en}</div>
          <div className="text-[14px] text-muted">{t.zh}</div>
          <div className="mt-1 text-[12px] text-faint">出自：{t.lesson}</div>
          <div className="mt-3"><SpeakButtons text={t.en.replace(/\(.*?\)/g, "")} /></div>
        </div>
        <AsrPanel rec={rec} />
        {rec.transcript && (
          <div className="text-[14px]">辨識到：「{rec.transcript}」 {matched ? <Badge tone="ok">辨識結果相符</Badge> : <Badge tone="warn">辨識結果不同</Badge>}
            <div className="text-[12px] text-faint">這只表示瀏覽器的語音辨識是否認出這些字，不等於發音評分。</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => next(true)}>我會了，下一個</Button>
          <Button variant="ghost" onClick={() => next(false)}>還不熟，下一個</Button>
          <Button variant="ghost" onClick={() => setI(Math.floor(Math.random() * terms.length))}><Shuffle size={14} />隨機</Button>
        </div>
        {log.length > 0 && <div className="text-[12.5px] text-muted">本次：{log.filter((l) => l.ok).length} 個熟悉、{log.filter((l) => !l.ok).length} 個待加強</div>}
      </CardBody>
    </Card>
  );
}
