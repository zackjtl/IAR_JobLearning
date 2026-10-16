import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TYPES = new Set(["english", "speaking", "mock", "lab", "copilot", "lesson", "review", "plan"]);

/** Log an activity. Body: { type, refId, skill?, minutes?, score?, payload? } */
export async function POST(req: Request) {
  const b = (await req.json()) as { type: string; refId: string; skill?: string; minutes?: number; score?: number | null; payload?: Record<string, unknown> };
  if (!TYPES.has(b.type) || !b.refId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const score = typeof b.score === "number" ? Math.max(0, Math.min(100, Math.round(b.score))) : null;
  const a = await prisma.activity.create({
    data: { type: b.type, refId: String(b.refId).slice(0, 120), skill: b.skill ?? "", minutes: Math.max(0, Math.min(240, Math.round(b.minutes ?? 0))), score, payloadJson: JSON.stringify(b.payload ?? {}) },
  });
  return NextResponse.json({ id: a.id });
}

/** List activities of a type: ?type=english */
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") ?? undefined;
  const rows = await prisma.activity.findMany({ where: type ? { type } : {}, orderBy: { createdAt: "desc" }, take: 300, select: { refId: true, score: true, createdAt: true, type: true } });
  return NextResponse.json(rows);
}
