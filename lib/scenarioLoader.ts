// Frontend scenario loading utility
export interface ScenarioData {
  id: string;
  name: string;
  description: string;
  variables?: Record<string, unknown>;
  win_conditions: Array<{
    type: string;
    targets?: string;
    target?: string;
    message: string;
    caseSensitive?: boolean;
    score?: number;
    pattern?: string;
    minCount?: number;
    maxCount?: number;
  }>;
}

// Convert level ID (e.g., "1") to scenario filename (e.g., "level-001")
function getLevelScenarioId(levelId: string): string {
  const levelNum = parseInt(levelId, 10);
  if (isNaN(levelNum)) return levelId; // fallback if not a number
  return `level-${String(levelNum).padStart(3, '0')}`;
}

export async function loadScenarioData(levelId: string): Promise<ScenarioData | null> {
  try {
    // Convert levelId from "1" to "level-001" format
    const scenarioId = getLevelScenarioId(levelId);
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const fetchUrl = `${backendUrl}/scenarios/${scenarioId}`;
    
    // Try to fetch from the backend first with a 3 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(fetchUrl, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return null;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  } catch {
    return null;
  }
}
