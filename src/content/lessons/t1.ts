import type { LessonContent } from "../types";

export const T1: LessonContent[] = [
  // ───────────────────────────────────────────── t1-pipeline
  {
    id: "t1-pipeline",
    objectives: [
      "說出 C/C++ 從原始碼到可燒錄映像檔的四個階段，以及每個階段的輸入/輸出檔案",
      "能用 GCC 的 -E / -S / -c 參數分別停在各階段，觀察中間產物",
      "理解 translation unit（編譯單元）的概念，以及為什麼 header 錯誤會變成 linker 錯誤",
      "能判斷一個錯誤訊息是來自前處理器、編譯器、組譯器還是 linker",
    ],
    concept: `
C/C++ 的建置不是「一個步驟」，而是一條**工具鏈（toolchain）**。對 FAE 來說，能快速判斷「問題卡在哪一段」是最重要的基本功，因為客戶通常只會說「build 失敗了」。

#### 四個階段
1. **前處理（Preprocessing）**：處理 \`#include\`、\`#define\`、\`#if\`。輸出是「展開後的純 C 程式」（.i）。這一段完全是文字替換，不懂 C 語法。
2. **編譯（Compilation）**：把一個 translation unit 轉成目標架構的組合語言（.s）。語法檢查、型別檢查、最佳化都在這裡發生。
3. **組譯（Assembly）**：把組合語言轉成機器碼，輸出 **relocatable object file**（.o / .obj，通常是 ELF 格式）。此時外部符號（例如呼叫別的 .c 檔的函式）還沒有位址。
4. **連結（Linking）**：把所有 object file 與函式庫合併，解析符號、決定每個 section 放在記憶體的哪裡（依 linker script / IAR 的 ICF），輸出可執行映像（.elf / .out），再轉成 .hex / .bin 燒錄。

#### Translation Unit
一個 .c 檔加上它 \`#include\` 的所有內容 = 一個 translation unit。**編譯器一次只看一個 TU**，所以：
- 在 header 裡「定義」（不是宣告）一個全域變數，被兩個 .c include → 兩個 TU 各有一份 → linker 報 **multiple definition**。
- 只有宣告沒有定義 → 編譯成功，linker 報 **undefined reference / undefined external**。

#### 不同工具鏈的命名
- GCC：\`arm-none-eabi-gcc\` 是 driver，會依序呼叫 \`cc1\`（編譯）、\`as\`（組譯）、\`ld\`（連結）。
- IAR（以 Arm 版為例）：編譯器 \`iccarm\`、組譯器 \`iasmarm\`、linker \`ilinkarm\`；IDE 是 IAR Embedded Workbench。工具名稱與架構有關，其他架構版本名稱不同。
`,
    terms: [
      { en: "Toolchain", zh: "工具鏈", note: "編譯器、組譯器、linker、函式庫、除錯器的整組工具" },
      { en: "Translation Unit (TU)", zh: "編譯單元", note: "一個 .c/.cpp 加上所有 include 展開後的內容" },
      { en: "Preprocessor", zh: "前處理器", note: "處理 # 開頭指令，純文字替換" },
      { en: "Relocatable Object File", zh: "可重定位目的檔", note: ".o/.obj，位址尚未決定" },
      { en: "Symbol Resolution", zh: "符號解析", note: "linker 把「呼叫 foo」對應到 foo 的定義" },
      { en: "Relocation", zh: "重定位", note: "linker 填入最終位址" },
      { en: "Executable Image", zh: "可執行映像檔", note: ".elf/.out，再轉為 .hex/.bin 燒錄" },
      { en: "Compiler Driver", zh: "編譯器驅動程式", note: "例如 gcc 指令本身，負責串起各階段" },
    ],
    diagram: {
      title: "C/C++ Build Pipeline",
      mermaid: `flowchart LR
  A["main.c / util.c<br/>(source)"] -->|"Preprocess<br/>gcc -E"| B["main.i<br/>(expanded C)"]
  B -->|"Compile<br/>gcc -S"| C["main.s<br/>(assembly)"]
  C -->|"Assemble<br/>gcc -c"| D["main.o<br/>(relocatable ELF)"]
  D --> L{{"Linker<br/>ld / ilink"}}
  E["util.o"] --> L
  F["libc.a / startup.o"] --> L
  S["Linker script .ld<br/>/ IAR .icf"] -.-> L
  L --> G["app.elf / app.out"]
  G -->|"objcopy / ielftool"| H["app.hex / app.bin"]`,
      caption: "每個 .c 獨立走完前三步；只有 linker 看得到整個程式。",
    },
    code: [
      {
        title: "用 GCC 停在每個階段",
        lang: "bash",
        code: `# 1) 只做前處理，看巨集展開結果
arm-none-eabi-gcc -E main.c -o main.i

# 2) 編譯到組合語言（可加 -O2 比較差異）
arm-none-eabi-gcc -S -mcpu=cortex-m4 -mthumb -O2 main.c -o main.s

# 3) 組譯成 object file
arm-none-eabi-gcc -c -mcpu=cortex-m4 -mthumb -O2 main.c -o main.o

# 4) 連結（-T 指定 linker script，-Wl,-Map 產生 map file）
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -T stm32.ld main.o util.o \\
    -Wl,-Map=app.map -o app.elf

# 轉成燒錄檔
arm-none-eabi-objcopy -O ihex app.elf app.hex`,
        note: "IAR 也有對應的命令列工具（iccarm / ilinkarm / ielftool），可在 IDE 的 Build 訊息視窗看到完整指令。",
      },
      {
        title: "經典錯誤：header 中定義變數",
        lang: "c",
        code: `/* config.h —— 錯誤寫法 */
int g_mode = 0;          /* 定義：每個 include 它的 TU 都有一份 */

/* config.h —— 正確寫法 */
extern int g_mode;       /* 宣告 */

/* config.c */
int g_mode = 0;          /* 唯一的定義 */`,
        note: "GCC 10 之後預設 -fno-common，舊專案升級編譯器時常突然出現 multiple definition 錯誤 —— 這是很典型的客戶問題。",
      },
    ],
    analysis: `
#### 為什麼要分階段？
- **分開編譯**讓大型專案只需重編改過的檔案（Make/CMake 依賴追蹤就是建立在 .o 之上）。
- **最佳化的範圍**預設是單一 TU：編譯器看不到別的 .c 裡函式的內容，因此無法跨檔 inline。這也是 LTO（GCC）或 IAR 多檔編譯（multi-file compilation）存在的原因。
- **位址在 link 時才決定**：所以「某變數放在哪個 RAM 區」「中斷向量表放在 0x0」都是 linker 的工作，而非編譯器。

#### 如何從錯誤訊息判斷階段
- \`#include file not found\`、巨集錯誤 → 前處理
- syntax error、type mismatch、warning → 編譯
- \`unknown instruction\`、inline asm 語法錯 → 組譯（或編譯器內建組譯）
- \`undefined reference\`、\`multiple definition\`、\`region overflowed\`、\`section placement\` → **link**

FAE 支援時第一句話常是：「請把完整的 build log 給我」—— 因為從錯誤格式就能判斷是哪個工具報的錯。
`,
    cases: [
      {
        title: "升級 GCC 後出現 multiple definition",
        body: "客戶從 GCC 9 升級到 GCC 10+，原本能 build 的專案出現大量 multiple definition。原因是 GCC 10 預設從 -fcommon 改為 -fno-common，header 中未加 extern 的全域變數不再被合併。正解是修正程式（header 用 extern），而不是加回 -fcommon 了事。這類「工具鏈升級揭露既有問題」在移植到其他編譯器（包括 IAR）時同樣常見。",
      },
      {
        title: "Debug 版正常、Release 版 link 失敗",
        body: "Release 設定開啟較高最佳化後，某函式被完全 inline 且原本的外部定義被移除；另一個以組合語言撰寫的模組仍呼叫該符號，導致 undefined reference。解法：對被組語呼叫的函式確保其有外部連結且不被丟棄（例如移除 static、或使用工具鏈提供的「保留符號」機制）。",
      },
    ],
    customerQs: [
      {
        q: "Our project builds fine with GCC, but in your tool we get 'undefined external' errors. Is the linker broken?",
        zh: "我們的專案用 GCC 可以建置，但在你們的工具出現 undefined external 錯誤，linker 壞了嗎？",
        answer: "先確認缺的是哪個符號：常見原因是 GCC 專案依賴的 startup 檔、newlib 系統呼叫（如 _sbrk、_write）或 GCC 特有的 libgcc 函式，在另一套工具鏈中名稱或提供方式不同。請客戶提供完整 link log 與缺少的符號清單，逐一對應到對方工具鏈的 runtime library 或專案檔案。",
      },
      {
        q: "Why does changing one header file trigger a rebuild of the whole project?",
        zh: "為什麼改一個 header 就整個專案重編？",
        answer: "因為 header 被 include 到多個 translation unit，建置系統依賴分析會把所有 include 它的 .c 標記為過期。可以建議：減少「大雜燴」式 header、使用前向宣告、把設定值移到 .c 中。",
      },
      {
        q: "Can I see what the preprocessor actually produced?",
        zh: "我能看到前處理後的結果嗎？",
        answer: "可以。GCC 用 -E；IAR 編譯器也有輸出前處理結果的選項（在 IDE 的編譯器選項中可設定輸出 preprocessed file；確切選項名稱請以 IAR 編譯器手冊為準）。這是排查巨集問題最快的方法。",
      },
    ],
    interviewQs: [
      {
        q: "Walk me through what happens when you compile and link a C program.",
        zh: "請說明 C 程式編譯與連結的過程。",
        points: ["四階段 + 每段輸入輸出", "translation unit 與分開編譯", "linker 做符號解析、重定位、依 linker script 配置記憶體", "舉一個你遇過的 link 錯誤"],
      },
      {
        q: "What is the difference between a declaration and a definition?",
        zh: "宣告與定義的差別？",
        points: ["宣告告知型別與名稱，定義配置儲存空間/提供函式本體", "extern 的用途", "ODR（C++ One Definition Rule）"],
      },
      {
        q: "How would you tell if a build error comes from the compiler or the linker?",
        zh: "如何判斷 build error 來自 compiler 還是 linker？",
        points: ["錯誤訊息格式與工具名稱", "undefined reference / overflow 屬於 link", "看 .o 是否已產生"],
      },
    ],
    quiz: [
      { id: "t1p-q1", skill: "compiler", q: "gcc -S 的輸出是？", options: ["前處理後的 .i", "組合語言 .s", "object file .o", "可執行檔 .elf"], answer: 1, explain: "-E 停在前處理、-S 停在編譯（輸出組語）、-c 停在組譯（輸出 .o）。" },
      { id: "t1p-q2", skill: "compiler", q: "「undefined reference to `uart_init'」是哪一個階段的錯誤？", options: ["前處理", "編譯", "組譯", "連結"], answer: 3, explain: "符號解析在 link 時進行；編譯單一 TU 時只要有宣告就能通過。" },
      { id: "t1p-q3", skill: "compiler", q: "下列何者最準確地描述 translation unit？", options: ["一個 header 檔", "一個 .c 檔及其 include 展開後的全部內容", "整個專案", "一個函式"], answer: 1, explain: "編譯器以 TU 為單位工作，因此預設看不到其他 .c 檔的函式內容。" },
      { id: "t1p-q4", skill: "compiler", q: "為什麼預設情況下編譯器無法 inline 另一個 .c 檔中的函式？", options: ["inline 只對 static 函式有效", "編譯器一次只處理一個 TU，看不到別檔的函式本體", "linker 不允許", "C 標準禁止"], answer: 1, explain: "需要 LTO 或多檔編譯，讓最佳化在看到整個程式時進行。" },
      { id: "t1p-q5", skill: "compiler", q: "在 header 中寫 `int counter = 0;` 並被兩個 .c include，最可能的結果？", options: ["正常運作", "編譯錯誤", "link 時 multiple definition", "執行時當機"], answer: 2, explain: "兩個 TU 各自定義了 counter；應在 header 用 extern 宣告，在一個 .c 中定義。" },
      { id: "t1p-q6", skill: "compiler", q: "決定「.data 放在 RAM 哪個位址」的是？", options: ["前處理器", "編譯器", "組譯器", "Linker（依 linker script / ICF）"], answer: 3, explain: "記憶體配置屬於 link 階段，由 linker 設定檔描述。" },
    ],
    reading: [
      { title: "GCC Manual — Overall Options (-E, -S, -c)", url: "https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html", note: "官方說明各階段控制參數" },
      { title: "Compiler Explorer (godbolt.org)", url: "https://godbolt.org", note: "線上看不同編譯器/選項產生的組合語言" },
      { title: "IAR C/C++ Development Guide（Arm 版）", note: "IAR 官方使用手冊，隨 IAR Embedded Workbench 安裝提供，也可在 IAR 官網 Support 區取得" },
    ],
    toVerify: ["IAR 輸出前處理檔的確切選項名稱"],
  },

  // ───────────────────────────────────────────── t1-toolchains
  {
    id: "t1-toolchains",
    objectives: [
      "比較 GCC、Clang/LLVM、IAR 三類工具鏈的定位與典型使用者",
      "理解 cross compilation 的組成：target triple / CPU 選項、runtime library、sysroot",
      "能說明客戶選擇商業編譯器的常見理由，以及開源工具鏈的優勢 —— 公平而不貶低",
      "知道哪些比較說法需要以官方資料或實測佐證",
    ],
    concept: `
#### 三種主要工具鏈
- **GCC（GNU Compiler Collection）**：開源、免費，嵌入式常見發行版是 Arm GNU Toolchain（\`arm-none-eabi-\`）。生態系最大，Linux 核心與大量開源專案的預設編譯器。
- **Clang / LLVM**：開源，模組化架構（前端 Clang、最佳化與後端 LLVM）。錯誤訊息友善、工具（clang-tidy、sanitizers）豐富。Arm 的商業編譯器 Arm Compiler 6 也是以 LLVM 為基礎。
- **IAR C/C++ Compiler**：商業工具鏈，搭配 IAR Embedded Workbench IDE、C-SPY 除錯器。IAR 支援多種架構（Arm、RISC-V、以及多種 8/16/32-bit MCU 架構）。IAR 常被提及的定位包括：程式碼大小/效能最佳化、功能安全認證版本、整合的靜態分析與執行期分析、商業技術支援。

> 面試或客戶情境中，「IAR 產生的 code 比 GCC 小 X%」這類數字**必須以客戶自己的程式碼實測**，不要背誦行銷數字。

#### Cross Compilation（交叉編譯）
在 x86 PC 上產生 Arm/RISC-V 機器碼。需要指定：
- **目標 CPU / ISA**：例如 GCC 的 \`-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard\`；RISC-V 的 \`-march=rv32imac -mabi=ilp32\`。
- **ABI / 浮點呼叫慣例**：hard-float 與 soft-float 的 object 不能混用，常見 link 錯誤來源。
- **Runtime library**：C 標準函式庫（newlib / newlib-nano / picolibc / IAR 的 DLIB 等）與編譯器輔助函式（libgcc 等）。
- **Sysroot**（Linux 目標）：目標系統的 header 與函式庫目錄。

#### Clang 的 target triple
Clang 用 \`--target=arm-none-eabi\` 這種 triple（架構-廠商-作業系統-ABI）選擇目標，同一個 clang 執行檔可產生多種架構；GCC 則通常每個目標一套獨立安裝的編譯器。
`,
    terms: [
      { en: "Cross Compiler", zh: "交叉編譯器", note: "在 host 上產生 target 架構的程式碼" },
      { en: "Host / Target", zh: "主機 / 目標", note: "編譯在 host 執行，程式在 target 執行" },
      { en: "Target Triple", zh: "目標三元組", note: "如 arm-none-eabi、riscv32-unknown-elf" },
      { en: "EABI", zh: "嵌入式應用二進位介面", note: "Arm 嵌入式的 ABI 規範" },
      { en: "Hard-float / Soft-float", zh: "硬體/軟體浮點", note: "浮點參數透過 FPU 暫存器或整數暫存器傳遞" },
      { en: "Runtime Library", zh: "執行期函式庫", note: "C 標準庫與編譯器輔助函式" },
      { en: "Sysroot", zh: "系統根目錄", note: "交叉編譯 Linux 程式時的目標系統檔案" },
      { en: "Functional Safety Certification", zh: "功能安全認證", note: "如 IEC 61508、ISO 26262 的工具認證" },
    ],
    diagram: {
      title: "Cross-compilation building blocks",
      mermaid: `flowchart TB
  subgraph Host["Host PC (x86-64, Windows/Linux)"]
    SRC["C/C++ source"] --> CC["Cross compiler<br/>arm-none-eabi-gcc / clang --target / iccarm"]
    CC --> OBJ["Arm/RISC-V object files"]
    OBJ --> LD["Linker"]
    RT["Runtime library<br/>newlib / picolibc / DLIB"] --> LD
    ST["Startup + linker config"] --> LD
  end
  LD --> IMG["Firmware image"]
  IMG -->|"Debug probe<br/>SWD / JTAG"| T["Target MCU<br/>Cortex-M / RISC-V"]`,
    },
    code: [
      {
        title: "同一份程式，三種工具鏈的典型命令列",
        lang: "bash",
        code: `# GCC (Arm GNU Toolchain)
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard \\
    -O2 -ffunction-sections -fdata-sections -c main.c -o main.o

# Clang (需另外提供 sysroot / C library，例如 LLVM Embedded Toolchain for Arm)
clang --target=arm-none-eabi -mcpu=cortex-m4 -mthumb -mfloat-abi=hard \\
    -O2 -c main.c -o main.o

# IAR (Arm) —— 以下為示意，實際選項請以 IAR C/C++ Development Guide 為準
iccarm main.c --cpu Cortex-M4 --fpu VFPv4_sp -Oh -o main.o`,
        note: "IAR 命令列選項請以官方手冊查證；在 IDE 中可從 Build 輸出直接複製實際使用的完整命令列。",
      },
      {
        title: "Hard-float / Soft-float 混用的 link 錯誤（GCC）",
        lang: "text",
        code: `ld: error: main.o uses VFP register arguments, libdriver.a(uart.o) does not
ld: failed to merge target specific data of file libdriver.a(uart.o)`,
        note: "第三方預編譯函式庫的 ABI 必須與專案一致。客戶換工具鏈時，二進位函式庫是最常見的阻礙之一。",
      },
    ],
    analysis: `
#### 公平比較的框架（FAE 必備）
客戶問「為什麼不用免費的 GCC」時，好的 FAE 不批評 GCC，而是回到客戶的需求：
1. **程式碼大小 / 效能**：在客戶的程式上實測（同樣的最佳化目標、同樣的函式庫設定），結果才有意義。
2. **認證需求**：做汽車、醫療、工控產品時，工具本身可能需要認證或提供 qualification 證據。
3. **生產力**：整合的 IDE、除錯器、靜態分析、執行期檢查，以及問題發生時有廠商支援。
4. **總持有成本**：授權費 vs. 工程師時間、Flash 成本、上市時程。

#### 什麼時候 GCC/Clang 是更好的選擇？
- Linux 應用與核心開發（Cortex-A + Linux 幾乎都用 GCC/Clang）
- 預算極有限、程式碼大小不是瓶頸、無認證需求
- 團隊高度依賴開源工具與 CI 生態

誠實承認這點反而增加你的可信度 —— FAE 是技術顧問，不是只會說「我們最好」的業務。
`,
    cases: [
      {
        title: "第三方 SDK 只提供 GCC 版本的 .a",
        body: "客戶想改用另一套編譯器，但晶片廠的 Wi-Fi 函式庫只提供 GCC 編譯的靜態庫。需檢查：ABI 相容性（Arm EABI 標準化程度高，多數情況可連結）、是否依賴 GCC runtime 函式（如 __aeabi_* 以外的 libgcc 函式）、C 函式庫系統呼叫介面差異。FAE 可以協助客戶評估，或與晶片廠合作提供對應版本 —— 這正是 JD 中「manage relationships with chip vendors」的場景。",
      },
      {
        title: "Cortex-M4F 專案浮點效能很差",
        body: "專案用 -mfloat-abi=soft 編譯，所有浮點運算都呼叫軟體函式。改為 hard（或 softfp）並正確啟用 FPU 後，控制迴圈時間大幅下降。同時要確認 startup code 有在使用浮點前開啟 FPU（設定 CPACR）。",
      },
    ],
    customerQs: [
      {
        q: "GCC is free. Why should we pay for a commercial compiler?",
        zh: "GCC 免費，為什麼要付費買商業編譯器？",
        answer: "先問：你們最在意的是 code size、效能、認證、還是除錯效率？再依情境回應：例如需要功能安全認證時，認證過的工具鏈與文件可以省下大量 tool qualification 工作；Flash 很緊時，可以用客戶自己的程式碼做比較。最後提議一個有明確成功標準的評估（PoV）。",
      },
      {
        q: "Can we mix object files built by GCC and by your compiler?",
        zh: "GCC 和你們編譯器的 object 可以混用嗎？",
        answer: "Arm 有標準化的 EABI，因此在條件符合時常可連結，但要確認：浮點 ABI 一致、enum/wchar_t 大小設定一致、C 函式庫相依性、C++ 物件（ABI 與例外處理）通常風險更高。需實際測試，並以官方文件的相容性說明為準。",
      },
      {
        q: "Do you support RISC-V?",
        zh: "你們支援 RISC-V 嗎？",
        answer: "IAR 有 RISC-V 版本的 Embedded Workbench（JD 也明確提到 RISC-V）。具體支援的核心、擴充指令集與版本，應查官方支援清單後回覆，不要憑印象回答。",
      },
    ],
    interviewQs: [
      {
        q: "How would you compare GCC, Clang and IAR to a customer?",
        zh: "你會如何向客戶比較 GCC、Clang 與 IAR？",
        points: ["先問需求再比較", "各自優勢（開源生態 vs 整合/認證/支援）", "用客戶程式實測", "不貶低競品"],
      },
      {
        q: "What do you need to set up a cross-compilation environment?",
        zh: "建立交叉編譯環境需要什麼？",
        points: ["cross compiler 與 target 選項", "runtime library 與 startup", "linker script", "debugger/probe", "Zynq 經驗：Cortex-A + Linux 與 R5/裸機"],
      },
      {
        q: "Have you ever migrated a project between toolchains? What broke?",
        zh: "你是否曾在不同工具鏈間移植專案？遇到什麼問題？",
        points: ["誠實說明自身經驗範圍（例如 GCC 版本升級、Xilinx SDK/Vitis 工具鏈）", "ABI、linker script、編譯器擴充語法", "怎麼驗證結果一致"],
      },
    ],
    quiz: [
      { id: "t1t-q1", skill: "compiler", q: "Cross compiler 的意思是？", options: ["可同時編譯 C 與 C++", "在一種架構的主機上產生另一種架構的程式碼", "能跨檔案最佳化", "可在 Windows 與 Linux 執行"], answer: 1, explain: "例如在 x86 PC 上產生 Cortex-M 的機器碼。" },
      { id: "t1t-q2", skill: "compiler", q: "下列哪一組 GCC 選項最可能造成「uses VFP register arguments」link 錯誤？", options: ["-O2 與 -Os 混用", "-mfloat-abi=hard 與 -mfloat-abi=soft 的 object 混用", "-g 與 無 -g 混用", "-ffunction-sections"], answer: 1, explain: "浮點呼叫慣例不同，二進位介面不相容。" },
      { id: "t1t-q3", skill: "compiler", q: "Clang 用什麼機制選擇目標架構？", options: ["每個架構安裝一套 clang", "--target=<triple>", "環境變數 CC", "只能編譯 x86"], answer: 1, explain: "Clang/LLVM 單一執行檔可透過 target triple 支援多種後端。" },
      { id: "t1t-q4", skill: "fae", q: "客戶問 IAR 與 GCC 的 code size 差異，最專業的回應？", options: ["引用網路上的平均數字", "說 GCC 很差", "建議用客戶自己的程式碼、在相同條件下實測", "說差不多"], answer: 2, explain: "可量測、可重現、與客戶相關的數據才有說服力。" },
      { id: "t1t-q5", skill: "compiler", q: "Linux 應用程式（Cortex-A）通常使用哪類工具鏈？", options: ["8-bit MCU 編譯器", "GCC 或 Clang", "只能用 IAR", "不需要編譯器"], answer: 1, explain: "Linux 生態與核心建置高度依賴 GCC/Clang；商業 MCU 工具鏈主要服務裸機/RTOS。" },
    ],
    reading: [
      { title: "Clang — Cross-compilation using Clang", url: "https://clang.llvm.org/docs/CrossCompilation.html", note: "target triple 與 sysroot 的官方說明" },
      { title: "GCC — ARM Options (-mcpu, -mfloat-abi)", url: "https://gcc.gnu.org/onlinedocs/gcc/ARM-Options.html", note: "Arm 目標選項完整列表" },
      { title: "IAR Systems 官方網站 — 產品與支援架構", url: "https://www.iar.com/", note: "查詢 IAR 支援的架構、版本與認證資訊（以官網最新內容為準）" },
    ],
    toVerify: ["IAR 命令列 --cpu/--fpu 參數的精確寫法", "IAR 各架構產品支援清單與認證版本"],
  },

  // ───────────────────────────────────────────── t1-optimization
  {
    id: "t1-optimization",
    objectives: [
      "說出 -O0/-O1/-O2/-O3/-Os 的差異與適用情境",
      "認得常見最佳化：constant folding、dead code elimination、inlining、loop unrolling、strength reduction、tail call",
      "能讀懂簡單的 Thumb-2 組合語言，比較不同最佳化等級的輸出",
      "能解釋「最佳化讓 bug 浮現」與「最佳化本身有 bug」的差別",
    ],
    concept: `
#### 最佳化等級（GCC 為例）
- **-O0**：幾乎不最佳化，每個變數都存在 stack，一行 C 對應一段組語。**最好除錯**，但程式大且慢。
- **-O1**：基本最佳化（暫存器配置、簡單常數傳播），編譯快。
- **-O2**：大多數不以空間換時間的最佳化；**多數產品的預設**。
- **-O3**：更積極（更多 inlining、向量化、迴圈展開），code size 可能變大。
- **-Os**：以 -O2 為基礎，排除會明顯增大程式碼的最佳化；**Flash 有限的 MCU 常用**。GCC 還有 \`-Oz\`（較新版本）與 \`-Og\`（兼顧除錯）。

IAR 的最佳化等級在 IDE 中是 None / Low / Medium / High，High 再分 Balanced / Size / Speed 等目標，並可針對個別檔案或函式調整（詳見 Track 5）。

#### 常見最佳化手法
- **Constant folding / propagation**：\`x = 3 * 4\` 直接變 12。
- **Dead code elimination**：結果沒被使用的計算被刪除 —— 這就是「沒加 volatile 的延遲迴圈消失」的原因。
- **Inlining**：把小函式展開到呼叫處，省去呼叫開銷，並創造更多最佳化機會。
- **Loop unrolling**：減少迴圈分支次數，以空間換時間。
- **Strength reduction**：\`i * 8\` 變成 \`i << 3\`；迴圈內乘法改成累加。
- **Common subexpression elimination**、**Register allocation**、**Instruction scheduling**。
- **Tail call**：函式最後呼叫另一函式時，以 branch 取代 call+return。

#### 程式碼大小 vs 速度
對 MCU 來說，Flash 大小直接影響晶片成本（BOM cost）。能把程式塞進更小的 Flash，有時意味著可以選便宜一級的 MCU —— 這是商業編譯器重要的價值主張之一，也是 FAE 常被要求做 benchmark 的原因。
`,
    terms: [
      { en: "Optimization Level", zh: "最佳化等級", note: "-O0..-O3, -Os；IAR: None/Low/Medium/High" },
      { en: "Inlining", zh: "內嵌展開", note: "把函式本體展開到呼叫處" },
      { en: "Dead Code Elimination", zh: "死碼消除", note: "移除結果不被使用的程式碼" },
      { en: "Loop Unrolling", zh: "迴圈展開", note: "複製迴圈本體以減少分支" },
      { en: "Constant Folding", zh: "常數折疊", note: "編譯期計算常數運算" },
      { en: "Strength Reduction", zh: "運算強度削減", note: "以較便宜的運算取代昂貴運算" },
      { en: "Code Size", zh: "程式碼大小", note: "通常指 Flash 中 .text + .rodata 的大小" },
      { en: "Instruction Scheduling", zh: "指令排程", note: "重排指令以減少 pipeline stall" },
    ],
    diagram: {
      title: "最佳化等級的取捨",
      mermaid: `flowchart LR
  O0["-O0 / None<br/>易除錯<br/>大且慢"] --> O1["-O1 / Low"]
  O1 --> O2["-O2 / Medium-High<br/>產品常用"]
  O2 --> O3["-O3 / High Speed<br/>更快，可能更大"]
  O2 --> Os["-Os / High Size<br/>更小，速度略降"]
  O0 -.->|"除錯可視性高"| D["Debug build"]
  O2 -.->|"出貨"| R["Release build"]`,
    },
    code: [
      {
        title: "一個簡單函式在不同最佳化下的輸出（Arm GCC、Cortex-M4、示意）",
        lang: "c",
        code: `int sum_array(const int *a, int n)
{
    int s = 0;
    for (int i = 0; i < n; i++)
        s += a[i];
    return s;
}`,
      },
      {
        title: "-O0：變數都在 stack，每次存取都讀寫記憶體",
        lang: "asm",
        code: `sum_array:
    push    {r7}
    sub     sp, sp, #20
    add     r7, sp, #0
    str     r0, [r7, #4]      @ a  -> stack
    str     r1, [r7]          @ n  -> stack
    movs    r3, #0
    str     r3, [r7, #12]     @ s = 0
    movs    r3, #0
    str     r3, [r7, #8]      @ i = 0
    b       .L2
.L3:
    ldr     r3, [r7, #8]      @ load i
    lsls    r3, r3, #2
    ldr     r2, [r7, #4]      @ load a
    add     r3, r3, r2
    ldr     r3, [r3]          @ a[i]
    ldr     r2, [r7, #12]     @ load s
    add     r3, r3, r2
    str     r3, [r7, #12]     @ store s
    ldr     r3, [r7, #8]
    adds    r3, r3, #1
    str     r3, [r7, #8]      @ i++
.L2:
    ldr     r2, [r7, #8]
    ldr     r3, [r7]
    cmp     r2, r3
    blt     .L3
    ldr     r3, [r7, #12]
    mov     r0, r3
    adds    r7, r7, #20
    mov     sp, r7
    pop     {r7}
    bx      lr`,
        note: "教學用的代表性輸出，不同 GCC 版本會略有差異。",
      },
      {
        title: "-O2：全部在暫存器，使用 post-increment 載入",
        lang: "asm",
        code: `sum_array:
    cmp     r1, #0
    ble     .L4
    add     r1, r0, r1, lsl #2   @ end = a + n
    movs    r3, #0
.L3:
    ldr     r2, [r0], #4         @ r2 = *a++
    cmp     r0, r1
    add     r3, r3, r2           @ s += r2
    bne     .L3
    mov     r0, r3
    bx      lr
.L4:
    movs    r0, #0
    bx      lr`,
        note: "注意：迴圈變數 i 已不存在 —— 這就是 debugger 在最佳化程式中看不到某些變數的原因。",
      },
    ],
    analysis: `
#### 讀組語的三個問題
1. **資料在哪？** 暫存器（快）還是 stack/記憶體（慢）？
2. **迴圈有幾條指令？** 迴圈內指令數 × 迭代次數 ≈ 執行時間的主要部分。
3. **有沒有呼叫？** \`bl\` 代表函式呼叫；被 inline 後就消失了。

#### 最佳化與正確性
最佳化**不應改變符合標準之程式的可觀察行為**。所以當「-O0 正常、-O2 異常」時，絕大多數情況是：
- 程式含 **Undefined Behavior**（下一課），或
- 缺少 **volatile**（硬體暫存器、ISR 共用變數），或
- 依賴 **未指定的執行順序**、時序（例如延遲迴圈被刪），或
- **Stack 使用量**改變（inlining 後某函式的 frame 變大）。

真正的 compiler bug 存在但相對少見；FAE 的價值在於快速區分兩者，並在確實是 compiler bug 時，產出最小可重現案例升級給產品團隊（Track 3 會詳細練習）。

#### Per-file / per-function 最佳化
大型專案常整體用 size 最佳化，但對 DSP 熱點函式用 speed 最佳化。GCC 可用 \`__attribute__((optimize("O3")))\`（官方文件建議主要用於除錯）或以檔案為單位設定；IAR 可用 \`#pragma optimize\` 或在 IDE 中對個別檔案覆寫設定。
`,
    cases: [
      {
        title: "延遲迴圈在 Release 版消失",
        body: "for (i = 0; i < 100000; i++); 在 -O2 被完全刪除，因為它沒有可觀察的效果。正確做法是使用硬體計時器（SysTick、DWT CYCCNT）或 RTOS 延遲函式；若必須忙等，迴圈變數宣告為 volatile。",
      },
      {
        title: "Flash 剩 2 KB，要加新功能",
        body: "步驟：(1) 從 map file 找出最大的模組；(2) 檢查是否誤拉進 printf 浮點格式化等大型函式庫；(3) 全專案改 size 最佳化，熱點函式維持 speed；(4) 開啟 section 層級的未使用程式碼移除；(5) 若仍不夠，再評估其他編譯器或更大 Flash。FAE 協助客戶做此分析，是展現工具價值的好機會。",
      },
    ],
    customerQs: [
      {
        q: "When we switch from Low to High optimization, our code stops working. Is this a compiler bug?",
        zh: "從低最佳化切到高最佳化後程式壞了，是 compiler bug 嗎？",
        answer: "有可能，但更常見的是程式中有 UB 或缺少 volatile。建議：(1) 先用二分法找出是哪個檔案/函式受影響（逐檔調整最佳化）；(2) 檢查共享變數與硬體暫存器存取；(3) 開啟所有警告與靜態分析；(4) 若仍懷疑是編譯器，縮成最小可重現範例並提供編譯器版本與選項，我們會轉給產品團隊分析。",
      },
      {
        q: "Which optimization level should we use for production?",
        zh: "量產該用哪個最佳化等級？",
        answer: "取決於瓶頸：Flash 吃緊選 size、效能吃緊選 speed，常見做法是整體 size + 熱點 speed。重點是：在開發早期就用量產設定測試，而不是最後才切換。",
      },
      {
        q: "Why can't I see my variable in the debugger at high optimization?",
        zh: "高最佳化時為何 debugger 看不到變數？",
        answer: "變數可能只活在暫存器中、被合併或消除了。可以暫時降低該檔案的最佳化、觀察暫存器與反組譯視窗，或將關鍵變數宣告為 volatile（僅用於除錯）。",
      },
    ],
    interviewQs: [
      {
        q: "Explain the difference between -O2, -O3 and -Os.",
        zh: "請說明 -O2、-O3、-Os 的差別。",
        points: ["速度 vs 大小的取捨", "-O3 更多 inline/向量化可能變大", "MCU Flash 成本考量", "per-file 調整"],
      },
      {
        q: "A customer says their code works at -O0 but fails at -O2. How do you approach it?",
        zh: "客戶說程式在 -O0 正常、-O2 異常，你會怎麼處理？",
        points: ["先假設是 UB/volatile 而非 compiler bug", "二分法縮小範圍", "警告與靜態分析", "最小可重現範例與升級流程"],
      },
      {
        q: "What compiler optimizations do you know, and how can you see their effect?",
        zh: "你知道哪些編譯器最佳化？如何觀察效果？",
        points: ["inlining、DCE、loop unrolling 等", "看組語輸出（-S、Compiler Explorer、IAR list file）", "量測 code size 與 cycle count"],
      },
    ],
    quiz: [
      { id: "t1o-q1", skill: "compiler", q: "哪個最佳化等級最適合「Flash 不夠」的情況？", options: ["-O0", "-O3", "-Os（或 IAR High/Size）", "-Og"], answer: 2, explain: "-Os 以大小為優先，排除會增大程式碼的最佳化。" },
      { id: "t1o-q2", skill: "compiler", q: "`for(i=0;i<1000;i++);` 在 -O2 被刪除，是哪種最佳化？", options: ["Inlining", "Dead code elimination", "Loop unrolling", "Strength reduction"], answer: 1, explain: "迴圈沒有可觀察的副作用，因此被視為死碼。" },
      { id: "t1o-q3", skill: "compiler", q: "把 `i * 8` 改成 `i << 3` 屬於？", options: ["Constant folding", "Strength reduction", "Tail call", "CSE"], answer: 1, explain: "以較便宜的運算取代乘法。" },
      { id: "t1o-q4", skill: "compiler", q: "在 -O2 的組語中看不到迴圈變數 i 被存回記憶體，代表？", options: ["編譯器錯誤", "i 被配置在暫存器或被轉換掉了", "程式不會執行", "需要 -O3"], answer: 1, explain: "這是正常的暫存器配置與迴圈轉換結果。" },
      { id: "t1o-q5", skill: "compiler", q: "-O3 相對 -O2 的常見副作用？", options: ["一定更小", "可能因更多 inlining/展開而變大", "無法除錯", "不支援 Cortex-M"], answer: 1, explain: "以空間換時間；在 MCU 上不一定更好。" },
      { id: "t1o-q6", skill: "compiler", q: "「-O0 正常，-O2 異常」最常見的根本原因？", options: ["Compiler bug", "程式中的 UB 或缺少 volatile", "Linker bug", "硬體故障"], answer: 1, explain: "最佳化只保證符合標準的程式行為不變。" },
    ],
    reading: [
      { title: "GCC — Options That Control Optimization", url: "https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html", note: "每個 -O 等級啟用哪些最佳化" },
      { title: "Compiler Explorer", url: "https://godbolt.org", note: "選 ARM GCC / armv7-m clang，比較 -O0/-O2/-Os 的組語" },
      { title: "IAR C/C++ Development Guide — Optimization chapter", note: "IAR 各最佳化等級與可個別控制的轉換（隨產品提供）" },
    ],
  },

  // ───────────────────────────────────────────── t1-ub
  {
    id: "t1-ub",
    objectives: [
      "定義 undefined、unspecified、implementation-defined behavior 的差別",
      "辨識嵌入式常見 UB：signed overflow、越界存取、未初始化變數、strict aliasing、移位過量、空指標",
      "解釋編譯器如何「利用」UB 進行最佳化，導致看似不合理的結果",
      "知道偵測 UB 的工具：警告、靜態分析（如 MISRA 檢查）、sanitizer",
    ],
    concept: `
#### 三種「行為」
- **Undefined Behavior（UB）**：標準不做任何要求。程式可能看起來正常、可能當機、可能被最佳化成完全不同的邏輯。
- **Unspecified Behavior**：標準給出幾種可能，實作可任選且不必說明（例如函式參數的求值順序）。
- **Implementation-defined Behavior**：實作必須選一種並寫在文件中（例如 \`int\` 大小、signed 右移、\`char\` 是否 signed）。**這就是不同編譯器結果不同的合法來源**，FAE 應能指引客戶查編譯器手冊的 implementation-defined 章節。

#### 嵌入式最常見的 UB
- **Signed integer overflow**：\`INT_MAX + 1\`。
- **陣列越界、指標越界**。
- **讀取未初始化的自動變數**。
- **Strict aliasing 違規**：用不相容型別的指標存取同一記憶體（例如 \`*(uint32_t*)&float_var\`）。
- **移位量 ≥ 型別寬度**或負的移位量：\`1 << 32\`。
- **解參考空指標或未對齊存取**（在某些 Cortex-M 上未對齊存取會 fault）。
- **修改字串常值**、**同一運算式中多次修改同一變數**（\`i = i++\`）。

#### 編譯器為什麼可以「亂來」？
編譯器假設程式**沒有 UB**，並據此推理。例如 signed 不會溢位 → \`x + 1 > x\` 永遠為真 → 整個判斷被刪除。這不是編譯器壞了，而是程式違反了契約。
`,
    terms: [
      { en: "Undefined Behavior (UB)", zh: "未定義行為", note: "標準不做任何要求" },
      { en: "Unspecified Behavior", zh: "未指定行為", note: "多種可能，不必說明" },
      { en: "Implementation-defined Behavior", zh: "實作定義行為", note: "編譯器必須文件化" },
      { en: "Strict Aliasing", zh: "嚴格別名規則", note: "不同型別指標不可指向同一物件（char 例外）" },
      { en: "Integer Promotion", zh: "整數提升", note: "小於 int 的型別運算前轉為 int" },
      { en: "Sequence Point", zh: "序列點", note: "C11 改稱 sequenced-before 關係" },
      { en: "Sanitizer", zh: "執行期檢查器", note: "如 UBSan、ASan（主要用於 host 測試）" },
      { en: "MISRA C", zh: "MISRA C 規範", note: "嵌入式安全編碼規範，靜態分析常用" },
    ],
    diagram: {
      title: "UB 如何變成「最佳化後壞掉」",
      mermaid: `flowchart TD
  A["程式含 UB<br/>例: signed overflow"] --> B["編譯器假設：UB 不會發生"]
  B --> C["推論: x+1 > x 恆為真"]
  C --> D["刪除檢查 / 改寫迴圈"]
  D --> E{"最佳化等級"}
  E -->|"-O0: 推論較少"| F["看起來正常"]
  E -->|"-O2: 推論較多"| G["行為改變 / 無窮迴圈"]
  G --> H["客戶回報: compiler bug?"]`,
    },
    code: [
      {
        title: "Signed overflow 讓檢查消失",
        lang: "c",
        code: `#include <limits.h>

int will_overflow(int x)
{
    return x + 1 < x;      /* 想檢查溢位，但 signed 溢位本身是 UB */
}
/* 最佳化後常被編譯成：return 0;
 * 正確寫法：return x == INT_MAX;  */`,
      },
      {
        title: "Strict aliasing：用 memcpy 做型別雙關",
        lang: "c",
        code: `#include <stdint.h>
#include <string.h>

uint32_t float_bits_bad(float f)
{
    return *(uint32_t *)&f;          /* 違反 strict aliasing（UB） */
}

uint32_t float_bits_ok(float f)
{
    uint32_t u;
    memcpy(&u, &f, sizeof u);        /* 合法；最佳化後通常就是一條 vmov */
    return u;
}`,
      },
      {
        title: "Integer promotion 的陷阱",
        lang: "c",
        code: `uint8_t  a = 200, b = 100;
uint16_t x = 0xFFFF;

if (a + b > 255)      /* a+b 先提升為 int = 300，條件成立（不是 44） */
    ;
uint32_t y = x << 16; /* x 提升為 int，0xFFFF << 16 超出 int 範圍 → UB（32-bit int） */
uint32_t z = (uint32_t)x << 16;   /* 正確 */`,
      },
    ],
    analysis: `
#### 為什麼不同編譯器結果不同？
同一段含 UB 的程式，GCC、Clang、IAR 會依各自的最佳化策略得到不同結果 —— **沒有一個是「錯」的**。客戶從 GCC 換到 IAR（或反之）後出現差異時，FAE 要優先懷疑：
1. UB（尤其 aliasing、overflow、未初始化）
2. Implementation-defined 差異（\`char\` 的 signedness、enum 大小、bit-field 配置、\`wchar_t\`）
3. 編譯器擴充語法的語意差異（\`#pragma pack\`、對齊屬性）

#### 偵測方法
- 開啟警告：GCC \`-Wall -Wextra\`，並注意 \`-Wstrict-aliasing\`、\`-Wshift-overflow\`。
- 靜態分析：MISRA C 規則禁止大多數 UB 的寫法；IAR 有 C-STAT 靜態分析工具。
- 執行期檢查：host 端用 UBSan/ASan 跑單元測試；IAR 有 C-RUN 執行期分析（功能細節以官方文件為準）。
- 暫時性診斷：GCC 的 \`-fno-strict-aliasing\`、\`-fwrapv\` 若讓問題消失，幾乎可確定是對應的 UB。
`,
    cases: [
      {
        title: "通訊協定解析在新編譯器上錯誤",
        body: "程式用 *(uint32_t*)(buf + 3) 直接從 byte buffer 讀取欄位。舊平台允許未對齊存取，新編譯器假設指標對齊並產生 LDRD/LDM 等需要對齊的指令（或目標核心不支援未對齊），造成 HardFault 或錯誤值。修正：用 memcpy 或逐 byte 組合；必要時用編譯器提供的 packed/unaligned 存取機制。",
      },
      {
        title: "計時器回繞判斷失效",
        body: "if ((int)(now - deadline) >= 0) 的寫法依賴 unsigned 減法回繞（合法）再轉 signed（implementation-defined），通常可用；但若寫成 if (now + timeout > now)，在 now 為 signed 時就是 UB。這類 bug 在 49.7 天（32-bit ms 計數器回繞）後才出現，非常難重現。",
      },
    ],
    customerQs: [
      {
        q: "Your compiler produces different results than GCC for the same code. Which one is wrong?",
        zh: "同樣的程式，你們的編譯器結果跟 GCC 不同，哪一個錯了？",
        answer: "先別急著判定。請提供最小範例，我們先檢查是否涉及 UB 或 implementation-defined 行為（例如 char 是否 signed、移位、aliasing）。若兩者都合法，差異來自標準允許的空間；若程式符合標準而結果錯誤，才是編譯器問題，我們會升級處理。",
      },
      {
        q: "Can your tools detect undefined behavior?",
        zh: "你們的工具能偵測未定義行為嗎？",
        answer: "可以從三層說明：編譯器警告、靜態分析（例如 MISRA 規則檢查）、執行期檢查。IAR 提供 C-STAT 與 C-RUN 等工具；可涵蓋的檢查項目請以官方產品資料為準，並建議在客戶的程式上試用。",
      },
      {
        q: "Is 'char' signed or unsigned in your compiler?",
        zh: "你們編譯器的 char 是 signed 還是 unsigned？",
        answer: "這是 implementation-defined，且通常可由選項設定。Arm EABI 慣例上 plain char 為 unsigned；具體預設值與選項請查編譯器手冊。移植時建議改用 int8_t / uint8_t 明確表達。",
      },
    ],
    interviewQs: [
      {
        q: "What is undefined behavior and why does it matter in embedded systems?",
        zh: "什麼是 UB？為什麼在嵌入式特別重要？",
        points: ["定義與三種行為區分", "編譯器利用 UB 最佳化", "嵌入式常見例子", "工具與規範（MISRA）"],
      },
      {
        q: "Give an example where an optimization exposed a bug in your code.",
        zh: "舉一個最佳化讓你的程式 bug 浮現的例子。",
        points: ["用真實經驗（例如 SSD 韌體、Zynq 專案）", "怎麼發現、怎麼定位、怎麼修", "學到什麼流程改善"],
      },
      {
        q: "What's the strict aliasing rule?",
        zh: "什麼是 strict aliasing rule？",
        points: ["不相容型別不可存取同一物件", "char 例外", "memcpy/union 的合法替代", "-fno-strict-aliasing 作為診斷"],
      },
    ],
    quiz: [
      { id: "t1u-q1", skill: "cpp", q: "下列何者是 implementation-defined（而非 UB）？", options: ["signed overflow", "plain char 是否為 signed", "陣列越界", "讀取未初始化變數"], answer: 1, explain: "實作必須選擇並文件化；其餘三者是 UB。" },
      { id: "t1u-q2", skill: "cpp", q: "`return x + 1 < x;`（x 為 int）在 -O2 常被編譯成？", options: ["正確的溢位檢查", "return 0;", "編譯錯誤", "呼叫 abort()"], answer: 1, explain: "編譯器假設 signed 不溢位，因此條件恆為假。" },
      { id: "t1u-q3", skill: "cpp", q: "將 float 的位元轉成 uint32_t，最安全的可攜寫法？", options: ["*(uint32_t*)&f", "memcpy(&u, &f, 4)", "(uint32_t)f", "reinterpret 巨集"], answer: 1, explain: "memcpy 不違反 aliasing，且最佳化後通常沒有額外成本。" },
      { id: "t1u-q4", skill: "cpp", q: "`uint8_t a=200,b=100; a+b` 的型別與值？", options: ["uint8_t, 44", "int, 300", "uint16_t, 300", "UB"], answer: 1, explain: "Integer promotion：運算前提升為 int。" },
      { id: "t1u-q5", skill: "cpp", q: "32-bit int 平台上 `1 << 32` 是？", options: ["0", "1", "UB", "編譯錯誤"], answer: 2, explain: "移位量 ≥ 型別寬度是 UB（Arm 硬體行為與 x86 不同也是原因之一）。" },
      { id: "t1u-q6", skill: "fae", q: "客戶說 IAR 與 GCC 結果不同，FAE 第一個該檢查的是？", options: ["直接升級為 compiler bug", "程式是否含 UB 或依賴 implementation-defined 行為", "請客戶重灌", "建議只用一種編譯器"], answer: 1, explain: "兩個編譯器都可能是「對的」。" },
    ],
    reading: [
      { title: "cppreference — Undefined behavior (C)", url: "https://en.cppreference.com/w/c/language/behavior", note: "UB / unspecified / implementation-defined 的定義與例子" },
      { title: "John Regehr — A Guide to Undefined Behavior in C and C++", url: "https://blog.regehr.org/archives/213", note: "經典系列文章" },
      { title: "MISRA C:2012 / C:2023", note: "嵌入式安全編碼規範（需購買），靜態分析工具常以此為規則集" },
    ],
  },

  // ───────────────────────────────────────────── t1-volatile
  {
    id: "t1-volatile",
    objectives: [
      "精確說明 volatile 保證什麼、不保證什麼",
      "能正確處理 ISR 與主程式之間的共享資料（旗標、計數器、多欄位結構）",
      "了解 C11 _Atomic / C++ std::atomic 與 memory order 的基本概念",
      "知道 Arm 的 DMB / DSB / ISB 何時需要，以及 critical section 的做法",
    ],
    concept: `
#### volatile 的正確理解
\`volatile\` 告訴編譯器：**這個物件可能被程式碼以外的東西改變或觀察**（硬體、ISR、另一個核心、DMA）。因此每一次 C 層級的讀寫都必須真的產生記憶體存取，不能被快取在暫存器、合併或刪除。

**volatile 不保證：**
- **原子性**：\`counter++\` 仍是「讀-改-寫」三步，可能被中斷打斷。
- **與非 volatile 存取的順序**：編譯器可以把一般變數的存取移到 volatile 存取的前後。
- **CPU / 匯流排層級的順序**：在多核心或有 write buffer 的系統，硬體仍可能重排，需要 memory barrier。

#### 何時用 volatile
- Memory-mapped 硬體暫存器（\`*(volatile uint32_t*)0x40020014\`；CMSIS 的 \`__IO\` 即 volatile）
- ISR 與主迴圈共用的簡單旗標
- \`setjmp/longjmp\` 之間被修改的區域變數

#### 原子操作與 critical section
- 單核 Cortex-M：對齊的 32-bit 讀或寫本身是單一指令；但讀-改-寫需要**關中斷**（\`__disable_irq()\` / 保存並恢復 PRIMASK）或使用 **LDREX/STREX**（Armv7-M 以上）或 C11 atomics。
- 多欄位資料（結構、64-bit 計數器在 32-bit CPU）需要 critical section 或 lock-free 設計（如 single-producer single-consumer ring buffer）。

#### Memory ordering
- C11 \`<stdatomic.h>\`：\`atomic_load_explicit(&x, memory_order_acquire)\` 等。\`seq_cst\` 最嚴格、\`relaxed\` 最寬鬆。
- Arm barrier：**DMB**（資料存取順序）、**DSB**（等待存取完成，例如寫完系統控制暫存器後）、**ISB**（清空 pipeline，例如改了 VTOR、MPU 或 CONTROL 暫存器後）。
`,
    terms: [
      { en: "volatile", zh: "volatile 限定詞", note: "禁止編譯器省略/合併存取" },
      { en: "Atomicity", zh: "原子性", note: "操作不可被打斷" },
      { en: "Read-Modify-Write", zh: "讀-改-寫", note: "x++ 的三個步驟" },
      { en: "Critical Section", zh: "臨界區段", note: "暫時阻止中斷/搶占" },
      { en: "Memory Barrier / Fence", zh: "記憶體屏障", note: "限制存取重排" },
      { en: "Memory Order (acquire/release)", zh: "記憶體順序", note: "C11/C++11 原子操作的順序語意" },
      { en: "LDREX / STREX", zh: "獨佔載入/儲存", note: "Arm 實作原子操作的指令" },
      { en: "Memory-mapped I/O", zh: "記憶體映射 I/O", note: "以位址存取周邊暫存器" },
    ],
    diagram: {
      title: "ISR 與主迴圈的共享資料",
      mermaid: `sequenceDiagram
  participant Main as main loop
  participant Mem as RAM: counter
  participant ISR as UART ISR
  Main->>Mem: LDR r0, counter (=5)
  Note over Main: 被中斷打斷
  ISR->>Mem: LDR counter (=5)
  ISR->>Mem: STR counter = 6
  Note over Main: 返回後繼續
  Main->>Mem: STR counter = r0+1 (=6)
  Note over Mem: 應為 7 —— 遺失一次更新<br/>volatile 無法避免這個問題`,
    },
    code: [
      {
        title: "ISR 旗標：volatile 足夠的情況",
        lang: "c",
        code: `#include <stdbool.h>

static volatile bool rx_ready = false;   /* 單一寫入者、單一讀取者、單一 byte */

void USART1_IRQHandler(void)
{
    /* ... 讀取資料到 buffer ... */
    rx_ready = true;
}

void main_loop(void)
{
    while (!rx_ready) { __WFI(); }       /* 每次都會重新讀取 rx_ready */
    rx_ready = false;
    process_rx();
}`,
      },
      {
        title: "共享計數器：需要 critical section 或 atomic",
        lang: "c",
        code: `#include <stdint.h>
#include <stdatomic.h>

/* 方法一：關中斷（CMSIS） */
static volatile uint32_t events;

void count_event_from_main(void)
{
    uint32_t primask = __get_PRIMASK();
    __disable_irq();
    events++;                       /* 讀-改-寫，受保護 */
    __set_PRIMASK(primask);         /* 恢復先前狀態，可巢狀使用 */
}

/* 方法二：C11 atomics（需要編譯器與 runtime 支援） */
static atomic_uint events2;

void count_event2(void)
{
    atomic_fetch_add_explicit(&events2, 1u, memory_order_relaxed);
    /* Cortex-M3/M4/M7 上通常編譯為 LDREX/STREX 迴圈 */
}`,
      },
      {
        title: "改寫系統暫存器後的 barrier",
        lang: "c",
        code: `/* 重新定位向量表到 RAM */
SCB->VTOR = (uint32_t)&ram_vector_table;
__DSB();   /* 確保寫入完成 */
__ISB();   /* 讓後續指令看到新設定 */

/* 啟用 MPU 後 */
MPU->CTRL = MPU_CTRL_ENABLE_Msk | MPU_CTRL_PRIVDEFENA_Msk;
__DSB();
__ISB();`,
      },
    ],
    analysis: `
#### 判斷流程
1. 資料會被「程式流程之外」的東西改變嗎？→ 需要 volatile（或 atomic）。
2. 存取是單一、對齊、原生寬度的讀或寫嗎？→ 單核上 volatile 通常足夠。
3. 有讀-改-寫、多個欄位、或寬度大於匯流排寬度嗎？→ 需要 critical section 或 atomic。
4. 有多核心、DMA、cache 嗎？→ 還需要 barrier 與 cache 維護（clean/invalidate）。

#### 你的背景優勢
你在 Zynq MPSoC（Cortex-A53 + R5）與 SSD controller 上的經驗，很可能遇過 **DMA 與 cache 一致性** 問題 —— 這是比單核 MCU 更難的情境。面試時可以用這類真實經驗說明你理解 memory ordering，而不只是背定義。

#### 常見誤解
- 「全部加 volatile 就安全」→ 錯，而且會讓程式變慢、阻礙最佳化。
- 「volatile 等於 atomic」→ 錯（C/C++ 標準都沒有這樣保證；Java 的 volatile 語意不同）。
- 「關中斷就能保護多核心」→ 錯，只影響當前核心。
`,
    cases: [
      {
        title: "64-bit 時間戳偶爾跳動",
        body: "Cortex-M4 上，SysTick ISR 更新 uint64_t ticks，主程式讀取時偶爾得到錯誤值。原因：64-bit 讀取需要兩條 LDR，中間可能被 ISR 更新（讀到新的高位 + 舊的低位）。解法：關中斷讀取，或讀高-低-高直到高位一致。",
      },
      {
        title: "DMA 完成後讀到舊資料（Cortex-M7 / Cortex-A）",
        body: "DMA 寫入 RAM 後，CPU 從 D-Cache 讀到舊資料。volatile 無法解決（它只影響編譯器）。需要在 DMA 完成後對 buffer 做 cache invalidate，並確保 buffer 對齊 cache line；傳送前則做 clean。",
      },
    ],
    customerQs: [
      {
        q: "We added volatile everywhere and still have race conditions. Is the compiler ignoring volatile?",
        zh: "我們到處加了 volatile，還是有 race condition，編譯器忽略 volatile 嗎？",
        answer: "volatile 只保證存取不被省略，不提供原子性或硬體順序。請找出讀-改-寫或多欄位的共享資料，用 critical section 或 atomic 保護；若有 DMA/cache 或多核心，還要加 barrier 與 cache 維護。可以一起看反組譯確認編譯器確實產生了每次存取。",
      },
      {
        q: "Does your compiler support C11 atomics on Cortex-M0?",
        zh: "你們編譯器在 Cortex-M0 支援 C11 atomics 嗎？",
        answer: "Cortex-M0（Armv6-M）沒有 LDREX/STREX，原子讀-改-寫通常需以關中斷的 runtime 函式實作。是否支援及實作方式請查該版本編譯器文件；面對客戶時要說明效能與中斷延遲的影響。",
      },
      {
        q: "Why is my peripheral register write not taking effect before the next instruction?",
        zh: "為什麼周邊暫存器寫入在下一條指令前沒有生效？",
        answer: "可能是 write buffer 或匯流排延遲。對系統控制暫存器使用 DSB/ISB；對周邊則參考晶片手冊（有時需回讀暫存器確保寫入完成，例如清除中斷旗標後）。",
      },
    ],
    interviewQs: [
      {
        q: "What does volatile guarantee in C, and what doesn't it guarantee?",
        zh: "volatile 在 C 中保證什麼、不保證什麼？",
        points: ["存取不被省略/合併", "不保證原子性與順序", "正確使用情境", "與 atomic、barrier 的分工"],
      },
      {
        q: "How do you protect data shared between an ISR and a task?",
        zh: "如何保護 ISR 與 task 共享的資料？",
        points: ["volatile 旗標", "critical section（PRIMASK/BASEPRI）", "RTOS FromISR API / queue", "lock-free ring buffer"],
      },
      {
        q: "Have you dealt with cache coherency and DMA?",
        zh: "你處理過 cache 一致性與 DMA 嗎？",
        points: ["Zynq / SSD 實際經驗", "clean / invalidate 時機", "buffer 對齊", "怎麼除錯"],
      },
    ],
    quiz: [
      { id: "t1v-q1", skill: "cpp", q: "對 `volatile int x;` 執行 `x++`，何者正確？", options: ["保證原子", "仍是讀-改-寫，可能被中斷打斷", "編譯錯誤", "會自動關中斷"], answer: 1, explain: "volatile 不提供原子性。" },
      { id: "t1v-q2", skill: "cpp", q: "修改 VTOR 後最需要的指令組合？", options: ["NOP", "DSB + ISB", "只要 DMB", "不需要"], answer: 1, explain: "確保寫入完成並刷新 pipeline，讓新的向量表生效。" },
      { id: "t1v-q3", skill: "cpp", q: "Cortex-M3 上 C11 `atomic_fetch_add` 通常用什麼指令實作？", options: ["SWP", "LDREX/STREX", "CPSID", "DMB 單獨即可"], answer: 1, explain: "Armv7-M 支援獨佔存取指令。" },
      { id: "t1v-q4", skill: "cpp", q: "DMA 寫入後 CPU 讀到舊資料（有 D-Cache），正確的處理？", options: ["加 volatile", "DMA 完成後 invalidate 該 buffer 的 cache", "關中斷", "提高最佳化"], answer: 1, explain: "這是硬體 cache 一致性問題，不是編譯器問題。" },
      { id: "t1v-q5", skill: "cpp", q: "保存並恢復 PRIMASK（而不是直接 enable_irq）的好處？", options: ["更快", "允許 critical section 巢狀使用而不意外開啟中斷", "可保護多核心", "減少 code size"], answer: 1, explain: "若呼叫者本來就關了中斷，直接 enable 會破壞它的保護。" },
      { id: "t1v-q6", skill: "cpp", q: "下列何者最需要 volatile？", options: ["區域迴圈計數器", "Memory-mapped 周邊狀態暫存器", "const 查表", "函式參數"], answer: 1, explain: "硬體會在程式之外改變其值。" },
    ],
    reading: [
      { title: "cppreference — Atomic operations library (C)", url: "https://en.cppreference.com/w/c/atomic", note: "C11 atomics 與 memory_order" },
      { title: "Arm — Memory barriers (Application Note 321: ARM Cortex-M Programming Guide to Memory Barrier Instructions)", note: "Cortex-M 何時需要 DMB/DSB/ISB 的官方說明；可在 Arm Developer 網站搜尋 AN321" },
      { title: "CMSIS-Core documentation", url: "https://arm-software.github.io/CMSIS_6/", note: "__disable_irq、__DSB 等內建函式" },
    ],
    toVerify: ["IAR 在 Armv6-M 上 C11 atomics 的實作方式"],
  },
];
