import type { RtosTask } from "@/content/labs";

export type SimEvent = { t: number; text: string };
export type SimResult = {
  /** running task name per tick ("" = idle) */
  timeline: string[];
  /** effective priority per task per tick (for showing inheritance) */
  effPrio: Record<string, number[]>;
  /** per tick: who holds the mutex ("" = free) */
  owner: string[];
  /** blocked-on-mutex flag per task per tick */
  blocked: Record<string, boolean[]>;
  events: SimEvent[];
  finish: Record<string, number | null>;
};

/**
 * Fixed-priority preemptive scheduler, single core, one mutex, tick-based.
 * Script steps: "c" = run one tick, "L" = take mutex, "U" = give mutex (L/U take no time).
 * With `inherit`, a task holding the mutex runs at the highest priority of its waiters.
 */
export function simulate(tasks: RtosTask[], inherit: boolean, maxTicks = 40): SimResult {
  const st = tasks.map((t) => ({ ...t, pc: 0, eff: t.prio, blocked: false, done: false, finishAt: null as number | null }));
  let owner: (typeof st)[number] | null = null;
  const timeline: string[] = [];
  const owners: string[] = [];
  const effPrio: Record<string, number[]> = Object.fromEntries(tasks.map((t) => [t.name, []]));
  const blocked: Record<string, boolean[]> = Object.fromEntries(tasks.map((t) => [t.name, []]));
  const events: SimEvent[] = [];

  const ready = (t: number) => st.filter((x) => !x.done && !x.blocked && x.release <= t);
  const pick = (t: number) => ready(t).sort((a, b) => b.eff - a.eff || a.release - b.release)[0];

  for (let t = 0; t < maxTicks; t++) {
    for (const x of st) if (x.release === t) events.push({ t, text: `${x.name} 變成 ready（優先權 ${x.prio}）` });
    let ran = "";
    for (let guard = 0; guard < 20; guard++) {
      const cur = pick(t);
      if (!cur) break;
      const op = cur.script[cur.pc];
      if (op === undefined) {
        cur.done = true;
        cur.finishAt = t;
        continue;
      }
      if (op === "L") {
        if (!owner) {
          owner = cur;
          cur.pc++;
          events.push({ t, text: `${cur.name} 取得 mutex` });
          continue;
        }
        cur.blocked = true;
        events.push({ t, text: `${cur.name} 等待 mutex（被 ${owner.name} 持有）→ blocked` });
        if (inherit && cur.eff > owner.eff) {
          owner.eff = cur.eff;
          events.push({ t, text: `priority inheritance：${owner.name} 暫時提升為優先權 ${owner.eff}` });
        }
        continue;
      }
      if (op === "U") {
        cur.pc++;
        owner = null;
        if (cur.eff !== cur.prio) events.push({ t, text: `${cur.name} 恢復原優先權 ${cur.prio}` });
        cur.eff = cur.prio;
        const waiter = st.filter((x) => x.blocked).sort((a, b) => b.prio - a.prio)[0];
        events.push({ t, text: `${cur.name} 釋放 mutex` + (waiter ? `，喚醒 ${waiter.name}` : "") });
        if (waiter) {
          waiter.blocked = false;
          owner = waiter;
          waiter.pc++; // its pending "L" now succeeds
          events.push({ t, text: `${waiter.name} 取得 mutex` });
        }
        continue;
      }
      // compute one tick
      cur.pc++;
      ran = cur.name;
      if (cur.pc >= cur.script.length) {
        cur.done = true;
        cur.finishAt = t + 1;
        events.push({ t: t + 1, text: `${cur.name} 完成` });
      }
      break;
    }
    timeline.push(ran);
    owners.push(owner?.name ?? "");
    for (const x of st) {
      effPrio[x.name].push(x.eff);
      blocked[x.name].push(x.blocked);
    }
    if (st.every((x) => x.done)) break;
  }
  return { timeline, effPrio, owner: owners, blocked, events, finish: Object.fromEntries(st.map((x) => [x.name, x.finishAt])) };
}
