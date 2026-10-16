"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { api, fmtDate } from "@/lib/utils";

type Note = { id: number; content: string; updatedAt: string };

export function NotesPanel({ refType, refId, placeholder }: { refType: string; refId: string; placeholder?: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const draftKey = `draft:${refType}:${refId}`;

  useEffect(() => {
    api<Note[]>(`/api/notes?refType=${refType}&refId=${encodeURIComponent(refId)}`)
      .then((n) => {
        setNotes(n);
        try {
          const d = localStorage.getItem(draftKey);
          if (d) setDraft(d);
        } catch {}
      })
      .catch(() => {});
  }, [refType, refId, draftKey]);

  function updateDraft(v: string) {
    setDraft(v);
    try {
      localStorage.setItem(draftKey, v);
    } catch {}
  }

  async function save() {
    setBusy(true);
    const n = await api<Note>("/api/notes", { method: "POST", json: { refType, refId, content: draft } });
    setNotes((x) => [n, ...x]);
    updateDraft("");
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Textarea rows={4} value={draft} onChange={(e) => updateDraft(e.target.value)} placeholder={placeholder ?? "寫下你的理解、疑問、或想在面試中用的例子…"} />
      <Button size="sm" onClick={save} disabled={busy || !draft.trim()}>
        儲存筆記
      </Button>
      {notes.map((n) => (
        <div key={n.id} className="group rounded-md border border-border bg-surface-2/50 px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[11.5px] text-faint">
            <span>{fmtDate(n.updatedAt)}</span>
            <button
              className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-bad cursor-pointer"
              aria-label="刪除筆記"
              onClick={async () => {
                await api(`/api/notes?id=${n.id}`, { method: "DELETE" });
                setNotes((x) => x.filter((y) => y.id !== n.id));
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="whitespace-pre-wrap text-[13.5px]">{n.content}</div>
        </div>
      ))}
    </div>
  );
}
