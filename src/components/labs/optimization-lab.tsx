"use client";

import { useState } from "react";
import { Badge, Card, CardBody, CardHeader, Segmented } from "@/components/ui";
import { OPT_NOTES } from "@/content/labs";
import data from "@/content/labs-data/gcc-output.json";
import { cn } from "@/lib/utils";

type Level = "O0" | "O1" | "O2" | "O3" | "Os";
const LEVELS: Level[] = ["O0", "O1", "O2", "O3", "Os"];
type Sample = { source: string; levels: Record<Level, { asm: string; sizes: Record<string, number> }> };
const SAMPLES = data.optimization as unknown as Record<string, Sample>;
const ORDER = ["opt_flag", "opt_sum", "opt_clear", "opt_inline", "opt_switch"];

export function OptimizationLab() {
  const [sample, setSample] = useState("opt_flag");
  const [left, setLeft] = useState<Level>("O0");
  const [right, setRight] = useState<Level>("O2");
  const s = SAMPLES[sample];
  const note = OPT_NOTES[sample];
  const fns = Array.from(new Set(LEVELS.flatMap((l) => Object.keys(s.levels[l].sizes))));
  const maxSize = Math.max(...LEVELS.flatMap((l) => Object.values(s.levels[l].sizes)), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {ORDER.map((id) => (
          <button key={id} onClick={() => setSample(id)} className={cn("rounded-md border px-2.5 py-1.5 text-[13px] cursor-pointer", id === sample ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface hover:bg-surface-2")}>
            {OPT_NOTES[id].title}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader title="C 原始碼" subtitle={note.focus} />
          <CardBody>
            <pre className="overflow-x-auto rounded-md bg-code p-3 font-mono text-[12.5px] leading-relaxed">{s.source.trim()}</pre>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="函式大小（bytes，.text）" subtitle="由 nm -S 讀出的真實大小" />
          <CardBody className="space-y-3">
            {fns.map((fn) => (
              <div key={fn}>
                <div className="mb-1 font-mono text-[12.5px]">{fn}()</div>
                <div className="space-y-1">
                  {LEVELS.map((lv) => {
                    const v = s.levels[lv].sizes[fn];
                    return (
                      <div key={lv} className="flex items-center gap-2 text-[12px]">
                        <span className="w-7 font-mono text-muted">-{lv}</span>
                        <div className="h-3.5 flex-1 rounded-sm bg-surface-2">
                          {v !== undefined && <div className="h-3.5 rounded-sm bg-accent" style={{ width: `${(v / maxSize) * 100}%` }} />}
                        </div>
                        <span className="w-20 text-right tabular-nums">{v !== undefined ? `${v} B` : "已 inline"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="組合語言對照（Cortex-M4, Thumb-2）" subtitle={`flags: ${data.meta.cpuFlags} -O?；已移除組譯器指示（directives）與註解`} />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            {([[left, setLeft], [right, setRight]] as const).map(([lv, set], i) => (
              <div key={i} className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Segmented value={lv} onChange={(v) => set(v as Level)} options={LEVELS.map((l) => ({ value: l, label: `-${l}` }))} />
                  <Badge tone="neutral">{s.levels[lv].asm.split("\n").filter((x) => x.startsWith("\t") && !x.includes(".word") && !x.includes(".byte")).length} 條指令</Badge>
                </div>
                <pre className="max-h-[440px] overflow-auto rounded-md bg-code p-3 font-mono text-[12.5px] leading-relaxed">
                  {s.levels[lv].asm.split("\n").map((line, k) => (
                    <div key={k} className={cn(!line.startsWith("\t") && "font-semibold text-accent", /\b(b|bne|beq|cbz|cbnz|bl)\s+(\.L\d+|memset)/.test(line) && "text-warn")}>
                      {line.replace(/^\t/, "    ")}
                    </div>
                  ))}
                </pre>
                {note.byLevel[lv] && <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-[13px]">{note.byLevel[lv]}</p>}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
