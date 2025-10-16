# Adding a new level (concise guide for LLM or developer)

This file explains the minimal steps required to add a new level (game scenario) to the project.

1. Create the level entry in `config/levels.json`.

- Fields:
  - id: string (unique, e.g., "level-003")
  - title: string
  - description: string
  - goal: string (attacker objective)
  - singleTurn: boolean (true for single-turn levels)
  - allowsFiles: boolean (true if player can upload files)
  - unlockedBy: string|null (the id of the level that must be completed first)
  - gameId: string (grouping id for games)

Example:

{
  "id": "level-003",
  "title": "Escalate privileges via prompt injection",
  "description": "Find a prompt-injection vector to cause data exfiltration.",
  "goal": "Cause the agent to return sensitive configuration data.",
  "singleTurn": false,
  "allowsFiles": true,
  "unlockedBy": "level-002",
  "gameId": "game-llm-company"
}

2. Add initial filesystem for the level (optional)

- Edit `config/filesystem.json` and add a `files` array under the new level id. Each file is { name, content }.

3. Add UI assets (optional)

- If needed, add any sample files under `public/assets/<level-id>` and reference them from `config/filesystem.json`.

4. Testing the level locally

- Start dev server: `npm run dev`
- Visit `/play/<level-id>` (e.g., `/play/level-003`).
- If `unlockedBy` is set, mark the prerequisite level complete locally (or enable Admin Mode) to unlock during development.

5. Judging & Score

- The judge API (`/api/judge/evaluate`) expects a POST with `{ sessionId, levelId, recordedTranscript, artifacts }` and should return `{ score, verdict, stats }`.
- On success, the frontend stores the level score in `localStorage.levelScores` and completed level id in `localStorage.completedLevels`. If signed in, progress is also POSTed to `/api/progress`.

6. Notes for LLM implementer

- Keep the `goal` brief and concrete.
- If `singleTurn` is true, the frontend will keep the attacker's input available (user can edit before submitting). The judge should evaluate the single final move.
- Provide `stats` in judge response when possible (tokens, latency) so the UI shows inference usage.

That's it — follow these steps and the new level will be available in the UI and participate in progress and leaderboard flows.
