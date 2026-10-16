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
