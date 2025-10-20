// Judge system for evaluating level completion
export interface JudgeConfig {
  type: 'contains_any_text' | 'contains_text' | 'regex_match' | 'word_count' | 'custom';
  targets?: string[];  // Direct targets
  targetVariable?: string;  // Reference to scenario variable
  pattern?: string;  // For regex_match
  minCount?: number;  // For word_count
  maxCount?: number;  // For word_count
  caseSensitive?: boolean;
  successMessage?: string;
  successScore?: number;
}

export interface JudgeResult {
  success: boolean;
  score: number;
  evidence: string[];
  details?: Record<string, unknown>;
}

export class DeterministicJudge {
  static evaluate(transcript: string, config: JudgeConfig, scenarioVariables?: Record<string, unknown>): JudgeResult {
    const result: JudgeResult = {
      success: false,
      score: 0,
      evidence: [],
    };

    const searchText = config.caseSensitive ? transcript : transcript.toLowerCase();
    
    switch (config.type) {
      case 'contains_text':
        if (config.targets && config.targets.length > 0) {
          const target = config.caseSensitive ? config.targets[0] : config.targets[0].toLowerCase();
          if (searchText.includes(target)) {
            result.success = true;
            result.score = config.successScore || 100;
            result.evidence.push(config.successMessage || `Found target text: "${config.targets[0]}"`);
          }
        }
        break;

      case 'contains_any_text':
        let targets: string[] = [];
        
        // Get targets from variable reference or direct targets
        if (config.targetVariable && scenarioVariables) {
          const variableValue = scenarioVariables[config.targetVariable];
          if (Array.isArray(variableValue)) {
            targets = variableValue;
          } else if (typeof variableValue === 'string') {
            targets = [variableValue];
          }
        } else if (config.targets) {
          targets = config.targets;
        }

        for (const target of targets) {
          const searchTarget = config.caseSensitive ? target : target.toLowerCase();
          if (searchText.includes(searchTarget)) {
            result.success = true;
            result.score = config.successScore || 100;
            const message = config.successMessage || `Found target text: "${target}"`;
            result.evidence.push((scenarioVariables?.success_message as string) || message);
            break;
          }
        }
        break;

      case 'regex_match':
        if (config.pattern) {
          const flags = config.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(config.pattern, flags);
          const matches = transcript.match(regex);
          if (matches && matches.length > 0) {
            result.success = true;
            result.score = config.successScore || 100;
            result.evidence.push(`Found ${matches.length} regex matches: ${matches.join(', ')}`);
            result.details = { matches };
          }
        }
        break;

      case 'word_count':
        if (config.targets && config.targets.length > 0) {
          const target = config.caseSensitive ? config.targets[0] : config.targets[0].toLowerCase();
          const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, config.caseSensitive ? 'g' : 'gi');
          const matches = transcript.match(regex);
          const count = matches ? matches.length : 0;
          
          const minMet = config.minCount === undefined || count >= config.minCount;
          const maxMet = config.maxCount === undefined || count <= config.maxCount;
          
          if (minMet && maxMet) {
            result.success = true;
            result.score = config.successScore || 100;
            result.evidence.push(`Word "${config.targets[0]}" appears ${count} times (within acceptable range)`);
          }
          result.details = { count, minCount: config.minCount, maxCount: config.maxCount };
        }
        break;

      default:
        result.evidence.push(`Unknown judge type: ${config.type}`);
    }

    return result;
  }
}

// Helper function to convert scenario win_conditions to JudgeConfig
export function createJudgeConfigFromScenario(winCondition: Record<string, unknown>, scenarioVariables?: Record<string, unknown>): JudgeConfig {
  const config: JudgeConfig = {
    type: (winCondition.type as JudgeConfig['type']) || 'contains_text',
    caseSensitive: winCondition.caseSensitive !== false, // Default to true
  };

  // Handle score (can be a variable reference or direct number)
  if (winCondition.score) {
    if (scenarioVariables && scenarioVariables[winCondition.score as string]) {
      config.successScore = scenarioVariables[winCondition.score as string] as number;
    } else if (typeof winCondition.score === 'number') {
      config.successScore = winCondition.score;
    } else {
      config.successScore = 100; // Default
    }
  } else {
    config.successScore = 100; // Default
  }

  // Handle message (can be a variable reference or direct string)
  if (winCondition.message) {
    if (scenarioVariables && scenarioVariables[winCondition.message as string]) {
      config.successMessage = scenarioVariables[winCondition.message as string] as string;
    } else {
      config.successMessage = winCondition.message as string;
    }
  }

  // Handle targets (can be variable reference or direct targets)
  if (winCondition.targets) {
    config.targetVariable = winCondition.targets as string;
  } else if (winCondition.target) {
    config.targets = [winCondition.target as string];
  }

  // Copy other properties
  if (winCondition.pattern) config.pattern = winCondition.pattern as string;
  if (winCondition.minCount !== undefined) config.minCount = winCondition.minCount as number;
  if (winCondition.maxCount !== undefined) config.maxCount = winCondition.maxCount as number;

  return config;
}
