Placeholders implemented for quick front-end testing

Files and behavior:

- pages/api/agent/message.ts
  - Deterministic placeholder agent endpoint that always returns a constant reply and small fake metrics.
  - Commented clearly: replace this with a real call to your agent/LLM system.

- pages/api/judge/evaluate.ts
  - Deterministic judge that checks for `secret.txt` presence in transcript for `level-001`.
  - LLM-based judge calls are left commented and documented; replace when integrating a real judge.

- pages/api/leaderboard.ts
  - Uses Vercel KV when available.
  - If Vercel KV is not configured or not available in the environment, an in-memory fallback is used for testing.
  - NOTE: in-memory store is ephemeral and will be lost on process restart.

Why these placeholders exist

- You requested a minimal algorithmic placeholder (no LLMs) so you can view the webpage and continue UI/design work.
- All placeholders are intentionally deterministic and safe (no external calls, no secret leakage beyond the deterministic `secret.txt` check).

How to replace placeholders later

1. Agent endpoint (`pages/api/agent/message.ts`):
   - Replace the handler body with a call to your agent orchestration layer.
   - Keep the same request/response JSON contract so the frontend continues to work.
   - Preserve `internalLogs` only for admin mode to avoid leaking debug info to anonymous users.

2. Judge endpoint (`pages/api/judge/evaluate.ts`):
   - After deterministic checks, add a call to your LLM judge using `config/prompts.json` templates.
   - Combine deterministic evidence with LLM judgment to produce final `score` and `verdict`.

3. Leaderboard (`pages/api/leaderboard.ts`):
   - Configure Vercel KV and ensure `@vercel/kv` is available in production.
   - Remove the in-memory fallback once KV is enabled.

Notes

- These placeholders are documented per the GEMINI.md guidance: minimal implementation with clear TODOs.
- Run `npm run dev` to start the app locally. The scoreboard will work locally using the in-memory fallback, and `/play/level-001` will be usable.
