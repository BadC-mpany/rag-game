# Backend Setup Instructions

This guide will help you connect the Python RAG system backend to your Next.js frontend.

## Quick Start

### Terminal 1: Start Python Backend

```bash
cd /Users/mozer/Documents/projects/rag-system
./start_backend.sh
```

Or manually:
```bash
cd /Users/mozer/Documents/projects/rag-system
uvicorn server:app --reload --port 8000
```

### Terminal 2: Start Next.js Frontend

```bash
cd /Users/mozer/Documents/projects/rag-game

# Create environment variable file
echo "PYTHON_BACKEND_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

## Testing the Connection

1. Open your browser to `http://localhost:3000`
2. Navigate to a level (e.g., Level 1: Basic Injection)
3. Type a message in the chat interface
4. Click "Send"
5. The agent should respond using the RAG system from the Python backend

## What Changed

### Backend Changes (`rag-system`)

**File: `server.py`**
- Added CORS middleware to allow requests from Next.js
- Added `/agent/chat` endpoint that:
  - Accepts messages, files, and session info
  - Runs the RAG pipeline
  - Returns formatted responses with tokens and timing
  - Includes admin logs when requested
- Added `/judge/evaluate` endpoint for LLM-based judging

### Frontend Changes (`rag-game`)

**File: `pages/api/agent/message.ts`**
- Replaced placeholder with proxy to Python backend
- Forwards all requests to `http://localhost:8000/agent/chat`
- Handles errors gracefully with fallback messages

**File: `pages/api/judge/evaluate.ts`**
- Enhanced to call Python backend for LLM judging
- Combines deterministic checks with backend evaluation
- Falls back gracefully if backend is unavailable

**File: `INTEGRATION.md`**
- Comprehensive integration documentation

## Environment Configuration

### Backend (.env in rag-system)

Create a `.env` file with:

```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_NAME=meta-llama/llama-3.3-70b-instruct
```

### Frontend (.env.local in rag-game)

Create a `.env.local` file with:

```bash
PYTHON_BACKEND_URL=http://localhost:8000
```

## Troubleshooting

### "Failed to connect to the agent backend"

1. Check that the Python backend is running:
   ```bash
   curl http://localhost:8000
   ```
   Should return: `{"message":"RAG System API is running."}`

2. Check CORS configuration in `server.py`:
   ```python
   allow_origins=["http://localhost:3000", "http://localhost:3001"]
   ```

3. Verify the environment variable in Next.js:
   - Check `.env.local` exists
   - Restart the Next.js dev server after creating/modifying `.env.local`

### Backend Errors

1. **Import errors**: Install missing dependencies
   ```bash
   pip install fastapi uvicorn python-dotenv langchain langchain-openai chromadb
   ```

2. **API key errors**: Make sure your `.env` file has valid `OPENROUTER_API_KEY`

3. **Port already in use**: Change the port
   ```bash
   uvicorn server:app --reload --port 8001
   ```
   Then update `.env.local` in frontend:
   ```bash
   PYTHON_BACKEND_URL=http://localhost:8001
   ```

### Frontend Errors

1. **Module not found**: Install dependencies
   ```bash
   npm install
   ```

2. **Image loading errors**: The logo has been moved to `/public/badcompany_logo1.jpg`
   - Restart Next.js dev server if needed

## API Endpoints

### Python Backend (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/agent/chat` | Main RAG chat endpoint |
| POST | `/judge/evaluate` | Judge evaluation endpoint |
| GET | `/scenarios` | List available scenarios |
| POST | `/session/start` | Start a new session |

### Next.js API (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/message` | Proxy to Python `/agent/chat` |
| POST | `/api/judge/evaluate` | Enhanced judge with backend integration |

## Architecture Flow

```
User Input → Next.js Frontend → Next.js API Routes → Python FastAPI → RAG System → LLM
                                       ↓                     ↓
                                   Response              Vector Store
                                       ↓                     ↓
User sees answer ← Next.js Frontend ← Next.js API ← Python FastAPI
```

## Testing Checklist

- [ ] Python backend starts without errors
- [ ] Next.js frontend starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] Can select and enter a level
- [ ] Chat messages receive responses
- [ ] Responses are from RAG system (not placeholder)
- [ ] Admin mode shows internal logs
- [ ] Judge evaluation works
- [ ] No CORS errors in browser console

## Advanced Configuration

### Using Different Models

Edit `rag-system/.env`:
```bash
OPENROUTER_MODEL_NAME=anthropic/claude-3-sonnet
```

### Production Deployment

For production, you'll want to:
1. Deploy the Python backend to a service like Railway, Render, or AWS
2. Update `PYTHON_BACKEND_URL` in your Next.js environment
3. Configure proper CORS origins in `server.py`
4. Use production-grade secrets management
5. Add rate limiting and authentication

## Support

If you encounter issues:
1. Check both server logs (Python and Next.js)
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure all dependencies are installed
5. Try restarting both servers

