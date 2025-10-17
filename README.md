# BadCompany - Agent Breaker Game

A red-team game where you attempt to exploit LLM agents through prompt injection and social engineering.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13+ (for backend)
- OpenRouter API key

### 1. Start the Backend

```bash
cd ../rag-system
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-dotenv langchain langchain-openai langchain-community chromadb redis sentence-transformers docx2txt
```

Create `.env` file in `rag-system`:
```
OPENROUTER_API_KEY=your_key_here
```

Start the server:
```bash
uvicorn server:app --reload --port 8000 --host 0.0.0.0
```

### 2. Start the Frontend

```bash
npm install
echo "PYTHON_BACKEND_URL=http://localhost:8000" >> .env.local
npm run dev
```

### 3. Play

Open `http://localhost:3000` and start attacking agents!

## Game Structure

- **Levels**: 10 different attack scenarios
- **Roles**: Different access levels (admin, worker, public)
- **Goals**: Extract secrets, manipulate outputs, exploit tools
- **Judge**: LLM-based evaluation of your attacks

## Configuration

- `config/levels.json` - Level definitions
- `config/filesystem.json` - Initial file states per level
- `config/prompts.json` - Agent and judge prompts
- `.env.local` - Environment variables
