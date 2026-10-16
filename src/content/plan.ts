import type { SkillId } from "./skills";

// 14-day study plan. Priority order follows SPEC §4:
// 1 English self-intro & recruiter → 2 compiler/linker basics → 3 debugging/optimization
// → 4 IAR toolchain → 5 FAE scenarios → 6 technical-manager mock interview.
// This is a SUGGESTED rhythm — the interview date is unknown.

export type PlanTaskKind = "lesson" | "lab" | "english" | "speaking" | "mock" | "review" | "copilot" | "diagnostic";
export type PlanTaskDef = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  kind: PlanTaskKind;
  skill: SkillId;
  /** lesson/lab id used to auto-detect completion */
  ref?: string;
  /** "core" = do even on a 30-minute day; "extra" = only if time allows */
  weight: "core" | "extra";
};
export type PlanDay = { day: number; theme: string; focus: string; tasks: PlanTaskDef[] };

const L = (id: string, title: string, minutes: number, skill: SkillId, weight: "core" | "extra" = "core"): PlanTaskDef => ({ id: `lesson:${id}`, title: `課程：${title}`, minutes, href: `/learn/${id}`, kind: "lesson", skill, ref: id, weight });
const LAB = (id: string, title: string, minutes: number, skill: SkillId, weight: "core" | "extra" = "extra"): PlanTaskDef => ({ id: `lab:${id}`, title: `Lab：${title}`, minutes, href: `/labs/${id}`, kind: "lab", skill, ref: id, weight });
const EN = (day: number, cat: string, title: string, minutes: number, weight: "core" | "extra" = "core"): PlanTaskDef => ({ id: `d${day}:english:${cat}`, title, minutes, href: `/english?cat=${cat}`, kind: "english", skill: "english", weight });
const MOCK = (day: number, mode: string, title: string, minutes: number, skill: SkillId = "english", weight: "core" | "extra" = "core"): PlanTaskDef => ({ id: `d${day}:mock:${mode}`, title, minutes, href: `/mock?mode=${mode}`, kind: "mock", skill, weight });
const SPEAK = (day: number, title: string, minutes: number, weight: "core" | "extra" = "extra"): PlanTaskDef => ({ id: `d${day}:speaking`, title, minutes, href: "/speaking", kind: "speaking", skill: "english", weight });
const REVIEW = (day: number, minutes = 15): PlanTaskDef => ({ id: `d${day}:review`, title: "複習到期卡片（錯題 + 術語）", minutes, href: "/review", kind: "review", skill: "compiler", weight: "core" });

export const PLAN: PlanDay[] = [
  {
    day: 1, theme: "起跑：基準 + 自我介紹", focus: "建立能力基準，寫出第一版英文自我介紹。",
    tasks: [
      { id: "d1:diagnostic", title: "完成初始診斷測驗", minutes: 25, href: "/diagnostic", kind: "diagnostic", skill: "compiler", weight: "core" },
      EN(1, "intro", "英文自我介紹（30 秒 / 90 秒版）", 25),
      L("t1-pipeline", "編譯流程總覽", 30, "compiler", "extra"),
    ],
  },
  {
    day: 2, theme: "獵頭初談", focus: "第一關通常是 recruiter screening：動機、時程、英文。",
    tasks: [
      EN(2, "recruiter", "獵頭初談題庫：動機、轉職理由、可到職時間", 25),
      SPEAK(2, "口說練習：大聲唸出自我介紹並看辨識結果", 15, "core"),
      L("t1-toolchains", "GCC / Clang / 商業編譯器", 30, "compiler", "extra"),
    ],
  },
  {
    day: 3, theme: "編譯器基礎", focus: "最佳化、volatile、UB —— 客戶最常問的三件事。",
    tasks: [
      L("t1-optimization", "編譯器最佳化", 35, "compiler"),
      L("t1-volatile", "volatile 與記憶體屏障", 30, "compiler", "extra"),
      LAB("optimization", "編譯最佳化比較", 25, "compiler"),
      MOCK(3, "recruiter", "模擬面試：獵頭初談（第一次）", 20, "english", "extra"),
    ],
  },
  {
    day: 4, theme: "記憶體與 ELF", focus: "section、LMA/VMA、.data/.bss 從哪裡來。",
    tasks: [
      L("t1-ub", "Undefined Behavior", 30, "compiler", "extra"),
      L("t2-elf", "ELF 與 object file", 30, "linker"),
      L("t2-memory", "嵌入式記憶體配置", 30, "linker"),
      LAB("memory-layout", "記憶體配置圖", 20, "linker"),
    ],
  },
  {
    day: 5, theme: "Linker", focus: "linker script、startup、map file 分析。",
    tasks: [
      L("t2-linker-script", "Linker Script 與 IAR ICF", 35, "linker"),
      L("t2-startup", "Startup code", 30, "linker", "extra"),
      L("t2-linking", "Map file 分析", 30, "linker"),
      LAB("sections", "Section 與 Linker 分析", 20, "linker"),
    ],
  },
  {
    day: 6, theme: "除錯工具", focus: "GDB、symbols、反組譯 —— 能看懂組合語言是 FAE 的基本功。",
    tasks: [
      REVIEW(6),
      L("t3-gdb", "GDB 與遠端除錯", 30, "debug"),
      L("t3-symbols", "Debug symbols 與 DWARF", 25, "debug", "extra"),
      L("t3-disasm", "反組譯與 AAPCS", 30, "debug"),
      LAB("asm-walkthrough", "組合語言逐步解析", 20, "debug"),
    ],
  },
  {
    day: 7, theme: "Fault 分析", focus: "HardFault、stack overflow、「是不是 compiler bug？」",
    tasks: [
      L("t3-hardfault", "HardFault 分析", 35, "debug"),
      LAB("debug-cases", "除錯案例分析", 25, "debug"),
      L("t3-compiler-bug", "Compiler bug 還是 application bug？", 30, "debug", "extra"),
      LAB("stack-heap", "Stack / Heap 模擬", 15, "debug"),
      EN(7, "toolchain", "英文：Compiler / Toolchain 題（先讀 3 題）", 20, "extra"),
    ],
  },
  {
    day: 8, theme: "IAR 工具鏈（一）", focus: "EW 專案結構、iarbuild、IAR 編譯器選項。",
    tasks: [
      REVIEW(8, 10),
      L("t5-ew", "IAR Embedded Workbench", 30, "compiler"),
      L("t5-compiler", "IAR C/C++ Compiler", 35, "compiler"),
      EN(8, "toolchain", "英文：用英文解釋 -O 等級與 volatile", 20),
    ],
  },
  {
    day: 9, theme: "IAR 工具鏈（二）", focus: "ILINK/ICF、stack usage analysis、C-SPY。",
    tasks: [
      L("t5-ilink", "IAR ILINK 與 ICF", 35, "linker"),
      L("t5-cspy", "C-SPY Debugger", 30, "debug"),
      MOCK(9, "technical", "模擬面試：技術主管（第一次，著重 compiler/linker）", 25, "compiler", "extra"),
    ],
  },
  {
    day: 10, theme: "移植與 CI/CD", focus: "GCC → IAR 移植、公平比較、CI 整合。",
    tasks: [
      REVIEW(10, 10),
      L("t5-migration", "GCC → IAR 移植", 35, "compiler"),
      L("t4-cicd", "Toolchain 與 CI/CD", 30, "cicd"),
      L("t4-cortex", "Cortex-M / A 與 RISC-V", 30, "rtos", "extra"),
    ],
  },
  {
    day: 11, theme: "FAE 角色", focus: "售前 + 售後、discovery 提問。",
    tasks: [
      L("t6-role", "FAE 的角色與銷售週期", 25, "fae"),
      L("t6-discovery", "技術探索（Discovery）", 30, "fae"),
      EN(11, "fae", "英文：FAE 情境題（discovery 問句）", 25),
    ],
  },
  {
    day: 12, theme: "PoV 與技術支援", focus: "成功標準、升級報告、與客戶溝通。",
    tasks: [
      L("t6-pov", "Proof of Value", 30, "fae"),
      L("t6-support", "技術支援與升級", 30, "fae"),
      MOCK(12, "customer", "模擬面試：客戶情境", 25, "fae"),
      L("t4-rtos", "RTOS 核心概念", 30, "rtos", "extra"),
      LAB("rtos-sim", "RTOS 排程模擬", 20, "rtos"),
    ],
  },
  {
    day: 13, theme: "異議處理與行為題", focus: "STAR、薪資、反問 —— 把故事準備好。",
    tasks: [
      L("t6-objection", "異議處理與技術簡報", 30, "fae"),
      EN(13, "behavioral", "英文：行為面試（STAR，用自己的真實案例）", 25),
      EN(13, "salary", "英文：薪資與條件", 15, "extra"),
      EN(13, "ask", "英文：反問面試官", 10),
      L("t4-interrupts", "中斷、NVIC 與 MPU", 30, "rtos", "extra"),
    ],
  },
  {
    day: 14, theme: "總複習：完整模擬", focus: "技術主管模擬面試 + 複習弱點。",
    tasks: [
      MOCK(14, "technical", "模擬面試：技術主管（完整一輪）", 35, "compiler"),
      REVIEW(14, 20),
      MOCK(14, "recruiter", "模擬面試：獵頭初談（第二次，比較進步）", 20, "english", "extra"),
      { id: "d14:copilot", title: "Copilot：用最常卡住的 3 題練習快速回答", minutes: 10, href: "/copilot", kind: "copilot", skill: "english", weight: "extra" },
      L("t4-platforms", "Embedded Linux 與 SoC 平台", 25, "rtos", "extra"),
    ],
  },
];

export const ALL_PLAN_TASKS = PLAN.flatMap((d) => d.tasks.map((t) => ({ ...t, day: d.day })));
