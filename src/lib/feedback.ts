import "server-only";
import { aiJson, aiProvider } from "@/lib/ai";
import { ruleEvaluate, type RuleEval } from "@/lib/evaluate";

export type AiEval = {
  method: "ai";
  scores: { technical: number; clarity: number; english: number; structure: number; completeness: number };
  overall: number;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  corrections?: { original: string; better: string }[];
};
export type Evaluation = AiEval | RuleEval;

export const CANDIDATE_BACKGROUND = `Candidate background (the ONLY facts you may assume): Taiwan-based Software Department Manager; C/C++/C#; Embedded Linux; FreeRTOS; Arm-based SoC; Xilinx Zynq / UltraScale+ MPSoC; FPGA SoC HW/SW integration; SSD/SD controller firmware; NAND flash; Windows desktop & Linux user-space apps; Make/CMake/GCC; team management. NOT confirmed: any hands-on IAR Embedded Workbench experience, work inside a global company, formal FAE / sales experience. Never invent experience the candidate does not have.`;

const EVAL_SYSTEM = `You are an interview coach for an IAR Systems FAE / Technical Support Specialist role in Taipei.
${CANDIDATE_BACKGROUND}
Evaluate the candidate's spoken-style English answer using only observable features of the text. Do NOT claim to judge psychological confidence.
Return JSON: {"scores":{"technical":0-100,"clarity":0-100,"english":0-100,"structure":0-100,"completeness":0-100},"overall":0-100,
"strengths":[max 3 short strings in Traditional Chinese],"improvements":[max 4 short strings in Traditional Chinese],
"corrections":[{"original":"phrase from the answer","better":"more natural English"}] (max 4),
"improvedAnswer":"a natural, easy-to-speak business-English answer (80-150 words) that stays truthful to the candidate background; keep [placeholders] for unknown specifics"}`;

export async function evaluateAnswer(input: { question: string; answer: string; keywords?: string[]; context?: string }): Promise<Evaluation> {
  if (aiProvider()) {
    try {
      const r = await aiJson<Omit<AiEval, "method">>(EVAL_SYSTEM, [
        { role: "user", content: `Question: ${input.question}\n${input.context ? `Context: ${input.context}\n` : ""}Candidate answer:\n"""${input.answer}"""` },
      ], { maxTokens: 1200, temperature: 0.3 });
      return { method: "ai", ...r };
    } catch (e) {
      console.error("AI evaluation failed, falling back to rules", e);
    }
  }
  return ruleEvaluate(input.answer, input.keywords ?? []);
}

/** Convert either evaluation to a single 0-100 score. */
export function overallOf(e: Evaluation) {
  return Math.round(e.overall);
}
