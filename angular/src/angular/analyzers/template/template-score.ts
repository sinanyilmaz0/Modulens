import type { ScoreFactor } from "../../../core/scan-result";
import {
  TemplateAnalysisContext,
  TemplateConfidence,
  TemplateSeverity,
  TemplateWarning,
} from "./template-models";

const severityWeight: Record<TemplateSeverity, number> = {
  info: 0.15,
  warning: 0.45,
  high: 1.1,
  critical: 2.2,
};

const confidenceWeight: Record<TemplateConfidence, number> = {
  low: 0.5,
  medium: 0.8,
  high: 1,
};

function addFactor(
  factors: ScoreFactor[],
  name: string,
  weight: number,
  contribution: number,
  description: string
): void {
  if (contribution !== 0) {
    factors.push({ name, weight, contribution, description });
  }
}

export function calculateTemplateScore(
  context: TemplateAnalysisContext,
  warnings: TemplateWarning[]
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let score = 10;

  if (!context.hasTemplate) {
    return { score: 10, factors: [] };
  }

  const { metrics } = context;

  if (metrics.lineCount > 150) {
    const penalty = metrics.lineCount >= 250 ? 1 : 0.5;
    score -= penalty;
    addFactor(
      factors,
      "Template Size",
      0.4,
      -penalty,
      metrics.lineCount >= 250 ? "Very large template detected" : "Large template detected"
    );
  }

  if (metrics.methodCallCount > 0) {
    const penalty = Math.min(1.5, metrics.methodCallCount * 0.3);
    score -= penalty;
    addFactor(
      factors,
      "Method Call Density",
      0.25,
      -penalty,
      "High method calls in template"
    );
  }

  if (metrics.lineCount > 0) {
    const totalBindings =
      metrics.interpolationCount +
      metrics.propertyBindingCount +
      metrics.eventBindingCount;
    const density = totalBindings / metrics.lineCount;
    if (density > 2) {
      score -= 0.2;
      addFactor(factors, "Binding Density", 0.1, -0.2, "High binding density");
    }
  }

  if (metrics.structuralDepth >= 4) {
    const penalty = 0.5 * (metrics.structuralDepth - 3);
    score -= penalty;
    addFactor(
      factors,
      "Structural Depth",
      0.15,
      -penalty,
      "Deep structural directives"
    );
  }

  if (metrics.ngForCount > 0 && metrics.trackByCount === 0) {
    const penalty = Math.min(1.2, metrics.ngForCount * 0.4);
    score -= penalty;
    addFactor(
      factors,
      "ngFor Without trackBy",
      0.2,
      -penalty,
      "ngFor missing trackBy"
    );
  }

  if (metrics.longExpressionCount > 0) {
    const penalty = Math.min(1, metrics.longExpressionCount * 0.2);
    score -= penalty;
    addFactor(
      factors,
      "Long Expressions",
      0.1,
      -penalty,
      "Complex expressions"
    );
  }

  if (metrics.eventBindingCount > 8) {
    score -= 0.6;
    addFactor(
      factors,
      "Event Bindings",
      0.2,
      -0.6,
      "High number of event bindings"
    );
  }

  const weightedWarningPenalty = warnings.reduce((total, warning) => {
    return total + severityWeight[warning.severity] * confidenceWeight[warning.confidence];
  }, 0);

  const rulePenalty = Math.min(3.5, weightedWarningPenalty * 0.35);
  score -= rulePenalty;
  if (rulePenalty > 0) {
    addFactor(factors, "Rule Warnings", 0.35, -rulePenalty, "Template rule violations");
  }

  let volumePenalty = 0;
  if (warnings.length >= 7) {
    volumePenalty = 1.2;
    score -= 1.2;
  } else if (warnings.length >= 4) {
    volumePenalty = 0.8;
    score -= 0.8;
  }
  if (volumePenalty > 0) {
    addFactor(factors, "Warning Volume", 0.15, -volumePenalty, "Many warnings");
  }

  const clampedScore = Math.min(10, Math.max(0, score));
  return {
    score: Number(clampedScore.toFixed(1)),
    factors,
  };
}

export function getTemplateRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 4.5) {
    return "High";
  }

  if (score < 8) {
    return "Medium";
  }

  return "Low";
}
