import type {
  ComponentRole,
  DominantIssueType,
} from "../../diagnostic/diagnostic-models";

export interface ComponentFamilyMember {
  filePath: string;
  fileName: string;
  className?: string;
  lineCount: number;
  dependencyCount: number;
  templateScore: number;
  responsibilityScore: number;
  dominantIssue: DominantIssueType | null;
  warningCodes: string[];
  componentRole?: ComponentRole;
  roleConfidence?: number;
}

export interface ComponentFamily {
  familyName: string;
  members: ComponentFamilyMember[];
  commonDominantIssue: DominantIssueType | null;
  commonWarningPatterns: string[];
  avgLineCount: number;
  avgDependencyCount: number;
  extractionScore: number;
  refactorDirection: string;
  roleDistribution?: Record<ComponentRole, number>;
  detectedRolePattern?: string;
  /** 0-1 confidence score for family grouping quality */
  confidence: number;
  /** True when confidence is below weak threshold; extraction not recommended */
  isWeakGrouping?: boolean;
  /** Human-readable label for weak grouping (e.g. "Review similarity before extraction") */
  weakGroupingLabel?: string;
  /** Evidence strings explaining why this family was suggested for extraction */
  representativeEvidence?: string[];
  /** Members that may not belong (different profile from core) */
  outliers?: ComponentFamilyMember[];
  /** Members excluding outliers */
  coreMembers?: ComponentFamilyMember[];
}
