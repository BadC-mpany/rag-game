
# Guide for LLM Implementing Agent and Judge Logic

This document provides a precise and unambiguous explanation of the current project state, specifically for an LLM (or developer) tasked with implementing the core agent and judge logic. The goal is to integrate a real LLM agent and a more sophisticated LLM-based judge into the existing web application.

## 1. Project Overview

The project is a web-based game called "badcompany - Agent Breaker" where users (attackers) attempt to find vulnerabilities in LLM agents. The application provides a frontend for user interaction (chat, file explorer) and a backend API to communicate with the agent and judge systems. The current implementation includes:

-   A Next.js frontend with React and TypeScript.
-   A basic chat interface for attacker-agent interaction.
-   A fake filesystem explorer allowing users to view, edit, and "commit" files.
-   A leaderboard with GitHub OAuth authentication.
-   An admin debug mode for viewing internal logs.
-   Placeholder API endpoints for agent messaging and judging.

## 2. Key Components for Agent/Judge Integration

### 2.1. Frontend Interaction

The frontend (`pages/play/[level].tsx`) handles user input, displays chat messages, and manages the state of the fake filesystem. It communicates with the backend via the following API endpoints:

-   `POST /api/agent/message`: Sends user messages and committed file changes to the agent.
-   `POST /api/judge/evaluate`: Submits the entire interaction (chat transcript, committed files) for evaluation.

### 2.2. Backend API Endpoints (Your Focus)

Your primary task is to replace the mocked logic within these two backend API endpoints with real implementations that interact with an actual LLM agent and judge.

#### 2.2.1. `POST /api/agent/message`

**Purpose**: This endpoint is the primary interface for the attacker to interact with the LLM agent. It receives user messages and the current state of the committed files, and should return the agent's response.

**Current State**: This endpoint currently returns a mocked response. It also conditionally returns `internalLogs` if `isAdmin` is true.

**Expected Request Payload (JSON)**:

```json
{
  "sessionId": "string", // Unique identifier for the user's session
  "levelId": "string",   // The ID of the current level (e.g., "level-001")
  "message": {             // The user's message to the agent
    "role": "attacker",
    "content": "string"
  },
  "files": [               // Array of committed files (name and content)
    {
      "name": "string",
      "content": "string"
    }
  ],
  "isAdmin": "boolean"     // True if admin mode is enabled (for internal logs)
}
```

**Expected Response Payload (JSON)**:

```json
{
  "reply": "string",                 // The agent's response message
  "tokensUsed": {                    // (Optional) Token usage statistics
    "prompt": "number",
    "completion": "number"
  },
  "toolCalls": [                     // (Optional) Array of tool calls made by the agent
    {
      "tool": "string",
      "args": "object",
      "result": "object"
    }
  ],
  "stats": {                         // (Optional) Performance statistics
    "inferenceMs": "number"
  },
  "internalLogs": ["string"]         // (Optional) Internal logs, only if `isAdmin` is true
}
```

**Your Task**: Implement the logic to:

1.  **Call your LLM Agent**: Use the `message.content` and the `files` array (representing the agent's accessible filesystem) as input to your LLM agent.
2.  **Process Agent Response**: Extract the agent's reply and any relevant metadata (tokens used, tool calls, stats).
3.  **Generate Internal Logs**: If `isAdmin` is true, generate detailed internal logs of the agent's thought process, tool usage, and any other relevant debugging information.
4.  **Return Response**: Format the agent's response according to the `Expected Response Payload`.

**Important implementation note (inference / usage statistics):** The frontend displays inference and usage statistics in the level UI (for example: token counts, inference latency). These metrics must be provided by the backend agent endpoint inside the response (for example under `stats` or `tokensUsed`). Ensure your agent integration collects model usage info (prompt/completion tokens, model identifier, inference timing) and returns them in the response so the UI can show accurate statistics.

### Single-turn vs Multi-turn

Some levels are configured to be single-turn (the player composes a single composite move — which may include chat content, file uploads, and commits — and then submits it for backend processing). Other levels are multi-turn where the attacker and the agent can exchange multiple messages. The frontend will indicate the mode for each level and will send a `singleTurn: true` boolean in the `/api/agent/message` payload for single-turn levels. The backend should treat single-turn requests as an atomic interaction and return both the agent reply and any evaluation-ready artifacts or stats. For single-turn levels, the frontend expects the input box to remain populated after submission so users can refine or resubmit their composite move if needed.

#### 2.2.2. `POST /api/judge/evaluate`

**Purpose**: This endpoint evaluates the attacker's interaction with the agent to determine if the attack was successful. It combines deterministic checks with an LLM-based judgment.

**Current State**: This endpoint currently performs a deterministic check for `level-001` (checking if the secret password is in the transcript) and includes a commented-out placeholder for an LLM judge call.

**Expected Request Payload (JSON)**:

```json
{
  "sessionId": "string",             // Unique identifier for the user's session
  "levelId": "string",               // The ID of the current level
  "recordedTranscript": [            // Array of all messages exchanged during the interaction
    {
      "role": "attacker" | "assistant",
      "content": "string"
    }
  ],
  "artifacts": {                     // Additional artifacts relevant to the judging
    "files": [
      {
        "name": "string",
        "content": "string"
      }
    ]
  }
}
```

**Expected Response Payload (JSON)**:

```json
{
  "score": "number",                 // A score from 0 to 100
  "verdict": "success" | "partial" | "fail", // The outcome of the judging
  "evidence": ["string"],            // A list of evidence supporting the verdict
  "details": "object"                // (Optional) Additional detailed metrics
}
```

**Your Task**: Implement the logic to:

1.  **Perform Deterministic Checks**: Enhance or add deterministic checks based on the `levelId` and the `recordedTranscript` and `artifacts`.
2.  **Call your LLM Judge**: Use the `recordedTranscript`, `artifacts`, and the specific `llm_judge_prompt` (from `config/prompts.json`) as input to your LLM judge.
3.  **Process LLM Judge Response**: Parse the LLM judge's response to extract its score, verdict, and reasoning.
4.  **Combine Results**: Combine the results from deterministic checks and the LLM judge to produce a final `score`, `verdict`, and `evidence`.
5.  **Return Response**: Format the judging result according to the `Expected Response Payload`.

## 3. Data Structures

-   **`Level` Interface**: Defined in `pages/play/[level].tsx` and `pages/index.tsx`.
    ```typescript
    interface Level {
      id: string;
      title: string;
      description: string;
      goal: string;
      files: FileData[]; // Initial files for the level
    }
    ```
-   **`FileData` Interface**: Defined in `pages/play/[level].tsx` and `components/FileSystemExplorer.tsx`.
    ```typescript
    interface FileData {
      name: string;
      content: string;
    }
    ```
-   **`committedState`**: In `pages/play/[level].tsx`, this state variable holds the current content of the files that the user has explicitly "committed" (made available to the agent). This `files` array is sent with each `POST /api/agent/message` request.

## 4. Configuration Files

-   **`config/prompts.json`**: Contains templates for the agent's system prompt and the LLM judge's prompt. You should use these prompts when interacting with your LLM models.
    ```json
    {
      "agent_system_prompt": "You are a helpful assistant.",
      "judge_system_prompt": "You are an impartial judge. ...",
      "llm_judge_prompt": "Analyze the following chat transcript ..."
    }
    ```
-   **`config/filesystem.json`**: Defines the initial filesystem state for each level. The `secret.txt` file in `level-001` is used for the deterministic judge.

## 5. Environment Variables

Ensure your LLM agent and judge implementations use environment variables for any API keys, endpoint URLs, or other sensitive configurations. The `.env.example` file lists the current project's environment variables. You will need to add any specific to your LLM providers.

-   `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`: For Vercel KV (leaderboard).
-   `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`: For GitHub OAuth authentication.

## 6. Next Steps for LLM Implementer

1.  **Integrate LLM Agent**: Replace the mocked response in `pages/api/agent/message.ts` with a call to your actual LLM agent. Ensure it processes the user's message and the `files` array, and generates appropriate `reply` and `internalLogs`.
2.  **Integrate LLM Judge**: Complete the logic in `pages/api/judge/evaluate.ts`. This involves calling your LLM judge with the `recordedTranscript` and `artifacts`, parsing its response, and combining it with deterministic checks to produce the final score and verdict.
3.  **Tool Sandboxing**: Implement the actual sandboxing for any tools the agent might use (e.g., web search, email). This is crucial for security.
4.  **Error Handling and Edge Cases**: Add robust error handling and consider edge cases for all API interactions.

This guide should provide all the necessary context to proceed with the LLM agent and judge implementation. Good luck!
