"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bookmark, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Empty, Input, Segmented, Textarea } from "@/components/ui";
import { Md } from "@/components/md";
import { api, fmtDate } from "@/lib/utils";

type NoteView = { id: number; refType: string; refId: string; title: string; content: string; updatedAt: string; label: string; href: string | null };
type BookmarkView = { id: number; refType: string; refId: string; title: string; href: string; createdAt: string };

const TYPE_LABEL: Record<string, string> = { all: "全部", lesson: "課程", lab: "Lab", english: "英文", general: "一般" };

export function NotesClient({ notes: initial, bookmarks: initialBm }: { notes: NoteView[]; bookmarks: BookmarkView[] }) {
  const [notes, setNotes] = useState(initial);
  const [bookmarks, setBookmarks] = useState(initialBm);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [newNote, setNewNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const types = ["all", ...Array.from(new Set(initial.map((n) => n.refType)))];
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return notes.filter((n) => (type === "all" || n.refType === type) && (!k || n.content.toLowerCase().includes(k) || n.label.toLowerCase().includes(k)));
  }, [notes, q, type]);

  async function save(n: NoteView) {
    try {
      await api("/api/notes", { method: "POST", json: { id: n.id, refType: n.refType, refId: n.refId, title: n.title, content: draft } });
      setNotes((xs) => xs.map((x) => (x.id === n.id ? { ...x, content: draft, updatedAt: new Date().toISOString() } : x)));
      setEditing(null);
    } catch {
      setErr("儲存失敗");
    }
  }
  async function remove(id: number) {
    if (!confirm("確定刪除這則筆記？")) return;
    try {
      await api(`/api/notes?id=${id}`, { method: "DELETE" });
      setNotes((xs) => xs.filter((x) => x.id !== id));
    } catch {
      setErr("刪除失敗");
    }
  }
  async function addGeneral() {
    if (!newNote.trim()) return;
    try {
      const n = await api<{ id: number; updatedAt: string }>("/api/notes", { method: "POST", json: { refType: "general", refId: "general", title: "", content: newNote } });
      setNotes((xs) => [{ id: n.id, refType: "general", refId: "general", title: "", content: newNote, updatedAt: n.updatedAt, label: "一般筆記", href: null }, ...xs]);
      setNewNote("");
    } catch {
      setErr("新增失敗");
    }
  }
  async function unbookmark(b: BookmarkView) {
    try {
      await api("/api/bookmarks", { method: "POST", json: { refType: b.refType, refId: b.refId, title: b.title, href: b.href } });
      setBookmarks((xs) => xs.filter((x) => x.id !== b.id));
    } catch {
      setErr("移除書籤失敗");
    }
  }
  function exportMd() {
    const lines = ["# 學習筆記匯出", "", `匯出時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`, ""];
    for (const n of shown) {
      lines.push(`## ${n.label}`, "", `更新：${fmtDate(n.updatedAt)}`, "", n.content, "");
    }
    if (bookmarks.length) {
      lines.push("## 書籤", "");
      for (const b of bookmarks) lines.push(`- [${b.title}](${b.href})`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iar-fae-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="搜尋筆記內容…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          {types.length > 2 && <Segmented value={type} onChange={setType} options={types.map((t) => ({ value: t, label: TYPE_LABEL[t] ?? t }))} />}
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportMd} disabled={shown.length === 0 && bookmarks.length === 0}>
            <Download size={14} /> 匯出 Markdown
          </Button>
        </div>
        {err && <p className="text-[13px] text-bad">{err}</p>}
        {shown.length === 0 ? (
          <Empty>{notes.length === 0 ? "還沒有筆記。在課程、Lab 或英文題頁面下方都可以寫筆記，也可以在右側新增一般筆記。" : "沒有符合條件的筆記。"}</Empty>
        ) : (
          shown.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
                <Badge tone="neutral">{TYPE_LABEL[n.refType] ?? n.refType}</Badge>
                {n.href ? <Link href={n.href} className="min-w-0 flex-1 truncate text-[13.5px] font-medium hover:text-accent">{n.label}</Link> : <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{n.label}</span>}
                <span className="text-[12px] text-faint">{fmtDate(n.updatedAt)}</span>
                <button aria-label="編輯" className="cursor-pointer text-faint hover:text-fg" onClick={() => { setEditing(n.id); setDraft(n.content); }}><Pencil size={15} /></button>
                <button aria-label="刪除" className="cursor-pointer text-faint hover:text-bad" onClick={() => remove(n.id)}><Trash2 size={15} /></button>
              </div>
              <CardBody>
                {editing === n.id ? (
                  <div className="space-y-2">
                    <Textarea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => save(n)} disabled={!draft.trim()}>儲存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <Md text={n.content} className="text-[14px]" />
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="新增一般筆記" subtitle="支援 Markdown" />
          <CardBody className="space-y-2">
            <Textarea rows={4} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="例如：面試要問的問題、想到的 STAR 故事…" />
            <Button size="sm" onClick={addGeneral} disabled={!newNote.trim()}><Plus size={14} /> 新增</Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="書籤" subtitle={`${bookmarks.length} 個`} />
          <CardBody>
            {bookmarks.length === 0 ? (
              <p className="text-[13px] text-muted">在課程或 Lab 頁面按「書籤」即可加入。</p>
            ) : (
              <ul className="space-y-1.5">
                {bookmarks.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 text-[13.5px]">
                    <Bookmark size={14} className="shrink-0 text-accent" />
                    <Link href={b.href} className="min-w-0 flex-1 truncate hover:text-accent">{b.title}</Link>
                    <button aria-label="移除書籤" className="cursor-pointer text-faint hover:text-bad" onClick={() => unbookmark(b)}><Trash2 size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
