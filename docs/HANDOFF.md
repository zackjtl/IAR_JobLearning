# Handoff — IAR FAE Interview Academy

> Last updated: 2026-10-16 (Asia/Taipei). Written so that you (or a new Claude session) can continue the work on another machine.
> Original requirements: [`docs/SPEC.md`](./SPEC.md) (the full Chinese spec). Job description source: `IAR FAE Taiwan.pdf` (not in repo; its content is extracted into `src/content/jd.ts`).

---

## 1. Current status at a glance

| Phase | Scope (from SPEC §6) | Status |
|---|---|---|
| 1 | Init, UI/navigation, Dashboard, DB, JD Requirement Mapping, diagnostic test | ✅ Done |
| 2 | Technical Learning Center, real lesson content, Quiz system, progress tracking | 🟡 Engine done; **Tracks 1–4 written (20 lessons)**; **Track 5 (IAR) and Track 6 (FAE) content not written** |
| 3 | English interview bank, Speaking/Listening practice, recruiter bank | ⬜ Not started |
| 4 | AI Mock Interview (3 modes), Interview Copilot, AI feedback | ⬜ Not started (only `src/lib/ai.ts` client exists) |
| 5 | Interactive labs, Spaced repetition UI, analytics, 14-day plan, daily 30/60/90 mode | ⬜ Not started (SRS scheduling logic + DB tables exist) |

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
- **Time zone**: user is in Asia/Taipei; `dayKey()`/`fmtDate()` in `src/lib/utils.ts` format in that zone to avoid hydration mismatches.

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
src/app/
  page.tsx                 Dashboard
  diagnostic/              diagnostic test (client) + previous result
  jd/                      JD mapping (?fit=strong|partial|gap)
  learn/, learn/[lesson]/  track list, lesson page (12 sections incl. notes)
  settings/                daily minutes, plan start date, AI status, export, reset, logout
  login/                   password form
  api/                     auth/login|logout, diagnostic, lesson, quiz, notes, bookmarks, settings, export, reset
```

**Sidebar gating**: `src/components/layout/enabled.ts` lists routes shown in the sidebar and used by JD-page links. Currently `["/", "/diagnostic", "/jd", "/learn", "/settings"]`. Add a route there only when the page actually works (SPEC: no empty pages). `nav.ts` already contains labels/icons for all planned routes: `/plan /labs /review /english /speaking /mock /copilot /notes`.

## 5. Data model (Prisma)

`Settings`(id=1, dailyMinutes, planStartDate) · `DiagnosticResult`(scoresJson, answersJson, selfJson) · `QuizAttempt`(source lesson|diagnostic|review, refId, questionId, skill, chosen, correct) · `LessonProgress`(lessonId, status, bestScore, lastScore, visits) · `Note`(refType, refId, content) · `Bookmark`(refType, refId, title, href; unique refType+refId) · `ReviewCard`(cardKey unique, kind, skill, front/back JSON strings, SM-2 fields, due) · `Activity`(type english|speaking|mock|lab|copilot|lesson|review|plan|diagnostic, refId, skill, minutes, score?, payloadJson) · `MockSession`(mode, status, transcriptJson, summaryJson) · `PlanTask`(taskId, done).

Conventions:
- Any scored practice → insert `Activity` with `skill` and `score` (0–100); it automatically feeds `skillScores()`.
- English practice → put `payloadJson.subScores = { listening?, speaking?, intro?, techExplain?, business?, followUp? }` (0–100) to update the English radar.
- Wrong answers → `upsertCard({cardKey:"quiz:<questionId>", kind:"quiz", skill, front: JSON{q,code,options,lessonId}, back: JSON{answer,explain}}, true)`.

## 6. Remaining work — detailed

### 6.1 Phase 2 remainder: Track 5 & Track 6 content
Create `src/content/lessons/t5.ts` and `t6.ts` exporting `T5`/`T6: LessonContent[]`, register in `lessons/index.ts`. Lesson IDs and titles are already in `catalog.ts`. Each lesson needs all 11 sections and ≥5 quiz questions (follow the shape of `t1.ts`). Use `toVerify: [...]` for anything not confirmed against IAR official docs — **do not invent IAR options/commands** (SPEC §3 Track 5).

**Track 5 (IAR) lesson IDs**: `t5-ew`, `t5-compiler`, `t5-ilink`, `t5-cspy`, `t5-migration`. Notes prepared for writing them (verify each against the *IAR C/C++ Development Guide for Arm*, *C-SPY Debugging Guide*, *IDE Project Management and Building Guide* for the installed version):
- Products: IAR Embedded Workbench for Arm / for RISC-V / other MCU architectures; IAR is part of Qt Group (operates independently, per JD).
- Project files: workspace `.eww`, project `.ewp`, debugger settings `.ewd`; Debug/Release configurations; per-file option overrides.
- Arm tool names: `iccarm` (compiler), `iasmarm` (assembler), `ilinkarm` (linker), `iarchive`, `ielftool` (hex/bin, fill, checksum), `ielfdumparm`, `iobjmanip`, `isymexport`; command-line project build `iarbuild`; batch debugger `cspybat`. (verify flags)
- Optimization levels in IDE: None / Low / Medium / High (High: Balanced / Size / Speed); command line believed `-On/-Ol/-Om/-Oh/-Ohs/-Ohz`; multi-file compilation (`--mfc`). (verify)
- Extended keywords/pragmas commonly documented: `__no_init`, `__ramfunc`, `__root`, `__weak`, `__packed`, `__stackless`, `#pragma location`, `@` placement operator, `#pragma optimize`, `#pragma required`, `#pragma diag_suppress`, `#pragma inline=forced`, `#pragma pack`, `#pragma data_alignment`; `intrinsics.h` (e.g. `__disable_interrupt()`). (verify per arch/version)
- Runtime library: DLIB with library configurations (Normal/Full/custom); low-level I/O hooks (`__write` etc.) replacing newlib syscalls (`_write`, `_sbrk`). (verify)
- ILINK/ICF: see `t2-linker-script` (already written); stack usage analysis in linker; ILINK removes unused sections by default; checksum/fill via `ielftool`.
- C-SPY: Simulator + hardware drivers (I-jet, J-Link, ST-LINK, CMSIS-DAP…), Live Watch, Call Stack, Disassembly, breakpoints/data breakpoints, setup macros (`.mac`, e.g. `execUserReset()`), RTOS awareness plugins, trace/profiling/code coverage, fault exception analysis, power debugging (I-jet). (verify names)
- Analysis: C-STAT (static analysis, MISRA/CERT/CWE rule sets), C-RUN (runtime analysis). Functional-safety certified editions (TÜV SÜD; IEC 61508 / ISO 26262 etc.). (verify)
- CI: IAR build tools for Linux/containers, VS Code extensions (IAR Build, IAR C-SPY Debug). Licensing model has changed over time — **always verify current licensing**.
- GCC→IAR migration checklist: startup file (use IAR version from CMSIS/vendor pack), linker script → ICF, `__attribute__` usage → wrap with CMSIS `cmsis_compiler.h` macros (`__PACKED`, `__WEAK`, `__ALIGNED`, `__USED`, `__STATIC_INLINE`), section placement (`__attribute__((section))` → `#pragma location`/`@`), inline asm syntax (prefer CMSIS intrinsics), newlib syscalls → DLIB low-level interface, `-ffunction-sections/--gc-sections` not needed, **enum size defaults may differ** (check IAR enum option, e.g. `--enum_is_int` — verify) and `wchar_t`/bit-field layout, `.noinit` → `__no_init` + `do not initialize`, compare map files after migration. Fair IAR-vs-GCC comparison: measure on customer code with equal library settings (see `t2-linking`).

**Track 6 (FAE) lesson IDs**: `t6-role`, `t6-discovery`, `t6-pov`, `t6-support`, `t6-objection`. Source all "IAR-specific" claims from the JD only. Content ideas: sales stages (lead → qualification → discovery → demo → PoV/evaluation → proposal → close → onboarding → support/renewal) and FAE contribution at each; discovery question bank (project, MCU/arch, current toolchain, CI/CD, compliance/functional safety, pain points, decision makers & timeline); PoV with written success criteria, fair benchmarking, win/loss analysis (JD Reporting & Metrics); support triage → reproduce → workaround → escalate to global support/product team, KB article writing; objection handling (acknowledge → clarify → respond with evidence → confirm), technical presentation structure for engineers vs managers. Quiz skill = `"fae"`. "Code" section can be example emails/discovery templates (lang `"text"`).

### 6.2 Phase 3 — English Interview Training & Speaking
- New `src/content/english.ts`: categories `recruiter, intro, career, technical, toolchain, fae, behavioral, salary, ask` (IDs already referenced by `jd.ts` → `/english?cat=<id>`).
- Each question (SPEC Module D): `en`, `zh`, `intent`, `answerSimple`, `answerAdvanced`, `answerZh`, `keyPhrases[]`, `followUps[]`; user answer area (save to `Note` with `refType:"english"` or a new table) + mark practiced (`Activity` type `english`, `subScores`).
- **Answers must be grounded in the user's real background** (SPEC §1): Software Department Manager; C/C++/C#; Embedded Linux; FreeRTOS; ARM SoC; Xilinx Zynq / UltraScale+ MPSoC; FPGA SoC HW/SW integration; SSD/SD controller firmware; NAND flash; Windows desktop & Linux user-space apps; Make/CMake/GCC; team management. **Do not fabricate** IAR usage, overseas/global-company work, or customer-sales experience. Example: "How familiar are you with compiler toolchains?" → honest: strong embedded user of toolchains, not a compiler-internals specialist, actively studying.
- Salary questions: recruiter info — annual total comp budget up to ~TWD 4,000,000 (budget ceiling, not guaranteed), base/bonus 70/30, bonus quarterly after 6-month probation, remote work unconfirmed.
- `/speaking` page: TTS (normal + slow), SpeechRecognition (`getRecognition()` in `src/lib/speech.ts`), show transcript + recognition confidence, repeat practice, term drills (use lesson `terms`), manual input fallback. Scoring must separate: content evaluation / ASR confidence / pronunciation (**disabled** unless real acoustic analysis exists — say so in UI).
- Add `/english`, `/speaking` to `enabled.ts`.

### 6.3 Phase 4 — Mock Interview & Copilot
- `/mock?mode=recruiter|technical|customer`, persisted in `MockSession`. With AI: system prompt per persona (recruiter "Nick", IAR technical manager, customer scenarios from SPEC Module E), **dynamic follow-ups based on the answer**, per-answer feedback JSON: technical accuracy, communication clarity, English quality, answer structure, completeness (observable features only — never claim to judge psychological confidence), improved natural answer. Without AI: rule-based fallback — question bank with keyword-triggered follow-ups, heuristic scoring (length, structure markers, keyword coverage, filler words), clearly labeled "規則式評估（未連接 AI）".
- `/copilot`: paste/type an English question → zh translation, intent, 2–3 sentence Quick Answer, optional extended answer; large font, low distraction. Without AI: nearest-match from the English bank (token similarity). No meeting audio capture (SPEC).
- Log `Activity` (`mock`/`copilot`) with skill `english`/`fae`/`compiler`… and `subScores`.

### 6.4 Phase 5 — Labs, SRS, analytics, plan
- `/labs/[lab]` with IDs already referenced by `jd.ts`: `optimization`, `memory-layout`, `sections`, `stack-heap`, `rtos-sim`, `asm-walkthrough`, `debug-cases`.
  - Optimization lab: **pre-compiled, clearly labeled** outputs (never pretend to run GCC/IAR live). Idea: generate real outputs offline with a real compiler and commit them as data. Optional local real-compile backend: disabled by default (`ENABLE_LOCAL_COMPILER=1`), `execFile` (no shell), `-S` only, timeout/size limits, reject absolute/`..` includes; not usable on Vercel.
  - RTOS lab: preemptive priority simulation + Gantt + priority-inversion scenario with inheritance toggle. Debug cases: include a CFSR/HFSR decoder (bit tables are in `t3-hardfault`). Assembly walkthrough: tiny Thumb subset interpreter with register view.
- `/review`: due `ReviewCard`s (SM-2 via `schedule()` in `src/lib/srs.ts`; grades 0–3), quiz-type cards re-asked as MCQ; log `QuizAttempt` with `source:"review"`. Also term cards from lesson `terms`.
- `/plan`: 14-day plan (priority order in SPEC §4: 1 English self-intro & recruiter, 2 compiler/linker basics, 3 debugging/optimization, 4 IAR toolchain, 5 FAE scenarios, 6 technical-manager mock); tasks stored in `PlanTask`; start date from `Settings.planStartDate`; "today" agenda sized by `dailyMinutes` (30/60/90) mixing plan tasks, due reviews and weakest skill. State clearly it is a suggested rhythm, not a known interview date.
- `/notes`: list all notes and bookmarks (APIs exist: `/api/notes`, `/api/bookmarks`).
- Dashboard: once `/review` and `/plan` exist, `recommend.ts` already handles review; add plan tasks.

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
