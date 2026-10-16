import "server-only";
import { prisma } from "./db";
import { LESSONS } from "@/content/catalog";
import { LESSON_CONTENT } from "@/content/lessons";
import { SKILL_LABEL } from "@/content/skills";
import type { SkillScore } from "./progress";

export type Recommendation = { title: string; reason: string; href: string; minutes: number };

export async function recommendations(scores: SkillScore[], hasDiagnostic: boolean, progress: Record<string, { status: string }>, enabled: string[]): Promise<Recommendation[]> {
  const out: Recommendation[] = [];
  if (!hasDiagnostic) {
    out.push({ title: "完成初始診斷測驗", reason: "還沒有能力基準；所有建議都依此產生。", href: "/diagnostic", minutes: 25 });
  }
  if (enabled.includes("/review")) {
    const due = await prisma.reviewCard.count({ where: { due: { lte: new Date() }, suspended: false } });
    if (due >= 5) out.push({ title: `複習 ${due} 張到期卡片`, reason: "間隔重複：到期就複習，記憶最穩固。", href: "/review", minutes: Math.min(20, due) });
  }
  const ranked = scores.filter((s) => s.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  for (const s of ranked) {
    if (out.length >= 3) break;
    if (s.id === "english") {
      if (enabled.includes("/english")) out.push({ title: "英文自我介紹與獵頭面談練習", reason: `英文溝通目前估計 ${s.score} 分，是面試第一關。`, href: "/english", minutes: 30 });
      continue;
    }
    const next = LESSONS.find((l) => l.skill === s.id && LESSON_CONTENT[l.id] && progress[l.id]?.status !== "completed");
    if (next && enabled.includes("/learn")) {
      out.push({ title: next.title, reason: `${SKILL_LABEL[s.id]} 目前估計 ${s.score} 分（最弱項之一）。`, href: `/learn/${next.id}`, minutes: next.minutes });
    }
  }
  return out.slice(0, 3);
}
