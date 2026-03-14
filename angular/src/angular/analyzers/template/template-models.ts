export type TemplateSeverity = "info" | "warning" | "high" | "critical";
export type TemplateConfidence = "low" | "medium" | "high";

export interface TemplateWarning {
  code: string;
  severity: TemplateSeverity;
  confidence: TemplateConfidence;
  message: string;
  recommendation: string;
}

export interface TemplateMetrics {
  lineCount: number;
  interpolationCount: number;
  propertyBindingCount: number;
  eventBindingCount: number;
  twoWayBindingCount: number;
  ngIfCount: number;
  ngForCount: number;
  atForCount: number;
  atIfCount: number;
  ngTemplateCount: number;
  ngContainerCount: number;
  structuralDepth: number;
  methodCallCount: number;
  longExpressionCount: number;
  trackByCount: number;
}

export interface TemplateAnalysisContext {
  filePath: string;
  fileName: string;
  className: string;
  hasTemplate: boolean;
  templateSource: "inline" | "external" | "none";
  templatePath?: string;
  metrics: TemplateMetrics;
}

import type { ExplainedScore } from "../../../core/scan-result";

export interface TemplateAnalysisResult extends TemplateAnalysisContext {
  warnings: TemplateWarning[];
  score: number;
  explainedScore?: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  highestSeverity?: TemplateSeverity;
}

export interface TemplateSummary {
  totalComponents: number;
  componentsWithTemplate: number;
  componentsWithoutTemplate: number;
  averageScore: number;
  explainedScore: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  totalWarnings: number;
  componentsWithWarnings: number;
  severityCounts: Record<TemplateSeverity, number>;
  confidenceCounts: Record<TemplateConfidence, number>;
}
