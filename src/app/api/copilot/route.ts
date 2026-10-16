import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiJson, aiProvider } from "@/lib/ai";
import { similarity } from "@/lib/evaluate";
import { CANDIDATE_BACKGROUND } from "@/lib/feedback";
import { ENGLISH_QS } from "@/content/english";

type CopilotRes = {
  method: "ai" | "match";
  zh: string;
  intent: string;
  quick: string;
  extended: string;
  matches?: { id: string; en: string; score: number }[];
};

export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string };
  const q = (question ?? "").trim().slice(0, 1500);
  if (!q) return NextResponse.json({ error: "empty" }, { status: 400 });

  const ranked = ENGLISH_QS.map((x) => ({ x, score: similarity(q, x.en) + 0.04 * x.keywords.filter((k) => q.toLowerCase().includes(k)).length })).sort((a, b) => b.score - a.score);
  let res: CopilotRes | null = null;

  if (aiProvider()) {
    try {
      const ref = ranked.slice(0, 2).map((r) => `Reference Q: ${r.x.en}\nReference answer: ${r.x.answerSimple}`).join("\n\n");
      const r = await aiJson<Omit<CopilotRes, "method">>(
        `You are an interview copilot for a candidate interviewing for the IAR Systems FAE / Technical Support Specialist role in Taipei.
${CANDIDATE_BACKGROUND}
Given an English interview question, return JSON: {"zh":"Traditional Chinese translation","intent":"what the interviewer wants to find out (zh-TW, 1-2 sentences)","quick":"Quick Answer: 2-3 short, easy-to-speak English sentences, truthful to the background, use [placeholders] for unknown specifics","extended":"optional extended answer, 4-6 sentences"}.
You may use these reference answers if relevant:\n${ref}`,
        [{ role: "user", content: q }],
        { maxTokens: 900, temperature: 0.4 },
      );
      res = { method: "ai", ...r };
    } catch (e) {
      console.error("copilot AI failed", e);
    }
  }
  if (!res) {
    const best = ranked[0];
    res = {
      method: "match",
      zh: best.score > 0.15 ? `（最相近題目的翻譯）${best.x.zh}` : "（未連接 AI，無法即時翻譯；以下為題庫中最相近的題目）",
      intent: best.x.intent,
      quick: best.x.answerSimple,
      extended: best.x.answerAdvanced,
      matches: ranked.slice(0, 3).map((r) => ({ id: r.x.id, en: r.x.en, score: Math.round(r.score * 100) })),
    };
  }
  await prisma.activity.create({ data: { type: "copilot", refId: res.matches?.[0]?.id ?? "free", skill: "english", minutes: 1, payloadJson: JSON.stringify({ title: `Copilot：${q.slice(0, 60)}`, method: res.method }) } });
  return NextResponse.json(res);
}
