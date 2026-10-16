import { NextResponse } from "next/server";
import { prisma, parseJson } from "@/lib/db";
import { schedule, upsertCard } from "@/lib/srs";
import { LESSON_CONTENT } from "@/content/lessons";
import { LESSON_BY_ID } from "@/content/catalog";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

type Body =
  | { action: "grade"; id: number; grade: 0 | 1 | 2 | 3; chosen?: number }
  | { action: "suspend"; id: number }
  | { action: "seedTerms"; scope: "completed" | "started" | "all" }
  | { action: "finish"; minutes: number; reviewed: number; correct: number };

export async function POST(req: Request) {
  const b = (await req.json()) as Body;

  if (b.action === "grade") {
    const card = await prisma.reviewCard.findUnique({ where: { id: b.id } });
    if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });
    const g = Math.max(0, Math.min(3, Math.round(b.grade))) as 0 | 1 | 2 | 3;
    const next = schedule(card, g);
    await prisma.reviewCard.update({ where: { id: card.id }, data: next });
    if (card.kind === "quiz" && typeof b.chosen === "number") {
      const front = parseJson<{ lessonId?: string }>(card.front, {});
      const back = parseJson<{ answer?: number }>(card.back, {});
      await prisma.quizAttempt.create({
        data: { source: "review", refId: front.lessonId ?? "review", questionId: card.cardKey.replace(/^quiz:/, ""), skill: card.skill, chosen: b.chosen, correct: b.chosen === back.answer },
      });
    }
    return NextResponse.json({ due: next.due, interval: next.interval });
  }

  if (b.action === "suspend") {
    await prisma.reviewCard.update({ where: { id: b.id }, data: { suspended: true } });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "seedTerms") {
    let ids: string[];
    if (b.scope === "all") ids = Object.keys(LESSON_CONTENT);
    else {
      const rows = await prisma.lessonProgress.findMany({ where: b.scope === "completed" ? { status: "completed" } : {}, select: { lessonId: true } });
      ids = rows.map((r) => r.lessonId).filter((id) => LESSON_CONTENT[id]);
    }
    const existing = new Set((await prisma.reviewCard.findMany({ where: { kind: "term" }, select: { cardKey: true } })).map((c) => c.cardKey));
    let added = 0;
    for (const id of ids) {
      const meta = LESSON_BY_ID[id];
      for (const t of LESSON_CONTENT[id].terms) {
        const cardKey = `term:${id}:${slug(t.en)}`;
        if (existing.has(cardKey)) continue;
        await upsertCard({ cardKey, kind: "term", skill: meta?.skill ?? "compiler", front: JSON.stringify({ en: t.en, lessonId: id }), back: JSON.stringify({ zh: t.zh, note: t.note ?? "" }) });
        added++;
      }
    }
    return NextResponse.json({ added, lessons: ids.length });
  }

  if (b.action === "finish") {
    const score = b.reviewed > 0 ? Math.round((b.correct / b.reviewed) * 100) : null;
    await prisma.activity.create({
      data: { type: "review", refId: "session", skill: "", minutes: Math.max(1, Math.min(120, Math.round(b.minutes))), score: null, payloadJson: JSON.stringify({ title: `複習 ${b.reviewed} 張卡片`, accuracy: score }) },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad action" }, { status: 400 });
}
