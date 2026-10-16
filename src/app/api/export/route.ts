import { prisma } from "@/lib/db";

export async function GET() {
  const [settings, diagnostics, attempts, lessons, notes, bookmarks, cards, activities, mocks, plan] = await Promise.all([
    prisma.settings.findMany(),
    prisma.diagnosticResult.findMany(),
    prisma.quizAttempt.findMany(),
    prisma.lessonProgress.findMany(),
    prisma.note.findMany(),
    prisma.bookmark.findMany(),
    prisma.reviewCard.findMany(),
    prisma.activity.findMany(),
    prisma.mockSession.findMany(),
    prisma.planTask.findMany(),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), settings, diagnostics, attempts, lessons, notes, bookmarks, cards, activities, mocks, plan }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="iar-academy-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
