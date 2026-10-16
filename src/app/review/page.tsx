import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { LESSON_BY_ID } from "@/content/catalog";
import { ReviewClient, type ReviewCardView } from "./review-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "錯題與複習" };

export default async function ReviewPage() {
  const now = new Date();
  const [due, total, byKind, upcoming, progressCount, termCount] = await Promise.all([
    prisma.reviewCard.findMany({ where: { due: { lte: now }, suspended: false }, orderBy: { due: "asc" }, take: 60 }),
    prisma.reviewCard.count({ where: { suspended: false } }),
    prisma.reviewCard.groupBy({ by: ["kind"], _count: { _all: true }, where: { suspended: false } }),
    prisma.reviewCard.findMany({ where: { due: { gt: now }, suspended: false }, select: { due: true }, orderBy: { due: "asc" }, take: 500 }),
    prisma.lessonProgress.count(),
    prisma.reviewCard.count({ where: { kind: "term" } }),
  ]);
  // next 7 days forecast
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const end = new Date(now.getTime() + (i + 1) * 86400000);
    const start = new Date(now.getTime() + i * 86400000);
    return { label: i === 0 ? "24h 內" : `第 ${i + 1} 天`, n: upcoming.filter((c) => c.due > start && c.due <= end).length };
  });
  const cards: ReviewCardView[] = due.map((c) => ({
    id: c.id,
    kind: c.kind as ReviewCardView["kind"],
    skill: c.skill,
    front: c.front,
    back: c.back,
    reps: c.reps,
    lapses: c.lapses,
    interval: c.interval,
    ease: c.ease,
    lessonTitle: (() => {
      try {
        const id = (JSON.parse(c.front) as { lessonId?: string }).lessonId;
        return id ? LESSON_BY_ID[id]?.title ?? null : null;
      } catch {
        return null;
      }
    })(),
  }));
  return (
    <>
      <PageHeader title="錯題與複習" subtitle="間隔重複（SM-2）：答錯的 Quiz 題會自動加入，課程術語可一鍵加入。到期就複習，依你的自評安排下次出現的時間。" />
      <ReviewClient
        cards={cards}
        total={total}
        kinds={Object.fromEntries(byKind.map((k) => [k.kind, k._count._all]))}
        forecast={forecast}
        hasProgress={progressCount > 0}
        termCount={termCount}
      />
    </>
  );
}
