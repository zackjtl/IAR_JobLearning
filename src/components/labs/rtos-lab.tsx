"use client";

import { useMemo, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Segmented } from "@/components/ui";
import { RTOS_SCENARIOS } from "@/content/labs";
import { simulate } from "@/lib/rtos-sim";
import { cn } from "@/lib/utils";

export function RtosLab() {
  const [sid, setSid] = useState(RTOS_SCENARIOS[0].id);
  const [inherit, setInherit] = useState(false);
  const sc = RTOS_SCENARIOS.find((s) => s.id === sid)!;
  const res = useMemo(() => simulate(sc.tasks, inherit), [sc, inherit]);
  const other = useMemo(() => simulate(sc.tasks, !inherit), [sc, inherit]);
  const [tick, setTick] = useState<number | null>(null);
  const T = res.timeline.length;
  const H = sc.tasks[0];
  const resp = (r: typeof res) => (r.finish[H.name] ?? T) - H.release;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={sid} onChange={(v) => { setSid(v); setTick(null); }} options={RTOS_SCENARIOS.map((s) => ({ value: s.id, label: s.title }))} />
        <Segmented value={inherit ? "on" : "off"} onChange={(v) => setInherit(v === "on")} options={[{ value: "off", label: "無 inheritance（binary semaphore）" }, { value: "on", label: "Priority inheritance（mutex）" }]} />
      </div>
      <p className="text-[13px] text-muted">{sc.desc}</p>

      <div className="grid gap-4 md:grid-cols-3">
        {sc.tasks.map((t) => (
          <Card key={t.name}>
            <CardBody>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: t.color }} />
                <span className="font-semibold">Task {t.name}</span>
                <Badge tone="neutral">優先權 {t.prio}</Badge>
              </div>
              <div className="mt-1 text-[12.5px] text-muted">tick {t.release} ready；腳本 <code className="font-mono">{t.script}</code></div>
              <div className="mt-1 text-[12.5px]">完成於 tick <b className="tabular-nums">{res.finish[t.name] ?? "—"}</b>{t.name === H.name && <> · 回應時間 <b className="tabular-nums">{resp(res)}</b> ticks</>}</div>
            </CardBody>
          </Card>
        ))}
      </div>
      <p className="text-[12px] text-faint">腳本：c = 執行 1 tick、L = 取得 mutex、U = 釋放 mutex（L/U 不佔時間）。</p>

      <Card>
        <CardHeader
          title="甘特圖"
          subtitle="每格 1 tick；斜線 = 該 task ready 但在等 mutex（blocked）；外框 = 持有 mutex；數字 = 當下有效優先權"
          action={sc.id === "inversion" ? <Badge tone={inherit ? "ok" : "bad"}>H 回應時間 {resp(res)} ticks（另一模式 {resp(other)}）</Badge> : null}
        />
        <CardBody className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex pl-10 text-[10.5px] text-faint">
              {res.timeline.map((_, i) => <div key={i} className="flex-1 text-center tabular-nums">{i}</div>)}
            </div>
            {sc.tasks.map((t) => (
              <div key={t.name} className="flex items-center">
                <div className="w-10 shrink-0 text-[13px] font-semibold">{t.name}</div>
                {res.timeline.map((run, i) => {
                  const isRun = run === t.name;
                  const blk = res.blocked[t.name][i];
                  const holds = res.owner[i] === t.name;
                  const boosted = res.effPrio[t.name][i] !== t.prio;
                  return (
                    <button
                      key={i}
                      onClick={() => setTick(i)}
                      className={cn("relative m-[1px] h-8 flex-1 cursor-pointer rounded-sm text-[10px] tabular-nums", !isRun && "bg-surface-2", holds && "ring-2 ring-fg/70 ring-inset", tick === i && "outline outline-2 outline-accent")}
                      style={{
                        background: isRun ? t.color : undefined,
                        backgroundImage: blk ? "repeating-linear-gradient(45deg, transparent, transparent 3px, var(--bad) 3px, var(--bad) 4px)" : undefined,
                      }}
                      title={`tick ${i}`}
                    >
                      {(isRun || boosted) && <span className={cn(isRun ? "text-white" : "text-muted", boosted && "font-bold")}>{res.effPrio[t.name][i]}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="事件" subtitle={tick !== null ? `已選取 tick ${tick}（點甘特圖格子篩選）` : "點甘特圖的格子可只看該 tick 的事件"} />
        <CardBody>
          <ul className="space-y-1 text-[13px]">
            {res.events.filter((e) => tick === null || e.t === tick).map((e, i) => (
              <li key={i} className={cn(e.text.includes("inheritance") && "font-medium text-ok", e.text.includes("blocked") && "text-bad")}>
                <span className="mr-2 inline-block w-12 font-mono text-faint">t={e.t}</span>{e.text}
              </li>
            ))}
          </ul>
          {sc.id === "inversion" && (
            <p className="mt-4 rounded-md bg-surface-2 px-3 py-2 text-[13px]">
              {inherit
                ? "開啟 inheritance：H 一等待，L 立刻被提升到 H 的優先權，M 無法插隊；L 用完 mutex 後恢復原優先權，H 馬上執行。"
                : "沒有 inheritance：H 在等 L 的 mutex，但 M（不需要 mutex）優先權高於 L，一直搶占 L —— H 實際上被比它低的 M 拖延，這就是 priority inversion（Mars Pathfinder 1997 的問題）。"}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
