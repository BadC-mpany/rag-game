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
    
    console.log(`[ScenarioLoader] Fetching scenario for levelId="${levelId}" -> scenarioId="${scenarioId}" from ${fetchUrl}`);
    
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
        console.log(`[ScenarioLoader] Successfully loaded scenario for "${scenarioId}":`, {
          id: data.id,
          name: data.name,
          hasWinConditions: !!data.win_conditions,
          winConditionsCount: data.win_conditions?.length || 0,
          hasVariables: !!data.variables,
        });
        return data;
      }
      
      console.warn(`[ScenarioLoader] Backend returned status ${response.status} for "${scenarioId}"`);
      return null;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`[ScenarioLoader] Failed to fetch scenario "${scenarioId}":`, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        url: fetchUrl,
      });
      return null;
    }
  } catch (error) {
    console.error('[ScenarioLoader] Unexpected error:', error);
    return null;
  }
}
