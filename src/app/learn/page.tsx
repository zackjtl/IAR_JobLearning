import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { LESSONS, TRACKS } from "@/content/catalog";
import { LESSON_CONTENT } from "@/content/lessons";
import { lessonProgressMap } from "@/lib/progress";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "技術課程" };

export default async function LearnPage() {
  const progress = await lessonProgressMap();
  return (
    <>
      <PageHeader
        title="Technical Learning Center"
        subtitle="六個 Track、由淺入深。每課含 11 個部分：目標、概念、名詞、圖解、程式、原理、案例、客戶問題、面試題、Quiz、延伸閱讀。標示「延伸補強」者為 JD 未明確要求的主題。"
      />
      <div className="space-y-6">
        {TRACKS.map((t) => {
          const lessons = LESSONS.filter((l) => l.track === t.id && LESSON_CONTENT[l.id]);
          if (lessons.length === 0) return null;
          const done = lessons.filter((l) => progress[l.id]?.status === "completed").length;
          return (
            <Card key={t.id}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-semibold">{t.title}</h2>
                  <p className="mt-0.5 text-[13px] text-muted">{t.desc}</p>
                </div>
                <div className="w-40">
                  <div className="mb-1 text-right text-[12px] tabular-nums text-muted">
                    {done}/{lessons.length} 完成
                  </div>
                  <Progress value={(done / lessons.length) * 100} />
                </div>
              </div>
              <ul>
                {lessons.map((l, i) => {
                  const p = progress[l.id];
                  const Icon = p?.status === "completed" ? CheckCircle2 : p ? CircleDot : Circle;
                  return (
                    <li key={l.id} className="border-b border-border last:border-0">
                      <Link href={`/learn/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                        <Icon size={18} className={p?.status === "completed" ? "text-ok" : p ? "text-accent" : "text-faint"} />
                        <span className="w-6 font-mono text-[12px] text-faint">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-medium">{l.title}</div>
                          <div className="truncate text-[12.5px] text-muted">{l.en}</div>
                        </div>
                        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                          {!l.jdExplicit && <Badge tone="warn">延伸補強</Badge>}
                          <Badge>{l.level}</Badge>
                          <Badge>{l.minutes} 分</Badge>
                          {p?.bestScore ? <Badge tone={p.bestScore >= 80 ? "ok" : "warn"}>Quiz {p.bestScore}</Badge> : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
