export type SkillId = "cpp" | "compiler" | "linker" | "debug" | "rtos" | "cicd" | "fae" | "english";

export const SKILLS: { id: SkillId; label: string; en: string; short: string }[] = [
  { id: "cpp", label: "C/C++ 基礎", en: "C/C++ Fundamentals", short: "C/C++" },
  { id: "compiler", label: "編譯器與最佳化", en: "Compiler & Optimization", short: "Compiler" },
  { id: "linker", label: "Linker 與記憶體配置", en: "Linker & Memory Layout", short: "Linker" },
  { id: "debug", label: "除錯與組合語言", en: "Debugger & Assembly", short: "Debug/ASM" },
  { id: "rtos", label: "RTOS / Embedded Linux", en: "RTOS / Embedded Linux", short: "RTOS/Linux" },
  { id: "cicd", label: "CI/CD 與建置系統", en: "CI/CD & Build System", short: "CI/CD" },
  { id: "fae", label: "FAE / 售前技能", en: "FAE / Pre-sales Skills", short: "FAE" },
  { id: "english", label: "英文溝通", en: "English Communication", short: "English" },
];

export const SKILL_LABEL: Record<SkillId, string> = Object.fromEntries(SKILLS.map((s) => [s.id, s.label])) as Record<SkillId, string>;

export type EnglishSubSkill = "listening" | "speaking" | "intro" | "techExplain" | "business" | "followUp";

export const ENGLISH_SUBSKILLS: { id: EnglishSubSkill; label: string; en: string; descriptors: string[] }[] = [
  {
    id: "listening",
    label: "技術聽力",
    en: "Technical Listening",
    descriptors: [
      "需要看字幕或文字才能理解技術英文",
      "慢速、清楚的英文可以理解大意",
      "一般速度的技術說明可以理解約七成",
      "會議中能跟上討論，偶爾需要請對方重複",
      "能輕鬆理解不同口音的技術討論",
    ],
  },
  {
    id: "speaking",
    label: "即時口說",
    en: "Spontaneous Speaking",
    descriptors: [
      "需要先寫下來才能說",
      "能說簡短句子，但常停頓找字",
      "能完成回答，但句型單一、偶有卡住",
      "能流暢回答大部分問題，偶有文法錯誤",
      "能自然、有條理地即時表達",
    ],
  },
  {
    id: "intro",
    label: "英文自我介紹",
    en: "Self Introduction",
    descriptors: ["還沒有準備英文自我介紹", "有草稿但說不順", "能背出準備好的版本", "能依對象調整長短與重點", "能自然地說並回應延伸問題"],
  },
  {
    id: "techExplain",
    label: "技術問題解釋",
    en: "Explaining Technical Topics",
    descriptors: ["很難用英文解釋技術概念", "能說出關鍵字，但難以串成完整說明", "能解釋熟悉的主題", "能用例子與比喻向不同程度的人解釋", "能清楚解釋複雜問題與權衡取捨"],
  },
  {
    id: "business",
    label: "商務溝通",
    en: "Business Communication",
    descriptors: ["很少用英文寫商務信件或開會", "能寫簡單 email，開會多半聽", "能寫清楚的 email、參與一般會議", "能主持會議、處理需求與時程討論", "能進行談判與高階簡報"],
  },
  {
    id: "followUp",
    label: "回答追問",
    en: "Handling Follow-up Questions",
    descriptors: ["被追問時常常卡住", "能回答簡單追問", "能回答多數追問，但組織較慢", "能穩定回應追問並補充例子", "能預判追問並主動引導對話"],
  },
];
