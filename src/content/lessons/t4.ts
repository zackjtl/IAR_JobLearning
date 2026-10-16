import type { LessonContent } from "../types";

export const T4: LessonContent[] = [
  // ───────────────────────────────────────────── t4-cortex
  {
    id: "t4-cortex",
    objectives: [
      "區分 Arm Cortex-M、Cortex-R、Cortex-A 的定位，以及 Armv6-M / v7-M / v8-M 的差異",
      "說出 RISC-V 的核心概念：開放 ISA、base + extensions、privilege modes、ABI 名稱",
      "理解為何 IAR 這類工具鏈廠商需要同時支援 Arm 與 RISC-V，以及客戶在兩者間的考量",
      "能用你的 Zynq（Cortex-A53 + R5）經驗回答架構問題",
    ],
    concept: `
#### Arm 三大系列
- **Cortex-M（Microcontroller）**：低功耗、確定性中斷延遲、無 MMU（可選 MPU）、只執行 Thumb 指令。代表：
  - **Armv6-M**：Cortex-M0/M0+ —— 最小、無硬體除法（部分）、只有 HardFault。
  - **Armv7-M / v7E-M**：Cortex-M3、M4（DSP + 選配 FPU）、M7（高效能、cache、TCM）。
  - **Armv8-M**：Cortex-M23（Baseline）、M33/M35P（Mainline）、M55/M85（v8.1-M，Helium 向量擴充）—— 支援 **TrustZone for Armv8-M**（安全/非安全世界）、stack limit 暫存器。
- **Cortex-R（Real-time）**：高可靠即時處理，常見 lockstep、MPU，例如 Zynq UltraScale+ 的 **Cortex-R5F**、儲存控制器、車用。
- **Cortex-A（Application）**：MMU、跑 Linux/Android，例如 Zynq UltraScale+ 的 **Cortex-A53**（Armv8-A，AArch64）。

#### RISC-V
- **開放、免授權費的 ISA 規格**（RISC-V International 維護），任何人可實作核心。
- **Base ISA + 擴充**：RV32I / RV64I；M（乘除）、A（原子）、F/D（浮點）、C（壓縮指令）、Zicsr、Zifencei；**G** = IMAFD + Zicsr + Zifencei；還有 B（bit manipulation）、V（向量）等。廠商可加自訂擴充 —— 這對編譯器支援是挑戰也是機會。
- **Privilege modes**：M（Machine）、S（Supervisor）、U（User）。MCU 類核心常只有 M（或 M+U）。
- **中斷**：透過 CSR（mtvec、mcause、mepc、mstatus）；中斷控制器有 CLINT/PLIC，或為 MCU 設計的 CLIC —— 不像 Cortex-M 的 NVIC 那樣統一，**不同廠商實作差異大**。
- **ABI 名稱**：ilp32、ilp32f、ilp32d、lp64d 等；暫存器 x0（恆為 0）、ra、sp、a0–a7（參數）、s0–s11（callee-saved）、t0–t6（暫存）。
- GCC/Clang 用 \`-march=rv32imac -mabi=ilp32\` 指定。

#### 為什麼 JD 同時提 Arm 與 RISC-V
晶片廠在新產品線導入 RISC-V，客戶需要「同一套工具、同樣的工作流程」跨架構 —— 這正是商業工具鏈的賣點之一，也是 FAE 會被問到的遷移議題。
`,
    terms: [
      { en: "ISA (Instruction Set Architecture)", zh: "指令集架構", note: "軟硬體間的契約" },
      { en: "Thumb-2", zh: "Thumb-2 指令集", note: "Cortex-M 唯一支援的指令狀態" },
      { en: "TrustZone for Armv8-M", zh: "Armv8-M TrustZone", note: "安全/非安全狀態隔離" },
      { en: "Lockstep", zh: "鎖步", note: "雙核心同步執行比對（安全應用）" },
      { en: "ISA Extension", zh: "指令集擴充", note: "RISC-V 的 M/A/F/D/C/V…" },
      { en: "Privilege Mode", zh: "特權模式", note: "RISC-V 的 M/S/U" },
      { en: "CSR (Control and Status Register)", zh: "控制與狀態暫存器", note: "RISC-V 的系統暫存器" },
      { en: "Custom Extension", zh: "自訂擴充", note: "廠商專屬指令，需工具鏈支援" },
    ],
    diagram: {
      title: "Arm 與 RISC-V 產品光譜",
      mermaid: `flowchart LR
  subgraph ARM["Arm"]
    M0["Cortex-M0/M0+<br/>Armv6-M"] --> M4["Cortex-M3/M4/M7<br/>Armv7-M"] --> M33["Cortex-M23/M33/M55/M85<br/>Armv8-M + TrustZone"]
    R5["Cortex-R5/R52<br/>即時/安全"]
    A53["Cortex-A53/A7x<br/>MMU + Linux"]
  end
  subgraph RV["RISC-V"]
    E["RV32E/I + C<br/>極小 MCU"] --> MC["RV32IMAC/IMAFC<br/>一般 MCU"] --> AP["RV64GC (+V)<br/>Linux 等級"]
  end
  M4 -.->|"同等級競爭"| MC
  A53 -.-> AP`,
    },
    code: [
      {
        title: "Arm vs RISC-V：同一個函式的編譯選項與組語（示意）",
        lang: "bash",
        code: `# Cortex-M4F
arm-none-eabi-gcc  -mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard -O2 -S add.c
# RISC-V RV32IMAC (無硬體浮點)
riscv64-unknown-elf-gcc -march=rv32imac -mabi=ilp32 -O2 -S add.c`,
      },
      {
        title: "int add3(int a,int b,int c) 的輸出",
        lang: "asm",
        code: `@ Arm Thumb-2 (AAPCS: r0-r2 參數, r0 回傳)
add3:
    add     r0, r0, r1
    add     r0, r0, r2
    bx      lr

# RISC-V (a0-a2 參數, a0 回傳, ra 返回位址)
add3:
    add     a0, a0, a1
    add     a0, a0, a2
    ret                     # 偽指令 = jalr x0, 0(ra)`,
      },
      {
        title: "RISC-V machine-mode 中斷進入點（概念）",
        lang: "c",
        code: `/* mtvec 指向 trap handler；mcause 判斷原因 */
void __attribute__((interrupt("machine"))) trap_handler(void)   /* GCC RISC-V 屬性 */
{
    uintptr_t cause;
    __asm volatile ("csrr %0, mcause" : "=r"(cause));
    if ((intptr_t)cause < 0) {          /* 最高位元 = 1 → 中斷 */
        handle_irq(cause & 0xFFF);
    } else {
        handle_exception(cause);        /* 例外：非法指令、存取錯誤… */
    }
}`,
        note: "中斷屬性與 CSR 存取在不同工具鏈的寫法不同（IAR RISC-V 有自己的關鍵字/intrinsic，請查手冊）。",
      },
    ],
    analysis: `
#### Cortex-M 為什麼適合即時控制？
- **NVIC** 整合在核心中：硬體自動保存暫存器、tail-chaining、late-arrival，延遲固定且短（Cortex-M3/M4 典型 12 cycles 進入中斷）。
- **ISR 可以直接寫成 C 函式**（硬體依 AAPCS 保存 caller-saved 暫存器）。
- 無 MMU、無 cache（M7 除外）→ 時序可預測。

#### Cortex-A 的差異
- MMU、多層 cache、分支預測、亂序執行 → 平均效能高，但最壞情況延遲難以保證。
- 啟動流程複雜（BootROM → FSBL/SPL → U-Boot → Linux），你在 Zynq 上已有經驗。

#### RISC-V 對工具鏈的挑戰（FAE 會被問）
- 擴充組合多 → 編譯器、函式庫要提供對應的 multilib 組合
- 自訂指令 → 需要 intrinsic 或組譯器支援
- 中斷控制器不統一 → BSP/startup 依晶片而異
- 除錯介面（RISC-V Debug Spec）支援程度因晶片而異

#### 給面試的誠實定位
「我在 Arm Cortex-A/R（Zynq）與 SSD controller 上有實務經驗；Cortex-M 的例外模型與 RISC-V 我透過學習補強，理解其概念與差異。」—— 比假裝精通更可信。
`,
    cases: [
      {
        title: "客戶評估從 Cortex-M4 換到 RISC-V MCU",
        body: "客戶關心：既有程式碼移植成本、工具鏈是否一致、RTOS 支援、除錯體驗、功能安全。FAE 可說明：C 程式碼大多可直接重新編譯，需改的是 startup、中斷處理、CMSIS 相關程式與內嵌組語；若同一家工具鏈同時支援兩種架構，專案結構與工作流程可以保持一致。",
      },
      {
        title: "Zynq UltraScale+ 的 R5 與 A53 分工",
        body: "A53 跑 Linux 處理網路與 UI，R5 跑 FreeRTOS 或裸機做即時控制，透過 OCM 共享記憶體與 IPI 通訊。這類異質多核架構是你可以在面試中展開的真實經驗，並連結到 FAE 需要理解客戶系統全貌的能力。",
      },
    ],
    customerQs: [
      {
        q: "We're considering moving from Arm to RISC-V. What will we need to change in our software?",
        zh: "我們考慮從 Arm 換到 RISC-V，軟體需要改什麼？",
        answer: "可攜的 C 程式碼通常只需重新編譯；需要調整的是 startup 與向量表、中斷處理（RISC-V 的中斷控制器依晶片而定）、CMSIS 相關程式、內嵌組語與 intrinsic、linker 設定。建議先盤點平台相關程式碼的比例，並用同一套工具鏈評估兩邊的 code size 與效能。",
      },
      {
        q: "Does your compiler support our vendor's custom RISC-V extensions?",
        zh: "你們編譯器支援我們晶片廠的 RISC-V 自訂擴充嗎？",
        answer: "需依具體擴充與產品版本確認。我會向產品團隊查詢支援狀態；若未支援，常見替代是使用組譯器支援的 .insn 類寫法或 intrinsic。這也是我們與晶片廠合作的議題。",
      },
      {
        q: "What's the practical difference between Cortex-M33 and M4 for us?",
        zh: "Cortex-M33 與 M4 對我們的實際差異？",
        answer: "M33（Armv8-M Mainline）主要新增 TrustZone 安全隔離、更好的 MPU 模型、stack limit 檢查；DSP/FPU 能力相近。若產品有安全需求（例如 PSA Certified），M33 有明顯優勢，但軟體架構需要劃分安全/非安全世界。",
      },
    ],
    interviewQs: [
      {
        q: "Compare Cortex-M and Cortex-A. When would you choose each?",
        zh: "比較 Cortex-M 與 Cortex-A，何時選哪一個？",
        points: ["即時性 vs 平均效能", "MMU/Linux", "功耗與成本", "異質多核（Zynq 經驗）"],
      },
      {
        q: "What do you know about RISC-V?",
        zh: "你對 RISC-V 了解多少？",
        points: ["開放 ISA、base + extensions", "privilege modes", "生態與工具鏈挑戰", "誠實說明實務經驗程度"],
      },
      {
        q: "What's TrustZone for Armv8-M?",
        zh: "什麼是 Armv8-M 的 TrustZone？",
        points: ["安全/非安全狀態", "SAU/IDAU", "非安全呼叫安全函式的閘道（NSC）", "應用：金鑰保護、安全開機"],
      },
    ],
    quiz: [
      { id: "t4c-q1", skill: "rtos", q: "哪個 Cortex-M 架構版本只有 HardFault、沒有 CFSR？", options: ["Armv6-M（M0/M0+）", "Armv7-M（M3/M4）", "Armv8-M Mainline（M33）", "全部都有"], answer: 0, explain: "Armv6-M 的 fault 模型最精簡。" },
      { id: "t4c-q2", skill: "rtos", q: "RISC-V 的「C」擴充是？", options: ["C 語言支援", "壓縮（16-bit）指令", "Cache", "Crypto"], answer: 1, explain: "Compressed instructions，降低 code size。" },
      { id: "t4c-q3", skill: "rtos", q: "RISC-V 中保存例外原因的 CSR？", options: ["mtvec", "mcause", "mepc", "mstatus"], answer: 1, explain: "mtvec=handler 位址、mepc=例外 PC、mstatus=狀態。" },
      { id: "t4c-q4", skill: "rtos", q: "TrustZone for Armv8-M 首次出現在哪類核心？", options: ["Cortex-M0", "Cortex-M4", "Cortex-M23/M33", "Cortex-A53"], answer: 2, explain: "Armv8-M（Baseline 與 Mainline）。" },
      { id: "t4c-q5", skill: "rtos", q: "跑 Linux 需要的關鍵硬體功能？", options: ["MPU", "MMU", "FPU", "DSP"], answer: 1, explain: "虛擬記憶體需要 MMU（Cortex-A 有，Cortex-M 沒有）。" },
      { id: "t4c-q6", skill: "rtos", q: "RISC-V 的 a0 暫存器在 ABI 中的角色？", options: ["返回位址", "第 1 個參數與回傳值", "Stack pointer", "恆為零"], answer: 1, explain: "ra=返回位址、sp=stack、x0=零。" },
    ],
    reading: [
      { title: "RISC-V International — Specifications", url: "https://riscv.org/", note: "在官網 Specifications 區下載 Unprivileged / Privileged ISA" },
      { title: "Arm Developer — Cortex-M processor comparison", url: "https://developer.arm.com/", note: "搜尋 'Cortex-M processor comparison table'" },
      { title: "IAR — Embedded Workbench for RISC-V", url: "https://www.iar.com/", note: "官網產品頁，確認支援的核心與擴充（以最新資訊為準）" },
    ],
    toVerify: ["IAR RISC-V 版本支援的擴充與中斷關鍵字"],
  },

  // ───────────────────────────────────────────── t4-rtos
  {
    id: "t4-rtos",
    objectives: [
      "解釋搶占式優先權排程、time slicing、tick 與 context switch（Cortex-M 上的 PendSV）",
      "正確選擇 mutex、binary/counting semaphore、queue、event group、task notification",
      "說明 priority inversion 與 priority inheritance，並能舉例",
      "了解 deadlock、starvation 與 rate monotonic 的基本概念",
    ],
    concept: `
#### 排程
- **Preemptive priority scheduling**：永遠執行「就緒中優先權最高」的 task；高優先權 task 就緒時立刻搶占。
- **Time slicing（round robin）**：同優先權 task 每個 tick 輪流。
- **Tick**：週期性中斷（例如 1 ms SysTick），用於延遲、timeout、time slicing。Tickless idle 可在閒置時停掉 tick 省電。
- **Context switch（Cortex-M）**：通常在 **PendSV**（最低優先權例外）中進行：保存 r4–r11（硬體已保存 r0–r3 等）到目前 task 的 PSP stack，切換 TCB，恢復下一個 task。第一個 task 常由 **SVC** 啟動。

#### Task 狀態
Running → Ready → Blocked（等待 queue/semaphore/delay）→ Suspended。

#### 同步與通訊原語（以 FreeRTOS 為例）
- **Mutex**：保護共享資源；**有擁有者**，支援 **priority inheritance**；不可在 ISR 中使用。
- **Binary semaphore**：事件通知（ISR → task），沒有擁有者概念。
- **Counting semaphore**：計數資源或事件。
- **Queue**：傳送資料（複製進佇列），ISR 用 \`xQueueSendFromISR\`。
- **Event group**：等待多個事件位元的組合。
- **Task notification**：輕量、直接通知特定 task，最快的 ISR→task 機制。

#### Priority Inversion
高優先權 H 等待低優先權 L 持有的 mutex，此時中優先權 M 就緒並搶占 L → H 被 M 間接阻擋，時間不受控。經典案例：**Mars Pathfinder（1997）**。
解法：**Priority inheritance**（L 暫時繼承 H 的優先權）或 **priority ceiling**。
`,
    terms: [
      { en: "Preemptive Scheduling", zh: "搶占式排程", note: "高優先權就緒即搶占" },
      { en: "Context Switch", zh: "情境切換", note: "保存/恢復 task 暫存器" },
      { en: "PendSV", zh: "可懸置系統服務例外", note: "Cortex-M 上做 context switch" },
      { en: "Priority Inversion", zh: "優先權反轉", note: "高優先權被低優先權間接阻擋" },
      { en: "Priority Inheritance", zh: "優先權繼承", note: "持有者暫時提高優先權" },
      { en: "Mutex vs Semaphore", zh: "互斥鎖 vs 號誌", note: "有擁有者 vs 計數/事件" },
      { en: "Deadlock", zh: "死結", note: "互相等待對方釋放資源" },
      { en: "Rate Monotonic Scheduling", zh: "速率單調排程", note: "週期越短優先權越高" },
    ],
    diagram: {
      title: "Priority inversion 與 inheritance",
      mermaid: `sequenceDiagram
  participant L as Task L (low)
  participant M as Task M (mid)
  participant H as Task H (high)
  L->>L: take(mutex)
  H->>H: 就緒，搶占 L
  H->>L: take(mutex) → blocked
  Note over L,H: 沒有 inheritance：
  M->>M: 就緒，搶占 L（L 優先權低於 M）
  M->>M: 執行很久… H 一直等
  Note over L,H: 有 inheritance：L 暫時升為 H 的優先權
  L->>L: 不被 M 搶占，盡快 give(mutex)
  L->>H: H 取得 mutex，繼續`,
    },
    code: [
      {
        title: "ISR → task：task notification（FreeRTOS）",
        lang: "c",
        code: `#include "FreeRTOS.h"
#include "task.h"

static TaskHandle_t s_rx_task;

void USART1_IRQHandler(void)
{
    BaseType_t woken = pdFALSE;
    /* 清中斷旗標、把資料放進 ring buffer ... */
    vTaskNotifyGiveFromISR(s_rx_task, &woken);
    portYIELD_FROM_ISR(woken);          /* 若喚醒了更高優先權 task，離開 ISR 後立即切換 */
}

static void rx_task(void *arg)
{
    for (;;) {
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);   /* 阻塞等待 */
        parse_ring_buffer();
    }
}

void app_init(void)
{
    xTaskCreate(rx_task, "rx", 512, NULL, tskIDLE_PRIORITY + 3, &s_rx_task);
}`,
      },
      {
        title: "Mutex 保護共享資源（含 timeout）",
        lang: "c",
        code: `static SemaphoreHandle_t s_i2c_mutex;   /* xSemaphoreCreateMutex() 建立 */

bool sensor_read(uint8_t reg, uint8_t *val)
{
    if (xSemaphoreTake(s_i2c_mutex, pdMS_TO_TICKS(20)) != pdTRUE)
        return false;                     /* 不要無限等待：讓問題可被觀察 */
    bool ok = i2c_read_reg(SENSOR_ADDR, reg, val);
    xSemaphoreGive(s_i2c_mutex);
    return ok;
}`,
      },
    ],
    analysis: `
#### 常見設計錯誤
- 用 binary semaphore 保護資源（沒有 priority inheritance）
- 在 ISR 呼叫非 FromISR API，或中斷優先權高於 \`configMAX_SYSCALL_INTERRUPT_PRIORITY\` 卻呼叫 RTOS API（Cortex-M 上數字越小優先權越高，常搞反）
- 持有 mutex 時呼叫可能阻塞很久的函式
- 多個 mutex 取得順序不一致 → deadlock
- Task stack 太小（printf、浮點格式化）
- 最高優先權 task 忙等，造成低優先權 starvation

#### Rate Monotonic 的直覺
週期性 task 依週期給優先權（越短越高）；n 個 task 的 CPU 使用率 ≤ n(2^(1/n) − 1)（n 大時約 69%）時保證可排程。實務上用量測（trace 工具）驗證。

#### Trace 工具的價值
RTOS 問題（偶發延遲、優先權反轉）靠中斷點很難看到 —— 需要 **trace**（例如 SEGGER SystemView、Percepio Tracealyzer）。IAR C-SPY 也提供 RTOS awareness 外掛來檢視 task、queue 狀態（支援的 RTOS 與功能以官方資訊為準）。FAE 示範這類功能時，用客戶熟悉的 RTOS 效果最好。
`,
    cases: [
      {
        title: "偶發的控制迴圈延遲",
        body: "1 kHz 控制 task 偶爾延遲 5 ms。Trace 發現：低優先權的 logging task 持有 SPI mutex 寫 Flash 時，被中優先權網路 task 搶占 —— priority inversion。原本用 binary semaphore 實作「鎖」，改為 mutex（有 inheritance）並縮短持鎖時間後解決。",
      },
      {
        title: "configASSERT 在 ISR 中觸發",
        body: "移植到新晶片後，UART ISR 呼叫 xQueueSendFromISR 時 assert 失敗。原因是新晶片的優先權位元數不同（例如 4 bits vs 3 bits），ISR 優先權設定高於 configMAX_SYSCALL_INTERRUPT_PRIORITY。依晶片的 __NVIC_PRIO_BITS 重新設定即可。",
      },
    ],
    customerQs: [
      {
        q: "Can your debugger show FreeRTOS tasks and their stack usage?",
        zh: "你們的 debugger 能顯示 FreeRTOS task 與 stack 使用量嗎？",
        answer: "C-SPY 有 RTOS awareness 外掛，可檢視 task 清單、狀態與相關物件；支援的 RTOS 與版本、可顯示的資訊請以官方文件為準。我可以用你們的專案示範。",
      },
      {
        q: "Our high-priority task sometimes misses its deadline. How do we find out why?",
        zh: "高優先權 task 偶爾錯過 deadline，怎麼找原因？",
        answer: "需要時間軸資料：使用 RTOS trace（或 GPIO 打點 + 邏輯分析儀）找出那段時間誰在執行；常見原因是 priority inversion、ISR 太長、關中斷時間過長、或 tick 中處理太多工作。",
      },
      {
        q: "Should we use a mutex or a semaphore here?",
        zh: "這裡該用 mutex 還是 semaphore？",
        answer: "保護共享資源 → mutex（有擁有者與 priority inheritance）；通知事件（特別是 ISR → task）→ semaphore 或更輕量的 task notification。",
      },
    ],
    interviewQs: [
      {
        q: "Explain priority inversion and how to prevent it.",
        zh: "說明優先權反轉以及如何避免。",
        points: ["H/M/L 例子", "Mars Pathfinder", "priority inheritance / ceiling", "縮短持鎖時間"],
      },
      {
        q: "How does a context switch work on Cortex-M?",
        zh: "Cortex-M 上的 context switch 如何運作？",
        points: ["PendSV 最低優先權", "硬體保存 r0-r3 等、軟體保存 r4-r11", "PSP 切換", "FPU lazy stacking"],
      },
      {
        q: "Tell me about your FreeRTOS experience.",
        zh: "談談你的 FreeRTOS 經驗。",
        points: ["在哪個平台（例如 Zynq R5）", "task 設計", "遇過的問題與解法", "工具"],
      },
    ],
    quiz: [
      { id: "t4r-q1", skill: "rtos", q: "Cortex-M RTOS 通常在哪個例外中做 context switch？", options: ["HardFault", "SysTick", "PendSV", "NMI"], answer: 2, explain: "PendSV 設為最低優先權，確保所有 ISR 完成後才切換。" },
      { id: "t4r-q2", skill: "rtos", q: "保護共享資源最適合？", options: ["Binary semaphore", "Mutex", "Event group", "Queue"], answer: 1, explain: "Mutex 有擁有者並支援 priority inheritance。" },
      { id: "t4r-q3", skill: "rtos", q: "ISR 通知 task 最輕量的 FreeRTOS 機制？", options: ["Queue", "Mutex", "Task notification", "Software timer"], answer: 2, explain: "直接通知，不需要額外物件。" },
      { id: "t4r-q4", skill: "rtos", q: "Priority inheritance 解決什麼問題？", options: ["Deadlock", "Priority inversion 的無界延遲", "Stack overflow", "Heap 碎片"], answer: 1, explain: "讓持鎖的低優先權 task 暫時提高優先權。" },
      { id: "t4r-q5", skill: "rtos", q: "兩個 task 以相反順序取得兩個 mutex，可能造成？", options: ["Priority inversion", "Deadlock", "Starvation", "Stack overflow"], answer: 1, explain: "固定取得順序可以避免。" },
      { id: "t4r-q6", skill: "rtos", q: "FreeRTOS 中，ISR 優先權若「高於」configMAX_SYSCALL_INTERRUPT_PRIORITY（數值更小），則？", options: ["可以呼叫所有 API", "不可呼叫任何 FreeRTOS API", "只能呼叫 mutex API", "沒有影響"], answer: 1, explain: "這類中斷不會被 RTOS 臨界區遮蔽，呼叫 API 會破壞內部狀態。" },
    ],
    reading: [
      { title: "FreeRTOS — Kernel documentation", url: "https://www.freertos.org/", note: "Mutex、task notification、Cortex-M 中斷優先權設定（搜尋 'RTOS-Cortex-M3-M4'）" },
      { title: "What really happened on Mars (Pathfinder priority inversion)", note: "Glenn Reeves 的說明，經典案例，網路搜尋即可" },
      { title: "IAR — C-SPY RTOS awareness", note: "支援的 RTOS 外掛（以官方資訊為準）" },
    ],
    toVerify: ["C-SPY RTOS awareness 支援的 RTOS 清單"],
  },

  // ───────────────────────────────────────────── t4-interrupts
  {
    id: "t4-interrupts",
    objectives: [
      "理解 NVIC：優先權、preemption/sub-priority、pending、tail-chaining、late arrival",
      "撰寫正確的 ISR：短、清旗標、只做必要工作、與 task 正確溝通",
      "說明中斷延遲的來源與量測方式；PRIMASK、BASEPRI 的用途",
      "了解 MPU 的用途、Armv7-M 與 Armv8-M MPU 的差異",
    ],
    concept: `
#### NVIC 重點
- 每個 IRQ 有可程式優先權（實作的位元數依晶片，常見 3–4 bits，存在 8-bit 欄位的高位）。**數值越小優先權越高**。
- **Priority grouping**：把優先權拆成 group（可搶占）與 sub-priority（同 group 時決定順序，不搶占）。
- **Tail-chaining**：一個 ISR 結束時若有另一個 pending，直接進入下一個，不重新出入 stack。
- **Late arrival**：保存暫存器期間若更高優先權中斷到達，直接改服務它。
- **Pending**：中斷旗標被設但尚未服務；若 ISR 沒有清除周邊旗標，返回後會立刻再次進入。

#### 遮蔽中斷
- **PRIMASK**：\`cpsid i\` 關閉所有可設定優先權的中斷（NMI、HardFault 除外）。
- **BASEPRI**（Armv7-M 以上）：只遮蔽「優先權數值 ≥ 設定值」的中斷，讓最緊急的中斷仍可進入。FreeRTOS 的 Cortex-M3/M4 port 用 BASEPRI 實作臨界區。
- **FAULTMASK**：連 HardFault 都遮蔽（少用）。

#### 中斷延遲來源
硬體進入延遲（Cortex-M3/M4 約 12 cycles，零等待記憶體）＋ 更高優先權 ISR 執行中 ＋ 關中斷的臨界區長度 ＋ Flash wait states ＋ 多週期指令。

#### MPU（Memory Protection Unit）
- 定義記憶體區域的存取權限（RO/RW、特權/非特權、XN 不可執行）與屬性（cacheable…）。
- **Armv7-M MPU**：常見 8 個 region，大小須為 2 的冪次且起點對齊大小，可用 sub-region。
- **Armv8-M MPU**：base/limit 定義，32-byte 粒度，更容易配置。
- 用途：stack guard、防止 NULL 存取、把 RTOS task 隔離成非特權模式、資料區不可執行。
`,
    terms: [
      { en: "NVIC", zh: "巢狀向量中斷控制器", note: "Nested Vectored Interrupt Controller" },
      { en: "Interrupt Latency", zh: "中斷延遲", note: "事件發生到 ISR 第一條指令" },
      { en: "Tail-chaining", zh: "尾鏈", note: "連續 ISR 不重新出入 stack" },
      { en: "Preemption Priority / Sub-priority", zh: "搶占優先權 / 子優先權", note: "priority grouping" },
      { en: "PRIMASK / BASEPRI", zh: "優先權遮罩暫存器", note: "關閉全部/部分中斷" },
      { en: "Pending Interrupt", zh: "待處理中斷", note: "已觸發未服務" },
      { en: "MPU", zh: "記憶體保護單元", note: "region 權限控制" },
      { en: "Execute Never (XN)", zh: "不可執行", note: "防止在資料區執行程式碼" },
    ],
    diagram: {
      title: "中斷搶占與 tail-chaining",
      mermaid: `sequenceDiagram
  participant T as Thread (task)
  participant L as IRQ low (prio 5)
  participant H as IRQ high (prio 2)
  T->>L: IRQ5 觸發 → 硬體 stacking
  L->>H: IRQ2 觸發 → 搶占 IRQ5
  H-->>L: IRQ2 結束 → 返回 IRQ5
  Note over L: 此時 IRQ6 pending
  L->>L: IRQ5 結束 → tail-chain 直接進 IRQ6（不 unstack）
  L-->>T: 全部結束 → unstacking 返回 task`,
    },
    code: [
      {
        title: "設定 NVIC 優先權（CMSIS）",
        lang: "c",
        code: `/* 假設晶片實作 4 bits 優先權 (__NVIC_PRIO_BITS = 4) */
NVIC_SetPriorityGrouping(0);              /* 全部為 preemption 位元（依需求） */
NVIC_SetPriority(TIM2_IRQn, 2);           /* 馬達控制：高 */
NVIC_SetPriority(USART1_IRQn, 6);         /* 通訊：中 */
NVIC_SetPriority(EXTI0_IRQn, 10);         /* 按鍵：低 */
NVIC_EnableIRQ(TIM2_IRQn);

/* 只遮蔽優先權數值 >= 5 的中斷，TIM2(2) 仍可進入 */
__set_BASEPRI(5 << (8 - __NVIC_PRIO_BITS));
update_shared_state();
__set_BASEPRI(0);`,
      },
      {
        title: "ISR 的良好寫法",
        lang: "c",
        code: `void TIM2_IRQHandler(void)
{
    if (TIM2->SR & TIM_SR_UIF) {
        TIM2->SR = ~TIM_SR_UIF;          /* 先清旗標（寫 0 清除，依周邊而定） */
        (void)TIM2->SR;                  /* 回讀：確保清除在返回前生效（避免重入） */
        motor_fast_loop();               /* 短且有界的工作 */
        if (++s_div == 10) {
            s_div = 0;
            notify_slow_task_from_isr(); /* 重的工作交給 task */
        }
    }
}`,
        note: "清旗標後立即返回時，因寫入緩衝延遲可能造成 ISR 被再次觸發；回讀或 DSB 是常見對策（依晶片手冊建議）。",
      },
      {
        title: "Armv7-M MPU：在 stack 底部設 guard region（概念）",
        lang: "c",
        code: `/* region 7：stack 底端 32 bytes，禁止存取 → 溢位立刻 MemManage fault */
MPU->RNR  = 7;
MPU->RBAR = (uint32_t)&__stack_limit;           /* 必須對齊 region 大小 */
MPU->RASR = (0x4u << MPU_RASR_SIZE_Pos)        /* SIZE: 2^(4+1) = 32 bytes */
          | (0x0u << MPU_RASR_AP_Pos)          /* AP: no access */
          | MPU_RASR_XN_Msk
          | MPU_RASR_ENABLE_Msk;
MPU->CTRL = MPU_CTRL_PRIVDEFENA_Msk | MPU_CTRL_ENABLE_Msk;
SCB->SHCSR |= SCB_SHCSR_MEMFAULTENA_Msk;        /* 啟用 MemManage fault */
__DSB(); __ISB();`,
      },
    ],
    analysis: `
#### ISR 設計原則
1. **短**：只做時間關鍵的事，其餘交給 task（deferred processing）。
2. **清旗標**：否則立即重入。
3. **不要阻塞**：不呼叫可能等待的 API、不使用 mutex。
4. **共享資料**：volatile + 適當保護（Track 1 volatile 課）。
5. **優先權設計**：依 deadline 而非「重要性」；RTOS 中注意可呼叫 API 的上限。

#### 量測中斷延遲
GPIO：事件觸發的同一個輸入接示波器，ISR 第一行拉高另一 GPIO，量兩者時間差；或用 DWT CYCCNT / trace。

#### MPU 的商業價值
功能安全（IEC 61508、ISO 26262）常要求「freedom from interference」，MPU 是實現 task 間記憶體隔離的基礎。工具鏈若能協助產生 MPU 設定、或 RTOS 提供 MPU 支援，是客戶評估的考量點。
`,
    cases: [
      {
        title: "UART 中斷造成系統卡死",
        body: "UART 溢位錯誤旗標（ORE）沒有清除，ISR 只處理 RXNE，導致中斷持續 pending，主程式完全無法執行。看起來像「當機」，實際是 ISR 無限重入。在 ISR 中檢查並清除所有錯誤旗標即解決。",
      },
      {
        title: "用 MPU 抓到 NULL 指標寫入",
        body: "啟用 MPU 把 0x0 起的 region 設為不可寫/不可存取（若向量表不在該處或已重新定位）後，原本默默寫壞向量表附近資料的 bug 立即觸發 MemManage fault，MMFAR 直接指出位址。",
      },
    ],
    customerQs: [
      {
        q: "Our interrupt latency is much longer than the datasheet says. Why?",
        zh: "中斷延遲比 datasheet 長很多，為什麼？",
        answer: "Datasheet 的數字是理想情況（零等待記憶體、無遮蔽）。實際還包括：更高優先權 ISR、關中斷的臨界區（含 RTOS 臨界區）、Flash wait state、ISR 開頭的程式碼。建議量測並找出最長的關中斷區段；把 ISR 放到 RAM/TCM 也可能有幫助。",
      },
      {
        q: "How should we configure interrupt priorities with FreeRTOS?",
        zh: "搭配 FreeRTOS 時中斷優先權該怎麼設？",
        answer: "會呼叫 FreeRTOS API 的 ISR，優先權數值必須 ≥ configMAX_SYSCALL_INTERRUPT_PRIORITY；更緊急且不呼叫 API 的 ISR 可以設更高（數值更小）。並注意晶片實作的優先權位元數與 priority grouping 設定。",
      },
      {
        q: "Is using the MPU worth the effort for us?",
        zh: "使用 MPU 值得嗎？",
        answer: "至少在開發階段非常值得：stack guard 與 NULL 保護能把隱性記憶體毀損變成立即 fault。若有功能安全需求，task 隔離幾乎是必要的。可以從最簡單的 guard region 開始。",
      },
    ],
    interviewQs: [
      {
        q: "What makes a good interrupt service routine?",
        zh: "好的 ISR 有哪些特徵？",
        points: ["短而有界", "清旗標", "不阻塞", "deferred processing", "共享資料保護"],
      },
      {
        q: "What's the difference between PRIMASK and BASEPRI?",
        zh: "PRIMASK 與 BASEPRI 的差別？",
        points: ["全部 vs 依優先權遮蔽", "RTOS 臨界區", "保留高優先權中斷的即時性"],
      },
      {
        q: "How have you used memory protection in your projects?",
        zh: "你在專案中如何使用記憶體保護？",
        points: ["MPU/MMU 經驗（Zynq Cortex-A MMU、R5 MPU）", "stack guard", "隔離", "誠實描述程度"],
      },
    ],
    quiz: [
      { id: "t4i-q1", skill: "rtos", q: "ISR 結束時若另一中斷 pending，Cortex-M 直接進入下一個 ISR 而不 unstack，稱為？", options: ["Late arrival", "Tail-chaining", "Preemption", "Lazy stacking"], answer: 1, explain: "減少連續中斷的開銷。" },
      { id: "t4i-q2", skill: "rtos", q: "只遮蔽部分（低優先權）中斷應使用？", options: ["PRIMASK", "BASEPRI", "FAULTMASK", "CONTROL"], answer: 1, explain: "BASEPRI 只遮蔽優先權數值大於等於設定值的中斷。" },
      { id: "t4i-q3", skill: "rtos", q: "ISR 沒有清除周邊中斷旗標，最可能？", options: ["中斷遺失", "ISR 不斷重入，主程式無法執行", "HardFault", "沒有影響"], answer: 1, explain: "旗標仍成立，返回後立刻再次 pending。" },
      { id: "t4i-q4", skill: "rtos", q: "Armv7-M MPU region 大小的限制？", options: ["任意大小", "2 的冪次且起點對齊大小", "必須 4 KB", "只能 1 個 region"], answer: 1, explain: "Armv8-M 改為 base/limit，較有彈性。" },
      { id: "t4i-q5", skill: "rtos", q: "MPU 設定 XN 屬性的用途？", options: ["加快執行", "禁止從該區域執行指令", "啟用 cache", "共享記憶體"], answer: 1, explain: "防止在資料區（如 stack）執行注入的程式碼。" },
      { id: "t4i-q6", skill: "rtos", q: "依據什麼設定中斷優先權最合理？", options: ["功能重要性", "時間期限（deadline）與延遲需求", "IRQ 編號", "字母順序"], answer: 1, explain: "即時系統以時間需求決定。" },
    ],
    reading: [
      { title: "Arm — Cortex-M4 Devices Generic User Guide: NVIC & MPU", note: "優先權、MPU 暫存器定義" },
      { title: "FreeRTOS — Running the RTOS on an ARM Cortex-M core", url: "https://www.freertos.org/", note: "搜尋 'RTOS-Cortex-M3-M4'，中斷優先權的經典說明" },
      { title: "Memfault Interrupt — A Practical guide to ARM Cortex-M Exception Handling", url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic", note: "NVIC 與例外處理實務" },
    ],
  },

  // ───────────────────────────────────────────── t4-platforms
  {
    id: "t4-platforms",
    objectives: [
      "比較 bare-metal superloop、RTOS、Embedded Linux 的取捨與典型應用",
      "理解 BSP、HAL、CMSIS 的分層與職責",
      "能針對客戶需求提出平台選擇的判斷依據",
      "將你跨越裸機、FreeRTOS、Linux、Windows 的經驗整理成面試敘事",
    ],
    concept: `
#### 三種軟體平台
| 平台 | 特性 | 典型應用 |
|---|---|---|
| **Bare-metal (superloop + ISR)** | 最小、最可預測、無排程器；複雜度上升後難維護 | 小型感測器、簡單控制 |
| **RTOS**（FreeRTOS、Zephyr、ThreadX、embOS…）| 多工、優先權排程、確定性；KB 級記憶體 | 馬達控制、IoT 裝置、醫療設備 |
| **Embedded Linux** | 完整 OS、網路/檔案系統/驅動生態；需 MMU、MB 級記憶體；啟動慢、即時性有限 | 閘道器、HMI、影像處理 |

很多產品是**混合式**：Linux（Cortex-A）+ RTOS/裸機（Cortex-M/R）—— 例如 Zynq UltraScale+、i.MX 8M、STM32MP1。

#### 分層
- **CMSIS**（Arm 標準）：
  - CMSIS-Core：核心暫存器存取、intrinsic、startup/SystemInit 標準
  - CMSIS-RTOS2：RTOS API 抽象
  - CMSIS-Driver：周邊驅動介面
  - CMSIS-DSP / CMSIS-NN：運算函式庫
  - CMSIS-Pack：裝置支援與軟體元件的封裝格式，IDE 用它取得晶片資訊
- **HAL（Hardware Abstraction Layer）**：晶片廠提供的周邊驅動 API（例如 STM32 HAL/LL、NXP MCUXpresso SDK drivers）。
- **BSP（Board Support Package）**：針對特定**板子**的設定：腳位、時脈、外部元件、記憶體配置；Linux 世界中還包含 device tree、bootloader 設定。

#### 工具鏈與平台的關係
商業 MCU 工具鏈主要服務裸機與 RTOS 專案；Linux 應用與核心通常使用 GCC/Clang。FAE 要知道這個界線：當客戶的 Cortex-A Linux 專案問題不在產品範圍內時，誠實說明並轉向我們能提供價值的部分（例如同一產品中的 MCU 子系統）。
`,
    terms: [
      { en: "Superloop", zh: "超級迴圈", note: "while(1) 主迴圈 + ISR" },
      { en: "RTOS", zh: "即時作業系統", note: "Real-Time Operating System" },
      { en: "BSP", zh: "板級支援套件", note: "Board Support Package" },
      { en: "HAL", zh: "硬體抽象層", note: "Hardware Abstraction Layer" },
      { en: "CMSIS", zh: "Cortex 微控制器軟體介面標準", note: "Arm 的軟體標準" },
      { en: "CMSIS-Pack", zh: "CMSIS 套件", note: "裝置支援與元件封裝" },
      { en: "Device Tree", zh: "裝置樹", note: "Linux 描述硬體的資料結構" },
      { en: "Heterogeneous Multicore", zh: "異質多核", note: "不同類型核心組合" },
    ],
    diagram: {
      title: "嵌入式軟體分層",
      mermaid: `flowchart TB
  APP["Application"]
  MW["Middleware<br/>USB / TCP-IP / FS / GUI"]
  OS["RTOS kernel<br/>(或 bare-metal superloop)"]
  HAL["Vendor HAL / CMSIS-Driver"]
  BSP["BSP: board pins, clocks, memory"]
  CORE["CMSIS-Core<br/>(core registers, intrinsics, startup)"]
  HW["MCU hardware"]
  APP --> MW --> OS --> HAL --> CORE --> HW
  BSP -.-> HAL
  BSP -.-> CORE`,
    },
    code: [
      {
        title: "Superloop vs RTOS 的結構對照",
        lang: "c",
        code: `/* Bare-metal superloop */
int main(void)
{
    board_init();
    for (;;) {
        if (g_adc_ready)   { g_adc_ready = false; filter_update(); }
        if (g_uart_rx)     { g_uart_rx = false;   protocol_poll(); }
        if (tick_elapsed(&t_led, 500)) led_toggle();
        __WFI();                       /* 沒事就睡 */
    }
}

/* RTOS：每個關注點一個 task，由排程器依優先權執行 */
int main(void)
{
    board_init();
    xTaskCreate(control_task,  "ctrl", 512, NULL, 4, NULL);
    xTaskCreate(comm_task,     "comm", 768, NULL, 2, NULL);
    xTaskCreate(ui_task,       "ui",   512, NULL, 1, NULL);
    vTaskStartScheduler();
    for (;;) { }
}`,
      },
    ],
    analysis: `
#### 平台選擇的提問清單（Discovery 也適用）
- 最嚴格的即時需求是多少？（µs / ms / s）
- 需要哪些協定與檔案系統？是否需要大量開源軟體？
- 記憶體與成本限制？功耗？
- 是否有功能安全或資安認證需求？
- 團隊熟悉什麼？維護週期多長？

#### 你的經驗如何轉化
你同時做過 SSD/SD controller 韌體（裸機/RTOS、極度在意效能與資源）、Zynq（Linux + RTOS 異質）、Windows/Linux 應用（工具與上位機）。對 FAE 而言，這代表你能理解**客戶整個系統**，而不只是 MCU 那一塊 —— 在 discovery 時能問出更好的問題。這是你面對「沒有 FAE 經歷」質疑時最好的回答素材之一。
`,
    cases: [
      {
        title: "Superloop 擴充到極限",
        body: "產品功能從 3 個增加到 12 個，superloop 中的 polling 造成某些事件延遲不可預測；改用 RTOS 後各功能依優先權執行，時序問題反而更容易分析。但也帶來 stack 規劃與同步問題 —— 工具鏈的 stack 分析與 RTOS awareness 除錯就變得重要。",
      },
      {
        title: "Linux 無法滿足 50 µs 控制迴圈",
        body: "客戶原本把控制迴圈放在 Linux user-space，抖動達數百 µs。改為由同一 SoC 上的 Cortex-M/R 核心執行控制，Linux 只負責設定與監控，透過共享記憶體與訊息通訊。",
      },
    ],
    customerQs: [
      {
        q: "Should we use an RTOS or stay bare-metal?",
        zh: "我們應該用 RTOS 還是維持裸機？",
        answer: "取決於並行任務數量、即時需求與團隊經驗。若功能持續增加、需要清楚的優先權與時序保證、或要整合網路/USB 等中介軟體，RTOS 通常更好維護；若系統很小且單純，裸機的可預測性與低成本仍是優勢。",
      },
      {
        q: "Does your toolchain support Linux application development?",
        zh: "你們的工具鏈支援 Linux 應用開發嗎？",
        answer: "要依產品而定，請以官方產品資訊為準；一般而言 Linux 應用多使用 GCC/Clang。在混合架構產品中，我們可以聚焦於 MCU/即時核心部分的開發與除錯。（誠實界定範圍。）",
      },
      {
        q: "Can we use the chip vendor's HAL with your compiler?",
        zh: "晶片廠的 HAL 能用你們的編譯器嗎？",
        answer: "多數主流晶片廠的 SDK/HAL 與 CMSIS 套件都提供 IAR 專案或支援（例如 IAR 版的 startup 檔）；具體以晶片廠 SDK 說明為準。若某元件只提供 GCC 版本，我們可以協助移植或與晶片廠協調。",
      },
    ],
    interviewQs: [
      {
        q: "How do you decide between bare-metal, RTOS and Linux?",
        zh: "如何在裸機、RTOS、Linux 之間做選擇？",
        points: ["即時需求", "功能與生態", "資源與成本", "安全認證", "團隊能力"],
      },
      {
        q: "What's the difference between a BSP and a HAL?",
        zh: "BSP 與 HAL 的差別？",
        points: ["HAL：晶片周邊抽象", "BSP：板級設定", "CMSIS 的位置", "Linux 中的 BSP 含義"],
      },
      {
        q: "Your background is R&D management. How does that help in an FAE role?",
        zh: "你的背景是研發管理，這對 FAE 有什麼幫助？",
        points: ["理解客戶系統全貌", "懂開發團隊的痛點", "跨團隊協作與溝通", "誠實補充需學習的部分"],
      },
    ],
    quiz: [
      { id: "t4p-q1", skill: "rtos", q: "描述「特定電路板的腳位、時脈、外部元件設定」的是？", options: ["HAL", "BSP", "CMSIS-DSP", "RTOS kernel"], answer: 1, explain: "Board Support Package。" },
      { id: "t4p-q2", skill: "rtos", q: "CMSIS-Pack 的用途？", options: ["RTOS 核心", "封裝裝置支援與軟體元件，供 IDE 使用", "DSP 函式庫", "除錯協定"], answer: 1, explain: "IDE 透過 Pack 取得晶片資訊、startup 與範例。" },
      { id: "t4p-q3", skill: "rtos", q: "下列哪種需求最適合 Embedded Linux？", options: ["10 µs 控制迴圈", "需要完整網路堆疊、檔案系統與 GUI，資源充足", "鈕扣電池 10 年壽命", "2 KB RAM"], answer: 1, explain: "Linux 擅長豐富功能，不擅長硬即時。" },
      { id: "t4p-q4", skill: "rtos", q: "Superloop 架構最大的擴充瓶頸？", options: ["無法使用中斷", "功能增加後回應時間難以預測", "不能用 C", "需要 MMU"], answer: 1, explain: "所有工作共用一個迴圈。" },
      { id: "t4p-q5", skill: "rtos", q: "CMSIS-Core 主要提供？", options: ["USB 堆疊", "核心暫存器存取、intrinsic、startup/SystemInit 標準", "檔案系統", "GUI"], answer: 1, explain: "最底層的核心抽象。" },
    ],
    reading: [
      { title: "CMSIS 6 documentation", url: "https://arm-software.github.io/CMSIS_6/", note: "CMSIS 各元件總覽" },
      { title: "Zephyr Project documentation", url: "https://docs.zephyrproject.org/", note: "成長中的開源 RTOS，與 Linux 生態相近" },
      { title: "Open-CMSIS-Pack", url: "https://www.open-cmsis-pack.org/", note: "Pack 規格與工具" },
    ],
  },

  // ───────────────────────────────────────────── t4-cicd
  {
    id: "t4-cicd",
    objectives: [
      "設計嵌入式韌體的 CI pipeline：建置、靜態分析、單元測試、產物保存、硬體測試",
      "用 CMake toolchain file 支援多種編譯器（GCC / IAR）",
      "理解商業工具在 CI 中的考量：命令列建置、容器化、授權",
      "能回答客戶關於「把 IAR 放進 CI」的導入問題（並標示需查證的細節）",
    ],
    concept: `
JD 明確提到「understand the customer's ... tool chains, CI/CD setups, and compliance needs」與「Knowledge of CI/CD for building/testing embedded software is advantageous」。

#### 嵌入式 CI 的典型階段
1. **Build**：每個 commit 以固定版本的 toolchain 建置所有設定（Debug/Release、多個板子）。
2. **Static analysis**：編譯器警告視為錯誤、MISRA/CERT 規則檢查、複雜度。
3. **Unit test（host）**：用 GCC/Clang 在 x86 上跑單元測試（Unity、CppUTest、GoogleTest），硬體相依部分以 mock 取代；可加 sanitizer 與 coverage。
4. **Unit/integration test（target 或 simulator）**：在模擬器或實機上執行；收集結果（semihosting、UART、或 debugger 命令列）。
5. **Artifacts**：保存 .elf（含除錯資訊）、.hex/.bin、.map、size 報告；追蹤 code size 趨勢。
6. **HIL（Hardware-in-the-loop）**：自動燒錄、執行測試、收集結果。
7. **Release**：簽章、版本標記、合規文件。

#### CMake 與多工具鏈
CMake 原生支援 GCC、Clang 與 IAR 編譯器（以 toolchain file 指定）。同一份 CMakeLists.txt 可以在 CI 中同時以 GCC（快速 host 測試）與 IAR（產品建置）編譯，也能及早發現可攜性問題。

#### IAR 在 CI 中（概念，細節待查證）
- **命令列建置 IDE 專案**：IAR Embedded Workbench 提供命令列建置工具（常見為 \`iarbuild\`），可建置 .ewp 專案的指定設定。
- **Linux / 容器建置**：IAR 提供可在 Linux 上執行的建置工具產品（以 Build Tools 名稱推出），適合 Docker 化的 CI agent。
- **靜態分析**：C-STAT 可在命令列執行並輸出報告。
- **授權**：CI agent 需要可取得授權的方式（網路授權伺服器或適用 CI 的授權方案）—— 這是客戶導入時最常問的問題，**請依官方最新授權模式回答**。
`,
    terms: [
      { en: "CI/CD", zh: "持續整合 / 持續交付", note: "Continuous Integration / Delivery" },
      { en: "Pipeline", zh: "流水線", note: "自動化的階段序列" },
      { en: "Toolchain File (CMake)", zh: "工具鏈檔案", note: "CMAKE_TOOLCHAIN_FILE" },
      { en: "Build Artifact", zh: "建置產物", note: "elf/hex/map/報告" },
      { en: "HIL (Hardware-in-the-loop)", zh: "硬體迴路測試", note: "實機自動測試" },
      { en: "Reproducible Build", zh: "可重現建置", note: "同輸入產生同輸出" },
      { en: "Containerization", zh: "容器化", note: "Docker 固定建置環境" },
      { en: "Floating / Network License", zh: "浮動 / 網路授權", note: "多人或 CI 共用授權" },
    ],
    diagram: {
      title: "嵌入式韌體 CI pipeline",
      mermaid: `flowchart LR
  C["git push / PR"] --> B["Build<br/>GCC + IAR<br/>(container)"]
  B --> SA["Static analysis<br/>warnings / MISRA"]
  B --> UT["Host unit tests<br/>+ coverage"]
  SA --> G{"Quality gate"}
  UT --> G
  G -->|"pass"| SIM["Target / simulator tests"]
  SIM --> HIL["HIL on real board"]
  HIL --> ART["Artifacts<br/>elf / hex / map / size trend"]
  ART --> REL["Release + compliance evidence"]
  LIC[("License server")] -.-> B
  LIC -.-> SA`,
    },
    code: [
      {
        title: "CMake toolchain file：GCC 與 IAR",
        lang: "cmake",
        code: `# toolchain-arm-gcc.cmake
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER   arm-none-eabi-gcc)
set(CMAKE_ASM_COMPILER arm-none-eabi-gcc)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
set(CMAKE_C_FLAGS_INIT "-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard")

# toolchain-iar-arm.cmake  （路徑與選項依安裝版本調整；選項請以 IAR 文件為準）
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER   "/opt/iar/arm/bin/iccarm")
set(CMAKE_ASM_COMPILER "/opt/iar/arm/bin/iasmarm")
set(CMAKE_C_FLAGS_INIT "--cpu Cortex-M4 --fpu VFPv4_sp")

# 使用：
# cmake -B build-gcc -DCMAKE_TOOLCHAIN_FILE=toolchain-arm-gcc.cmake
# cmake -B build-iar -DCMAKE_TOOLCHAIN_FILE=toolchain-iar-arm.cmake`,
      },
      {
        title: "GitHub Actions 範例：容器建置 + size 報告",
        lang: "yaml",
        code: `name: firmware-ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    container: ghcr.io/acme/fw-toolchain:arm-gcc-13.2   # 鎖定 toolchain 版本
    steps:
      - uses: actions/checkout@v4
      - run: cmake -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE=cmake/toolchain-arm-gcc.cmake -DCMAKE_BUILD_TYPE=Release
      - run: cmake --build build
      - run: arm-none-eabi-size build/app.elf | tee size.txt
      - uses: actions/upload-artifact@v4
        with:
          name: firmware
          path: |
            build/app.elf
            build/app.map
            size.txt
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cmake -B build-host -DUNIT_TEST=ON && cmake --build build-host && ctest --test-dir build-host --output-on-failure`,
      },
      {
        title: "命令列建置 IAR IDE 專案（示意）",
        lang: "bash",
        code: `# Windows CI agent，建置 .ewp 專案的 Release 設定（工具名稱/參數以 IAR 文件為準）
iarbuild.exe MyProject.ewp -build Release -log info

# 產生 hex（ielftool 為 IAR ELF 工具，參數以文件為準）
ielftool --ihex MyProject.out MyProject.hex`,
      },
    ],
    analysis: `
#### 為什麼客戶在意 CI 整合？
- 規模化團隊需要可重現、可追溯的建置；功能安全標準要求工具與流程有證據。
- 評估商業工具時，「能否放進我們既有的 CI（Jenkins/GitLab/GitHub Actions、Docker）」常是**決定性問題**。
- FAE 若能直接示範「在 Linux 容器中建置 + 靜態分析 + 輸出報告」，比任何簡報都有說服力。

#### Discovery 時要問的 CI 問題
- 使用哪個 CI 系統？agent 是 Windows 還是 Linux？是否容器化？
- 建置頻率與並行數量？（影響授權需求數量）
- 需要哪些報告？（MISRA、coverage、size）
- 是否有離線/隔離網路環境？（影響授權方式）
- 是否需要工具認證證據？

#### 你的優勢
你熟悉 Make/CMake/GCC 與 Linux 環境，又管理過團隊流程 —— 能從「團隊生產力」的角度談 CI，而不只是技術細節。
`,
    cases: [
      {
        title: "雙編譯器 CI 及早發現可攜性問題",
        body: "團隊在 CI 中同時以 GCC（host 單元測試）與商業編譯器（產品建置）編譯。某次 commit 使用了 GCC 專屬的 __builtin 函式，IAR 建置立刻失敗，在合併前就被攔截。比起 release 前才發現，成本低得多。",
      },
      {
        title: "CI 授權用盡導致建置排隊",
        body: "客戶導入後發現 nightly build 與 PR build 同時執行時授權不足。FAE 協助分析建置並行數，建議調整授權數量或排程，並說明官方提供的 CI 授權選項（以當時方案為準）。這也是 FAE 參與 upsell 的典型時刻。",
      },
    ],
    customerQs: [
      {
        q: "Can we run your compiler in Docker on Linux for our CI?",
        zh: "可以在 Linux Docker 中執行你們的編譯器做 CI 嗎？",
        answer: "IAR 有提供可在 Linux 執行的建置工具產品，適合容器化 CI；具體支援的架構、發行版與授權設定請以最新官方資訊為準，我可以安排技術說明或試用來驗證你們的 pipeline。",
      },
      {
        q: "How does licensing work for CI agents?",
        zh: "CI agent 的授權怎麼運作？",
        answer: "需要依你們的 agent 數量、並行建置數、是否離線來規劃。官方有網路授權與針對自動化的方案（以最新授權模式為準）。我會先了解你們的 CI 拓撲，再和業務一起提出合適的配置。",
      },
      {
        q: "Can we keep using CMake instead of your IDE project files?",
        zh: "可以繼續用 CMake，而不是你們的 IDE 專案檔嗎？",
        answer: "可以。CMake 原生支援 IAR 編譯器，透過 toolchain file 設定即可；IDE 仍可用於除錯。需要注意的是 linker 設定檔（ICF）與部分編譯選項要在 CMake 中正確傳遞。",
      },
    ],
    interviewQs: [
      {
        q: "How would you set up CI for an embedded firmware project?",
        zh: "你會如何為嵌入式韌體專案建立 CI？",
        points: ["固定 toolchain（容器）", "build + 靜態分析 + host 測試", "產物與 size 追蹤", "HIL", "授權/合規"],
      },
      {
        q: "A customer asks whether our tools fit their CI. What do you ask them?",
        zh: "客戶問我們的工具是否適合他們的 CI，你會問什麼？",
        points: ["CI 系統與 OS", "容器化", "並行與授權", "報告需求", "安全/離線"],
      },
      {
        q: "What build systems have you used?",
        zh: "你用過哪些建置系統？",
        points: ["Make/CMake/GCC 實務", "Xilinx/Vitis 工具", "Windows (MSBuild/Visual Studio)", "你帶團隊建立的流程"],
      },
    ],
    quiz: [
      { id: "t4ci-q1", skill: "cicd", q: "CMake 中指定交叉編譯器的標準方式？", options: ["project(LANGUAGES)", "CMAKE_TOOLCHAIN_FILE", "add_executable", "include_directories"], answer: 1, explain: "Toolchain file 設定系統名稱與編譯器。" },
      { id: "t4ci-q2", skill: "cicd", q: "嵌入式 CI 中保存 .map 檔的主要好處？", options: ["加速建置", "追蹤 code size 與記憶體配置變化", "減少授權", "取代測試"], answer: 1, explain: "可比較每次 commit 的大小變化。" },
      { id: "t4ci-q3", skill: "cicd", q: "Host 單元測試的主要優勢？", options: ["測試真實時序", "快速、可在 CI 大量執行，並可用 sanitizer", "不需要編譯器", "取代 HIL"], answer: 1, explain: "硬體相依部分以 mock 取代。" },
      { id: "t4ci-q4", skill: "cicd", q: "固定 toolchain 版本最常見的做法？", options: ["每台機器各自安裝最新版", "容器映像", "只用 IDE", "不需要"], answer: 1, explain: "保證可重現建置。" },
      { id: "t4ci-q5", skill: "fae", q: "客戶評估商業編譯器時常見的 CI 決定性問題？", options: ["IDE 顏色", "能否命令列/容器化建置與授權方式", "logo", "安裝檔大小"], answer: 1, explain: "能否融入既有自動化流程。" },
      { id: "t4ci-q6", skill: "cicd", q: "HIL 測試指的是？", options: ["Host 測試", "在實際硬體上自動化測試", "靜態分析", "程式碼審查"], answer: 1, explain: "Hardware-in-the-loop。" },
    ],
    reading: [
      { title: "CMake — cmake-toolchains(7)", url: "https://cmake.org/cmake/help/latest/manual/cmake-toolchains.7.html", note: "Cross compiling 與 toolchain file" },
      { title: "IAR — Build tools for CI/CD（產品頁）", url: "https://www.iar.com/", note: "查詢 Linux 建置工具、命令列建置與授權方式的最新資訊" },
      { title: "Unity / CMock (ThrowTheSwitch)", url: "https://www.throwtheswitch.org/", note: "C 語言嵌入式單元測試框架" },
    ],
    toVerify: ["IAR Linux 建置工具的正式產品名稱與支援範圍", "iarbuild / ielftool 參數", "CI 授權方案（依最新官方授權模式）", "CMake 中 IAR 的建議 flags"],
  },
];
