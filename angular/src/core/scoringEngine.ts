/**
 * Component score calculation for workspace health.
 * Aggregates severity counts and warning density into an ExplainedScore.
 */

import type { ScoreFactor, ExplainedScore } from "./scan-result";
import { buildScoreExplanation } from "./explanationBuilder";

export interface ComponentScoreInput {
  componentsBySeverity: { warning: number; high: number; critical: number };
  warningDensity: number;
}

/**
 * Computes component score from severity counts and warning density.
 * Uses volume ceilings to prevent score collapse from warning count alone.
 */
export function computeComponentScore(input: ComponentScoreInput): ExplainedScore {
  const { componentsBySeverity, warningDensity } = input;

  const severityCriticalPenalty = Math.min(componentsBySeverity.critical * 0.4, 2.0);
  const severityHighPenalty = Math.min(componentsBySeverity.high * 0.15, 1.5);
  const severityWarningPenalty = Math.min(componentsBySeverity.warning * 0.03, 1.0);
  const densityPenalty = Math.min(warningDensity * 0.12, 1.0);

  let componentRawScore =
    10 -
    severityWarningPenalty -
    severityHighPenalty -
    severityCriticalPenalty -
    densityPenalty;

  const score = Math.max(0, Number(componentRawScore.toFixed(1)));

  const factors: ScoreFactor[] = [];
  if (severityWarningPenalty > 0) {
    factors.push({
      name: "Severity (Warning)",
      weight: 0.15,
      contribution: -severityWarningPenalty,
      description: `${componentsBySeverity.warning} components with warning severity`,
    });
  }
  if (severityHighPenalty > 0) {
    factors.push({
      name: "Severity (High)",
      weight: 0.25,
      contribution: -severityHighPenalty,
      description: `${componentsBySeverity.high} components with high severity`,
    });
  }
  if (severityCriticalPenalty > 0) {
    factors.push({
      name: "Severity (Critical)",
      weight: 0.35,
      contribution: -severityCriticalPenalty,
      description: `${componentsBySeverity.critical} components with critical severity`,
    });
  }
  if (densityPenalty > 0) {
    factors.push({
      name: "Warning Density",
      weight: 0.2,
      contribution: -densityPenalty,
      description: "High warning density across workspace",
    });
  }

  return {
    score,
    factors,
    shortExplanation: buildScoreExplanation(factors),
  };
}
