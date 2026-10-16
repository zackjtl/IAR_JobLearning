import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { dailyMinutes?: number; planStartDate?: string | null };
  const data: { dailyMinutes?: number; planStartDate?: Date | null } = {};
  if (body.dailyMinutes && [30, 60, 90].includes(body.dailyMinutes)) data.dailyMinutes = body.dailyMinutes;
  if (body.planStartDate !== undefined) data.planStartDate = body.planStartDate ? new Date(body.planStartDate) : null;
  const s = await prisma.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return NextResponse.json(s);
}
