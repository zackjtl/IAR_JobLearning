import { NextResponse } from "next/server";
import { prisma, parseJson } from "@/lib/db";
import { aiJson, aiProvider, type ChatMsg } from "@/lib/ai";
import { ruleEvaluate } from "@/lib/evaluate";
import { CANDIDATE_BACKGROUND, type Evaluation } from "@/lib/feedback";
import { MOCK_MODES, MOCK_QUESTIONS, personaSystem, type MockMode } from "@/content/mock";

export type Turn = { role: "interviewer" | "candidate"; text: string; zh?: string; qid?: string; followUp?: boolean; eval?: Evaluation };
type Summary = { avg: number; count: number; method: "ai" | "rule"; comment?: string; strengths?: string[]; improvements?: string[]; nextSteps?: string[]; dims?: Record<string, number> };

const MAX_ANSWERS = 10;

function isMode(m: unknown): m is MockMode {
  return MOCK_MODES.some((x) => x.id === m);
}

function lastInterviewer(t: Turn[]) {
  for (let i = t.length - 1; i >= 0; i--) if (t[i].role === "interviewer") return t[i];
  return undefined;
}

function ruleNext(mode: MockMode, transcript: Turn[], answer: string): Omit<Turn, "role"> | null {
  const bank = MOCK_QUESTIONS[mode];
  const cur = lastInterviewer(transcript);
  const q = bank.find((x) => x.id === cur?.qid);
  const text = answer.toLowerCase();
  if (q && !cur?.followUp) {
    const asked = new Set(transcript.filter((t) => t.role === "interviewer").map((t) => t.text));
    const f = q.followUps.find((f) => {
      if (asked.has(f.text)) return false;
      if (f.ifMissing) return !f.ifMissing.some((k) => text.includes(k));
      if (f.ifContains) return f.ifContains.some((k) => text.includes(k));
      return true;
    });
    if (f) return { text: f.text, zh: f.zh, qid: q.id, followUp: true };
  }
  const askedMain = new Set(transcript.filter((t) => t.role === "interviewer" && !t.followUp).map((t) => t.qid));
  const nq = bank.find((x) => !askedMain.has(x.id));
  return nq ? { text: nq.text, zh: nq.zh, qid: nq.id } : null;
}

type AiTurn = {
  feedback: Omit<Extract<Evaluation, { method: "ai" }>, "method">;
  next: { text: string; zh: string; isFollowUp: boolean } | null;
  done: boolean;
};

async function aiTurn(mode: MockMode, transcript: Turn[], answerCount: number): Promise<AiTurn> {
  const system = `${personaSystem(mode)}
${CANDIDATE_BACKGROUND}
After each candidate answer, do two things:
1) Give coaching feedback on that answer using only observable features of the text (never claim to judge psychological confidence).
2) Decide your next interviewer line: a follow-up that reacts to what was said (isFollowUp=true) or a new topic (false).
The interview should cover about 5-6 topics; set "done": true and "next": null once ${MAX_ANSWERS} answers are reached or the topics are covered (answers so far: ${answerCount}).
JSON shape: {"feedback":{"scores":{"technical":0-100,"clarity":0-100,"english":0-100,"structure":0-100,"completeness":0-100},"overall":0-100,"strengths":["zh-TW"],"improvements":["zh-TW"],"corrections":[{"original":"...","better":"..."}],"improvedAnswer":"natural spoken English, truthful to the background, 60-140 words"},"next":{"text":"English","zh":"Traditional Chinese translation","isFollowUp":true},"done":false}`;
  const messages: ChatMsg[] = [{ role: "user", content: "(The candidate has joined the call. Begin.)" }];
  for (const t of transcript) messages.push({ role: t.role === "interviewer" ? "assistant" : "user", content: t.text });
  return aiJson<AiTurn>(system, messages, { maxTokens: 1600, temperature: 0.6 });
}

async function summarize(mode: MockMode, transcript: Turn[]): Promise<Summary> {
  const evals = transcript.filter((t) => t.role === "candidate" && t.eval).map((t) => t.eval!);
  const avg = evals.length ? Math.round(evals.reduce((a, e) => a + e.overall, 0) / evals.length) : 0;
  const dims: Record<string, number> = {};
  for (const e of evals) for (const [k, v] of Object.entries(e.scores)) dims[k] = (dims[k] ?? 0) + v / evals.length;
  for (const k of Object.keys(dims)) dims[k] = Math.round(dims[k]);
  if (aiProvider() && evals.length) {
    try {
      const r = await aiJson<{ comment: string; strengths: string[]; improvements: string[]; nextSteps: string[] }>(
        `You are an interview coach. ${CANDIDATE_BACKGROUND} Summarize this ${mode} mock interview for the IAR FAE role. Use only observable features of the answers. JSON: {"comment":"2-3 sentences zh-TW","strengths":["zh-TW", max 3],"improvements":["zh-TW", max 4],"nextSteps":["zh-TW concrete practice suggestions", max 3]}`,
        [{ role: "user", content: transcript.map((t) => `${t.role.toUpperCase()}: ${t.text}`).join("\n") }],
        { maxTokens: 900, temperature: 0.3 },
      );
      return { avg, count: evals.length, method: "ai", dims, ...r };
    } catch (e) {
      console.error("AI summary failed", e);
    }
  }
  const notes = evals.flatMap((e) => (e.method === "rule" ? e.notes : e.improvements ?? []));
  const freq = new Map<string, number>();
  for (const n of notes) { const k = n.replace(/（.*?）|\d+/g, "").slice(0, 18); freq.set(k, (freq.get(k) ?? 0) + 1); }
  const top = [...new Set(notes)].sort((a, b) => (freq.get(b.replace(/（.*?）|\d+/g, "").slice(0, 18)) ?? 0) - (freq.get(a.replace(/（.*?）|\d+/g, "").slice(0, 18)) ?? 0)).slice(0, 4);
  return { avg, count: evals.length, method: evals.some((e) => e.method === "ai") ? "ai" : "rule", dims, improvements: top, comment: "規則式摘要：依每題的長度、結構詞、關鍵詞涵蓋與填充詞統計。" };
}

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (id) {
    const s = await prisma.mockSession.findUnique({ where: { id } });
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ...s, transcript: parseJson<Turn[]>(s.transcriptJson, []), summary: parseJson<Summary | null>(s.summaryJson, null) });
  }
  const rows = await prisma.mockSession.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json(rows.map((s) => ({ id: s.id, mode: s.mode, status: s.status, createdAt: s.createdAt, summary: parseJson<Summary | null>(s.summaryJson, null) })));
}

export async function POST(req: Request) {
  const b = (await req.json()) as { action: "start" | "answer" | "finish"; mode?: string; id?: number; answer?: string; spoken?: boolean };

  if (b.action === "start") {
    if (!isMode(b.mode)) return NextResponse.json({ error: "bad mode" }, { status: 400 });
    const q = MOCK_QUESTIONS[b.mode][0];
    const transcript: Turn[] = [{ role: "interviewer", text: q.text, zh: q.zh, qid: q.id }];
    const s = await prisma.mockSession.create({ data: { mode: b.mode, transcriptJson: JSON.stringify(transcript) } });
    return NextResponse.json({ id: s.id, mode: s.mode, status: s.status, transcript, ai: !!aiProvider() });
  }

  const s = b.id ? await prisma.mockSession.findUnique({ where: { id: b.id } }) : null;
  if (!s || !isMode(s.mode)) return NextResponse.json({ error: "session not found" }, { status: 404 });
  const mode = s.mode;
  const transcript = parseJson<Turn[]>(s.transcriptJson, []);

  if (b.action === "answer") {
    if (s.status !== "active") return NextResponse.json({ error: "session finished" }, { status: 400 });
    const answer = (b.answer ?? "").trim().slice(0, 4000);
    if (!answer) return NextResponse.json({ error: "empty" }, { status: 400 });
    const cur = lastInterviewer(transcript);
    const bankQ = MOCK_QUESTIONS[mode].find((x) => x.id === cur?.qid);
    transcript.push({ role: "candidate", text: answer });
    const answerCount = transcript.filter((t) => t.role === "candidate").length;
    let evaluation: Evaluation | null = null;
    let next: Omit<Turn, "role"> | null = null;
    let done = false;
    if (aiProvider()) {
      try {
        const r = await aiTurn(mode, transcript, answerCount);
        evaluation = { method: "ai", ...r.feedback };
        done = r.done || !r.next || answerCount >= MAX_ANSWERS;
        if (!done && r.next) next = { text: r.next.text, zh: r.next.zh, followUp: r.next.isFollowUp };
      } catch (e) {
        console.error("AI mock turn failed, using rules", e);
      }
    }
    if (!evaluation) {
      evaluation = ruleEvaluate(answer, bankQ?.keywords ?? [], { minWords: 25, maxWords: 170 });
      next = answerCount >= MAX_ANSWERS ? null : ruleNext(mode, transcript, answer);
      done = !next;
    }
    transcript[transcript.length - 1].eval = evaluation;
    if (next) transcript.push({ role: "interviewer", ...next });
    await prisma.mockSession.update({ where: { id: s.id }, data: { transcriptJson: JSON.stringify(transcript) } });
    return NextResponse.json({ transcript, done });
  }

  if (b.action === "finish") {
    const summary = await summarize(mode, transcript);
    await prisma.mockSession.update({ where: { id: s.id }, data: { status: "finished", summaryJson: JSON.stringify(summary) } });
    if (summary.count > 0) {
      const followEvals = transcript.map((t, i) => (t.role === "candidate" && t.eval && transcript[i - 1]?.followUp ? t.eval.overall : null)).filter((x): x is number => x !== null);
      const sub: Record<string, number> = { [mode === "technical" ? "techExplain" : "business"]: summary.avg };
      if (followEvals.length) sub.followUp = Math.round(followEvals.reduce((a, b) => a + b, 0) / followEvals.length);
      if (b.spoken) sub.speaking = summary.avg;
      await prisma.activity.create({
        data: { type: "mock", refId: `mock:${s.id}`, skill: mode === "technical" ? "compiler" : mode === "customer" ? "fae" : "english", minutes: Math.max(5, summary.count * 3), score: summary.avg, payloadJson: JSON.stringify({ title: `模擬面試：${MOCK_MODES.find((m) => m.id === mode)?.label}`, subScores: sub, method: summary.method }) },
      });
    }
    return NextResponse.json({ summary });
  }
  return NextResponse.json({ error: "bad action" }, { status: 400 });
}
