#!/usr/bin/env node
// Generates REAL compiler output for the Technical Labs (src/content/labs-data/gcc-output.json).
// The web app never runs a compiler; it only displays what this script recorded.
//
// Usage:  ARM_GCC_BIN=/path/to/arm-none-eabi-gcc/bin node scripts/gen-lab-data.mjs
// Tested with xPack GNU Arm Embedded GCC 14.2.1 (arm-none-eabi). Sources: labs-src/*.c
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BIN = process.env.ARM_GCC_BIN ?? "";
const tool = (t) => (BIN ? join(BIN, `arm-none-eabi-${t}`) : `arm-none-eabi-${t}`);
const run = (t, args, opts = {}) => execFileSync(tool(t), args, { encoding: "utf8", ...opts });
const SRC = join(process.cwd(), "labs-src");
const TMP = mkdtempSync(join(tmpdir(), "labgen-"));

const version = run("gcc", ["--version"]).split("\n")[0];

/** Keep labels, instructions and .word/.ascii data; drop directives and compiler comments. */
function cleanAsm(s) {
  const out = [];
  for (const raw of s.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line) continue;
    if (/^\s*@/.test(line)) continue;
    if (/^[.\w$]+:/.test(line)) { out.push(line); continue; }
    const m = line.match(/^\s+(\.?[\w.]+)(.*)$/);
    if (!m) continue;
    const op = m[1];
    if (op.startsWith(".")) {
      if ([".word", ".ascii", ".byte", ".short", ".space"].includes(op)) out.push("\t" + op + m[2].replace(/\t/g, " "));
      continue;
    }
    out.push("\t" + (op + m[2]).replace(/\t/g, " ").replace(/\s+@.*$/, ""));
  }
  return out.join("\n");
}

/** Function sizes (bytes) from nm -S on an object file. */
function fnSizes(obj) {
  const txt = run("nm", ["-S", "--defined-only", obj]);
  const sizes = {};
  for (const l of txt.split("\n")) {
    const p = l.trim().split(/\s+/);
    if (p.length === 4 && /[tT]/.test(p[2])) sizes[p[3]] = parseInt(p[1], 16);
  }
  return sizes;
}

// ── Optimization lab ──────────────────────────────────────────────────────
const OPT_SAMPLES = ["opt_sum", "opt_flag", "opt_clear", "opt_inline", "opt_switch"];
const LEVELS = ["O0", "O1", "O2", "O3", "Os"];
const CPU = ["-mcpu=cortex-m4", "-mthumb", "-mfloat-abi=soft", "-fno-asynchronous-unwind-tables"];
const optimization = {};
for (const name of OPT_SAMPLES) {
  const src = join(SRC, `${name}.c`);
  const levels = {};
  for (const lv of LEVELS) {
    const asm = run("gcc", [...CPU, `-${lv}`, "-S", "-o", "-", src]);
    const obj = join(TMP, `${name}_${lv}.o`);
    run("gcc", [...CPU, `-${lv}`, "-c", "-o", obj, src]);
    levels[lv] = { asm: cleanAsm(asm), sizes: fnSizes(obj) };
  }
  optimization[name] = { source: readFileSync(src, "utf8"), levels };
}

// ── Sections / memory layout lab ──────────────────────────────────────────
const secSrc = join(SRC, "sections.c");
const secObj = join(TMP, "sections.o");
const BASE = ["-mcpu=cortex-m4", "-mthumb", "-O1", "-fno-common", "-fno-asynchronous-unwind-tables"];
run("gcc", [...BASE, "-c", "-o", secObj, secSrc]);
const symSections = {};
for (const l of run("objdump", ["-t", secObj]).split("\n")) {
  // e.g. 00000000 g     O .data	00000004 g_init
  const m = l.match(/^[0-9a-f]{8}\s+([lg! ])\s+([\w ]{0,7})\s+(\S+)\s+([0-9a-f]{8})\s+(\S+)$/);
  if (!m) continue;
  const [, bind, flags, section, size, sym] = m;
  if (!/[OF]/.test(flags)) continue;
  symSections[sym] = { section, size: parseInt(size, 16), bind: bind.trim() === "g" ? "global" : "local", kind: flags.includes("F") ? "function" : "object" };
}

function linkVariant(id, extra) {
  const elf = join(TMP, `${id}.elf`);
  const map = join(TMP, `${id}.map`);
  run("gcc", [...BASE, ...extra, "-nostdlib", "-nostartfiles", "-T", join(SRC, "link.ld"), `-Wl,-Map=${map}`, "-o", elf, secSrc]);
  const sizeA = run("size", ["-A", "-x", elf]);
  const sections = [];
  for (const l of sizeA.split("\n")) {
    const m = l.match(/^(\.\S+)\s+(0x[0-9a-f]+)\s+(0x[0-9a-f]+)/);
    if (m && !m[1].startsWith(".ARM.attr") && !m[1].startsWith(".debug")) sections.push({ name: m[1], size: parseInt(m[2], 16), addr: parseInt(m[3], 16) });
  }
  const lma = {};
  for (const l of run("objdump", ["-h", elf]).split("\n")) {
    const m = l.match(/^\s*\d+\s+(\.\S+)\s+([0-9a-f]+)\s+([0-9a-f]+)\s+([0-9a-f]+)/);
    if (m) lma[m[1]] = { vma: parseInt(m[3], 16), lma: parseInt(m[4], 16) };
  }
  for (const s of sections) if (lma[s.name]) s.lma = lma[s.name].lma;
  const symbols = {};
  for (const l of run("nm", ["-S", "-n", elf]).split("\n")) {
    const p = l.trim().split(/\s+/);
    if (p.length === 4) symbols[p[3]] = { addr: parseInt(p[0], 16), size: parseInt(p[1], 16), type: p[2] };
    else if (p.length === 3) symbols[p[2]] = { addr: parseInt(p[0], 16), size: 0, type: p[1] };
  }
  const berkeley = run("size", [elf]).split("\n")[1].trim().split(/\s+/);
  return {
    flags: [...BASE, ...extra].join(" "),
    sections,
    symbols,
    berkeley: { text: +berkeley[0], data: +berkeley[1], bss: +berkeley[2] },
  };
}
const sections = {
  source: readFileSync(secSrc, "utf8"),
  linkerScript: readFileSync(join(SRC, "link.ld"), "utf8"),
  objectSymbols: symSections,
  link: {
    plain: linkVariant("plain", []),
    gc: linkVariant("gc", ["-ffunction-sections", "-fdata-sections", "-Wl,--gc-sections"]),
  },
};

// ── Assembly walkthrough (Thumb-1, Cortex-M0) ─────────────────────────────
const asmSrc = join(SRC, "asm_funcs.c");
const asmOut = run("gcc", ["-mcpu=cortex-m0", "-mthumb", "-O1", "-fno-asynchronous-unwind-tables", "-S", "-o", "-", asmSrc]);
const walkthrough = { source: readFileSync(asmSrc, "utf8"), flags: "-mcpu=cortex-m0 -mthumb -O1", asm: cleanAsm(asmOut) };

const out = {
  meta: {
    toolchain: version,
    generatedAt: new Date().toISOString().slice(0, 10),
    note: "Recorded offline with a real arm-none-eabi-gcc by scripts/gen-lab-data.mjs. The website does not compile code.",
    cpuFlags: CPU.join(" "),
  },
  optimization,
  sections,
  walkthrough,
};
mkdirSync(join(process.cwd(), "src/content/labs-data"), { recursive: true });
writeFileSync(join(process.cwd(), "src/content/labs-data/gcc-output.json"), JSON.stringify(out, null, 1));
console.log("wrote src/content/labs-data/gcc-output.json —", version);
