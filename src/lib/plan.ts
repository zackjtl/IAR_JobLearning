import "server-only";
import { prisma } from "./db";
import { PLAN, ALL_PLAN_TASKS, type PlanTaskDef } from "@/content/plan";
import { dayKey } from "./utils";

export type PlanTaskState = PlanTaskDef & { day: number; done: boolean; auto: boolean };

/** Day number (1-based) of the plan for today in Asia/Taipei, or null if no start date. */
export function planDayIndex(start: Date | null | undefined, now = new Date()): number | null {
  if (!start) return null;
  const a = Date.parse(dayKey(start) + "T00:00:00Z");
  const b = Date.parse(dayKey(now) + "T00:00:00Z");
  return Math.floor((b - a) / 86400000) + 1;
}

/** All plan tasks with completion: manual (PlanTask table) or auto-detected from progress. */
export async function planState(): Promise<PlanTaskState[]> {
  const [manual, lessons, labs, diag] = await Promise.all([
    prisma.planTask.findMany(),
    prisma.lessonProgress.findMany({ where: { status: "completed" }, select: { lessonId: true } }),
    prisma.activity.findMany({ where: { type: "lab" }, select: { refId: true }, distinct: ["refId"] }),
    prisma.diagnosticResult.count(),
  ]);
  const m = Object.fromEntries(manual.map((t) => [t.taskId, t.done]));
  const lessonDone = new Set(lessons.map((l) => l.lessonId));
  const labDone = new Set(labs.map((l) => l.refId));
  return ALL_PLAN_TASKS.map((t) => {
    let auto = false;
    if (t.kind === "lesson" && t.ref && lessonDone.has(t.ref)) auto = true;
    if (t.kind === "lab" && t.ref && labDone.has(t.ref)) auto = true;
    if (t.kind === "diagnostic" && diag > 0) auto = true;
    return { ...t, done: auto || m[t.id] === true, auto };
  });
}

/**
 * Today's agenda sized to the daily budget: unfinished core tasks up to today first (catch-up),
 * then due reviews, then extra tasks of today.
 */
export function todayAgenda(tasks: PlanTaskState[], dayIdx: number, budget: number, dueCards: number) {
  const day = Math.max(1, Math.min(PLAN.length, dayIdx));
  const pending = tasks.filter((t) => !t.done && t.day <= day);
  const ordered = [
    ...pending.filter((t) => t.weight === "core" && t.day === day),
    ...pending.filter((t) => t.weight === "core" && t.day < day),
    // 30-minute mode: core tasks only
    ...(budget > 30 ? pending.filter((t) => t.weight === "extra" && t.day === day) : []),
    ...(budget > 30 ? pending.filter((t) => t.weight === "extra" && t.day < day) : []),
  ];
  const out: (PlanTaskState | { id: string; title: string; minutes: number; href: string; kind: "review"; day: number; done: false; auto: false })[] = [];
  let used = 0;
  const hasReviewTask = ordered.some((t) => t.kind === "review");
  if (dueCards > 0 && !hasReviewTask) {
    const m = Math.min(15, Math.max(5, Math.ceil(dueCards / 2)));
    out.push({ id: "auto:review", title: `複習 ${dueCards} 張到期卡片`, minutes: m, href: "/review", kind: "review", day, done: false, auto: false });
    used += m;
  }
  for (const t of ordered) {
    if (used + t.minutes > budget && out.length > 0) continue;
    out.push(t);
    used += t.minutes;
  }
  return { day, items: out, minutes: used, behind: pending.filter((t) => t.weight === "core" && t.day < day).length };
}
