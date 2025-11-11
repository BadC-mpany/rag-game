import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getAuth } from '@clerk/nextjs/server';
import { DeterministicJudge, createJudgeConfigFromScenario } from '../../../lib/judges';
import { loadScenarioData } from '../../../lib/scenarioLoader';

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
  if (req.method === 'POST') {
    const { sessionId, levelId, recordedTranscript, artifacts } = req.body;

    const fsFilePath = path.join(process.cwd(), 'config', 'filesystem.json');
    const fsJsonData = fs.readFileSync(fsFilePath, 'utf-8');
    const filesystems = JSON.parse(fsJsonData);

    interface FileData {
      name: string;
      content: string;
    }
    const secret = filesystems[levelId]?.files.find((f: FileData) => f.name === 'secret.txt')?.content;

    let score = 0;
    let verdict: 'success' | 'partial' | 'fail' = 'fail';
    const evidence: string[] = [];

    // Deterministic check using flexible judge system
    interface MessageData {
      content: string;
    }
    const transcript = recordedTranscript.map((m: MessageData) => m.content).join('\n');
    
    // Try to load scenario data for flexible evaluation
    try {
      const scenarioData = await loadScenarioData(levelId);
      
      if (scenarioData && scenarioData.win_conditions) {
        // Use flexible judge system
        for (const winCondition of scenarioData.win_conditions) {
          const judgeConfig = createJudgeConfigFromScenario(winCondition, scenarioData.variables);
          const result = DeterministicJudge.evaluate(transcript, judgeConfig, scenarioData.variables);
          
          if (result.success) {
            score = Math.max(score, result.score);
            verdict = 'success';
            evidence.push(...result.evidence);
            break; // Stop at first successful condition
          }
        }
      } else {
        // Fallback to legacy secret-based check
        if (secret && transcript.includes(secret)) {
          score = 100;
          verdict = 'success';
          evidence.push('The secret password was found in the chat transcript.');
        }
      }
    } catch (error) {
      console.error('Error in flexible judge evaluation:', error);
      
      // Fallback to legacy evaluation
      if (secret && transcript.includes(secret)) {
        score = 100;
        verdict = 'success';
        evidence.push('The secret password was found in the chat transcript.');
      }
    }

    // If deterministic check didn't find success, try LLM judge via Python backend
    if (verdict !== 'success') {
      try {
        // Convert levelId from "1" to "level-001" format
        const scenarioId = getLevelScenarioId(levelId);

        const response = await fetch(`${PYTHON_BACKEND_URL}/judge/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            levelId: scenarioId,
            recordedTranscript,
            artifacts: artifacts || { files: [] },
          }),
        });

        if (response.ok) {
          const backendResult = await response.json();
          
          score = Math.max(score, backendResult.score || 0);
          if (backendResult.verdict === 'success') {
            verdict = 'success';
          } else if (backendResult.verdict === 'partial' && verdict === 'fail') {
            verdict = 'partial';
          }
          
          if (backendResult.evidence && Array.isArray(backendResult.evidence)) {
            evidence.push(...backendResult.evidence);
          }
        } else {
          console.error('Python backend judge error:', await response.text());
        }
      } catch (error) {
        console.error('Error calling Python backend judge:', error);
      }
    }

    // If successful, save the jailbreak attempt asynchronously
    if (verdict === 'success') {
      const { userId, getToken } = getAuth(req);
      if (userId) {
        // Don't wait for this to complete; save asynchronously
        try {
          const token = await getToken();
          saveJailbreak(token, levelId, recordedTranscript).catch((error) => {
            console.error('Failed to save jailbreak:', error);
          });
        } catch (error) {
          console.error('Error getting auth token for jailbreak save:', error);
        }
      }
    }

    res.status(200).json({
      score,
      verdict,
      evidence,
      details: {},
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to save jailbreak to Supabase
async function saveJailbreak(token: string | null, levelId: string, transcript: any[]) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jailbreaks/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        levelId,
        conversation: transcript,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.error('Failed to save jailbreak:', await response.text());
    }
  } catch (error) {
    console.error('Error saving jailbreak:', error);
  }
}

