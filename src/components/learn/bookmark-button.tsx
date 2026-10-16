"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/utils";

export function BookmarkButton({ refType, refId, title, href, initial }: { refType: string; refId: string; title: string; href: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <Button
      variant={on ? "secondary" : "outline"}
      size="sm"
      onClick={async () => {
        const r = await api<{ bookmarked: boolean }>("/api/bookmarks", { method: "POST", json: { refType, refId, title, href } });
        setOn(r.bookmarked);
      }}
    >
      {on ? <BookmarkCheck size={15} className="text-accent" /> : <Bookmark size={15} />}
      {on ? "已加書籤" : "書籤"}
    </Button>
  );
}
