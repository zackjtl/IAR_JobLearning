import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { upsertCard } from "@/lib/srs";
import { DIAGNOSTIC_QUESTIONS, LISTENING_ITEMS } from "@/content/diagnostic";
import { SKILLS, ENGLISH_SUBSKILLS, type SkillId } from "@/content/skills";
import { latestDiagnostic } from "@/lib/progress";

type Body = {
  answers: { questionId: string; chosen: number }[];
  listening: { id: string; chosen: number }[];
  self: Record<string, number>;
};

export async function GET() {
  return NextResponse.json({ latest: await latestDiagnostic() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const byId = Object.fromEntries(DIAGNOSTIC_QUESTIONS.map((q) => [q.id, q]));
  const perSkill: Partial<Record<SkillId, { n: number; ok: number }>> = {};
  const graded = body.answers
    .filter((a) => byId[a.questionId])
    .map((a) => {
      const q = byId[a.questionId];
      const correct = a.chosen === q.answer;
      const s = (perSkill[q.skill] ??= { n: 0, ok: 0 });
      s.n++;
      if (correct) s.ok++;
      return { ...a, skill: q.skill, correct };
    });

  // English: listening accuracy (40%) + self-assessment average (60%)
  const listenOk = body.listening.filter((l) => LISTENING_ITEMS.find((x) => x.id === l.id)?.answer === l.chosen).length;
  const listeningPct = Math.round((listenOk / LISTENING_ITEMS.length) * 100);
  const selfVals = ENGLISH_SUBSKILLS.map((e) => body.self[e.id]).filter((v): v is number => typeof v === "number");
  const selfAvg = selfVals.length ? (selfVals.reduce((a, b) => a + b, 0) / selfVals.length) * 20 : null;

  const scores: Partial<Record<SkillId, number>> = {};
  for (const s of SKILLS) {
    if (s.id === "english") continue;
    const r = perSkill[s.id];
    if (r && r.n > 0) scores[s.id] = Math.round((r.ok / r.n) * 100);
  }
  scores.english = Math.round(selfAvg === null ? listeningPct : listeningPct * 0.4 + selfAvg * 0.6);

  const result = await prisma.diagnosticResult.create({
    data: {
      scoresJson: JSON.stringify(scores),
      answersJson: JSON.stringify(graded),
      selfJson: JSON.stringify({ english: body.self, listening: listeningPct }),
    },
  });
  await prisma.quizAttempt.createMany({
    data: graded.map((g) => ({ source: "diagnostic", refId: "diagnostic", questionId: g.questionId, skill: g.skill, chosen: g.chosen, correct: g.correct })),
  });
  // Wrong / unsure answers become review cards
  for (const g of graded.filter((x) => !x.correct)) {
    const q = byId[g.questionId];
    await upsertCard({
      cardKey: `quiz:${q.id}`,
      kind: "quiz",
      skill: q.skill,
      front: JSON.stringify({ q: q.q, code: q.code, options: q.options }),
      back: JSON.stringify({ answer: q.answer, explain: q.explain }),
    });
  }
  await prisma.activity.create({
    data: { type: "diagnostic", refId: String(result.id), minutes: 20, payloadJson: JSON.stringify({ title: "完成診斷測驗" }) },
  });
  return NextResponse.json({ id: result.id, scores, listeningPct });
}
