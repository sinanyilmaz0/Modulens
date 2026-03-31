/**
 * Types for feature breakdown and component summary.
 */

import type { CanonicalSeverityCode } from "../presenter-severity";
import type { SeverityConfidence } from "../../severity/severity-resolver";

export interface FeatureBreakdownItem {
  sourceRoot: string;
  components: number;
  componentsWithFindings: number;
  /** Sum of component issues in this cluster. Used for total findings. */
  componentFindings?: number;
  lifecycleTargets: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
  /** For merged groups (e.g. infrastructure): path segments for getProjectForPath matching */
  pathSegments?: string[];
}

export interface ComponentWithAnalyses {
  filePath: string;
  componentFindings: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
}

export interface FeatureBreakdownResult {
  items: FeatureBreakdownItem[];
  otherMinorClusters?: FeatureBreakdownItem[];
}

export type RuleGroup =
  | "template"
  | "lifecycle"
  | "responsibility"
  | "complexity"
  | "orchestration"
  | "generic";

export interface ComponentSummaryInput {
  refactorDirection?: string;
  diagnosticLabel?: string;
  dominantIssue?: string | null;
  templateLineCount?: number;
  dependencyCount?: number;
  structuralDepth?: number;
  filePath?: string;
  subscriptionCount?: number;
  serviceOrchestrationCount?: number;
  triggeredRuleIds?: string[];
  computedSeverity?: CanonicalSeverityCode;
  baseSeverity?: CanonicalSeverityCode | null;
  totalWarningCount?: number;
  /** measured | inferred | low. Prefer over anomalyFlag. */
  confidence?: SeverityConfidence;
  /** @deprecated Use confidence instead. */
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
  anomalyReasons?: string[];
}

