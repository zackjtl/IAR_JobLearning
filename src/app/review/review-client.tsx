"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Empty, Progress, Stat } from "@/components/ui";
import { SKILL_LABEL, type SkillId } from "@/content/skills";
import { api, cn } from "@/lib/utils";
import { Md } from "@/components/md";

export type ReviewCardView = {
  id: number;
  kind: "quiz" | "term" | "english";
  skill: string;
  front: string;
  back: string;
  reps: number;
  lapses: number;
  interval: number;
  ease: number;
  lessonTitle: string | null;
};

type QuizFront = { q: string; code?: string; options: string[]; lessonId?: string };
type QuizBack = { answer: number; explain: string };
type TermFront = { en: string; lessonId?: string };
type TermBack = { zh: string; note?: string };

/** Wall-clock helper (kept outside components; only called from event handlers). */
const nowMs = () => Date.now();

const parse = <T,>(s: string, f: T): T => { try { return JSON.parse(s) as T; } catch { return f; } };

/** Same math as schedule() in src/lib/srs.ts — used only to preview the next interval on buttons. */
function preview(c: ReviewCardView, g: 0 | 1 | 2 | 3) {
  if (g === 0) return "10 分鐘";
  const reps = c.reps + 1;
  let interval: number;
  if (reps === 1) interval = g === 3 ? 3 : 1;
  else if (reps === 2) interval = g === 1 ? 3 : g === 2 ? 4 : 6;
  else interval = Math.round(c.interval * (g === 1 ? 1.2 : g === 2 ? c.ease : c.ease * 1.3));
  return `${Math.max(1, interval)} 天`;
}

const GRADES: { g: 0 | 1 | 2 | 3; label: string; variant: "danger" | "outline" | "primary" | "secondary" }[] = [
  { g: 0, label: "忘了 Again", variant: "danger" },
  { g: 1, label: "困難 Hard", variant: "outline" },
  { g: 2, label: "記得 Good", variant: "primary" },
  { g: 3, label: "簡單 Easy", variant: "secondary" },
];

export function ReviewClient({ cards, total, kinds, forecast, hasProgress, termCount }: {
  cards: ReviewCardView[];
  total: number;
  kinds: Record<string, number>;
  forecast: { label: string; n: number }[];
  hasProgress: boolean;
  termCount: number;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(cards);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number | null>(null);
  const finished = useRef(false);

  const card = queue[idx];

  async function grade(g: 0 | 1 | 2 | 3) {
    if (!card) return;
    if (startedAt.current === null) startedAt.current = nowMs();
    setBusy(true);
    try {
      await api("/api/review", { method: "POST", json: { action: "grade", id: card.id, grade: g, chosen: card.kind === "quiz" ? chosen ?? -1 : undefined } });
    } finally {
      setBusy(false);
    }
    const correct = card.kind === "quiz" ? chosen === parse<QuizBack>(card.back, { answer: -1, explain: "" }).answer : g >= 2;
    const s = { reviewed: stats.reviewed + 1, correct: stats.correct + (correct ? 1 : 0) };
    setStats(s);
    // "Again" → see it once more at the end of this session
    if (g === 0) setQueue((q) => [...q, { ...card, reps: 0, lapses: card.lapses + 1, interval: 0 }]);
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
    if (idx + 1 >= queue.length + (g === 0 ? 1 : 0) && !finished.current) {
      finished.current = true;
      const minutes = startedAt.current ? (nowMs() - startedAt.current) / 60000 : 1;
      api("/api/review", { method: "POST", json: { action: "finish", minutes, reviewed: s.reviewed, correct: s.correct } }).catch(() => {});
    }
  }

  async function suspend() {
    if (!card) return;
    await api("/api/review", { method: "POST", json: { action: "suspend", id: card.id } });
    setIdx((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  }

  async function seed(scope: "completed" | "started" | "all") {
    setBusy(true);
    try {
      const r = await api<{ added: number; lessons: number }>("/api/review", { method: "POST", json: { action: "seedTerms", scope } });
      setSeedMsg(`從 ${r.lessons} 課加入 ${r.added} 張術語卡。`);
      router.refresh();
    } catch {
      setSeedMsg("加入失敗（資料庫無法連線）。");
    } finally {
      setBusy(false);
    }
  }

  const done = idx >= queue.length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <div className="space-y-4">
        {queue.length === 0 ? (
          <Empty>
            目前沒有到期的卡片。{total === 0 ? "答錯的課程 Quiz 題會自動加入；也可以在右側加入術語卡。" : "下次到期時間請看右側預測。"}
          </Empty>
        ) : done ? (
          <Card>
            <CardBody className="space-y-3 text-center">
              <CheckCircle2 size={32} className="mx-auto text-ok" />
              <div className="text-lg font-semibold">本輪複習完成</div>
              <p className="text-[13.5px] text-muted">共 {stats.reviewed} 次作答，答對／記得 {stats.correct} 次。</p>
              <div className="flex justify-center gap-2">
                <Button variant="secondary" onClick={() => router.refresh()}>重新整理</Button>
                <Link href="/" className="inline-flex h-9 items-center rounded-md px-3.5 text-sm text-accent hover:underline">回儀表板</Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 text-[13px] text-muted">
              <span className="tabular-nums">{idx + 1} / {queue.length}</span>
              <Progress value={(idx / queue.length) * 100} className="flex-1" />
            </div>
            <Card>
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone={card.kind === "quiz" ? "accent" : "neutral"}>{card.kind === "quiz" ? "錯題" : "術語"}</Badge>
                    {card.skill in SKILL_LABEL && <Badge tone="neutral">{SKILL_LABEL[card.skill as SkillId]}</Badge>}
                    {card.lapses > 0 && <Badge tone="warn">忘記過 {card.lapses} 次</Badge>}
                  </span>
                }
                subtitle={card.lessonTitle ? `來自：${card.lessonTitle}` : undefined}
              />
              <CardBody className="space-y-4">
                {card.kind === "quiz" ? <QuizCard card={card} chosen={chosen} setChosen={(i) => { setChosen(i); setRevealed(true); }} revealed={revealed} /> : <TermCard card={card} revealed={revealed} />}
                {!revealed ? (
                  card.kind !== "quiz" && <Button onClick={() => setRevealed(true)}>顯示答案</Button>
                ) : (
                  <div>
                    <div className="mb-2 text-[12.5px] text-muted">你覺得記得多牢？（按鈕下方是下次出現的時間）</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {GRADES.map((x) => (
                        <Button key={x.g} variant={x.variant} disabled={busy} onClick={() => grade(x.g)} className="h-auto flex-col py-2">
                          <span>{x.label}</span>
                          <span className="text-[11px] opacity-80">{preview(card, x.g)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-right">
                  <button className="cursor-pointer text-[12px] text-faint hover:text-fg" onClick={suspend}>這張不需要再複習（暫停）</button>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="卡片庫" />
          <CardBody className="grid grid-cols-3 gap-3">
            <Stat label="今日到期" value={cards.length} />
            <Stat label="錯題卡" value={kinds.quiz ?? 0} />
            <Stat label="術語卡" value={kinds.term ?? 0} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="未來 7 天到期" />
          <CardBody className="space-y-1.5">
            {forecast.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-14 text-muted">{f.label}</span>
                <div className="h-3 flex-1 rounded-sm bg-surface-2">
                  <div className="h-3 rounded-sm bg-accent" style={{ width: `${Math.min(100, f.n * 5)}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{f.n}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="加入課程術語卡" subtitle="每課的「名詞解釋」會變成英→中的翻卡。已存在的卡片不會重複加入。" />
          <CardBody className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => seed("completed")} disabled={busy || !hasProgress}>已完成的課程</Button>
              <Button size="sm" variant="outline" onClick={() => seed("started")} disabled={busy || !hasProgress}>開始過的課程</Button>
              <Button size="sm" variant="ghost" onClick={() => seed("all")} disabled={busy}>全部 30 課</Button>
            </div>
            {!hasProgress && <p className="text-[12px] text-faint">還沒有課程進度；可以先選「全部 30 課」。</p>}
            {seedMsg && <p className="text-[12.5px] text-ok">{seedMsg}</p>}
            <p className="text-[12px] text-faint">目前術語卡（含暫停）：{termCount} 張</p>
          </CardBody>
        </Card>
        <Callout tone="neutral" title="怎麼評分？">
          Again = 完全想不起來（10 分鐘後再出現）；Hard = 想很久；Good = 正常想起；Easy = 立刻知道。錯題卡會重新作答一次，作答結果也會更新能力分數。
        </Callout>
      </div>
    </div>
  );
}

function QuizCard({ card, chosen, setChosen, revealed }: { card: ReviewCardView; chosen: number | null; setChosen: (i: number) => void; revealed: boolean }) {
  const f = parse<QuizFront>(card.front, { q: "", options: [] });
  const b = parse<QuizBack>(card.back, { answer: -1, explain: "" });
  return (
    <div className="space-y-3">
      <Md text={f.q} className="text-[15px] font-medium" />
      {f.code && <pre className="overflow-x-auto rounded-md bg-code p-3 font-mono text-[12.5px]">{f.code}</pre>}
      <div className="grid gap-1.5">
        {f.options.map((o, i) => (
          <button
            key={i}
            disabled={revealed}
            onClick={() => setChosen(i)}
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-left text-[13.5px]",
              !revealed && "cursor-pointer border-border hover:bg-surface-2",
              revealed && i === b.answer && "border-ok bg-ok-soft",
              revealed && chosen === i && i !== b.answer && "border-bad bg-bad-soft",
              revealed && chosen !== i && i !== b.answer && "border-border opacity-60",
            )}
          >
            {revealed && i === b.answer ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : revealed && chosen === i ? <XCircle size={16} className="mt-0.5 shrink-0 text-bad" /> : <span className="mt-0.5 w-4 shrink-0 text-faint">{String.fromCharCode(65 + i)}</span>}
            {o}
          </button>
        ))}
      </div>
      {revealed && <p className="rounded-md bg-surface-2 px-3 py-2 text-[13px] text-muted">{b.explain}</p>}
    </div>
  );
}

function TermCard({ card, revealed }: { card: ReviewCardView; revealed: boolean }) {
  const f = parse<TermFront>(card.front, { en: "" });
  const b = parse<TermBack>(card.back, { zh: "" });
  return (
    <div className="py-4 text-center">
      <div className="text-[22px] font-semibold">{f.en}</div>
      <div className="mt-1 text-[12.5px] text-faint">先想想中文意思與用途，再顯示答案</div>
      {revealed && (
        <div className="mt-4 space-y-1">
          <div className="text-[18px]">{b.zh}</div>
          {b.note && <div className="text-[13.5px] text-muted">{b.note}</div>}
        </div>
      )}
    </div>
  );
}
