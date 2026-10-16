import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LESSON_BY_ID } from "@/content/catalog";

export async function POST(req: Request) {
  const { lessonId, action } = (await req.json()) as { lessonId: string; action: "visit" | "complete" | "reopen" };
  const meta = LESSON_BY_ID[lessonId];
  if (!meta) return NextResponse.json({ error: "unknown lesson" }, { status: 404 });
  if (action === "visit") {
    const p = await prisma.lessonProgress.upsert({ where: { lessonId }, create: { lessonId, visits: 1 }, update: { visits: { increment: 1 } } });
    return NextResponse.json(p);
  }
  if (action === "complete") {
    const p = await prisma.lessonProgress.upsert({
      where: { lessonId },
      create: { lessonId, status: "completed", completedAt: new Date() },
      update: { status: "completed", completedAt: new Date() },
    });
    await prisma.activity.create({ data: { type: "lesson", refId: lessonId, skill: meta.skill, minutes: Math.round(meta.minutes * 0.6), payloadJson: JSON.stringify({ title: `完成課程：${meta.title}` }) } });
    return NextResponse.json(p);
  }
  const p = await prisma.lessonProgress.update({ where: { lessonId }, data: { status: "in_progress", completedAt: null } });
  return NextResponse.json(p);
}
