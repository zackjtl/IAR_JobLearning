import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await prisma.bookmark.findMany({ orderBy: { createdAt: "desc" } }));
}

/** Toggle a bookmark. */
export async function POST(req: Request) {
  const b = (await req.json()) as { refType: string; refId: string; title: string; href: string };
  const existing = await prisma.bookmark.findUnique({ where: { refType_refId: { refType: b.refType, refId: b.refId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }
  await prisma.bookmark.create({ data: b });
  return NextResponse.json({ bookmarked: true });
}
