import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { Badge, Callout, Card, CardBody, CardHeader, Empty, PageHeader, Progress, Stat, buttonClass } from "@/components/ui";
import { SkillRadar } from "@/components/charts/radar";
import { MinutesBar } from "@/components/charts/minutes-bar";
import { SKILLS, ENGLISH_SUBSKILLS, SKILL_LABEL } from "@/content/skills";
import { LESSONS, LESSON_BY_ID } from "@/content/catalog";
import { prisma } from "@/lib/db";
import {
  englishScores, getSettings, latestDiagnostic, lessonProgressMap, minutesByDay, moduleCompletion, recentActivity, skillScores, weakLessons,
} from "@/lib/progress";
import { recommendations } from "@/lib/recommend";
import { ENABLED_ROUTES } from "@/components/layout/enabled";
import { dayKey, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  quiz: "Quiz", diagnostic: "診斷", english: "英文", speaking: "口說", mock: "模擬面試", lab: "Lab", copilot: "Copilot", lesson: "課程", review: "複習", plan: "計畫",
};

export default async function Dashboard() {
  const [diag, scores, eng, modules, minutes, settings, recent, weak, progress, dueCards] = await Promise.all([
    latestDiagnostic(),
    skillScores(),
    englishScores(),
    moduleCompletion(),
    minutesByDay(14),
    getSettings(),
    recentActivity(8),
    weakLessons(5),
    lessonProgressMap(),
    prisma.reviewCard.count({ where: { due: { lte: new Date() }, suspended: false } }),
  ]);
  const recs = await recommendations(scores, !!diag, progress, ENABLED_ROUTES);

  const assessed = scores.filter((s) => s.score !== null);
  const readiness = assessed.length ? Math.round(assessed.reduce((a, s) => a + (s.score ?? 0), 0) / assessed.length) : null;
  const lessonsDone = Object.values(progress).filter((p) => p.status === "completed").length;
  const today = minutes.find((m) => m.day === dayKey())?.minutes ?? 0;
  const weakSkills = [...assessed].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);

  return (
    <>
      <PageHeader
        title="學習儀表板"
        subtitle="目標：IAR Systems 台灣 FAE / Technical Support Specialist。分數為依作答紀錄估計的能力值，不是預設值。"
        actions={
          <Link href="/jd" className={buttonClass("outline", "sm")}>
            查看 JD 差距
          </Link>
        }
      />

      {!diag && (
        <Callout tone="accent" className="mb-5" title="第一步：完成初始診斷測驗">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>能力雷達圖目前是空的 —— 平台不會假設你的能力。約 25 分鐘的診斷會建立第一個基準。</span>
            <Link href="/diagnostic" className={buttonClass("primary", "sm")}>
              <ClipboardCheck size={15} /> 開始診斷
            </Link>
          </div>
        </Callout>
      )}

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <Stat label="面試準備度（估計）" value={readiness === null ? "—" : `${readiness}`} hint={readiness === null ? "完成診斷後顯示" : `已評估 ${assessed.length}/8 個面向`} />
        </Card>
        <Card className="p-4">
          <Stat label="課程完成" value={`${lessonsDone}/${LESSONS.length}`} hint="6 個 Track" />
        </Card>
        <Card className="p-4">
          <Stat label="到期複習卡" value={dueCards} hint="錯題自動加入" />
        </Card>
        <Card className="p-4">
          <Stat label="今日學習" value={`${today} 分`} hint={`每日目標 ${settings.dailyMinutes} 分鐘`} />
          <Progress className="mt-2" value={(today / settings.dailyMinutes) * 100} tone={today >= settings.dailyMinutes ? "ok" : "accent"} />
        </Card>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="技術與職能雷達" subtitle="實線＝目前估計（診斷基準 + 之後的練習）；虛線＝診斷基準" />
          <CardBody>
            {diag ? (
              <SkillRadar data={SKILLS.map((s) => ({ label: s.short, current: scores.find((x) => x.id === s.id)?.score ?? null, baseline: scores.find((x) => x.id === s.id)?.baseline ?? null }))} />
            ) : (
              <Empty>完成診斷測驗後顯示</Empty>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="英文能力雷達" subtitle="診斷自評 + 聽力測驗為起點，之後依口說/面試練習的評估更新" />
          <CardBody>
            {eng.some((e) => e.score !== null) ? (
              <SkillRadar showBaseline={false} data={ENGLISH_SUBSKILLS.map((e) => ({ label: e.label, current: eng.find((x) => x.id === e.id)?.score ?? null }))} />
            ) : (
              <Empty>完成診斷測驗後顯示</Empty>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="建議下一步" subtitle="依弱項、到期複習與完成度自動產生" />
          <CardBody className="space-y-2">
            {recs.length === 0 && <Empty>目前沒有建議 —— 繼續保持！</Empty>}
            {recs.map((r) => (
              <Link key={r.href + r.title} href={r.href} className="group flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3 hover:border-accent">
                <div className="min-w-0">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-[13px] text-muted">{r.reason}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[12px] text-faint">
                  約 {r.minutes} 分 <ArrowRight size={15} className="text-muted group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="薄弱主題" />
          <CardBody className="space-y-2.5">
            {weakSkills.length === 0 && weak.length === 0 && <Empty>尚無資料</Empty>}
            {weakSkills.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span>{SKILL_LABEL[s.id]}</span>
                  <span className="tabular-nums text-muted">{s.score}</span>
                </div>
                <Progress value={s.score ?? 0} tone={(s.score ?? 0) < 50 ? "bad" : (s.score ?? 0) < 75 ? "warn" : "ok"} />
              </div>
            ))}
            {weak.length > 0 && (
              <div className="pt-2">
                <div className="mb-1 text-[12px] font-medium text-faint">Quiz 正確率偏低的課程</div>
                {weak.map((w) => (
                  <Link key={w.id} href={`/learn/${w.id}`} className="flex justify-between py-0.5 text-[13px] hover:text-accent">
                    <span className="truncate">{LESSON_BY_ID[w.id]?.title ?? w.id}</span>
                    <span className="tabular-nums text-bad">{w.acc}%</span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="各模組完成率" />
          <CardBody className="space-y-3">
            {modules.map((m) => (
              <div key={m.id}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span>{m.en}</span>
                  <span className="tabular-nums text-muted">
                    {m.done}/{m.total}
                  </span>
                </div>
                <Progress value={(m.done / m.total) * 100} />
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="每日學習時間" subtitle="近 14 天（Quiz 每題計 1 分鐘）" />
          <CardBody>
            <MinutesBar data={minutes} goal={settings.dailyMinutes} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="最近練習紀錄" />
          <CardBody className="space-y-2">
            {recent.length === 0 && <Empty>還沒有紀錄</Empty>}
            {recent.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-[13px]">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge>{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                  <span className="truncate">{r.title}</span>
                </div>
                <span className="shrink-0 text-[11.5px] text-faint">{r.detail ? `${r.detail} · ` : ""}{fmtDate(r.at)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
