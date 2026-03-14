export type FeaturePatternType =
  | "PLAYER_FEATURE_PATTERN"
  | "DETAIL_PAGE_PATTERN"
  | "CONTENT_PUBLISH_PATTERN"
  | "LIST_PAGE_PATTERN"
  | "FRAGMENT_MANAGEMENT_PATTERN";

export type DuplicationRisk = "low" | "medium" | "high";

export interface FeaturePattern {
  patternType: FeaturePatternType;
  featureName: string;
  instanceCount: number;
  confidence: number;
  components: string[];
  /** File paths for linking (same order as components); enables click-to-detail */
  filePaths?: string[];
  sharedSignals: string[];
  architecturalPattern: string;
  duplicationRisk: DuplicationRisk;
  recommendation: string;
  suggestedRefactor: string[];
}
