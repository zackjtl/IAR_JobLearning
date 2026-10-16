import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ALL_PLAN_TASKS } from "@/content/plan";

/** Toggle a plan task. Body: { taskId, done } */
export async function POST(req: Request) {
  const b = (await req.json()) as { taskId: string; done: boolean };
  const t = ALL_PLAN_TASKS.find((x) => x.id === b.taskId);
  if (!t) return NextResponse.json({ error: "unknown task" }, { status: 404 });
  await prisma.planTask.upsert({ where: { taskId: t.id }, create: { taskId: t.id, done: !!b.done }, update: { done: !!b.done } });
  if (b.done) {
    await prisma.activity.create({ data: { type: "plan", refId: t.id, skill: t.skill, minutes: 0, payloadJson: JSON.stringify({ title: `計畫任務：${t.title}` }) } });
  }
  return NextResponse.json({ ok: true });
}
