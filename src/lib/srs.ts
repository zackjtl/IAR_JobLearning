import "server-only";
import { prisma } from "./db";

/** SM-2 style scheduling. grade: 0=Again, 1=Hard, 2=Good, 3=Easy */
export function schedule(card: { ease: number; interval: number; reps: number; lapses: number }, grade: 0 | 1 | 2 | 3) {
  let { ease, interval, reps, lapses } = card;
  if (grade === 0) {
    reps = 0;
    lapses += 1;
    interval = 0; // again today (10 min)
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = grade === 1 ? 1 : grade === 2 ? 1 : 3;
    else if (reps === 2) interval = grade === 1 ? 3 : grade === 2 ? 4 : 6;
    else interval = Math.round(interval * (grade === 1 ? 1.2 : grade === 2 ? ease : ease * 1.3));
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  }
  const due = new Date(Date.now() + (interval === 0 ? 10 * 60 * 1000 : interval * 24 * 3600 * 1000));
  return { ease, interval, reps, lapses, due };
}

/** Add (or re-activate) a card; existing scheduling is kept unless `resetIfExists`. */
export async function upsertCard(c: { cardKey: string; kind: string; skill: string; front: string; back: string }, resetIfExists = false) {
  await prisma.reviewCard.upsert({
    where: { cardKey: c.cardKey },
    create: { ...c },
    update: resetIfExists ? { front: c.front, back: c.back, due: new Date(), suspended: false, reps: 0 } : { front: c.front, back: c.back },
  });
}
