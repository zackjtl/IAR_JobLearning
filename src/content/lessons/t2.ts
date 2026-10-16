import type { LessonContent } from "../types";

export const T2: LessonContent[] = [
  // ───────────────────────────────────────────── t2-elf
  {
    id: "t2-elf",
    objectives: [
      "說明 ELF 的三個視角：ELF header、section header table（給 linker/工具）、program header table（給 loader）",
      "辨識 .text / .rodata / .data / .bss 以及 .symtab、.rel/.rela、.debug_* 的用途",
      "用 readelf / objdump / nm / size 檢查 object file 與映像檔",
      "理解 symbol 與 relocation 如何讓 linker 把多個 object 合成一個程式",
    ],
    concept: `
**ELF（Executable and Linkable Format）** 是 GCC、Clang 與 IAR（Arm 等架構）共同使用的目的檔/映像檔格式。IAR 的 .o 與 .out 也是 ELF（除錯資訊為 DWARF），所以許多 GNU binutils 工具也能讀取（IAR 也提供自己的 \`ielfdumparm\` 等工具）。

#### 兩種「表」
- **Section header table**：描述每個 section（.text、.data…）。linker、除錯器、objdump 用它。
- **Program header table（segments）**：描述「要把哪些位元組載入到記憶體哪裡」。燒錄工具、Linux loader 用它。一個 segment 可包含多個 section。

#### 常見 section
- **.text**：程式碼（Flash）。
- **.rodata**：唯讀資料，例如 \`const\` 查表、字串常值（Flash）。
- **.data**：有非零初始值的全域/靜態變數。**執行時在 RAM，初始值存在 Flash**。
- **.bss**：零初始化（或未初始化）的全域/靜態變數。只記錄大小，不佔 Flash 空間，開機時清零。
- **.symtab / .strtab**：符號表與字串表。
- **.rel.text / .rela.text**：重定位項目 —— 「這個位置要填入某符號的位址」。
- **.debug_info / .debug_line …**：DWARF 除錯資訊，不會燒進晶片。
- **.ARM.exidx / .ARM.extab**：C++ 例外處理與 stack unwinding 表（Arm）。

> 不同工具鏈的 section 名稱可能不同。例如 IAR 的初始化資料與向量表會使用自己的命名慣例（如 \`.intvec\`），在 ICF 中以 section 名稱或屬性（readonly / readwrite / zeroinit）選取。

#### Symbol 與 Relocation
- 編譯 main.c 時，呼叫 \`uart_send()\` 只會留下一個**未定義符號**與一筆**重定位項目**。
- Linker 找到 uart.o 中 \`uart_send\` 的定義，決定它的位址，再回填到呼叫指令中。
- **Local symbol**（static）只在本檔可見；**global** 可被其他檔引用；**weak** 可被同名 global 覆蓋 —— CMSIS startup 的預設中斷處理函式就是 weak。
`,
    terms: [
      { en: "ELF", zh: "可執行與可連結格式", note: "Executable and Linkable Format" },
      { en: "Section", zh: "區段", note: "linker 視角的單位：.text/.data…" },
      { en: "Segment / Program Header", zh: "段 / 程式標頭", note: "loader 視角：要載入哪裡" },
      { en: "Symbol Table", zh: "符號表", note: "函式與變數名稱、位址、大小、綁定" },
      { en: "Relocation", zh: "重定位", note: "待 linker 回填位址的位置" },
      { en: "Weak Symbol", zh: "弱符號", note: "可被同名強符號覆蓋" },
      { en: "Zero-initialized Data (.bss)", zh: "零初始化資料", note: "不佔 Flash，開機清零" },
      { en: "Read-only Data (.rodata)", zh: "唯讀資料", note: "const 與字串常值" },
    ],
    diagram: {
      title: "ELF 檔案結構",
      mermaid: `flowchart LR
  subgraph ELF["app.elf"]
    H["ELF Header<br/>架構、entry point"]
    PH["Program Headers<br/>(segments, 給燒錄/loader)"]
    T[".text"]
    R[".rodata"]
    D[".data (初始值)"]
    B[".bss (只有大小)"]
    S[".symtab / .strtab"]
    DB[".debug_* (DWARF)"]
    SH["Section Header Table<br/>(給 linker / debugger)"]
  end
  PH -.->|"LOAD #1 → Flash"| T
  PH -.-> R
  PH -.-> D
  PH -.->|"LOAD #2 → RAM (NOBITS)"| B
  SH -.-> S
  SH -.-> DB`,
    },
    code: [
      {
        title: "每個變數會落在哪個 section？",
        lang: "c",
        code: `#include <stdint.h>

uint32_t        boot_count = 1;        /* .data   (RAM, 初始值在 Flash) */
uint32_t        rx_bytes;              /* .bss    (RAM, 開機清零) */
static uint8_t  buf[512];              /* .bss    (local symbol) */
const uint16_t  crc_table[256] = {0};  /* .rodata (Flash) */
const char     *banner = "v1.2";       /* 指標在 .data，字串在 .rodata */

void process(void)                     /* .text */
{
    static uint32_t calls;             /* .bss （函式內 static） */
    uint32_t local = 0;                /* stack（不在任何 section） */
    calls++;
    (void)local;
}`,
      },
      {
        title: "用 binutils 檢查",
        lang: "bash",
        code: `arm-none-eabi-size app.elf
#   text    data     bss     dec     hex filename
#  18432     264    4096   22792    5908 app.elf
# Flash 用量 ≈ text + data；RAM 用量 ≈ data + bss（另加 stack/heap）

arm-none-eabi-readelf -S main.o      # section 列表
arm-none-eabi-readelf -l app.elf     # program headers / segments
arm-none-eabi-nm -S --size-sort app.elf | tail -20   # 最大的 20 個符號
arm-none-eabi-objdump -d -S main.o   # 反組譯並對照原始碼（需 -g）
arm-none-eabi-readelf -r main.o      # 重定位項目`,
        note: "size 的 text 欄位通常已包含 .rodata 等唯讀區段。",
      },
    ],
    analysis: `
#### 為什麼 .bss 不佔 Flash？
.bss 全部是 0，只需記錄「起點與長度」，開機時由 startup code 清零即可。若把大陣列寫成 \`= {1}\`，整個陣列就會進入 .data，**Flash 與 RAM 都要佔一份** —— 這是常見的空間浪費。

#### 為什麼 .data 要佔兩份？
執行時要可寫 → 必須在 RAM；斷電後要記得初始值 → 必須在 Flash。這就是 **LMA（load address）與 VMA（run address）** 不同的原因（下一課）。

#### FAE 視角
客戶問「為什麼 .out 檔有 2 MB，晶片只有 512 KB Flash？」—— 因為 ELF 包含符號與 DWARF 除錯資訊，不會燒進晶片。真正的 Flash 用量要看 map file 或轉成 .bin/.hex 後的大小。
`,
    cases: [
      {
        title: "Weak handler 讓中斷「默默」跑進無窮迴圈",
        body: "ISR 函式名稱拼錯（例如 USART1_IRQHandler 寫成 UART1_IRQHandler），linker 沒有報錯，因為向量表引用的是 startup 檔中的 weak 預設處理函式（通常是無窮迴圈）。現象是中斷一觸發系統就「卡住」。用 nm 檢查符號是否被正確覆蓋、或在 debugger 中看停在 Default_Handler，可以快速定位。",
      },
      {
        title: "RAM 不夠但程式沒有大陣列？",
        body: "用 nm --size-sort 發現一個第三方函式庫在 .bss 中配置了 32 KB 的內部 buffer，可透過設定巨集縮小。數據驅動的分析比猜測有效得多。",
      },
    ],
    customerQs: [
      {
        q: "Why is the output file so much larger than our flash?",
        zh: "為什麼輸出檔比 Flash 大這麼多？",
        answer: "ELF 檔包含符號表與 DWARF 除錯資訊，這些不會燒錄。請看 map file 的 Flash/RAM 摘要，或輸出 .bin/.hex 看實際映像大小。",
      },
      {
        q: "How can we find which functions take the most flash?",
        zh: "怎麼找出哪些函式最佔 Flash？",
        answer: "看 linker map file 的模組/符號大小統計；GNU 工具可用 nm --size-sort。找出前幾名後再判斷是否被不必要地拉進來（例如 printf 浮點支援）。",
      },
      {
        q: "Can we use GNU objdump on your output files?",
        zh: "可以用 GNU objdump 讀你們的輸出檔嗎？",
        answer: "因為都是標準 ELF/DWARF，多數 binutils 工具可以讀取基本內容；但廠商特定的屬性或除錯擴充可能無法完整解析。IAR 也提供自家的 ELF 工具。具體相容性以實測與官方說明為準。",
      },
    ],
    interviewQs: [
      {
        q: "Explain the difference between .data and .bss.",
        zh: ".data 與 .bss 的差別？",
        points: ["初始值是否為零", "Flash 是否需要存初始值", "startup code 的 copy 與 zero-fill", "空間優化技巧"],
      },
      {
        q: "What's inside an ELF file?",
        zh: "ELF 檔裡有什麼？",
        points: ["header、section、segment", "符號與重定位", "DWARF 除錯資訊", "燒錄的只有 LOAD segment"],
      },
      {
        q: "What is a weak symbol and where is it used?",
        zh: "什麼是 weak symbol？用在哪裡？",
        points: ["可被強符號覆蓋", "startup 預設 ISR", "可覆寫的 hook 函式", "拼錯名稱的風險"],
      },
    ],
    quiz: [
      { id: "t2e-q1", skill: "linker", q: "`static uint8_t buf[512];`（全域）放在哪個 section？", options: [".data", ".bss", ".rodata", "stack"], answer: 1, explain: "無初始值的靜態儲存期變數會零初始化，放在 .bss。" },
      { id: "t2e-q2", skill: "linker", q: "`const uint16_t table[256] = {...};` 通常放在？", options: [".data", ".bss", ".rodata（Flash）", "heap"], answer: 2, explain: "const 全域資料放唯讀區，不佔 RAM。" },
      { id: "t2e-q3", skill: "linker", q: "size 輸出 text=18000, data=200, bss=4000。Flash 用量大約？", options: ["18000", "18200", "22200", "4200"], answer: 1, explain: "Flash ≈ text + data（data 的初始值）；RAM ≈ data + bss。" },
      { id: "t2e-q4", skill: "linker", q: "linker 用哪種資訊把呼叫指令回填成正確位址？", options: ["DWARF", "Relocation entries", "Program header", "Map file"], answer: 1, explain: "重定位項目記錄「哪裡要填什麼符號的位址」。" },
      { id: "t2e-q5", skill: "linker", q: "ISR 名稱拼錯，系統一進中斷就卡住，最可能原因？", options: ["編譯器 bug", "向量表仍指向 weak 預設處理函式", "Stack overflow", "Flash 損毀"], answer: 1, explain: "Weak symbol 沒被覆蓋，linker 不會報錯。" },
      { id: "t2e-q6", skill: "linker", q: "ELF 中哪些部分不會燒錄到晶片？", options: [".text", ".rodata", ".debug_info 等除錯資訊", ".data 初始值"], answer: 2, explain: "除錯資訊只給 debugger 使用。" },
    ],
    reading: [
      { title: "ELF Specification (Tool Interface Standard)", url: "https://refspecs.linuxfoundation.org/elf/elf.pdf", note: "ELF 格式原始規格" },
      { title: "Arm — ELF for the Arm Architecture (aaelf32)", url: "https://github.com/ARM-software/abi-aa", note: "Arm 的 ELF 擴充與重定位類型（abi-aa 倉庫）" },
      { title: "GNU Binutils documentation", url: "https://sourceware.org/binutils/docs/", note: "readelf / objdump / nm / size 用法" },
    ],
  },

  // ───────────────────────────────────────────── t2-memory
  {
    id: "t2-memory",
    objectives: [
      "畫出典型 Cortex-M MCU 的記憶體地圖（Flash、SRAM、周邊、系統區）",
      "理解 stack 與 heap 的配置方式、成長方向與溢位後果",
      "知道如何估算與量測 stack 使用量（靜態分析、stack painting、MPU guard）",
      "說明嵌入式系統為何謹慎使用 malloc（碎片化、決定性）",
    ],
    concept: `
#### 典型 Cortex-M 記憶體地圖
Arm 定義了 4 GB 位址空間的大致分區（各晶片實際大小不同）：
- **0x0000_0000 起：Code 區** —— 通常是 Flash（或映射到 Flash），向量表預設在 0x0。
- **0x2000_0000 起：SRAM 區**。
- **0x4000_0000 起：Peripheral 區** —— 周邊暫存器。
- **0xE000_0000 起：System 區** —— NVIC、SysTick、SCB、除錯元件（Private Peripheral Bus）。

STM32 等晶片的 Flash 常在 0x0800_0000，再由硬體映射到 0x0。

#### Stack
- 存放區域變數、返回位址、保存的暫存器。Cortex-M 的 stack **向下成長**（full-descending）。
- 主 stack（MSP）大小在 linker 設定檔中定義；使用 RTOS 時，**每個 task 都有自己的 stack**（PSP）。
- **Stack overflow 不會自動被偵測**：它會默默覆寫相鄰的 .bss/.data 或 heap，症狀常是「莫名其妙的變數被改」或 HardFault。

#### Heap
- \`malloc/free\` 使用的區域，大小同樣由 linker 設定。
- 問題：**碎片化**、**執行時間不固定**、**記憶體不足時的處理**。安全相關規範（如 MISRA）通常限制動態配置。
- 常見替代：靜態配置、memory pool（固定大小區塊）、RTOS 提供的 heap 實作（如 FreeRTOS heap_4）。

#### 如何得知 stack 需要多大？
1. **靜態分析**：工具鏈根據 call graph 計算最壞情況（GCC \`-fstack-usage\` 產生 .su 檔；IAR linker 可做 stack usage analysis）。遞迴與函式指標需要額外標註。
2. **Stack painting**：開機時以固定 pattern 填滿 stack，執行一段時間後看「水位」。FreeRTOS 的 \`uxTaskGetStackHighWaterMark()\` 就是這個原理。
3. **硬體保護**：用 MPU 在 stack 底端設 guard region；Armv8-M 有 **stack limit 暫存器（MSPLIM/PSPLIM）**。
`,
    terms: [
      { en: "Memory Map", zh: "記憶體地圖", note: "位址空間的分區" },
      { en: "Stack Pointer (MSP / PSP)", zh: "主/行程堆疊指標", note: "Cortex-M 的兩個 SP" },
      { en: "Stack Overflow", zh: "堆疊溢位", note: "超出配置範圍，覆寫其他資料" },
      { en: "Heap Fragmentation", zh: "堆積碎片化", note: "可用空間被切碎無法配置大區塊" },
      { en: "Stack Painting / Watermark", zh: "堆疊填色 / 水位", note: "量測最大使用量的方法" },
      { en: "Memory Pool", zh: "記憶體池", note: "固定大小區塊配置器" },
      { en: "Worst-case Stack Usage", zh: "最壞情況堆疊用量", note: "靜態分析的結果" },
      { en: "Stack Limit Register", zh: "堆疊界限暫存器", note: "Armv8-M 的 MSPLIM/PSPLIM" },
    ],
    diagram: {
      title: "Cortex-M 記憶體配置（示意）",
      mermaid: `flowchart TB
  subgraph FLASH["Flash 0x0800_0000"]
    V[".intvec / vector table"]
    TX[".text"]
    RO[".rodata"]
    DI[".data 初始值 (LMA)"]
  end
  subgraph RAM["SRAM 0x2000_0000"]
    DA[".data (VMA)"]
    BS[".bss"]
    HP["Heap ↑ 向上成長"]
    FREE["(free)"]
    ST["Stack ↓ 向下成長<br/>初始 SP = RAM 頂端"]
  end
  DI -->|"startup 複製"| DA
  HP -.->|"碰撞 = 資料毀損"| ST`,
    },
    code: [
      {
        title: "Stack painting：量測最大使用量",
        lang: "c",
        code: `#include <stdint.h>

extern uint32_t __stack_start__;   /* 由 linker script 提供的符號（名稱依專案而定） */
extern uint32_t __stack_end__;
#define STACK_FILL 0xDEADBEEFu

void stack_paint(void)            /* 開機早期呼叫（在 stack 使用量還很小時） */
{
    uint32_t *p = &__stack_start__;
    uint32_t *sp;
    __asm volatile ("mov %0, sp" : "=r"(sp));
    while (p < sp - 16) *p++ = STACK_FILL;   /* 保留目前使用中的部分 */
}

uint32_t stack_unused_bytes(void)
{
    uint32_t *p = &__stack_start__;
    while (p < &__stack_end__ && *p == STACK_FILL) p++;
    return (uint32_t)((uintptr_t)p - (uintptr_t)&__stack_start__);
}`,
        note: "符號名稱由 linker 設定決定（GNU ld 自訂；IAR 有 section begin/end 運算子）。inline asm 語法各編譯器不同。",
      },
      {
        title: "GCC 靜態 stack 分析",
        lang: "bash",
        code: `arm-none-eabi-gcc -c -O2 -fstack-usage motor.c
cat motor.su
# motor.c:42:6:pid_update     40   static
# motor.c:88:6:log_state      312  dynamic,bounded   ← 有 VLA/alloca
# 再配合 call graph（-fcallgraph-info 或外部工具）計算最壞路徑`,
      },
    ],
    analysis: `
#### 為什麼 stack 溢位這麼難抓？
- 不會立即當機，而是**破壞別人的資料**，症狀出現在很遠的地方。
- 只在**特定路徑**（例如錯誤處理 + 中斷巢狀）才達到最深，測試不一定覆蓋。
- **最佳化等級改變會改變 stack 用量**：inlining 會把多個函式的區域變數合併到一個 frame。

#### 中斷對 stack 的影響
Cortex-M 進入例外時硬體自動壓入 8 個字（32 bytes），使用 FPU 時更多（lazy stacking 最多額外 18 個字）。**巢狀中斷**時每一層都要計算，而 ISR 使用 MSP —— 在 RTOS 系統中，MSP 要能承受最深的中斷巢狀。

#### 給客戶的建議順序
1. 用工具鏈做靜態 stack 分析，得到上限
2. 實機 painting 驗證
3. 保留 margin（例如 20–30%）
4. 開發期啟用 MPU guard / stack limit，讓溢位立即 fault 而不是默默毀損
`,
    cases: [
      {
        title: "加了一個 printf 就 HardFault",
        body: "某 task stack 只配了 256 bytes。printf 浮點格式化內部使用數百 bytes 的 stack，導致溢位並覆寫 TCB。用 FreeRTOS 的 stack overflow hook 與 high-water mark 確認後，加大該 task 的 stack 並改用輕量 log 函式。",
      },
      {
        title: "長時間運作後 malloc 回傳 NULL",
        body: "系統連續運作數天後配置失敗，但總剩餘記憶體看起來足夠 —— 典型碎片化。改為固定大小的 memory pool 後問題消失。你在 SSD firmware 的 buffer 管理經驗可直接類比。",
      },
    ],
    customerQs: [
      {
        q: "How do we know how big our stack should be?",
        zh: "我們怎麼知道 stack 該配多大？",
        answer: "結合靜態分析與實測：工具鏈的 stack usage 分析提供理論最壞值（遞迴與函式指標需另外標註），再用 stack painting 驗證實際水位，並保留餘量。IAR linker 提供 stack usage analysis 功能，可在 map/log 中輸出結果（設定方式以手冊為準）。",
      },
      {
        q: "Our variables get corrupted randomly. Could it be the compiler?",
        zh: "變數會隨機被改，會是編譯器問題嗎？",
        answer: "更常見的是 stack overflow、陣列越界或 DMA 寫錯位址。建議：對被改的變數設 data watchpoint、檢查各 stack 水位、確認 map file 中該變數旁邊是什麼。",
      },
      {
        q: "Is it OK to use malloc in our firmware?",
        zh: "韌體可以用 malloc 嗎？",
        answer: "可以，但要評估：是否只在初始化階段配置、是否有碎片化風險、記憶體不足時如何處理、是否有安全規範限制。多數高可靠性系統偏好靜態配置或 memory pool。",
      },
    ],
    interviewQs: [
      {
        q: "How would you detect and prevent stack overflow on a Cortex-M?",
        zh: "如何在 Cortex-M 上偵測與預防 stack overflow？",
        points: ["靜態分析", "painting / high-water mark", "MPU guard / MSPLIM", "RTOS overflow hook"],
      },
      {
        q: "Why is dynamic memory allocation discouraged in embedded systems?",
        zh: "為什麼嵌入式系統不鼓勵動態配置？",
        points: ["碎片化", "非決定性時間", "失敗處理", "替代方案"],
      },
      {
        q: "Describe the memory map of a microcontroller you worked with.",
        zh: "描述你用過的 MCU/SoC 記憶體地圖。",
        points: ["以 Zynq 或 SSD controller 實例說明", "Flash/OCM/DDR/周邊區", "你如何配置 section"],
      },
    ],
    quiz: [
      { id: "t2m-q1", skill: "linker", q: "Cortex-M 的 stack 成長方向？", options: ["向上", "向下（full-descending）", "取決於編譯器", "雙向"], answer: 1, explain: "SP 初始值通常設在 RAM 頂端，往低位址成長。" },
      { id: "t2m-q2", skill: "linker", q: "Cortex-M 例外進入時硬體自動保存幾個暫存器（無 FPU context）？", options: ["4", "8", "16", "全部"], answer: 1, explain: "R0-R3, R12, LR, PC, xPSR，共 8 個字。" },
      { id: "t2m-q3", skill: "linker", q: "Stack painting 的用途？", options: ["加速 stack 存取", "量測 stack 實際最大使用量", "防止 heap 碎片", "加密 stack"], answer: 1, explain: "以 pattern 填滿後檢查被覆寫的深度。" },
      { id: "t2m-q4", skill: "linker", q: "為何提高最佳化等級可能讓 stack 用量增加？", options: ["編譯器 bug", "inlining 會把多個函式的區域變數併入同一 frame", "最佳化會關閉 MPU", "不可能"], answer: 1, explain: "Inlining 減少呼叫，但可能使單一 frame 變大。" },
      { id: "t2m-q5", skill: "linker", q: "長時間運行後 malloc 失敗但總剩餘量足夠，最可能是？", options: ["Stack overflow", "Heap 碎片化", "Flash 滿了", "編譯器 bug"], answer: 1, explain: "可用空間被切碎，沒有足夠大的連續區塊。" },
      { id: "t2m-q6", skill: "rtos", q: "RTOS 系統中，中斷處理使用哪個 stack（Cortex-M）？", options: ["當前 task 的 PSP", "MSP", "Heap", "每個 ISR 自己的 stack"], answer: 1, explain: "Handler mode 一律使用 MSP，因此 MSP 要能承受最深的中斷巢狀。" },
    ],
    reading: [
      { title: "GCC — -fstack-usage", url: "https://gcc.gnu.org/onlinedocs/gcc/Developer-Options.html", note: "Developer Options 中的 stack usage 說明" },
      { title: "FreeRTOS — Stack usage and stack overflow checking", url: "https://www.freertos.org/", note: "在官網搜尋 'stack overflow checking'、uxTaskGetStackHighWaterMark" },
      { title: "IAR C/C++ Development Guide — Stack usage analysis", note: "ILINK 的 stack usage 分析與控制檔（隨產品提供）" },
    ],
  },

  // ───────────────────────────────────────────── t2-linker-script
  {
    id: "t2-linker-script",
    objectives: [
      "讀懂 GNU ld linker script 的 MEMORY 與 SECTIONS 區塊",
      "解釋 LMA 與 VMA，以及 AT> 的作用",
      "讀懂 IAR ICF 的 define region / place in / initialize by copy 等基本語法",
      "能把一個簡單的 GNU ld 配置對應成 ICF 概念（移植時必備）",
    ],
    concept: `
Linker 設定檔描述「**有哪些記憶體**」以及「**每類 section 放在哪裡**」。GNU ld 用 **linker script（.ld）**，IAR ILINK 用 **ICF（IAR linker configuration file，.icf）**。兩者概念相同、語法完全不同，是 GCC→IAR 移植時最主要的手工轉換項目之一。

#### GNU ld 基本結構
- **MEMORY**：宣告記憶體區（名稱、屬性、起點、長度）。
- **SECTIONS**：把輸入 section 收集成輸出 section，並指定放到哪個記憶體。
- \`> RAM AT> FLASH\`：VMA 在 RAM、LMA 在 FLASH（用於 .data）。
- 符號定義：\`_sdata = .;\` 讓 startup code 知道 .data 起訖。
- \`KEEP()\`：避免 \`--gc-sections\` 把向量表等「沒被引用」的 section 丟掉。

#### IAR ICF 基本結構
- \`define memory\`、\`define region\`：定義位址空間與區域。
- \`define block\`：定義 CSTACK、HEAP 等區塊（大小、對齊）。
- \`initialize by copy { readwrite };\`：讓 linker 自動產生「從 Flash 複製到 RAM」的初始化資料與程序（取代 GNU 專案手寫的 .data copy 迴圈）。
- \`do not initialize { section .noinit };\`
- \`place at address\`、\`place in\`：放置 section 或 block。
- 以**屬性**選取 section：\`readonly\`、\`readwrite\`、\`zeroinit\`，或以名稱 \`section .intvec\`。

#### LMA vs VMA
- **VMA（Virtual/Run address）**：程式執行時存取它的位址。
- **LMA（Load address）**：它在映像檔/Flash 中被存放的位址。
- 對 .text：兩者相同（在 Flash 執行）。對 .data：VMA 在 RAM、LMA 在 Flash。對「從 RAM 執行的函式」：VMA 在 RAM、LMA 在 Flash。
`,
    terms: [
      { en: "Linker Script", zh: "連結腳本", note: "GNU ld 的 .ld 檔" },
      { en: "ICF (IAR Linker Configuration File)", zh: "IAR 連結設定檔", note: "ILINK 使用的 .icf 檔" },
      { en: "MEMORY / SECTIONS", zh: "記憶體 / 區段命令", note: "GNU ld 兩大區塊" },
      { en: "LMA / VMA", zh: "載入位址 / 執行位址", note: ".data 兩者不同" },
      { en: "Placement", zh: "放置", note: "決定 section 位址" },
      { en: "Block (IAR)", zh: "區塊", note: "如 CSTACK、HEAP" },
      { en: "Initialize by copy", zh: "以複製方式初始化", note: "ICF 自動產生初始化" },
      { en: "KEEP()", zh: "保留", note: "防止 gc-sections 移除" },
    ],
    diagram: {
      title: "同一個記憶體配置的兩種描述",
      mermaid: `flowchart LR
  subgraph GNU["GNU ld (.ld)"]
    G1["MEMORY { FLASH, RAM }"]
    G2["SECTIONS {<br/>.isr_vector > FLASH<br/>.text > FLASH<br/>.data > RAM AT> FLASH<br/>.bss > RAM }"]
    G3["startup.s 手動 copy .data / zero .bss"]
  end
  subgraph IAR["IAR ILINK (.icf)"]
    I1["define region ROM_region / RAM_region"]
    I2["place at address ... { section .intvec }<br/>place in ROM_region { readonly }<br/>place in RAM_region { readwrite, block CSTACK, block HEAP }"]
    I3["initialize by copy { readwrite }<br/>→ linker 產生初始化"]
  end
  G1 --- I1
  G2 --- I2
  G3 --- I3`,
    },
    code: [
      {
        title: "GNU ld：最小 Cortex-M linker script",
        lang: "ld",
        code: `MEMORY
{
  FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

_estack = ORIGIN(RAM) + LENGTH(RAM);   /* 初始 SP */
_Min_Stack_Size = 0x800;

SECTIONS
{
  .isr_vector : { KEEP(*(.isr_vector)) } > FLASH

  .text : {
    *(.text*)
    *(.rodata*)
    _etext = .;
  } > FLASH

  _sidata = LOADADDR(.data);          /* .data 初始值在 Flash 的位址 (LMA) */
  .data : {
    _sdata = .;
    *(.data*)
    _edata = .;
  } > RAM AT> FLASH

  .bss (NOLOAD) : {
    _sbss = .;
    *(.bss*) *(COMMON)
    _ebss = .;
  } > RAM

  ._user_stack (NOLOAD) : {
    . = ALIGN(8);
    . = . + _Min_Stack_Size;          /* 只是檢查用的保留空間 */
  } > RAM
}`,
      },
      {
        title: "IAR ICF：等價概念（Cortex-M 範例風格）",
        lang: "icf",
        code: `define memory mem with size = 4G;

define region ROM_region = mem:[from 0x08000000 to 0x0807FFFF];
define region RAM_region = mem:[from 0x20000000 to 0x2001FFFF];

define block CSTACK with alignment = 8, size = 0x800 { };
define block HEAP   with alignment = 8, size = 0x400 { };

initialize by copy { readwrite };
do not initialize  { section .noinit };

place at address mem:0x08000000 { readonly section .intvec };

place in ROM_region { readonly };
place in RAM_region { readwrite, block CSTACK, block HEAP };`,
        note: "語法結構依 IAR 產品隨附的範例 ICF 撰寫；實際專案請以 IAR 提供的裝置 ICF 範本為起點，並查閱 IAR C/C++ Development Guide 的 linker configuration 章節。",
      },
      {
        title: "把函式放到 RAM 執行（例如 Flash 寫入期間）",
        lang: "c",
        code: `/* GNU：放到自訂 section，並在 linker script 中以 > RAM AT> FLASH 配置 */
__attribute__((section(".ramfunc"), noinline))
void flash_program_word(uint32_t addr, uint32_t data) { /* ... */ }

/* IAR：使用 __ramfunc 關鍵字（由 linker 處理複製） */
__ramfunc void flash_program_word2(uint32_t addr, uint32_t data) { /* ... */ }`,
        note: "__ramfunc 是 IAR 的擴充關鍵字；在不同架構與版本的行為細節請查閱手冊。",
      },
    ],
    analysis: `
#### 移植時的對照思路
| GNU ld | IAR ICF |
|---|---|
| MEMORY | define memory / define region |
| > FLASH | place in ROM_region |
| KEEP(*(.isr_vector)) + 位置 | place at address ... { section .intvec } |
| .data > RAM AT> FLASH + startup copy | initialize by copy { readwrite } |
| .bss + startup zero | zeroinit 由 IAR 初始化程序處理 |
| _estack 等符號 | block CSTACK + 段起訖運算子（如 __section_end） |



#### 常見錯誤
- **忘了 KEEP**：開了 gc-sections 後向量表被移除，晶片一上電就跑飛。
- **.data 沒有 AT> FLASH**：初始值不存在 Flash，斷電後變數是垃圾值。
- **對齊**：stack 要 8-byte 對齊（AAPCS 要求在公開介面上 8-byte 對齊）。
- **區域重疊或位址錯誤**：bootloader + application 專案中，application 的起始位址與向量表偏移（VTOR）要一致。
`,
    cases: [
      {
        title: "Bootloader + Application 的分割",
        body: "Bootloader 佔 0x08000000–0x08007FFF，App 從 0x08008000 開始。App 的 linker 設定要修改 Flash 起點；App 啟動時要把 VTOR 設為 0x08008000；Bootloader 跳轉前要設定 MSP 為 App 向量表的第一個字。三者任何一個不一致都會導致跳轉後當機。這是 FAE 非常常見的支援題目。",
      },
      {
        title: "GCC 專案移植到 IAR：.noinit 變數被清零",
        body: "客戶用 __attribute__((section(\".noinit\"))) 保存重開機計數器，移植後每次重開機都變 0。原因是 ICF 中沒有對應的 do not initialize 設定，該 section 被視為 zero-init。加上 do not initialize { section .noinit }（並確認 IAR 端的宣告方式，例如 __no_init 關鍵字）即可。",
      },
    ],
    customerQs: [
      {
        q: "How do I convert our GCC linker script to an ICF file?",
        zh: "如何把 GCC linker script 轉成 ICF？",
        answer: "不要逐行翻譯，而是先列出需求：記憶體區域、向量表位置、特殊 section（noinit、RAM 函式、DMA buffer、共享記憶體）、stack/heap 大小，然後以 IAR 為該晶片提供的 ICF 範本為基礎加入這些需求。最後比對兩邊 map file 確認配置一致。",
      },
      {
        q: "We need a DMA buffer in a specific RAM bank. How do we place it?",
        zh: "DMA buffer 要放在特定 RAM bank，怎麼做？",
        answer: "給變數一個專屬 section 名稱，然後在 linker 設定中把該 section 放進對應 region。IAR 也支援以 @ 或 #pragma location 指定位置/區段（細節查手冊）。另外注意 cache 與對齊需求。",
      },
      {
        q: "The linker says 'region RAM overflowed' but the map shows free space.",
        zh: "linker 說 RAM 溢位，但 map 顯示還有空間？",
        answer: "可能是 region 被切成多塊、某個 block（stack/heap）要求連續空間或對齊、或某 section 被限制在特定區域。看 linker 的錯誤細節與 placement 摘要，找出是哪個 section/block 放不下。",
      },
    ],
    interviewQs: [
      {
        q: "What's the difference between LMA and VMA?",
        zh: "LMA 與 VMA 的差別？",
        points: ["定義", ".data 與 RAM 函式的例子", "startup 的複製", "你在專案中的實例"],
      },
      {
        q: "Have you written or modified a linker script? What for?",
        zh: "你寫過或修改過 linker script 嗎？目的是什麼？",
        points: ["誠實說明經驗（例如 Zynq OCM/DDR 配置、bootloader）", "遇到的問題", "如何驗證（map file）"],
      },
      {
        q: "How would you place a function in RAM and why?",
        zh: "如何把函式放到 RAM 執行？為什麼？",
        points: ["Flash 寫入期間無法讀取 Flash", "效能（零等待）", "section + linker 配置 / __ramfunc"],
      },
    ],
    quiz: [
      { id: "t2l-q1", skill: "linker", q: "GNU ld 中 `.data : {...} > RAM AT> FLASH` 的意思？", options: ["執行與儲存都在 Flash", "VMA 在 RAM，LMA 在 Flash", "VMA 在 Flash，LMA 在 RAM", "只放在 RAM"], answer: 1, explain: "執行位址在 RAM，初始值存放在 Flash。" },
      { id: "t2l-q2", skill: "linker", q: "開了 --gc-sections 後向量表消失，應在 linker script 中使用？", options: ["NOLOAD", "KEEP()", "ALIGN()", "AT>"], answer: 1, explain: "KEEP 讓沒被引用的 section 也被保留。" },
      { id: "t2l-q3", skill: "linker", q: "IAR ICF 中哪個指令讓 linker 自動處理 .data 的初始值複製？", options: ["place in", "define block", "initialize by copy", "keep"], answer: 2, explain: "initialize by copy { readwrite } 會產生初始化資料與程序。" },
      { id: "t2l-q4", skill: "linker", q: "IAR ICF 中定義 stack 的常見方式？", options: ["MEMORY { STACK }", "define block CSTACK with size = ...", "_estack = ...", "#pragma stack"], answer: 1, explain: "以 block 定義大小與對齊，再 place in RAM。" },
      { id: "t2l-q5", skill: "linker", q: "Application 從 0x08008000 開始（有 bootloader），App 啟動時通常需要？", options: ["關閉 Flash", "將 VTOR 設為 0x08008000", "改為 -O0", "清空 Flash"], answer: 1, explain: "讓中斷使用 App 的向量表。" },
      { id: "t2l-q6", skill: "linker", q: "移植後 .noinit 變數在重開機時被清零，最可能原因？", options: ["硬體重置", "linker 設定沒有把該 section 標記為不初始化", "編譯器最佳化", "Watchdog"], answer: 1, explain: "需在 ICF 中加入 do not initialize 設定。" },
    ],
    reading: [
      { title: "GNU ld — Linker Scripts", url: "https://sourceware.org/binutils/docs/ld/Scripts.html", note: "MEMORY、SECTIONS、AT>、KEEP 官方說明" },
      { title: "Memfault Interrupt — How to write linker scripts for firmware", url: "https://interrupt.memfault.com/blog/how-to-write-linker-scripts-for-firmware", note: "實務導向的 linker script 教學" },
      { title: "IAR C/C++ Development Guide — The linker configuration file", note: "ICF 完整語法（隨產品提供）；以 IAR 為裝置提供的範本 ICF 為起點" },
    ],
    toVerify: ["ICF 語法細節（以使用中 EWARM 版本的手冊與範本為準）", "__ramfunc / __no_init 在各架構版本的行為"],
  },

  // ───────────────────────────────────────────── t2-startup
  {
    id: "t2-startup",
    objectives: [
      "說明 Cortex-M 從上電到 main() 的完整流程",
      "理解向量表的格式（初始 SP + 例外處理函式位址）與 VTOR",
      "知道 startup code 要做的事：設定 SP、時脈/FPU、複製 .data、清 .bss、C++ 建構子、呼叫 main",
      "比較 GCC 專案與 IAR 專案的 startup 差異",
    ],
    concept: `
#### Cortex-M 上電流程
1. CPU 從向量表（預設在位址 0x0）讀取**第一個字 → 初始 MSP**。
2. 讀取**第二個字 → Reset_Handler 位址**，跳過去執行（位址的 bit0 必須為 1，代表 Thumb）。
3. **Reset_Handler / startup code**：
   - （可選）\`SystemInit()\`：時脈、Flash wait state、FPU 啟用（CPACR）、VTOR
   - 複製 .data 初始值（Flash → RAM）
   - 清零 .bss
   - 呼叫 C++ 全域建構子（\`__libc_init_array\` 或對應機制）
   - 呼叫 \`main()\`

#### 向量表
- 索引 0：初始 SP；1：Reset；2：NMI；3：HardFault；4–6：MemManage/BusFault/UsageFault（Armv7-M 以上）；11：SVCall；14：PendSV；15：SysTick；16 起：外部中斷（IRQ0…）。
- **VTOR**（Vector Table Offset Register）可把向量表搬到其他位址（Armv7-M 以上；部分 Armv6-M 實作有）。

#### GCC vs IAR 的 startup
- **GCC 專案**：通常使用晶片廠提供的 \`startup_xxx.s\`（GNU 組語語法）+ linker script 匯出的符號（\`_sidata\`、\`_sdata\`…），由 Reset_Handler 手動複製與清零。
- **IAR 專案**：晶片廠/CMSIS 通常提供 IAR 版本的 startup 檔（IAR 組語語法，向量表 section 名為 \`.intvec\`）；**.data/.bss 的初始化由 IAR runtime 的系統啟動程式碼根據 linker 產生的初始化表完成**，因此 Reset_Handler 通常是呼叫 SystemInit 後跳到 IAR 的程式進入點（例如 \`__iar_program_start\`）。
- 兩者的組語語法不同，**startup 檔不能直接共用**，移植時要換成目標工具鏈的版本。
`,
    terms: [
      { en: "Reset Handler", zh: "重置處理函式", note: "上電後第一個執行的函式" },
      { en: "Vector Table", zh: "向量表", note: "初始 SP + 例外處理位址" },
      { en: "VTOR", zh: "向量表偏移暫存器", note: "可重新定位向量表" },
      { en: "Startup Code", zh: "啟動程式碼", note: "main 之前的初始化" },
      { en: "Static Initialization", zh: "靜態初始化", note: ".data 複製、.bss 清零、C++ 建構子" },
      { en: "CPACR", zh: "協處理器存取控制暫存器", note: "啟用 FPU" },
      { en: "Thumb Bit", zh: "Thumb 位元", note: "函式位址 bit0 = 1" },
      { en: "Program Entry Point", zh: "程式進入點", note: "ELF header 中的 entry" },
    ],
    diagram: {
      title: "從上電到 main()",
      mermaid: `sequenceDiagram
  participant HW as Cortex-M core
  participant VT as Vector table @0x0
  participant RH as Reset_Handler
  participant RT as Runtime init
  participant M as main()
  HW->>VT: 讀 word[0] → MSP
  HW->>VT: 讀 word[1] → PC
  HW->>RH: 跳到 Reset_Handler (Thumb)
  RH->>RH: SystemInit(): clock, FPU, VTOR
  RH->>RT: GNU: 手寫 copy/zero 迴圈<br/>IAR: 跳到 runtime 程式進入點
  RT->>RT: 複製 .data / 清零 .bss
  RT->>RT: C++ 全域建構子
  RT->>M: 呼叫 main()`,
    },
    code: [
      {
        title: "以 C 撰寫的 GNU 風格 Reset_Handler（示意）",
        lang: "c",
        code: `#include <stdint.h>

extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;
extern void SystemInit(void);
extern void __libc_init_array(void);
extern int  main(void);

void Reset_Handler(void)
{
    SystemInit();                              /* 時脈、FPU 等 */

    uint32_t *src = &_sidata, *dst = &_sdata;
    while (dst < &_edata) *dst++ = *src++;     /* .data: Flash → RAM */

    for (dst = &_sbss; dst < &_ebss; ) *dst++ = 0;   /* .bss 清零 */

    __libc_init_array();                       /* C++ 建構子 / init_array */
    main();
    for (;;) { }
}

void Default_Handler(void) { for (;;) { } }
void NMI_Handler(void)       __attribute__((weak, alias("Default_Handler")));
void HardFault_Handler(void) __attribute__((weak, alias("Default_Handler")));
void SysTick_Handler(void)   __attribute__((weak, alias("Default_Handler")));

__attribute__((section(".isr_vector"), used))
void (* const g_vectors[])(void) = {
    (void (*)(void))(&_estack),   /* 0: 初始 SP */
    Reset_Handler,                /* 1: Reset */
    NMI_Handler,                  /* 2 */
    HardFault_Handler,            /* 3 */
    /* ... 4..15 系統例外, 16.. 外部中斷 */
};`,
      },
      {
        title: "啟用 FPU（Cortex-M4F/M7）",
        lang: "c",
        code: `/* 在任何浮點指令之前執行（通常在 SystemInit 中） */
SCB->CPACR |= (3UL << 20) | (3UL << 22);   /* CP10、CP11 full access */
__DSB();
__ISB();`,
        note: "若使用 hard-float 編譯卻沒有開啟 FPU，第一條浮點指令會觸發 UsageFault（NOCP）。",
      },
    ],
    analysis: `
#### 為什麼 startup 是移植熱點？
- 組語語法不同（GNU \`.section\`/\`.word\` vs IAR 的 \`SECTION\`/\`DCD\`）。
- 符號介面不同（linker script 匯出的符號 vs IAR 的 section 運算子與自動初始化）。
- C++ 靜態建構與 runtime 初始化機制不同。

#### 偵錯 startup 問題的技巧
- 在 Reset_Handler 第一行設中斷點，確認有跑到。
- 檢查向量表第 0、1 個字的值（記憶體視窗看 0x0 或 Flash 起點）。
- 若在 main 之前當掉：常見原因是 SystemInit 時脈設定錯誤（外部晶振沒起振）、.data 複製範圍錯誤、或 C++ 建構子存取未初始化的周邊。
- **main 之前的程式碼，debugger 預設可能直接 run to main** —— 要記得關掉這個選項才能停在 reset。
`,
    cases: [
      {
        title: "C++ 全域物件的建構順序問題",
        body: "兩個全域物件分別在不同 .cpp 檔，A 的建構子使用 B，但 B 尚未建構（static initialization order fiasco）。在某個編譯器上剛好正常、換了 link 順序或工具鏈就壞掉。解法：改用 function-local static（Meyers singleton）或明確的 init() 函式。",
      },
      {
        title: "換晶片後卡在 SystemInit",
        body: "新板子的外部晶振頻率不同，SystemInit 等待 HSE ready 的迴圈永遠不結束。在 startup 中設中斷點、逐步執行就能定位。FAE 常遇到客戶以為是工具問題，實際是 BSP 設定。",
      },
    ],
    customerQs: [
      {
        q: "Can we keep using our GCC startup file in your IDE?",
        zh: "我們的 GCC startup 檔可以直接用在你們的 IDE 嗎？",
        answer: "組語語法與初始化機制不同，通常要換成 IAR 版本。多數晶片廠的 CMSIS 套件已提供 IAR 版的 startup 檔與範例專案；若是自訂的部分（例如額外的初始化步驟），我們可以協助移植到 IAR 的對應機制（如 low-level init 掛勾，詳見手冊）。",
      },
      {
        q: "The program never reaches main(). How do we debug that?",
        zh: "程式從未進到 main()，如何除錯？",
        answer: "關閉 run-to-main，從 reset 開始單步；確認向量表內容、SystemInit 是否卡在時脈等待、.data/.bss 範圍是否正確、是否有 HardFault（看 fault 狀態暫存器）。",
      },
      {
        q: "Where should we enable the FPU?",
        zh: "FPU 應該在哪裡啟用？",
        answer: "在任何浮點指令執行之前 —— 通常是 SystemInit 或 startup 中。若 C++ 全域建構子用到浮點，必須在建構子之前啟用。注意部分工具鏈的 runtime 啟動程式碼可能已處理，請確認不要重複或遺漏。",
      },
    ],
    interviewQs: [
      {
        q: "What happens between reset and main() on a Cortex-M?",
        zh: "Cortex-M 從 reset 到 main() 之間發生什麼事？",
        points: ["讀 SP 與 Reset 向量", "SystemInit", ".data/.bss", "C++ 建構子", "main"],
      },
      {
        q: "What is VTOR used for?",
        zh: "VTOR 的用途？",
        points: ["重新定位向量表", "bootloader / app", "RAM 向量表以動態更換 ISR", "需要 barrier"],
      },
      {
        q: "How is startup different on a Cortex-A running Linux (e.g. Zynq)?",
        zh: "在 Cortex-A + Linux（例如 Zynq）上，啟動流程有何不同？",
        points: ["BootROM → FSBL → U-Boot → Kernel", "MMU/cache 初始化", "Device Tree", "連結到你的實際經驗"],
      },
    ],
    quiz: [
      { id: "t2s-q1", skill: "linker", q: "Cortex-M 向量表的第一個字是？", options: ["Reset_Handler 位址", "初始 MSP 值", "NMI 位址", "版本號"], answer: 1, explain: "Word[0] = 初始 SP，Word[1] = Reset 向量。" },
      { id: "t2s-q2", skill: "linker", q: "Thumb 函式位址存入向量表時 bit0 應為？", options: ["0", "1", "不重要", "取決於優先權"], answer: 1, explain: "bit0=1 表示 Thumb 狀態；Cortex-M 只支援 Thumb。" },
      { id: "t2s-q3", skill: "linker", q: "Startup code 中「清零 .bss」的目的？", options: ["加速開機", "滿足 C 標準：未初始化的靜態變數初值為 0", "節省 Flash", "清除 cache"], answer: 1, explain: "C 標準要求靜態儲存期變數未初始化時為 0。" },
      { id: "t2s-q4", skill: "linker", q: "在 IAR 專案中，.data 的複製通常由誰完成？", options: ["使用者手寫迴圈", "IAR runtime 依 linker 產生的初始化資料完成", "Debugger", "硬體自動"], answer: 1, explain: "搭配 ICF 的 initialize by copy。" },
      { id: "t2s-q5", skill: "linker", q: "Cortex-M4F 第一條浮點指令就觸發 UsageFault，最可能原因？", options: ["浮點 bug", "沒有在 CPACR 啟用 FPU", "Stack 不夠", "VTOR 錯誤"], answer: 1, explain: "需先開啟 CP10/CP11 存取權限。" },
      { id: "t2s-q6", skill: "debug", q: "想除錯 main() 之前的程式，debugger 應？", options: ["開啟 run to main", "關閉 run to main，從 reset 開始", "提高最佳化", "移除 startup"], answer: 1, explain: "否則 debugger 會直接跑到 main。" },
    ],
    reading: [
      { title: "Memfault Interrupt — From Zero to main(): Bare metal C", url: "https://interrupt.memfault.com/blog/zero-to-main-1", note: "從 reset 到 main 的完整拆解（系列文章）" },
      { title: "Arm — Cortex-M4 Devices Generic User Guide", note: "向量表、例外模型、CPACR；在 Arm Developer 網站搜尋 'Cortex-M4 Devices Generic User Guide'" },
      { title: "CMSIS-Core — Startup file & system configuration", url: "https://arm-software.github.io/CMSIS_6/", note: "startup_<device> 與 SystemInit 的標準結構" },
    ],
    toVerify: ["IAR runtime 程式進入點與 low-level init 掛勾的名稱（依版本）"],
  },

  // ───────────────────────────────────────────── t2-linking
  {
    id: "t2-linking",
    objectives: [
      "比較靜態連結與動態連結，以及為何 MCU 幾乎只用靜態連結",
      "理解靜態函式庫（.a）的「按需拉入」規則與連結順序問題",
      "能讀 map file：記憶體摘要、模組大小、符號位址、被拉進來的原因",
      "建立一套「為什麼程式變大」的分析流程",
    ],
    concept: `
#### 靜態 vs 動態連結
- **靜態連結**：函式庫的程式碼在 link 時被複製進映像檔。結果是單一、自給自足的映像 —— MCU/RTOS 系統的標準做法。
- **動態連結**：執行時才由 loader 載入共享函式庫（Linux 的 .so、Windows 的 .dll），需要 MMU/作業系統支援，節省記憶體並可獨立更新。你在 Embedded Linux / Windows 應用的經驗屬於這類。

#### 靜態函式庫的拉入規則
- \`.a\` 是 object file 的集合。linker **只拉入能解決目前未定義符號的 object**（以 object 為單位，不是以函式為單位）。
- GNU ld 傳統上**由左到右**處理：函式庫若放在使用它的 object 前面，可能找不到符號（\`--start-group/--end-group\` 可解決循環相依）。
- 一個 .o 裡只要有一個函式被用到，整個 .o 都會被拉入 → 這就是 \`-ffunction-sections\` + \`--gc-sections\` 的價值。

#### Map file
Linker 產生的報告，回答三個問題：
1. **每個東西放在哪裡？**（section/symbol 位址）
2. **每個東西多大？**（模組、函式庫的貢獻）
3. **為什麼被拉進來？**（GNU ld 的 "Archive member included to satisfy reference by file (symbol)" 段落；IAR map 也有模組與 entry 的資訊）

GNU ld：\`-Wl,-Map=app.map\`（加 \`--cref\` 產生交叉參照）。IAR ILINK：在專案選項啟用 map file 輸出；map 中有 placement 摘要、模組摘要與 entry list 等段落（名稱依版本）。
`,
    terms: [
      { en: "Static Linking", zh: "靜態連結", note: "程式碼複製進映像檔" },
      { en: "Dynamic Linking", zh: "動態連結", note: "執行時載入 .so/.dll" },
      { en: "Static Library / Archive (.a)", zh: "靜態函式庫", note: "object 檔集合" },
      { en: "Map File", zh: "對映檔", note: "linker 輸出的配置與大小報告" },
      { en: "Garbage Collection of Sections", zh: "Section 垃圾回收", note: "移除未被引用的 section" },
      { en: "Link Order", zh: "連結順序", note: "影響符號解析" },
      { en: "Cross Reference", zh: "交叉參照", note: "誰引用了誰" },
      { en: "Code Bloat", zh: "程式碼膨脹", note: "不必要地變大" },
    ],
    diagram: {
      title: "「為什麼程式變大」分析流程",
      mermaid: `flowchart TD
  A["Flash 不夠 / 程式變大"] --> B["看 map file 記憶體摘要<br/>Flash vs RAM 誰超過?"]
  B --> C["依模組/函式庫大小排序"]
  C --> D{"最大的是誰?"}
  D -->|"C 函式庫 (printf/浮點)"| E["換精簡版函式庫設定<br/>避免浮點格式化"]
  D -->|"自家模組"| F["看函式大小<br/>inline 過度? 查表過大?"]
  D -->|"第三方 SDK"| G["關閉不用的功能<br/>確認 gc-sections"]
  E --> H["調整最佳化目標 size"]
  F --> H
  G --> H
  H --> I["重新量測並比對 map diff"]`,
    },
    code: [
      {
        title: "GNU map file 片段：為什麼 printf 被拉進來",
        lang: "text",
        code: `Archive member included to satisfy reference by file (symbol)

libc_nano.a(lib_a-printf.o)   build/log.o (printf)
libc_nano.a(lib_a-vfprintf.o) libc_nano.a(lib_a-printf.o) (_vfprintf_r)
libc_nano.a(lib_a-dtoa.o)     libc_nano.a(lib_a-vfprintf.o) (_dtoa_r)
libm.a(lib_a-s_frexp.o)       libc_nano.a(lib_a-dtoa.o) (frexp)

Memory Configuration
Name             Origin             Length             Attributes
FLASH            0x08000000         0x00080000         xr
RAM              0x20000000         0x00020000         xrw`,
        note: "一行 printf(\"%f\") 就拉進了 dtoa 與數學函式庫。newlib-nano 預設不支援 %f，需要 -u _printf_float 才會拉入 —— 這正是設計來控制大小的。",
      },
      {
        title: "比對兩次 build 的大小（GNU）",
        lang: "bash",
        code: `arm-none-eabi-nm -S --size-sort -C old.elf > old.txt
arm-none-eabi-nm -S --size-sort -C new.elf > new.txt
diff <(awk '{print $4, $2}' old.txt | sort) <(awk '{print $4, $2}' new.txt | sort)
# 也可用 bloaty 等工具做更完整的比較`,
      },
    ],
    analysis: `
#### Map file 是 FAE 的第一手證據
客戶說「換工具鏈後變大了」「新版本 Flash 爆了」，第一件事就是**要 map file**。有了 map file，你可以：
- 確認比較是否公平（同樣的函式庫設定？同樣的除錯/assert 開關？）
- 找到最大貢獻者，而不是全面猜測
- 用數據向客戶說明最佳化建議的效果

#### 公平比較 code size 的檢查表
- 相同的原始碼與巨集定義（尤其 NDEBUG、log level）
- 相同的最佳化目標（size vs size）
- 函式庫設定對等（printf 功能、locale、多執行緒支援）
- 比較**映像中的實際 Flash 用量**（code + const + 初始化資料），不是 ELF 檔大小
- 排除除錯資訊

這套方法在客戶做 IAR vs GCC 評估時非常重要 —— 不公平的比較，無論結果對誰有利，都會損害 FAE 的可信度。
`,
    cases: [
      {
        title: "函式庫順序導致 undefined reference",
        body: "命令列為 gcc main.o -lmath -lutil，而 libutil 用到 libmath 的函式，結果 undefined reference。因為 libmath 先被處理時還沒有人需要那些符號。調整順序或使用 --start-group。轉到 IAR 時，ILINK 的函式庫搜尋行為不同，這類問題的表現也可能不同。",
      },
      {
        title: "Code size 評估：客戶說 IAR 比 GCC 大",
        body: "檢查 map 後發現：GCC 版使用 newlib-nano 且無 %f，IAR 版使用了完整 printf 格式化設定；GCC 版關閉 assert，IAR 版沒有。對齊條件後重新比較，結論完全不同。FAE 的工作是把比較做公平，而不是挑對自己有利的數字。",
      },
    ],
    customerQs: [
      {
        q: "Your compiler generates bigger code than GCC on our project.",
        zh: "在我們的專案上，你們編譯器產生的程式比 GCC 大。",
        answer: "謝謝回報，我們先確保比較條件一致：可以提供兩邊的 map file 與建置選項嗎？常見差異來自函式庫設定（printf/scanf 格式化功能）、除錯巨集、最佳化目標。對齊後若仍有差距，我們會分析具體是哪些函式，並提供調整建議或回報產品團隊。",
      },
      {
        q: "How can we see why a library function is linked into our image?",
        zh: "怎麼知道某個函式庫函式為什麼被連結進來？",
        answer: "GNU map 的 archive member 段落會列出引用者；IAR linker 也可輸出相關的 log/map 資訊（例如模組被包含的原因，選項請查手冊）。找到第一個引用者，通常就能決定如何避免。",
      },
      {
        q: "Can we use dynamic libraries on our Cortex-M?",
        zh: "Cortex-M 可以用動態函式庫嗎？",
        answer: "一般 MCU 沒有 MMU 與動態 loader，標準做法是靜態連結。若需要可更新模組，常見方案是固定位址的模組 + 跳轉表、或位置無關程式碼（需要工具鏈與 RTOS 支援），複雜度高，需評估。",
      },
    ],
    interviewQs: [
      {
        q: "Static vs dynamic linking — when would you use each?",
        zh: "靜態與動態連結各在什麼時候使用？",
        points: ["MCU 用靜態", "Linux/Windows 用動態", "優缺點：獨立性、更新、記憶體共享", "你的 Linux 與 Windows 應用經驗"],
      },
      {
        q: "How do you investigate a code size increase?",
        zh: "你如何調查 code size 增加？",
        points: ["map file", "模組排序與 diff", "函式庫設定", "最佳化與 gc-sections"],
      },
      {
        q: "How would you run a fair code-size benchmark between two compilers?",
        zh: "如何公平比較兩個編譯器的 code size？",
        points: ["同樣原始碼與設定", "函式庫對等", "比映像大小而非 ELF", "透明呈現結果"],
      },
    ],
    quiz: [
      { id: "t2k-q1", skill: "linker", q: "從靜態函式庫拉入程式碼的單位是？", options: ["整個 .a", "object file（.o）", "單一指令", "header"], answer: 1, explain: "因此 -ffunction-sections 能讓每個函式成為獨立 section 以便移除。" },
      { id: "t2k-q2", skill: "linker", q: "MCU 韌體通常使用哪種連結？", options: ["動態連結", "靜態連結", "不需要連結", "JIT"], answer: 1, explain: "沒有 MMU 與 loader，映像必須自給自足。" },
      { id: "t2k-q3", skill: "linker", q: "map file 中 \"Archive member included to satisfy reference by file\" 段落告訴你？", options: ["記憶體大小", "某函式庫成員被拉入的原因（誰引用它）", "編譯警告", "除錯資訊"], answer: 1, explain: "可追溯到第一個引用者。" },
      { id: "t2k-q4", skill: "linker", q: "公平比較兩個編譯器 code size，下列何者最不應該做？", options: ["使用相同原始碼", "對齊函式庫設定", "比較 .elf 檔案大小", "比較映像的 Flash 用量"], answer: 2, explain: "ELF 包含除錯資訊與符號，不代表 Flash 用量。" },
      { id: "t2k-q5", skill: "linker", q: "GNU ld 中函式庫循環相依的解法？", options: ["-O3", "--start-group ... --end-group", "-static", "KEEP"], answer: 1, explain: "讓 linker 在群組內反覆搜尋直到沒有新符號。" },
    ],
    reading: [
      { title: "GNU ld — Options (-Map, --gc-sections, --start-group)", url: "https://sourceware.org/binutils/docs/ld/Options.html", note: "官方選項說明" },
      { title: "Google bloaty", url: "https://github.com/google/bloaty", note: "分析 ELF 大小組成的開源工具" },
      { title: "IAR C/C++ Development Guide — Linker map file", note: "ILINK map file 各段落的意義（隨產品提供）" },
    ],
  },
];
