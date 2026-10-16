import type { SkillId } from "./skills";

export type QuizQuestion = {
  id: string;
  skill: SkillId;
  q: string;
  /** optional code shown with the question */
  code?: string;
  options: string[];
  answer: number;
  explain: string;
};

export type CodeSample = { title: string; lang: "c" | "cpp" | "asm" | "text" | "bash" | "cmake" | "ld" | "icf" | "yaml"; code: string; note?: string };

export type LessonContent = {
  id: string;
  /** 1. Learning Objectives */
  objectives: string[];
  /** 2. 中文概念說明 (mini-markdown) */
  concept: string;
  /** 3. 英文專有名詞 */
  terms: { en: string; zh: string; note: string }[];
  /** 4. 架構圖或流程圖 (Mermaid source) */
  diagram: { title: string; mermaid: string; caption?: string };
  /** 5. C/C++ 實際程式範例 */
  code: CodeSample[];
  /** 6. 原理分析 (mini-markdown) */
  analysis: string;
  /** 7. 實際工程案例 */
  cases: { title: string; body: string }[];
  /** 8. IAR FAE 可能遇到的客戶問題 */
  customerQs: { q: string; zh: string; answer: string }[];
  /** 9. 常見面試問題 */
  interviewQs: { q: string; zh: string; points: string[] }[];
  /** 10. Quiz（至少 5 題） */
  quiz: QuizQuestion[];
  /** 11. 延伸閱讀 — url only when verified; `verify` marks content to double-check */
  reading: { title: string; url?: string; note: string }[];
  /** Items needing verification against official docs (shown as 待查證) */
  toVerify?: string[];
};
