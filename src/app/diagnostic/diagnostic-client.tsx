"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Volume2, Turtle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { DIAGNOSTIC_QUESTIONS, LISTENING_ITEMS } from "@/content/diagnostic";
import { SKILLS, ENGLISH_SUBSKILLS, SKILL_LABEL, type SkillId } from "@/content/skills";
import { LESSONS } from "@/content/catalog";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Progress } from "@/components/ui";
import { SkillRadar } from "@/components/charts/radar";
import { speak, ttsSupported } from "@/lib/speech";
import { api, cn } from "@/lib/utils";

const TECH_SKILLS = SKILLS.filter((s) => s.id !== "english");
const UNSURE = -1;

type Step = { kind: "intro" } | { kind: "skill"; skill: SkillId } | { kind: "listening" } | { kind: "self" } | { kind: "result" };

export function DiagnosticClient({ previous }: { previous: { createdAt: string; scores: Partial<Record<SkillId, number>> } | null }) {
  const steps: Step[] = useMemo(
    () => [{ kind: "intro" }, ...TECH_SKILLS.map((s) => ({ kind: "skill" as const, skill: s.id })), { kind: "listening" }, { kind: "self" }, { kind: "result" }],
    [],
  );
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [listen, setListen] = useState<Record<string, number>>({});
  const [self, setSelf] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{ scores: Partial<Record<SkillId, number>>; listeningPct: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const step = steps[i];
  const totalQ = DIAGNOSTIC_QUESTIONS.length + LISTENING_ITEMS.length + ENGLISH_SUBSKILLS.length;
  const answered = Object.keys(answers).length + Object.keys(listen).length + Object.keys(self).length;

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ scores: Partial<Record<SkillId, number>>; listeningPct: number }>("/api/diagnostic", {
        method: "POST",
        json: {
          answers: DIAGNOSTIC_QUESTIONS.map((q) => ({ questionId: q.id, chosen: answers[q.id] ?? UNSURE })),
          listening: LISTENING_ITEMS.map((l) => ({ id: l.id, chosen: listen[l.id] ?? UNSURE })),
          self,
        },
      });
      setResult(r);
      setRevealed(true);
      setI(steps.length - 1);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (step.kind === "intro") {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="開始之前" subtitle="約 20–25 分鐘。結果會成為儀表板的初始能力模型。" />
          <CardBody className="prose-lesson text-sm">
            <ul>
              <li><strong>7 個技術/FAE 面向 × 4 題</strong>：C/C++、Compiler、Linker、Debug、RTOS/Linux、CI/CD、FAE。難度由淺入深。</li>
              <li><strong>3 題英文聽力</strong>：用瀏覽器語音播放（可慢速重播），選出對方的意思。</li>
              <li><strong>6 項英文自評</strong>：依具體描述選擇最符合的等級，不是打分數。</li>
              <li>不會的題目請按 <strong>「不確定」</strong>，不要猜 —— 猜對會讓模型高估你的能力，反而找不到真正的弱點。</li>
              <li>答錯或不確定的題目會自動加入「錯題與複習」。</li>
            </ul>
          </CardBody>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button onClick={() => setI(1)}>
              開始診斷 <ChevronRight size={16} />
            </Button>
          </div>
        </Card>
        {previous && (
          <Card>
            <CardHeader title="上一次結果" subtitle={new Date(previous.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })} />
            <CardBody>
              <SkillRadar
                height={240}
                showBaseline={false}
                data={SKILLS.map((s) => ({ label: s.short, current: previous.scores[s.id] ?? null }))}
              />
              <p className="mt-2 text-[12.5px] text-muted">重新測驗會建立新的基準；之後的練習以新基準為起點。</p>
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      {step.kind !== "result" && (
        <div className="mb-4 flex items-center gap-3">
          <Progress value={(answered / totalQ) * 100} className="flex-1" />
          <span className="text-[12px] tabular-nums text-muted">
            {answered}/{totalQ}
          </span>
        </div>
      )}

      {step.kind === "skill" && (
        <Card>
          <CardHeader title={`${SKILL_LABEL[step.skill]}`} subtitle={`第 ${i} / ${TECH_SKILLS.length} 部分`} />
          <CardBody className="space-y-6">
            {DIAGNOSTIC_QUESTIONS.filter((q) => q.skill === step.skill).map((q, qi) => (
              <div key={q.id}>
                <div className="mb-2 text-[14.5px] font-medium">
                  {qi + 1}. {q.q}
                </div>
                {q.code && <pre className="code-block mb-2">{q.code}</pre>}
                <div className="grid gap-1.5">
                  {q.options.map((o, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                        answers[q.id] === oi ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2",
                      )}
                    >
                      <span className="mr-2 font-mono text-[12px] text-faint">{String.fromCharCode(65 + oi)}</span>
                      {o}
                    </button>
                  ))}
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: UNSURE }))}
                    className={cn(
                      "inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] transition-colors cursor-pointer",
                      answers[q.id] === UNSURE ? "border-warn bg-warn-soft text-warn" : "border-dashed border-border text-muted hover:bg-surface-2",
                    )}
                  >
                    <HelpCircle size={14} /> 不確定 / 不知道
                  </button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {step.kind === "listening" && (
        <Card>
          <CardHeader title="英文聽力" subtitle="按播放聆聽（不顯示原文）。可用慢速重播；作答後才會顯示原文。" />
          <CardBody className="space-y-6">
            {!ttsSupported() && <Callout tone="warn">此瀏覽器不支援語音合成，請改用 Chrome 或 Edge；或直接按「不確定」跳過。</Callout>}
            {LISTENING_ITEMS.map((l, li) => (
              <div key={l.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[14.5px] font-medium">{li + 1}. {l.q}</span>
                  <Button size="sm" variant="outline" onClick={() => speak(l.audio, { rate: 0.95 })}>
                    <Volume2 size={14} /> 播放
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => speak(l.audio, { rate: 0.7 })}>
                    <Turtle size={14} /> 慢速
                  </Button>
                </div>
                <div className="grid gap-1.5">
                  {l.options.map((o, oi) => (
                    <button
                      key={oi}
                      onClick={() => setListen((a) => ({ ...a, [l.id]: oi }))}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-sm cursor-pointer",
                        listen[l.id] === oi ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2",
                      )}
                    >
                      {o}
                    </button>
                  ))}
                  <button
                    onClick={() => setListen((a) => ({ ...a, [l.id]: UNSURE }))}
                    className={cn(
                      "inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] cursor-pointer",
                      listen[l.id] === UNSURE ? "border-warn bg-warn-soft text-warn" : "border-dashed border-border text-muted hover:bg-surface-2",
                    )}
                  >
                    <HelpCircle size={14} /> 聽不懂
                  </button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {step.kind === "self" && (
        <Card>
          <CardHeader title="英文能力自評" subtitle="選擇「最符合你現在狀況」的描述。" />
          <CardBody className="space-y-5">
            {ENGLISH_SUBSKILLS.map((e) => (
              <div key={e.id}>
                <div className="mb-1.5 text-[14px] font-medium">
                  {e.label} <span className="text-faint font-normal">· {e.en}</span>
                </div>
                <div className="grid gap-1 sm:grid-cols-5">
                  {e.descriptors.map((d, di) => (
                    <button
                      key={di}
                      onClick={() => setSelf((s) => ({ ...s, [e.id]: di + 1 }))}
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-left text-[12.5px] leading-snug cursor-pointer",
                        self[e.id] === di + 1 ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2",
                      )}
                    >
                      <span className="mb-0.5 block font-mono text-[11px] text-faint">L{di + 1}</span>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {step.kind === "result" && result && <ResultView scores={result.scores} answers={answers} listeningPct={result.listeningPct} revealed={revealed} />}

      {err && <Callout tone="bad" className="mt-3">送出失敗：{err}</Callout>}

      {step.kind !== "result" && (
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setI((x) => Math.max(0, x - 1))}>
            <ChevronLeft size={16} /> 上一步
          </Button>
          {step.kind === "self" ? (
            <Button onClick={submit} disabled={busy || Object.keys(self).length < ENGLISH_SUBSKILLS.length}>
              {busy ? "計算中…" : "送出並產生能力模型"}
            </Button>
          ) : (
            <Button onClick={() => setI((x) => x + 1)}>
              下一步 <ChevronRight size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultView({ scores, answers, listeningPct }: { scores: Partial<Record<SkillId, number>>; answers: Record<string, number>; listeningPct: number; revealed: boolean }) {
  const sorted = SKILLS.map((s) => ({ ...s, score: scores[s.id] ?? 0 })).sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 3);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="初始能力模型" subtitle="之後的課程 Quiz 與練習會持續更新這個估計。" />
          <CardBody>
            <SkillRadar showBaseline={false} data={SKILLS.map((s) => ({ label: s.short, current: scores[s.id] ?? null }))} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="優先補強" subtitle="分數最低的三個面向與建議起點" />
          <CardBody className="space-y-3">
            {weakest.map((w) => {
              const first = LESSONS.find((l) => l.skill === w.id);
              return (
                <div key={w.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{w.label}</span>
                    <Badge tone={w.score < 50 ? "bad" : w.score < 75 ? "warn" : "ok"}>{w.score}</Badge>
                  </div>
                  {w.id === "english" ? (
                    <p className="mt-1 text-[13px] text-muted">聽力測驗 {listeningPct}%。建議從英文自我介紹與獵頭面談題庫開始。</p>
                  ) : first ? (
                    <p className="mt-1 text-[13px] text-muted">建議起點：{first.title}</p>
                  ) : null}
                </div>
              );
            })}
            <div className="flex gap-2 pt-1">
              <Link href="/" className="text-sm font-medium text-accent hover:underline">回到儀表板 →</Link>
            </div>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="逐題檢討" subtitle="答錯或不確定的題目已加入複習卡片" />
        <CardBody className="space-y-4">
          {DIAGNOSTIC_QUESTIONS.map((q) => {
            const a = answers[q.id] ?? UNSURE;
            const ok = a === q.answer;
            return (
              <div key={q.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-start gap-2">
                  {ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-ok" /> : a === UNSURE ? <HelpCircle size={17} className="mt-0.5 shrink-0 text-warn" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-bad" />}
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">
                      <Badge className="mr-1.5">{SKILL_LABEL[q.skill]}</Badge>
                      {q.q}
                    </div>
                    {!ok && (
                      <div className="mt-1 text-[13px] text-muted">
                        正解：<span className="text-fg">{q.options[q.answer]}</span>
                        {a !== UNSURE && <> · 你的答案：{q.options[a]}</>}
                      </div>
                    )}
                    <div className="mt-1 text-[13px] text-muted">{q.explain}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
