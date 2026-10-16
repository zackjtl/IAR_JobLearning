import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { upsertCard } from "@/lib/srs";
import { LESSON_CONTENT } from "@/content/lessons";
import { LESSON_BY_ID } from "@/content/catalog";

/** Grade a lesson quiz. Body: { lessonId, answers: { [questionId]: chosenIndex } } */
export async function POST(req: Request) {
  const { lessonId, answers } = (await req.json()) as { lessonId: string; answers: Record<string, number> };
  const content = LESSON_CONTENT[lessonId];
  const meta = LESSON_BY_ID[lessonId];
  if (!content || !meta) return NextResponse.json({ error: "unknown lesson" }, { status: 404 });

  const graded = content.quiz.map((q) => ({ q, chosen: answers[q.id] ?? -1, correct: answers[q.id] === q.answer }));
  const score = Math.round((graded.filter((g) => g.correct).length / graded.length) * 100);

  await prisma.quizAttempt.createMany({
    data: graded.map((g) => ({ source: "lesson", refId: lessonId, questionId: g.q.id, skill: g.q.skill, chosen: g.chosen, correct: g.correct })),
  });
  for (const g of graded) {
    const card = {
      cardKey: `quiz:${g.q.id}`,
      kind: "quiz",
      skill: g.q.skill,
      front: JSON.stringify({ q: g.q.q, code: g.q.code, options: g.q.options, lessonId }),
      back: JSON.stringify({ answer: g.q.answer, explain: g.q.explain }),
    };
    if (!g.correct) await upsertCard(card, true); // wrong → due now
  }
  const prev = await prisma.lessonProgress.findUnique({ where: { lessonId } });
  const completedNow = score >= 80 && prev?.status !== "completed";
  await prisma.lessonProgress.upsert({
    where: { lessonId },
    create: { lessonId, lastScore: score, bestScore: score, status: score >= 80 ? "completed" : "in_progress", completedAt: score >= 80 ? new Date() : null },
    update: {
      lastScore: score,
      bestScore: Math.max(score, prev?.bestScore ?? 0),
      ...(completedNow ? { status: "completed", completedAt: new Date() } : {}),
    },
  });
  if (completedNow) {
    await prisma.activity.create({ data: { type: "lesson", refId: lessonId, skill: meta.skill, minutes: Math.round(meta.minutes * 0.6), payloadJson: JSON.stringify({ title: `完成課程：${meta.title}` }) } });
  }
  return NextResponse.json({ score, completed: score >= 80 || prev?.status === "completed", results: graded.map((g) => ({ id: g.q.id, chosen: g.chosen, correct: g.correct })) });
}
