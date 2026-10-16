import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/feedback";

/** Evaluate a free-form English answer. Body: { question, answer, keywords?, context? } */
export async function POST(req: Request) {
  const b = (await req.json()) as { question: string; answer: string; keywords?: string[]; context?: string };
  if (!b.answer?.trim()) return NextResponse.json({ error: "empty answer" }, { status: 400 });
  const evaluation = await evaluateAnswer({ question: b.question, answer: b.answer.slice(0, 4000), keywords: b.keywords, context: b.context });
  return NextResponse.json(evaluation);
}
