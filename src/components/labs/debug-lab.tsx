"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@/components/ui";
import { CFSR_BITS, DEBUG_CASES, HFSR_BITS, type FaultBit } from "@/content/labs";
import { cn } from "@/lib/utils";

const parseHex = (s: string) => {
  const v = parseInt(s.replace(/[_\s]/g, "").replace(/^0x/i, ""), 16);
  return Number.isFinite(v) ? v >>> 0 : 0;
};
const hex = (n: number) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
const decode = (v: number, bits: FaultBit[]) => bits.filter((b) => ((v >>> b.bit) & 1) === 1);

export function DebugLab() {
  return (
    <div className="space-y-4">
      <Decoder />
      {DEBUG_CASES.map((c, i) => <CaseCard key={c.id} n={i + 1} c={c} />)}
    </div>
  );
}

function Decoder() {
  const [cfsr, setCfsr] = useState("0x00008200");
  const [hfsr, setHfsr] = useState("0x40000000");
  const cv = parseHex(cfsr);
  const hv = parseHex(hfsr);
  const set = [...decode(hv, HFSR_BITS), ...decode(cv, CFSR_BITS)];
  return (
    <Card>
      <CardHeader title="CFSR / HFSR 解碼器" subtitle="CFSR @ 0xE000ED28 = MMFSR[7:0] + BFSR[15:8] + UFSR[31:16]；HFSR @ 0xE000ED2C（Armv7-M / Armv8-M Mainline）" />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-[12px] text-muted">CFSR<Input className="mt-1 w-40 font-mono" value={cfsr} onChange={(e) => setCfsr(e.target.value)} /></label>
          <label className="text-[12px] text-muted">HFSR<Input className="mt-1 w-40 font-mono" value={hfsr} onChange={(e) => setHfsr(e.target.value)} /></label>
          <div className="flex items-end gap-1.5">
            {["0x00008200", "0x00020000", "0x00080000", "0x00001000", "0x02000000", "0x00000400"].map((x) => (
              <button key={x} className="rounded border border-border px-2 py-1 font-mono text-[11.5px] cursor-pointer hover:bg-surface-2" onClick={() => { setCfsr(x); setHfsr("0x40000000"); }}>{x}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[640px] gap-[2px] font-mono text-[10px]">
            {Array.from({ length: 32 }).map((_, k) => {
              const bit = 31 - k;
              const def = CFSR_BITS.find((b) => b.bit === bit);
              const on = ((cv >>> bit) & 1) === 1;
              return (
                <div key={bit} title={def ? `${def.reg}.${def.name}` : "reserved"} className={cn("flex-1 rounded-sm border py-1 text-center", on ? "border-accent bg-accent text-accent-fg" : def ? "border-border" : "border-dashed border-border text-faint")}>
                  <div>{bit}</div>
                  <div>{on ? 1 : 0}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex min-w-[640px] text-center text-[11px] text-muted">
            <div className="w-1/2">UFSR [31:16]</div><div className="w-1/4">BFSR [15:8]</div><div className="w-1/4">MMFSR [7:0]</div>
          </div>
        </div>
        {set.length === 0 ? <p className="text-[13px] text-muted">沒有設定任何已定義的位元。</p> : (
          <ul className="space-y-1.5">
            {set.map((b) => (
              <li key={b.reg + b.bit} className="flex flex-wrap items-start gap-2 text-[13px]">
                <Badge tone={b.name.endsWith("VALID") ? "neutral" : b.reg === "HFSR" ? "warn" : "bad"}>{b.reg}.{b.name}（bit {b.bit}）</Badge>
                <span>{b.desc}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[12px] text-faint">CFSR = {hex(cv)}、HFSR = {hex(hv)}。Cortex-M0/M0+（Armv6-M）沒有 CFSR，只能從 stacked PC/LR 分析。CFSR 位元為 write-1-to-clear。</p>
      </CardBody>
    </Card>
  );
}

function CaseCard({ n, c }: { n: number; c: (typeof DEBUG_CASES)[number] }) {
  const [pick, setPick] = useState<number | null>(null);
  const bits = [...decode(c.hfsr, HFSR_BITS), ...decode(c.cfsr, CFSR_BITS)];
  return (
    <Card>
      <CardHeader title={`案例 ${n}：${c.title}`} subtitle={c.story} />
      <CardBody className="space-y-3">
        <div className="grid gap-2 font-mono text-[12.5px] sm:grid-cols-2">
          <div className="rounded border border-border px-3 py-2">CFSR = {hex(c.cfsr)}</div>
          <div className="rounded border border-border px-3 py-2">HFSR = {hex(c.hfsr)}</div>
          <div className="rounded border border-border px-3 py-2 sm:col-span-2">{c.extra}</div>
        </div>
        <div className="text-[14px] font-medium">{c.question}</div>
        <div className="grid gap-1.5">
          {c.options.map((o, i) => (
            <button
              key={i}
              disabled={pick !== null}
              onClick={() => setPick(i)}
              className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-left text-[13.5px]", pick === null && "cursor-pointer border-border hover:bg-surface-2", pick !== null && i === c.answer && "border-ok bg-ok-soft", pick === i && i !== c.answer && "border-bad bg-bad-soft", pick !== null && pick !== i && i !== c.answer && "border-border opacity-60")}
            >
              {pick !== null && i === c.answer ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : pick === i ? <XCircle size={16} className="mt-0.5 shrink-0 text-bad" /> : <span className="mt-0.5 w-4 shrink-0 text-faint">{String.fromCharCode(65 + i)}</span>}
              {o}
            </button>
          ))}
        </div>
        {pick !== null && (
          <div className="space-y-2 text-[13px]">
            <div className="flex flex-wrap gap-1.5">{bits.map((b) => <Badge key={b.reg + b.bit} tone="neutral">{b.reg}.{b.name}</Badge>)}</div>
            <p><b>解析：</b>{c.explain}</p>
            <p><b>給客戶的建議：</b>{c.advice}</p>
            <Button size="sm" variant="ghost" onClick={() => setPick(null)}>重新作答</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
