import type { ComponentRole } from "../angular/intelligence/role-detection/role-models";
import type { FocusedDecompositionSuggestion } from "../angular/intelligence/decomposition/decomposition-models";
import type { ConfidenceBreakdown } from "../confidence/confidence-models";

export type DominantIssueType =
  | "TEMPLATE_HEAVY_COMPONENT"
  | "GOD_COMPONENT"
  | "CLEANUP_RISK_COMPONENT"
  | "ORCHESTRATION_HEAVY_COMPONENT"
  | "LIFECYCLE_RISKY_COMPONENT";

export type DiagnosticCluster =
  | "template_heavy"
  | "god_component"
  | "cleanup_risk"
  | "orchestration_heavy"
  | "lifecycle_risky";

export type { ComponentRole };

export interface DiagnosisEvidence {
  key: string;
  value: number | string | boolean;
  description: string;
}

export interface ComponentDiagnostic {
  filePath: string;
  fileName: string;
  className?: string;
  dominantIssue: DominantIssueType | null;
  supportingIssues: DominantIssueType[];
  refactorDirection: string;
  diagnosticLabel: string;
  clusterScores: Record<DiagnosticCluster, number>;
  /** Per-component finding count (component + lifecycle + template + responsibility). */
  totalWarningCount: number;
  evidence: DiagnosisEvidence[];
  componentRole?: ComponentRole;
  roleConfidence?: number;
  roleSignals?: string[];
  roleConfidenceBreakdown?: ConfidenceBreakdown;
  decompositionSuggestion?: FocusedDecompositionSuggestion | null;
  /** Short explanation of why this component ranks high (e.g. "High dependency count and large template") */
  rankingReason?: string;
  /** Rule IDs that triggered for this component (from issues and warnings). Used for rule-based filtering. */
  triggeredRuleIds?: string[];
}

export interface DiagnosticSummaryResult {
  componentDiagnostics: ComponentDiagnostic[];
  topCrossCuttingRisks: ComponentDiagnostic[];
}
