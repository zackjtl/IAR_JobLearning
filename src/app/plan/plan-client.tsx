"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Input, Progress, Segmented } from "@/components/ui";
import type { PlanTaskState } from "@/lib/plan";
import { api, cn } from "@/lib/utils";

type AgendaItem = { id: string; title: string; minutes: number; href: string; kind: string; day: number; done: boolean; auto: boolean };

const KIND_LABEL: Record<string, string> = { lesson: "課程", lab: "Lab", english: "英文", speaking: "口說", mock: "模擬面試", review: "複習", copilot: "Copilot", diagnostic: "診斷" };

export function PlanClient({ plan, tasks, dayIdx, startDate, today, dailyMinutes, agenda }: {
  plan: { day: number; theme: string; focus: string }[];
  tasks: PlanTaskState[];
  dayIdx: number | null;
  startDate: string | null;
  today: string;
  dailyMinutes: number;
  agenda: { day: number; items: AgendaItem[]; minutes: number; behind: number } | null;
}) {
  const router = useRouter();
  const [state, setState] = useState(() => Object.fromEntries(tasks.map((t) => [t.id, t.done])));
  const [date, setDate] = useState(startDate ?? today);
  const [busy, setBusy] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(dayIdx !== null ? Math.max(1, Math.min(14, dayIdx)) : 1);

  async function saveSettings(json: Record<string, unknown>) {
    setBusy(true);
    try {
      await api("/api/settings", { method: "POST", json });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  async function toggle(t: PlanTaskState | AgendaItem) {
    if (t.auto || t.id.startsWith("auto:")) return;
    const v = !state[t.id];
    setState((s) => ({ ...s, [t.id]: v }));
    try {
      await api("/api/plan", { method: "POST", json: { taskId: t.id, done: v } });
      router.refresh();
    } catch {
      setState((s) => ({ ...s, [t.id]: !v }));
    }
  }

  const doneCount = tasks.filter((t) => state[t.id]).length;
  const coreTotal = tasks.filter((t) => t.weight === "core").length;
  const coreDone = tasks.filter((t) => t.weight === "core" && state[t.id]).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title={dayIdx === null ? "開始計畫" : dayIdx > 14 ? "計畫已結束" : `今日任務 · 第 ${Math.max(1, dayIdx)} 天`}
            subtitle={agenda ? `每日 ${dailyMinutes} 分鐘模式 · 已排 ${agenda.minutes} 分鐘${agenda.behind ? ` · 落後 ${agenda.behind} 個核心任務（已優先排入）` : ""}` : "設定開始日期後，每天會依你的時間自動排出今日任務。"}
          />
          <CardBody>
            {dayIdx === null ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-[12px] text-muted">開始日期<Input type="date" className="mt-1 w-44" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                <Button disabled={busy} onClick={() => saveSettings({ planStartDate: date })}>開始 14 天計畫</Button>
              </div>
            ) : dayIdx < 1 ? (
              <p className="text-[13.5px] text-muted">計畫將於 {startDate} 開始。</p>
            ) : agenda && agenda.items.length === 0 ? (
              <Callout tone="ok" title="今天的任務都完成了">可以到「錯題與複習」或挑一個 Lab 加強弱項。</Callout>
            ) : (
              <ul className="space-y-2">
                {agenda?.items.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                    <button aria-label="標記完成" onClick={() => toggle(t)} className={cn("shrink-0", t.auto || t.id.startsWith("auto:") ? "cursor-default" : "cursor-pointer")}>
                      {state[t.id] ? <CheckCircle2 size={18} className="text-ok" /> : <Circle size={18} className="text-faint" />}
                    </button>
                    <Link href={t.href} className="group min-w-0 flex-1">
                      <div className="text-[14px] font-medium group-hover:text-accent">{t.title}</div>
                      <div className="text-[12px] text-faint">
                        {KIND_LABEL[t.kind] ?? t.kind} · {t.minutes} 分鐘{dayIdx !== null && t.day < Math.min(14, dayIdx) ? ` · 補第 ${t.day} 天` : ""}
                      </div>
                    </Link>
                    <ArrowRight size={15} className="shrink-0 text-faint" />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="進度與設定" />
          <CardBody className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-[13px]"><span>核心任務</span><span className="tabular-nums text-muted">{coreDone}/{coreTotal}</span></div>
              <Progress value={(coreDone / coreTotal) * 100} />
              <div className="mt-1 text-[12px] text-faint">全部任務 {doneCount}/{tasks.length}（課程、Lab、診斷會依實際完成自動打勾）</div>
            </div>
            <div>
              <div className="mb-1.5 text-[12.5px] text-muted">每日時間</div>
              <Segmented value={String(dailyMinutes)} onChange={(v) => saveSettings({ dailyMinutes: Number(v) })} options={[{ value: "30", label: "30 分" }, { value: "60", label: "60 分" }, { value: "90", label: "90 分" }]} />
              <p className="mt-1.5 text-[12px] text-faint">30 分鐘模式只排核心任務；60/90 分鐘會加上延伸任務。</p>
            </div>
            {startDate && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-[12px] text-muted">開始日期<Input type="date" className="mt-1 w-44" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                <Button size="sm" variant="outline" disabled={busy || date === startDate} onClick={() => saveSettings({ planStartDate: date })}>更新</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => saveSettings({ planStartDate: null })}>清除</Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-3">
        {plan.map((d) => {
          const ts = tasks.filter((t) => t.day === d.day);
          const n = ts.filter((t) => state[t.id]).length;
          const isToday = dayIdx === d.day;
          const open = openDay === d.day;
          return (
            <Card key={d.day} className={cn(isToday && "border-accent")}>
              <button className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left" onClick={() => setOpenDay(open ? null : d.day)} aria-expanded={open}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold tabular-nums", n === ts.length ? "bg-ok-soft text-ok" : isToday ? "bg-accent text-accent-fg" : "bg-surface-2")}>{d.day}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{d.theme}{isToday && <Badge tone="accent" className="ml-2">今天</Badge>}</div>
                  <div className="text-[12.5px] text-muted">{d.focus}</div>
                </div>
                <span className="text-[12px] tabular-nums text-muted">{n}/{ts.length}</span>
              </button>
              {open && (
                <CardBody className="border-t border-border pt-3">
                  <ul className="space-y-1.5">
                    {ts.map((t) => (
                      <li key={t.id} className="flex items-center gap-3">
                        <button aria-label="標記完成" onClick={() => toggle(t)} className={cn("shrink-0", t.auto ? "cursor-default" : "cursor-pointer")} title={t.auto ? "依實際進度自動完成" : "點擊切換"}>
                          {state[t.id] ? <CheckCircle2 size={17} className="text-ok" /> : <Circle size={17} className="text-faint" />}
                        </button>
                        <Link href={t.href} className="min-w-0 flex-1 text-[13.5px] hover:text-accent">{t.title}</Link>
                        {t.weight === "extra" && <Badge tone="neutral">延伸</Badge>}
                        {t.auto && <Badge tone="ok">自動</Badge>}
                        <span className="w-14 text-right text-[12px] tabular-nums text-faint">{t.minutes} 分</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
