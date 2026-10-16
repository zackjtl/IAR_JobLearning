import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { confirm } = (await req.json()) as { confirm?: string };
  if (confirm !== "RESET") return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  await prisma.$transaction([
    prisma.quizAttempt.deleteMany(),
    prisma.diagnosticResult.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.reviewCard.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.mockSession.deleteMany(),
    prisma.planTask.deleteMany(),
  ]);
  return NextResponse.json({ ok: true, note: "筆記與書籤已保留" });
}
