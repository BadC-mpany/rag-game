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
    
    // Try to fetch from the backend first
    const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'}/scenarios/${scenarioId}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback: return null if scenario not found
    return null;
  } catch (error) {
    console.error('Error loading scenario data:', error);
    return null;
  }
}
