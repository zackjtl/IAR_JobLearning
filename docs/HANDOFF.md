# Handoff — IAR FAE Interview Academy

> Last updated: 2026-10-16 (Asia/Taipei), after Phase 5. Written so that you (or a new Claude session) can continue the work on another machine.
> Original requirements: [`docs/SPEC.md`](./SPEC.md) (the full Chinese spec). Job description source: `IAR FAE Taiwan.pdf` (not in repo; its content is extracted into `src/content/jd.ts`).

---

## 1. Current status at a glance

| Phase | Scope (from SPEC §6) | Status |
|---|---|---|
| 1 | Init, UI/navigation, Dashboard, DB, JD Requirement Mapping, diagnostic test | ✅ Done |
| 2 | Technical Learning Center, real lesson content, Quiz system, progress tracking | ✅ Done (30 lessons, Tracks 1–6) |
| 3 | English interview bank, Speaking/Listening practice, recruiter bank | ✅ Done (commit 619d09e) |
| 4 | AI Mock Interview (3 modes), Interview Copilot, AI feedback | ✅ Done (commit 619d09e; rule-based fallback when no AI key) |
| 5 | Interactive labs, Spaced repetition UI, analytics, 14-day plan, daily 30/60/90 mode | ✅ Done (7 labs, /review, /plan, /notes) |

Every commit so far passes `npm run build`, `npm run lint` (0 errors), `npm run typecheck`, and was smoke-tested against a local Postgres.

## 2. Deployment status

- **GitHub**: `zackjtl/IAR_JobLearning`, branch `main`. Claude GitHub App is connected (push works).
- **Supabase**: project `iar-fae-academy`, ref `kziumcydvgacwngfdvtu`, region `ap-northeast-1` (Tokyo), free tier, org `zackjtl@gmail.com's Org`.
  - Schema (`prisma/migrations/20261016000000_init`) is **already applied**, plus RLS enabled on every table (blocks Supabase Data API; the app connects as `postgres`, which bypasses RLS) and a `_prisma_migrations` row so `prisma migrate deploy` treats init as applied.
- **Vercel**: *not yet confirmed deployed* at time of writing. Required env vars:
  - `DATABASE_URL` = Supabase **Transaction pooler** URI (port **6543**, host `aws-0-ap-northeast-1.pooler.supabase.com`, user `postgres.kziumcydvgacwngfdvtu`). URL-encode special characters in the password (`@` → `%40`).
  - `APP_PASSWORD` = site login password (if unset, the site is open — fine locally, not on the internet).
  - Optional: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (+ `AI_PROVIDER`, `ANTHROPIC_MODEL`, `OPENAI_MODEL`). Not used by any page yet.
  - `vercel.json` pins functions to `hnd1` (Tokyo) to sit next to the DB.
- ⚠️ **Security TODO**: the DB password was pasted into a chat. After the site works, **reset the DB password in Supabase** and update only the Vercel env var. Never commit it. The repo should be **private** (content includes salary info).

## 3. Tech stack & key decisions (read before coding)

- **Next.js 16.4** (App Router, Turbopack, React 19). This is newer than most training data — read `node_modules/next/dist/docs/` when unsure (see `AGENTS.md`).
  - `cacheComponents` is **deliberately disabled** (`next.config.ts`); DB pages use `export const dynamic = "force-dynamic"`.
  - Middleware is now **`src/proxy.ts`** (exports `proxy`). It implements the password gate.
  - `PageProps<"/route">` / `LayoutProps` / `RouteContext` are global type helpers generated at build/dev time; `params`/`searchParams` are Promises.
- **Prisma 7 + `@prisma/adapter-pg`** (Rust-free client). Generated client lives in `src/generated/prisma` (gitignored; `postinstall` runs `prisma generate`). `prisma.config.ts` reads `DIRECT_URL ?? DATABASE_URL`.
  - **Migrations are hand-written SQL** because the cloud sandbox could not download Prisma's schema engine. On a normal machine you can use `npx prisma migrate dev`. If you hand-write: keep Prisma's naming (`"Model"`, camelCase quoted columns, `TIMESTAMP(3)`, `Model_col_idx`), then apply via Supabase SQL editor/MCP **and** add RLS for new tables.
- **Tailwind v4** with design tokens as CSS variables in `src/app/globals.css` (light + `.dark`). Use token classes (`bg-surface`, `text-muted`, `border-border`, `text-accent`, `bg-ok-soft`…), never raw colors. Chart colors `--chart-1/2` were validated for CVD/contrast.
- **UI primitives**: hand-written shadcn-style components in `src/components/ui/index.tsx` (Button, Card, CardHeader, CardBody, Badge, Progress, Textarea, Input, Select, Segmented, PageHeader, Callout, Empty, Stat). No shadcn CLI.
- **Content as TypeScript** in `src/content/` (versionable, typed). No CMS.
- **Markdown**: tiny renderer `src/components/md.tsx` (paragraphs, `-` lists, `1.` lists, `####` headings, `**bold**`, `` `code` ``, fenced code, `|` tables). Inside template literals escape backticks as `` \` `` and `${` as `\${`.
- **Mermaid** diagrams render client-side (`src/components/mermaid.tsx`).
- **Recharts** for radar/bar charts (`src/components/charts/`).
- **Speech**: `src/lib/speech.ts` (Web Speech API TTS + SpeechRecognition wrapper). Used by the diagnostic listening section; Phase 3 should reuse it.
- **AI**: `src/lib/ai.ts` — `aiProvider()`, `aiChat()`, `aiJson()` via raw `fetch` to Anthropic Messages API / OpenAI Chat Completions. Server-only. Every AI feature must have a **non-AI fallback** (SPEC §5).
- **Time zone**: user is in Asia/Taipei; `dayKey()`/`fmtDate()` in `src/lib/utils.ts` format in that zone. `fmtDate()` is now a hand-rolled `MM/DD HH:mm` (UTC+8) **without ICU** — Node and Chrome produced different `toLocaleString("zh-TW")` output (`下午06:13` vs `下午6:13`), causing React hydration error #418 on `/notes`. Don't use `toLocaleString` in anything rendered on the server.
- **Turbopack build cache gotcha**: once `next build` reported "Compiled successfully in 530ms" but kept stale chunks (old code served). If a fix doesn't show up in `next start`, `rm -rf .next` and rebuild. Also always kill the old `next-server` before restarting, otherwise you get "Failed to load chunk" errors.

## 4. Repository map

```
prisma/schema.prisma                 # 10 models (see §5)
prisma/migrations/…_init/            # hand-written SQL (applied to Supabase)
scripts/local-pg.mjs                 # throwaway local Postgres (embedded-postgres) + applies migrations
src/proxy.ts                         # password gate (APP_PASSWORD)
src/lib/
  db.ts            prisma client (pg adapter), parseJson
  auth.ts          HMAC session token helpers
  progress.ts      skill model (diagnostic baseline + EWMA of later evidence), english sub-skills,
                   module completion, minutes/day, recent activity, weak lessons
  recommend.ts     "next step" recommendations for dashboard
  srs.ts           SM-2 scheduling + upsertCard
  ai.ts            AI provider client (not yet used by UI)
  speech.ts        TTS/STT helpers (client)
  utils.ts         cn, api() fetch helper, dayKey, fmtDate
src/content/
  skills.ts        8 skills + 6 English sub-skills (with level descriptors)
  catalog.ts       TRACKS (t1–t6) and LESSONS metadata (30 lessons incl. t5/t6 not yet written)
  jd.ts            JD requirement mapping (30 items, fit + links), EXTENSION_TOPICS, JD_META
  diagnostic.ts    28 diagnostic MCQs + 3 TTS listening items
  types.ts         QuizQuestion, LessonContent (11-section schema), CodeSample
  lessons/t1..t4.ts + index.ts (LESSON_CONTENT registry)
src/components/
  layout/          sidebar, shell, theme toggle, nav.ts (all routes), enabled.ts (ROUTES SHOWN IN SIDEBAR)
  learn/           quiz-block, notes-panel, bookmark-button, lesson-actions (visit/complete), code-block
  charts/          radar.tsx, minutes-bar.tsx
  md.tsx, mermaid.tsx, ui/index.tsx
labs-src/                          # C sources for the labs (compiled offline, see below)
scripts/gen-lab-data.mjs           # compiles labs-src with arm-none-eabi-gcc → src/content/labs-data/gcc-output.json
src/content/labs.ts                # lab registry (titles, checkpoints MCQs, related lessons, memory/debug data)
src/content/labs-data/gcc-output.json  # REAL compiler output (asm per -O level, sizes, section maps)
src/content/plan.ts                # 14-day plan (days, tasks with weight core|extra, minutes, href)
src/lib/rtos-sim.ts                # tick-based fixed-priority preemptive scheduler + mutex/inheritance
src/lib/thumb.ts                   # tiny Thumb-1 subset interpreter (only the instructions in the asm lab)
src/lib/plan.ts                    # planDayIndex, planState (auto-done from lessons/labs/diagnostic), todayAgenda
src/components/labs/*              # one component per lab + checkpoint.tsx (MCQ → Activity type "lab")
src/app/labs/, labs/[lab]/         # lab list + lab page (data-source callout, checkpoint, notes, bookmark)
src/app/review/                    # SRS session (SM-2), term-card seeding, suspend, 7-day forecast
src/app/plan/                      # 14-day plan + today agenda (fits dailyMinutes; 30 = core only; catches up)
src/app/notes/                     # all notes + bookmarks, search/filter/edit/delete, Markdown export
src/app/api/review, api/plan       # review: grade|seedTerms|suspend|finish ; plan: toggle manual task
src/app/
  page.tsx                 Dashboard
  diagnostic/              diagnostic test (client) + previous result
  jd/                      JD mapping (?fit=strong|partial|gap)
  learn/, learn/[lesson]/  track list, lesson page (12 sections incl. notes)
  settings/                daily minutes, plan start date, AI status, export, reset, logout
  login/                   password form
  api/                     auth/login|logout, diagnostic, lesson, quiz, notes, bookmarks, settings, export, reset
```

**Sidebar gating**: `src/components/layout/enabled.ts` lists routes shown in the sidebar and used by JD-page links. Currently all 13 routes are enabled (Phase 5 complete).

## 5. Data model (Prisma)

`Settings`(id=1, dailyMinutes, planStartDate) · `DiagnosticResult`(scoresJson, answersJson, selfJson) · `QuizAttempt`(source lesson|diagnostic|review, refId, questionId, skill, chosen, correct) · `LessonProgress`(lessonId, status, bestScore, lastScore, visits) · `Note`(refType, refId, content) · `Bookmark`(refType, refId, title, href; unique refType+refId) · `ReviewCard`(cardKey unique, kind, skill, front/back JSON strings, SM-2 fields, due) · `Activity`(type english|speaking|mock|lab|copilot|lesson|review|plan|diagnostic, refId, skill, minutes, score?, payloadJson) · `MockSession`(mode, status, transcriptJson, summaryJson) · `PlanTask`(taskId, done).

Conventions:
- Any scored practice → insert `Activity` with `skill` and `score` (0–100); it automatically feeds `skillScores()`.
- English practice → put `payloadJson.subScores = { listening?, speaking?, intro?, techExplain?, business?, followUp? }` (0–100) to update the English radar.
- Wrong answers → `upsertCard({cardKey:"quiz:<questionId>", kind:"quiz", skill, front: JSON{q,code,options,lessonId}, back: JSON{answer,explain}}, true)`.

## 6. Phase 5 notes & remaining work

### 6.1 How the lab data is produced (honesty rule)
The optimization / sections / asm labs show **pre-compiled output, labelled in the UI** — the site never runs a compiler.
Regenerate after editing `labs-src/*.c`:
```bash
# xPack GCC 14.2.1 (no root needed):
curl -L -o /var/tmp/gcc.tgz https://github.com/xpack-dev-tools/arm-none-eabi-gcc-xpack/releases/download/v14.2.1-1.1/xpack-arm-none-eabi-gcc-14.2.1-1.1-linux-x64.tar.gz
tar -xzf /var/tmp/gcc.tgz -C /var/tmp
ARM_GCC_BIN=/var/tmp/xpack-arm-none-eabi-gcc-14.2.1-1.1/bin node scripts/gen-lab-data.mjs
```
Facts verified from the real output (used in lab text/checkpoints): missing-`volatile` poll loop becomes `b .L3` at -O1+; clear loop → `b memset` at -O2; `calc()` folds to `movs r0,#70`; switch → `CSWTCH` table; with `--gc-sections` `unused_function`, `g_table`, `g_buf` are removed. IAR output will differ (UI says so).
RTOS sim: H finishes tick 15 (response 12) without inheritance vs tick 9 (response 6) with it. Thumb interpreter: sum_n(5)=15, max3(3,9,4)=9.

### 6.2 Conventions added
- Lab checkpoint → `Activity{type:"lab", refId:<lab>, skill, score}` (feeds radar). Lab notes use `refType:"lab"`.
- Review: quiz cards re-asked → `QuizAttempt{source:"review"}`; term cards seeded from lesson glossaries (`cardKey "term:<lesson>:<en>"`, idempotent); session end → `Activity{type:"review"}`.
- Plan: manual tasks stored via `/api/plan`; lesson/lab/diagnostic tasks are auto-done from real progress. The page states it is a suggested rhythm, not a known interview date.
- `recommend.ts` adds "開始 14 天學習計畫" or today's plan items (only after a diagnostic exists); returns up to 4.

### 6.3 Still open
- **Vercel deployment not confirmed** (see §2 env vars). After deploy, smoke-test `/labs`, `/review`, `/plan`, `/notes` against Supabase.
- **Security TODO stands**: reset the Supabase DB password and update only the Vercel env var.
- Ideas (not required by SPEC): more labs data (IAR-specific outputs would need a licensed IAR toolchain — do not fabricate), analytics charts per lab.

## 7. Local development

```bash
npm install                       # runs prisma generate
cp .env.example .env              # set DATABASE_URL
# Option A: use the Supabase pooler URL (shared with production data)
# Option B: throwaway local Postgres (no install needed):
npm run db:local                  # keeps running; DB at postgresql://postgres:postgres@localhost:54329/academy
npm run dev
npm run build && npm run lint && npm run typecheck
```
In a Linux sandbox running as root, set `LOCAL_PG_DIR` to a world-writable dir (e.g. `/var/tmp/pga/data`) because Postgres refuses to run as root. In the Claude cloud sandbox, `prisma generate` needs `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true` (engine download is blocked); Supabase hosts are unreachable from that sandbox.

## 8. Quality bar (from SPEC §7 — don't regress)
- No empty placeholder pages; only list routes in `enabled.ts` when they work.
- Honest content: label "延伸補強" for topics not explicitly in the JD; mark unverified IAR facts as 待查證; never fabricate user experience.
- Every phase: build, lint, typecheck, basic functional test before reporting.
- Traditional Chinese UI; bilingual learning content; light/dark mode.
