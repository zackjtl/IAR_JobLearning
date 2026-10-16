// Tiny Thumb-1 subset interpreter for the assembly walkthrough lab.
// Supports exactly the instructions emitted by GCC for labs-src/asm_funcs.c
// (movs, adds, subs, cmp, ands, lsrs, b<cond>, bx lr). Anything else → error.

export type Flags = { N: boolean; Z: boolean; C: boolean; V: boolean };
export type CpuState = { r: number[]; flags: Flags; pc: number; steps: number; done: boolean; error?: string; last?: string };
export type Line = { text: string; label?: string; op?: string; args?: string[] };

export function parseAsm(asm: string): Line[] {
  return asm.split("\n").map((raw) => {
    const text = raw.replace(/\t/g, "  ");
    const lm = raw.match(/^([.\w$]+):\s*$/);
    if (lm) return { text, label: lm[1] };
    const m = raw.trim().match(/^([a-z.]+)\s*(.*)$/i);
    if (!m) return { text };
    const args = m[2] ? m[2].split(",").map((s) => s.trim()) : [];
    return { text, op: m[1].toLowerCase(), args };
  });
}

/** Functions = labels not starting with "." */
export function functionsOf(lines: Line[]) {
  return lines.map((l, i) => ({ l, i })).filter(({ l }) => l.label && !l.label.startsWith(".")).map(({ l, i }) => ({ name: l.label!, index: i }));
}

const u32 = (x: number) => x >>> 0;
const reg = (s: string) => {
  const m = s.match(/^r(\d+)$/);
  if (!m) throw new Error(`不支援的運算元 ${s}`);
  return +m[1];
};
const imm = (s: string) => {
  if (!s.startsWith("#")) throw new Error(`預期立即值，得到 ${s}`);
  return u32(parseInt(s.slice(1), 10));
};

function addFlags(a: number, b: number, carryIn = 0) {
  const res = u32(a + b + carryIn);
  const C = a + b + carryIn > 0xffffffff;
  const V = ((a ^ res) & (b ^ res) & 0x80000000) !== 0;
  return { res, C, V };
}
function subFlags(a: number, b: number) {
  // a - b = a + ~b + 1
  return addFlags(a, u32(~b), 1);
}
const nz = (res: number) => ({ N: (res & 0x80000000) !== 0, Z: res === 0 });

export function initState(lines: Line[], entry: number, args: number[]): CpuState {
  const r = new Array(16).fill(0);
  args.forEach((v, i) => (r[i] = u32(v)));
  r[13] = 0x20001000; // sp (unused here)
  r[14] = 0xfffffff1; // lr sentinel: returning ends the simulation
  return { r, flags: { N: false, Z: false, C: false, V: false }, pc: entry + 1, steps: 0, done: false };
}

function cond(c: string, f: Flags): boolean {
  switch (c) {
    case "eq": return f.Z;
    case "ne": return !f.Z;
    case "ge": return f.N === f.V;
    case "lt": return f.N !== f.V;
    case "gt": return !f.Z && f.N === f.V;
    case "le": return f.Z || f.N !== f.V;
    case "hi": return f.C && !f.Z;
    case "ls": return !f.C || f.Z;
    case "cs": case "hs": return f.C;
    case "cc": case "lo": return !f.C;
    case "mi": return f.N;
    case "pl": return !f.N;
    case "": return true;
    default: throw new Error(`不支援的條件 ${c}`);
  }
}

/** Execute one instruction (skips labels/data). Returns a new state. */
export function step(lines: Line[], s0: CpuState): CpuState {
  if (s0.done) return s0;
  const s: CpuState = { ...s0, r: [...s0.r], flags: { ...s0.flags }, last: undefined };
  // skip to next instruction
  while (s.pc < lines.length && !lines[s.pc].op) s.pc++;
  if (s.pc >= lines.length) return { ...s, done: true, error: "執行超出程式範圍" };
  const ln = lines[s.pc];
  const op = ln.op!;
  const a = ln.args ?? [];
  const labelIndex = (name: string) => {
    const i = lines.findIndex((l) => l.label === name);
    if (i < 0) throw new Error(`找不到標籤 ${name}`);
    return i;
  };
  try {
    let next = s.pc + 1;
    const R = s.r;
    if (op === "movs") {
      const d = reg(a[0]);
      const v = a[1].startsWith("#") ? imm(a[1]) : R[reg(a[1])];
      R[d] = v;
      Object.assign(s.flags, nz(v));
      s.last = `r${d} ← ${fmt(v)}`;
    } else if (op === "adds" || op === "subs") {
      const d = reg(a[0]);
      const n = a.length === 3 ? R[reg(a[1])] : R[d];
      const mOp = a.length === 3 ? a[2] : a[1];
      const m = mOp.startsWith("#") ? imm(mOp) : R[reg(mOp)];
      const f = op === "adds" ? addFlags(n, m) : subFlags(n, m);
      R[d] = f.res;
      Object.assign(s.flags, nz(f.res), { C: f.C, V: f.V });
      s.last = `r${d} ← ${fmt(n)} ${op === "adds" ? "+" : "−"} ${fmt(m)} = ${fmt(f.res)}`;
    } else if (op === "cmp") {
      const n = R[reg(a[0])];
      const m = a[1].startsWith("#") ? imm(a[1]) : R[reg(a[1])];
      const f = subFlags(n, m);
      Object.assign(s.flags, nz(f.res), { C: f.C, V: f.V });
      s.last = `比較 ${fmt(n)} 與 ${fmt(m)}（計算 ${fmt(n)} − ${fmt(m)}，只更新旗標）`;
    } else if (op === "ands") {
      const d = reg(a[0]);
      const v = u32(R[d] & R[reg(a[1])]);
      R[d] = v;
      Object.assign(s.flags, nz(v));
      s.last = `r${d} ← AND = ${fmt(v)}`;
    } else if (op === "lsrs") {
      const d = reg(a[0]);
      const src = R[reg(a[1])];
      const sh = imm(a[2]);
      const v = sh === 0 ? src : src >>> sh;
      const C = sh === 0 ? s.flags.C : ((src >>> (sh - 1)) & 1) === 1;
      R[d] = u32(v);
      Object.assign(s.flags, nz(R[d]), { C });
      s.last = `r${d} ← ${fmt(src)} >> ${sh} = ${fmt(R[d])}（C = 移出的位元）`;
    } else if (op === "bx") {
      if (a[0] !== "lr") throw new Error("只支援 bx lr");
      s.done = true;
      s.last = `返回呼叫者，回傳值 r0 = ${toSigned(R[0])}`;
    } else if (op === "b" || /^b(eq|ne|ge|lt|gt|le|hi|ls|cs|cc|hs|lo|mi|pl)$/.test(op)) {
      const c = op.slice(1);
      const take = cond(c, s.flags);
      if (take) next = labelIndex(a[0]);
      s.last = op === "b" ? `跳到 ${a[0]}` : `條件 ${c.toUpperCase()} ${take ? "成立 → 跳到 " + a[0] : "不成立 → 繼續下一行"}`;
    } else {
      throw new Error(`本模擬器不支援指令 ${op}`);
    }
    s.steps++;
    s.pc = s.done ? s.pc : next;
    if (s.steps > 2000) return { ...s, done: true, error: "超過 2000 步，停止（可能是無限迴圈）" };
    return s;
  } catch (e) {
    return { ...s, done: true, error: (e as Error).message };
  }
}

export function toSigned(x: number) {
  return x | 0;
}
export function fmt(x: number) {
  const sx = x | 0;
  return Math.abs(sx) < 4096 ? String(sx) : "0x" + u32(x).toString(16).toUpperCase().padStart(8, "0");
}
