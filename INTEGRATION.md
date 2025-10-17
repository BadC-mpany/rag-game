# Backend Integration Guide

This document explains how to connect the RAG System backend with the RAG Game frontend.

## Prerequisites

1. Python 3.8+ with FastAPI installed (for backend)
2. Node.js 18+ (for frontend)
3. OpenRouter API key configured in the backend

## Setup Instructions

### 1. Backend Setup (rag-system)

```bash
cd /Users/mozer/Documents/projects/rag-system

# Install dependencies
pip install -r requirements.txt

# Make sure you have your .env file configured with:
# OPENROUTER_API_KEY=your_key_here

# Start the FastAPI server
uvicorn server:app --reload --port 8000
```

The backend will run on `http://localhost:8000`

### 2. Frontend Setup (rag-game)

```bash
cd /Users/mozer/Documents/projects/rag-game

# Install dependencies (if not already done)
npm install

# Create .env.local file with:
echo "PYTHON_BACKEND_URL=http://localhost:8000" > .env.local

# Start the Next.js development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## How It Works

The integration follows a proxy pattern:

1. **Frontend (Next.js)** → Makes requests to its own API routes (`/api/agent/message`, `/api/judge/evaluate`)
2. **Next.js API Routes** → Forward requests to Python FastAPI backend
3. **Python Backend** → Processes RAG queries and returns results
4. **Response flows back** through the same chain

### API Endpoints

#### Backend (FastAPI - Port 8000)

- `GET /` - Health check
- `POST /agent/chat` - RAG chat endpoint
- `POST /judge/evaluate` - Judge evaluation endpoint

#### Frontend (Next.js - Port 3000)

- `POST /api/agent/message` - Proxies to Python backend
- `POST /api/judge/evaluate` - Combines deterministic checks with Python backend

## Testing the Integration

1. Start both servers (backend on 8000, frontend on 3000)
2. Navigate to `http://localhost:3000`
3. Select a level (e.g., Level 1)
4. Try sending a message in the chat
5. The agent should respond using the RAG system from the backend

## Troubleshooting

### Connection Refused Error

If you see "Failed to connect to the agent backend":
- Make sure the Python backend is running on port 8000
- Check that CORS is configured correctly in `server.py`
- Verify the `PYTHON_BACKEND_URL` environment variable

### Missing Dependencies

Backend:
```bash
pip install fastapi uvicorn python-dotenv langchain langchain-openai chromadb
```

Frontend:
```bash
npm install
```

## Environment Variables

### Backend (.env in rag-system)
```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_NAME=meta-llama/llama-3.3-70b-instruct
```

### Frontend (.env.local in rag-game)
```
PYTHON_BACKEND_URL=http://localhost:8000
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
```

## Architecture

```
┌─────────────────┐
│   Browser       │
│   (User)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js       │
│   Frontend      │
│   (Port 3000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js API   │
│   Routes        │
│   (Proxy)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI       │
│   Backend       │
│   (Port 8000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RAG System    │
│   (LangChain +  │
│    ChromaDB)    │
└─────────────────┘
```

