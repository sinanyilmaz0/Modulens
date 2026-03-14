import type { ScoreFactor } from "../../../core/scan-result";
import type {
  ResponsibilityAnalysisContext,
  ResponsibilityConfidence,
  ResponsibilitySeverity,
  ResponsibilityWarning,
} from "./responsibility-models";

const severityWeight: Record<ResponsibilitySeverity, number> = {
  info: 0.15,
  warning: 0.45,
  high: 1.1,
  critical: 2.2,
};

const confidenceWeight: Record<ResponsibilityConfidence, number> = {
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

export function calculateResponsibilityScore(
  context: ResponsibilityAnalysisContext,
  warnings: ResponsibilityWarning[]
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let score = 10;

  const { metrics, lineCount } = context;

  if (metrics.methodCount >= 25) {
    score -= 1.5;
    addFactor(factors, "Method Count", 0.2, -1.5, "Very high method count");
  } else if (metrics.methodCount >= 15) {
    score -= 0.8;
    addFactor(factors, "Method Count", 0.15, -0.8, "High method count");
  }

  if (metrics.publicMethodCount >= 12) {
    score -= 1.2;
    addFactor(factors, "Public Method Count", 0.15, -1.2, "Too many public methods");
  } else if (metrics.publicMethodCount >= 8) {
    score -= 0.6;
    addFactor(factors, "Public Method Count", 0.1, -0.6, "High public method count");
  }

  if (metrics.propertyCount >= 20) {
    score -= 1;
    addFactor(factors, "Property Count", 0.1, -1, "Very high property count");
  } else if (metrics.propertyCount >= 12) {
    score -= 0.5;
    addFactor(factors, "Property Count", 0.08, -0.5, "High property count");
  }

  if (metrics.uiStateFieldCount >= 5) {
    score -= 1;
    addFactor(factors, "UI State Fields", 0.1, -1, "Too many UI state fields");
  } else if (metrics.uiStateFieldCount >= 3) {
    score -= 0.4;
    addFactor(factors, "UI State Fields", 0.08, -0.4, "Several UI state fields");
  }

  const formIntensity = metrics.formGroupCount + metrics.formPatchSetUpdateCount;
  if (formIntensity >= 10) {
    score -= 1.2;
    addFactor(factors, "Form Intensity", 0.15, -1.2, "Heavy form usage");
  } else if (formIntensity >= 5) {
    score -= 0.6;
    addFactor(factors, "Form Intensity", 0.1, -0.6, "Moderate form usage");
  }

  const totalIO = metrics.inputCount + metrics.outputCount;
  if (totalIO >= 12) {
    score -= 0.8;
    addFactor(factors, "Input/Output Count", 0.1, -0.8, "Too many inputs/outputs");
  } else if (totalIO >= 8) {
    score -= 0.4;
    addFactor(factors, "Input/Output Count", 0.08, -0.4, "High input/output count");
  }

  if ((lineCount ?? 0) >= 400 && metrics.methodCount >= 15) {
    score -= 0.5;
    addFactor(
      factors,
      "Large Component",
      0.1,
      -0.5,
      "Large component with many methods"
    );
  }

  const weightedWarningPenalty = warnings.reduce((total, warning) => {
    return total + severityWeight[warning.severity] * confidenceWeight[warning.confidence];
  }, 0);

  const rulePenalty = Math.min(3.5, weightedWarningPenalty * 0.35);
  score -= rulePenalty;
  if (rulePenalty > 0) {
    addFactor(factors, "Rule Warnings", 0.35, -rulePenalty, "Responsibility rule violations");
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

export function getResponsibilityRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 4.5) {
    return "High";
  }

  if (score < 8) {
    return "Medium";
  }

  return "Low";
}
