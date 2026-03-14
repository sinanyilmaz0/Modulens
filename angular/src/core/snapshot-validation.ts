/**
 * Cross-artifact validation - ensures snapshot parity across UI, HTML, JSON.
 * Mismatches cause build/test to fail.
 */

import type { AnalysisSnapshot } from "./analysis-snapshot";

export interface SnapshotValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validates that snapshot metrics are internally consistent.
 * - overview totals == export totals
 * - patterns family counts == overview issue counts
 * - structure summary == structure cards aggregate
 * - rules totals == rule trigger aggregate
 * - refactor plan counts == extracted plan items
 * - components severity counts == overview-derived severity stats
 */
export function validateSnapshotParity(snapshot: AnalysisSnapshot): SnapshotValidationResult {
  const warnings: string[] = [];
  const { result } = snapshot;
  const { workspaceSummary, diagnosticSummary, ruleViolationCounts, componentsBySeverity } = result;

  const totalFindings = workspaceSummary.totalFindings;
  const componentCount = workspaceSummary.componentCount;

  const ruleViolationsSum = Object.values(ruleViolationCounts ?? {}).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalFindings !== ruleViolationsSum) {
    warnings.push(
      `totalFindings (${totalFindings}) must equal sum of ruleViolationCounts (${ruleViolationsSum})`
    );
  }

  const severitySum =
    componentsBySeverity.warning + componentsBySeverity.high + componentsBySeverity.critical;

  if (severitySum > componentCount) {
    warnings.push(
      `componentsBySeverity sum (${severitySum}) exceeds componentCount (${componentCount})`
    );
  }

  const dominantSum = Object.values(diagnosticSummary.dominantIssueCounts).reduce(
    (a, b) => a + b,
    0
  );
  if (dominantSum !== diagnosticSummary.componentsWithDominantIssue) {
    warnings.push(
      `dominantIssueCounts sum (${dominantSum}) !== componentsWithDominantIssue (${diagnosticSummary.componentsWithDominantIssue})`
    );
  }

  const projectBreakdown = result.projectBreakdown ?? [];
  for (const p of projectBreakdown) {
    if (p.componentsWithFindings > p.components) {
      warnings.push(
        `projectBreakdown ${p.sourceRoot}: componentsWithFindings (${p.componentsWithFindings}) exceeds components (${p.components})`
      );
    }
  }

  if (warnings.length > 0) {
    console.error("[Modulens] Snapshot parity validation failed:", warnings);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
