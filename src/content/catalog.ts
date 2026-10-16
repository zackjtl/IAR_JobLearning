import type { SkillId } from "./skills";

export type TrackId = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

export type TrackMeta = { id: TrackId; title: string; en: string; desc: string; skill: SkillId };

export const TRACKS: TrackMeta[] = [
  { id: "t1", title: "Track 1：編譯器基礎", en: "Compiler Fundamentals", skill: "compiler", desc: "從原始碼到機器碼：編譯流程、跨平台編譯、最佳化、Undefined Behavior 與記憶體順序。" },
  { id: "t2", title: "Track 2：Linker 與記憶體", en: "Linker & Memory", skill: "linker", desc: "ELF、Section、Linker Script、記憶體配置、Startup Code 與 Map File 分析。" },
  { id: "t3", title: "Track 3：除錯", en: "Debugging", skill: "debug", desc: "GDB、硬體中斷點、DWARF、最佳化後程式除錯、反組譯、HardFault 與 Compiler Bug 判斷。" },
  { id: "t4", title: "Track 4：嵌入式系統", en: "Embedded Systems", skill: "rtos", desc: "Cortex-M/A、RISC-V、RTOS 排程、中斷、MPU、BSP/HAL 與 Toolchain/CI 整合。" },
  { id: "t5", title: "Track 5：IAR 生態系", en: "IAR Ecosystem", skill: "compiler", desc: "IAR Embedded Workbench、IAR C/C++ Compiler、ILINK、C-SPY 與 GCC 專案移植。" },
  { id: "t6", title: "Track 6：FAE 工作思維", en: "FAE Mindset", skill: "fae", desc: "售前技術探索、Proof of Value、技術支援升級流程、異議處理與技術簡報。" },
];

export type LessonMeta = {
  id: string;
  track: TrackId;
  title: string;
  en: string;
  skill: SkillId;
  minutes: number;
  level: "基礎" | "中階" | "進階";
  /** JD 是否明確提及；false = 延伸補強 */
  jdExplicit: boolean;
  topics: string[];
};

export const LESSONS: LessonMeta[] = [
  // Track 1
  { id: "t1-pipeline", track: "t1", title: "C/C++ 編譯流程", en: "The C/C++ Compilation Pipeline", skill: "compiler", minutes: 35, level: "基礎", jdExplicit: true, topics: ["Compilation Pipeline", "Preprocessing", "Compilation", "Assembly", "Linking"] },
  { id: "t1-toolchains", track: "t1", title: "GCC、Clang、IAR 與跨平台編譯", en: "GCC vs Clang vs IAR & Cross Compilation", skill: "compiler", minutes: 30, level: "基礎", jdExplicit: true, topics: ["GCC vs Clang vs IAR", "Cross Compilation", "Target Triple", "Sysroot / Runtime Library"] },
  { id: "t1-optimization", track: "t1", title: "最佳化等級與編譯器產生的組合語言", en: "Optimization Levels & Compiler-generated Assembly", skill: "compiler", minutes: 45, level: "中階", jdExplicit: true, topics: ["Optimization Levels", "Inlining", "Loop Optimizations", "Size vs Speed", "Compiler-generated Assembly"] },
  { id: "t1-ub", track: "t1", title: "Undefined Behavior：最佳化後程式「壞掉」的主因", en: "Undefined Behavior", skill: "cpp", minutes: 40, level: "中階", jdExplicit: true, topics: ["Undefined Behavior", "Strict Aliasing", "Signed Overflow", "Uninitialized Variables"] },
  { id: "t1-volatile", track: "t1", title: "volatile、Atomic 與 Memory Ordering", en: "Volatile / Atomic / Memory Ordering", skill: "cpp", minutes: 45, level: "進階", jdExplicit: true, topics: ["volatile", "C11/C++11 Atomics", "Memory Barriers (DMB/DSB/ISB)", "ISR Shared Data"] },
  // Track 2
  { id: "t2-elf", track: "t2", title: "ELF、Object File 與 Section", en: "ELF, Object Files & Sections", skill: "linker", minutes: 40, level: "基礎", jdExplicit: false, topics: ["ELF File Structure", "Object Files", "Sections", ".text / .data / .bss", "Symbols & Relocations"] },
  { id: "t2-memory", track: "t2", title: "Stack、Heap 與 Memory Map", en: "Stack, Heap & Memory Maps", skill: "linker", minutes: 35, level: "基礎", jdExplicit: false, topics: ["Stack / Heap", "Memory Maps", "Stack Overflow", "Fragmentation"] },
  { id: "t2-linker-script", track: "t2", title: "Linker Script：GNU ld 與 IAR ICF", en: "Linker Scripts (GNU ld vs IAR ICF)", skill: "linker", minutes: 45, level: "中階", jdExplicit: false, topics: ["Linker Scripts", "MEMORY / SECTIONS", "LMA vs VMA", "IAR ICF"] },
  { id: "t2-startup", track: "t2", title: "Startup Code 與 Vector Table", en: "Startup Code & Vector Table", skill: "linker", minutes: 35, level: "中階", jdExplicit: false, topics: ["Startup Code", "Vector Table", "Reset Handler", ".data copy / .bss zero", "C++ static init"] },
  { id: "t2-linking", track: "t2", title: "靜態/動態連結與 Map File 分析", en: "Static vs Dynamic Linking & Map File Analysis", skill: "linker", minutes: 40, level: "中階", jdExplicit: false, topics: ["Static vs Dynamic Linking", "Map File Analysis", "Dead Code Elimination", "Code Size Investigation"] },
  // Track 3
  { id: "t3-gdb", track: "t3", title: "GDB 基礎、硬體中斷點與 Watchpoint", en: "GDB, Hardware Breakpoints & Watchpoints", skill: "debug", minutes: 40, level: "基礎", jdExplicit: true, topics: ["GDB Fundamentals", "Hardware Breakpoints", "Watchpoints", "Debug Probe / SWD / JTAG"] },
  { id: "t3-symbols", track: "t3", title: "Debug Symbols、DWARF 與最佳化後除錯", en: "Debug Symbols, DWARF & Optimized Code Debugging", skill: "debug", minutes: 40, level: "中階", jdExplicit: true, topics: ["Debug Symbols", "DWARF", "Optimized Code Debugging", "<optimized out>"] },
  { id: "t3-disasm", track: "t3", title: "反組譯與 Call Stack（AAPCS）", en: "Disassembly & Call Stack (AAPCS)", skill: "debug", minutes: 45, level: "中階", jdExplicit: true, topics: ["Disassembly", "Call Stack", "ABI / Calling Convention", "Thumb-2 basics"] },
  { id: "t3-hardfault", track: "t3", title: "Cortex-M HardFault 分析", en: "HardFault Analysis", skill: "debug", minutes: 45, level: "進階", jdExplicit: true, topics: ["HardFault Analysis", "Exception Stack Frame", "CFSR / HFSR / MMFAR / BFAR", "EXC_RETURN"] },
  { id: "t3-compiler-bug", track: "t3", title: "Compiler Bug 還是 Application Bug？", en: "Compiler vs Application Bug Investigation", skill: "debug", minutes: 40, level: "進階", jdExplicit: true, topics: ["Compiler vs Application Bug", "Minimal Reproducer", "Bisecting Optimizations", "Support Case Writing"] },
  // Track 4
  { id: "t4-cortex", track: "t4", title: "Arm Cortex-M vs Cortex-A 與 RISC-V 基礎", en: "Arm Cortex-M vs Cortex-A & RISC-V Fundamentals", skill: "rtos", minutes: 40, level: "基礎", jdExplicit: true, topics: ["Arm Cortex-M vs Cortex-A", "RISC-V Fundamentals", "ISA Extensions", "Privilege Levels"] },
  { id: "t4-rtos", track: "t4", title: "RTOS 排程與並行", en: "RTOS Scheduling & Concurrency", skill: "rtos", minutes: 45, level: "中階", jdExplicit: true, topics: ["RTOS Scheduling", "Priority Inversion", "Mutex vs Semaphore", "Concurrency"] },
  { id: "t4-interrupts", track: "t4", title: "中斷處理與記憶體保護", en: "Interrupt Handling & Memory Protection", skill: "rtos", minutes: 40, level: "中階", jdExplicit: true, topics: ["Interrupt Handling", "NVIC", "Interrupt Latency", "Memory Protection (MPU)"] },
  { id: "t4-platforms", track: "t4", title: "Bare-metal vs RTOS vs Linux 與 BSP/HAL", en: "Bare-metal vs RTOS vs Linux & BSP/HAL", skill: "rtos", minutes: 35, level: "基礎", jdExplicit: true, topics: ["Bare-metal vs RTOS vs Linux", "BSP / HAL", "CMSIS", "Choosing a platform"] },
  { id: "t4-cicd", track: "t4", title: "嵌入式 Toolchain 整合與 CI/CD", en: "Embedded Toolchain Integration & CI/CD", skill: "cicd", minutes: 40, level: "中階", jdExplicit: true, topics: ["Embedded Toolchain Integration", "CMake Toolchain Files", "CI/CD Pipelines", "Containers & License Servers", "Static Analysis in CI"] },
  // Track 5
  { id: "t5-ew", track: "t5", title: "IAR Embedded Workbench 與專案結構", en: "IAR Embedded Workbench & Project Structure", skill: "compiler", minutes: 30, level: "基礎", jdExplicit: false, topics: ["IAR Embedded Workbench", "IAR Project Structure", "Workspace / Project files", "Build Configurations"] },
  { id: "t5-compiler", track: "t5", title: "IAR C/C++ Compiler：設定、最佳化與 Code Size", en: "IAR C/C++ Compiler: Configuration, Optimization & Code Size", skill: "compiler", minutes: 40, level: "中階", jdExplicit: false, topics: ["IAR C/C++ Compiler", "Compiler Configuration", "Optimization and Code Size", "Extended Keywords & Pragmas"] },
  { id: "t5-ilink", track: "t5", title: "IAR Linker（ILINK）與 ICF", en: "IAR ILINK & Linker Configuration Files", skill: "linker", minutes: 40, level: "中階", jdExplicit: false, topics: ["IAR Linker", "ICF", "Placement", "Stack usage analysis"] },
  { id: "t5-cspy", track: "t5", title: "C-SPY Debugger", en: "C-SPY Debugger", skill: "debug", minutes: 30, level: "基礎", jdExplicit: false, topics: ["C-SPY Debugger", "Drivers (Simulator / Probe)", "Macros", "Command-line debugging"] },
  { id: "t5-migration", track: "t5", title: "GCC 專案移植與 IAR vs GCC 比較", en: "GCC Project Migration & IAR vs GCC", skill: "compiler", minutes: 45, level: "進階", jdExplicit: false, topics: ["GCC Project Migration Considerations", "IAR vs GCC Toolchain Comparison", "Startup / Linker / Inline asm differences"] },
  // Track 6
  { id: "t6-role", track: "t6", title: "FAE 的角色與銷售週期", en: "The FAE Role & the Sales Cycle", skill: "fae", minutes: 30, level: "基礎", jdExplicit: true, topics: ["Technical Pre-sales", "Sales / Engineering Collaboration", "Pipeline Health", "Metrics"] },
  { id: "t6-discovery", track: "t6", title: "客戶技術探索（Discovery）", en: "Customer Technical Discovery", skill: "fae", minutes: 35, level: "中階", jdExplicit: true, topics: ["Customer Technical Discovery", "Pain Points", "Toolchain / CI / Compliance questions"] },
  { id: "t6-pov", track: "t6", title: "Proof of Value 與技術評估", en: "Proof of Value & Technical Evaluations", skill: "fae", minutes: 35, level: "中階", jdExplicit: true, topics: ["Proof of Value", "Success Criteria", "Benchmarking fairly", "Win/Loss analysis"] },
  { id: "t6-support", track: "t6", title: "技術支援與問題升級（Escalation）", en: "Technical Support & Escalation", skill: "fae", minutes: 30, level: "中階", jdExplicit: true, topics: ["Technical Support Escalation", "Triage", "Knowledge Base", "Global Support Collaboration"] },
  { id: "t6-objection", track: "t6", title: "異議處理與技術簡報", en: "Objection Handling & Technical Presentation", skill: "fae", minutes: 35, level: "中階", jdExplicit: true, topics: ["Customer Objection Handling", "Technical Presentation", "Business-oriented Technical Communication"] },
];

export const LESSON_BY_ID: Record<string, LessonMeta> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
