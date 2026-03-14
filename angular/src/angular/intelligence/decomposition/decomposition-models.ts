export interface DecompositionSuggestion {
  originalComponent: string;
  suggestedArchitecture: string;
  extractedComponents: string[];
  extractedServices: string[];
  reasoning: string[];
  decompositionConfidence: number;
}

import type { ConfidenceBreakdown } from "../../../confidence/confidence-models";

export interface FocusedDecompositionSuggestion {
  originalComponent: string;
  suggestedArchitecture: string;
  extractedComponents: string[];
  extractedServices: string[];
  reasoning: string[];
  confidence: number;
  strategy: "minimal" | "moderate" | "aggressive";
  confidenceBreakdown?: ConfidenceBreakdown;
}

export interface DecompositionPlannerConfig {
  maxExtractedComponents: number;
  maxExtractedServices: number;
  confidenceThreshold: number;
  defaultStrategy: "minimal" | "moderate";
}

export const DEFAULT_DECOMPOSITION_PLANNER_CONFIG: DecompositionPlannerConfig = {
  maxExtractedComponents: 4,
  maxExtractedServices: 2,
  confidenceThreshold: 0.5,
  defaultStrategy: "minimal",
};

export type DecompositionHeuristicType =
  | "template_heavy"
  | "media_player"
  | "form"
  | "orchestration";

export interface HeuristicExtraction {
  type: DecompositionHeuristicType;
  componentSuffixes: string[];
  serviceSuffixes: string[];
  architectureName: string;
}
