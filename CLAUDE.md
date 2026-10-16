@AGENTS.md

# Project notes for Claude

- Start by reading `docs/HANDOFF.md` (status, architecture, remaining work) and `docs/SPEC.md` (original requirements, in Chinese).
- UI language: Traditional Chinese; learning content bilingual. Use design-token Tailwind classes from `src/app/globals.css`.
- Never fabricate the user's experience (no IAR usage, no global-company or customer-sales experience). Mark unverified IAR facts as 待查證 via `toVerify`.
- Only add a route to `src/components/layout/enabled.ts` when its page fully works.
- Before committing: `npm run build && npm run lint && npm run typecheck`.
- Never commit secrets (`.env` is gitignored).
