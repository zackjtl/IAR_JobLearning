"use client";

import { Badge, Callout, Progress } from "@/components/ui";
import type { RuleEval } from "@/lib/evaluate";

type AiEval = {
  method: "ai";
  scores: { technical: number; clarity: number; english: number; structure: number; completeness: number };
  overall: number;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  corrections?: { original: string; better: string }[];
};
export type EvalResult = AiEval | RuleEval;

const AI_LABEL: Record<string, string> = { technical: "技術正確性", clarity: "溝通清晰度", english: "英文品質", structure: "回答結構", completeness: "完整度" };
const RULE_LABEL: Record<string, string> = { content: "重點涵蓋", structure: "回答結構", clarity: "清晰度（句長/填充詞）", english: "英文表面特徵" };

function tone(v: number) { return v >= 75 ? "ok" : v >= 55 ? "warn" : "bad"; }

export function FeedbackView({ e }: { e: EvalResult }) {
  const labels = e.method === "ai" ? AI_LABEL : RULE_LABEL;
  return (
    <div className="space-y-3 rounded-md border border-border bg-surface-2/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[15px] font-semibold">整體 {e.overall}</span>
        {e.method === "ai" ? <Badge tone="accent">AI 評估</Badge> : <Badge tone="warn">規則式評估（未連接 AI）</Badge>}
        <span className="text-[12px] text-faint">僅依文字可觀察特徵評估，不判斷心理自信程度</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(e.scores).map(([k, v]) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-[12.5px]"><span className="text-muted">{labels[k] ?? k}</span><span>{v}</span></div>
            <Progress value={v} tone={tone(v) as "ok" | "warn" | "bad"} />
          </div>
        ))}
      </div>
      {e.method === "rule" ? (
        <>
          <ul className="list-disc space-y-1 pl-5 text-[13.5px]">{e.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          {e.matched.length > 0 && <div className="text-[12.5px] text-muted">已涵蓋：{e.matched.join("、")}</div>}
          <p className="text-[12px] text-faint">規則式評估只檢查長度、結構詞、關鍵詞涵蓋與填充詞，無法判斷技術內容是否正確。設定 AI API key 後可取得更完整的回饋。</p>
        </>
      ) : (
        <>
          {e.strengths?.length > 0 && <div><div className="text-[12.5px] font-medium text-ok">做得好</div><ul className="list-disc pl-5 text-[13.5px]">{e.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          {e.improvements?.length > 0 && <div><div className="text-[12.5px] font-medium text-warn">可以改進</div><ul className="list-disc pl-5 text-[13.5px]">{e.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          {e.corrections && e.corrections.length > 0 && (
            <div className="text-[13.5px]"><div className="text-[12.5px] font-medium">句型修正</div>
              {e.corrections.map((c, i) => <div key={i}><span className="text-bad line-through">{c.original}</span> → <span className="text-ok">{c.better}</span></div>)}
            </div>
          )}
          {e.improvedAnswer && <Callout title="更自然的回答範例">{e.improvedAnswer}</Callout>}
        </>
      )}
    </div>
  );
}
