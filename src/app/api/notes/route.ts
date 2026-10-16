import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const refType = u.searchParams.get("refType");
  const refId = u.searchParams.get("refId");
  const where = refType && refId ? { refType, refId } : refType ? { refType } : {};
  const notes = await prisma.note.findMany({ where, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const b = (await req.json()) as { id?: number; refType: string; refId: string; title?: string; content: string };
  if (!b.content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  const note = b.id
    ? await prisma.note.update({ where: { id: b.id }, data: { content: b.content, title: b.title ?? "" } })
    : await prisma.note.create({ data: { refType: b.refType, refId: b.refId, title: b.title ?? "", content: b.content } });
  return NextResponse.json(note);
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
