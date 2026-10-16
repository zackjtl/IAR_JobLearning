# IAR FAE Interview Academy

個人化學習網站：針對 IAR Systems 台灣 FAE / Technical Support Specialist 職缺，進行技術補強、英文訓練與模擬面試準備。

- **目前進度與接手說明** → [`docs/HANDOFF.md`](docs/HANDOFF.md)
- **原始需求規格** → [`docs/SPEC.md`](docs/SPEC.md)

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 (`@prisma/adapter-pg`) · Postgres (Supabase) · Recharts · Mermaid · Web Speech API

## Quick start
```bash
npm install
cp .env.example .env      # 設定 DATABASE_URL（Supabase pooler 或本機 Postgres）
npm run db:local          # （選用）啟動一次性本機 Postgres，另開終端
npm run dev
```

## Scripts
| Script | 用途 |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / tsc |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:local` | 本機 embedded Postgres + 套用 migrations |

## Deploy (Vercel + Supabase)
Vercel 匯入此 repo，設定環境變數 `DATABASE_URL`（Supabase Transaction pooler, port 6543）與 `APP_PASSWORD`；AI 功能可選用 `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`。詳見 `docs/HANDOFF.md` §2。
