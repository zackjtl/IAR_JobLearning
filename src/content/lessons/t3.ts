import type { LessonContent } from "../types";

export const T3: LessonContent[] = [
  // ───────────────────────────────────────────── t3-gdb
  {
    id: "t3-gdb",
    objectives: [
      "說明嵌入式除錯的架構：debugger ↔ GDB server / probe ↔ SWD/JTAG ↔ CPU 的除錯邏輯",
      "熟悉 GDB 常用指令：載入、執行控制、中斷點、檢視記憶體/暫存器、backtrace",
      "區分 software breakpoint 與 hardware breakpoint，知道硬體資源的數量限制",
      "使用 data watchpoint 找出「誰改了這個變數」",
    ],
    concept: `
#### 嵌入式除錯的組成
- **Debugger 前端**：GDB、IAR C-SPY、IDE 的除錯介面。
- **Debug probe**：J-Link、ST-LINK、CMSIS-DAP、IAR I-jet 等，透過 **SWD**（2 線）或 **JTAG** 連接晶片。
- **晶片內的除錯邏輯（CoreSight）**：Cortex-M 有 **FPB**（Flash Patch and Breakpoint，硬體中斷點）、**DWT**（Data Watchpoint and Trace，watchpoint 與 cycle counter）、**ITM**（instrumentation trace，printf-style 輸出）、選配 **ETM**（指令追蹤）。
- GDB 透過 **GDB server**（OpenOCD、J-Link GDB Server、pyOCD）以 remote serial protocol 控制目標。C-SPY 則直接透過其 driver 與 probe 溝通。

#### 中斷點
- **Software breakpoint**：把指令替換為 \`BKPT\`。只能用在可寫的記憶體（RAM）。數量不限。
- **Hardware breakpoint**：CPU 比較器比對 PC，**可用於 Flash**，但數量有限（Cortex-M3/M4 的 FPB 通常 6 個指令比較器；Cortex-M0/M0+ 最多 4 個；依實作而定）。
- 在 Flash 程式中設太多中斷點時，部分 debugger 會改用「Flash patch / 重燒」或直接報錯 —— 客戶常遇到「中斷點設不上去」就是這個原因。

#### Watchpoint
- 由 DWT 比較器實作，在**讀/寫特定位址**時停下。Cortex-M3/M4 常見 4 個比較器，M0/M0+ 較少。
- GDB：\`watch\`（寫）、\`rwatch\`（讀）、\`awatch\`（讀或寫）。
- 硬體 watchpoint 停下時，PC 通常已經是**寫入指令的下一條**。

#### 其他常用功能
- **Semihosting**：目標透過 debugger 使用主機的 I/O（printf 到 debugger console）。方便但慢，且**沒接 debugger 時執行到 semihosting 指令會 HardFault**。
- **ITM/SWO**：低侵入式 trace 輸出，速度快很多。
- **DWT CYCCNT**：cycle counter，用來量測程式片段的執行時間。
`,
    terms: [
      { en: "Debug Probe", zh: "除錯器硬體", note: "J-Link、ST-LINK、I-jet、CMSIS-DAP" },
      { en: "SWD / JTAG", zh: "序列線除錯 / JTAG", note: "除錯實體介面" },
      { en: "Hardware Breakpoint", zh: "硬體中斷點", note: "由 FPB 比較 PC，可用於 Flash" },
      { en: "Watchpoint", zh: "資料監看點", note: "由 DWT 監看位址存取" },
      { en: "GDB Server", zh: "GDB 伺服器", note: "OpenOCD、J-Link GDB Server" },
      { en: "Backtrace / Call Stack", zh: "呼叫堆疊", note: "目前函式的呼叫鏈" },
      { en: "Semihosting", zh: "半主機", note: "透過 debugger 使用主機 I/O" },
      { en: "SWO / ITM", zh: "序列線輸出 / 儀器追蹤", note: "低侵入式 trace" },
    ],
    diagram: {
      title: "嵌入式除錯鏈",
      mermaid: `flowchart LR
  subgraph PC["Host PC"]
    IDE["IDE / GDB / C-SPY"]
    GS["GDB server<br/>OpenOCD / J-Link"]
  end
  IDE <-->|"remote protocol"| GS
  GS <-->|"USB"| P["Debug probe"]
  IDE -. "C-SPY driver" .-> P
  P <-->|"SWD / JTAG"| DAP["Debug Access Port"]
  subgraph MCU["Cortex-M MCU"]
    DAP --> FPB["FPB<br/>HW breakpoints"]
    DAP --> DWT["DWT<br/>watchpoints, CYCCNT"]
    DAP --> ITM["ITM → SWO"]
    DAP --> MEM["Memory / Registers"]
  end`,
    },
    code: [
      {
        title: "GDB + OpenOCD 典型流程",
        lang: "bash",
        code: `# 終端 1：啟動 GDB server（以 STM32F4 + ST-LINK 為例）
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# 終端 2：GDB
arm-none-eabi-gdb build/app.elf
(gdb) target extended-remote :3333
(gdb) monitor reset halt
(gdb) load                      # 燒錄
(gdb) break main
(gdb) hbreak HardFault_Handler  # 明確使用硬體中斷點
(gdb) continue
(gdb) watch g_motor_state       # 寫入時停下
(gdb) bt                        # backtrace
(gdb) info registers
(gdb) x/16wx $sp                # 檢視 stack 的 16 個字
(gdb) p/x *(uint32_t*)0xE000ED28   # 讀 CFSR
(gdb) finish                    # 執行到目前函式返回
(gdb) disassemble /s            # 反組譯並顯示原始碼`,
      },
      {
        title: "用 DWT CYCCNT 量測執行時間（Cortex-M3/M4/M7）",
        lang: "c",
        code: `CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;  /* 啟用 trace */
DWT->CYCCNT = 0;
DWT->CTRL  |= DWT_CTRL_CYCCNTENA_Msk;

uint32_t t0 = DWT->CYCCNT;
fir_filter(in, out, 256);
uint32_t cycles = DWT->CYCCNT - t0;   /* unsigned 減法可處理回繞 */`,
        note: "Cortex-M0/M0+ 沒有 CYCCNT；部分晶片需先解鎖 DWT（例如 Cortex-M7 的 LAR）。",
      },
    ],
    analysis: `
#### 「除錯會改變行為」的情況
- **時序**：停在中斷點時周邊仍在運作（timer、UART 溢位、watchdog 重置）。很多晶片可設定「除錯暫停時凍結 watchdog/timer」（例如 STM32 的 DBGMCU 設定）。
- **Semihosting**：沒接 debugger 時當機。
- **讀取有副作用的暫存器**：debugger 的記憶體視窗讀了「讀取即清除」的狀態暫存器，導致程式看不到旗標。
- **最佳化**：變數看不到、單步亂跳（下一課）。

#### FAE 支援時的提問清單
- 用什麼 probe？韌體版本？SWD 速度？
- 是 Flash 還是 RAM 中的程式？設了幾個中斷點？
- 連線失敗時：目標供電、reset 腳、是否進入低功耗模式（睡眠中 SWD 可能失效）、是否被讀保護鎖住？
`,
    cases: [
      {
        title: "變數被神秘改寫",
        body: "全域狀態偶爾變成非法值。在該變數位址設 write watchpoint，數小時後停在一個 DMA 完成 ISR 中的 memcpy —— 長度計算錯誤導致越界。沒有 watchpoint 時，團隊花了兩週用 printf 猜。",
      },
      {
        title: "debugger 一連上，晶片就進不了 main",
        body: "韌體在初始化早期就把 SWD 腳位設定成 GPIO，或進入 deep sleep。解法：用 connect-under-reset、在初始化前加延遲、或保留 SWD 腳位功能。這是 FAE 常見的「工具壞了？」案例，實際是韌體設定。",
      },
    ],
    customerQs: [
      {
        q: "I can't set more breakpoints. The debugger says no hardware resources available.",
        zh: "無法再設中斷點，debugger 說沒有可用的硬體資源。",
        answer: "在 Flash 中執行的程式只能使用硬體中斷點，而晶片的比較器數量有限（例如 Cortex-M4 常見 6 個）。請刪除不用的中斷點；注意 step over、run to cursor 等操作也可能暫用中斷點資源。若必要，可把要除錯的函式暫時放到 RAM 執行。",
      },
      {
        q: "The program works with the debugger attached but fails standalone.",
        zh: "接著 debugger 時正常，拔掉就不正常。",
        answer: "常見原因：semihosting 呼叫、debugger 預先初始化了某些暫存器/時脈、watchdog 在除錯時被凍結、時序差異。請檢查是否有 semihosting 或除錯專用的初始化，並從 reset 開始不接 debugger 跑，用 LED/UART 定位。",
      },
      {
        q: "How do I find who overwrites my variable?",
        zh: "怎麼找出是誰覆寫了我的變數？",
        answer: "對該位址設 data watchpoint（write），程式停下時看 call stack。若是 DMA 寫入，watchpoint 不會觸發（不是 CPU 存取），這本身也是線索。",
      },
    ],
    interviewQs: [
      {
        q: "What's the difference between a hardware and a software breakpoint?",
        zh: "硬體與軟體中斷點的差別？",
        points: ["BKPT 指令替換 vs PC 比較器", "Flash vs RAM", "數量限制", "實務影響"],
      },
      {
        q: "Describe your debugging workflow for a hard-to-reproduce bug.",
        zh: "描述你處理難以重現 bug 的流程。",
        points: ["收集證據（log、trace、core dump）", "縮小範圍", "watchpoint / trace", "用你 SSD/FPGA 專案的真實例子"],
      },
      {
        q: "How do you measure the execution time of a function on an MCU?",
        zh: "如何量測 MCU 上函式的執行時間？",
        points: ["DWT CYCCNT", "GPIO toggle + 示波器", "timer", "trace 工具"],
      },
    ],
    quiz: [
      { id: "t3g-q1", skill: "debug", q: "在 Flash 程式碼上設中斷點，使用的是？", options: ["BKPT 指令替換", "FPB 硬體比較器", "MPU", "Watchdog"], answer: 1, explain: "Flash 不能隨意改寫，因此使用硬體中斷點。" },
      { id: "t3g-q2", skill: "debug", q: "GDB 中「寫入某變數時停下」的指令？", options: ["break", "watch", "display", "finish"], answer: 1, explain: "watch=寫、rwatch=讀、awatch=讀或寫。" },
      { id: "t3g-q3", skill: "debug", q: "沒有接 debugger 時程式在 printf 處 HardFault，最可能原因？", options: ["printf 太慢", "使用了 semihosting", "Stack 太大", "Flash 損壞"], answer: 1, explain: "Semihosting 的 BKPT 在沒有 debugger 時會造成 fault。" },
      { id: "t3g-q4", skill: "debug", q: "DWT CYCCNT 的用途？", options: ["計算中斷次數", "計算 CPU cycle 以量測執行時間", "看門狗", "計算 Flash 寫入次數"], answer: 1, explain: "Cortex-M3 以上提供。" },
      { id: "t3g-q5", skill: "debug", q: "Watchpoint 沒有在 DMA 寫入變數時觸發，原因？", options: ["watchpoint 壞了", "DWT 監看的是 CPU 的存取，DMA 不經過", "DMA 太快", "需要 -O0"], answer: 1, explain: "這也是判斷「是不是 DMA 寫壞的」線索。" },
      { id: "t3g-q6", skill: "debug", q: "SWD 需要幾條訊號線（不含電源/地）？", options: ["1", "2（SWDIO、SWCLK）", "4", "5"], answer: 1, explain: "JTAG 通常需要 4–5 條。" },
    ],
    reading: [
      { title: "Debugging with GDB (official manual)", url: "https://sourceware.org/gdb/current/onlinedocs/gdb/", note: "中斷點、watchpoint、remote debugging" },
      { title: "OpenOCD User's Guide", url: "https://openocd.org/doc/html/index.html", note: "GDB server 與各種 probe 設定" },
      { title: "Arm CoreSight / ARMv7-M Architecture Reference Manual — Debug", note: "FPB、DWT、ITM 的正式定義；在 Arm Developer 網站搜尋" },
    ],
  },

  // ───────────────────────────────────────────── t3-symbols
  {
    id: "t3-symbols",
    objectives: [
      "說明 debug symbols 與 DWARF 的角色：行號表、型別資訊、變數位置、call frame 資訊",
      "理解 location list 與 \"<optimized out>\" 的由來",
      "掌握除錯最佳化後程式的策略",
      "知道 Debug/Release build 的正確設定：除錯資訊不影響產生的機器碼",
    ],
    concept: `
#### Debug symbols 是什麼？
編譯時加上 \`-g\`（GCC）或在 IAR 專案中啟用 debug information，編譯器會在 object file 中輸出 **DWARF** 資訊。它**不會改變機器碼**，只是附加的描述資料，讓 debugger 能：
- 把位址對應到原始碼行（**line table**：\`.debug_line\`）
- 知道變數的型別、作用範圍與**存放位置**（\`.debug_info\` 的 DIE 樹）
- 在任何位置還原呼叫鏈（**Call Frame Information**：\`.debug_frame\`）

> 常見誤解：「Release 版不能有 -g，因為會變大/變慢」—— DWARF 不會燒進晶片。只要燒錄的是 .bin/.hex 或只載入 LOAD segment，加 -g 不影響執行。保留帶除錯資訊的 ELF 對事後分析非常有價值。

#### DWARF 的關鍵結構
- **DIE（Debugging Information Entry）**：樹狀結構，描述 compile unit、函式、變數、型別。
- **DW_AT_location**：變數位置。可能是固定位址、相對 frame base 的偏移、某個暫存器，或 **location list**（不同 PC 範圍在不同位置）。
- **Inlined subroutine**：被 inline 的函式也有描述，debugger 才能顯示「目前在 inline 進來的 foo() 裡」。

#### 為什麼會出現 <optimized out>？
最佳化後，變數可能：
- 只在某些 PC 範圍存在於暫存器中；在目前 PC 它的值已經不需要了（暫存器被重用）
- 被常數取代、與其他變數合併、或完全被消除
DWARF 的 location list 在該 PC 沒有描述 → debugger 只能顯示 <optimized out>。這**不是 bug**。

#### 單步執行為什麼「亂跳」？
指令排程與程式碼合併讓同一行的指令散落各處，line table 中同一行可能對應多個不連續的位址範圍。
`,
    terms: [
      { en: "Debug Information", zh: "除錯資訊", note: "-g 產生，不影響機器碼" },
      { en: "DWARF", zh: "DWARF 除錯格式", note: "ELF 常用的除錯資訊標準" },
      { en: "DIE", zh: "除錯資訊項", note: "Debugging Information Entry" },
      { en: "Line Table", zh: "行號表", note: "位址 ↔ 原始碼行" },
      { en: "Location List", zh: "位置清單", note: "變數在不同 PC 範圍的位置" },
      { en: "Call Frame Information (CFI)", zh: "呼叫框架資訊", note: "用於 stack unwinding" },
      { en: "Stripped Binary", zh: "去除符號的執行檔", note: "移除符號與除錯資訊" },
      { en: "Optimized Code Debugging", zh: "最佳化程式除錯", note: "需要閱讀反組譯的能力" },
    ],
    diagram: {
      title: "Debugger 如何用 DWARF 顯示變數",
      mermaid: `flowchart TD
  PC["目前 PC = 0x0800_1A3C"] --> LT[".debug_line<br/>→ motor.c:142"]
  PC --> INFO[".debug_info<br/>找到所在函式 pid_update 的 DIE"]
  INFO --> VAR["變數 err 的 DW_AT_location"]
  VAR --> LL{"location list<br/>是否涵蓋此 PC?"}
  LL -->|"是：在 r4"| SHOW["讀 r4 → 顯示 err = 37"]
  LL -->|"否"| OPT["顯示 &lt;optimized out&gt;"]
  PC --> CFI[".debug_frame<br/>還原呼叫者 → Call Stack"]`,
    },
    code: [
      {
        title: "檢視 DWARF（GNU 工具）",
        lang: "bash",
        code: `arm-none-eabi-gcc -c -g -O2 pid.c -o pid.o
arm-none-eabi-readelf --debug-dump=info pid.o | less     # DIE 樹
arm-none-eabi-objdump --dwarf=decodedline pid.o          # 行號表
arm-none-eabi-readelf --debug-dump=loc pid.o             # location lists (DWARF4)
arm-none-eabi-objdump -d -S pid.o                        # 反組譯 + 原始碼交錯`,
      },
      {
        title: "最佳化除錯的實用技巧",
        lang: "c",
        code: `/* 1) 只對正在除錯的檔案/函式降低最佳化 */
#if defined(__GNUC__) && !defined(__clang__)
__attribute__((optimize("O0")))       /* GCC：僅用於暫時除錯 */
#endif
void pid_update(pid_t *p, float meas) { /* ... */ }

/* IAR：#pragma optimize=none 放在函式前（語法以手冊為準） */

/* 2) 暫時讓關鍵中間值可見 */
volatile float dbg_err;               /* 除錯完要移除 */
void pid_update2(pid_t *p, float meas)
{
    float err = p->target - meas;
    dbg_err = err;                    /* 強制寫入記憶體，debugger 一定看得到 */
    /* ... */
}`,
      },
    ],
    analysis: `
#### 除錯最佳化程式的策略
1. **先看反組譯與暫存器**：AAPCS 告訴你參數在 r0–r3、回傳值在 r0（下一課）。
2. **保留 -g，但調整範圍**：只對問題檔案降低最佳化，避免整體行為改變到讓 bug 消失。
3. **GCC 的 -Og**：在不犧牲太多除錯體驗下做基本最佳化。
4. **不要依賴 Debug build 驗證時序**：量產設定必須在開發早期就測試。

#### Debug vs Release 的正確觀念
- 最佳化等級與「是否產生除錯資訊」是兩個獨立的開關。
- 量產 ELF 應保留除錯資訊並封存，搭配版本號；現場回報的 crash 位址可以用 \`addr2line\` 或 debugger 對回原始碼。

#### 為什麼 FAE 會遇到這類問題
「Debugger 顯示錯的值」「變數看不到」「單步亂跳」是最常見的支援工單之一。能快速解釋成因並給出可行策略，是 IAR 技術支援的基本功；若確實是除錯資訊有誤（例如 location 描述錯誤），才需要升級給產品團隊。
`,
    cases: [
      {
        title: "現場 crash 只有一個位址",
        body: "產品在客戶端 HardFault，fault handler 把 stacked PC = 0x08012A4C 寫入 Flash log。工程師用封存的同版本 ELF 執行 addr2line -e app.elf -f 0x08012A4C，立刻知道是 parser.c 第 233 行。若當初只保留 .bin，這個資訊就丟了。",
      },
      {
        title: "Debugger 顯示的區域變數值是錯的",
        body: "最佳化後該變數的暫存器已被重用，但 location list 描述範圍過寬（工具鏈的除錯資訊品質問題）。比對反組譯確認後，以最小範例回報給工具鏈廠商。這是「真正的工具問題」的一個例子 —— 需要證據而不是猜測。",
      },
    ],
    customerQs: [
      {
        q: "The debugger shows wrong values for local variables. Is the debugger broken?",
        zh: "Debugger 顯示的區域變數值不對，debugger 壞了嗎？",
        answer: "最佳化後變數可能只在部分範圍存在暫存器中。請先確認該檔的最佳化等級；可以看反組譯與暫存器視窗交叉確認。如果在最低最佳化下仍然錯誤，或能證明除錯資訊描述與實際不符，請提供最小範例，我們會深入分析。",
      },
      {
        q: "Does enabling debug information make our release firmware bigger or slower?",
        zh: "啟用除錯資訊會讓量產韌體變大或變慢嗎？",
        answer: "不會影響燒錄到晶片的程式碼與資料；除錯資訊只存在 ELF 檔中。建議量產版保留除錯資訊的 ELF 並封存，以便日後分析現場問題。",
      },
      {
        q: "Single stepping jumps back and forth in the source. Why?",
        zh: "單步執行時在原始碼中跳來跳去，為什麼？",
        answer: "最佳化會重排與合併指令，同一行的指令可能分散。可改為以指令單步（反組譯模式），或暫時降低該檔最佳化。",
      },
    ],
    interviewQs: [
      {
        q: "What is DWARF and what does a debugger use it for?",
        zh: "什麼是 DWARF？debugger 用它做什麼？",
        points: ["行號表", "型別與變數位置", "CFI 與 call stack", "不影響機器碼"],
      },
      {
        q: "How do you debug code that only fails in an optimized build?",
        zh: "如何除錯只在最佳化版本出錯的程式？",
        points: ["保留 -g", "反組譯與暫存器", "逐檔調整最佳化", "懷疑 UB/volatile/時序"],
      },
      {
        q: "Should release builds include debug symbols?",
        zh: "Release build 應該包含除錯符號嗎？",
        points: ["燒錄內容不受影響", "封存 ELF", "addr2line 分析現場問題", "安全考量：不要把含符號的檔案給外部"],
      },
    ],
    quiz: [
      { id: "t3s-q1", skill: "debug", q: "加上 -g 對燒錄到晶片的機器碼有什麼影響？", options: ["變大", "變慢", "沒有影響（除錯資訊在 ELF 的獨立 section）", "會關閉最佳化"], answer: 2, explain: "最佳化與除錯資訊是兩個獨立開關。" },
      { id: "t3s-q2", skill: "debug", q: "位址對應原始碼行的資訊在哪個 DWARF section？", options: [".debug_line", ".debug_frame", ".symtab", ".text"], answer: 0, explain: ".debug_line 是行號表。" },
      { id: "t3s-q3", skill: "debug", q: "<optimized out> 最主要的原因？", options: ["忘了加 -g", "變數在目前 PC 沒有有效的位置描述", "Debugger bug", "Flash 不夠"], answer: 1, explain: "Location list 沒有涵蓋這個 PC 範圍。" },
      { id: "t3s-q4", skill: "debug", q: "用來還原 call stack 的 DWARF 資訊？", options: [".debug_line", "Call Frame Information (.debug_frame)", ".debug_str", ".bss"], answer: 1, explain: "CFI 描述每個 PC 處如何找到呼叫者的 frame。" },
      { id: "t3s-q5", skill: "debug", q: "現場只拿到 crash 位址，最快的定位方式？", options: ["重寫程式", "用同版本 ELF + addr2line/debugger 對回原始碼", "猜測", "換編譯器"], answer: 1, explain: "前提是封存了帶除錯資訊的 ELF。" },
    ],
    reading: [
      { title: "DWARF Debugging Standard", url: "https://dwarfstd.org/", note: "DWARF 2–5 官方規格" },
      { title: "GCC — Options for Debugging Your Program (-g, -Og)", url: "https://gcc.gnu.org/onlinedocs/gcc/Debugging-Options.html", note: "除錯相關選項" },
      { title: "Eli Bendersky — How debuggers work (Part 3: Debugging information)", url: "https://eli.thegreenplace.net/2011/02/07/how-debuggers-work-part-3-debugging-information", note: "DWARF 入門經典文章" },
    ],
  },

  // ───────────────────────────────────────────── t3-disasm
  {
    id: "t3-disasm",
    objectives: [
      "記住 AAPCS 的暫存器用途：參數、回傳值、callee-saved、SP/LR/PC",
      "讀懂常見 Thumb-2 指令：mov/ldr/str/add/cmp/b/bl/bx/push/pop",
      "理解函式 prologue/epilogue 與 stack frame，手動追 call stack",
      "知道 C 與組合語言互相呼叫時必須遵守的規則",
    ],
    concept: `
#### AAPCS（Arm Procedure Call Standard）重點（32-bit Arm）
| 暫存器 | 用途 | 誰保存 |
|---|---|---|
| r0–r3 | 前 4 個參數；r0（或 r0:r1）回傳值 | 呼叫者（caller-saved） |
| r4–r11 | 一般用途 | 被呼叫者（callee-saved） |
| r12 (IP) | 暫用 | caller-saved |
| r13 (SP) | Stack pointer | — |
| r14 (LR) | 返回位址 | — |
| r15 (PC) | 程式計數器 | — |

- 超過 4 個參數 → 放 stack。64-bit 參數用偶數起始的暫存器對。
- **公開介面上 SP 須 8-byte 對齊**。
- Hard-float ABI：浮點參數用 s0–s15（d0–d7），s16–s31 為 callee-saved。
- 結構體回傳等規則請查規格。

#### 常見 Thumb-2 指令
- \`movs r0, #1\`、\`mov r1, r0\`
- \`ldr r0, [r1, #4]\`（載入）、\`str r0, [r1]\`（儲存）、\`ldr r0, =0x40020000\`（載入常數，組譯成 literal pool）
- \`adds/subs/muls\`、\`lsls/lsrs\`、\`ands/orrs\`
- \`cmp r0, #0\` + \`beq/bne/blt/bge…\`（條件分支）
- \`bl func\`（呼叫：LR ← 返回位址）、\`bx lr\`（返回）
- \`push {r4, r5, lr}\` / \`pop {r4, r5, pc}\`（prologue/epilogue：pop 到 pc 即返回）
- \`it/ite\` 區塊：條件執行
- \`cpsid i\` / \`cpsie i\`：關/開中斷

#### 手動追 call stack
1. 看目前函式的 prologue：\`push {r4-r6, lr}\` → 知道 stack 上存了什麼、LR 在哪個位置。
2. 若有 \`sub sp, #N\`，區域變數佔 N bytes。
3. 從 SP + 偏移讀出保存的 LR → 呼叫者位址 → 重複。
debugger 用 CFI 自動做這件事；CFI 缺失或 stack 損毀時，就得手動。
`,
    terms: [
      { en: "AAPCS", zh: "Arm 程序呼叫標準", note: "Procedure Call Standard for the Arm Architecture" },
      { en: "ABI", zh: "應用二進位介面", note: "呼叫慣例、資料佈局等二進位約定" },
      { en: "Calling Convention", zh: "呼叫慣例", note: "參數與回傳值如何傳遞" },
      { en: "Callee-saved Register", zh: "被呼叫者保存暫存器", note: "r4–r11" },
      { en: "Prologue / Epilogue", zh: "函式序言 / 尾聲", note: "建立與拆除 stack frame" },
      { en: "Link Register (LR)", zh: "連結暫存器", note: "保存返回位址" },
      { en: "Literal Pool", zh: "常數池", note: "ldr r0,=const 的常數存放處" },
      { en: "Thumb-2", zh: "Thumb-2 指令集", note: "16/32-bit 混合編碼，Cortex-M 使用" },
    ],
    diagram: {
      title: "呼叫 foo(a,b,c,d,e) 時的暫存器與 stack",
      mermaid: `flowchart LR
  subgraph Caller["caller"]
    A["r0=a r1=b r2=c r3=d"]
    E["e 放在 [sp]"]
    BL["bl foo<br/>LR ← 返回位址"]
  end
  subgraph Callee["foo()"]
    P["push {r4, r5, lr}"]
    S["sub sp, #8 (區域變數)"]
    W["... 使用 r4, r5 ..."]
    R["r0 = 回傳值"]
    Q["add sp, #8<br/>pop {r4, r5, pc}"]
  end
  A --> BL --> P --> S --> W --> R --> Q
  Q -->|"返回"| Caller`,
    },
    code: [
      {
        title: "C 與對應組語（Arm GCC -O1，示意）",
        lang: "c",
        code: `int scale(int x, int k);

int process(int a, int b)
{
    int t = scale(a, 3);
    return t + b;
}`,
      },
      {
        title: "process() 的反組譯",
        lang: "asm",
        code: `process:
    push    {r4, lr}        @ 保存 r4（callee-saved）與返回位址
    mov     r4, r1          @ b 要跨越函式呼叫保留 → 放進 r4
    movs    r1, #3          @ 第 2 個參數 k = 3（第 1 個參數 a 已在 r0）
    bl      scale           @ r0 = scale(a, 3)
    add     r0, r0, r4      @ return t + b
    pop     {r4, pc}        @ 恢復 r4，並把 LR 彈到 PC → 返回`,
        note: "觀察：b 原本在 r1（caller-saved），因為 bl 會破壞它，所以編譯器先搬到 callee-saved 的 r4。",
      },
      {
        title: "C 呼叫組語函式（GNU 語法）",
        lang: "asm",
        code: `    .syntax unified
    .thumb
    .global  add3
    .type    add3, %function
@ int add3(int a, int b, int c)  → r0 = a + b + c
add3:
    adds    r0, r0, r1
    adds    r0, r0, r2
    bx      lr`,
        note: "IAR 組譯器語法不同（例如 SECTION、PUBLIC、THUMB 等指示字），移植組語檔時需要改寫指示字，但指令本身相同。",
      },
    ],
    analysis: `
#### 為什麼 FAE 需要讀組語？
- 判斷「是編譯器產生錯誤的程式碼」還是「程式本身的問題」，最終證據就在組語。
- 解釋最佳化差異（code size、效能）給客戶看。
- 客戶的手寫組語或 inline asm 在換工具鏈時要改寫，必須理解 ABI 才能保證正確。

#### 常見的 ABI 違規 bug
- 手寫組語使用了 r4–r11 卻沒有保存 → 呼叫者的變數被破壞，只在特定最佳化下出現。
- 沒有維持 8-byte stack 對齊 → 呼叫 printf 處理 double 或使用 LDRD 時出錯。
- 浮點 ABI 不一致 → 參數從錯的暫存器讀取。
- Inline asm 沒有宣告 clobber → 編譯器不知道某暫存器被改。

#### 和你的背景連結
你在 Zynq（Cortex-A53 AArch64 / Cortex-R5）上工作過，AArch64 的 AAPCS64 使用 x0–x7 傳參數、x19–x28 callee-saved —— 概念相同、細節不同。面試時能說出「概念相同、細節查規格」比死背更有說服力。
`,
    cases: [
      {
        title: "只在高最佳化下出錯的組語函式",
        body: "手寫的 memcpy 加速版本使用了 r4 卻沒有 push/pop。-O0 時呼叫者沒有把重要值放在 r4，所以沒事；-O2 時呼叫者把迴圈計數器放在 r4，結果無窮迴圈。讀呼叫者的反組譯即可證明。",
      },
      {
        title: "printf(\"%f\") 輸出亂碼",
        body: "某 RTOS task 的 stack 起始位址只有 4-byte 對齊。變參函式處理 double 時，AAPCS 要求 8-byte 對齊，導致參數讀取錯位。修正 task stack 對齊後正常。",
      },
    ],
    customerQs: [
      {
        q: "We need to call our assembly routines from C in your toolchain. What do we need to change?",
        zh: "在你們的工具鏈中，要從 C 呼叫我們的組語函式，需要改什麼？",
        answer: "指令與 AAPCS 是 Arm 標準，不需改；需要改的是組譯器指示字（section、符號匯出、對齊）與 inline asm 語法。我們可以協助逐一對照，並建議用 intrinsic（如 CMSIS 的 __REV、__CLZ）取代簡單的 inline asm 以提升可攜性。",
      },
      {
        q: "Can you explain why your compiler generated this instruction sequence?",
        zh: "能解釋你們編譯器為何產生這段指令嗎？",
        answer: "先確認編譯選項與原始碼，然後逐段對照：暫存器配置、迴圈轉換、inline。若客戶認為不是最佳，可以收集為最佳化建議回報產品團隊 —— 這也是 JD 中「feedback loop between field and product teams」的工作。",
      },
      {
        q: "The call stack in the debugger is incomplete. Why?",
        zh: "Debugger 的 call stack 不完整，為什麼？",
        answer: "可能是缺少除錯資訊（例如函式庫或組語檔沒有 CFI）、stack 已損毀、或在例外處理中跨越了 exception frame。可用 SP 手動回溯，並確認組語檔有提供 unwind 資訊。",
      },
    ],
    interviewQs: [
      {
        q: "Explain the Arm calling convention.",
        zh: "說明 Arm 的呼叫慣例。",
        points: ["r0–r3 參數、r0 回傳", "r4–r11 callee-saved", "SP 8-byte 對齊", "hard-float 用 s0–s15"],
      },
      {
        q: "How would you read a crash dump without symbols?",
        zh: "沒有符號時如何分析 crash dump？",
        points: ["從 PC/LR 開始", "對照 map file", "prologue 推回 stack", "找出呼叫鏈"],
      },
      {
        q: "When would you write assembly instead of C today?",
        zh: "現在什麼情況下會寫組語而不是 C？",
        points: ["startup / context switch", "特殊指令（優先用 intrinsic）", "極端效能熱點", "維護成本與可攜性"],
      },
    ],
    quiz: [
      { id: "t3d-q1", skill: "debug", q: "AAPCS 中，函式的第 1 個整數參數放在？", options: ["r4", "r0", "stack", "r12"], answer: 1, explain: "r0–r3 依序存放前四個參數。" },
      { id: "t3d-q2", skill: "debug", q: "下列哪些暫存器由被呼叫者負責保存？", options: ["r0–r3", "r4–r11", "r12", "全部"], answer: 1, explain: "callee-saved。" },
      { id: "t3d-q3", skill: "debug", q: "`pop {r4, pc}` 的效果？", options: ["只恢復 r4", "恢復 r4 並返回呼叫者", "觸發中斷", "清空 stack"], answer: 1, explain: "把保存的 LR 直接彈進 PC 即返回。" },
      { id: "t3d-q4", skill: "debug", q: "手寫組語使用 r5 卻沒有保存，最可能的症狀？", options: ["編譯錯誤", "呼叫者的變數在某些最佳化下被破壞", "Flash 變大", "沒有影響"], answer: 1, explain: "違反 ABI，問題依呼叫者的暫存器配置而定。" },
      { id: "t3d-q5", skill: "debug", q: "AAPCS 要求在公開介面上的 stack 對齊為？", options: ["1 byte", "4 bytes", "8 bytes", "16 bytes"], answer: 2, explain: "32-bit Arm AAPCS 要求 8-byte（AArch64 為 16-byte）。" },
      { id: "t3d-q6", skill: "debug", q: "`bl foo` 做了什麼？", options: ["跳到 foo，不保存返回位址", "跳到 foo，並把返回位址存入 LR", "比較後分支", "載入 foo 的值"], answer: 1, explain: "Branch with Link。" },
    ],
    reading: [
      { title: "Arm ABI documents (AAPCS32 / AAPCS64)", url: "https://github.com/ARM-software/abi-aa", note: "官方呼叫慣例規格" },
      { title: "Compiler Explorer", url: "https://godbolt.org", note: "練習讀 Thumb-2 組語的最佳工具" },
      { title: "Arm — Armv7-M Architecture Reference Manual", note: "Thumb-2 指令完整定義；在 Arm Developer 網站搜尋" },
    ],
  },

  // ───────────────────────────────────────────── t3-hardfault
  {
    id: "t3-hardfault",
    objectives: [
      "理解 Cortex-M 的 fault 種類（HardFault、MemManage、BusFault、UsageFault）與升級（escalation）",
      "能從 exception stack frame 取出 stacked PC/LR，並用 EXC_RETURN 判斷 MSP/PSP",
      "解讀 CFSR / HFSR / MMFAR / BFAR 的常見位元",
      "撰寫實用的 HardFault handler，並建立分析流程",
    ],
    concept: `
#### Fault 類型（Armv7-M：Cortex-M3/M4/M7）
- **MemManage**：違反 MPU 規則、執行 XN 區域。
- **BusFault**：匯流排錯誤（存取不存在的位址、周邊時脈未開）。分 precise（可知確切位址）與 imprecise（寫入緩衝後才報錯，PC 不準）。
- **UsageFault**：未定義指令、非法狀態（Thumb bit 為 0）、除以零（需啟用 DIV_0_TRP）、未對齊存取（需啟用 UNALIGN_TRP 或指令不支援）、FPU 未啟用（NOCP）。
- **HardFault**：上述 fault 未啟用或無法處理時會**升級**為 HardFault（HFSR.FORCED=1）；讀取向量表失敗（VECTTBL）。
- **Armv6-M（Cortex-M0/M0+）只有 HardFault**，也沒有 CFSR，分析更依賴 stacked PC 與程式邏輯。

#### Exception stack frame
進入例外時硬體自動壓入：**R0, R1, R2, R3, R12, LR, PC, xPSR**（使用 FPU 時還有 S0–S15、FPSCR）。
- **stacked PC**：出錯指令（precise fault）或附近指令。
- **stacked LR**：出錯函式的返回位址 → 知道呼叫者。
- handler 中的 **LR = EXC_RETURN**：例如 0xFFFFFFF9（返回 Thread mode 使用 MSP）、0xFFFFFFFD（Thread mode 使用 PSP —— RTOS task 中發生）、0xFFFFFFF1（返回 Handler mode）。**bit2 = 1 表示使用 PSP**；bit4 = 0 表示 frame 含 FPU 暫存器。

#### 關鍵暫存器（System Control Block）
- **CFSR @ 0xE000ED28**：[7:0] MMFSR、[15:8] BFSR、[31:16] UFSR。
  - MMFSR：IACCVIOL(0)、DACCVIOL(1)、MUNSTKERR(3)、MSTKERR(4)、MLSPERR(5)、**MMARVALID(7)**
  - BFSR：IBUSERR(8)、PRECISERR(9)、IMPRECISERR(10)、UNSTKERR(11)、STKERR(12)、LSPERR(13)、**BFARVALID(15)**
  - UFSR：UNDEFINSTR(16)、INVSTATE(17)、INVPC(18)、NOCP(19)、UNALIGNED(24)、DIVBYZERO(25)（Armv8-M 另有 STKOF(20)）
- **HFSR @ 0xE000ED2C**：VECTTBL(1)、FORCED(30)。
- **MMFAR @ 0xE000ED34**、**BFAR @ 0xE000ED38**：出錯的資料位址（對應 VALID 位元為 1 時才有效）。
`,
    terms: [
      { en: "HardFault", zh: "硬體錯誤例外", note: "最終的 fault 處理" },
      { en: "Fault Escalation", zh: "Fault 升級", note: "未啟用的 fault 升為 HardFault" },
      { en: "Exception Stack Frame", zh: "例外堆疊框架", note: "硬體自動保存的 8 個字" },
      { en: "EXC_RETURN", zh: "例外返回值", note: "handler 中 LR 的特殊值" },
      { en: "CFSR", zh: "可設定 Fault 狀態暫存器", note: "MMFSR+BFSR+UFSR" },
      { en: "Precise / Imprecise BusFault", zh: "精確 / 非精確匯流排錯誤", note: "imprecise 時 PC 不準確" },
      { en: "MSP / PSP", zh: "主 / 行程堆疊指標", note: "RTOS task 用 PSP" },
      { en: "Fault Handler", zh: "Fault 處理函式", note: "收集現場資訊" },
    ],
    diagram: {
      title: "HardFault 分析流程",
      mermaid: `flowchart TD
  F["進入 HardFault_Handler"] --> L{"LR (EXC_RETURN) bit2"}
  L -->|"0"| M["frame 在 MSP"]
  L -->|"1"| P["frame 在 PSP (RTOS task)"]
  M --> SF["讀 stacked PC / LR / xPSR"]
  P --> SF
  SF --> H{"HFSR"}
  H -->|"FORCED"| C["讀 CFSR"]
  H -->|"VECTTBL"| V["向量表讀取失敗"]
  C --> U{"哪個欄位?"}
  U -->|"UFSR"| U1["UNDEFINSTR / INVSTATE / NOCP / DIVBYZERO / UNALIGNED"]
  U -->|"BFSR"| B1["PRECISERR + BFAR → 位址<br/>IMPRECISERR → 關閉 write buffer 重現"]
  U -->|"MMFSR"| M1["DACCVIOL + MMFAR → MPU 違規位址"]
  U1 --> SRC["stacked PC → map/addr2line → 原始碼"]
  B1 --> SRC
  M1 --> SRC`,
    },
    code: [
      {
        title: "實用 HardFault handler（GCC 語法；IAR 需改寫 naked/inline asm）",
        lang: "c",
        code: `#include <stdint.h>

typedef struct {
    uint32_t r0, r1, r2, r3, r12, lr, pc, xpsr;
} exc_frame_t;

volatile struct {
    exc_frame_t f;
    uint32_t cfsr, hfsr, mmfar, bfar, exc_return;
} g_fault;                                  /* 可放在 .noinit 區，重開機後讀出 */

void hardfault_c(exc_frame_t *frame, uint32_t exc_return)
{
    g_fault.f          = *frame;
    g_fault.cfsr       = *(volatile uint32_t *)0xE000ED28;
    g_fault.hfsr       = *(volatile uint32_t *)0xE000ED2C;
    g_fault.mmfar      = *(volatile uint32_t *)0xE000ED34;
    g_fault.bfar       = *(volatile uint32_t *)0xE000ED38;
    g_fault.exc_return = exc_return;
    __asm volatile ("bkpt #0");             /* 有接 debugger 時停下 */
    for (;;) { }                            /* 或：記錄後 NVIC_SystemReset() */
}

__attribute__((naked)) void HardFault_Handler(void)
{
    __asm volatile (
        "tst   lr, #4        \\n"   /* EXC_RETURN bit2: 0=MSP, 1=PSP */
        "ite   eq            \\n"
        "mrseq r0, msp       \\n"
        "mrsne r0, psp       \\n"
        "mov   r1, lr        \\n"
        "b     hardfault_c   \\n"
    );
}`,
      },
      {
        title: "解讀範例",
        lang: "text",
        code: `CFSR  = 0x00008200   → BFSR: PRECISERR(bit9)=1, BFARVALID(bit15)=1
BFAR  = 0x00000004   → 存取了位址 0x4（典型：對 NULL 結構指標存取第 2 個欄位）
HFSR  = 0x40000000   → FORCED：BusFault 被升級為 HardFault（BusFault handler 未啟用）
stacked PC = 0x08001F36 → addr2line → sensor.c:88  val = s->cfg->gain;

CFSR  = 0x00020000   → UFSR: INVSTATE(bit17) → 跳到 bit0=0 的位址（函式指標錯誤 / 損毀）
CFSR  = 0x00080000   → UFSR: NOCP(bit19) → FPU 未啟用就執行浮點指令
CFSR  = 0x00000400   → BFSR: IMPRECISERR → PC 不準確，可暫時關閉 write buffer 讓它變 precise`,
        note: "Cortex-M3/M4 可透過 ACTLR.DISDEFWBUF 關閉預設寫入緩衝以利除錯（會降低效能，僅用於除錯；以該核心的 TRM 為準）。",
      },
    ],
    analysis: `
#### 分析順序
1. **哪個 stack？** 看 EXC_RETURN bit2。RTOS 系統大多在 PSP。
2. **出錯位置**：stacked PC → 原始碼。若是 imprecise，往前看幾條 store 指令。
3. **出錯原因**：CFSR 對應位元；有 VALID 時看 MMFAR/BFAR。
4. **為什麼會到那裡**：stacked LR 找呼叫者；檢查 stack 是否溢位（SP 是否超出範圍）。
5. **stacked PC 本身很怪**（例如在 RAM 或 0xFFFFFFxx）：可能是函式指標損毀、stack 損毀導致返回位址錯誤。

#### 常見根因 Top 5
- NULL / 野指標存取
- Stack overflow（尤其 RTOS task）
- 周邊時脈未開就存取暫存器
- 函式指標/向量表錯誤（INVSTATE）
- FPU 未啟用（NOCP）、未對齊存取

#### 工具支援
IAR C-SPY 提供 fault 例外檢視器之類的功能（具體名稱與支援核心以手冊為準），能自動解讀 fault 暫存器；GDB 需要手動或使用腳本/外掛。向客戶示範工具如何「直接告訴你原因」，是展示商業除錯工具價值的好時機。
`,
    cases: [
      {
        title: "RTOS task 中隨機 HardFault",
        body: "EXC_RETURN=0xFFFFFFFD（PSP）。stacked PC 指向一個看起來合理的函式，但 stacked LR 是垃圾值。檢查該 task 的 stack：水位已到底 —— stack overflow 覆寫了返回位址。加大 stack 並啟用 overflow 檢查。",
      },
      {
        title: "上電時偶發 BusFault",
        body: "BFAR 指向某周邊的暫存器位址。原因是驅動初始化順序：在 RCC 開啟該周邊時脈之前就寫入其暫存器。只在某些冷開機時序下出現。",
      },
    ],
    customerQs: [
      {
        q: "Our application crashes into the HardFault handler. Can you help?",
        zh: "我們的程式掉進 HardFault，能幫忙嗎？",
        answer: "可以，請提供：CFSR、HFSR、MMFAR、BFAR 的值，exception frame 中的 PC、LR，以及 LR(EXC_RETURN) 值，還有對應版本的 ELF/map。若使用 C-SPY，可以用 fault 分析功能直接看解讀結果。我們會一起從 stacked PC 找到原始碼，再判斷根因。",
      },
      {
        q: "The PC in the fault frame points to a line that looks correct. What now?",
        zh: "Fault frame 中的 PC 指向一行看起來沒問題的程式，怎麼辦？",
        answer: "確認是否為 imprecise BusFault（PC 不準）；檢查該行用到的指標值（看 stacked 暫存器）；確認 stack 沒有溢位；若在 RTOS 中，確認是哪個 task。必要時暫時關閉 write buffer 讓 fault 變 precise。",
      },
      {
        q: "Why does the Cortex-M0 not tell us the fault reason?",
        zh: "為什麼 Cortex-M0 不告訴我們 fault 原因？",
        answer: "Armv6-M 架構只有 HardFault，沒有 CFSR 等狀態暫存器。仍可從 stacked PC/LR 與反組譯分析；常見原因是未對齊存取（M0 不支援）與 NULL 指標。",
      },
    ],
    interviewQs: [
      {
        q: "Walk me through how you would debug a HardFault on a Cortex-M4.",
        zh: "說明你如何除錯 Cortex-M4 的 HardFault。",
        points: ["EXC_RETURN 判斷 MSP/PSP", "stacked PC/LR", "CFSR/HFSR/BFAR", "常見根因", "如何預防（MPU、stack 檢查）"],
      },
      {
        q: "What's the difference between a precise and an imprecise bus fault?",
        zh: "Precise 與 imprecise bus fault 的差別？",
        points: ["write buffer", "PC 是否準確", "BFAR 是否有效", "除錯技巧"],
      },
      {
        q: "Tell me about the hardest crash you've debugged.",
        zh: "說說你除錯過最困難的當機問題。",
        points: ["STAR 結構", "用真實經驗（SSD / Zynq / FreeRTOS）", "工具與方法", "學到的流程改善"],
      },
    ],
    quiz: [
      { id: "t3h-q1", skill: "debug", q: "HardFault handler 中 LR = 0xFFFFFFFD，代表？", options: ["frame 在 MSP，返回 Handler mode", "frame 在 PSP，返回 Thread mode（RTOS task 中發生）", "FPU frame", "無效值"], answer: 1, explain: "bit2=1 → PSP。" },
      { id: "t3h-q2", skill: "debug", q: "CFSR = 0x00008200，意思是？", options: ["UsageFault 除以零", "Precise BusFault，BFAR 有效", "MPU 違規", "未定義指令"], answer: 1, explain: "bit9 PRECISERR + bit15 BFARVALID。" },
      { id: "t3h-q3", skill: "debug", q: "HFSR.FORCED = 1 代表？", options: ["向量表錯誤", "可設定的 fault 被升級為 HardFault", "Debug 事件", "Watchdog"], answer: 1, explain: "需再看 CFSR 了解原始 fault。" },
      { id: "t3h-q4", skill: "debug", q: "UFSR 的 INVSTATE 最常見原因？", options: ["FPU 未啟用", "跳到 bit0=0 的位址（錯誤的函式指標）", "Stack 對齊", "除以零"], answer: 1, explain: "Cortex-M 只能執行 Thumb，bit0 必須為 1。" },
      { id: "t3h-q5", skill: "debug", q: "Exception stack frame（無 FPU）不包含哪個暫存器？", options: ["R0", "R12", "R4", "xPSR"], answer: 2, explain: "硬體只保存 R0-R3、R12、LR、PC、xPSR。" },
      { id: "t3h-q6", skill: "debug", q: "Imprecise BusFault 時，哪個除錯技巧有助於找到確切位置？", options: ["提高最佳化", "暫時關閉預設寫入緩衝（如 DISDEFWBUF）", "移除 MPU", "加大 heap"], answer: 1, explain: "讓錯誤在發生指令處就被報告。" },
    ],
    reading: [
      { title: "Memfault Interrupt — How to debug a HardFault on an ARM Cortex-M MCU", url: "https://interrupt.memfault.com/blog/cortex-m-hardfault-debug", note: "完整的 fault 分析教學" },
      { title: "Arm — Cortex-M4 Devices Generic User Guide: Fault handling / System Control Block", note: "CFSR、HFSR 各位元的正式定義" },
      { title: "IAR C-SPY Debugging Guide — fault exception analysis", note: "C-SPY 的 fault 分析功能（名稱與支援範圍以手冊為準）" },
    ],
    toVerify: ["C-SPY fault 分析功能的正式名稱與支援核心"],
  },

  // ───────────────────────────────────────────── t3-compiler-bug
  {
    id: "t3-compiler-bug",
    objectives: [
      "建立判斷「compiler bug vs application bug」的系統化流程",
      "能把大型專案縮成 minimal reproducible example（含工具：C-Reduce / cvise）",
      "用二分法定位：檔案、函式、最佳化選項、編譯器版本",
      "寫出產品團隊能直接處理的高品質支援案件（support case）",
    ],
    concept: `
這是 JD 明確寫到的工作：「exploring compiler behavior and diving into optimization and debugging challenges」，以及成為「the crucial feedback loop between the field and IAR's product teams」。

#### 心法：先假設是程式的問題，但用證據排除
經驗上，客戶回報的「compiler bug」多數最後是 UB、缺少 volatile、時序、stack 或錯誤的假設。但真正的 compiler bug 確實存在，FAE 的價值是：**快速、有禮貌、有證據地**得出結論。

#### 系統化流程
1. **重現**：取得可建置的專案或最小片段、確切的編譯器版本、所有選項、目標裝置。
2. **分類現象**：編譯器當掉/內部錯誤（ICE，這幾乎一定是工具問題）、錯誤診斷、產生錯誤程式碼（wrong code）、效能/大小不佳（missed optimization）。
3. **二分定位**：
   - 哪個**檔案**？（逐檔切換最佳化）
   - 哪個**函式**？（函式層級最佳化 pragma）
   - 哪個**轉換**？（關閉特定最佳化選項，例如 GCC 的 \`-fno-strict-aliasing\`、\`-fno-tree-vectorize\`）
   - 哪個**版本**？（不同編譯器版本是否行為不同）
4. **排除程式問題**：開所有警告、靜態分析、在 host 上用 sanitizer 測試同一段邏輯、對照 C 標準。
5. **縮小**：用 C-Reduce / cvise 自動縮減，或手動刪減到 20–50 行。
6. **證據**：期望行為（依標準）、實際行為、相關組語片段。
7. **回報與暫時解法（workaround）**：給客戶一個可立即使用的 workaround（例如對該函式調整最佳化、改寫某段程式），同時把案件升級給產品團隊。
`,
    terms: [
      { en: "Minimal Reproducible Example", zh: "最小可重現範例", note: "能獨立重現問題的最小程式" },
      { en: "Internal Compiler Error (ICE)", zh: "編譯器內部錯誤", note: "編譯器自身崩潰" },
      { en: "Wrong-code Bug", zh: "錯誤程式碼 bug", note: "編譯器產生不正確的機器碼" },
      { en: "Missed Optimization", zh: "錯失的最佳化", note: "結果正確但不夠好" },
      { en: "Bisecting", zh: "二分定位", note: "逐步縮小範圍" },
      { en: "Test Case Reduction", zh: "測試案例縮減", note: "C-Reduce / cvise" },
      { en: "Workaround", zh: "暫時解法", note: "在修正前讓客戶繼續前進" },
      { en: "Escalation", zh: "問題升級", note: "轉給上層/產品團隊" },
    ],
    diagram: {
      title: "Compiler bug 判斷流程",
      mermaid: `flowchart TD
  R["客戶: 'compiler bug!'"] --> Q1{"編譯器當掉 / ICE?"}
  Q1 -->|"是"| T1["工具問題<br/>收集版本+輸入檔 → 升級"]
  Q1 -->|"否"| Q2{"所有最佳化等級都錯?"}
  Q2 -->|"是"| A1["優先檢查程式邏輯 / 標準理解"]
  Q2 -->|"只有高最佳化錯"| B["二分：檔案 → 函式 → 選項"]
  B --> C{"有 UB / volatile / 時序 / stack 問題?"}
  C -->|"有"| A2["Application bug<br/>給修正建議"]
  C -->|"沒有"| D["縮成最小範例<br/>確認符合標準"]
  D --> E["附組語證據 + workaround<br/>升級給產品團隊"]`,
    },
    code: [
      {
        title: "最小重現範例的樣子",
        lang: "c",
        code: `/* repro.c — 編譯器：<name/version>
 * 選項：<完整命令列或 IDE 設定>
 * 目標：Cortex-M4F
 * 期望：回傳 1（依 C11 6.5.x，見說明）
 * 實際：-O0 回傳 1；High/Speed 回傳 0（見附件組語第 12 行）
 */
#include <stdint.h>

__attribute__((noinline)) int check(uint16_t a, uint16_t b)
{
    return (uint32_t)(a * b) > 0x7FFFFFFFu;
}

int main(void)
{
    volatile int r = check(0xFFFF, 0xFFFF);
    return r;
}`,
        note: "注意：這個範例本身含有 UB（a*b 提升為 int 後溢位）—— 正是「看似 compiler bug、其實是 UB」的典型。寫報告前要先自我檢查！",
      },
      {
        title: "用 cvise 自動縮減（概念）",
        lang: "bash",
        code: `# interesting.sh：回傳 0 表示「問題仍存在」
#!/bin/sh
arm-none-eabi-gcc -O2 -c big.c -o a.o 2>/dev/null || exit 1
arm-none-eabi-objdump -d a.o | grep -q "suspicious_pattern" && exit 0
exit 1

cvise ./interesting.sh big.c     # 反覆刪減 big.c，保持 interesting.sh 為真`,
        note: "縮減時要避免把問題縮成含 UB 的程式；可在 interesting 腳本中加入檢查（例如同時用 sanitizer 在 host 上執行）。",
      },
    ],
    analysis: `
#### 一份好的支援案件包含
- **環境**：編譯器/IDE 完整版本、授權類型（不需要）、作業系統、目標裝置
- **重現步驟**：最小專案或檔案、確切選項
- **期望 vs 實際**：期望行為要能引用標準條文或文件
- **已做的排除**：哪些最佳化/版本有/無問題、已檢查 UB 與 volatile
- **證據**：相關組語片段、記憶體/暫存器狀態
- **影響**：客戶的專案時程、是否 blocking、是否有 workaround
- **商業脈絡**（給內部）：客戶規模、是否在評估期 —— 這幫助產品團隊排優先順序

#### 溝通技巧
- 不要在證據不足時告訴客戶「這是你的 bug」—— 改說「我們一起確認這段程式在標準下的行為」。
- 若確認是工具問題，坦白承認並提供 workaround 與追蹤編號，建立信任。
- 你身為 R&D 主管，知道開發團隊最討厭「無法重現的 bug 報告」—— 這個視角在 FAE 工作中是優勢。
`,
    cases: [
      {
        title: "評估期間發現的 wrong-code",
        body: "客戶在 PoV 中發現某 DSP 迴圈在最高速度最佳化下結果錯誤。FAE 當天縮成 30 行範例並確認符合標準，提供 workaround（該函式降一級最佳化），兩週後產品團隊提供修正。客戶反而因為支援速度與透明度而選擇購買 —— 支援品質本身就是產品價值。",
      },
      {
        title: "看似 compiler bug 的 aliasing 問題",
        body: "客戶堅持新版編譯器有 bug。縮減後發現程式以 uint16_t* 讀取 float 陣列。說明 strict aliasing 規則並示範 memcpy 寫法，客戶接受，並請 FAE 為他們的團隊做一場 UB 教育訓練 —— 支援案件轉化為 enablement 活動。",
      },
    ],
    customerQs: [
      {
        q: "We are 100% sure this is a compiler bug. When will you fix it?",
        zh: "我們百分之百確定這是編譯器 bug，什麼時候會修好？",
        answer: "謝謝詳細回報，我們非常重視。為了讓產品團隊能最快處理，我先和你一起縮成最小範例並確認標準行為；同時提供一個 workaround 讓專案不被卡住。確認是工具問題後，我會提供案件編號並主動回報進度。",
      },
      {
        q: "Can you give us a workaround while you investigate?",
        zh: "調查期間能先給我們暫時解法嗎？",
        answer: "可以：通常是針對受影響的函式/檔案調整最佳化等級、改寫觸發問題的程式樣式，或使用特定編譯器選項。會說明 workaround 的影響（大小/效能），並在正式修正後通知移除。",
      },
      {
        q: "Why do we need to send a minimal example? We already sent our whole project.",
        zh: "為什麼要提供最小範例？我們已經給了整個專案。",
        answer: "整個專案有很多變因，最小範例能讓我們更快確認根因、也能排除與工具無關的因素，並作為回歸測試防止問題再發生。我可以協助一起縮減，也會注意保密你們的原始碼。",
      },
    ],
    interviewQs: [
      {
        q: "How would you determine whether a problem is a compiler bug or an application bug?",
        zh: "如何判斷問題是編譯器 bug 還是應用程式 bug？",
        points: ["ICE vs wrong-code", "二分法", "UB/volatile 檢查", "最小範例與標準依據", "workaround + 升級"],
      },
      {
        q: "Tell me about a time you had to tell a customer (or colleague) they were wrong.",
        zh: "說說你必須告訴客戶（或同事）他錯了的經驗。",
        points: ["以證據與共同目標為中心", "語氣與時機", "結果與關係", "可用管理職經驗"],
      },
      {
        q: "What information do you need before escalating an issue to R&D?",
        zh: "升級問題給 R&D 之前需要哪些資訊？",
        points: ["版本與選項", "最小重現", "期望/實際", "已排除項目", "影響與優先度"],
      },
    ],
    quiz: [
      { id: "t3c-q1", skill: "debug", q: "下列哪種情況幾乎可以確定是工具問題？", options: ["-O2 結果與 -O0 不同", "編譯器內部錯誤（ICE）當掉", "debugger 看不到變數", "code size 變大"], answer: 1, explain: "合法或不合法的輸入都不應讓編譯器崩潰。" },
      { id: "t3c-q2", skill: "debug", q: "二分定位的合理順序？", options: ["版本 → 檔案 → 函式", "檔案 → 函式 → 最佳化選項", "隨機嘗試", "直接改用另一套編譯器"], answer: 1, explain: "由大到小縮小範圍。" },
      { id: "t3c-q3", skill: "fae", q: "回報 wrong-code bug 時，最重要的證據？", options: ["客戶的抱怨信", "最小範例 + 選項 + 期望/實際 + 相關組語", "整個專案的 zip", "截圖"], answer: 1, explain: "產品團隊需要可重現且可驗證的資料。" },
      { id: "t3c-q4", skill: "debug", q: "C-Reduce / cvise 的用途？", options: ["加速編譯", "自動縮減測試案例", "靜態分析", "產生 map file"], answer: 1, explain: "反覆刪減程式，同時保持問題仍然存在。" },
      { id: "t3c-q5", skill: "fae", q: "在確認根因之前，對客戶最好的做法？", options: ["說是客戶的錯", "承諾一週內修好", "一起縮小問題並提供 workaround", "建議客戶換工具"], answer: 2, explain: "讓客戶專案能繼續，同時建立事實。" },
    ],
    reading: [
      { title: "C-Reduce", url: "https://github.com/csmith-project/creduce", note: "自動縮減 C/C++ 測試案例" },
      { title: "cvise", url: "https://github.com/marxin/cvise", note: "C-Reduce 的 Python 版本" },
      { title: "GCC — How to report bugs", url: "https://gcc.gnu.org/bugs/", note: "開源社群對好 bug 報告的要求，可作為支援案件的參考" },
    ],
  },
];
