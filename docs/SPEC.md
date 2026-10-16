# 專案：IAR FAE Interview Preparation Academy

你是一位資深 Full-Stack Engineer、Embedded Systems Technical Trainer，以及 Technical Interview Coach。

請為我開發一個完整、可在本機執行的個人化學習網站，名稱為 **IAR FAE Interview Academy**。

這個網站的目的不是提供一般性的面試教學，而是協助我針對 **IAR Systems 台灣 FAE / Technical Support Specialist 職缺**，進行技術補強、英文能力訓練與模擬面試。

請直接實作可執行的網站，不要只提供設計文件或架構建議。

---

# 1. 我的個人背景

我是台灣的 Software Department Manager，具備多年軟體與嵌入式系統開發經驗。

主要技術背景：

- C / C++ / C#
- Embedded Linux
- FreeRTOS
- ARM-based SoC
- Xilinx Zynq / UltraScale+ MPSoC
- FPGA SoC 軟硬體整合
- SSD / SD Controller Firmware
- NAND Flash 與儲存系統
- Windows Desktop Application
- Linux User-space Application
- Make / CMake / GCC 等開發工具
- 軟體團隊管理、技術問題分析與跨團隊協作

我的優勢是嵌入式系統開發、系統整合、Debugging、產品開發及軟體管理。

但我有以下需要補強的地方：

**A. Toolchain 深度不足**

過去使用 Compiler、Linker、Debugger，主要是為了讓產品能成功建置與正常運作，較少深入研究：

- Compiler Internal Behavior
- Compiler Optimization
- Linker Script
- Object File / ELF
- ABI / Calling Convention
- Assembly Code Analysis
- Debug Symbols / DWARF
- Toolchain Portability
- Compiler-specific Behavior
- CI/CD Toolchain Integration

我可能曾使用過 IAR 工具，但目前無法確認具體使用經歷，因此不能假設我熟悉 IAR Embedded Workbench。

**B. 英文即時表達能力**

我能閱讀英文技術文件，但希望加強：

- 英文技術聽力
- 即時口說回答
- 英文自我介紹
- 技術問題解釋
- 英文商務溝通
- 回答追問的能力

請使用自然、清楚、容易口說的商務英文，不要一開始就要求艱深的英文句型。

**C. FAE 工作思維**

我目前是研發管理者，而非專職 FAE。

需要學習：

- Technical Pre-sales
- Customer Technical Discovery
- Technical Support Escalation
- Proof of Value
- Technical Presentation
- Customer Objection Handling
- Sales / Engineering Collaboration
- Business-oriented Technical Communication

---

# 2. 職缺背景與參考文件

我會提供 `IAR FAE Taiwan.pdf`，請將它視為主要的職缺需求來源。

請仔細閱讀 PDF，萃取：

- Responsibilities
- Technical Requirements
- Business Requirements
- Communication Requirements
- Reporting & Metrics
- Cross-functional Collaboration

請建立 JD Requirement Mapping，將每項要求對應到網站中的課程、練習及模擬面試。

對於 JD 沒有明確提及的技術主題，請標示為「延伸補強」，不要宣稱它們是 IAR 的硬性要求。

目前已知：

- 公司：IAR Systems，屬於 Qt Group
- 職位：FAE / Technical Support Specialist
- 地點：台北
- 負責區域：台灣、東南亞、澳洲、紐西蘭
- 工作涵蓋 Pre-sales 與 Technical Support
- 需要與全球技術團隊合作
- 重視 C/C++、Embedded Software、Arm、RISC-V、RTOS、Linux
- 需要商務英文能力

獵頭提供的額外資訊：

- 年度總薪酬預算最高約 TWD 4,000,000
- Base / Bonus = 70 / 30
- Bonus 每季發放，通過六個月試用期後開始發放
- 遠端工作可能性尚未確認

這些資訊可用於 HR Interview Preparation，但不要將最高薪資預算視為保證薪資。

---

# 3. 網站主要功能

## Module A：Learning Dashboard

建立個人學習儀表板，包含：

- 面試準備進度
- 技術能力雷達圖
- 英文能力雷達圖
- 各學習模組完成率
- 最近練習紀錄
- 薄弱主題
- 建議下一個學習項目
- 每日學習目標

能力評估至少涵蓋：

1. C/C++ Fundamentals
2. Compiler & Optimization
3. Linker & Memory Layout
4. Debugger & Assembly
5. RTOS / Embedded Linux
6. CI/CD & Build System
7. FAE / Pre-sales Skills
8. English Communication

不要一開始就假設我的能力分數，請先提供診斷測驗，根據實際作答建立初始能力模型。

## Module B：Technical Learning Center

這是網站的核心模組。

請建立由淺入深、具有實際內容的互動式課程。

### Track 1：Compiler Fundamentals

- C/C++ Compilation Pipeline
- Preprocessing
- Compilation
- Assembly
- Linking
- GCC vs Clang vs IAR
- Cross Compilation
- Optimization Levels
- Undefined Behavior
- Volatile / Atomic / Memory Ordering
- Compiler-generated Assembly

### Track 2：Linker & Memory

- ELF File Structure
- Object Files
- Sections
- .text / .data / .bss
- Stack / Heap
- Linker Scripts
- Memory Maps
- Startup Code
- Vector Table
- Static vs Dynamic Linking
- Map File Analysis

### Track 3：Debugging

- GDB Fundamentals
- Hardware Breakpoints
- Watchpoints
- Debug Symbols
- DWARF
- Optimized Code Debugging
- Disassembly
- Call Stack
- HardFault Analysis
- Compiler vs Application Bug Investigation

### Track 4：Embedded Systems

- Arm Cortex-M vs Cortex-A
- RISC-V Fundamentals
- RTOS Scheduling
- Interrupt Handling
- Concurrency
- Memory Protection
- Bare-metal vs RTOS vs Linux
- BSP / HAL
- Embedded Toolchain Integration

### Track 5：IAR Ecosystem

- IAR Embedded Workbench
- IAR C/C++ Compiler
- IAR Linker
- C-SPY Debugger
- IAR Project Structure
- Compiler Configuration
- Optimization and Code Size
- GCC Project Migration Considerations
- IAR vs GCC Toolchain Comparison

請優先參考 IAR 官方文件，明確區分不同產品、版本與架構的差異。

不要杜撰 IAR 專屬選項、命令或功能。無法確認的內容請標記為待查證。

### 每堂課的內容格式

每堂課都必須包含：

1. Learning Objectives
2. 中文概念說明
3. 英文專有名詞
4. 架構圖或流程圖
5. C/C++ 實際程式範例
6. 原理分析
7. 實際工程案例
8. IAR FAE 可能遇到的客戶問題
9. 常見面試問題
10. Quiz（至少 5 題）
11. 延伸閱讀

尤其要避免只有標題、簡短說明或空白占位內容。

## Module C：Interactive Technical Lab

建立可以互動的技術練習環境。

至少包含：

- Compiler Optimization Comparison
- Memory Layout Visualization
- Linker Section Explorer
- Stack / Heap Visualization
- RTOS Scheduling Simulation
- Assembly Instruction Walkthrough
- Debugging Case Studies

例如 Compiler Optimization Lab：

顯示一段 C 程式，讓使用者選擇 O0、O1、O2、O3，觀察不同最佳化策略可能造成的差異。

如果網站沒有真實 Compiler Backend，請使用明確標示的預先編譯範例，不得假裝即時執行了 GCC 或 IAR。

若要支援真實編譯，請設計安全的本機後端執行機制，限制資源與執行時間，不要直接執行任意不受信任的程式碼。

## Module D：English Interview Training

建立英文面試專區，包含：

- Recruiter Screening
- Self Introduction
- Career Background
- Technical Experience
- Compiler / Toolchain Questions
- FAE Customer Scenarios
- Behavioral Questions
- Salary Negotiation
- Questions to Ask the Interviewer

每道題目提供：

1. 英文問題
2. 中文翻譯
3. 問題意圖分析
4. 建議回答（簡單版）
5. 建議回答（進階版）
6. 中文對照
7. 關鍵英文句型
8. 常見追問
9. 使用者自行作答區域

回答內容必須以我的真實背景為基礎。

例如：

Question:
How familiar are you with compiler toolchains?

回答應誠實反映我具備嵌入式開發經驗，但並未專精 Compiler Internals。

不得捏造我的 IAR 使用經驗、跨國工作經驗或客戶銷售經驗。

## Module E：AI Mock Interview

建立互動式模擬面試。

至少三種面試角色：

**Mode 1：Recruiter Interview**

模擬 Nick 這類獵頭，詢問：

- Career Background
- Motivation
- English Communication
- Salary Expectations
- Availability
- Career Transition

**Mode 2：IAR Technical Interview**

模擬技術主管，詢問：

- Embedded C/C++
- Compiler
- Linker
- Debugging
- RTOS
- Toolchain Integration
- Technical Troubleshooting

**Mode 3：FAE Customer Simulation**

模擬客戶提出技術問題，例如：

- Compiler Optimization 導致程式異常
- Linker Memory Overflow
- GCC 與 IAR 編譯結果不同
- Debugger 無法正確顯示變數
- 客戶質疑商業 Compiler 的價值

AI 必須根據使用者的回答動態追問，而不是只按照固定題庫順序播放。

每次回答後可提供：

- Technical Accuracy
- Communication Clarity
- English Quality
- Answer Structure
- Confidence / Completeness

請以可觀察的文字或語音特徵評估，不要聲稱能可靠判斷使用者的心理自信程度。

提供具體改善建議與更自然的英文回答範例。

## Module F：Speaking & Listening Practice

希望能使用瀏覽器麥克風進行英文口說練習。

功能包含：

- Text-to-Speech 播放英文問題
- Speech-to-Text 將回答轉成文字
- 顯示辨識結果
- 英文句型修正
- 技術術語練習
- 中英文對照
- 慢速播放
- 重複練習

如果瀏覽器語音辨識不支援，提供手動輸入模式。

語音評分必須區分：

- 文字內容評估
- 語音辨識可信度
- 發音評估（只有具備適當語音分析能力時才啟用）

## Module G：Interview Copilot

建立一個供面試練習及經對方同意的實際會議輔助使用的介面。

使用者輸入或貼上英文問題後，立即顯示：

- 中文翻譯
- 問題意圖
- 簡短英文回答建議
- 可選擇的延伸回答

介面採用大字體、低干擾設計。

提供「Quick Answer Mode」，回答限制在 2～3 句、容易口說的英文。

不必在第一版實作 Teams 音訊擷取或自動錄音；避免未經同意擷取他人會議內容。

---

# 4. 學習系統設計

請加入：

- 學習進度儲存
- Quiz 答題紀錄
- 錯題複習
- Spaced Repetition
- Bookmark
- Learning Notes
- 個人弱點追蹤
- AI 產生補強練習
- 每日 30 / 60 / 90 分鐘學習模式

另外設計一個 14 天的密集準備計畫，優先順序為：

1. 英文自我介紹與獵頭面談
2. Compiler / Linker 基礎
3. Debugging / Optimization
4. IAR Toolchain
5. FAE 工作情境
6. 技術主管模擬面試

此計畫是建議學習節奏，不代表已知正式面試日期。

---

# 5. 技術架構

我偏好使用：

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Prisma
- SQLite（本機優先）
- Recharts
- Monaco Editor
- Mermaid
- OpenAI 或 Anthropic API（AI 功能）

請採用易於本機部署、維護及擴充的架構。

需求：

- Desktop-first Responsive UI
- 繁體中文介面
- 英文技術內容與雙語學習
- Light / Dark Mode
- Local Progress Persistence
- API Key 透過環境變數管理
- 不要將 API Key 暴露到前端
- AI API 未設定時仍能使用靜態課程、題庫與一般練習

網站視覺風格希望接近現代化工程師學習平台，專業、簡潔，具有良好的資訊層級。

---

# 6. 開發執行順序

請分階段實作。

Phase 1：
- 專案初始化
- 網站 UI / Navigation
- Dashboard
- 資料庫
- JD Requirement Mapping
- 初始診斷測驗

Phase 2：
- Technical Learning Center
- 實際課程內容
- Quiz System
- Progress Tracking

Phase 3：
- English Interview Training
- Speaking / Listening Practice
- Recruiter Interview 題庫

Phase 4：
- AI Mock Interview
- Interview Copilot
- AI Feedback

Phase 5：
- Interactive Technical Labs
- Spaced Repetition
- 學習分析與建議

請先檢查目前專案環境及現有檔案，避免覆蓋既有內容。

先提出簡短架構與實作計畫，接著直接進行 Phase 1，不要停留在規劃階段。

每完成一個 Phase，請執行可行的 Build、Lint、Typecheck 與基本功能測試，修正錯誤後再回報。

如果工作量過大，優先確保已完成的功能真正可使用，而不是建立大量無功能的頁面。

---

# 7. 最重要的驗收標準

最終這個網站應該讓我能夠：

1. 清楚知道自己距離 IAR FAE 的要求還有哪些差距。
2. 系統性補強 Compiler、Linker、Debugger 等知識。
3. 用實際程式與案例理解 Toolchain。
4. 每天練習英文技術問題的聽力與口說。
5. 模擬與獵頭、技術主管、客戶的英文對話。
6. 得到符合我真實經歷的英文回答建議。
7. 追蹤自己的學習進度與能力提升。
8. 在正式面試前建立足夠的技術理解與英文應答能力。

請將這個網站視為一個真正要長期使用的個人化學習產品，而不是展示用途的 Prototype。