/**
 * Validates consistency of report metrics.
 * Logs warnings when expected mathematical relationships do not hold.
 */

import type { ScanResult } from "./scan-result";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validates that report metrics are internally consistent.
 * - totalFindings should equal sum of ruleViolationCounts (or be >= if component issues use different keys)
 * - componentsBySeverity sum should be <= componentCount
 * - componentsWithFindings should be <= componentCount
 */
export function validateMetricsConsistency(result: ScanResult): ValidationResult {
  const warnings: string[] = [];
  const { workspaceSummary, componentsBySeverity, ruleViolationCounts } = result;

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
    componentsBySeverity.warning +
    componentsBySeverity.high +
    componentsBySeverity.critical;

  if (severitySum > componentCount) {
    warnings.push(
      `componentsBySeverity sum (${severitySum}) exceeds componentCount (${componentCount})`
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
    console.warn("[Modulens] Metrics consistency warnings:", warnings);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
