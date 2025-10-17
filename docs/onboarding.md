# Project Onboarding Guide for LLMs

## 1. Core Principles & Directives

Your purpose is to assist in the development of this project. Adhere to the following directives:

1.  **This Document is the Source of Truth:** The information here is based directly on the project's source code. Existing `.md` files may be outdated; use them for context but trust only the code and this guide.
2.  **Update this Document:** If you make changes to the codebase that alter its architecture, logic, or core functionality, you MUST update this document to reflect those changes.
3.  **Consult Before Deviating:** The user is an experienced software developer but new to web development. Adhere strictly to their instructions. If you have a reason to deviate or expand the scope, you must explain your reasoning and receive explicit approval before proceeding.
4.  **Code Quality:**
    *   **Modularity:** Write modular, reusable code. Logic should be separated from UI.
    *   **No Bugs:** Strive for bug-free code.
    *   **Minimal Comments:** Use comments only to explain *why* a piece of complex logic exists, not *what* it does.
    *   **Best Practices:** Follow established software engineering best practices.
5.  **Interaction Style:** Keep your chat output concise and to the point.
6.  **Configuration Over Hardcoding:** Do not hardcode values (strings, numbers, settings). Use the JSON files in the `/config` directory.
7.  **Free Hosting:** The project aims for free-tier hosting (e.g., Vercel, Supabase). Your implementation choices should align with this goal (e.g., prefer serverless functions, avoid solutions requiring a long-running server).

## 2. Project Overview

This is a Next.js web application designed as a gamified platform for learning and testing security vulnerabilities in AI agents, specifically those using Retrieval-Augmented Generation (RAG).

The user plays a series of "levels," each presenting a unique scenario where they must trick an AI agent into violating its security protocols. The goal is to achieve a specific "attack goal," such as revealing a secret, exfiltrating data, or manipulating the agent's behavior.

The frontend (this repository) manages the user interface, game state, and user authentication. It communicates with a separate Python backend (defined by the `PYTHON_BACKEND_URL` environment variable) which handles the core AI agent and judging logic.

## 3. Technology Stack

*   **Framework:** Next.js 14.x
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Authentication & DB:** Supabase (handles user accounts, session management, and user progress/scores).
*   **State Management:** React Hooks (`useState`, `useEffect`, `useContext`).
*   **API Communication:** `fetch` API to communicate with Next.js API routes and the external Python backend.

## 4. Directory Structure

*   `pages/`: Contains all application routes.
    *   `pages/api/`: Backend API routes handled by Next.js.
        *   `pages/api/agent/message.ts`: Forwards user chat messages and context to the `PYTHON_BACKEND_URL`. This is the primary communication channel with the AI.
        *   `pages/api/judge/evaluate.ts`: Submits the user's solution (chat history, files) for a level to be evaluated. It contains a simple deterministic check for secrets and also forwards the request to the Python backend for more complex LLM-based evaluation.
        *   `pages/api/auth/`: Handles authentication callbacks (not a primary concern for most tasks).
    *   `pages/play/[level].tsx`: **The core game component.** This dynamic route renders the main gameplay UI for each level. It manages the chat, file system, and game logic for the active level.
    *   Other files like `index.tsx`, `leaderboard.tsx`, etc., are standard pages.
*   `components/`: Reusable React components.
    *   `components/Sidebar.tsx`: The main navigation panel.
    *   `components/FileSystemExplorer.tsx`: A key component that renders a virtual file system for the user to interact with on certain levels.
    *   `components/DiffViewer.tsx`: Shows differences between file versions.
    *   `components/Auth.tsx`: The UI for sign-in and sign-up.
*   `lib/`: Core, non-UI logic.
    *   `lib/supabase.ts`: Initializes and exports the Supabase client for database and auth operations.
    *   `lib/userProgress.ts`: Contains functions for updating a user's score and level progression in the Supabase database.
*   `config/`: **Critical Configuration Files.** All static data and game configuration are stored here as JSON.
    *   `config/levels.json`: An array defining every level in the game. Each object specifies the level's ID, title, description, attack goal, and capabilities (e.g., `allowsFiles`, `singleTurn`).
    *   `config/game.json`: General game configuration. **Placeholder:** The `initial_filesystem` mentioned in `pages/play/[level].tsx` is not in this file; initial file state appears to be missing or handled elsewhere.
    *   `config/prompts.json`: Contains system prompts for the AI agent and the judge.
*   `contexts/`: React Context providers.
    *   `contexts/AuthContext.tsx`: Manages global authentication state (user, session, loading state) and provides auth functions (signIn, signOut) to the rest of the app.
*   `public/`: Static assets like images.
*   `styles/`: Global CSS and Tailwind CSS configuration.

## 5. Key Concepts & Logic

### Authentication Flow

1.  Authentication is handled by Supabase. The UI is in `components/Auth.tsx` and the logic is managed in `contexts/AuthContext.tsx`.
2.  The `getSupabaseClient` function in `lib/supabase.ts` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables to connect.
3.  User data, including `total_score` and `current_level`, is stored in the `auth.users` table's `user_metadata` column.

### Game Flow (`pages/play/[level].tsx`)

1.  The user navigates to `/play/[level-id]`.
2.  The component fetches the corresponding level data from the imported `config/levels.json`.
3.  The UI is constructed based on the level's configuration (e.g., the `FileSystemExplorer` is only shown if `allowsFiles` is true).
4.  **Multi-turn levels (`singleTurn: false`):** The user interacts with the agent via a chat interface. Each message is sent to `/api/agent/message`, which forwards it to the Python backend.
5.  **Single-turn levels (`singleTurn: true`):** The user typically modifies files in the `FileSystemExplorer`. When ready, they click "Commit & Evaluate".
6.  **Evaluation:** The `handleCommit` function sends the chat transcript and any created/modified files to `/api/judge/evaluate`. This endpoint determines if the user's attack was successful and returns a score and verdict. If successful, `lib/userProgress.ts` is called to update the user's metadata in Supabase.

### Placeholders & Incomplete Features

*   **Judge Logic:** The primary evaluation logic resides in the Python backend. The Next.js endpoint at `pages/api/judge/evaluate.ts` contains a very basic, deterministic check (does the transcript contain the content of `secret.txt`?). For all other scenarios, it relies entirely on the backend.
*   **Initial Filesystem:** The code in `pages/play/[level].tsx` attempts to load an initial filesystem from a non-existent `initial_filesystem` key in `gameConfig`. This is a **placeholder**, and currently, levels that require files start with an empty file explorer.
*   **Audio Transcription:** `FileSystemExplorer.tsx` contains logic for audio recording and transcription for `level-007`. It uses a `transcriber.ts` library. This feature appears specialized and may not be fully integrated into the core game loop for other levels.
*   **Session ID:** A placeholder string (`session-id-placeholder`) is used when communicating with the backend APIs. This should be replaced with a real, persistent session identifier.
