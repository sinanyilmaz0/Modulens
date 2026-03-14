import type { LifecycleDetectionSignals } from "../lifecycle/lifecycle-models";
import type { TemplateMetrics } from "../template/template-models";

export type ResponsibilitySeverity = "info" | "warning" | "high" | "critical";
export type ResponsibilityConfidence = "low" | "medium" | "high";

export interface ResponsibilityWarning {
  code: string;
  severity: ResponsibilitySeverity;
  confidence: ResponsibilityConfidence;
  message: string;
  recommendation: string;
}

export interface ResponsibilityMetrics {
  methodCount: number;
  publicMethodCount: number;
  propertyCount: number;
  inputCount: number;
  outputCount: number;
  dependencyCount: number;
  formGroupCount: number;
  formControlCount: number;
  formBuilderUsage: boolean;
  formPatchSetUpdateCount: number;
  routerUsage: boolean;
  matDialogUsage: boolean;
  modalOrDrawerUsage: boolean;
  serviceOrchestrationCount: number;
  uiStateFieldCount: number;
  addEventListenerCount: number;
  setTimeoutCount: number;
  setIntervalCount: number;
  rendererListenCount: number;
}

export interface ResponsibilityAnalysisContext {
  filePath: string;
  fileName: string;
  className: string;
  metrics: ResponsibilityMetrics;
  lineCount?: number;
  lifecycleSignals?: LifecycleDetectionSignals;
  templateMetrics?: TemplateMetrics;
}

import type { ExplainedScore } from "../../../core/scan-result";

export interface ResponsibilityAnalysisResult extends ResponsibilityAnalysisContext {
  warnings: ResponsibilityWarning[];
  score: number;
  explainedScore?: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  highestSeverity?: ResponsibilitySeverity;
}

export interface ResponsibilitySummary {
  totalComponents: number;
  averageScore: number;
  explainedScore: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  totalWarnings: number;
  componentsWithWarnings: number;
  severityCounts: Record<ResponsibilitySeverity, number>;
  confidenceCounts: Record<ResponsibilityConfidence, number>;
}
