import type { NextApiRequest, NextApiResponse } from 'next';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Convert level ID (e.g., "1") to scenario filename (e.g., "level-001")
function getLevelScenarioId(levelId: string): string {
  const levelNum = parseInt(levelId, 10);
  if (isNaN(levelNum)) return levelId; // fallback if not a number
  return `level-${String(levelNum).padStart(3, '0')}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;

  if (method === 'POST') {
    const { sessionId, levelId, message, files, isAdmin, singleTurn } = req.body;

    try {
      // Convert levelId from "1" to "level-001" format
      const scenarioId = getLevelScenarioId(levelId);

      const response = await fetch(`${PYTHON_BACKEND_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          levelId: scenarioId,
          message,
          files: files || [],
          isAdmin: isAdmin || false,
          singleTurn: singleTurn || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Python backend error:', errorData);
        
        return res.status(response.status).json({
          reply: `Error: ${errorData.detail || 'Failed to connect to agent backend'}`,
          tokensUsed: { prompt: 0, completion: 0 },
          toolCalls: [],
          stats: { inferenceMs: 0 },
          internalLogs: isAdmin ? [`Backend error: ${errorData.detail}`] : undefined,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
      
    } catch (error) {
      console.error('Error calling Python backend:', error);
      
      return res.status(500).json({
        reply: 'Error: Failed to connect to the agent backend. Make sure the Python server is running.',
        tokensUsed: { prompt: 0, completion: 0 },
        toolCalls: [],
        stats: { inferenceMs: 0 },
        internalLogs: isAdmin ? [`Connection error: ${error instanceof Error ? error.message : String(error)}`] : undefined,
      });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${method ?? 'UNKNOWN'} Not Allowed`);
}