export type StructureConcernType =
  | "deep-nesting"
  | "shared-dumping-risk"
  | "generic-folder-overuse"
  | "suspicious-placement"
  | "feature-boundary-blur"
  | "folder-density-concern";

export type StructureConcernConfidence = "low" | "medium" | "high";

export type StructureConcernImpact = "low" | "medium" | "high";

export type RefactorEffortEstimate = "low" | "medium" | "high";

export interface AffectedAreaWithCount {
  area: string;
  count: number;
}

/** Per-path refactor story for suspicious-placement concern */
export interface SuspiciousPlacementDetail {
  path: string;
  /** Human-readable current location (e.g. shared/components) */
  currentLocation: string;
  /** Inferred owning feature from path or class name */
  likelyOwningFeature: string | null;
  /** Why this path was flagged (role + shared path) */
  whySuspicious: string;
  /** Suggested move direction (e.g. "Move to features/reports/components") */
  suggestedMoveDirection: string;
  /** Dominant smell if component also has one */
  dominantIssue?: string;
}

/** Refactor option for structure concerns (e.g. suspicious-placement) */
export interface RefactorOption {
  id: string;
  label: string;
  description: string;
  whenToUse: string;
}

export interface StructureConcern {
  concernType: StructureConcernType;
  /** Canonical, normalized set of unique affected component file paths */
  affectedPaths: string[];
  /** Number of unique files in affectedPaths (not findings) */
  affectedCount: number;
  explanation: string;
  whyItMatters: string;
  refactorDirection: string;
  /** Representative subset of affectedPaths used for UI examples */
  samplePaths: string[];
  /** Area names; derived from affectedAreasWithCounts, same order */
  affectedAreas?: string[];
  /** Area names with file counts for chip display; sum of counts equals affectedCount */
  affectedAreasWithCounts?: AffectedAreaWithCount[];
  confidence: StructureConcernConfidence;
  /** Derived from confidence + affectedCount */
  impact?: StructureConcernImpact;
  /** Estimated refactor effort by concern type */
  effortEstimate?: RefactorEffortEstimate;
  /** Explains which signals triggered this concern */
  whyFlaggedHere?: string;
  /** Per-path refactor story for suspicious-placement */
  suspiciousPlacementDetails?: SuspiciousPlacementDetail[];
  /** Refactor options for shared/feature-specific concerns */
  refactorOptions?: RefactorOption[];
}

export interface StructureAnalysisResult {
  concerns: StructureConcern[];
  /** Sum of affectedCount across all concerns (a file can appear in multiple concerns) */
  totalConcerns: number;
  categoryCount: number;
  mostCommonType?: StructureConcernType;
  /** Share of most common type (0-1) */
  mostCommonShare?: number;
  /** Count of high-confidence concerns */
  highConfidenceCount: number;
  /** Most affected feature area across all concerns */
  mostAffectedArea?: string;
  /** Primary structural smell (same as mostCommonType, for clarity) */
  primaryStructuralSmell?: StructureConcernType;
  /** Human-readable insight sentence */
  insightSentence?: string;
}
