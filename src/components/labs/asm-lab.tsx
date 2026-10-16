"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Segmented } from "@/components/ui";
import data from "@/content/labs-data/gcc-output.json";
import { functionsOf, initState, parseAsm, step, fmt, type CpuState } from "@/lib/thumb";
import { cn } from "@/lib/utils";

const LINES = parseAsm(data.walkthrough.asm);
const FNS = functionsOf(LINES);
const DEFAULT_ARGS: Record<string, number[]> = { sum_n: [5], max3: [3, 9, 4], count_bits: [11] };
const ARG_NAMES: Record<string, string[]> = { sum_n: ["n"], max3: ["a", "b", "c"], count_bits: ["x"] };
const C_SNIPPET: Record<string, string> = Object.fromEntries(
  FNS.map((f) => {
    const src = data.walkthrough.source;
    const start = src.search(new RegExp(`\\b${f.name}\\s*\\(`));
    const lineStart = src.lastIndexOf("\n", start) + 1;
    const end = src.indexOf("\n}", start);
    return [f.name, src.slice(lineStart, end + 2)];
  }),
);

export function AsmLab() {
  const [fn, setFn] = useState(FNS[0].name);
  const [args, setArgs] = useState<number[]>(DEFAULT_ARGS[fn]);
  const entry = FNS.find((f) => f.name === fn)!.index;
  const end = useMemo(() => {
    const next = FNS.find((f) => f.index > entry);
    return next ? next.index : LINES.length;
  }, [entry]);
  const [st, setSt] = useState<CpuState>(() => initState(LINES, entry, args));
  const [prev, setPrev] = useState<CpuState | null>(null);

  function choose(name: string) {
    setFn(name);
    const a = DEFAULT_ARGS[name];
    setArgs(a);
    const e = FNS.find((f) => f.name === name)!.index;
    setSt(initState(LINES, e, a));
    setPrev(null);
  }
  function restart(a = args) {
    setSt(initState(LINES, entry, a));
    setPrev(null);
  }
  function doStep() {
    setPrev(st);
    setSt(step(LINES, st));
  }
  function runAll() {
    let s = st;
    let p = st;
    while (!s.done) { p = s; s = step(LINES, s); }
    setPrev(p);
    setSt(s);
  }
  // current instruction index (skip labels)
  let cur = st.pc;
  while (cur < LINES.length && !LINES[cur].op) cur++;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={fn} onChange={choose} options={FNS.map((f) => ({ value: f.name, label: `${f.name}()` }))} />
        <span className="font-mono text-[12px] text-muted">{data.walkthrough.flags}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="組合語言（真實 GCC 輸出）" subtitle="黃色 = 下一條要執行的指令" />
          <CardBody>
            <pre className="overflow-x-auto rounded-md bg-code p-2 font-mono text-[13px] leading-relaxed">
              {LINES.slice(entry, end).map((l, k) => {
                const i = entry + k;
                return (
                  <div key={i} className={cn("rounded px-2", l.label && "font-semibold text-accent", i === cur && !st.done && "bg-warn-soft text-fg")}>
                    {l.label ? `${l.label}:` : `    ${l.text.trim()}`}
                  </div>
                );
              })}
            </pre>
            <div className="mt-3">
              <div className="mb-1 text-[12px] font-medium text-muted">對應的 C 原始碼</div>
              <pre className="overflow-x-auto rounded-md bg-surface-2 p-2 font-mono text-[12.5px]">{C_SNIPPET[fn]}</pre>
            </div>
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="輸入（AAPCS：參數放 r0–r3）" />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                {ARG_NAMES[fn].map((n, i) => (
                  <label key={n} className="text-[12px] text-muted">
                    {n}（r{i}）
                    <Input type="number" className="mt-1 w-24" value={args[i]} onChange={(e) => { const a = [...args]; a[i] = parseInt(e.target.value || "0", 10); setArgs(a); restart(a); }} />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={doStep} disabled={st.done}>單步（step）</Button>
                <Button variant="secondary" onClick={runAll} disabled={st.done}>執行到返回</Button>
                <Button variant="ghost" onClick={() => restart()}>重設</Button>
              </div>
              <div className="text-[13px]">
                <span className="text-muted">步數：</span><b className="tabular-nums">{st.steps}</b>
                {st.done && !st.error && <Badge tone="ok" className="ml-2">回傳 r0 = {st.r[0] | 0}</Badge>}
              </div>
              {st.last && <p className="rounded-md bg-surface-2 px-3 py-2 font-mono text-[12.5px]">{st.last}</p>}
              {st.error && <p className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad">{st.error}</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="暫存器與旗標" subtitle="剛改變的值以強調色顯示" />
            <CardBody>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[13px]">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn("flex justify-between rounded border border-border px-2 py-1", prev && prev.r[i] !== st.r[i] && "border-accent bg-accent-soft")}>
                    <span className="text-muted">r{i}</span><span className="tabular-nums">{fmt(st.r[i])}</span>
                  </div>
                ))}
                <div className="flex justify-between rounded border border-border px-2 py-1"><span className="text-muted">lr</span><span>0x{(st.r[14] >>> 0).toString(16).toUpperCase()}</span></div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {(["N", "Z", "C", "V"] as const).map((f) => (
                  <div key={f} className={cn("flex-1 rounded border px-2 py-1 text-center font-mono text-[13px]", st.flags[f] ? "border-accent bg-accent-soft text-accent" : "border-border text-faint", prev && prev.flags[f] !== st.flags[f] && "ring-2 ring-accent")}>
                    {f}={st.flags[f] ? 1 : 0}
                  </div>
                ))}
              </div>
              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[12.5px] text-muted">
                <li>N = 結果為負、Z = 結果為零、C = 進位/無借位、V = 有號溢位</li>
                <li>bge = N==V、blt = N!=V、bgt = !Z && N==V、ble = Z || N!=V（有號比較）</li>
                <li>lr 是假的返回位址（模擬器用來偵測函式返回）</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
