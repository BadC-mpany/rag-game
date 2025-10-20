import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { DeterministicJudge, createJudgeConfigFromScenario } from '../../../lib/judges';
import { loadScenarioData } from '../../../lib/scenarioLoader';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

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
        const response = await fetch(`${PYTHON_BACKEND_URL}/judge/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            levelId,
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

