// Rule-based answer evaluation (works without AI). Pure functions, safe on client and server.
// Scores are heuristics based on OBSERVABLE text features only — never a judgement of "confidence".

export type RuleEval = {
  method: "rule";
  words: number;
  scores: { content: number; structure: number; clarity: number; english: number };
  overall: number;
  matched: string[];
  missing: string[];
  fillers: string[];
  notes: string[];
};

const STRUCTURE = [
  "first", "second", "then", "next", "finally", "for example", "for instance", "because", "so ", "as a result",
  "in summary", "to summarize", "the reason", "my approach", "situation", "task", "action", "result", "however", "also",
];
const FILLERS = ["um", "uh", "erm", "you know", "kind of", "sort of", "basically", "actually", "like,", "i mean"];

function norm(s: string) {
  return " " + s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'.,\- ]+/g, " ").replace(/\s+/g, " ") + " ";
}

export function ruleEvaluate(answer: string, keywords: string[], opts: { minWords?: number; maxWords?: number } = {}): RuleEval {
  const text = norm(answer);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const minW = opts.minWords ?? 30;
  const maxW = opts.maxWords ?? 180;
  const matched = keywords.filter((k) => text.includes(k.toLowerCase()));
  const missing = keywords.filter((k) => !matched.includes(k));
  const structureHits = STRUCTURE.filter((m) => text.includes(" " + m));
  const fillers = FILLERS.filter((f) => text.includes(" " + f + (f.endsWith(",") ? "" : " ")));
  const sentences = answer.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgLen = sentences.length ? words / sentences.length : words;

  const coverage = keywords.length ? matched.length / keywords.length : 0.5;
  let lengthFactor = 1;
  if (words < minW) lengthFactor = Math.max(0.2, words / minW);
  else if (words > maxW) lengthFactor = Math.max(0.6, maxW / words);
  const content = Math.round(Math.min(100, (35 + coverage * 75) * lengthFactor));
  const structure = Math.round(Math.min(100, 35 + structureHits.length * 13 + (sentences.length >= 3 ? 10 : 0)));
  let clarity = 85;
  if (avgLen > 28) clarity -= Math.min(35, (avgLen - 28) * 2);
  if (avgLen < 6 && words > 10) clarity -= 15;
  clarity -= fillers.length * 6;
  if (words < 12) clarity -= 25;
  clarity = Math.round(Math.max(10, Math.min(100, clarity)));
  // Very rough "English" proxy: capitalised sentences, no repeated words in a row, no fillers.
  const repeats = (answer.toLowerCase().match(/\b(\w+)\s+\1\b/g) ?? []).length;
  let english = 80 - repeats * 8 - fillers.length * 5;
  if (sentences.length && sentences.filter((s) => /^[A-Z0-9"(\[]/.test(s)).length / sentences.length < 0.6) english -= 10;
  if (words < 12) english -= 20;
  english = Math.round(Math.max(10, Math.min(95, english)));

  const notes: string[] = [];
  if (words < minW) notes.push(`回答偏短（${words} 字）。建議至少 ${minW} 字，補上具體例子或結果。`);
  if (words > maxW) notes.push(`回答偏長（${words} 字）。口說時先講結論，控制在 ${maxW} 字內。`);
  if (missing.length && keywords.length) notes.push(`可以考慮提到：${missing.slice(0, 5).join("、")}`);
  if (structureHits.length < 2) notes.push("加入結構詞（First / Then / For example / As a result），讓聽者容易跟上。");
  if (avgLen > 28) notes.push("句子偏長，口說時拆成較短的句子。");
  if (fillers.length) notes.push(`偵測到填充詞：${fillers.join("、")}。可以用短暫停頓取代。`);
  if (!notes.length) notes.push("長度、結構與重點涵蓋都不錯。下一步：試著用口說在 60–90 秒內完成。");

  const overall = Math.round(content * 0.45 + structure * 0.25 + clarity * 0.2 + english * 0.1);
  return { method: "rule", words, scores: { content, structure, clarity, english }, overall, matched, missing, fillers, notes };
}

function stem(w: string) {
  return w.length > 5 ? w.replace(/(ations?|ing|ed|ies|es|s)$/, "") : w.replace(/s$/, "");
}

/** Token-set similarity for nearest-match search (copilot fallback). */
export function similarity(a: string, b: string) {
  const stop = new Set(["the", "a", "an", "you", "your", "to", "of", "and", "in", "is", "are", "do", "how", "what", "would", "with", "for", "on", "me", "about", "i", "we", "it", "that", "this", "be", "or", "can"]);
  const tok = (s: string) => new Set(norm(s).split(/[\s.,]+/).filter((w) => w.length > 1 && !stop.has(w)).map(stem));
  const A = tok(a), B = tok(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.sqrt(A.size * B.size);
}
