"use client";

import { useState } from "react";
import { Badge, Button, Callout, Card, CardBody, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

// Teaching model of a small RAM region shared by heap (grows up) and the main stack (grows down).
const RAM_SIZE = 2048; // bytes of the region shown
const BASE = 0x20000000 + 0x400; // pretend .data/.bss end here
const FRAME = 40; // bytes per recursion level (illustrative)
const ALLOC = 160; // bytes per malloc incl. allocator header (illustrative)
const GUARD = 64; // MPU guard region size

type Ev = { kind: "call" | "ret" | "malloc" | "free" };

export function StackHeapLab() {
  const [depth, setDepth] = useState(0);
  const [allocs, setAllocs] = useState(0);
  const [mpu, setMpu] = useState(false);
  const [maxDepth, setMaxDepth] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [fault, setFault] = useState<string | null>(null);

  const stackUsed = depth * FRAME + 32; // + startup frame
  const heapUsed = allocs * ALLOC;
  const guardStart = heapUsed; // guard sits right above the heap top in this model
  const stackLow = RAM_SIZE - stackUsed;
  const collided = stackLow < heapUsed;
  const intoGuard = mpu && stackLow < guardStart + GUARD;
  const watermarkLow = RAM_SIZE - (maxDepth * FRAME + 32);

  function act(e: Ev) {
    if (fault) return;
    let d = depth, a = allocs;
    if (e.kind === "call") d++;
    if (e.kind === "ret") d = Math.max(0, d - 1);
    if (e.kind === "malloc") a++;
    if (e.kind === "free") a = Math.max(0, a - 1);
    const sLow = RAM_SIZE - (d * FRAME + 32);
    const msg =
      e.kind === "call" ? `呼叫 fact(${d})：push 一個 ${FRAME} B frame（lr、保存的暫存器、local）→ SP = ${hex(BASE + sLow)}` :
      e.kind === "ret" ? `return：pop frame → SP = ${hex(BASE + sLow)}` :
      e.kind === "malloc" ? `malloc(${ALLOC - 16})：heap 頂端 → ${hex(BASE + a * ALLOC)}` :
      `free()：heap 頂端 → ${hex(BASE + a * ALLOC)}（實際 allocator 不一定縮回）`;
    const newLog = [msg, ...log].slice(0, 12);
    if (mpu && sLow < a * ALLOC + GUARD) {
      setFault("MemManage fault（MPU guard region 被寫入）：CFSR.MSTKERR / DACCVIOL —— 立即在出事的位置停下，容易除錯。");
    } else if (!mpu && sLow < a * ALLOC && !fault) {
      newLog.unshift("⚠ stack 已覆寫 heap 資料 —— 沒有任何 fault，程式繼續執行，錯誤之後才出現在別處");
    }
    setDepth(d);
    setAllocs(a);
    setMaxDepth((m) => Math.max(m, d));
    setLog(newLog);
  }

  function reset() {
    setDepth(0); setAllocs(0); setMaxDepth(0); setLog([]); setFault(null);
  }

  const pct = (b: number) => `${(b / RAM_SIZE) * 100}%`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card>
        <CardHeader title="RAM 區域（2 KB 示意）" subtitle="上方是高位址；stack 往下長、heap 往上長" />
        <CardBody>
          <div className="relative mx-auto h-[440px] w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-surface-2 font-mono text-[11px]">
            {/* stack (top) */}
            <div className="absolute inset-x-0 top-0 bg-accent/80" style={{ height: pct(stackUsed) }} />
            {Array.from({ length: depth }).map((_, i) => (
              <div key={i} className="absolute inset-x-0 border-b border-surface/60" style={{ top: pct(32 + (i + 1) * FRAME), height: 0 }} />
            ))}
            {/* watermark */}
            {maxDepth > 0 && <div className="absolute inset-x-0 border-t-2 border-dashed border-warn" style={{ top: pct(RAM_SIZE - watermarkLow) }} />}
            {/* heap (bottom) */}
            <div className="absolute inset-x-0 bottom-0 bg-ok/70" style={{ height: pct(heapUsed) }} />
            {mpu && <div className="absolute inset-x-0 bg-bad/40 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,.15)_4px,rgba(0,0,0,.15)_8px)]" style={{ bottom: pct(heapUsed), height: pct(GUARD) }} />}
            {collided && !mpu && <div className="absolute inset-x-0 bg-bad/80" style={{ bottom: pct(stackLow), height: pct(heapUsed - stackLow) }} />}
            <div className="absolute left-2 top-1 text-accent-fg">stack ↓ {stackUsed} B</div>
            <div className="absolute bottom-1 left-2">heap ↑ {heapUsed} B</div>
            <div className="absolute right-2 top-1 text-accent-fg">{hex(BASE + RAM_SIZE)}</div>
            <div className="absolute bottom-1 right-2">{hex(BASE)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            <Badge tone="accent">stack</Badge>
            <Badge tone="ok">heap</Badge>
            <Badge tone="warn">虛線 = 最高水位（watermark）</Badge>
            {mpu && <Badge tone="bad">MPU guard</Badge>}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="操作" subtitle={`每層遞迴 ${FRAME} B、每次 malloc ${ALLOC} B（含 allocator header）——示意值`} />
          <CardBody className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => act({ kind: "call" })} disabled={!!fault}>遞迴呼叫 +1</Button>
              <Button variant="secondary" onClick={() => act({ kind: "ret" })} disabled={!!fault || depth === 0}>return</Button>
              <Button variant="outline" onClick={() => act({ kind: "malloc" })} disabled={!!fault}>malloc</Button>
              <Button variant="outline" onClick={() => act({ kind: "free" })} disabled={!!fault || allocs === 0}>free</Button>
              <Button variant="ghost" onClick={reset}>重設</Button>
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={mpu} onChange={(e) => { setMpu(e.target.checked); setFault(null); }} />
              在 heap 與 stack 之間放 MPU guard region（{GUARD} B，no-access）
            </label>
            <div className="grid grid-cols-3 gap-3 text-[13px]">
              <div><div className="text-muted">遞迴深度</div><div className="text-lg font-semibold tabular-nums">{depth}</div></div>
              <div><div className="text-muted">剩餘空間</div><div className={cn("text-lg font-semibold tabular-nums", stackLow - heapUsed < 0 && "text-bad")}>{stackLow - heapUsed} B</div></div>
              <div><div className="text-muted">最深曾到</div><div className="text-lg font-semibold tabular-nums">{maxDepth} 層</div></div>
            </div>
            {fault && <Callout tone="bad" title="Fault">{fault}</Callout>}
            {collided && !mpu && <Callout tone="bad" title="Stack 與 heap 已重疊">沒有保護機制時 CPU 不會報錯——heap 上的資料（例如某個 buffer 或 allocator 的 metadata）被默默改掉，之後的 free() 或資料處理才會出現莫名其妙的錯誤。</Callout>}
            {intoGuard && !fault && <Callout tone="warn">已接近 guard region。</Callout>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="事件紀錄" />
          <CardBody>
            {log.length === 0 ? <p className="text-[13px] text-muted">按上面的按鈕開始。試試看：先 malloc 幾次，再一直遞迴，分別在有/無 MPU guard 時觀察差異。</p> : (
              <ul className="space-y-1 font-mono text-[12px]">{log.map((l, i) => <li key={i} className={cn(i === 0 && "text-fg", i > 0 && "text-muted", l.startsWith("⚠") && "text-bad")}>{l}</li>)}</ul>
            )}
          </CardBody>
        </Card>
        <Callout tone="neutral" title="對應到工具">
          靜態上界：GCC <code>-fstack-usage</code>（每函式 .su 檔）、IAR linker 的 stack usage analysis（map file 中的 call graph 最深路徑，見 t5-ilink）。動態量測：stack painting（watermark）、RTOS 的 uxTaskGetStackHighWaterMark()。即時偵測：MPU guard、Armv8-M 的 MSPLIM/PSPLIM（UFSR.STKOF）。
        </Callout>
      </div>
    </div>
  );
}

function hex(n: number) {
  return "0x" + n.toString(16).toUpperCase().padStart(8, "0");
}
