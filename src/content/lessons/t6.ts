import type { LessonContent } from "../types";

// Track 6 — FAE skills. Grounded in the IAR FAE Taiwan JD (see src/content/jd.ts quotes).
// General FAE / pre-sales practice is presented as common industry practice, not IAR-internal process.

export const T6: LessonContent[] = [
  // ───────────────────────────────────────────── t6-role
  {
    id: "t6-role",
    objectives: [
      "說明 FAE / Technical Support Specialist 在 IAR 台北的雙重角色：售前（pre-sales）與售後（post-sales）",
      "畫出 B2B 工具軟體的銷售週期，並指出 FAE 在每一階段的產出",
      "理解 JD 中的 KPI：technical engagements、win/loss analysis、PoV / evaluation success rate",
      "把自己的韌體 / 測試背景轉譯成 FAE 的價值主張",
    ],
    concept: `
#### JD 對這個職位的描述（重點摘錄）
- **售前**：與 Sales 一起了解客戶的「embedded projects, tool chains, CI/CD setups, and compliance needs」，並「share the region's revenue goals」。
- **售後**：提供 comprehensive technical support，是橫跨 EMEA、US、APAC 的**全球技術支援團隊**的一員。
- **深入技術**：troubleshooting、exploring compiler behavior、optimization 與 debugging challenges。
- **知識沉澱**：維護 knowledge base、參與 self-service support tools；建立技術內容並把全球文件**在地化**。
- **生態系**：管理與晶片廠、IP 供應商、其他軟體/韌體供應商的關係，合辦活動產生 lead；支援通路與代理商 enablement。
- **回報**：追蹤 technical engagements 的數量與品質、技術面的 win/loss analysis、proof-of-value 與 evaluation 成功率，定期向主管報告。
- 團隊：台北小團隊（1 Sales + 1 Customer Operations），區域涵蓋台灣、東南亞、澳洲、紐西蘭。

#### 銷售週期與 FAE 的產出
| 階段 | Sales 主導的事 | FAE 的產出 |
|---|---|---|
| Lead / Prospect | 名單、活動、晶片廠介紹 | 技術研討會、demo、技術文章 |
| Discovery | 預算、決策者、時程 | 技術需求清單、現有工具鏈與痛點、風險 |
| Evaluation / PoV | 推進時程 | 成功標準、評估計畫、技術支援、結果報告 |
| Proposal | 報價、條款 | 技術提案、差異化說明、導入計畫 |
| Close | 簽約 | 回答最後的技術疑慮 |
| Post-sales | 續約 / 擴充 | onboarding、技術支援、知識庫、回饋產品 |

#### 一句話的價值主張（範例）
「我帶領軟體團隊多年，做過 SSD/SD controller 韌體、Embedded Linux、FreeRTOS 與 Zynq/MPSoC 軟硬體整合，習慣從 build log、map file、除錯器追到根因；我希望讓客戶在評估期就看見可量測的成果，並把每一次支援變成可重用的知識。」—— 接著**誠實說明**：沒有正式 FAE / 售前年資，也沒有確認過的 IAR 使用經驗，但長期處理跨團隊技術問題與對內對外的技術溝通（請以你的實際經歷舉例）。
`,
    terms: [
      { en: "Field Application Engineer (FAE)", zh: "應用工程師", note: "技術面支援銷售與客戶" },
      { en: "Pre-sales / Post-sales", zh: "售前 / 售後", note: "本職位兩者兼具" },
      { en: "Sales cycle", zh: "銷售週期", note: "lead → discovery → evaluation → proposal → close" },
      { en: "Pipeline", zh: "商機管道", note: "所有進行中商機的集合" },
      { en: "Proof of Value (PoV)", zh: "價值驗證", note: "以客戶情境證明可量測的成果" },
      { en: "Win/loss analysis", zh: "成交/失單分析", note: "從技術面分析為何贏或輸" },
      { en: "Enablement", zh: "賦能", note: "讓客戶、通路具備使用與推廣能力" },
      { en: "Ecosystem partner", zh: "生態系夥伴", note: "晶片廠、IP、RTOS / 軟體供應商" },
    ],
    diagram: {
      title: "Where the FAE adds value in the sales cycle",
      mermaid: `flowchart LR
  L["Lead<br/>events · chip vendors"] --> D["Discovery<br/>needs · toolchain · CI · compliance"]
  D --> E["Evaluation / PoV<br/>success criteria"]
  E --> P["Proposal<br/>differentiation · plan"]
  P --> C["Close"]
  C --> S["Post-sales support<br/>KB · escalation · feedback"]
  S -->|"expansion / renewal"| D
  S -->|"product feedback"| PM["Product Management"]`,
    },
    code: [
      {
        title: "每週 FAE 回報範本（對應 JD 的 Reporting & Metrics）",
        lang: "text",
        code: `Week 42 — FAE update (Taiwan / SEA / ANZ)

1. Engagements (count / quality)
   - Customer A (automotive, Arm Cortex-M7): discovery call, CI + functional-safety needs  → next: PoV plan
   - Customer B (consumer, RISC-V): support case #1234 resolved (linker region overflow)
2. Pipeline health (technical view)
   - Opp X: PoV week 2/4, success criteria 2 of 3 met, risk: license setup in CI
   - Opp Y: stalled — waiting for customer's hardware
3. Win / loss notes
   - Lost Opp Z: customer standardized on vendor's free toolchain; main factor = budget, not technical
4. Knowledge base
   - New article (zh-TW): "Placing data in external SDRAM with C-SPY macro"
5. Asks / risks for manager
   - Need clarification on CI licensing options for Customer A`,
        note: "重點：數字 + 狀態 + 下一步 + 需要的協助。",
      },
    ],
    analysis: `
#### 為什麼「售前 + 售後」對面試很重要
面試官會測你能不能在兩種情境切換：售前要**發現需求、建立信任、推進決策**；售後要**快速定位問題、清楚溝通、守住承諾**。準備故事時兩種各準備 2 個（STAR：Situation, Task, Action, Result）。

#### 從工程師到 FAE 的心態轉換
- 從「把問題解完」到「讓客戶成功」：有時最好的答案是 workaround + 時程，而不是完美的根因報告。
- 從「技術正確」到「技術正確 + 商業相關」：說明一個最佳化選項時，連結到客戶的成本（flash 大小 → BOM）或時程（除錯時間）。
- 從「個人產出」到「可重用產出」：每個 case 問自己「這能不能變成一篇 KB？」

#### 小團隊的含義
台北只有 Sales + Customer Operations + 你，意味著你會是區域內主要的技術窗口，需要主動向全球支援團隊與產品團隊求助、並跨時區溝通（英文書寫能力很關鍵）。
`,
    cases: [
      {
        title: "把一次支援變成商機",
        body: "既有客戶回報 code size 問題。FAE 在處理過程中了解到客戶下一代產品要通過功能安全認證，且正在建立 CI。在解決原問題並寫成 KB 後，FAE 把功能安全與 CI 的需求回報給 Sales，促成後續的評估。重點：售後支援是發現新需求的最佳時機，但要先把眼前的問題處理好。",
      },
      {
        title: "技術面的失單分析",
        body: "某商機最後沒有成交。FAE 整理技術面原因：評估時沒有定義成功標準、客戶最在意的 RISC-V 自訂指令支援沒有及早確認。下一次的 discovery checklist 因此加入「必要技術條件（must-have）」一欄，並在 PoV 前確認。",
      },
    ],
    customerQs: [
      {
        q: "Why should we pay for a compiler when GCC is free?",
        zh: "GCC 免費，為什麼要付錢買編譯器？",
        answer: "先了解你們在意的是什麼：code size、效能、除錯效率、功能安全認證、技術支援、CI 整合。如果這些對產品沒有影響，GCC 可能就夠了；如果有，我們可以在你們的程式碼上做一個有成功標準的評估，用數據決定。（詳見 t6-objection）",
      },
      {
        q: "Who do we contact if we have a problem after purchase?",
        zh: "購買後遇到問題要找誰？",
        answer: "在地有我負責技術支援，必要時會連結 IAR 的全球技術支援團隊。回報問題時請提供工具版本、專案檔、build log 與最小重現範例，能大幅縮短處理時間。",
      },
    ],
    interviewQs: [
      {
        q: "What do you think an FAE does day to day?",
        zh: "你認為 FAE 每天在做什麼？",
        points: ["售前：discovery、demo、PoV、提案", "售後：技術支援、升級、KB", "與 Sales、全球支援、產品團隊協作", "生態系與活動", "回報 KPI"],
      },
      {
        q: "You don't have formal FAE experience. Why should we hire you?",
        zh: "你沒有正式的 FAE 經驗，為什麼要錄用你？",
        points: ["誠實承認", "可轉移的經驗：軟體團隊管理、SSD/SD controller 韌體、系統整合除錯、跨團隊溝通", "具體例子（STAR）", "學習計畫與這個平台的準備證據", "對 IAR 產品的理解"],
      },
      {
        q: "How would you measure your success in this role after six months?",
        zh: "六個月後你會如何衡量自己在這個職位的成功？",
        points: ["JD 的 KPI：engagement 數量品質、PoV 成功率", "KB 文章數與被引用", "支援回應與解決時間", "客戶與 Sales 的回饋"],
      },
    ],
    quiz: [
      { id: "t6r-q1", skill: "fae", q: "依 JD，這個職位的範圍是？", options: ["只有售前", "只有售後", "售前與售後兩者兼具", "只做產品開發"], answer: 2, explain: "JD 同時描述 pre-sales technical discovery & enablement 與 post-sales technical support。" },
      { id: "t6r-q2", skill: "fae", q: "下列何者是 JD 列出的 FAE KPI 之一？", options: ["程式碼行數", "Proof-of-value 與 evaluation 成功率", "社群媒體追蹤數", "專利數"], answer: 1, explain: "JD 的 Reporting & Metrics 包含 PoV / evaluation success rates。" },
      { id: "t6r-q3", skill: "fae", q: "Discovery 階段 FAE 最主要的產出是？", options: ["報價單", "技術需求、現有工具鏈、痛點與風險清單", "合約", "發票"], answer: 1, explain: "報價與合約屬 Sales；FAE 負責技術面的需求釐清。" },
      { id: "t6r-q4", skill: "fae", q: "Win/loss analysis 從技術面的目的是？", options: ["找人負責", "找出影響結果的技術因素並改進流程", "只記錄贏的案例", "給客戶看"], answer: 1, explain: "目的是改善下一次的 discovery 與 PoV。" },
      { id: "t6r-q5", skill: "fae", q: "在售後支援中發現客戶的新需求時，較好的做法是？", options: ["立刻推銷", "先解決眼前問題，再把需求回報給 Sales", "忽略", "直接報價"], answer: 1, explain: "信任建立在先解決問題；之後與 Sales 協作跟進。" },
    ],
    reading: [
      { title: "IAR Embedded Workbench 產品頁", url: "https://www.iar.com/embedded-development-tools/iar-embedded-workbench", note: "了解要對客戶說明的產品組成" },
      { title: "IAR and Qt（官方說明）", url: "https://www.iar.com/about/corporate-governance/qt-info-stakeholders", note: "公司背景，面試開場常用" },
      { title: "JD 對照表（本站）", url: "/jd", note: "每條 JD 要求對應的課程與準備" },
    ],
    toVerify: ["IAR 內部 FAE KPI 的實際定義與 CRM 工具（面試時可以詢問）"],
  },

  // ───────────────────────────────────────────── t6-discovery
  {
    id: "t6-discovery",
    objectives: [
      "用結構化問題了解客戶的專案、工具鏈、CI/CD 與 compliance 需求（JD 原文的四個面向）",
      "區分 must-have、nice-to-have 與 deal-breaker，並找出決策流程與時程",
      "以開放式問題與追問（why / how do you measure）挖出真正的痛點",
      "把 discovery 結果寫成簡短、可交接的摘要",
    ],
    concept: `
JD 寫得很具體：了解客戶的「**embedded projects, tool chains, CI/CD setups, and compliance needs**」。這就是 discovery 的骨架。

#### 四個面向的問題庫
**1. 專案（Projects）**
- 產品是什麼？應用領域（車用、工業、醫療、消費）？
- MCU / SoC 架構（Arm Cortex-M/R/A、RISC-V）、記憶體大小、是否多核心？
- RTOS / bare-metal / Linux？團隊規模、程式碼規模？
- 下一個里程碑與量產時程？

**2. 工具鏈（Tool chains）**
- 現在用什麼編譯器 / IDE / 除錯器（GCC、晶片廠 IDE、其他商用工具）？哪個版本？
- 最困擾的是什麼？（code size、效能、除錯時間、工具穩定度、支援回應）
- 有沒有量化資料？（flash 使用率、某函式的 cycle 數、平均除錯時間）

**3. CI/CD**
- 是否有 CI？用什麼（Jenkins、GitLab CI、GitHub Actions、Azure DevOps）？在 Windows 還是 Linux / 容器？
- 有沒有自動化測試？在硬體上（HIL）還是模擬器？
- 靜態分析如何做？報告給誰看？

**4. 合規（Compliance）**
- 需要哪些標準？（ISO 26262、IEC 61508、IEC 62304、MISRA C、CERT C…）
- 有沒有工具認證（tool qualification）需求？由誰負責 safety case？
- 稽核時程？

#### 商機面的問題（與 Sales 分工）
- 決策者與影響者是誰？評估由誰執行？
- 比較對象是誰？決策時程與標準？
- 預算與採購流程（通常由 Sales 主問）。

#### 提問技巧
- **開放式**：「Can you walk me through how a firmware build gets to production today?」
- **量化**：「How do you measure that today?」「What would good look like?」
- **影響**：「What happens if this isn't solved before the next milestone?」
- **確認**：「So if I understand correctly, the top two issues are…」
`,
    terms: [
      { en: "Technical discovery", zh: "技術探索", note: "了解客戶需求與現況" },
      { en: "Pain point", zh: "痛點", note: "客戶最需要解決的問題" },
      { en: "Must-have / Nice-to-have", zh: "必要 / 加分條件", note: "決定評估重點" },
      { en: "Deal-breaker", zh: "否決條件", note: "沒滿足就不會買" },
      { en: "Decision maker / Influencer", zh: "決策者 / 影響者", note: "誰決定、誰影響" },
      { en: "Tool qualification", zh: "工具認證", note: "功能安全標準對開發工具的要求" },
      { en: "HIL (hardware-in-the-loop)", zh: "硬體在環測試", note: "在真實硬體上自動化測試" },
      { en: "Open-ended question", zh: "開放式問題", note: "避免是非題，讓客戶多說" },
    ],
    diagram: {
      title: "Discovery framework (from the JD)",
      mermaid: `mindmap
  root((Customer discovery))
    Projects
      Application / market
      MCU arch · memory
      RTOS / bare-metal
      Milestones
    Toolchains
      Compiler · IDE · probe
      Pain points
      Metrics today
    CI/CD
      CI system · OS
      Automated tests
      Static analysis
    Compliance
      ISO 26262 / IEC 61508 / IEC 62304
      MISRA / CERT
      Tool qualification
    Deal
      Decision makers
      Competitors
      Timeline`,
    },
    code: [
      {
        title: "Discovery 摘要範本（給 Sales 與全球團隊）",
        lang: "text",
        code: `Customer: ACME Motion (industrial drives) — call 2026-10-14
Attendees: FW lead (Ms. Lin), QA manager, our Sales (Kevin)

Project:     Next-gen servo drive, Cortex-M7 @ 480 MHz, 2 MB flash, FreeRTOS, 12 FW engineers
Toolchain:   arm-none-eabi-gcc 12 + vendor IDE; pain = control loop ISR misses deadline at -Os
CI/CD:       GitLab CI on Linux runners, unit tests on host only, no static analysis
Compliance:  IEC 61508 SIL 2 planned for 2027; MISRA C:2012 required by end customer

Must-have:   ISR worst-case < 20 µs; MISRA reporting in CI
Nice-to-have: VS Code workflow
Competitors: staying with GCC (status quo)
Decision:    FW lead recommends, R&D director approves; decision by end of Q1
Next step:   Propose PoV on their control-loop module (2 weeks), success criteria draft by Fri
Open questions: CI licensing on Linux runners (→ check with HQ)`,
      },
    ],
    analysis: `
#### 好的 discovery 決定了 PoV 會不會成功
很多評估失敗是因為「評估了錯的東西」：客戶真正在意 CI 與 MISRA 報告，FAE 卻花兩週展示 code size。先釐清 must-have，再設計 PoV（見 t6-pov）。

#### 不要在 discovery 階段「解題」
工程師背景的 FAE 很容易聽到問題就開始給答案。先把四個面向問完，再提出你的初步看法；過早給答案會讓你錯過真正的痛點。

#### Status quo 是最大的競爭對手
很多情況下客戶不是在 IAR 與另一家商用工具之間選，而是「維持現狀（GCC + 晶片廠 IDE）」。Discovery 要找出「不改變的代價」—— 例如除錯時間、認證成本、延遲上市的風險。

#### 英文會議技巧
跨國客戶或與全球團隊開會時：先講結論、用簡單句、重述確認（"Just to confirm…"）、會後 24 小時內寄出書面摘要。
`,
    cases: [
      {
        title: "以為是 code size，其實是 compliance",
        body: "客戶一開始問「IAR 能讓程式小多少」。透過追問「為什麼現在在意大小」，發現真正原因是要通過功能安全稽核，需要減少自己維護的程式碼並取得有認證的工具與函式庫。評估重點因此轉向認證版本與 C-STAT 的 MISRA 報告，商機性質也完全不同。",
      },
      {
        title: "CI 環境的隱藏需求",
        body: "客戶的 CI 全部跑在 Linux 容器。若沒有在 discovery 問到，PoV 在 Windows 上完成後才發現無法整合。之後 discovery checklist 把「CI 作業系統與執行環境」列為必問項目。",
      },
    ],
    customerQs: [
      {
        q: "We just want a quote. Why do you need all this information?",
        zh: "我們只想要報價，為什麼要問這麼多？",
        answer: "理解。報價由我的 Sales 同事處理。我問這些是為了確保推薦的版本與附加功能真的符合你們的需求，例如架構、是否需要功能安全認證版本或 CI 用的授權，避免買錯或之後要補買。五分鐘就好。",
      },
      {
        q: "We're not sure about our compliance requirements yet.",
        zh: "我們還不確定合規需求。",
        answer: "沒關係，很多團隊在這個階段都還在規劃。我們可以先記錄可能的方向（例如終端客戶要求的標準、目標市場），之後我也可以分享 IAR 認證工具相關資訊，讓你們評估時程與成本。",
      },
    ],
    interviewQs: [
      {
        q: "How would you prepare for a first technical meeting with a new customer?",
        zh: "第一次與新客戶技術會議前，你會如何準備？",
        points: ["研究客戶產品與可能使用的晶片", "與 Sales 對齊目標與分工", "準備四個面向的問題", "準備簡短 demo / 案例", "會後摘要與下一步"],
      },
      {
        q: "Tell me about a time you had to understand a problem that the other person couldn't describe clearly.",
        zh: "請舉例：對方無法清楚描述問題時，你如何理解它？",
        points: ["STAR", "開放式問題與重現步驟", "用資料（log、量測）而非猜測", "確認理解"],
      },
    ],
    quiz: [
      { id: "t6d-q1", skill: "fae", q: "JD 中 FAE 要了解客戶的四個面向是？", options: ["價格、折扣、付款、交期", "embedded projects、tool chains、CI/CD setups、compliance needs", "人數、薪資、福利、地點", "只看晶片型號"], answer: 1, explain: "JD 原文列出這四個面向。" },
      { id: "t6d-q2", skill: "fae", q: "下列何者是開放式問題？", options: ["Do you use GCC?", "Is code size a problem?", "Can you walk me through how your firmware gets built and tested today?", "Are you using Arm?"], answer: 2, explain: "開放式問題讓客戶描述流程，常帶出意外的痛點。" },
      { id: "t6d-q3", skill: "fae", q: "Discovery 時客戶一提到問題就立刻給解法，主要風險是？", options: ["客戶會覺得你很專業", "可能錯過真正的痛點與決策因素", "沒有風險", "會讓會議太短"], answer: 1, explain: "先完整了解，再提出看法。" },
      { id: "t6d-q4", skill: "fae", q: "很多工具評估中最常見的「競爭對手」是？", options: ["另一家商用工具", "維持現狀（status quo）", "客戶自己寫編譯器", "沒有競爭"], answer: 1, explain: "需要找出「不改變的代價」。" },
      { id: "t6d-q5", skill: "fae", q: "會後最重要的動作是？", options: ["等客戶聯絡", "24 小時內寄出書面摘要與下一步", "直接報價", "開始寫程式"], answer: 1, explain: "書面摘要確保雙方理解一致，並讓 Sales 與全球團隊可接手。" },
    ],
    reading: [
      { title: "JD 對照表（本站）", url: "/jd", note: "Discovery 對應的 JD 條目" },
      { title: "英文題庫：FAE 類（本站）", url: "/english?cat=fae", note: "練習用英文問 discovery 問題" },
      { title: "IAR 功能安全產品資訊", url: "https://www.iar.com/products/requirements/functional-safety", note: "compliance 相關話題的背景" },
    ],
    toVerify: ["IAR 功能安全認證版本目前涵蓋的標準與架構（依官方最新清單）"],
  },

  // ───────────────────────────────────────────── t6-pov
  {
    id: "t6-pov",
    objectives: [
      "說明 Proof of Value（PoV）與一般試用（trial）的差別",
      "與客戶共同定義可量測的成功標準（success criteria）",
      "規劃 2–4 週的評估計畫：範圍、角色、檢查點、風險",
      "寫出結果報告，並把結果與客戶的商業目標連結",
    ],
    concept: `
**Trial** 是「給你軟體自己試」；**PoV** 是「在你的情境中，證明能達到你在意的成果」。JD 把 **proof-of-value 與 evaluation success rates** 列為 KPI，代表這是 FAE 的核心工作之一。

#### PoV 的五個要素
1. **範圍（Scope）**：挑一個代表性、可在期限內完成的模組（例如控制迴圈、通訊協定、一個 library）。不要「整個專案移植」。
2. **成功標準（Success criteria）**：可量測、雙方同意、事先寫下。例如：
   - Code size：Release build 的 text+rodata ≤ 現況的 90%（以 map file 計）。
   - 效能：某 ISR 最壞情況執行時間 < 20 µs（以 DWT cycle counter 量測）。
   - 流程：CI 中自動產生 MISRA C:2012 報告。
3. **角色與時程**：客戶出誰、FAE 出什麼（移植支援、範例、每週 sync）、何時檢查。
4. **環境與前置**：硬體、授權（評估版）、CI 機器存取、程式碼分享方式與 NDA。
5. **結論與下一步**：達標時的決策流程（誰簽核、採購時程）事先講好。

#### 常見失敗原因
- 沒有寫下成功標準 → 結束時「感覺差不多」。
- 範圍太大 → 時間耗在移植細節，沒有量到價值。
- 客戶沒有投入人力 → 評估停滯。
- 不對等比較 → 結果被質疑（見 t5-migration 的公平比較）。
- 沒有決策者參與 → 技術上成功、商業上沒結論。

#### 結果報告的結構
1. 背景與目標（一句話）
2. 成功標準與結果（表格：標準 / 目標 / 結果 / 是否達成）
3. 方法（版本、選項、量測方式 —— 讓客戶可重現）
4. 觀察與限制（誠實寫出沒達成的項目與原因）
5. 對客戶商業目標的意義（例如 flash 降一級 → 每台省多少；認證工作量）
6. 建議的下一步
`,
    terms: [
      { en: "Proof of Value (PoV)", zh: "價值驗證", note: "以客戶情境證明可量測成果" },
      { en: "Proof of Concept (PoC)", zh: "概念驗證", note: "偏向「技術上可不可行」" },
      { en: "Evaluation license", zh: "評估授權", note: "限時試用" },
      { en: "Success criteria", zh: "成功標準", note: "事先同意、可量測" },
      { en: "Mutual action plan", zh: "共同行動計畫", note: "雙方的任務與時程" },
      { en: "Checkpoint", zh: "檢查點", note: "定期確認進度與風險" },
      { en: "Baseline", zh: "基準值", note: "現況的量測結果" },
      { en: "Business impact", zh: "商業影響", note: "成本、時程、風險" },
    ],
    diagram: {
      title: "A 3-week PoV",
      mermaid: `gantt
  title PoV plan (example)
  dateFormat  YYYY-MM-DD
  section Prepare
  Success criteria signed     :a1, 2026-11-02, 2d
  Eval license + env ready    :a2, after a1, 2d
  Baseline measured (GCC)     :a3, after a1, 3d
  section Execute
  Port module to IAR          :b1, after a2, 5d
  Optimize + measure          :b2, after b1, 4d
  CI + C-STAT report          :b3, after b1, 4d
  section Close
  Results report + review     :c1, after b2, 2d
  Decision meeting            :milestone, after c1, 0d`,
    },
    code: [
      {
        title: "成功標準表（事先與客戶確認）",
        lang: "text",
        code: `| # | Criterion                         | Baseline (GCC -Os) | Target       | Measured by          | Owner      |
|---|-----------------------------------|--------------------|--------------|----------------------|------------|
| 1 | Control-loop ISR worst case       | 24.1 µs            | < 20 µs      | DWT CYCCNT, 10k runs | Customer   |
| 2 | Module code size (text+rodata)    | 41.2 KB            | ≤ 37 KB      | linker map file      | FAE        |
| 3 | MISRA C:2012 report in CI         | none               | per commit   | CI artifact          | FAE + Cust |
| 4 | Build in existing GitLab CI       | n/a                | green build  | pipeline log         | Customer   |

Agreed: 2026-11-03 by Ms. Lin (FW lead) and Kevin (Sales). Decision meeting: 2026-11-24.`,
        note: "數字為示意。重點：基準值、目標、量測方式、負責人都事先寫清楚。",
      },
      {
        title: "用 DWT cycle counter 量測執行時間（Cortex-M3/M4/M7）",
        lang: "c",
        code: `#include "stm32f7xx.h"   /* 任一 CMSIS device header */

static inline void cyc_init(void) {
  CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
  DWT->CYCCNT = 0;
  DWT->CTRL  |= DWT_CTRL_CYCCNTENA_Msk;
}

uint32_t measure_isr_body(void) {
  uint32_t t0 = DWT->CYCCNT;
  control_loop_step();          /* 被量測的函式 */
  return DWT->CYCCNT - t0;      /* cycles；除以 SystemCoreClock 得時間 */
}`,
        note: "兩個工具鏈用同一份量測程式、同樣的時脈與 cache 設定，才是公平比較。Cortex-M7 需注意 cache 與 flash wait state。",
      },
    ],
    analysis: `
#### 成功標準是 FAE 最重要的槓桿
事先寫下的標準把「主觀感受」變成「客觀結果」，也保護雙方：客戶知道要看什麼，FAE 知道要做什麼。若中途發現標準不合理，要明確地重新協商，而不是默默改變。

#### 誠實比漂亮的數字重要
若某項沒達標，報告中寫出原因與可能的改善方向。工具軟體的客戶通常會長期合作，一次誇大就可能失去信任。JD 也提到 win/loss analysis，代表公司重視從失敗中學習。

#### 把技術結果翻譯成商業語言
- Code size ↓ → 可能選用較小 flash 的 MCU → BOM 成本。
- 除錯效率 ↑ → 縮短開發時程。
- 認證工具 → 減少 tool qualification 的工作量。
具體金額由客戶自己估算最有說服力；FAE 提供換算框架即可。
`,
    cases: [
      {
        title: "成功的 PoV",
        body: "客戶的控制迴圈 ISR 在 GCC 下偶爾超過時限。PoV 範圍只取控制模組，三週內完成移植、以 DWT 量測最壞情況、並在客戶 GitLab CI 產生 MISRA 報告。四項標準中三項達成，一項（CI 授權設定）需總部確認。報告誠實列出，客戶決策會議中決定採購。",
      },
      {
        title: "停滯的評估",
        body: "客戶下載評估版後兩週沒有消息。回顧發現沒有成功標準、也沒有指定客戶端負責人。重新約會議，用 30 分鐘定義兩個標準與每週 15 分鐘 sync，評估重新啟動。教訓：沒有計畫的 trial 不等於 PoV。",
      },
    ],
    customerQs: [
      {
        q: "Can we just try it ourselves for a month?",
        zh: "我們可以自己先試一個月嗎？",
        answer: "當然可以。為了讓這個月真的有結論，建議我們先花 30 分鐘一起定義兩三個你們在意的成功標準，並約每週短暫 sync。我可以協助移植第一個模組，讓你們把時間花在量測價值，而不是設定工具。",
      },
      {
        q: "The results are only 5% better. Is that worth it?",
        zh: "結果只好 5%，值得嗎？",
        answer: "要看這 5% 對你們的意義：如果能讓你們留在目前的 flash 容量、不用換更大的晶片，價值可能很大；如果不影響產品，那 code size 可能不是你們的主要決策因素。我們可以回頭看其他標準，例如除錯效率、CI 或合規。",
      },
    ],
    interviewQs: [
      {
        q: "How would you run a technical evaluation for a customer?",
        zh: "你會如何為客戶進行技術評估？",
        points: ["discovery → 範圍", "書面成功標準與基準值", "時程、角色、檢查點", "公平量測", "結果報告 + 商業意義 + 下一步"],
      },
      {
        q: "Tell me about a time a project didn't meet its goal. What did you do?",
        zh: "請舉例：專案沒達成目標時你怎麼做？",
        points: ["STAR", "誠實面對與溝通", "分析原因", "改善措施與學到的事"],
      },
    ],
    quiz: [
      { id: "t6p-q1", skill: "fae", q: "PoV 與一般 trial 最大的差別是？", options: ["PoV 比較便宜", "PoV 有事先同意、可量測的成功標準與計畫", "Trial 一定比較短", "沒有差別"], answer: 1, explain: "PoV 證明在客戶情境下的價值。" },
      { id: "t6p-q2", skill: "fae", q: "下列哪一個是好的成功標準？", options: ["工具要好用", "ISR 最壞情況 < 20 µs（DWT 量測，10k 次）", "比 GCC 好", "工程師喜歡"], answer: 1, explain: "可量測、有方法、有目標值。" },
      { id: "t6p-q3", skill: "fae", q: "PoV 範圍最好是？", options: ["整個專案移植", "一個代表性、期限內可完成的模組", "只看 demo", "由 FAE 自行決定"], answer: 1, explain: "範圍太大會耗在移植細節。" },
      { id: "t6p-q4", skill: "fae", q: "結果報告中某項沒達標，最好的做法是？", options: ["刪掉那一項", "誠實寫出原因與改善方向", "改變標準讓它達標", "不提"], answer: 1, explain: "誠實維持長期信任。" },
      { id: "t6p-q5", skill: "fae", q: "評估開始前，除了技術內容，還應事先確認？", options: ["客戶的午餐偏好", "決策流程：誰決定、何時決定", "競爭對手的價格", "不需要"], answer: 1, explain: "否則技術成功也可能沒有商業結論。" },
    ],
    reading: [
      { title: "ARM CoreSight DWT（Arm Developer）", url: "https://developer.arm.com/documentation/ddi0403/latest", note: "Armv7-M Architecture Reference Manual：DWT / CYCCNT" },
      { title: "GCC → IAR 移植與公平比較（本站 t5-migration）", url: "/learn/t5-migration", note: "比較方法" },
    ],
    toVerify: ["IAR 評估授權的期限與限制（依官方最新規定）"],
  },

  // ───────────────────────────────────────────── t6-support
  {
    id: "t6-support",
    objectives: [
      "建立技術支援的標準流程：受理 → 資訊收集 → 重現 → 分析 → 解決 / 升級 → 結案 → KB",
      "列出向客戶要的資訊（版本、專案檔、log、最小重現範例），並說明為什麼",
      "判斷何時升級到全球支援 / 開發團隊，並寫出好的升級報告",
      "把 case 轉成 knowledge base 文章（JD 要求）",
    ],
    concept: `
JD：作為 **global technical support team（EMEA、US、APAC）** 的一員提供完整技術支援，並**維護 knowledge base、參與 self-service support tools**。

#### 支援流程
1. **受理（Intake）**：確認問題、影響程度（阻擋量產？影響一位工程師？）、期限。
2. **資訊收集**：
   - 產品與**確切版本**（例如 EWARM 9.70.x）、作業系統、授權類型。
   - 目標晶片、除錯 probe 與韌體版本。
   - 專案檔（.ewp/.ewd/.icf）、完整 build log、錯誤訊息原文。
   - **最小重現範例（minimal reproducible example）**。
   - 什麼時候開始的？最近改了什麼？（版本升級、選項、程式碼）
3. **重現**：在相同版本上重現；無法重現時，比較環境差異。
4. **分析**：先排除使用者端原因（設定、UB、volatile、stack），再懷疑工具。
5. **解決或升級**：提供 workaround / 修正；若懷疑工具缺陷，升級給全球支援 / 開發團隊。
6. **結案**：確認客戶問題已解決，記錄根因與解法。
7. **知識沉澱**：可重用的內容寫成 KB 文章（必要時在地化成繁體中文）。

#### 嚴重度（範例分級，實際依公司定義）
| 等級 | 例子 | 回應方式 |
|---|---|---|
| Critical | 量產線停擺、出貨前發現疑似編譯器錯誤 | 立即處理、每日更新 |
| High | 開發被阻擋、無 workaround | 優先處理 |
| Medium | 有 workaround 的問題 | 正常排程 |
| Low | 問題詢問、功能建議 | 回覆 / 回報產品團隊 |

#### 好的升級報告（Escalation）
- 一句話摘要 + 影響（客戶、商機、期限）。
- 環境（版本、OS、晶片、probe）。
- 重現步驟與**最小重現範例**（附檔）。
- 預期結果 vs 實際結果（含 disassembly / map file 證據）。
- 已排除的原因與已嘗試的方法。
- 目前的 workaround 與客戶的期限。
`,
    terms: [
      { en: "Support case / ticket", zh: "支援案件", note: "單一問題的追蹤單位" },
      { en: "Severity / Priority", zh: "嚴重度 / 優先順序", note: "影響程度與處理順序" },
      { en: "Minimal reproducible example", zh: "最小重現範例", note: "能重現問題的最小程式" },
      { en: "Workaround", zh: "暫時解法", note: "繞過問題、讓客戶繼續工作" },
      { en: "Root cause", zh: "根本原因", note: "問題的真正成因" },
      { en: "Escalation", zh: "升級", note: "交給更專門的團隊處理" },
      { en: "Knowledge base (KB)", zh: "知識庫", note: "可重用的問題與解法文章" },
      { en: "Self-service support", zh: "自助支援", note: "讓客戶自行找到答案" },
    ],
    diagram: {
      title: "Support case lifecycle",
      mermaid: `flowchart TB
  A["Customer reports issue"] --> B["Intake: impact · deadline · severity"]
  B --> C["Collect: version · project files · log · minimal repro"]
  C --> D{"Reproduced?"}
  D -- no --> C2["Compare environments / ask for more data"] --> C
  D -- yes --> E["Analyze: config? UB? volatile? stack?"]
  E --> F{"User-side cause?"}
  F -- yes --> G["Explain + fix"]
  F -- "no / suspected tool issue" --> H["Workaround + escalate to global support / R&D"]
  H --> G
  G --> I["Close with customer confirmation"]
  I --> J["KB article (localize zh-TW if useful)"]`,
    },
    code: [
      {
        title: "給客戶的資訊收集回信（英文範本）",
        lang: "text",
        code: `Hi Mr. Chen,

Thanks for reporting this. To reproduce it on our side, could you send:

1. Exact product and version (Help > About, e.g. "IAR Embedded Workbench for Arm 9.70.x")
2. Target device and debug probe (with firmware version)
3. The project files (.eww/.ewp/.ewd/.icf) and the full build log
4. If possible, a minimal project that still shows the problem
5. When did it start? Any recent changes (tool upgrade, options, code)?

If the files are confidential, a stripped-down example is perfectly fine.
I'll update you by Thursday at the latest.

Best regards,
<Name>, FAE — IAR Taiwan`,
      },
      {
        title: "升級報告範本",
        lang: "text",
        code: `[Escalation] Suspected wrong code at -Ohs for 64-bit shift in loop — EWARM 9.70.x, Cortex-M4

Impact:     Customer ACME (pre-production), blocks release on 2026-11-30. Opp value: strategic.
Env:        Windows 11, EWARM 9.70.x, Cortex-M4F, I-jet
Repro:      attached repro.zip (1 file, 30 lines). Build Release, run in Simulator.
Expected:   result = 0x0000000100000000
Actual:     result = 0x0000000000000000 at -Ohs; correct at -Om and -Oh
Evidence:   disassembly diff attached (lines 12–18); no UB found (checked shift width, types)
Tried:      #pragma optimize=medium on the function → correct (current workaround)
Ask:        confirm defect + ETA, or explain if this is expected behavior`,
        note: "內容為示意，用來練習格式，並非真實的 IAR 缺陷。",
      },
      {
        title: "KB 文章骨架（在地化友善）",
        lang: "text",
        code: `# 標題：用症狀描述（例如：Release 版 ADC 輪詢迴圈卡住）
**適用**：EWARM 9.x，所有 Cortex-M
## 症狀
## 原因
## 解法
## 延伸閱讀（官方文件連結）
## 關鍵字：volatile, optimization, ISR`,
      },
    ],
    analysis: `
#### 最小重現範例是最強的工具
它同時做到三件事：排除客戶專案中的無關因素、讓全球團隊（不同時區）能直接重現、經常讓客戶自己在縮小過程中發現原因。請客戶做重現範例時，給他一個方法（二分刪除、保留版本與選項），而不只是一個要求。

#### 先排除使用者端原因，但不要預設客戶錯
大多數「編譯器 bug」最後是 UB 或設定問題，但溝通時要避免讓客戶覺得被指責。說「我們先排除幾個常見原因，讓升級時更有說服力」比「這應該是你的程式問題」好得多。

#### 跨時區協作
升級給 EMEA / US 團隊時，報告要「自足」：對方在你下班時讀到，應該不需要再問問題就能開始。這也是書面英文能力在 JD 中被強調的原因。

#### KB 與 self-service 的價值
每篇好的 KB 都能減少未來的案件數。在地化（繁體中文）的 KB 對台灣客戶特別有價值，也是 JD 中「localize global documents」的具體實踐。
`,
    cases: [
      {
        title: "「編譯器 bug」其實是 UB",
        body: "客戶回報 -Oh 時 checksum 錯誤。FAE 請客戶縮小成 40 行範例後發現：程式透過不同型別指標存取同一 buffer（違反 strict aliasing）。解釋原因並提供以 memcpy 改寫的方法；結案後寫成 KB「最佳化後計算結果改變：別名規則」，並在地化成中文。",
      },
      {
        title: "真正需要升級的案例",
        body: "客戶在新版工具上遇到 linker 內部錯誤（internal error）。FAE 在相同版本重現，確認舊版正常，整理最小專案與 log 升級給全球支援，同時提供客戶暫時使用舊版的 workaround。開發團隊確認後在後續版本修正，FAE 通知客戶並更新 KB。",
      },
    ],
    customerQs: [
      {
        q: "This is urgent — our production line is down. Can you fix it today?",
        zh: "很緊急，產線停了，今天能解決嗎？",
        answer: "我理解影響很大，會把它列為最高優先。我先確認幾件事：版本、錯誤訊息、最近有什麼變更。今天我的目標是先找到能讓產線恢復的 workaround，同時繼續找根因；我會每隔幾小時更新進度，即使還沒有結論也會告知。",
      },
      {
        q: "We can't share our source code.",
        zh: "我們不能分享原始碼。",
        answer: "完全理解。我們可以用最小重現範例：從原始專案中逐步刪除無關的程式，直到剩下仍能重現問題的最小部分，通常只有幾十行、不含機密邏輯。我也可以遠端協助你們做這件事。",
      },
      {
        q: "Is this a bug in your compiler?",
        zh: "這是你們編譯器的 bug 嗎？",
        answer: "目前還不能確定。我們先用最小範例排除幾個常見原因（例如未定義行為或設定），如果還是有問題，我會帶著證據升級給開發團隊，並先提供 workaround 讓你們不被阻擋。",
      },
    ],
    interviewQs: [
      {
        q: "A customer claims our compiler generates wrong code. How do you handle it?",
        zh: "客戶說我們的編譯器產生錯誤程式碼，你怎麼處理？",
        points: ["受理與影響評估", "收集版本、選項、最小重現", "比較最佳化等級 / 反組譯", "排除 UB、volatile、aliasing", "workaround + 升級報告", "結案與 KB"],
      },
      {
        q: "How do you handle a frustrated customer?",
        zh: "如何處理情緒激動的客戶？",
        points: ["先同理、確認影響", "給出明確的下一步與更新時間", "不推卸、不過度承諾", "守住承諾的更新頻率"],
      },
    ],
    quiz: [
      { id: "t6s-q1", skill: "fae", q: "收到支援案件時，第一個要確認的通常是？", options: ["客戶公司規模", "影響程度、期限與確切工具版本", "客戶是否續約", "客戶的 IDE 主題顏色"], answer: 1, explain: "影響決定優先順序，版本決定能否重現。" },
      { id: "t6s-q2", skill: "fae", q: "最小重現範例的主要價值是？", options: ["讓案件看起來比較簡單", "排除無關因素、讓其他時區的團隊能直接重現", "減少文件", "取代 log"], answer: 1, explain: "同時加速分析與升級。" },
      { id: "t6s-q3", skill: "fae", q: "下列哪一項不屬於好的升級報告？", options: ["重現步驟與附檔", "預期 vs 實際結果", "已排除的原因", "「客戶很急，請快點」而沒有其他資訊"], answer: 3, explain: "報告要自足，讓對方不需再問就能開始。" },
      { id: "t6s-q4", skill: "compiler", q: "最佳化後結果改變，下列何者最常是真正原因？", options: ["一定是編譯器 bug", "未定義行為、缺少 volatile 或 aliasing 違規", "電腦太慢", "授權過期"], answer: 1, explain: "先排除這些，再升級。" },
      { id: "t6s-q5", skill: "fae", q: "JD 中與支援工作相關、需要長期累積的產出是？", options: ["Knowledge base 與 self-service support tools", "銷售報價", "人事評估", "辦公室布置"], answer: 0, explain: "JD 明確要求維護 KB 並參與 self-service tools。" },
    ],
    reading: [
      { title: "How to create a Minimal, Reproducible Example（Stack Overflow）", url: "https://stackoverflow.com/help/minimal-reproducible-example", note: "最小重現範例的通用原則" },
      { title: "IAR Support 首頁", url: "https://www.iar.com/support", note: "官方支援管道與資源" },
      { title: "除錯實戰案例（本站 Lab）", url: "/labs/debug-cases", note: "練習分析與撰寫升級報告" },
    ],
    toVerify: ["IAR 官方支援的嚴重度分級與回應時間（依支援合約）", "IAR 內部升級流程與工具"],
  },

  // ───────────────────────────────────────────── t6-objection
  {
    id: "t6-objection",
    objectives: [
      "用「傾聽 → 釐清 → 回應 → 確認」的結構處理常見異議（價格、GCC 免費、綁定、學習成本）",
      "以事實與可驗證的方式說明差異化，不貶低競爭對手",
      "規劃 20–30 分鐘的技術簡報：故事線、demo、Q&A",
      "用英文清楚表達技術價值（JD：communication and presentation skills、business English）",
    ],
    concept: `
JD 要求「Technical proposals, **differentiation from competitors** and implementation support」以及「Excellent communication and presentation skills」。

#### 異議處理四步驟（LACE / LAER 類框架的精神）
1. **Listen**：讓客戶說完，不打斷。
2. **Clarify**：問「能多說一點嗎？」找出背後真正的顧慮（價格？風險？過去的經驗？）。
3. **Respond**：用事實、客戶自己的數據或可驗證的資源回應；不知道就說會查證。
4. **Confirm**：「這樣有回答到你的顧慮嗎？」

#### 常見異議與回應方向
| 異議 | 背後可能的顧慮 | 回應方向 |
|---|---|---|
| GCC 免費 | 預算、看不出價值 | 量化現有成本（除錯時間、flash、認證）；建議 PoV 以數據決定 |
| 太貴 | 預算週期、ROI 不明 | 了解授權需求範圍、以商業影響換算；交由 Sales 討論方案 |
| 怕被綁定 | 未來換工具成本 | 標準 ELF/DWARF、CMSIS 抽象、CMake / VS Code 整合、雙工具鏈 CI |
| 學習成本 | 團隊時間 | 移植檢查清單、範例專案、教育訓練、在地支援 |
| 晶片廠 IDE 夠用 | 現狀滿意 | 找出痛點（CI、多晶片平台、認證）；不需要硬推 |
| 你們在台灣只有幾個人 | 支援能力 | 在地窗口 + 全球支援團隊（EMEA/US/APAC） |

#### 差異化：說「事實」不說「最強」
- 可說：「IAR 提供功能安全認證版本」「C-STAT 可以檢查 MISRA C 規則」「ILINK 能在 link 時做 stack usage analysis」「有 VS Code 擴充與 Linux 建置工具」—— 都是可在官方文件驗證的功能。
- 避免：「我們一定比 GCC 小 30%」—— 改說「在很多案例中 code size 有改善，但最好在你們的程式上量測」。
- 不貶低對手：GCC 是優秀的工具鏈；FAE 要說明「在哪些情況下，額外的價值值得投資」。

#### 技術簡報結構（20–30 分鐘）
1. **開場（2 分）**：客戶的目標與今天要解決的問題（來自 discovery）。
2. **問題（3 分）**：用客戶的數據或情境描述痛點。
3. **解法 + Demo（10–15 分）**：只展示與痛點相關的 2–3 個功能，例如 map file 找 code size 大戶、stack usage analysis、C-STAT 報告。
4. **證據（3 分）**：PoV 計畫或類似案例（不透露其他客戶機密）。
5. **下一步（2 分）**：具體行動、時程、負責人。
6. **Q&A**：不知道就說「I'll confirm and get back to you by Friday」。
`,
    terms: [
      { en: "Objection handling", zh: "異議處理", note: "回應客戶顧慮" },
      { en: "Differentiation", zh: "差異化", note: "與競爭方案的不同之處" },
      { en: "Value proposition", zh: "價值主張", note: "為客戶帶來的具體價值" },
      { en: "Total cost of ownership (TCO)", zh: "總持有成本", note: "授權 + 人力 + 時程 + 風險" },
      { en: "Vendor lock-in", zh: "供應商綁定", note: "換工具的成本與風險" },
      { en: "Storyline", zh: "簡報故事線", note: "問題 → 解法 → 證據 → 下一步" },
      { en: "Call to action", zh: "行動呼籲", note: "簡報結尾的具體下一步" },
      { en: "Status quo", zh: "現狀", note: "最常見的競爭對手" },
    ],
    diagram: {
      title: "Objection handling loop",
      mermaid: `flowchart LR
  O["Customer objection"] --> L["Listen<br/>don't interrupt"]
  L --> C["Clarify<br/>what's behind it?"]
  C --> R["Respond<br/>facts · their data · PoV"]
  R --> K{"Confirm<br/>concern addressed?"}
  K -- yes --> N["Next step"]
  K -- no --> C`,
    },
    code: [
      {
        title: "英文回應範例：「GCC is free」",
        lang: "text",
        code: `Customer: "Honestly, GCC is free and it works. Why would we pay?"

FAE: "That's a fair point — GCC is a solid toolchain, and many teams ship great products with it.
      Can I ask what made you start looking at other options?"

Customer: "Our control loop is missing its deadline, and we'll need IEC 61508 next year."

FAE: "Got it, so performance on that loop and the certification effort are the two drivers.
      For the certification side, IAR offers functional-safety certified tool versions, which can reduce
      your tool-qualification work. For performance, I'd rather not quote a number —
      let's measure it on your control-loop module in a two-week evaluation with agreed success criteria.
      If it doesn't make a difference, you'll have the data to stay with GCC.
      Does that sound reasonable?"`,
        note: "結構：認同 → 釐清 → 連結到客戶的驅動因素 → 可驗證的下一步 → 確認。",
      },
      {
        title: "20 分鐘技術簡報大綱（範例）",
        lang: "text",
        code: `# ACME servo drive — meeting deadlines & preparing for IEC 61508
1. Your goals (from our last call): ISR < 20 µs, MISRA in CI, SIL 2 in 2027
2. Today: where the time and the flash go (your map file + DWT numbers)
3. Demo (12 min)
   - Build in VS Code with IAR Build extension
   - Map file: top 5 modules by size
   - Linker stack usage analysis + "check that" rule failing the build
   - C-STAT MISRA report as a CI artifact
4. Proposed 3-week PoV: scope, success criteria, owners
5. Next step: sign off criteria by Friday`,
      },
    ],
    analysis: `
#### 異議是資訊，不是攻擊
客戶提出異議通常代表他在認真考慮。真正的顧慮往往在第二層：「太貴」可能是「我不知道怎麼跟主管證明 ROI」。釐清之後，FAE 能提供的通常是**換算框架與證據**，而價格與方案交給 Sales。

#### Demo 的原則
- 只展示和客戶痛點相關的功能；功能巡禮（feature tour）會稀釋重點。
- 用客戶的程式碼或接近的範例；預先演練、準備備案（離線錄影）。
- 每個 demo 段落結尾都回到「這對你們代表什麼」。

#### 英文表達
用短句、先講結論（BLUF：bottom line up front）。準備幾個句型：
- "That's a fair point. Can I ask what's behind that?"
- "I don't want to give you a number I can't back up. Let's measure it."
- "I'll confirm with our product team and get back to you by Friday."
- "To summarize, the next step is…"
這些在本站「英文題庫」與「口說練習」中都可以練習。
`,
    cases: [
      {
        title: "「怕被綁定」的客戶",
        body: "客戶擔心導入 IAR 後無法回頭。FAE 說明輸出是標準 ELF/DWARF、可用 CMSIS 巨集隔離擴充語法、可在 VS Code 與 CMake 流程中使用，並建議保留 GCC 的 CI job 作為檢查。客戶認為風險可控，同意進入評估。重點：把客戶的風險當成真實需求來處理，而不是要說服他放下顧慮。",
      },
      {
        title: "Demo 失敗的補救",
        body: "現場 demo 時 probe 連線失敗。FAE 改用 Simulator 展示同樣的 stack usage 與 C-STAT 流程，並在會後寄出錄影與專案檔。教訓：每個 demo 都準備不依賴硬體的備案。",
      },
    ],
    customerQs: [
      {
        q: "Your competitor says their compiler generates smaller code.",
        zh: "你們的競爭對手說他們的編譯器產生的程式更小。",
        answer: "不同編譯器在不同程式上的結果確實會不同，所以我不建議只看任何一家（包括我們）的宣傳數字。最公平的是在你們的程式上，用相同功能的函式庫設定與記錄完整的方法比較。我很樂意協助設計這個比較。",
      },
      {
        q: "We don't have budget this year.",
        zh: "今年沒有預算。",
        answer: "理解，預算週期很常見。我們可以先用評估版做一個小範圍的技術驗證，讓你們在規劃明年預算時有數據可以用。授權方案的部分我請 Sales 同事跟你們討論。",
      },
    ],
    interviewQs: [
      {
        q: "How would you position IAR against free toolchains like GCC?",
        zh: "你會如何把 IAR 與 GCC 等免費工具鏈做區隔？",
        points: ["尊重 GCC", "依客戶驅動因素：效能/size、認證、分析工具、支援、CI", "以 PoV 數據決定", "不誇大、不貶低"],
      },
      {
        q: "Give a 2-minute technical pitch on a feature you find valuable.",
        zh: "用 2 分鐘介紹一個你認為有價值的功能。",
        points: ["例如 ILINK stack usage analysis", "問題 → 功能 → 證據 → 對客戶的意義", "清楚的英文結構"],
      },
      {
        q: "Tell me about a presentation that didn't go well.",
        zh: "請舉例一次不順利的簡報。",
        points: ["STAR", "具體問題（技術故障 / 聽眾不對）", "當場如何補救", "之後的改變"],
      },
    ],
    quiz: [
      { id: "t6o-q1", skill: "fae", q: "客戶說「太貴了」，第一步最好是？", options: ["立刻給折扣", "釐清背後的顧慮（預算週期？ROI？範圍？）", "結束會議", "比較競爭對手價格"], answer: 1, explain: "先 clarify，價格與方案交給 Sales。" },
      { id: "t6o-q2", skill: "fae", q: "下列哪一種差異化說法最恰當？", options: ["我們一定比 GCC 小 30%", "GCC 很爛", "IAR 有功能安全認證版本；code size 的差異建議在你們的程式上量測", "大家都用我們"], answer: 2, explain: "可驗證的事實 + 以數據決定。" },
      { id: "t6o-q3", skill: "fae", q: "回應「怕被綁定」最有說服力的做法是？", options: ["保證永遠不會漲價", "說明標準格式、CMSIS 抽象、雙工具鏈 CI 等降低風險的方法", "說綁定沒關係", "迴避問題"], answer: 1, explain: "把風險當成真實需求處理。" },
      { id: "t6o-q4", skill: "fae", q: "技術 demo 最重要的原則是？", options: ["展示所有功能", "只展示與客戶痛點相關的功能並連結到其意義", "越長越好", "不準備備案"], answer: 1, explain: "功能巡禮會稀釋重點。" },
      { id: "t6o-q5", skill: "fae", q: "Q&A 中被問到不確定的問題，最好的回應是？", options: ["猜一個答案", "說「I'll confirm and get back to you by Friday」並確實跟進", "改變話題", "說這不重要"], answer: 1, explain: "誠實 + 明確的跟進時間。" },
    ],
    reading: [
      { title: "英文題庫（本站）", url: "/english?cat=fae", note: "FAE 情境英文練習" },
      { title: "模擬面試：客戶情境（本站）", url: "/mock", note: "練習異議處理" },
      { title: "IAR C-STAT 產品資訊", url: "https://www.iar.com/products/requirements/functional-safety", note: "差異化話題的事實來源（功能安全與分析工具）" },
    ],
    toVerify: ["IAR 功能安全認證版本的具體標準與適用架構", "C-STAT 支援的規則集（MISRA C:2012/2023、CERT C 等）依版本"],
  },
];
