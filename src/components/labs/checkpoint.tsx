"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { QuizQuestion } from "@/content/types";
import { api, cn } from "@/lib/utils";

/** Render `code` spans inside plain question text. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? <code key={i} className="rounded bg-surface-2 px-1 font-mono text-[0.92em]">{part.slice(1, -1)}</code> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** End-of-lab checkpoint. Logs an Activity(type "lab") so the score feeds the skill radar. */
export function LabCheckpoint({ labId, title, skill, minutes, questions }: { labId: string; title: string; skill: string; minutes: number; questions: QuizQuestion[] }) {
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");
  const correct = questions.filter((q) => chosen[q.id] === q.answer).length;
  const score = Math.round((correct / questions.length) * 100);

  async function submit() {
    setSubmitted(true);
    try {
      await api("/api/activity", {
        method: "POST",
        json: { type: "lab", refId: labId, skill, minutes, score, payload: { title: `Lab：${title}`, wrong: questions.filter((q) => chosen[q.id] !== q.answer).map((q) => q.id) } },
      });
      setSaved("ok");
    } catch {
      setSaved("err");
    }
  }

  return (
    <Card>
      <CardHeader
        title="Lab 檢核點"
        subtitle="做完上面的實驗再作答；分數會記錄到能力雷達圖。"
        action={submitted ? <Badge tone={score >= 80 ? "ok" : "warn"}>{correct}/{questions.length} · {score} 分</Badge> : null}
      />
      <CardBody className="space-y-5">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <div className="mb-2 text-[14px] font-medium">
              {qi + 1}. <Inline text={q.q} />
            </div>
            <div className="grid gap-1.5">
              {q.options.map((o, i) => {
                const picked = chosen[q.id] === i;
                const isAns = q.answer === i;
                return (
                  <button
                    key={i}
                    disabled={submitted}
                    onClick={() => setChosen((c) => ({ ...c, [q.id]: i }))}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-3 py-2 text-left text-[13.5px]",
                      !submitted && (picked ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2 cursor-pointer"),
                      submitted && isAns && "border-ok bg-ok-soft",
                      submitted && picked && !isAns && "border-bad bg-bad-soft",
                      submitted && !picked && !isAns && "border-border opacity-70",
                    )}
                  >
                    {submitted && isAns ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : submitted && picked ? <XCircle size={16} className="mt-0.5 shrink-0 text-bad" /> : <span className="mt-0.5 w-4 shrink-0 text-faint">{String.fromCharCode(65 + i)}</span>}
                    <span><Inline text={o} /></span>
                  </button>
                );
              })}
            </div>
            {submitted && <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-[13px] text-muted"><Inline text={q.explain} /></p>}
          </div>
        ))}
        <div className="flex items-center gap-3">
          {!submitted ? (
            <Button onClick={submit} disabled={Object.keys(chosen).length < questions.length}>
              送出（{Object.keys(chosen).length}/{questions.length}）
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => { setChosen({}); setSubmitted(false); setSaved("idle"); }}>
              重新作答
            </Button>
          )}
          {saved === "ok" && <span className="text-[13px] text-ok">已記錄</span>}
          {saved === "err" && <span className="text-[13px] text-bad">記錄失敗（資料庫無法連線），分數未儲存</span>}
        </div>
      </CardBody>
    </Card>
  );
}
