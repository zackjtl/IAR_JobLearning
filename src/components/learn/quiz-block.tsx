"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { QuizQuestion } from "@/content/types";
import { Badge, Button, Callout } from "@/components/ui";
import { api, cn } from "@/lib/utils";

type Result = { score: number; completed: boolean; results: { id: string; chosen: number; correct: boolean }[] };

export function QuizBlock({ lessonId, questions, bestScore }: { lessonId: string; questions: QuizQuestion[]; bestScore: number }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await api<Result>("/api/quiz", { method: "POST", json: { lessonId, answers } });
      setResult(r);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const graded = (id: string) => result?.results.find((r) => r.id === id);

  return (
    <div className="space-y-5">
      {bestScore > 0 && !result && <div className="text-[13px] text-muted">最佳成績：{bestScore} 分（80 分以上自動標記完成）</div>}
      {questions.map((q, qi) => {
        const g = graded(q.id);
        return (
          <div key={q.id}>
            <div className="mb-2 flex items-start gap-2 text-[14.5px] font-medium">
              {g && (g.correct ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-bad" />)}
              <span>
                {qi + 1}. {q.q}
              </span>
            </div>
            {q.code && <pre className="code-block mb-2">{q.code}</pre>}
            <div className="grid gap-1.5">
              {q.options.map((o, oi) => {
                const picked = answers[q.id] === oi;
                const isAns = q.answer === oi;
                return (
                  <button
                    key={oi}
                    disabled={!!result}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      !result && "cursor-pointer hover:bg-surface-2",
                      !result && picked && "border-accent bg-accent-soft",
                      !result && !picked && "border-border",
                      result && isAns && "border-ok bg-ok-soft",
                      result && picked && !isAns && "border-bad bg-bad-soft",
                      result && !picked && !isAns && "border-border opacity-70",
                    )}
                  >
                    <span className="mr-2 font-mono text-[12px] text-faint">{String.fromCharCode(65 + oi)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
            {g && <p className="mt-2 text-[13px] text-muted">{q.explain}</p>}
          </div>
        );
      })}
      {result ? (
        <Callout tone={result.score >= 80 ? "ok" : result.score >= 60 ? "warn" : "bad"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              得分 <strong>{result.score}</strong>。
              {result.score >= 80 ? "已標記本課完成。" : "答錯的題目已加入複習卡片，建議重讀相關段落後再試一次。"}
              {result.completed && result.score < 80 && <Badge tone="ok" className="ml-2">本課先前已完成</Badge>}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              <RotateCcw size={14} /> 再做一次
            </Button>
          </div>
        </Callout>
      ) : (
        <Button onClick={submit} disabled={busy || Object.keys(answers).length < questions.length}>
          {busy ? "評分中…" : `送出（${Object.keys(answers).length}/${questions.length}）`}
        </Button>
      )}
    </div>
  );
}
