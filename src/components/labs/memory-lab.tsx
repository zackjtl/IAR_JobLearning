"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader } from "@/components/ui";
import { MEM_ITEMS, type MemAnswer } from "@/content/labs";
import data from "@/content/labs-data/gcc-output.json";
import { cn } from "@/lib/utils";

const CHOICES: MemAnswer[] = [".text", ".rodata", ".data", ".bss", ".noinit", "stack/register", "optimized away"];
const LABEL: Record<MemAnswer, string> = {
  ".text": ".text", ".rodata": ".rodata", ".data": ".data", ".bss": ".bss", ".noinit": ".noinit", "stack/register": "stack / 暫存器", "optimized away": "被最佳化掉",
};
const objSyms = data.sections.objectSymbols as Record<string, { section: string; size: number }>;

/** The real answer: from objdump when the symbol exists, else the curated answer. */
function realAnswer(sym: string, fallback?: MemAnswer): { ans: MemAnswer; size?: number; fromTool: boolean } {
  const o = objSyms[sym];
  if (o) return { ans: o.section as MemAnswer, size: o.size, fromTool: true };
  return { ans: fallback ?? "optimized away", fromTool: false };
}

export function MemoryLab() {
  const [guess, setGuess] = useState<Record<string, MemAnswer>>({});
  const [reveal, setReveal] = useState(false);
  const right = MEM_ITEMS.filter((it) => guess[it.sym] === realAnswer(it.sym, it.answer).ans).length;
  const plain = data.sections.link.plain;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="猜猜它在哪裡？"
          subtitle="為每個宣告選擇 section，再按「對答案」。答案來自真實 objdump -t（-O1 -fno-common）。"
          action={reveal ? <Badge tone={right >= 10 ? "ok" : "warn"}>{right}/{MEM_ITEMS.length} 正確</Badge> : null}
        />
        <CardBody className="space-y-2">
          {MEM_ITEMS.map((it) => {
            const real = realAnswer(it.sym, it.answer);
            const g = guess[it.sym];
            const ok = g === real.ans;
            return (
              <div key={it.sym} className={cn("rounded-md border p-3", reveal ? (ok ? "border-ok bg-ok-soft/50" : "border-bad bg-bad-soft/40") : "border-border")}>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 font-mono text-[12.5px]">{it.decl}</code>
                  {reveal && (ok ? <CheckCircle2 size={16} className="text-ok" /> : <XCircle size={16} className="text-bad" />)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {CHOICES.map((c) => (
                    <button
                      key={c}
                      disabled={reveal}
                      onClick={() => setGuess((x) => ({ ...x, [it.sym]: c }))}
                      className={cn(
                        "rounded border px-2 py-0.5 font-mono text-[12px]",
                        !reveal && "cursor-pointer hover:bg-surface-2",
                        g === c ? "border-accent bg-accent-soft text-accent" : "border-border",
                        reveal && real.ans === c && "border-ok bg-ok-soft text-ok",
                      )}
                    >
                      {LABEL[c]}
                    </button>
                  ))}
                </div>
                {reveal && (
                  <p className="mt-2 text-[13px] text-muted">
                    <span className="font-medium text-fg">答案：{LABEL[real.ans]}</span>
                    {real.fromTool ? `（objdump：${it.sym}，${real.size} bytes）` : "（objdump 中不存在此符號）"}— {it.why}
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex gap-2 pt-2">
            {!reveal ? (
              <Button onClick={() => setReveal(true)} disabled={Object.keys(guess).length < MEM_ITEMS.length}>
                對答案（{Object.keys(guess).length}/{MEM_ITEMS.length}）
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { setGuess({}); setReveal(false); }}>重來</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="連結後的記憶體配置（Cortex-M 範例）" subtitle="依本 Lab 的 linker script：FLASH 0x0800_0000（512K）、RAM 0x2000_0000（128K）；數字來自 size -A / objdump -h" />
        <CardBody>
          <div className="grid gap-6 md:grid-cols-2">
            <Region title="FLASH（唯讀、斷電保存）" rows={plain.sections.filter((s) => s.addr < 0x20000000).map((s) => ({ name: s.name, addr: s.addr, size: s.size }))} extra={plain.sections.filter((s) => s.name === ".data").map((s) => ({ name: ".data 初值（LMA）", addr: s.lma ?? 0, size: s.size }))} />
            <Region title="RAM（可讀寫）" rows={plain.sections.filter((s) => s.addr >= 0x20000000).map((s) => ({ name: s.name, addr: s.addr, size: s.size }))} extra={[{ name: "heap ↑ … ↓ stack", addr: 0, size: 0 }]} />
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13px] text-muted">
            <li>Reset 後執行 Reset_Handler（startup code）。</li>
            <li>把 .data 的初值從 FLASH（LMA）複製到 RAM（VMA）——GNU 用 _sidata/_sdata/_edata 符號；IAR 由 ICF 的 initialize by copy 自動產生。</li>
            <li>把 .bss 清零（_sbss…_ebss）；.noinit 不處理（重置後保留內容）。</li>
            <li>（C++）執行全域建構子，然後呼叫 main()。</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

function hex(n: number) {
  return "0x" + n.toString(16).toUpperCase().padStart(8, "0");
}

function Region({ title, rows, extra }: { title: string; rows: { name: string; addr: number; size: number }[]; extra: { name: string; addr: number; size: number }[] }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold">{title}</div>
      <div className="overflow-hidden rounded-md border border-border font-mono text-[12.5px]">
        {[...rows, ...extra].map((r, i) => (
          <div key={i} className={cn("flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0", i >= rows.length && "bg-surface-2 text-muted")}>
            <span>{r.name}</span>
            <span className="tabular-nums">{r.size ? `${hex(r.addr)} · ${r.size} B` : "（執行時期）"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
