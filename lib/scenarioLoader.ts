// Frontend scenario loading utility
export interface ScenarioData {
  id: string;
  name: string;
  description: string;
  variables?: Record<string, any>;
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

export async function loadScenarioData(levelId: string): Promise<ScenarioData | null> {
  try {
    // Try to fetch from the backend first
    const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000'}/scenarios/${levelId}`);
    
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
