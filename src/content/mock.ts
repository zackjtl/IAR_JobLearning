// Mock interview personas & rule-based question banks (SPEC Module E).
// With AI configured, the persona prompt drives dynamic follow-ups; without AI, keyword rules below pick follow-ups.

export type MockMode = "recruiter" | "technical" | "customer";

export type MockFollowUp = {
  /** ask this follow-up if the answer does NOT mention any of these keywords */
  ifMissing?: string[];
  /** ask this follow-up if the answer DOES mention any of these keywords */
  ifContains?: string[];
  text: string;
  zh: string;
};

export type MockQ = { id: string; text: string; zh: string; keywords: string[]; followUps: MockFollowUp[]; skill: string };

export const MOCK_MODES: { id: MockMode; label: string; persona: string; desc: string }[] = [
  { id: "recruiter", label: "獵頭面談", persona: "Nick（獵頭顧問）", desc: "職涯背景、動機、英文溝通、期望薪資、到職時間、職涯轉換" },
  { id: "technical", label: "IAR 技術主管", persona: "FAE / Support 技術主管", desc: "Embedded C/C++、Compiler、Linker、Debugging、RTOS、Toolchain 整合、問題排除" },
  { id: "customer", label: "FAE 客戶情境", persona: "客戶工程師 / 主管", desc: "最佳化造成異常、Linker 溢出、GCC 與 IAR 結果不同、Debugger 變數、商業編譯器價值" },
];

export const MOCK_QUESTIONS: Record<MockMode, MockQ[]> = {
  recruiter: [
    { id: "r1", skill: "english", text: "Hi, thanks for taking the time today. Could you briefly walk me through your background?", zh: "謝謝你撥空。可以簡單介紹你的背景嗎？", keywords: ["firmware", "embedded", "linux", "manager", "team", "years"],
      followUps: [{ ifMissing: ["years", "year"], text: "How many years have you been in embedded software, and how many as a manager?", zh: "你做嵌入式軟體幾年？當主管幾年？" }, { ifContains: ["manager", "team"], text: "How big is your team, and what do they work on?", zh: "你的團隊多大？做什麼？" }] },
    { id: "r2", skill: "english", text: "What's motivating you to look at an FAE role right now?", zh: "是什麼讓你現在考慮 FAE 職位？", keywords: ["customer", "technical", "problem", "help", "toolchain"],
      followUps: [{ ifMissing: ["customer"], text: "This role is very customer-facing, including pre-sales. How do you feel about that?", zh: "這個職位很常面對客戶，包括售前，你怎麼看？" }, { text: "Is there anything about your current job you're trying to get away from?", zh: "現在的工作有你想離開的原因嗎？" }] },
    { id: "r3", skill: "english", text: "The team works with colleagues in Europe and the US. How comfortable are you communicating in English?", zh: "團隊要與歐美同事合作，你用英文溝通的程度？", keywords: ["daily", "written", "technical", "practice", "documents", "meetings"],
      followUps: [{ ifMissing: ["meeting", "present", "call"], text: "Have you ever presented or led a meeting in English?", zh: "你曾用英文簡報或主持會議嗎？" }] },
    { id: "r4", skill: "fae", text: "You've been a manager. This is an individual contributor role that shares revenue goals. Is that a concern for you?", zh: "你當過主管，這是要分擔營收目標的個人職位，你會擔心嗎？", keywords: ["focus", "technical", "revenue", "sales", "comfortable", "learn"],
      followUps: [{ ifMissing: ["revenue", "sales", "target"], text: "How do you feel about having part of your bonus linked to regional revenue?", zh: "部分獎金與區域營收連動，你覺得如何？" }] },
    { id: "r5", skill: "english", text: "Let's talk about compensation. What are your expectations?", zh: "談談薪資，你的期望是？", keywords: ["range", "total", "package", "bonus", "base"],
      followUps: [{ ifMissing: ["range", "million", "twd"], text: "Could you give me a rough range for total annual compensation?", zh: "可以給一個年度總薪酬的大約範圍嗎？" }, { ifContains: ["bonus"], text: "The structure is 70% base and 30% bonus, paid quarterly after the six-month probation. Does that work for you?", zh: "結構是 70/30，試用期六個月後按季發放，可以接受嗎？" }] },
    { id: "r6", skill: "english", text: "What's your notice period, and are you in any other interview processes?", zh: "你的預告期多長？有其他面試在進行嗎？", keywords: ["notice", "month", "start", "handover"],
      followUps: [{ text: "If we moved quickly, what would be the earliest realistic start date?", zh: "如果流程很快，最早實際可到職日是？" }] },
  ],
  technical: [
    { id: "t1", skill: "cpp", text: "Let's start with C. When and why would you use the volatile keyword in embedded code?", zh: "什麼時候、為什麼要在嵌入式程式中使用 volatile？", keywords: ["hardware register", "register", "isr", "interrupt", "optimiz", "memory-mapped"],
      followUps: [{ ifMissing: ["atomic", "race"], text: "Does volatile make an access atomic or thread-safe?", zh: "volatile 能讓存取變成 atomic 或 thread-safe 嗎？" }, { ifContains: ["atomic"], text: "How would you protect a 32-bit counter shared between an ISR and a task on a Cortex-M0?", zh: "Cortex-M0 上 ISR 與 task 共享 32-bit 計數器要如何保護？" }] },
    { id: "t2", skill: "compiler", text: "A customer's code works at low optimization but fails at high optimization. What are the most likely causes?", zh: "客戶的程式低最佳化正常、高最佳化失敗，最可能的原因？", keywords: ["undefined behavior", "volatile", "aliasing", "race", "uninitialized", "assembly"],
      followUps: [{ ifMissing: ["aliasing"], text: "Can you explain strict aliasing and how it can break code?", zh: "可以解釋 strict aliasing 以及它如何讓程式出錯嗎？" }, { ifMissing: ["minimal", "reproduc"], text: "How would you prove whether it's a compiler bug or an application bug?", zh: "你會如何證明是編譯器還是應用程式的 bug？" }] },
    { id: "t3", skill: "linker", text: "Explain the difference between .data and .bss, and what the startup code does with them.", zh: "說明 .data 與 .bss 的差異，以及 startup code 如何處理它們。", keywords: ["initialized", "zero", "copy", "flash", "ram", "startup"],
      followUps: [{ ifMissing: ["lma", "load address", "flash"], text: "Where are the initial values of .data stored, and how does the linker describe that?", zh: ".data 的初值存在哪裡？linker 如何描述？" }, { text: "How is this handled in an IAR ICF file compared with a GNU linker script?", zh: "IAR ICF 與 GNU linker script 處理方式有何不同？" }] },
    { id: "t4", skill: "debug", text: "A Cortex-M device hits a HardFault in the field. How would you analyse it?", zh: "Cortex-M 裝置在現場發生 HardFault，你如何分析？", keywords: ["stack frame", "pc", "lr", "cfsr", "hfsr", "fault status", "exc_return"],
      followUps: [{ ifMissing: ["cfsr", "fault status"], text: "Which fault status registers would you read, and what do they tell you?", zh: "你會讀哪些 fault 狀態暫存器？它們告訴你什麼？" }, { ifContains: ["pc", "stack frame"], text: "How do you find the faulting instruction if the stack pointer itself might be corrupted?", zh: "如果 stack pointer 本身可能被破壞，如何找到出錯的指令？" }] },
    { id: "t5", skill: "rtos", text: "What is priority inversion, and how do RTOSes deal with it?", zh: "什麼是 priority inversion？RTOS 如何處理？", keywords: ["low priority", "high priority", "mutex", "inheritance", "medium"],
      followUps: [{ ifMissing: ["inheritance", "ceiling"], text: "What mechanism does a mutex typically provide to limit it?", zh: "mutex 通常提供什麼機制來限制它？" }, { text: "How would you see this happening in a debugger or trace tool?", zh: "你會如何在除錯器或 trace 工具中觀察到它？" }] },
    { id: "t6", skill: "cicd", text: "How would you set up CI for an embedded project so builds and tests are reproducible?", zh: "你會如何為嵌入式專案建立可重現的 CI？", keywords: ["command line", "version", "container", "unit test", "artifact", "static analysis"],
      followUps: [{ ifMissing: ["hardware", "simulator", "hil"], text: "How would you test code that depends on hardware?", zh: "依賴硬體的程式要如何測試？" }, { text: "What would you check if the build works in the IDE but fails in CI?", zh: "IDE 能 build、CI 失敗，你會檢查什麼？" }] },
  ],
  customer: [
    { id: "c1", skill: "fae", text: "We switched our release build to high optimization and now our ADC polling loop hangs. Is your compiler broken?", zh: "我們把 Release 改成高最佳化後，ADC 輪詢迴圈卡住了。你們的編譯器壞了嗎？", keywords: ["volatile", "isr", "flag", "optimization", "reproduce", "minimal"],
      followUps: [{ ifMissing: ["volatile"], text: "The flag is set in an interrupt handler. Does that matter?", zh: "那個旗標是在中斷處理函式中設定的，這有關係嗎？" }, { ifContains: ["volatile"], text: "We added volatile and it works. But why did it work before at low optimization?", zh: "加了 volatile 就好了，但為什麼低最佳化時本來就正常？" }] },
    { id: "c2", skill: "linker", text: "The linker now says our ROM region overflowed by 2 KB after adding a small feature. We can't change the chip. What can we do?", zh: "加了一個小功能後 linker 說 ROM 溢出 2 KB，我們不能換晶片，怎麼辦？", keywords: ["map file", "printf", "optimization", "size", "library", "unused"],
      followUps: [{ ifMissing: ["map"], text: "How would we find out what is actually taking the space?", zh: "我們要怎麼知道是什麼佔了空間？" }, { text: "If we use size optimization everywhere, will our control loop get slower?", zh: "全部用 size 最佳化，控制迴圈會變慢嗎？" }] },
    { id: "c3", skill: "compiler", text: "We ported our code from GCC and a protocol parser now gives different results. Our GCC build was correct, so IAR must be wrong.", zh: "我們從 GCC 移植，協定解析器結果不同。GCC 版本是對的，所以一定是 IAR 錯了。", keywords: ["undefined", "enum", "struct", "layout", "packed", "minimal", "alignment"],
      followUps: [{ ifMissing: ["enum", "layout", "struct"], text: "The parser casts a byte buffer to a struct that contains an enum. Could that matter?", zh: "解析器把 byte buffer 轉型成含有 enum 的 struct，這有影響嗎？" }, { text: "How can we make sure this kind of problem doesn't come back?", zh: "如何確保這類問題不再發生？" }] },
    { id: "c4", skill: "debug", text: "In the debugger, some local variables show wrong values or 'unavailable'. Our engineers don't trust the debugger anymore.", zh: "除錯器中有些區域變數顯示錯誤或 unavailable，我們的工程師已經不信任除錯器了。", keywords: ["optimization", "register", "scope", "rebuild", "disassembly", "debug configuration"],
      followUps: [{ ifMissing: ["optimization"], text: "We build with the default settings. Is that the problem?", zh: "我們用預設設定 build，問題在這裡嗎？" }, { text: "We need to debug the release build because the bug only happens there. Any advice?", zh: "bug 只在 release 版出現，必須在 release 除錯，有建議嗎？" }] },
    { id: "c5", skill: "fae", text: "Honestly, GCC is free and our team knows it. Why should my manager approve the budget for IAR?", zh: "說實話，GCC 免費，團隊也熟。我的主管為什麼要批 IAR 的預算？", keywords: ["evaluation", "code size", "certification", "support", "measure", "success criteria"],
      followUps: [{ ifMissing: ["measure", "evaluation", "data"], text: "Can you prove that it will make a difference for us?", zh: "你能證明對我們會有差別嗎？" }, { ifContains: ["evaluation"], text: "We don't have much time for an evaluation. What's the minimum we'd need to do?", zh: "我們沒什麼時間評估，最少需要做什麼？" }] },
    { id: "c6", skill: "fae", text: "We're worried about being locked in to one vendor. What happens if we want to switch back later?", zh: "我們擔心被單一供應商綁定，如果之後想換回去怎麼辦？", keywords: ["elf", "standard", "cmsis", "portable", "both toolchains", "ci"],
      followUps: [{ ifMissing: ["cmsis", "macro"], text: "We use some compiler-specific keywords already. How do we keep the code portable?", zh: "我們已經用了一些編譯器特定關鍵字，如何保持可攜性？" }] },
  ],
};

export function personaSystem(mode: MockMode) {
  const common = `Stay in character. Ask ONE question at a time, in natural spoken business English (1-3 sentences). Base follow-ups on what the candidate actually said: probe vague points, ask for examples, challenge weak claims politely. Never invent facts about the candidate.`;
  if (mode === "recruiter")
    return `You are Nick, a friendly but direct headhunter screening a candidate for the IAR Systems FAE / Technical Support Specialist role in Taipei (region: Taiwan, SEA, ANZ; pre-sales + post-sales; part of a global support team; IAR is part of Qt Group). Topics to cover: career background, motivation, English communication, salary expectations (budget info you may reveal if asked: total comp budget up to about TWD 4,000,000 — a ceiling, not guaranteed; 70/30 base/bonus; bonus quarterly after 6-month probation; remote work not confirmed), availability, career transition from manager to FAE. ${common}`;
  if (mode === "technical")
    return `You are a technical manager for FAE / technical support at IAR Systems interviewing a candidate. Probe: embedded C/C++ (volatile, atomics, UB), compiler optimization behavior, linker & memory layout (sections, startup, linker configuration files), debugging (HardFault, optimized code, disassembly), RTOS (scheduling, priority inversion), toolchain integration & CI, and structured troubleshooting. Expect precise answers; if an answer is partially wrong, ask a follow-up that exposes the gap. ${common}`;
  return `You are a customer engineer or engineering manager talking to an IAR FAE. Present realistic problems: optimization causing failures, linker memory overflow, different results between GCC and IAR, debugger not showing variables correctly, doubts about paying for a commercial compiler, vendor lock-in. Be a bit skeptical and impatient but fair. React to the FAE's answer: if they ask good questions, give plausible details; if they over-promise, push back. ${common}`;
}
