import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LESSON_BY_ID } from "@/content/catalog";
import { LAB_BY_ID } from "@/content/labs";
import { ENGLISH_QS } from "@/content/english";
import { NotesClient } from "./notes-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "筆記與書籤" };

function refInfo(refType: string, refId: string): { label: string; href: string | null } {
  if (refType === "lesson") return { label: `課程：${LESSON_BY_ID[refId]?.title ?? refId}`, href: LESSON_BY_ID[refId] ? `/learn/${refId}` : null };
  if (refType === "lab") return { label: `Lab：${LAB_BY_ID[refId]?.title ?? refId}`, href: LAB_BY_ID[refId] ? `/labs/${refId}` : null };
  if (refType === "english") {
    const q = ENGLISH_QS.find((x) => x.id === refId);
    return { label: `英文題：${q?.en ?? refId}`, href: q ? `/english?cat=${q.cat}` : "/english" };
  }
  return { label: refType === "general" ? "一般筆記" : `${refType}：${refId}`, href: null };
}

export default async function NotesPage() {
  const [notes, bookmarks] = await Promise.all([
    prisma.note.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.bookmark.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <PageHeader title="筆記與書籤" subtitle="所有課程、Lab、英文題的筆記集中在這裡；可以搜尋、編輯、匯出成 Markdown。" />
      <NotesClient
        notes={notes.map((n) => ({ id: n.id, refType: n.refType, refId: n.refId, title: n.title, content: n.content, updatedAt: n.updatedAt.toISOString(), ...refInfo(n.refType, n.refId) }))}
        bookmarks={bookmarks.map((b) => ({ id: b.id, refType: b.refType, refId: b.refId, title: b.title, href: b.href, createdAt: b.createdAt.toISOString() }))}
      />
    </>
  );
}
