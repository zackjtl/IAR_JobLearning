"use client";

import { useState } from "react";
import { Badge, Card, CardBody, CardHeader, Segmented } from "@/components/ui";
import data from "@/content/labs-data/gcc-output.json";
import { cn } from "@/lib/utils";

type Variant = "plain" | "gc";
type Link = {
  flags: string;
  sections: { name: string; size: number; addr: number; lma?: number }[];
  symbols: Record<string, { addr: number; size: number; type: string }>;
  berkeley: { text: number; data: number; bss: number };
};
const LINK = data.sections.link as unknown as Record<Variant, Link>;
const WATCH = ["Reset_Handler", "main", "counter", "unused_function", "g_init", "g_msg", "g_zero", "g_zero_expl", "g_const", "g_table", "g_buf", "g_reset_reason", "calls.1"];
const hex = (n: number) => "0x" + n.toString(16).toUpperCase().padStart(8, "0");

export function SectionsLab() {
  const [v, setV] = useState<Variant>("plain");
  const L = LINK[v];
  const other = LINK[v === "plain" ? "gc" : "plain"];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={v} onChange={setV} options={[{ value: "plain", label: "一般連結" }, { value: "gc", label: "+ function/data sections + --gc-sections" }]} />
      </div>
      <p className="font-mono text-[12px] text-muted break-all">arm-none-eabi-gcc {L.flags} -nostdlib -nostartfiles -T link.ld</p>

      <div className="grid gap-4 md:grid-cols-3">
        {(["text", "data", "bss"] as const).map((k) => {
          const diff = L.berkeley[k] - other.berkeley[k];
          return (
            <Card key={k}>
              <CardBody>
                <div className="text-[12px] font-medium text-muted">size：{k}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{L.berkeley[k]} B</div>
                <div className={cn("text-[12px]", diff < 0 ? "text-ok" : diff > 0 ? "text-bad" : "text-faint")}>{diff === 0 ? "與另一組相同" : `${diff > 0 ? "+" : ""}${diff} B vs 另一組`}</div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Section 表（size -A / objdump -h）" subtitle="VMA = 執行位址；LMA = 載入（儲存）位址。.data 的 VMA 在 RAM、LMA 在 FLASH。" />
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead className="text-left text-muted">
              <tr><th className="py-1.5 pr-3 font-medium">Section</th><th className="pr-3 font-medium">Size</th><th className="pr-3 font-medium">VMA</th><th className="pr-3 font-medium">LMA</th><th className="font-medium">說明</th></tr>
            </thead>
            <tbody className="font-mono">
              {L.sections.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <td className="py-1.5 pr-3">{s.name}</td>
                  <td className="pr-3 tabular-nums">{s.size}</td>
                  <td className="pr-3">{hex(s.addr)}</td>
                  <td className={cn("pr-3", s.lma !== undefined && s.lma !== s.addr && "text-warn")}>{s.lma !== undefined ? hex(s.lma) : "—"}</td>
                  <td className="font-sans text-muted">{DESC[s.name] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="符號是否留在最終映像中（nm）" subtitle="綠色 = 保留；灰色刪除線 = 被 --gc-sections 移除或被編譯器最佳化掉" />
        <CardBody>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {WATCH.map((sym) => {
              const s = L.symbols[sym];
              return (
                <div key={sym} className={cn("flex items-center justify-between rounded border px-2.5 py-1.5 font-mono text-[12.5px]", s ? "border-ok/60 bg-ok-soft/40" : "border-border text-faint line-through")}>
                  <span>{sym}</span>
                  {s ? <span className="tabular-nums text-muted no-underline">{hex(s.addr)}</span> : <Badge tone="neutral">removed</Badge>}
                </div>
              );
            })}
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-[13px] text-muted">
            <li>unused_function 沒有被任何人呼叫：一般連結時所有函式在同一個 .text 輸入 section，GNU ld 無法單獨丟掉；加上 -ffunction-sections 後每個函式自成一個 section，--gc-sections 才能回收。</li>
            <li>g_table（256 B）：counter() 讀的 g_table[3] 在編譯期就被折疊成常數 0，表格本身不再被引用 → 有 -fdata-sections 時被移除。</li>
            <li>g_buf（64 B）只被 unused_function 使用，函式被移除後它也跟著被移除。</li>
            <li>IAR ILINK 預設就會移除未被引用的 section（見 t5-ilink），不需要額外旗標；需要保留時用 __root 或 ICF 的 keep。</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="本 Lab 使用的 linker script" />
        <CardBody>
          <pre className="overflow-x-auto rounded-md bg-code p-3 font-mono text-[12.5px] leading-relaxed">{data.sections.linkerScript.trim()}</pre>
        </CardBody>
      </Card>
    </div>
  );
}

const DESC: Record<string, string> = {
  ".text": "程式碼（含向量表位置）",
  ".rodata": "const 資料、字串字面值",
  ".data": "有初值的可寫資料：執行在 RAM，初值存在 FLASH",
  ".bss": "清零的資料（NOLOAD，不佔 FLASH）",
  ".noinit": "不初始化（NOLOAD）",
};
