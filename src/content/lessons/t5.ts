import type { LessonContent } from "../types";

// Track 5 — IAR Ecosystem.
// Facts below were checked against IAR's public documentation (docs.iar.com, EWARM 9.70.x / 10.10.x)
// and iar.com product pages in Oct 2026. Anything not confirmed is listed in `toVerify`.
// Always re-check against the manuals of the exact product + version a customer uses.

const DOCS = "https://docs.iar.com/ewarm/10.1x/";

export const T5: LessonContent[] = [
  // ───────────────────────────────────────────── t5-ew
  {
    id: "t5-ew",
    objectives: [
      "說明 IAR Embedded Workbench 是什麼、有哪些架構版本，以及它在 Qt Group 之下的定位",
      "認得 IAR 專案的檔案結構：workspace（.eww）、project（.ewp）、debugger 設定（.ewd）與 settings 目錄",
      "理解 Build Configuration（Debug / Release / 自訂）與「檔案層級選項覆寫」的概念",
      "能用 iarbuild 在命令列 / CI 中建置 IAR 專案，並知道有 VS Code 擴充與 Linux 版建置工具可用",
    ],
    concept: `
**IAR Embedded Workbench（EW）**是 IAR 的整合式開發工具鏈：IDE、最佳化 C/C++ 編譯器、組譯器、linker（ILINK）、C-SPY 除錯器，以及選配的分析工具（C-STAT 靜態分析、C-RUN 執行期分析）。官方產品頁說明它是可在 **Linux 與 Windows** 上執行的跨平台 IDE，並支援 VS Code、Eclipse 與 CMake 整合。

#### 產品是「依架構」區分的
- **IAR Embedded Workbench for Arm（EWARM）**、**for RISC-V（EWRISCV）**，以及 Renesas RX / RL78 / RH850、MSP430、AVR、8051、STM8 等版本。
- 每個架構版本的**編譯器名稱、選項、關鍵字、手冊**都不同。例如 Arm 版編譯器是 \`iccarm\`、linker 是 \`ilinkarm\`。回答客戶前，一定要先確認「哪個架構、哪個版本」。
- 官方線上文件依產品與版本分開，例如 EWARM 9.70.x 與 10.10.x 各有一套（docs.iar.com）。

#### 公司背景（面試常被問）
IAR Systems 於 2025 年 10 月由 Qt Group 完成收購，目前是 Qt Group 旗下全資子公司；IAR 官方說明它仍以獨立事業單位與品牌運作。Qt 財報提到 IAR 正在轉向 SaaS 型授權模式 —— **授權細節變動中，對客戶說明前務必查最新官方資訊**。

#### 專案檔案結構
- **Workspace（.eww）**：一個或多個專案的集合（例如 bootloader + application）。
- **Project（.ewp）**：原始檔清單、群組（groups）、各 build configuration 的所有工具選項。這是 iarbuild 的輸入。
- **Debugger 設定（.ewd）**：C-SPY driver（Simulator / I-jet / J-Link / ST-LINK / CMSIS-DAP…）與除錯選項。
- **settings/ 目錄**：IDE 產生的個人/工作階段設定，也包含 C-SPY 自動產生的 batch 檔（\`project.config.cspy.bat\` 與 \`.xcl\` 參數檔）。
- 建議納入版本控制：.eww、.ewp、.ewd、.icf、原始碼；settings/ 與輸出目錄（Debug/、Release/）通常不納入（依團隊需求調整）。

#### Build Configuration 與選項覆寫
- 預設有 **Debug** 與 **Release** 兩組設定，也可自訂（例如 \`Release_Size\`、\`UnitTest\`）。
- 選項可在**專案層級**設定，也可在**群組或單一檔案**層級覆寫（例如只對某個 DSP 檔開高速最佳化）。這是客戶常忽略的地方：「為什麼這個檔案的行為跟其他檔不同？」—— 檢查它是否有 override。

#### 命令列建置（CI/CD 的入口）
\`iarbuild\` 位於 \`common\\bin\`，語法：\`iarbuild project.ewp [opmode] config\`。常用 opmode：\`-make\`（預設，增量）、\`-build\`（全部重建）、\`-clean\`；新版還有 \`-cstat_analyze\`、\`-jsondb\`、\`-compdb\`、\`-ninja\` 等（依版本）。
`,
    terms: [
      { en: "IAR Embedded Workbench (EW)", zh: "IAR 整合開發工具鏈", note: "依架構分版本：EWARM、EWRISCV…" },
      { en: "Workspace (.eww)", zh: "工作區", note: "多個專案的集合" },
      { en: "Project file (.ewp)", zh: "專案檔", note: "檔案清單 + 各 configuration 的工具選項" },
      { en: "Debugger settings (.ewd)", zh: "除錯設定檔", note: "C-SPY driver 與除錯選項" },
      { en: "Build configuration", zh: "建置組態", note: "Debug / Release / 自訂" },
      { en: "Option override", zh: "選項覆寫", note: "對群組或單檔設定不同選項" },
      { en: "iarbuild", zh: "IAR 命令列建置工具", note: "CI 中建置 .ewp 專案" },
      { en: "IAR Build Tools", zh: "IAR 建置工具（無 IDE）", note: "適合 Linux / 容器 / CI 的建置套件" },
    ],
    diagram: {
      title: "IAR Embedded Workbench project anatomy",
      mermaid: `flowchart TB
  W["Workspace .eww"] --> P1["bootloader.ewp"]
  W --> P2["app.ewp"]
  P2 --> C1["Configuration: Debug<br/>-On, debug info, Simulator"]
  P2 --> C2["Configuration: Release<br/>-Ohz, checksum"]
  P2 --> G["Groups / source files<br/>(per-file overrides)"]
  P2 --> D["app.ewd<br/>C-SPY driver settings"]
  P2 --> I["app.icf<br/>linker configuration"]
  C2 --> B["iarbuild app.ewp -build Release"]
  B --> O["app.out (ELF/DWARF)<br/>→ ielftool → .hex/.bin"]`,
      caption: "同一個 .ewp 可有多組 configuration；CI 用 iarbuild 指定 configuration 建置。",
    },
    code: [
      {
        title: "CI 中用 iarbuild 建置與分析（Windows 路徑示意）",
        lang: "bash",
        code: `# 增量建置（預設 -make）
"C:\\Program Files\\IAR Systems\\Embedded Workbench <ver>\\common\\bin\\iarbuild.exe" app.ewp -make Debug

# 全部重建 Release，並顯示所有訊息
iarbuild app.ewp -build Release -log all

# 同時處理所有 configuration（Windows 下 * 可不加引號）
iarbuild app.ewp -build "*"

# 若有 C-STAT：用 iarbuild 驅動靜態分析
iarbuild app.ewp -cstat_analyze Release

# 產生 compile_commands.json，給 clangd / 其他工具使用（新版才有）
iarbuild app.ewp -compdb Debug`,
        note: "opmode 清單依版本不同；在終端機直接執行 iarbuild（不帶參數）會列出該版本支援的參數。",
      },
      {
        title: "Linux 容器中的建置（IAR 官方 bx-docker 範例的形式）",
        lang: "bash",
        code: `# IAR 在 GitHub 提供 bx-docker 範例：以 IAR Build Tools 的 .deb 安裝包建立容器映像
# 之後在容器中：
/opt/iarsystems/bxarm/common/bin/iarbuild targets/arm/library.ewp -build Release
/opt/iarsystems/bxarm/common/bin/iarbuild targets/arm/test-crc32.ewp -build Release`,
        note: "授權（license）在容器 / CI 中怎麼啟用，依目前的授權方案而定 —— 這是 FAE 必須查最新官方資料再回答的典型問題。",
      },
      {
        title: "建議的版本控制規則（.gitignore 範例）",
        lang: "text",
        code: `# IAR build outputs
Debug/
Release/
*.dep
# per-user IDE state (團隊可視需要保留部分 settings)
settings/
# keep: *.eww *.ewp *.ewd *.icf *.mac source code`,
      },
    ],
    analysis: `
#### 為什麼 FAE 要很熟專案結構？
客戶問題有很大比例是「設定問題」而非「工具 bug」：用錯 configuration、某檔案有 override、.icf 不是預期的那一份、Debug 用 Simulator 而 Release 用實體 probe 等。能快速請客戶匯出/提供 .ewp、.icf、build log，往往幾分鐘就能定位。

#### Debug vs Release 的差異是「選項集合」的差異
不要只說「Release 有最佳化」。實際上可能還包括：debug info 有無、assert/log 巨集、library 配置、checksum、輸出格式。客戶說「Debug OK、Release 壞」時，正確的第一步是**列出兩組設定的差異**，再逐一二分（bisect）。

#### IDE 與 CI 一致性
CI 用 iarbuild 讀同一份 .ewp，因此「IDE 能 build、CI 不能」通常是：路徑（\`$PROJ_DIR$\` 等變數）、工具版本不同、授權不可用、或 CI 機器少了 device support 檔。這也是 IAR 推出 Linux 版建置工具與容器範例的原因。

#### 跨 IDE 工作流
IAR 官方提供 VS Code 的 **IAR Build** 與 **IAR C-SPY Debug** 擴充，可直接開 .ewp 專案建置、跑 C-STAT、除錯；也可搭配 CMake 等第三方建置系統。對習慣 VS Code 的客戶，這是降低導入阻力的好話題。
`,
    cases: [
      {
        title: "單一檔案的 override 造成行為差異",
        body: "客戶回報：某個 CRC 函式在 Release 版結果錯誤，但抽出來單獨測試正常。檢查 .ewp 發現該檔案被設定了不同的最佳化等級與不同的 enum 大小選項，導致與其他模組的資料結構布局不一致。修正方式：移除不必要的檔案層級覆寫，若確實需要不同最佳化，只覆寫最佳化而不改變影響 ABI/資料布局的選項。FAE 的收穫：請客戶提供 .ewp 時，要特別搜尋檔案層級設定。",
      },
      {
        title: "CI 建置失敗但 IDE 正常",
        body: "團隊導入 Jenkins，iarbuild 回報找不到 include 檔。原因是 .ewp 中使用了絕對路徑（工程師本機目錄），IDE 在原機器上可以，CI agent 上沒有。改用 $PROJ_DIR$ 相對路徑後解決。延伸建議：CI 機器固定 IAR 版本（甚至用容器），確保結果可重現。",
      },
    ],
    customerQs: [
      {
        q: "Can we build IAR projects in our CI on Linux?",
        zh: "我們可以在 Linux CI 上建置 IAR 專案嗎？",
        answer: "可以朝這個方向規劃：IAR 有可在 Linux 執行的建置工具，iarbuild 可直接讀 .ewp，也支援 CMake 流程；IAR 在 GitHub 也有 Docker 範例。實際可用的產品組合與 CI 授權方式要依客戶的方案與最新官方授權模式確認，我會帶回去確認後給書面答覆。",
      },
      {
        q: "Which files should we commit to Git?",
        zh: "哪些檔案要放進 Git？",
        answer: "專案定義（.eww/.ewp/.ewd）、linker 設定（.icf）、C-SPY macro（.mac）與原始碼要納入；輸出目錄（Debug/Release）與個人 IDE 狀態通常排除。也建議把 IAR 版本號記錄在 README 或 CI 設定中。",
      },
      {
        q: "Our developers prefer VS Code. Do they have to use the IAR IDE?",
        zh: "我們的工程師偏好 VS Code，一定要用 IAR IDE 嗎？",
        answer: "不一定。IAR 官方在 VS Code Marketplace 提供 IAR Build 與 IAR C-SPY Debug 擴充，可以開 .ewp 專案建置、跑 C-STAT、用 C-SPY 除錯。進階的除錯視窗或特定功能是否在 VS Code 中都有，要依擴充版本確認。",
      },
    ],
    interviewQs: [
      {
        q: "What do you know about IAR and its products?",
        zh: "你對 IAR 與其產品了解多少？",
        points: ["IAR Embedded Workbench：IDE + 最佳化編譯器 + ILINK + C-SPY", "依架構分版本（Arm、RISC-V 等）", "C-STAT / C-RUN 與功能安全認證版本", "IAR Build Tools 與 CI/CD、VS Code 擴充", "2025 年成為 Qt Group 子公司，仍以獨立品牌運作", "誠實說明：正在系統性學習，尚無長期 IAR 實務經驗"],
      },
      {
        q: "How would you set up an IAR project for continuous integration?",
        zh: "你會如何把 IAR 專案接到 CI？",
        points: ["iarbuild + 指定 configuration", "固定工具版本、相對路徑", "C-STAT 分析與報告", "artifact：.out / .hex / map file", "授權與容器策略需確認"],
      },
    ],
    quiz: [
      { id: "t5ew-q1", skill: "compiler", q: "iarbuild 的主要輸入檔是？", options: [".eww workspace", ".ewp project", ".icf linker 設定", ".mac macro"], answer: 1, explain: "官方語法：iarbuild project.ewp [opmode] config。" },
      { id: "t5ew-q2", skill: "cicd", q: "iarbuild 若不指定 opmode，預設行為是？", options: ["-build（全部重建）", "-clean", "-make（只建置變更的部分）", "只做語法檢查"], answer: 2, explain: "官方文件列出 -make 為預設模式。" },
      { id: "t5ew-q3", skill: "compiler", q: "C-SPY 使用的 driver（Simulator / J-Link 等）主要記錄在哪裡？", options: [".ewd 除錯設定", ".icf", "source code", "Windows registry"], answer: 0, explain: ".ewd 存放 debugger 設定；C-SPY 也會在 settings/ 產生 batch 與 .xcl 檔。" },
      { id: "t5ew-q4", skill: "fae", q: "客戶說「只有一個檔案行為怪怪的」，在 IAR 專案中應優先檢查什麼？", options: ["重新安裝 IDE", "該檔案是否有檔案層級的選項覆寫", "換一顆 MCU", "關閉所有 warning"], answer: 1, explain: "IAR 允許群組 / 單檔覆寫選項，是常見的差異來源。" },
      { id: "t5ew-q5", skill: "fae", q: "回答客戶 IAR 授權（license）在 CI 中如何使用時，最恰當的做法是？", options: ["憑印象回答", "說不支援", "確認客戶方案並查最新官方授權資訊後書面回覆", "建議破解"], answer: 2, explain: "IAR 授權模式持續變動（Qt 財報提到轉向 SaaS 型授權），必須查證。" },
      { id: "t5ew-q6", skill: "compiler", q: "下列何者是 IAR 官方提供的 VS Code 擴充？", options: ["IAR Build 與 IAR C-SPY Debug", "Cortex-Debug", "PlatformIO", "CMake Tools"], answer: 0, explain: "兩者皆由 IAR 發佈於 VS Code Marketplace（publisher: IAR Systems）。" },
    ],
    reading: [
      { title: "iarbuild — the IAR Command Line Build Utility（EWARM 10.10.x）", url: "https://docs.iar.com/ewarm/10.1x/en/ide-project-management-and-building/building-projects/reference-information-on-building/iarbuild-the-iar-command-line-build-utility.html", note: "官方 opmode 與參數清單" },
      { title: "IAR Embedded Workbench 產品頁", url: "https://www.iar.com/embedded-development-tools/iar-embedded-workbench", note: "產品組成、Linux/Windows、VS Code/Eclipse/CMake 整合" },
      { title: "IAR VS Code extensions", url: "https://www.iar.com/embedded-development-tools/iar-visual-studio-code-extension", note: "IAR Build 與 C-SPY Debug 擴充" },
      { title: "iarsystems/bx-docker（GitHub）", url: "https://github.com/IARSystems/bx-docker", note: "在 Docker 容器中使用 IAR Build Tools 的官方範例" },
      { title: "IAR and Qt（官方說明）", url: "https://www.iar.com/about/corporate-governance/qt-info-stakeholders", note: "IAR 成為 Qt Group 子公司後的營運說明" },
      { title: "IAR 線上文件首頁（EWARM 10.10.x）", url: DOCS, note: "依產品與版本切換" },
    ],
    toVerify: ["各版本 iarbuild 支援的 opmode（-compdb / -jsondb / -ninja 等是新版功能）", "IAR Build Tools 在 Linux 的產品名稱、支援架構與 CI 授權方式（授權模式正在轉變）", "EW IDE 在 Linux 的原生支援範圍（官方頁面寫支援，需確認版本）"],
  },

  // ───────────────────────────────────────────── t5-compiler
  {
    id: "t5-compiler",
    objectives: [
      "說出 IAR C/C++ Compiler for Arm 的最佳化等級（None / Low / Medium / High balanced / speed / size）與對應命令列 -O 參數",
      "理解多檔編譯（--mfc）、size vs speed 對函式庫變體選擇的影響",
      "認識 IAR extended keywords 與 pragma（__no_init、__ramfunc、__root、__weak、#pragma location、@ 等）的用途",
      "知道影響 ABI/資料布局的選項（例如 --enum_is_int）必須全專案一致",
    ],
    concept: `
#### 最佳化等級（EWARM 官方 -O 選項）
| 命令列 | IDE 等級 | 說明 |
|---|---|---|
| \`-On\` | None | 最佳除錯支援；所有非 static 變數在整個 scope 都「活著」 |
| \`-Ol\` | Low | **預設等級**（未指定時） |
| \`-Om\` | Medium | |
| \`-Oh\` | High, balanced | 只寫 \`-O\` 不帶參數時等同此級 |
| \`-Ohs\` | High, favoring speed | |
| \`-Ohz\` | High, favoring size | |

官方文件特別指出：None 與 Low 執行的最佳化相同，差別在 None 讓變數在整個 scope 都保持存在（更好除錯）。另外在 \`-Ohs\` / \`-Ohz\` 時，編譯器會輸出 AEABI 屬性，讓 linker 從 DLIB 函式庫中挑選**較快或較小的函式變體**（例如 Cortex-M0 用 \`-Ohz\` 會選較小的整數除法例程）。

#### 多檔編譯（Multi-file compilation）
\`--mfc\` 讓編譯器把命令列上的多個原始檔**當成一個單元**編譯，強化跨函式（interprocedural）最佳化 —— 概念上類似 GCC 的 LTO 帶來的效果，但機制不同。可搭配「丟棄未使用的 public 函式」選項。

#### Extended keywords 與 pragma（Arm 版常見）
- \`__no_init\`：變數不在啟動時初始化（例如保存重開機前的資料）。
- \`__ramfunc\`：函式放在 RAM 執行（例如 flash 寫入期間、或追求速度）。
- \`__root\`：即使沒被參照，也不要被 linker 移除。
- \`__weak\`：弱符號（可被同名強符號取代）。
- \`__packed\`：取消結構對齊填充。
- \`#pragma location = "SECTION"\` 或 \`@ "SECTION"\` / \`@ 0x20000000\`：指定 section 或絕對位址。
- \`#pragma optimize=...\`：針對單一函式調整最佳化。
- \`#pragma diag_suppress=Pe177\`：抑制特定診斷。
- \`intrinsics.h\`：\`__disable_interrupt()\`、\`__enable_interrupt()\`、\`__DSB()\` 等 intrinsic。
- 使用 extended keywords 需開啟語言擴充（\`-e\`，IDE 預設通常開啟）。

另外，新版 IAR Arm 編譯器**支援部分 GCC 風格 \`__attribute__\`**（官方 release notes 列出 noinit、nonnull、hot/cold、cleanup 等），以及一組 GCC built-in 函式 —— 這讓開源 / SDK 程式碼更容易移植，但**不是全部支援**，要查該版本的清單。

#### 影響 ABI / 資料布局的選項
\`--enum_is_int\`：強制所有 enum 至少 4 bytes。官方文件提醒：**使用某 enum 型別的每個檔案都必須用相同設定編譯**。不一致會造成結構布局不同 —— 這是 GCC↔IAR 移植與「單檔覆寫」問題的經典來源。IAR 也有 runtime model attributes（\`#pragma rtmodel\`）與 AEABI 屬性，讓 linker 檢查模組是否以相容設定編譯。
`,
    terms: [
      { en: "Optimization level", zh: "最佳化等級", note: "IAR Arm：-On/-Ol/-Om/-Oh/-Ohs/-Ohz" },
      { en: "Multi-file compilation (--mfc)", zh: "多檔編譯", note: "多個原始檔一起編譯，強化跨函式最佳化" },
      { en: "Extended keyword", zh: "擴充關鍵字", note: "__no_init、__ramfunc、__root、__weak…" },
      { en: "Pragma directive", zh: "編譯指示", note: "#pragma location / optimize / diag_suppress" },
      { en: "Intrinsic function", zh: "內建函式", note: "intrinsics.h，例如 __disable_interrupt()" },
      { en: "DLIB runtime library", zh: "IAR 的 C/C++ 執行期函式庫", note: "有多種 library configuration" },
      { en: "Runtime model attribute", zh: "執行期模型屬性", note: "linker 用來檢查模組相容性" },
      { en: "AEABI", zh: "Arm 嵌入式 ABI", note: "跨工具鏈 object 相容的基礎" },
    ],
    diagram: {
      title: "From source to optimized code in IAR",
      mermaid: `flowchart LR
  S["main.c + dsp.c"] -->|"iccarm -Ohs --mfc"| C["Compiler<br/>(interprocedural opts)"]
  C --> O["object files<br/>+ AEABI attributes<br/>+ runtime model attrs"]
  O --> L["ILINK"]
  D["DLIB library<br/>(fast / small variants)"] --> L
  L -->|"checks module consistency"| E["app.out"]`,
      caption: "-Ohs/-Ohz 的意圖會透過 AEABI 屬性傳給 linker，影響挑選的函式庫變體。",
    },
    code: [
      {
        title: "常用 extended keywords / pragma（EWARM）",
        lang: "c",
        code: `#include <intrinsics.h>
#include <stdint.h>

/* 重開機後保留：不被 startup 清零或初始化 */
__no_init uint32_t g_reset_reason;

/* 放到指定 section（需在 .icf 中 place 該 section） */
#pragma location = ".fw_header"
__root const uint32_t g_fw_version = 0x00010203;   /* __root：不被 linker 移除 */

/* 絕對位址放置 */
__no_init volatile uint32_t g_shared_mailbox @ 0x2001FF00;

/* 在 RAM 執行：flash 擦寫期間仍可運作 */
__ramfunc void flash_program_word(uint32_t addr, uint32_t data);

/* 單一函式指定較高最佳化（其他檔案維持 -Ol） */
#pragma optimize = speed high
void fir_filter(const int16_t *x, int16_t *y, int n);

/* 弱符號：預設 handler，可被應用程式覆寫 */
__weak void board_error_hook(int code) { (void)code; }

void critical(void) {
  __istate_t s = __get_interrupt_state();
  __disable_interrupt();
  /* ... */
  __set_interrupt_state(s);
}`,
        note: "pragma optimize 的參數寫法、__istate_t 等 API 依版本可能不同，請以該版本 Development Guide 為準（見待查證）。",
      },
      {
        title: "命令列：比較 size vs speed",
        lang: "bash",
        code: `# 高最佳化，偏向大小
iccarm main.c --cpu Cortex-M4 -Ohz -o obj/main_size.o --list_dir=lst/
# 高最佳化，偏向速度 + 多檔編譯
iccarm main.c dsp.c --mfc --cpu Cortex-M4 -Ohs -o obj/app_speed.o
# 比較：看 linker map file 的模組大小，或用 ielfdumparm 檢視 section`,
        note: "--cpu 等參數拼法依版本，建議從 IDE 的 Build 訊息視窗複製實際的命令列。",
      },
      {
        title: "--enum_is_int 不一致造成的布局差異",
        lang: "c",
        code: `typedef enum { MODE_A, MODE_B } mode_t;   /* 預設：可能是 1 byte */

typedef struct {
  mode_t   mode;     /* 檔案 A（無 --enum_is_int）：1 byte  */
  uint8_t  flags;    /* 檔案 B（有 --enum_is_int）：4 bytes */
  uint16_t len;      /* → 兩邊對 flags/len 的 offset 不同！ */
} msg_t;`,
        note: "官方：若某檔案使用此選項，所有使用該 enum 型別的檔案都必須使用。",
      },
    ],
    analysis: `
#### 「預設是 Low」很重要
很多從 GCC 過來的工程師以為「沒設定 = 沒最佳化（-O0）」。IAR Arm 預設是 **Low**；要得到「最好除錯」需明確選 None。客戶抱怨「Debug 版看不到變數」時，先確認他是不是其實在 Low。

#### Size vs Speed 的取捨不只在編譯器
\`-Ohz\` 除了編譯器策略，還影響 linker 挑選 DLIB 的小型變體；\`-Ohs\` 反之。所以「只看單一 .o 大小」不能完整比較，要看**最終 link 後的 map file**。這也是做公平 benchmark 的重點（見 t2-linking、t5-migration）。

#### Keyword 的可攜性
\`__no_init\`、\`@\` 位址放置是 IAR 擴充，換工具鏈就不能編譯。好的做法是用 CMSIS 的 \`cmsis_compiler.h\` 巨集（\`__WEAK\`、\`__PACKED\`、\`__ALIGNED\`、\`__USED\`…）或自訂一層巨集隔離 —— 這同時是 FAE 協助客戶「從 GCC 移過來」與「降低被綁定疑慮」的論點。

#### 何時懷疑是編譯器問題
在下最佳化結論前，先排除：未定義行為（UB）、缺少 volatile、資料競爭、enum/對齊不一致、stack overflow。再做最小重現（minimal reproducer），以 \`#pragma optimize\` 對單一函式降級驗證，然後才往 IAR 技術支援升級（見 t3-compiler-bug、t6-support）。
`,
    cases: [
      {
        title: "Release（-Ohz）後感測器輪詢卡死",
        body: "客戶把 Release 改為 High/size 後，等待 ADC 完成的迴圈變成無窮迴圈。原因：狀態旗標由 ISR 設定但沒有宣告 volatile，高最佳化把讀取提到迴圈外。這不是編譯器 bug，修正為 volatile（或使用 atomic）即可。FAE 可以藉此說明：較高最佳化會「揭露」原本就存在的程式問題。",
      },
      {
        title: "Code size 超出 flash 2 KB",
        body: "產品功能增加後 flash 溢出。步驟：先看 map file 找出最大的模組 → 確認 printf 類函式庫配置（是否用了 full formatter）→ Release 改 -Ohz → 對熱點以外的檔案維持 size 取向 → 確認未使用的程式已被 linker 移除。最後在不改硬體的情況下省回空間。實際省下多少依專案而定，不應事先承諾數字。",
      },
    ],
    customerQs: [
      {
        q: "We set no optimization, but variables still show as unavailable in the debugger.",
        zh: "我們沒有設定最佳化，但除錯器裡變數仍然顯示不可用。",
        answer: "IAR Arm 編譯器未指定時預設是 Low，而不是 None。請在 Debug configuration 明確選 None（-On），變數會在整個 scope 內保持可見。也確認該檔案沒有被單獨覆寫成較高等級。",
      },
      {
        q: "Should we use high-speed or high-size optimization?",
        zh: "應該用 High speed 還是 High size？",
        answer: "取決於瓶頸：flash 緊就用 size，對時序敏感的熱點用 speed。常見做法是全專案 size，只對少數 DSP/通訊熱點檔案覆寫為 speed，再用 map file 與實測時間驗證。",
      },
      {
        q: "Does IAR support GCC __attribute__ syntax?",
        zh: "IAR 支援 GCC 的 __attribute__ 語法嗎？",
        answer: "新版 IAR Arm 編譯器支援部分 GCC 風格 attribute 與 built-in 函式，有助於移植開源程式碼，但不是全部。我會依你們使用的版本查官方支援清單；對不支援的部分，建議用 CMSIS 巨集抽象化。",
      },
    ],
    interviewQs: [
      {
        q: "How would you help a customer reduce code size?",
        zh: "你會如何協助客戶降低程式碼大小？",
        points: ["先量測：map file 找大戶", "最佳化策略：-Ohz + 熱點覆寫", "函式庫配置（printf/scanf formatter）", "移除未使用程式、避免不必要的 C++ 功能", "以數據驗證，不事先承諾數字"],
      },
      {
        q: "What are compiler extensions, and what are the risks of using them?",
        zh: "編譯器擴充是什麼？使用的風險？",
        points: ["例：__no_init、@ 位址、#pragma location", "好處：精準控制記憶體/行為", "風險：可攜性、工具鏈綁定", "以巨集/CMSIS 隔離"],
      },
    ],
    quiz: [
      { id: "t5c-q1", skill: "compiler", q: "IAR C/C++ Compiler for Arm 在未指定 -O 時的預設最佳化等級是？", options: ["None", "Low", "Medium", "High balanced"], answer: 1, explain: "官方 -O 選項文件：未指定時使用 Low。" },
      { id: "t5c-q2", skill: "compiler", q: "只寫 `-O` 不帶參數時，IAR Arm 使用哪個等級？", options: ["None", "Low", "High, balanced", "High, favoring size"], answer: 2, explain: "官方說明：只用 -O 不帶參數 = High balanced。" },
      { id: "t5c-q3", skill: "compiler", q: "IAR 中 None 與 Low 的主要差異是？", options: ["None 完全不做任何最佳化", "最佳化相同，但 None 讓非 static 變數在整個 scope 都存在", "Low 會 inline 所有函式", "None 不產生 debug info"], answer: 1, explain: "官方註解：Low 的最佳化在 None 也會執行，差別在變數生命週期。" },
      { id: "t5c-q4", skill: "linker", q: "使用 -Ohz 時，除了編譯器策略，還可能影響什麼？", options: ["linker 從 DLIB 選擇較小的函式變體", "flash 時脈", "debugger driver", "沒有其他影響"], answer: 0, explain: "編譯器輸出 AEABI 屬性，linker 據此選擇 small/fast 變體。" },
      { id: "t5c-q5", skill: "cpp", q: "使用 --enum_is_int 的正確注意事項是？", options: ["只需要對 main.c 使用", "所有使用該 enum 型別的檔案都必須用相同設定編譯", "只影響 C++", "只影響除錯資訊"], answer: 1, explain: "否則結構布局不一致；官方文件明確提醒。" },
      { id: "t5c-q6", skill: "linker", q: "要讓一個沒被任何程式參照的常數（如韌體版本資訊）保留在映像中，IAR 常用？", options: ["static", "__root", "inline", "register"], answer: 1, explain: "__root 讓 linker 不移除該符號（或在 linker 用 keep/--keep）。" },
      { id: "t5c-q7", skill: "compiler", q: "--mfc 的作用是？", options: ["產生 map file", "多檔編譯，增強跨函式最佳化", "啟用 MISRA 檢查", "產生 hex 檔"], answer: 1, explain: "Multi-file compilation：多個原始檔視為一個編譯單元。" },
    ],
    reading: [
      { title: "-O（EWARM 9.70.x 編譯器選項）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/compiler-options/descriptions-of-compiler-options/-o.html", note: "最佳化等級與 DLIB 變體選擇" },
      { title: "--enum_is_int（EWARM 10.10.x）", url: "https://docs.iar.com/ewarm/10.1x/en/iar-c-c---development/compiler-options/descriptions-of-compiler-options/--enum_is_int.html", note: "enum 大小與一致性要求" },
      { title: "Checking module consistency（EWARM 10.10.x）", url: "https://docs.iar.com/ewarm/10.1x/en/iar-c-c---development/linking-your-application/checking-module-consistency.html", note: "runtime model attributes 與 #pragma rtmodel" },
      { title: "Supported GCC built-in functions（EWARM 9.70.x）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/intrinsic-functions/supported-gcc-built-in-functions.html", note: "支援的 GCC built-in 清單" },
      { title: "Basic project configuration（EWARM 9.70.x）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/developing-embedded-applications/basic-project-configuration.html", note: "處理器、最佳化、runtime 環境設定概觀" },
    ],
    toVerify: ["#pragma optimize 的確切參數寫法（例如 speed/size/balanced 與 high/medium/low 組合）", "__istate_t / __get_interrupt_state 等 intrinsic 名稱", "各版本支援的 GCC __attribute__ 清單", "iccarm --cpu / --list_dir 等參數的精確拼法"],
  },

  // ───────────────────────────────────────────── t5-ilink
  {
    id: "t5-ilink",
    objectives: [
      "說明 ILINK 的角色：符號解析、section 放置、初始化設定、未使用程式移除",
      "讀懂一份典型 ICF：define memory / region / block、place in / place at、initialize by copy、do not initialize",
      "使用 ILINK 的 stack usage analysis 與 `check that` 在 link 時驗證 stack 大小",
      "使用 ielftool 進行 fill、checksum 與格式轉換",
    ],
    concept: `
ILINK（Arm 版為 \`ilinkarm\`）是 IAR 的 linker，輸入與輸出都是業界標準的 **ELF/DWARF**。它的行為由 **ICF（IAR linker configuration file）** 描述 —— 對應 GNU ld 的 linker script，但語法與思路不同（基礎比較見 t2-linker-script）。

#### ICF 的核心概念
1. **memory 與 region**：\`define memory mem with size = 4G;\` 宣告位址空間，\`define region ROM_region = mem:[from 0x08000000 to 0x0807FFFF];\` 劃出區段。
2. **block**：把 section 群組起來並給大小/對齊，例如 \`define block CSTACK with alignment = 8, size = 0x800 { };\`。Stack 與 heap 通常就是 block。
3. **放置**：\`place at address mem:0x08000000 { readonly section .intvec };\`（固定位址）、\`place in ROM_region { readonly };\`（交給 linker 排）。
4. **初始化**：\`initialize by copy { readwrite };\` 讓 linker 自動產生「從 ROM 複製初值到 RAM」的資訊；\`do not initialize { section .noinit };\` 對應 \`__no_init\`。
5. **保留**：\`keep { section .fw_header };\` 或 \`__root\` / \`--keep\` 防止被移除。

#### ILINK 預設移除未使用的程式與資料
不需要 GCC 的 \`-ffunction-sections -Wl,--gc-sections\`。但反過來說：只被組語或外部工具參照、或「放在特定位址給 bootloader 讀」的資料，必須用 keep/__root 保留。

#### Stack usage analysis（官方功能）
- 啟用：IDE 中 *Linker > Advanced > Enable stack usage analysis*；命令列 \`--enable_stack_usage\`，並產生 map file（\`--map\`）。
- 結果：map file 會多一個 stack usage 章節，列出每個 call graph root 最深的呼叫鏈。
- 補充資訊：函式指標的可能目標用 \`#pragma calls\` 或 stack usage control file（.suc，\`--stack_usage_control\`）提供；ISR/RTOS task 需標記為 call graph root；遞迴需給最大深度。
- 自動檢查：在 ICF 加入 \`check that size(block CSTACK) >= maxstack("Program entry") + totalstack("interrupt") + 100;\`，不足時 link 失敗。

#### ielftool：link 之後的處理
\`ielftool [options] inputfile outputfile\`：先處理所有 \`--fill\`，再依序處理 \`--checksum\`；也能轉成 hex / bin 等格式。checksum 的存放位置可用 linker 選項 \`--place_holder\` 預留。
`,
    terms: [
      { en: "ILINK", zh: "IAR linker", note: "Arm 版執行檔為 ilinkarm" },
      { en: "ICF (linker configuration file)", zh: "IAR linker 設定檔", note: "相當於 GNU ld 的 linker script" },
      { en: "Region / Block", zh: "記憶體區段 / 區塊", note: "block 可帶大小與對齊（stack、heap）" },
      { en: "initialize by copy", zh: "以複製方式初始化", note: "RAM 初值由 ROM 複製" },
      { en: "do not initialize", zh: "不初始化", note: "對應 __no_init" },
      { en: "Stack usage analysis", zh: "Stack 使用量分析", note: "link 時計算最大 stack 深度" },
      { en: "Call graph root", zh: "呼叫圖根節點", note: "main、ISR、RTOS task 等沒有被呼叫的入口" },
      { en: "ielftool", zh: "IAR ELF 工具", note: "fill、checksum、格式轉換" },
    ],
    diagram: {
      title: "ILINK inputs and outputs",
      mermaid: `flowchart LR
  O["*.o (ELF)"] --> L["ILINK (ilinkarm)"]
  A["*.a libraries / DLIB"] --> L
  ICF["app.icf<br/>memory · regions · blocks<br/>place · initialize · keep"] --> L
  SUC[".suc stack usage control"] -.-> L
  L --> OUT["app.out (ELF/DWARF)"]
  L --> MAP["app.map<br/>placement · sizes · stack usage"]
  OUT --> T["ielftool<br/>--fill / --checksum"]
  T --> HEX["app.hex / app.bin"]`,
    },
    code: [
      {
        title: "精簡版 ICF（Cortex-M，概念示意）",
        lang: "icf",
        code: `define memory mem with size = 4G;
define region ROM_region = mem:[from 0x08000000 to 0x0807FFFF];
define region RAM_region = mem:[from 0x20000000 to 0x2001FFFF];

define block CSTACK with alignment = 8, size = 0x0800 { };
define block HEAP   with alignment = 8, size = 0x0400 { };

initialize by copy { readwrite };
do not initialize  { section .noinit };

place at address mem:0x08000000 { readonly section .intvec };
place in ROM_region { readonly };
place in RAM_region { readwrite, block CSTACK, block HEAP };

keep { section .fw_header };

/* link 時檢查 stack 是否足夠（需啟用 stack usage analysis） */
check that size(block CSTACK) >= maxstack("Program entry") + totalstack("interrupt") + 100;`,
        note: "實務上請以 IAR 安裝目錄 config/ 下的裝置範本或廠商 SDK 提供的 .icf 為起點修改。",
      },
      {
        title: "Stack usage control file（.suc）",
        lang: "text",
        code: `// ISR 與 RTOS task 不被任何函式呼叫，需宣告為 call graph root
call graph root [interrupt]: SysTick_Handler, USART1_IRQHandler;
call graph root [task]: sensor_task, comm_task;

// 函式指標的可能目標
possible calls dispatch: cmd_read, cmd_write, cmd_erase;

// 遞迴最大深度
max recursion depth parse_json: 8;`,
        note: "也可在原始碼中用 #pragma calls / #pragma call_graph_root。",
      },
      {
        title: "ielftool：填充 + CRC32（官方文件範例形式）",
        lang: "bash",
        code: `# 先 fill 0xFF，再對同一範圍計算 4 bytes CRC32，存到符號 __checksum
ielftool my_input.out my_output.out --fill 0xFF;0-0xFF --checksum __checksum:4,crc32;0-0xFF

# IDE Build Actions（post-build）中常見的寫法
$TOOLKIT_DIR$\\bin\\ielftool "$TARGET_PATH$" "$TARGET_PATH$" --fill 0xFF;0x08000000-0x0807FFFB --checksum __checksum:4,crc32;0x08000000-0x0807FFFB --verbose

# linker 預留 checksum 空間
--place_holder __checksum,4,.checksum,4`,
        note: "ielftool 需要未 strip 的 ELF；如需 strip 請改用 ielftool 的 --strip。",
      },
    ],
    analysis: `
#### 為什麼 link 時算 stack 很有價值
Stack overflow 在嵌入式中常表現為「隨機」當機或 HardFault，很難重現。ILINK 的靜態分析在 build 時就能指出最深的呼叫鏈，加上 \`check that\` 可以讓 CI 在 stack 不足時直接失敗 —— 這是賣點，也是 FAE 在 PoV 中很好展示的功能。但要誠實說明限制：函式指標、遞迴、組語、非 IAR 編譯的模組都需要額外資訊，否則結果不完整（linker 會發警告）。

#### Map file 是 FAE 的第一手證據
大小、位置、哪個模組拉進了哪個函式庫函式、stack usage 章節都在 map file。客戶問「為什麼變大了」「為什麼 overflow」時，先要 map file。

#### Checksum 範圍的陷阱
若 checksum 範圍包含向量表，而某些 MCU 的 boot ROM 又要求向量表中有特定的檢查值，兩者會互相依賴。IAR 知識庫有針對特定 MCU 的建議作法（分開計算或調整起始位址）。教訓：checksum 範圍與存放位置要在設計時就定義清楚。
`,
    cases: [
      {
        title: "RTOS 專案偶發 HardFault",
        body: "客戶的 FreeRTOS 專案每隔幾小時當機。啟用 stack usage analysis 並為各 task 建立 .suc 的 call graph root 後，發現通訊 task 在錯誤處理路徑上呼叫了使用大型區域 buffer 的 log 函式，最深路徑超過 task stack 配置。調整 buffer 為 static 並增加 stack 後解決，並把 check that 類規則加入 CI。",
      },
      {
        title: "bootloader 讀不到韌體版本",
        body: "版本結構只被 bootloader（另一個專案）讀取，應用程式本身沒有參照，被 ILINK 當成未使用而移除。用 __root 或 ICF 的 keep 保留，並以 place at 固定位址，問題解決。",
      },
    ],
    customerQs: [
      {
        q: "The linker says our RAM region is full, but we have plenty of RAM on the chip.",
        zh: "Linker 說 RAM 區已滿，但晶片上 RAM 還很多。",
        answer: "先看 ICF 中 RAM_region 的範圍是否涵蓋所有 RAM bank（有些 MCU 有不連續的 SRAM/CCM/TCM），再看 map file 中哪些 block（stack、heap、大陣列）佔用最多。必要時新增 region 並把特定資料放過去。",
      },
      {
        q: "How can we be sure our stack is large enough?",
        zh: "怎麼確定 stack 夠大？",
        answer: "啟用 ILINK 的 stack usage analysis 並產生 map file，為 ISR 與 RTOS task 補上 call graph root、為函式指標補上 possible calls，再在 ICF 加 check that 讓不足時 link 失敗。執行期也可以用 C-SPY 的 stack 視窗做交叉驗證。",
      },
      {
        q: "Can the toolchain generate a CRC of the firmware image for us?",
        zh: "工具鏈能幫我們算韌體映像的 CRC 嗎？",
        answer: "可以，用 ielftool 的 --fill 與 --checksum（IDE 中在 Linker > Checksum 或 Build Actions 設定）。要先決定演算法、範圍、填充值與存放位置，並在應用程式中用相同參數計算比對。",
      },
    ],
    interviewQs: [
      {
        q: "How does the IAR linker configuration differ from a GNU linker script?",
        zh: "IAR ICF 與 GNU linker script 有何不同？",
        points: ["ICF 宣告 region/block，交給 linker 排列", "initialize by copy 自動處理初值複製", "ILINK 預設移除未使用的程式", "GNU ld 較多手動控制與位置計數器", "兩者概念可對應：MEMORY↔region、SECTIONS↔place"],
      },
      {
        q: "How would you detect a stack overflow before it happens in the field?",
        zh: "如何在出貨前偵測 stack overflow？",
        points: ["靜態：linker stack usage analysis", "動態：stack 填充圖樣（watermark）、MPU guard", "RTOS 的 stack overflow hook", "把檢查放進 CI"],
      },
    ],
    quiz: [
      { id: "t5i-q1", skill: "linker", q: "IAR 中與 GNU ld linker script 角色相當的檔案是？", options: [".ewp", ".icf", ".mac", ".ewd"], answer: 1, explain: "ICF = IAR linker configuration file。" },
      { id: "t5i-q2", skill: "linker", q: "ICF 中 `initialize by copy { readwrite };` 的意義是？", options: ["把 readwrite 資料複製到 flash", "linker 安排在啟動時由 ROM 複製初值到 RAM", "清除所有 RAM", "禁止初始化"], answer: 1, explain: "這取代了 GCC 專案中 startup 手寫的 .data 複製迴圈。" },
      { id: "t5i-q3", skill: "linker", q: "啟用 ILINK stack usage analysis 後，結果主要出現在？", options: ["編譯器 list file", "linker map file 的 stack usage 章節", "C-SPY Terminal I/O", "不會輸出"], answer: 1, explain: "官方：map file 會加入 stack usage 章節。" },
      { id: "t5i-q4", skill: "linker", q: "為什麼要為 ISR 指定 call graph root？", options: ["讓 ISR 更快", "ISR 不被其他函式呼叫，linker 需要知道它是分析的起點", "MISRA 要求", "否則無法編譯"], answer: 1, explain: "未被呼叫且未知為 root 的函式會讓分析不完整並產生警告。" },
      { id: "t5i-q5", skill: "linker", q: "ielftool 處理 --fill 與 --checksum 的順序是？", options: ["依命令列順序交錯處理", "先處理所有 fill，再依序處理 checksum", "先 checksum 再 fill", "只能二選一"], answer: 1, explain: "官方文件：先處理所有 fill 選項，再由左至右處理 checksum。" },
      { id: "t5i-q6", skill: "linker", q: "從 GCC 移植到 IAR 時，`-ffunction-sections -Wl,--gc-sections` 通常？", options: ["必須用 IAR 等效選項開啟", "不需要，ILINK 預設會移除未使用的 section", "會造成錯誤", "只能在 Release 使用"], answer: 1, explain: "ILINK 預設移除未參照的程式與資料；需要保留的要用 keep/__root。" },
    ],
    reading: [
      { title: "Stack usage analysis（EWARM 10.10.x）", url: "https://docs.iar.com/ewarm/10.1x/en/iar-c-c---development/linking-using-ilink/stack-usage-analysis.html", note: "啟用步驟、.suc、check that" },
      { title: "The IAR ELF Tool — ielftool（EWARM 9.70.x）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/iar-utilities/the-iar-elf-tool-ielftool.html", note: "fill / checksum / 範圍語法" },
      { title: "Master C/C++ stack usage（IAR 文章）", url: "https://www.iar.com/knowledge/learn/stack-usage-analysis", note: "#pragma calls、call_graph_root、.suc 的實例" },
      { title: "The IAR build tools — an overview（EWARM 9.70.x）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/introduction-to-the-iar-build-tools/the-iar-build-tools-an-overview.html", note: "ILINK 與各 ELF 工具總覽" },
    ],
    toVerify: ["ICF 範例中 check that 語法與 maxstack/totalstack 參數（以使用版本為準）", ".suc 指令（possible calls / max recursion depth）的精確語法", "--place_holder 參數順序"],
  },

  // ───────────────────────────────────────────── t5-cspy
  {
    id: "t5-cspy",
    objectives: [
      "說明 C-SPY 的架構：IDE 前端 + driver（Simulator 或硬體 probe driver）",
      "認識常用除錯視窗：Watch / Live Watch、Call Stack、Disassembly、Register、Memory、Stack",
      "理解 C-SPY macro（.mac）的用途，例如在 reset 後設定硬體",
      "能用 cspybat 在命令列 / CI 中執行測試",
    ],
    concept: `
**C-SPY** 是 IAR Embedded Workbench 內建的除錯器。架構上分成通用的除錯前端與 **driver**：
- **Simulator**：不需硬體，模擬指令集（可做演算法驗證、單元測試、CI）。
- **硬體 driver**：IAR 自家 **I-jet** 系列、以及 J-Link、ST-LINK、CMSIS-DAP 等第三方 probe（支援清單依架構/版本）。

#### 常用功能
- **中斷點**：程式中斷點、資料中斷點（data breakpoint，等同 watchpoint）、條件與次數；flash 上需要硬體中斷點或 flash breakpoint 機制。
- **Watch / Live Watch**：Live Watch 可在目標執行中讀取變數（依硬體能力）。
- **Call Stack、Disassembly、Register、Memory、Symbolic memory**。
- **Stack 視窗**：顯示 stack 使用情形（可與 ILINK 靜態分析互相驗證）。
- **Trace / profiling / code coverage**：依 probe 與晶片能力（SWO、ETM、ETB/MTB）。官方 cspybat 選項中可見 \`--drv_trace_settings={Auto|ETB|ETM|SWO|None}\`（I-jet driver）。
- **RTOS awareness**：顯示 task、queue 等 RTOS 物件（支援的 RTOS 依版本）。
- **Power debugging**：搭配 I-jet 的功耗相關除錯功能（產品宣傳重點之一，細節依型號）。

#### C-SPY macro（.mac）
類 C 語法的腳本，可定義 setup 函式在特定時機自動執行，例如 reset 後設定時脈、關閉 watchdog、初始化外部 SDRAM 以便下載程式。常見名稱如 \`execUserReset()\`、\`execUserPreload()\`（以手冊為準）。

#### cspybat：命令列除錯
C-SPY 每次在 IDE 啟動時，會在 \`settings/\` 目錄產生 \`project.config.cspy.bat\` 與兩個參數檔（\`general.xcl\`、\`driver.xcl\`），內容與 IDE 設定一致。直接執行該 bat 就能在命令列跑程式 —— 非常適合**在 Simulator 上跑自動化測試**。語法核心：\`cspybat [options] --backend [driver options]\`，\`--backend\` 之後的參數交給 driver。
`,
    terms: [
      { en: "C-SPY Debugger", zh: "IAR 除錯器", note: "內建於 IAR Embedded Workbench" },
      { en: "C-SPY driver", zh: "除錯驅動", note: "Simulator 或特定 probe" },
      { en: "I-jet", zh: "IAR 自家除錯探針", note: "支援 trace、power debugging 等（依型號）" },
      { en: "Live Watch", zh: "即時監看", note: "執行中讀取變數" },
      { en: "Data breakpoint", zh: "資料中斷點", note: "存取特定位址時停止（類 watchpoint）" },
      { en: "C-SPY macro (.mac)", zh: "C-SPY 巨集", note: "自動化除錯設定、reset 後初始化" },
      { en: "cspybat", zh: "C-SPY 命令列工具", note: "批次執行、CI 測試" },
      { en: "RTOS awareness", zh: "RTOS 感知", note: "顯示 task / queue 等物件" },
    ],
    diagram: {
      title: "C-SPY architecture",
      mermaid: `flowchart LR
  IDE["IAR EW IDE<br/>or VS Code (IAR C-SPY Debug)"] --> CORE["C-SPY debugger core<br/>breakpoints · watch · call stack<br/>macros (.mac) · RTOS plugins"]
  BAT["cspybat (CLI)"] --> CORE
  CORE --> SIM["Simulator driver"]
  CORE --> HW["Hardware drivers<br/>I-jet · J-Link · ST-LINK · CMSIS-DAP"]
  HW --> T["Target MCU<br/>SWD/JTAG · SWO/ETM trace"]`,
    },
    code: [
      {
        title: "C-SPY setup macro 範例（概念）",
        lang: "c",
        code: `// board.mac —— 在 Debugger > Setup > Setup macros 指定
execUserReset()
{
  __message "Reset: disable watchdog, set clock for download";
  __writeMemory32(0x0000AAAA, 0x40003000, "Memory");  // 示意：寫 watchdog key
  // 外部 SDRAM 初始化等
}

execUserPreload()
{
  __message "Before download";
}`,
        note: "macro 內建函式名稱（__writeMemory32 等）與 setup 函式名稱請以 C-SPY Debugging Guide 為準。暫存器位址為示意。",
      },
      {
        title: "用 cspybat 在 Simulator 跑自動化測試",
        lang: "bash",
        code: `# 1) 在 IDE 啟動一次 C-SPY，settings/ 下會產生：
#    project.Debug.cspy.bat, project.Debug.general.xcl, project.Debug.driver.xcl
# 2) 直接執行（可用輸入重新導向提供 stdin）
settings\\project.Debug.cspy.bat < test_input.txt

# 等效的完整形式（IAR 文章中的例子）
cspybat -f settings\\project.Debug.general.xcl --backend -f settings\\project.Debug.driver.xcl

# 常用：限制時間、避免無限迴圈卡住 CI（參數依版本）
#   --timeout <ms>   --silent   --plugin <terminal I/O plugin>`,
        note: "cspybat 會回傳狀態碼，可在 batch / CI 腳本中檢查。",
      },
    ],
    analysis: `
#### 為什麼 Simulator 對 CI 很重要
不需要硬體 → 可以在每次 commit 跑單元測試；搭配 code coverage 輸出（cspybat 有 \`--code_coverage_file\` 類選項）可以產生覆蓋率證據。限制：Simulator 不模擬所有周邊時序，與硬體互動的程式仍需 HIL（hardware-in-the-loop）測試。

#### 「Debugger 顯示的變數不對」的常見原因
1. 最佳化等級（IAR 預設 Low，而非 None）→ 變數被放進暫存器或消失。
2. 讀到的是舊的 ELF（重新 build 但沒重新下載）。
3. Live Watch 在不支援背景讀取的情況下顯示的是上次停止時的值。
4. 快取 / DMA：CPU cache 與實際記憶體不一致（Cortex-M7 等）。
這些都是典型 FAE 支援題目，請搭配 t3-symbols 複習。

#### macro 是現場支援的利器
很多「下載失敗」「一 reset 就跑飛」的問題，根源是 watchdog、時脈、外部記憶體在除錯器下載前沒有設定好。一段幾行的 .mac 往往就能解決，也能做成知識庫文章分享給其他客戶。
`,
    cases: [
      {
        title: "下載到外部 SDRAM 失敗",
        body: "客戶的 Cortex-M7 程式要放在外部 SDRAM 執行，但 C-SPY 下載時驗證失敗。原因：reset 後 SDRAM 控制器尚未初始化。在 setup macro 的 reset 後階段加入 FMC/SDRAM 初始化暫存器寫入後即可下載。之後把 macro 與說明寫成內部知識庫文章。",
      },
      {
        title: "在 CI 中執行演算法測試",
        body: "團隊想在每次 commit 驗證定點數濾波器結果。做法：建立測試專案，Debug configuration 用 Simulator driver，測試程式透過 Terminal I/O 輸出 PASS/FAIL；CI 呼叫 iarbuild 建置後執行 settings 中的 cspy.bat，解析輸出與回傳碼。注意：需確認 CI 機器上的授權方案允許此用法。",
      },
    ],
    customerQs: [
      {
        q: "Can we run unit tests without hardware?",
        zh: "可以不接硬體跑單元測試嗎？",
        answer: "可以用 C-SPY Simulator，並用 cspybat 在命令列執行（IDE 會在 settings 目錄產生現成的 batch 與參數檔）。與周邊時序相關的部分仍需實體硬體測試。",
      },
      {
        q: "Which debug probes does C-SPY support?",
        zh: "C-SPY 支援哪些除錯器？",
        answer: "除了 IAR 自家的 I-jet，也支援多種第三方 probe（例如 J-Link、ST-LINK、CMSIS-DAP），但支援清單依架構與版本而定。請告訴我你們的晶片型號與 probe，我查官方清單確認，包括 trace 功能是否可用。",
      },
      {
        q: "After reset, the program runs away before main(). How do I debug that?",
        zh: "Reset 後程式在 main() 之前就跑飛，怎麼除錯？",
        answer: "先把 Run to main 關掉，從 reset vector 開始單步；檢查向量表位置、初始 SP、時脈與 watchdog 設定。如果需要在下載前設定硬體，用 C-SPY setup macro。也可以在 HardFault handler 設中斷點並用 fault 相關暫存器分析（見 t3-hardfault）。",
      },
    ],
    interviewQs: [
      {
        q: "Describe how you would debug a problem that only happens on hardware, not in the simulator.",
        zh: "問題只在硬體上發生、Simulator 不會，你會如何除錯？",
        points: ["列出差異：時序、周邊、中斷、cache、時脈", "硬體中斷點 / 資料中斷點", "Trace（SWO/ETM）與 Live Watch", "最小重現與逐步排除"],
      },
      {
        q: "How can a debugger be used in automated testing?",
        zh: "除錯器如何用於自動化測試？",
        points: ["cspybat + Simulator", "以 Terminal I/O / 回傳碼判斷結果", "code coverage 輸出", "CI 整合與授權考量"],
      },
    ],
    quiz: [
      { id: "t5s-q1", skill: "debug", q: "C-SPY 中不需要任何硬體就能執行程式的是？", options: ["I-jet driver", "Simulator driver", "J-Link driver", "ST-LINK driver"], answer: 1, explain: "Simulator driver 模擬目標指令集。" },
      { id: "t5s-q2", skill: "debug", q: "IDE 啟動 C-SPY 時自動產生的命令列 batch 檔位於？", options: ["專案的 settings 目錄", "Windows 系統目錄", "Release 輸出目錄", "不會產生"], answer: 0, explain: "官方說明：$PROJ_DIR$\\settings 下的 project.config.cspy.bat 與 .xcl 檔。" },
      { id: "t5s-q3", skill: "debug", q: "cspybat 命令列中 `--backend` 的作用是？", options: ["指定輸出檔", "標記之後的參數交給 C-SPY driver", "啟用 trace", "結束程式"], answer: 1, explain: "--backend 是必要參數，後面接 driver 選項。" },
      { id: "t5s-q4", skill: "debug", q: "需要在程式下載前初始化外部 SDRAM，最適合的 C-SPY 功能是？", options: ["Live Watch", "Setup macro（.mac）", "Disassembly", "Code coverage"], answer: 1, explain: "Setup macro 可在 reset/下載前後自動執行。" },
      { id: "t5s-q5", skill: "debug", q: "客戶說 Watch 視窗中變數顯示不可用，最先確認？", options: ["是否換一台電腦", "最佳化等級與該檔案的選項覆寫", "probe 韌體版本", "Windows 語系"], answer: 1, explain: "IAR 預設 Low 最佳化，變數可能不在整個 scope 內存在。" },
      { id: "t5s-q6", skill: "debug", q: "「存取某個位址時停下」對應 C-SPY 的哪種功能？", options: ["Code breakpoint", "Data breakpoint", "Log breakpoint", "Trace start"], answer: 1, explain: "Data breakpoint 類似 GDB 的 watchpoint，通常使用硬體比較器。" },
    ],
    reading: [
      { title: "Using C-SPY in batch mode（C-SPY Debugging Guide，RX 版頁面，Arm 版結構相同）", url: "https://docs.iar.com/ewrx/5.2x/en/c-spy-debugging/the-c-spy-command-line-utility-cspybat/using-c-spy-in-batch-mode.html", note: "cspybat 與自動產生的 batch 檔" },
      { title: "--drv_trace_settings（EWARM 10.10.x cspybat 選項）", url: "https://docs.iar.com/ewarm/10.1x/en/c-spy-debugging/the-c-spy-command-line-utility-cspybat/reference-information-on-c-spy-command-line-options/--drv_trace_settings.html", note: "I-jet trace 介面設定" },
      { title: "從命令列自動化測試（IAR 文章，日文）", url: "https://www.iar.com/ja/knowledge/learn/automate-your-tests-using-the-iar-c-spy-command-line-utility", note: "cspybat 實例與輸入重新導向" },
      { title: "IAR C-SPY Debug（VS Code Marketplace）", url: "https://marketplace.visualstudio.com/items?itemName=iarsystems.iar-debug", note: "在 VS Code 使用 C-SPY" },
    ],
    toVerify: ["C-SPY setup macro 函式名稱（execUserReset / execUserPreload 等）與 __writeMemory32 參數", "EWARM 版本支援的第三方 probe 清單", "Power debugging 支援的 I-jet 型號", "cspybat --timeout / --code_coverage_file 在 EWARM 版本的確切名稱"],
  },

  // ───────────────────────────────────────────── t5-migration
  {
    id: "t5-migration",
    objectives: [
      "列出 GCC → IAR 專案移植的檢查清單：startup、linker script → ICF、attribute、section 放置、inline asm、syscalls",
      "辨識移植時容易造成「執行期行為改變」的差異（enum 大小、bit-field、wchar_t、未定義行為）",
      "能設計公平的 IAR vs GCC 比較（相同程式、相同函式庫設定、量測方法透明）",
      "以 FAE 角度提出降低移植風險的作法（CMSIS 抽象、雙工具鏈 CI、map file 對照）",
    ],
    concept: `
移植的目標有兩層：**(1) 能編譯、能連結**；**(2) 執行期行為與原本一致**。第二層才是困難所在。

#### 檢查清單
1. **Startup 檔**：GCC 版（\`startup_xxx.s\`，GNU 組語語法）不能直接用。改用晶片廠 / CMSIS 套件提供的 IAR 版 startup（通常位於 \`iar/\` 或 \`EWARM/\` 目錄）。IAR 的 runtime 會處理 .data 複製與 .bss 清零（依 ICF 的 initialize 設定）。
2. **Linker script → ICF**：MEMORY 對應 region；.text/.rodata → \`place in ROM_region { readonly }\`；.data/.bss → readwrite；stack/heap → block；\`.noinit\` → \`do not initialize\` + \`__no_init\`；\`KEEP()\` → \`keep\` 或 \`__root\`。
3. **\`__attribute__\`**：新版 IAR 支援部分 GCC attribute，但不保證全部。建議用 CMSIS \`cmsis_compiler.h\` 的巨集：\`__PACKED\`、\`__WEAK\`、\`__ALIGNED(x)\`、\`__USED\`、\`__STATIC_INLINE\`、\`__NO_RETURN\`。
4. **Section 放置**：\`__attribute__((section(".x")))\` → \`#pragma location = ".x"\` 或 \`@ ".x"\`，並在 ICF 放置。
5. **Inline assembly**：GNU extended asm 的語法（約束、clobber）與 IAR 不同；優先改用 CMSIS intrinsic（\`__DSB()\`、\`__get_PRIMASK()\`…）。
6. **System calls / 函式庫**：newlib 的 \`_write\`、\`_sbrk\`、\`_read\` 等 syscall 在 IAR DLIB 中改用 low-level 介面（例如 \`__write\`）；printf 的格式化能力由 library 設定決定。
7. **最佳化相關旗標**：\`-ffunction-sections -Wl,--gc-sections\` 不需要（ILINK 預設移除未使用的程式）；\`-fno-strict-aliasing\` 類旗標需要找對應或修正程式本身。
8. **語言標準**：確認 C/C++ 標準版本與擴充（\`-e\`）設定。

#### 會改變執行期行為的差異（高風險）
- **enum 大小**：IAR 預設讓 enum 用能容納範圍的最小型別；GCC（arm-none-eabi）在 AAPCS 下的行為依 \`-fshort-enums\` 等設定而定。與二進位資料格式、通訊協定、跨工具鏈 library 共用時必須一致（必要時用 \`--enum_is_int\`，且全專案一致）。
- **bit-field 配置、char 有無號、wchar_t 大小**：依 ABI 與選項，需逐項確認。
- **未定義行為**：原本在 GCC 上「剛好正常」的 UB，在另一個最佳化器下可能失效。這不是工具問題，但客戶會把它當成工具問題。
- **浮點設定**：硬體 FPU / ABI（hard/soft float）要與函式庫一致。

#### 公平比較（Fair comparison）
「IAR 比 GCC 小 X%」這類數字必須在**客戶自己的程式碼**上量測，並公開：編譯器版本、最佳化選項、函式庫設定（printf 能力、C++ 例外/RTTI）、是否計入 startup/向量表、量測方法（map file、實測 cycles）。比較時以同等功能為基準，不要拿 GCC -O0 對 IAR -Ohz。
`,
    terms: [
      { en: "Porting / Migration", zh: "移植", note: "從一個工具鏈轉到另一個" },
      { en: "CMSIS compiler abstraction", zh: "CMSIS 編譯器抽象層", note: "cmsis_compiler.h 巨集" },
      { en: "newlib syscalls", zh: "newlib 系統呼叫樁", note: "_write、_sbrk 等" },
      { en: "DLIB low-level interface", zh: "DLIB 底層 I/O 介面", note: "例如 __write，取代 newlib syscalls" },
      { en: "Inline assembly", zh: "內嵌組合語言", note: "語法依工具鏈不同" },
      { en: "Enum size", zh: "enum 大小", note: "影響結構布局與二進位相容" },
      { en: "Benchmark methodology", zh: "效能比較方法", note: "版本、選項、函式庫、量測方式透明" },
      { en: "Dual-toolchain CI", zh: "雙工具鏈 CI", note: "同一份程式碼用兩套工具鏈建置測試" },
    ],
    diagram: {
      title: "GCC → IAR migration flow",
      mermaid: `flowchart TB
  A["GCC project<br/>Makefile/CMake · .ld · startup.s · newlib"] --> B["1. 建立 IAR 專案 / CMake toolchain"]
  B --> C["2. 換 startup（vendor IAR 版）"]
  C --> D["3. .ld → .icf"]
  D --> E["4. attribute / section / asm → CMSIS 巨集 / pragma"]
  E --> F["5. syscalls → DLIB low-level I/O"]
  F --> G{"能 build？"}
  G -- 否 --> E
  G -- 是 --> H["6. 行為驗證：單元測試 · map file 對照 · enum/struct 布局檢查"]
  H --> I["7. 公平比較 code size / 速度"]`,
    },
    code: [
      {
        title: "用 CMSIS 巨集取代 GCC attribute",
        lang: "c",
        code: `#include "cmsis_compiler.h"   /* 依工具鏈自動對應 */

/* GCC 寫法 */
/* struct __attribute__((packed)) hdr { uint8_t t; uint32_t v; }; */
/* void __attribute__((weak)) HardFault_Handler(void); */

/* 可攜寫法 */
typedef __PACKED_STRUCT { uint8_t t; uint32_t v; } hdr_t;
__WEAK void HardFault_Handler(void) { for (;;) { } }
__ALIGNED(32) static uint8_t dma_buf[512];

/* 確認結構布局：兩個工具鏈都要通過 */
_Static_assert(sizeof(hdr_t) == 5, "hdr_t layout changed");`,
        note: "_Static_assert 是移植時非常便宜又有效的保險。",
      },
      {
        title: "Section 放置：GCC vs IAR",
        lang: "c",
        code: `#if defined(__ICCARM__)            /* IAR Arm 編譯器的預定義巨集 */
  #define PLACE_IN(sec)  _Pragma("location = \\"" sec "\\"")  /* 示意，需驗證 */
  #define NOINIT         __no_init
#elif defined(__GNUC__)
  #define PLACE_IN(sec)  __attribute__((section(sec)))
  #define NOINIT         __attribute__((section(".noinit")))
#endif

/* 簡單做法：分開寫 */
#if defined(__ICCARM__)
__no_init uint32_t boot_magic;
#else
uint32_t boot_magic __attribute__((section(".noinit")));
#endif`,
        note: "_Pragma 搭配字串串接的寫法在不同工具鏈有細節差異，建議以分開的 #if 區塊撰寫最穩。",
      },
      {
        title: "newlib _write → IAR DLIB __write（retarget printf 到 UART）",
        lang: "c",
        code: `#include <stddef.h>
extern void uart_putc(char c);

#if defined(__ICCARM__)
/* IAR DLIB low-level I/O：回傳寫出的 byte 數 */
size_t __write(int handle, const unsigned char *buf, size_t n) {
  if (buf == NULL) return 0;          /* flush 呼叫 */
  for (size_t i = 0; i < n; i++) uart_putc((char)buf[i]);
  return n;
}
#else
/* newlib */
int _write(int fd, char *buf, int n) {
  for (int i = 0; i < n; i++) uart_putc(buf[i]);
  return n;
}
#endif`,
        note: "__write 的確切原型與需要搭配的 library 設定（例如 Full/Normal library、semihosting 關閉）請以 Development Guide 為準。",
      },
      {
        title: "公平比較紀錄表（PoV 用）",
        lang: "text",
        code: `Project / commit:        sensor-fw @ a1b2c3d
Target:                  Cortex-M4F, 512 KB flash
GCC:                     arm-none-eabi-gcc <ver>, -Os, newlib-nano, -flto?  (Y/N)
IAR:                     EWARM <ver>, -Ohz, DLIB <config>, --mfc? (Y/N)
Same features?           printf float: Y/N  C++ exceptions: N  RTTI: N
Measured from:           linker map (text + rodata + data init)
Exclude:                 bootloader, vector table? (state clearly)
Result:                  GCC ____ bytes / IAR ____ bytes   (Δ ____ %)
Speed test:              DWT cycle counter, N=1000 runs, median
Notes / caveats:         ...`,
      },
    ],
    analysis: `
#### 移植的真正風險在「默默改變的行為」
編譯錯誤會主動告訴你哪裡要改；enum 大小、struct 布局、UB 不會。所以驗收標準必須包含：**單元測試在兩個工具鏈都通過**、**關鍵結構用 _Static_assert 鎖住大小**、**map file 對照**（大小、哪些模組消失或新增）。

#### FAE 的角色
1. 降低進入門檻：提供移植檢查清單、範例 ICF、startup 來源、常見錯誤對照表。
2. 協助第一個專案成功（PoV）：挑一個代表性模組，先求可量測的成果。
3. 誠實面對比較：讓客戶自己的數據說話；若某些情況 GCC 結果更好，說明原因與可調整的選項，比誇大更能建立信任。
4. 降低綁定疑慮：建議用 CMSIS 抽象層、保留雙工具鏈 CI，對客戶而言是風險管理，反而更容易接受導入。

#### IAR 官方資源
IAR 官網提到有專案移植工具 EWPtool（GitHub）與多個架構的 Migration Guide；IAR 的 Migration Guide 主要涵蓋「IAR 舊版 → 新版」的升級，GCC → IAR 則需搭配 Development Guide 中的相關章節與晶片廠範例。
`,
    cases: [
      {
        title: "通訊協定封包解析錯誤",
        body: "移植後與上位機通訊失敗。封包結構中有 enum 欄位，在 GCC 專案中使用了 -fshort-enums 以外的設定，與 IAR 的 enum 大小不同，導致後續欄位 offset 偏移。修正：協定結構改用固定寬度整數（uint8_t）存 enum 值，並加 _Static_assert 檢查大小。教訓：跨工具鏈或對外的二進位格式不要直接用 enum 型別。",
      },
      {
        title: "printf 沒有輸出",
        body: "GCC 專案透過 newlib 的 _write 把 printf 導到 UART。移植後 printf 沒有反應，因為 DLIB 不會呼叫 _write。改為實作 DLIB 的 __write 並確認 library 設定（關閉 semihosting）後恢復正常。",
      },
      {
        title: "比較結果引發爭議",
        body: "客戶內部評估得出「兩者差不多」的結論。檢查後發現 GCC 端用 -Os + newlib-nano（printf 不支援浮點），IAR 端使用了完整 printf formatter，功能不對等。調整為同等功能後重新量測，並把設定寫入比較報告。FAE 的價值在於讓比較方法透明可重現，而不是只給一個數字。",
      },
    ],
    customerQs: [
      {
        q: "How much effort is it to move our GCC project to IAR?",
        zh: "把 GCC 專案移到 IAR 要花多少工夫？",
        answer: "主要取決於：GCC 專屬語法的使用量（attribute、inline asm）、linker script 的複雜度、syscall/library 依賴、以及測試覆蓋率。我會先用檢查清單掃一遍程式碼並挑一個代表性模組試移植，給出有根據的估計，而不是一開始就承諾天數。",
      },
      {
        q: "Your marketing says smaller code. Will we really get that?",
        zh: "你們說程式碼會更小，我們真的會得到嗎？",
        answer: "結果因程式而異，最可靠的方式是在你們的程式碼上量測。我們可以一起定義比較方法：相同功能、相同函式庫能力、記錄版本與選項，用 map file 與實測時間比較。這樣得出的數字你們內部也能重現。",
      },
      {
        q: "Can we keep building with GCC as a fallback?",
        zh: "我們能保留 GCC 作為備案嗎？",
        answer: "可以，也是不錯的風險管理：用 CMSIS 巨集隔離工具鏈差異，CI 同時以兩套工具鏈建置與跑測試，就能及早發現依賴特定工具鏈或 UB 的程式碼。",
      },
    ],
    interviewQs: [
      {
        q: "What are the main challenges when migrating an embedded project from GCC to IAR?",
        zh: "從 GCC 移植到 IAR 的主要挑戰？",
        points: ["startup 與 linker script → ICF", "attribute / section / inline asm", "syscalls → DLIB", "行為差異：enum/bit-field/UB", "驗證：測試、_Static_assert、map file"],
      },
      {
        q: "How would you run a fair benchmark between IAR and GCC for a customer?",
        zh: "你會如何為客戶做 IAR 與 GCC 的公平比較？",
        points: ["客戶自己的程式碼", "對等的函式庫功能與選項", "記錄版本與量測方法", "size 與 speed 分開量測", "報告限制與適用範圍"],
      },
    ],
    quiz: [
      { id: "t5m-q1", skill: "compiler", q: "GCC 專案的 startup_xxx.s 移植到 IAR 時，建議做法是？", options: ["直接加入 IAR 專案", "改用晶片廠 / CMSIS 套件提供的 IAR 版 startup", "刪掉不用", "用 C 重寫所有內容"], answer: 1, explain: "組語語法不同；廠商通常提供 IAR 版本。" },
      { id: "t5m-q2", skill: "compiler", q: "newlib 的 `_write` 在 IAR DLIB 中通常對應？", options: ["__write", "_sbrk", "putchar 不需要任何處理", "__ramfunc"], answer: 0, explain: "DLIB 使用 low-level I/O 介面，例如 __write。" },
      { id: "t5m-q3", skill: "cpp", q: "下列哪個差異最可能「默默」改變執行期行為而不產生編譯錯誤？", options: ["inline asm 語法", "缺少 startup 檔", "enum 大小不同造成 struct 布局改變", "找不到 header"], answer: 2, explain: "布局變化不會報錯，卻會造成資料解析錯誤。" },
      { id: "t5m-q4", skill: "cpp", q: "為移植加上 `_Static_assert(sizeof(hdr_t) == 5, ...)` 的目的？", options: ["加速執行", "在編譯期鎖定結構大小，兩個工具鏈不一致時立即報錯", "減少 code size", "MISRA 規定"], answer: 1, explain: "便宜且有效的布局保險。" },
      { id: "t5m-q5", skill: "fae", q: "下列哪一個是不公平的比較？", options: ["相同程式、相同函式庫功能、記錄版本", "GCC -O0 對 IAR -Ohz", "size 與 speed 分開量測", "在客戶程式碼上量測"], answer: 1, explain: "最佳化等級不對等，結果沒有意義，也會傷害信任。" },
      { id: "t5m-q6", skill: "compiler", q: "要可攜地宣告弱符號，較好的做法是？", options: ["直接寫 __weak", "直接寫 __attribute__((weak))", "使用 CMSIS 的 __WEAK 巨集", "不要使用弱符號"], answer: 2, explain: "CMSIS 巨集會依工具鏈展開為對應語法。" },
    ],
    reading: [
      { title: "IAR C/C++ Development Guide for Arm（PDF）", url: "https://wwwfiles.iar.com/arm/webic/doc/ewarm_developmentguide.enu.pdf", note: "語言擴充、GCC 風格 attribute、runtime 環境" },
      { title: "IAR Embedded Workbench 產品頁（Project migration tools / EWPtool）", url: "https://www.iar.com/embedded-development-tools/iar-embedded-workbench", note: "官方移植工具與 Migration Guide 列表" },
      { title: "CMSIS-Core: Compiler Control（cmsis_compiler.h）", url: "https://arm-software.github.io/CMSIS_6/latest/Core/group__compiler__conntrol__gr.html", note: "__PACKED、__WEAK、__ALIGNED 等巨集" },
      { title: "--enum_is_int（EWARM 9.70.x）", url: "https://docs.iar.com/ewarm/9.7x/en/iar-c-c---development/compiler-options/descriptions-of-compiler-options/--enum_is_int.html", note: "enum 大小選項" },
    ],
    toVerify: ["IAR DLIB __write 的確切原型與 library configuration 需求", "IAR 預設 enum 大小規則與 arm-none-eabi-gcc 預設的精確差異（依 ABI 與選項）", "__ICCARM__ 下 _Pragma(\"location=...\") 的可用寫法", "EWPtool 支援的匯入來源（是否支援 GCC/Makefile 專案）", "CMSIS 文件連結路徑（CMSIS 6 版本頁面可能調整）"],
  },
];
