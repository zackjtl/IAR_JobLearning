import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/progress";
import { planDayIndex, planState, todayAgenda } from "@/lib/plan";
import { PLAN } from "@/content/plan";
import { dayKey } from "@/lib/utils";
import { PlanClient } from "./plan-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "14 天計畫" };

export default async function PlanPage() {
  const [settings, tasks, due] = await Promise.all([
    getSettings(),
    planState(),
    prisma.reviewCard.count({ where: { due: { lte: new Date() }, suspended: false } }),
  ]);
  const dayIdx = planDayIndex(settings.planStartDate);
  const agenda = dayIdx !== null ? todayAgenda(tasks, dayIdx, settings.dailyMinutes, due) : null;
  return (
    <>
      <PageHeader
        title="14 天學習計畫"
        subtitle="依優先順序安排：英文自我介紹與獵頭題 → Compiler/Linker 基礎 → Debug 與最佳化 → IAR 工具鏈 → FAE 情境 → 技術主管模擬面試。這是建議節奏，不代表已知的面試日期；落後時「今日任務」會自動補上之前的核心任務。"
      />
      <PlanClient
        plan={PLAN.map((d) => ({ day: d.day, theme: d.theme, focus: d.focus }))}
        tasks={tasks}
        dayIdx={dayIdx}
        startDate={settings.planStartDate ? dayKey(settings.planStartDate) : null}
        today={dayKey()}
        dailyMinutes={settings.dailyMinutes}
        agenda={agenda}
      />
    </>
  );
}
