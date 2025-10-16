# expand_levels.md

Summary of new levels added and required implementation notes

New levels added (ids):
- level-003: Web Search Exploit (multi-turn)
- level-004: Notion / Document Injection (single-turn)
- level-005: Privilege Escalation via Content Injection (single-turn)
- level-006: Algorithmic Review Manipulation (single-turn)
- level-007: Meeting Transcript Manipulation (single-turn)
- level-008: Onboarding Manipulation (single-turn)
- level-009: Memory Sabotage (multi-turn)
- level-010: Moral-Dilemma Alignment Attack (multi-turn)

New/modified config fields used in `config/levels.json`:
- `singleTurn` (boolean): existing field; true means the level is atomic and the frontend will treat submissions as single-move.
- `allowsFiles` (boolean): existing; whether the file explorer is available.
- `upload_files` (boolean): whether the user may upload files in the file explorer.
- `make_new_file` (boolean): whether the user may create new files in the explorer.

Suggested additional fields (not yet added to levels.json) and why they may be needed:
- `tools`: array of tool identifiers available to the agent for this level (e.g., ["web_search","email","memory","git"]). Useful to control simulated tool access per-level.
- `prebakedCommits`: boolean | array — indicates whether the level should present a fake git history view vs plain files.
- `transcriptConstraints`: object — for meeting levels, constraints such as `maxAudioSizeMb` or `maxWords` for uploaded transcripts.
- `judgeRubricId`: string — references a rubric template for automated judge evaluation.
- `initialMemory`: object — for memory-sabotage levels, initial memory state to seed the agent's memory store.

Frontend changes recommended:
- Expose `tools` in the left panel and center toolbox; show which sandboxed tools are available for the level.
- File explorer: allow pre-baked commits view for `prebakedCommits: true` (render commit-* files as a timeline). Consider adding a small "Commit history" UI.
- Meeting level: provide upload control for transcript/audio with preview and size/word count validation.
- Single-turn UX: we already implemented client-side restart behavior. Ensure the judge receives the recordedTranscript as the single submission payload.

Backend changes / feature suggestions:
- Web search simulation: backend should simulate or proxy web_search calls, and accept a `web_search` tool call that returns deterministic results. For security, do not perform real HTTP calls to attacker-controlled domains in production — instead, respond with a canned result that includes the attacker URL so the level can be judged as successful.
- Memory store API: implement a simple ephemeral in-memory or local server store keyed by `sessionId` with TTL to support `initialMemory` and memory-sabotage levels.
- Email/send actions: provide a sandboxed email-send simulator that records the 'sent' email content to a server-side log for judging, rather than actually sending email.
- Judge rubrics: add a configurable judge prompt per level (or rubric id) so the automated judge can score success criteria specific to each level.

Actionable items / questions for reviewer
- Confirm whether `tools` should be added to `levels.json` now. If yes, I'll add them and wire the UI to show available tools.
- Confirm whether web search must call real HTTP endpoints during play; recommended: use canned/simulated web search results.
- Do you want pre-baked git UI (commit timeline) or are simple files sufficient for the Algorithmic Review Manipulation level?

Next steps I can take immediately (pick any):
- Add `tools` field to `config/levels.json` and update the UI to display available tools.
- Implement server-side simulated `web_search` and `email` actions (API endpoints + simple logs) and wire them to the frontend toolbox.
- Add a commit-history visual component (lightweight) and convert `level-006` prebaked files into a commit timeline view.

Notes
- I added pre-baked files for levels that need them in `config/filesystem.json` (levels 004-008). These are minimal stubs; we can refine content per level.
- I kept the change surface small and non-invasive. If you want server-side enforcement of single-turn (deleting previous transcripts), we'll need to change backend `/api/agent/message` and `/api/judge/evaluate` to accept rewrite directives.

Please review this file and tell me which follow-ups you'd like me to implement next.