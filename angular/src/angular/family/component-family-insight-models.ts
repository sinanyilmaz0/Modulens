import type { ConfidenceBreakdown } from "../../confidence/confidence-models";

export interface ComponentFamilyInsight {
  familyKey: string;
  familyName: string;
  components: {
    className: string;
    fileName: string;
    filePath: string;
    dominantIssue: string;
  }[];
  commonSignals: string[];
  dominantIssues: string[];
  sharedRefactorOpportunity: string;
  recommendedExtractions: string[];
  confidence: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  /** True when confidence is below weak threshold; extraction not recommended */
  isWeakGrouping?: boolean;
  /** Human-readable label for weak grouping */
  weakGroupingLabel?: string;
}
