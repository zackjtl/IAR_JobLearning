"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/utils";

export function VisitTracker({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    api("/api/lesson", { method: "POST", json: { lessonId, action: "visit" } }).catch(() => {});
  }, [lessonId]);
  return null;
}

export function CompleteButton({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  return (
    <Button
      size="sm"
      variant={done ? "secondary" : "primary"}
      onClick={async () => {
        await api("/api/lesson", { method: "POST", json: { lessonId, action: done ? "reopen" : "complete" } });
        setDone(!done);
        router.refresh();
      }}
    >
      <CheckCircle2 size={15} className={done ? "text-ok" : ""} />
      {done ? "已完成（點擊取消）" : "標記完成"}
    </Button>
  );
}
