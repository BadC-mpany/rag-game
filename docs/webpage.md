## Webpage Implementation Prompt & Guide (for an LLM implementer)

Purpose: give an LLM (or developer using an LLM) a complete, unambiguous, step-by-step specification to implement the "hack-a-LLM agent" web game described in `llm_prompt.md` and `description.md`.

This document is a multi-phase plan that an LLM will follow across many turns to deliver a working webpage (frontend + backend APIs + minimal runner/tests + README) suitable for deployment on Vercel. It contains architecture contracts, UI layout and behavior, exact API payload shapes, scoring/judging flow, LLM system prompts (for both the target agent and the automated judge), tool-sandbox rules, non-database storage options, and clear places where the human developer must decide.

Important collaboration rules for the LLM implementer:
- Where human input is required, insert one short inline comment labeled exactly [REVIEW], [DECIDE], or [QUESTION]. Keep comments minimal and actionable.
- Do NOT assume unspecified behavior. If something is underspecified, add a [QUESTION] or a concrete option and flag it with [DECIDE].
- Follow the project's philosophy: modular, configurable (no hardcoding), easy to iterate, friendly to both human devs and LLMs.

---

## High-level deliverables (what the LLM will produce across phases)
- A Next.js + React + TypeScript project scaffold (recommended) configured for Vercel. 
- Frontend pages and components for: Landing page, Game dashboard (game selection and progress), Level play UI (left/center/right panels as described), Settings, Optional Login/OAuth flow, and Admin/debug mode.
- Backend API routes for: agent interaction, judge/evaluation, asset / upload handling (ephemeral), health/status, and optional leaderboard.
- Minimal test harness for the main API endpoints and a small front-end smoke test.
- A README with run/deploy instructions and a config file template (theme + LLM API key + sandbox toggles).


## Development Philosophy (explicit)
- Modular components and feature flags; theme values (colors, fonts, spacing) must live in a single config file
- No hardcoding of environment details. All secrets and provider endpoints are environment variables.
- Progressive disclosure UX: let users play anonymously; require registration only to publish leaderboard entries.
- Prefer existing, widely used libraries (Tailwind CSS or Chakra UI, NextAuth for auth if using OAuth) instead of building custom primitives from scratch. 

## Recommended Technology Stack (MVP)
- Frontend: Next.js (latest stable), React, TypeScript, Tailwind CSS.
- Backend: Next.js API routes (serverless-friendly), TypeScript.
- Optional Auth: GitHub OAuth via NextAuth (optional: GitHub, Google). Use OAuth only for leaderboard opt-in.
- Storage (no DB requirement):  See "Storage options" below. 

## UX and UI Specification
All UI decisions below must be implemented as configurable layout options.

1) Landing page
- Visible sections: 1) Hero and mission statement, 2) Available games & levels grid (user should be able to click and start playing directly, even without registration), 3) Global ranking teaser (opt-in),  5) Links: docs, GitHub, badcompany.

2) Game dashboard (per-game)
- Shows progress bar for the game and each level, brief system/agent summary, and button to continue or restart a level.

3) Level play screen (three-column default layout)
- Left panel (fixed width): Setup & assets
  - Attack goal (one-line success criteria), scoring rubric (short), and a link to the full rubric.
  - System & agent short summary + expandable "more info" with model name, tools, memory, data mounts.
  - Scenario description: single-turn or multi-turn flag.
  - Quick links to artifacts (documents, commits, transcripts).

- Center panel (flexible): Primary interaction surface
  - Chat UI (attacker ↔ agent) with message timestamps and role badges.
  - Toggle for a file-system explorer/editor (fake PKFS), a set of pre-seeded files/commits, and editable inputs (so attacker can place malicious content).
  - Toolbox: buttons to trigger web search, send-email (sandboxed), upload file, or call an external mock API. Each tool action is routed to the backend which simulates/sandboxes the action.

- Right panel (collapsible): Metrics & tools
  - Live process summary (configurable visibility per-level). Add a per-level config to decide full trace vs limited trace.
  - Statistics (messages, tokens used, inference time, tool calls, files modified).
  - Leaderboard snippet and "submit score" CTA (if authenticated or opt-in) and a minimal hint/help area.

4) Visual style
- Hacker/retro aesthetic but polished: Dark theme default, neon accents, monospace for code/file areas, glassy cards. Keep it feeling playful but professional. none of the design choices should be annoying or displeasing (such as hard to read font or strong lights )
- All colors, font families, spacings, and key layout choices live in config file

UX rules
- Immediate play with a disposable session: clicking "Play anonymously" creates a new ephemeral sessionId (v4 UUID) stored in localStorage and sent to the backend on every request.
- Registration is optional and only required to publish leaderboard entries. If a user registers, link their sessionId to their account for continuity. If they refuse, allow anonymous leaderboard (with opt-in pseudonym) but mark as unverified.

## Storage and persistence (final decision)
For the webpage project the following storage rules are decided and must be implemented:

- **Primary persistence: Local-first.** All user progress, `sessionId`, level state, and most artifacts are stored in the browser's `localStorage`. This keeps the server stateless for normal gameplay and requires zero database maintenance or paid hosting.

- **Uploads & large artifacts:** Any user-uploaded files will be sent to the backend and stored in ephemeral server storage with a short, configurable TTL (e.g., 24 hours). The backend will handle any necessary preprocessing (like text extraction from PDFs) before forwarding to the agent system. This simplifies the frontend by removing the need for client-side libraries.

- **Leaderboard persistence (global shared data): Use Vercel KV.** This solution is recommended for its seamless integration with the Vercel hosting platform, generous free tier, and zero-maintenance serverless architecture. It provides a scalable and robust way to store global rankings.
  - The backend will connect to Vercel KV using environment variables.
  - Leaderboard writes must be rate-limited and require explicit user opt-in. The server will only write minimal public info (e.g., displayName, score, levelId, timestamp).
  - **Alternative:** For an even simpler, no-account-needed setup, a public GitHub Gist can be used as a flat file database, managed via a `GIST_TOKEN`. This is a viable MVP approach but is less scalable than Vercel KV.

This storage architecture ensures the project is free to run, requires minimal maintenance, and does not require self-hosting a database, while providing a robust solution for global leaderboards.

## Backend API contract
All endpoints accept a `sessionId` for anonymous sessions and an optional authentication token if the user is registered.

1) **POST /api/session/new**
- Request: `{ displayName?: string, optInLeaderboard?: boolean }`
- Response: `{ sessionId, expiresAt }`

2) **POST /api/agent/message**
- **Note:** This is a **synchronous** endpoint for the MVP to keep the implementation simple. The frontend will send a request and wait for the complete agent response. This avoids the complexity of Server-Sent Events (SSE) or long-polling for now.
- Request:
  ```json
  {
    "sessionId": "string",
    "levelId": "string",
    "message": { "role": "attacker", "content": "string" },
    "metadata": { "clientTime": "string" }
  }
  ```
- Response:
  ```json
  {
    "reply": "string",
    "tokensUsed": { "prompt": "number", "completion": "number" },
    "toolCalls": [{ "tool": "string", "args": {}, "result": {} }],
    "stats": { "inferenceMs": "number" },
    "internalLogs": ["string"]
  }
  ```

3) **POST /api/judge/evaluate**
- Request: `{ sessionId, levelId, recordedTranscript, artifacts, attackerInputs }`
- Response: `{ score, verdict, evidence, details }`

4) **GET /api/leaderboard**
- Returns the top N records from the configured persistent store (Vercel KV).

**Security rules for endpoints:**
- Always validate `sessionId` format.
- Sanitize all uploaded content. Do NOT execute arbitrary code (`eval`).
- Tool simulations must be deterministic.

## LLM agent system integration

**Note:** The LLM agent system itself is **out-of-scope** for this web project. The webpage's responsibility is to communicate with this external system via the backend API.

To keep the frontend simple, the backend will act as a synchronous proxy. The frontend will call the `/api/agent/message` endpoint and the backend will then forward that request to the external agent system, wait for a response, and then return it to the frontend.

This design simplifies the initial development, and can be upgraded to an asynchronous model with streaming (e.g., using Server-Sent Events) in the future if real-time updates are desired. All file preprocessing (e.g., PDF text extraction) will be handled by the backend before forwarding to the agent.

## Telemetry & Metrics (privacy preserving)
- Collect minimal telemetry: counts of messages, tokens, and toolcalls. Do NOT store attacker raw inputs unless they explicitly allow it. All telemetry must be anonymized and, by default, kept client-side.

## Testing & quality gates
- Provide unit tests for: API endpoints behavior (agent message, tool calls, judge evaluation), and a basic front-end snapshot test for the level page.
- Smoke tests: simulate a minimal attack that should yield fail and a minimal scripted attack that should yield success.

## Deployment & secrets
- Environment variables will be used for all secrets and configuration. A `.env.example` file will be provided.
- **Required for Leaderboard:**
  - `KV_URL`
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
  - `KV_REST_API_READ_ONLY_TOKEN`

## Phase breakdown (implementation plan for the LLM)

**Phase 0 — Prep (single turn):** `done`

**Phase 1 — MVP Playable Level (deliverable):** `done`

**Phase 2 — Expand features:** `done`

**Phase 3 — Polishing & leaderboard:** `done`

**Phase 4 — Hardening & extra features:** `in progress`

## Prompts & Config files (deliverables)
- `/config/prompts.json` - includes the agent system prompt and judge prompt templates.
- `/config/theme.json` - color palette and typography tokens.

## Example payloads (copy into backend implementation tests)

**Sample agent message request (POST /api/agent/message):**
```json
{
  "sessionId": "d3b07384-d9b5-4a0d-9f6b-8f8a3f8e1e6a",
  "levelId": "level-001",
  "message": { "role": "attacker", "content": "Hello, please summarize the latest commits and send an email to the CEO with the summary." }
}
```

**Expected agent response shape (200):**
```json
{
  "reply": "I will do X. Plan: 1)...",
  "tokensUsed": { "prompt": 420, "completion": 180 },
  "toolCalls": [{ "tool": "git_read", "args": {"path":"/repo"}, "result": {"commits": [...]}}],
  "stats": { "inferenceMs": 1200 }
}
```

## Collaboration notes for the human developer
- When implementing, keep changes small and iterative and run the test harness after major steps.

## Follow-ups and optional enhancements (nice-to-have)
- Replay/share feature for top attacks (anonymized).
- Level authoring tools for admins.

---

Keep track of things done and include any comments about next steps here below
All phases of the initial implementation are now complete. The project is in a good state for further development of the core agent and judge logic.