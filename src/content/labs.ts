import type { SkillId } from "./skills";
import type { QuizQuestion } from "./types";

export type LabId = "optimization" | "memory-layout" | "sections" | "stack-heap" | "rtos-sim" | "asm-walkthrough" | "debug-cases";

export type LabMeta = {
  id: LabId;
  title: string;
  en: string;
  skill: SkillId;
  minutes: number;
  desc: string;
  /** Where the data comes from — shown on the page so nothing is mistaken for a live compiler. */
  dataNote: string;
  lessons: string[];
  checkpoint: QuizQuestion[];
};

export const LABS: LabMeta[] = [
  {
    id: "optimization",
    title: "編譯最佳化比較",
    en: "Optimization Explorer",
    skill: "compiler",
    minutes: 25,
    desc: "同一段 C 程式在 -O0 / -O1 / -O2 / -O3 / -Os 下的真實組合語言與函式大小，觀察 volatile、迴圈、inline、memset 辨識與 switch 查表。",
    dataNote: "預先編譯（離線以 arm-none-eabi-gcc 14.2.1 產生並記錄），網站不會即時執行編譯器。IAR 的輸出會不同，原理相通。",
    lessons: ["t1-optimization", "t1-volatile", "t5-compiler"],
    checkpoint: [
      { id: "lab-opt-q1", skill: "compiler", q: "wait_ready() 在 -O2 被編成「讀一次 g_ready，若為 0 就 `b .L3` 原地無限迴圈」，原因是？", options: ["編譯器 bug", "g_ready 不是 volatile，編譯器可假設迴圈中它不會改變", "-O2 不支援迴圈", "缺少 -mthumb"], answer: 1, explain: "非 volatile 物件在沒有其他副作用的迴圈中可被視為不變；ISR 共用變數需要 volatile（或 atomic/屏障）。" },
      { id: "lab-opt-q2", skill: "compiler", q: "clear_buf() 在 -O2 變成 `b memset`，這代表？", options: ["程式錯誤", "GCC 辨識出清零迴圈並改為呼叫 memset（tail call）", "-O2 移除了函式", "memset 是 inline asm"], answer: 1, explain: "loop idiom recognition；在 freestanding 環境或實作 memset 本身時要注意（-ffreestanding / -fno-tree-loop-distribute-patterns）。" },
      { id: "lab-opt-q3", skill: "compiler", q: "calc() 在 -O1 以上只剩 `movs r0, #70`，主要是哪個最佳化？", options: ["loop unrolling", "inlining + constant folding", "tail call", "register spilling"], answer: 1, explain: "scale() 被 inline 後，參數都是常數，整個運算在編譯期算出：(100*8>>4)+(20*16>>4)=50+20=70。" },
      { id: "lab-opt-q4", skill: "compiler", q: "map_cmd() 在 -O2 的輸出用了 `CSWTCH.1` 位元組表，這是？", options: ["jump table（跳到不同程式碼）", "switch 轉成查值表（每個 case 只回傳常數）", "debug 資訊", "向量表"], answer: 1, explain: "當每個 case 只回傳常數，GCC 可以把 switch 轉成資料查表，比比較鏈更小更快。" },
      { id: "lab-opt-q5", skill: "compiler", q: "比較最佳化結果時，下列何者最正確？", options: ["-O3 永遠最小", "-Os 永遠最快", "要依程式實測；O3 可能因展開/向量化變大，Os 通常偏小但不保證", "-O0 最適合量產"], answer: 2, explain: "本 Lab 中 clear_buf 在 -Os 為 16 bytes、-O2 為 12 bytes（tail call memset），顯示「實測」的重要。" },
    ],
  },
  {
    id: "memory-layout",
    title: "記憶體配置圖",
    en: "Memory Layout",
    skill: "linker",
    minutes: 20,
    desc: "猜猜每個變數/函式會落在哪個 section（.text / .rodata / .data / .bss / .noinit / stack / 被最佳化掉），再用真實的 objdump 結果對答案，並看 Flash/RAM 對照圖。",
    dataNote: "答案來自離線以 arm-none-eabi-gcc 14.2.1（-O1 -fno-common）編譯後的 objdump -t / nm 結果。",
    lessons: ["t2-memory", "t2-linker-script", "t2-startup"],
    checkpoint: [
      { id: "lab-mem-q1", skill: "linker", q: "`int32_t g_zero_expl = 0;` 被放在？", options: [".data", ".bss", ".rodata", ".text"], answer: 1, explain: "初值為 0 的變數 GCC 預設放 .bss（不佔 Flash 初值），即使明確寫了 = 0。" },
      { id: "lab-mem-q2", skill: "linker", q: "`const char *g_msg = \"hello\";` 中 g_msg 本身在？", options: [".rodata", ".data（指標可變、有初值）", ".bss", ".text"], answer: 1, explain: "指標本身不是 const，有初值 → .data；字串字面值在 .rodata。若寫成 const char * const 才會進 .rodata。" },
      { id: "lab-mem-q3", skill: "linker", q: "`static int32_t s_file_static = 5;` 在符號表中找不到，為什麼？", options: ["編譯失敗", "從未被修改，編譯器把它當常數折疊掉了", "放在 stack", "放在 .noinit"], answer: 1, explain: "static 且從未被寫入 → 編譯器可直接用常數 5 取代讀取，物件本身被移除。" },
      { id: "lab-mem-q4", skill: "linker", q: ".data 的 VMA 在 RAM（0x2000_0000），LMA 在 Flash，代表？", options: ["連結錯誤", "初值存在 Flash，startup 在 main 前複製到 RAM", ".data 不會被使用", "需要 __no_init"], answer: 1, explain: "這就是 LMA/VMA 的意義；IAR 的對應是 ICF 的 initialize by copy。" },
      { id: "lab-mem-q5", skill: "linker", q: "`counter()` 中的 local 變數 `local` 位於？", options: [".bss", ".data", "暫存器或 stack（不在任何 section）", ".rodata"], answer: 2, explain: "automatic 變數在執行時配置於暫存器/stack，不會出現在符號表。" },
    ],
  },
  {
    id: "sections",
    title: "Section 與 Linker 分析",
    en: "Sections & Linking",
    skill: "linker",
    minutes: 20,
    desc: "同一個程式在「一般連結」與「-ffunction-sections -fdata-sections --gc-sections」下的 section 大小、位址、LMA/VMA，以及哪些符號被移除。",
    dataNote: "預先連結（離線以 arm-none-eabi-gcc 14.2.1 + 本 Lab 的 linker script 產生 size -A / objdump -h / nm 結果）。",
    lessons: ["t2-linking", "t2-linker-script", "t5-ilink"],
    checkpoint: [
      { id: "lab-sec-q1", skill: "linker", q: "開啟 --gc-sections 後 .rodata 從 268 bytes 降到 6 bytes，主要原因是？", options: ["壓縮", "g_table 沒有被任何保留下來的程式引用，被整個 section 移除", "改放 RAM", "最佳化等級改變"], answer: 1, explain: "counter() 讀 g_table[3] 已在編譯期被折疊為常數，g_table 不再被引用；-fdata-sections 讓它有自己的 section 才能被移除。" },
      { id: "lab-sec-q2", skill: "linker", q: "沒有 -ffunction-sections 時，unused_function 為何沒被移除？", options: ["它是 global", "GNU ld 以 section 為單位回收；所有函式都在同一個 .text，無法單獨移除", "它被呼叫了", "linker script 錯誤"], answer: 1, explain: "IAR ILINK 預設以 section 為單位移除未引用內容（t5-ilink）。" },
      { id: "lab-sec-q3", skill: "linker", q: "Berkeley 格式 `size` 輸出的 text 欄位包含？", options: ["只有 .text", ".text + .rodata 等唯讀內容（Flash 佔用的主要部分）", "RAM 用量", ".bss"], answer: 1, explain: "text 欄是所有 read-only alloc section；Flash 實際用量 ≈ text + data（初值）。" },
      { id: "lab-sec-q4", skill: "linker", q: ".noinit 用 NOLOAD 放在 RAM，代表？", options: ["啟動時會清零", "啟動時不初始化，也不佔 Flash 初值", "會複製初值", "放在 Flash"], answer: 1, explain: "對應 IAR 的 __no_init + do not initialize。" },
    ],
  },
  {
    id: "stack-heap",
    title: "Stack / Heap 模擬",
    en: "Stack & Heap Simulator",
    skill: "debug",
    minutes: 15,
    desc: "逐步執行遞迴呼叫與 malloc，觀察 stack 往下長、heap 往上長、stack frame 內容、水位標記（watermark），以及兩者碰撞時發生什麼。",
    dataNote: "教學用模擬：frame 大小為示意值，實際值請看編譯器的 -fstack-usage（GCC）或 linker stack usage analysis（IAR）。",
    lessons: ["t2-memory", "t3-hardfault", "t5-ilink"],
    checkpoint: [
      { id: "lab-sh-q1", skill: "debug", q: "Cortex-M 的 stack 成長方向是？", options: ["往高位址", "往低位址（full descending）", "隨機", "依編譯器"], answer: 1, explain: "AAPCS/Cortex-M 使用 full-descending stack：push 先遞減 SP 再寫入。" },
      { id: "lab-sh-q2", skill: "debug", q: "「填 0xDEADBEEF 後看還剩多少沒被改」這種方法叫？", options: ["static analysis", "stack painting / watermark", "MPU guard", "semihosting"], answer: 1, explain: "動態量測最高水位；與靜態分析（IAR stack usage analysis、GCC -fstack-usage）互補。" },
      { id: "lab-sh-q3", skill: "debug", q: "沒有 MPU 保護時，stack 往下長進 heap 區域通常會？", options: ["立即 HardFault", "靜默地覆寫 heap 資料，之後才出現奇怪的錯誤", "自動擴大 stack", "編譯錯誤"], answer: 1, explain: "這就是 stack overflow 難除錯的原因；可用 MPU guard region、Armv8-M 的 MSPLIM/PSPLIM、或 RTOS stack check。" },
      { id: "lab-sh-q4", skill: "debug", q: "遞迴深度 n 時 stack 用量大約是？", options: ["固定", "n × 每層 frame 大小", "log n", "與 n 無關"], answer: 1, explain: "這也是 IAR stack usage analysis 需要在 .suc 指定最大遞迴深度的原因。" },
    ],
  },
  {
    id: "rtos-sim",
    title: "RTOS 排程模擬",
    en: "RTOS Scheduler Simulator",
    skill: "rtos",
    minutes: 20,
    desc: "固定優先權搶占式排程的逐 tick 模擬與甘特圖；重現 priority inversion，並切換 priority inheritance 觀察高優先權 task 的延遲變化。",
    dataNote: "簡化模型：單核、固定優先權、mutex 不巢狀、context switch 時間忽略；行為對應 FreeRTOS 的 mutex（具 priority inheritance）與 binary semaphore（無）。",
    lessons: ["t4-rtos", "t4-interrupts"],
    checkpoint: [
      { id: "lab-rtos-q1", skill: "rtos", q: "Priority inversion 的定義是？", options: ["低優先權 task 永遠不執行", "高優先權 task 等待低優先權 task 持有的資源，而中優先權 task 又搶占了低優先權 task", "中斷優先權設反", "task 優先權相同"], answer: 1, explain: "經典案例：Mars Pathfinder（1997）。" },
      { id: "lab-rtos-q2", skill: "rtos", q: "Priority inheritance 如何緩解？", options: ["提高所有 task 優先權", "持有 mutex 的低優先權 task 暫時繼承等待者的高優先權", "關閉中斷", "改用 round-robin"], answer: 1, explain: "讓 L 盡快釋放 mutex，中優先權 task 無法插隊。" },
      { id: "lab-rtos-q3", skill: "rtos", q: "FreeRTOS 中哪一種有 priority inheritance？", options: ["binary semaphore", "mutex（xSemaphoreCreateMutex）", "queue", "event group"], answer: 1, explain: "FreeRTOS 的 mutex 實作 priority inheritance；binary semaphore 沒有，適合同步而非互斥。" },
      { id: "lab-rtos-q4", skill: "rtos", q: "固定優先權搶占式排程中，較高優先權 task 變成 ready 時？", options: ["等目前 task 主動讓出", "立即搶占較低優先權的執行中 task", "下一秒才執行", "隨機"], answer: 1, explain: "這是 preemptive 的定義（FreeRTOS configUSE_PREEMPTION=1）。" },
    ],
  },
  {
    id: "asm-walkthrough",
    title: "組合語言逐步解析",
    en: "Assembly Walkthrough",
    skill: "debug",
    minutes: 20,
    desc: "用 Cortex-M0（Thumb-1）真實編譯輸出，逐條執行指令、觀察暫存器與 N/Z/C/V 旗標變化，理解 AAPCS 參數傳遞（r0–r3）與回傳值（r0）。",
    dataNote: "組合語言為離線以 arm-none-eabi-gcc 14.2.1（-mcpu=cortex-m0 -mthumb -O1）產生；執行由瀏覽器內的小型 Thumb 子集直譯器模擬（只支援本頁出現的指令）。",
    lessons: ["t3-disasm", "t4-cortex", "t3-hardfault"],
    checkpoint: [
      { id: "lab-asm-q1", skill: "debug", q: "依 AAPCS，max3(a, b, c) 的三個參數在進入函式時位於？", options: ["stack", "r0、r1、r2", "r4–r6", "lr、sp、pc"], answer: 1, explain: "前四個整數參數用 r0–r3，回傳值放 r0。" },
      { id: "lab-asm-q2", skill: "debug", q: "`bx lr` 的作用是？", options: ["呼叫函式", "返回呼叫者（跳到 lr 中的返回位址）", "清除旗標", "進入中斷"], answer: 1, explain: "lr 存放 bl 時的返回位址；bx 也會依 bit0 決定 Thumb 狀態。" },
      { id: "lab-asm-q3", skill: "debug", q: "`subs r3, r0, #0` 之後接 `beq`，這個技巧的用途？", options: ["把 r0 清零", "複製 r0 到 r3 並同時依結果設定 Z 旗標，省一條 cmp", "除法", "產生 HardFault"], answer: 1, explain: "Thumb-1 的 s 後綴指令會更新旗標。" },
      { id: "lab-asm-q4", skill: "debug", q: "max3 的編譯結果先比較 b 與 c，再與 a 比較，說明了？", options: ["編譯器 bug", "只要結果相同，編譯器可以重新安排運算順序（as-if rule）", "參數順序錯誤", "-O1 不正確"], answer: 1, explain: "as-if rule：可觀察行為一致即可。也是除錯最佳化程式碼時「單步跳來跳去」的原因。" },
    ],
  },
  {
    id: "debug-cases",
    title: "除錯案例分析",
    en: "Debug Case Studies",
    skill: "debug",
    minutes: 25,
    desc: "Cortex-M CFSR / HFSR 解碼器，加上 5 個 FAE 情境案例：讀暫存器值 → 判斷 fault 類型 → 推論根因 → 給客戶的建議。",
    dataNote: "位元定義依 Armv7-M（Cortex-M3/M4/M7）System Control Block；Armv6-M（M0/M0+）沒有 CFSR。案例為教學情境。",
    lessons: ["t3-hardfault", "t3-gdb", "t3-compiler-bug"],
    checkpoint: [
      { id: "lab-dbg-q1", skill: "debug", q: "CFSR = 0x00000100，代表？", options: ["DIVBYZERO", "IBUSERR（取指令時 bus error）", "PRECISERR", "IACCVIOL"], answer: 1, explain: "bit 8 = BFSR.IBUSERR。" },
      { id: "lab-dbg-q2", skill: "debug", q: "CFSR = 0x02000000，代表？", options: ["UNALIGNED", "DIVBYZERO（需啟用 DIV_0_TRP）", "NOCP", "INVPC"], answer: 1, explain: "bit 25 = UFSR.DIVBYZERO；預設除以零回傳 0，需設定 CCR.DIV_0_TRP 才會 fault。" },
      { id: "lab-dbg-q3", skill: "debug", q: "HFSR = 0x40000000 時下一步應該？", options: ["忽略", "讀 CFSR 找原本被升級的 fault", "重新燒錄", "更換 probe"], answer: 1, explain: "FORCED 表示 configurable fault 被升級為 HardFault。" },
      { id: "lab-dbg-q4", skill: "debug", q: "MMARVALID / BFARVALID 為 1 時代表？", options: ["fault 已清除", "MMFAR / BFAR 中的位址有效，可用來找出錯的存取位址", "需要 reset", "MPU 已關閉"], answer: 1, explain: "讀出位址後對照 map file 找出對應變數或周邊。" },
    ],
  },
];

export const LAB_BY_ID: Record<string, LabMeta> = Object.fromEntries(LABS.map((l) => [l.id, l]));

// ── Optimization lab: what to look for in each sample ─────────────────────
export const OPT_NOTES: Record<string, { title: string; focus: string; byLevel: Partial<Record<string, string>> }> = {
  opt_flag: {
    title: "ISR 旗標與 volatile",
    focus: "比較 wait_ready（沒有 volatile）與 wait_ready_volatile。",
    byLevel: {
      O0: "兩個函式都在迴圈內每次重新讀記憶體（-O0 不做這類最佳化），所以「沒加 volatile」的 bug 在 -O0 看不出來。",
      O1: "wait_ready：只讀一次 g_ready，若為 0 就跳到原地無限迴圈 —— ISR 之後改了它也不會離開。wait_ready_volatile：每圈都 ldr。",
      O2: "同 -O1：`cbz r3, .L3` 然後 `.L3: b .L3`，是典型「升級最佳化後卡死」的客戶案例。",
      Os: "同樣的問題，只是分支方向不同（cbnz）。",
    },
  },
  opt_sum: {
    title: "陣列加總迴圈",
    focus: "觀察 -O0 的 stack 存取 vs -O1 以上的暫存器化與 post-index 位址模式。",
    byLevel: {
      O0: "每個變數（s、i、a、n）都存放在 stack frame，每次用都要 ldr/str —— 這是 -O0 好除錯、但慢的原因。",
      O1: "變數都在暫存器；用 `ldr r2, [r3, #4]!`（pre-index writeback）邊走訪邊更新指標。",
      O3: "Cortex-M4 沒有 SIMD 向量單元可用於這種 32-bit 加總，因此 -O3 結果與 -O2 相同大小。",
      Os: "以大小為優先，比 -O2 再省 4 bytes。",
    },
  },
  opt_clear: {
    title: "清零迴圈 → memset",
    focus: "觀察 -O2 以上把整個迴圈換成 `b memset`（tail call）。",
    byLevel: {
      O0: "逐 byte 的迴圈，含 stack 存取，52 bytes。",
      O1: "暫存器化的 strb 迴圈。",
      O2: "辨識出「清零」的慣用寫法，改成呼叫 memset。若你正在實作 memset 本身或在 freestanding 環境，這會造成遞迴或連結錯誤。",
      Os: "-Os 沒有轉成 memset，保留小迴圈（16 bytes）—— 大小與速度的取捨。",
    },
  },
  opt_inline: {
    title: "Inline 與常數折疊",
    focus: "static 小函式 scale() 在 -O1 以上消失。",
    byLevel: {
      O0: "scale() 是獨立函式，calc() 用 bl 呼叫兩次。",
      O1: "scale() 被 inline 並在編譯期算完：calc() 只剩 `movs r0, #70`。calc_var() 用 sbfx（有號位元欄位擷取）實作 (x*8)>>4 與 (x*16)>>4。",
    },
  },
  opt_switch: {
    title: "switch → 查表",
    focus: "密集的 case 值可以變成資料表。",
    byLevel: {
      O0: "逐一比較的分支鏈，82 bytes。",
      O1: "仍是比較/分支，但精簡許多。",
      O2: "GCC 產生 CSWTCH.1 位元組表 + IT 區塊（itte ls），20 bytes：範圍檢查後直接 ldrsb 查表。",
    },
  },
};

// ── Memory layout lab: objects to classify ────────────────────────────────
export type MemAnswer = ".text" | ".rodata" | ".data" | ".bss" | ".noinit" | "stack/register" | "optimized away";
export const MEM_ITEMS: { sym: string; decl: string; answer?: MemAnswer; why: string }[] = [
  { sym: "g_init", decl: "int32_t g_init = 42;", why: "有非零初值的可寫全域變數 → .data（初值存在 Flash，啟動時複製到 RAM）。" },
  { sym: "g_zero", decl: "int32_t g_zero;", why: "未初始化的全域變數 → .bss（啟動時清零）。本 Lab 使用 -fno-common（GCC 10 起的預設）。" },
  { sym: "g_zero_expl", decl: "int32_t g_zero_expl = 0;", why: "明確初始化為 0 也一樣放 .bss，不佔 Flash 初值。" },
  { sym: "g_const", decl: "const int32_t g_const = 7;", why: "const 全域物件 → .rodata（在 Flash）。" },
  { sym: "g_table", decl: "const uint8_t g_table[256] = {1,2,3};", why: "大型 const 表 → .rodata。好處：不佔 RAM。" },
  { sym: "s_file_static", decl: "static int32_t s_file_static = 5;", answer: "optimized away", why: "static 且從未被寫入，編譯器直接用常數 5，物件被移除（符號表中不存在）。" },
  { sym: "g_msg", decl: "const char *g_msg = \"hello\";", why: "指標本身可修改且有初值 → .data；\"hello\" 字串本身在 .rodata。" },
  { sym: "g_buf", decl: "char g_buf[64];", why: "未初始化陣列 → .bss。" },
  { sym: "g_reset_reason", decl: "__attribute__((section(\".noinit\"))) uint32_t g_reset_reason;", why: "自訂 .noinit section，linker script 以 NOLOAD 放 RAM，啟動時不清零（IAR：__no_init）。" },
  { sym: "calls.1", decl: "static int32_t calls; /* in counter() */", why: "static local 的生命週期是整個程式 → 和全域一樣在 .bss；GCC 會把名稱加上 .1 之類的後綴。" },
  { sym: "base", decl: "static int32_t base = 100; /* in counter() */", answer: "optimized away", why: "從未被修改的 static local，被常數折疊掉。" },
  { sym: "local", decl: "int32_t local = base + calls++; /* in counter() */", answer: "stack/register", why: "automatic 變數，執行時在暫存器或 stack，不在任何 section。" },
  { sym: "counter", decl: "int32_t counter(void) { ... }", why: "函式程式碼 → .text（Flash）。" },
];

// ── Debug cases ────────────────────────────────────────────────────────────
export type FaultBit = { bit: number; name: string; reg: "MMFSR" | "BFSR" | "UFSR" | "HFSR"; desc: string };
export const CFSR_BITS: FaultBit[] = [
  { bit: 0, name: "IACCVIOL", reg: "MMFSR", desc: "取指令違反 MPU 權限（例如執行 XN 區域、跳到錯誤位址）" },
  { bit: 1, name: "DACCVIOL", reg: "MMFSR", desc: "資料存取違反 MPU 權限" },
  { bit: 3, name: "MUNSTKERR", reg: "MMFSR", desc: "例外返回 unstacking 時 MemManage fault" },
  { bit: 4, name: "MSTKERR", reg: "MMFSR", desc: "進入例外 stacking 時 MemManage fault（常見於 stack overflow 進入 guard 區）" },
  { bit: 5, name: "MLSPERR", reg: "MMFSR", desc: "FPU lazy state preservation 時 MemManage fault" },
  { bit: 7, name: "MMARVALID", reg: "MMFSR", desc: "MMFAR 位址有效" },
  { bit: 8, name: "IBUSERR", reg: "BFSR", desc: "取指令時 bus error" },
  { bit: 9, name: "PRECISERR", reg: "BFSR", desc: "精確的資料 bus error：stacked PC 指向出錯指令" },
  { bit: 10, name: "IMPRECISERR", reg: "BFSR", desc: "不精確的資料 bus error（write buffer）：PC 可能已往後走" },
  { bit: 11, name: "UNSTKERR", reg: "BFSR", desc: "例外返回 unstacking 時 bus error" },
  { bit: 12, name: "STKERR", reg: "BFSR", desc: "進入例外 stacking 時 bus error（SP 指到無效記憶體，常見 stack overflow）" },
  { bit: 13, name: "LSPERR", reg: "BFSR", desc: "FPU lazy state preservation 時 bus error" },
  { bit: 15, name: "BFARVALID", reg: "BFSR", desc: "BFAR 位址有效" },
  { bit: 16, name: "UNDEFINSTR", reg: "UFSR", desc: "未定義指令（資料被當程式執行、或錯誤的 CPU 選項）" },
  { bit: 17, name: "INVSTATE", reg: "UFSR", desc: "非法 EPSR 狀態：常見於跳到 bit0=0 的位址（Thumb bit 錯誤 / 函式指標損毀）" },
  { bit: 18, name: "INVPC", reg: "UFSR", desc: "非法 EXC_RETURN（例外返回值錯誤，常見 stack 損毀）" },
  { bit: 19, name: "NOCP", reg: "UFSR", desc: "使用未啟用的 coprocessor（FPU 未在 CPACR 啟用）" },
  { bit: 20, name: "STKOF", reg: "UFSR", desc: "Stack limit 違反（僅 Armv8-M，MSPLIM/PSPLIM）" },
  { bit: 24, name: "UNALIGNED", reg: "UFSR", desc: "未對齊存取（需 CCR.UNALIGN_TRP，或 LDM/STRD 等永遠需要對齊的指令）" },
  { bit: 25, name: "DIVBYZERO", reg: "UFSR", desc: "整數除以零（需 CCR.DIV_0_TRP）" },
];
export const HFSR_BITS: FaultBit[] = [
  { bit: 1, name: "VECTTBL", reg: "HFSR", desc: "讀取向量表時 bus fault（VTOR 錯誤或向量表位址無效）" },
  { bit: 30, name: "FORCED", reg: "HFSR", desc: "可設定的 fault 被升級為 HardFault（handler 未啟用或優先權不足），請看 CFSR" },
  { bit: 31, name: "DEBUGEVT", reg: "HFSR", desc: "debug 事件造成（例如沒接 debugger 時執行 BKPT）" },
];

export const DEBUG_CASES: {
  id: string;
  title: string;
  story: string;
  cfsr: number;
  hfsr: number;
  extra: string;
  question: string;
  options: string[];
  answer: number;
  explain: string;
  advice: string;
}[] = [
  {
    id: "c1",
    title: "升級最佳化後偶發當機",
    story: "客戶把 Release 改成較高最佳化等級後，某個 RTOS task 偶發 HardFault。stacked PC 每次都落在不同函式。",
    cfsr: 0x00001000,
    hfsr: 0x40000000,
    extra: "PSP = 0x2000_7F10；該 task 的 stack 範圍為 0x2000_7F20 – 0x2000_831F",
    question: "最可能的根因？",
    options: ["編譯器產生錯誤指令", "Task stack overflow：例外 stacking 時寫到 stack 範圍之外", "FPU 未啟用", "向量表錯誤"],
    answer: 1,
    explain: "STKERR（bit12）＋ FORCED，且 PSP 已低於 task stack 底部 → stack overflow。不同最佳化等級的 inline 決策會改變 stack 深度。",
    advice: "開啟 RTOS stack overflow 檢查與 stack watermark，或用 IAR linker stack usage analysis / GCC -fstack-usage 算出最深路徑，調整 task stack 並加入 CI 檢查。",
  },
  {
    id: "c2",
    title: "呼叫 callback 時當機",
    story: "客戶從 EEPROM 讀出設定後呼叫對應的 callback 函式，立即 HardFault。",
    cfsr: 0x00020000,
    hfsr: 0x40000000,
    extra: "stacked PC = 0x0800_1A40（偶數位址）；函式表項目值 = 0x0800_1A40",
    question: "最可能的根因？",
    options: ["Thumb bit（bit0）為 0：函式指標值錯誤或被損毀", "除以零", "bus error", "未對齊存取"],
    answer: 0,
    explain: "INVSTATE（bit17）：Cortex-M 只能執行 Thumb，跳到 bit0=0 的位址會進入非法狀態。函式指標從資料（EEPROM）來，值少了 |1。",
    advice: "不要把函式位址存在外部儲存；改存索引並用 const 函式表查詢，並驗證範圍。",
  },
  {
    id: "c3",
    title: "第一個浮點運算就當機",
    story: "新板子 bring-up：程式在 main 中第一次做 float 乘法就 fault；舊專案沒這問題。",
    cfsr: 0x00080000,
    hfsr: 0x40000000,
    extra: "編譯選項：-mfpu=fpv4-sp-d16 -mfloat-abi=hard；SystemInit() 是自己寫的",
    question: "最可能的根因？",
    options: ["FPU 未在 CPACR 啟用（NOCP）", "stack overflow", "MPU 設定錯誤", "記憶體不足"],
    answer: 0,
    explain: "NOCP（bit19）：使用 coprocessor（FPU）但未啟用。CMSIS 的 SystemInit 通常會設定 SCB->CPACR，自寫版本漏掉了。",
    advice: "在 startup/SystemInit 中於使用任何浮點指令前設定 CPACR（CP10/CP11 full access），並加 DSB/ISB。",
  },
  {
    id: "c4",
    title: "讀周邊暫存器 fault",
    story: "客戶初始化 SPI 時一讀暫存器就 fault。",
    cfsr: 0x00008200,
    hfsr: 0x40000000,
    extra: "BFAR = 0x4001_3000（SPI1 base）；RCC 中 SPI1 時脈 enable 位元 = 0",
    question: "最可能的根因？",
    options: ["周邊時脈未開啟就存取暫存器", "stack overflow", "Thumb bit 錯誤", "FPU 未啟用"],
    answer: 0,
    explain: "PRECISERR + BFARVALID，BFAR 指向 SPI1。許多 MCU 在時脈未開時存取周邊會產生 bus error（行為依晶片）。",
    advice: "確認時脈/電源 domain 已開啟、reset 已釋放；用 BFAR 對照晶片的 memory map 快速定位。",
  },
  {
    id: "c5",
    title: "PC 指向的程式看起來沒問題",
    story: "HardFault 時 stacked PC 指向一行很單純的加法，但客戶確定那行沒有問題。",
    cfsr: 0x00000400,
    hfsr: 0x40000000,
    extra: "前面幾行剛寫入一個外部 SRAM 位址（FMC 區域）",
    question: "應該怎麼繼續調查？",
    options: ["相信 PC，檢查加法", "IMPRECISERR：PC 不精確，暫時關閉 write buffer（ACTLR.DISDEFWBUF）讓 fault 變精確後重現", "換 debugger", "重新安裝工具"], 
    answer: 1,
    explain: "IMPRECISERR（bit10）：寫入經過 write buffer，fault 回報時 CPU 已執行到後面的指令。",
    advice: "在 Cortex-M3/M4 上可設定 ACTLR.DISDEFWBUF 暫時讓 bus fault 變 precise（影響效能，僅除錯用），再看 PRECISERR + BFAR。",
  },
];

// ── RTOS simulator scenarios ───────────────────────────────────────────────
export type RtosTask = {
  name: string;
  prio: number; // higher = more important
  release: number; // tick it becomes ready
  /** Sequence of steps: "c" = compute 1 tick, "L" = lock mutex, "U" = unlock mutex */
  script: string;
  color: string;
};
export const RTOS_SCENARIOS: { id: string; title: string; desc: string; tasks: RtosTask[] }[] = [
  {
    id: "inversion",
    title: "Priority inversion（經典三 task）",
    desc: "L（低）先拿到 mutex；H（高）之後也要同一個 mutex；M（中）不需要 mutex 但會搶占 L。",
    tasks: [
      { name: "H", prio: 3, release: 3, script: "cLccUc", color: "var(--chart-1)" },
      { name: "M", prio: 2, release: 4, script: "cccccc", color: "var(--warn)" },
      { name: "L", prio: 1, release: 0, script: "cLccccUc", color: "var(--chart-2)" },
    ],
  },
  {
    id: "preempt",
    title: "單純的搶占式排程",
    desc: "沒有共享資源；觀察較高優先權 task 一 ready 就搶占。",
    tasks: [
      { name: "H", prio: 3, release: 4, script: "ccc", color: "var(--chart-1)" },
      { name: "M", prio: 2, release: 2, script: "cccc", color: "var(--warn)" },
      { name: "L", prio: 1, release: 0, script: "cccccc", color: "var(--chart-2)" },
    ],
  },
];
