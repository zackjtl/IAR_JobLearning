import "server-only";
import { prisma, parseJson } from "./db";
import { SKILLS, ENGLISH_SUBSKILLS, type SkillId, type EnglishSubSkill } from "@/content/skills";
import { LESSONS, TRACKS } from "@/content/catalog";
import { clamp, dayKey } from "./utils";

export type SkillScore = { id: SkillId; score: number | null; baseline: number | null; samples: number };

type DiagScores = Partial<Record<SkillId, number>>;
type DiagSelf = { english?: Partial<Record<EnglishSubSkill, number>>; listening?: number };

export async function latestDiagnostic() {
  const d = await prisma.diagnosticResult.findFirst({ orderBy: { createdAt: "desc" } });
  if (!d) return null;
  return {
    id: d.id,
    createdAt: d.createdAt,
    scores: parseJson<DiagScores>(d.scoresJson, {}),
    self: parseJson<DiagSelf>(d.selfJson, {}),
  };
}

/** Exponentially weighted accuracy, newest attempts weigh most. */
function ewma(values: number[], alpha = 0.15) {
  if (values.length === 0) return null;
  let acc = values[0];
  for (let i = 1; i < values.length; i++) acc = alpha * values[i] + (1 - alpha) * acc;
  return acc;
}

/**
 * Skill estimate = diagnostic baseline blended with evidence collected after it
 * (lesson quizzes, reviews, scored practice). With no diagnostic, needs ≥3 samples.
 */
export async function skillScores(): Promise<SkillScore[]> {
  const diag = await latestDiagnostic();
  const since = diag?.createdAt ?? new Date(0);
  const attempts = await prisma.quizAttempt.findMany({
    where: { createdAt: { gt: since }, source: { not: "diagnostic" } },
    orderBy: { createdAt: "asc" },
    select: { skill: true, correct: true },
  });
  const scored = await prisma.activity.findMany({
    where: { createdAt: { gt: since }, score: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { skill: true, score: true },
  });

  return SKILLS.map((s) => {
    const vals = [
      ...attempts.filter((a) => a.skill === s.id).map((a) => (a.correct ? 100 : 0)),
      ...scored.filter((a) => a.skill === s.id).map((a) => a.score ?? 0),
    ];
    const baseline = diag?.scores[s.id] ?? null;
    const evidence = ewma(vals);
    let score: number | null = null;
    if (baseline !== null && evidence !== null) {
      const w = (Math.min(vals.length, 20) / 20) * 0.7;
      score = baseline * (1 - w) + evidence * w;
    } else if (baseline !== null) score = baseline;
    else if (evidence !== null && vals.length >= 3) score = evidence;
    return { id: s.id, score: score === null ? null : Math.round(clamp(score)), baseline, samples: vals.length };
  });
}

export type EnglishScore = { id: EnglishSubSkill; score: number | null };

export async function englishScores(): Promise<EnglishScore[]> {
  const diag = await latestDiagnostic();
  const acts = await prisma.activity.findMany({
    where: { type: { in: ["english", "speaking", "mock"] }, createdAt: { gt: diag?.createdAt ?? new Date(0) } },
    orderBy: { createdAt: "asc" },
    select: { payloadJson: true },
  });
  const sub: Record<string, number[]> = {};
  for (const a of acts) {
    const p = parseJson<{ subScores?: Partial<Record<EnglishSubSkill, number>> }>(a.payloadJson, {});
    for (const [k, v] of Object.entries(p.subScores ?? {})) if (typeof v === "number") (sub[k] ??= []).push(v);
  }
  return ENGLISH_SUBSKILLS.map((e) => {
    let base: number | null = null;
    const self = diag?.self.english?.[e.id];
    if (typeof self === "number") base = self * 20;
    if (e.id === "listening" && typeof diag?.self.listening === "number") {
      base = base === null ? diag.self.listening : base * 0.5 + diag.self.listening * 0.5;
    }
    const ev = ewma(sub[e.id] ?? []);
    let score = base;
    if (base !== null && ev !== null) {
      const w = (Math.min(sub[e.id].length, 10) / 10) * 0.7;
      score = base * (1 - w) + ev * w;
    } else if (ev !== null) score = ev;
    return { id: e.id, score: score === null ? null : Math.round(clamp(score)) };
  });
}

export async function lessonProgressMap() {
  const rows = await prisma.lessonProgress.findMany();
  return Object.fromEntries(rows.map((r) => [r.lessonId, r]));
}

export async function moduleCompletion() {
  const prog = await lessonProgressMap();
  return TRACKS.map((t) => {
    const ls = LESSONS.filter((l) => l.track === t.id);
    const done = ls.filter((l) => prog[l.id]?.status === "completed").length;
    const started = ls.filter((l) => prog[l.id]).length;
    return { id: t.id, title: t.title, en: t.en, total: ls.length, done, started };
  });
}

/** Minutes studied per day (Asia/Taipei). Quiz answers count ~1 min each. */
export async function minutesByDay(days = 14) {
  const from = new Date(Date.now() - days * 24 * 3600 * 1000);
  const [acts, quiz] = await Promise.all([
    prisma.activity.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true, minutes: true } }),
    prisma.quizAttempt.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
  ]);
  const map: Record<string, number> = {};
  for (const a of acts) map[dayKey(a.createdAt)] = (map[dayKey(a.createdAt)] ?? 0) + a.minutes;
  for (const q of quiz) map[dayKey(q.createdAt)] = (map[dayKey(q.createdAt)] ?? 0) + 1;
  const out: { day: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(new Date(Date.now() - i * 24 * 3600 * 1000));
    out.push({ day: k, minutes: map[k] ?? 0 });
  }
  return out;
}

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

export type RecentItem = { at: Date; kind: string; title: string; detail?: string; href?: string };

export async function recentActivity(limit = 8): Promise<RecentItem[]> {
  const [acts, quiz] = await Promise.all([
    prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    prisma.quizAttempt.groupBy({
      by: ["refId", "source"],
      _count: { _all: true },
      _max: { createdAt: true },
      where: { source: "lesson" },
      orderBy: { _max: { createdAt: "desc" } },
      take: limit,
    }),
  ]);
  const lessonTitle = Object.fromEntries(LESSONS.map((l) => [l.id, l.title]));
  const items: RecentItem[] = [
    ...acts.map((a) => ({
      at: a.createdAt,
      kind: a.type,
      title: parseJson<{ title?: string }>(a.payloadJson, {}).title ?? a.refId,
      detail: a.score !== null ? `${a.score} 分` : undefined,
    })),
    ...quiz.map((q) => ({
      at: q._max.createdAt ?? new Date(0),
      kind: "quiz",
      title: `Quiz：${lessonTitle[q.refId] ?? q.refId}`,
      detail: `${q._count._all} 題`,
    })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Lessons with the worst recent quiz accuracy (needs ≥2 answers). */
export async function weakLessons(limit = 5) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { source: { in: ["lesson", "review"] } },
    select: { refId: true, correct: true },
  });
  const agg: Record<string, { n: number; ok: number }> = {};
  for (const a of attempts) {
    agg[a.refId] ??= { n: 0, ok: 0 };
    agg[a.refId].n++;
    if (a.correct) agg[a.refId].ok++;
  }
  return Object.entries(agg)
    .filter(([, v]) => v.n >= 2)
    .map(([id, v]) => ({ id, acc: Math.round((v.ok / v.n) * 100), n: v.n }))
    .filter((x) => x.acc < 80)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, limit);
}
