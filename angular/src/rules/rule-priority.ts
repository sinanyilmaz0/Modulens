/**
 * Rule priority scoring and enrichment for the Rules page.
 * Computes actionable priority based on workspace data and rule metadata.
 */

import type { RuleMetadata, RuleImpactCategory } from "./rule-registry";

export interface EnrichedRule {
  rule: RuleMetadata;
  violationCount: number;
  affectedComponentCount: number;
  priorityScore: number;
}

const IMPACT_CATEGORY_WEIGHT: Record<RuleImpactCategory, number> = {
  behavior_leak_risk: 4,
  cross_cutting_maintainability: 3,
  local_maintainability: 2,
  informational: 1,
};

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  warning: 2,
  info: 1,
};

/**
 * Computes a priority score for a rule based on workspace impact and metadata.
 * Higher score = higher priority to act on.
 */
export function computeRulePriorityScore(
  rule: RuleMetadata,
  violationCount: number,
  affectedComponentCount: number,
  totalComponents: number
): number {
  if (violationCount === 0 && affectedComponentCount === 0) {
    return 0;
  }

  const severityScore = SEVERITY_WEIGHT[rule.severity] ?? 1;
  const impactScore = IMPACT_CATEGORY_WEIGHT[rule.impactCategory] ?? 1;
  const actionPriorityInverse = 6 - rule.actionPriority; // 1 -> 5, 5 -> 1

  const breadthFactor =
    totalComponents > 0 ? affectedComponentCount / totalComponents : 0;
  const breadthScore = Math.min(breadthFactor * 10, 3);

  const leakBonus = rule.impactCategory === "behavior_leak_risk" ? 2 : 0;

  const raw =
    severityScore * 2 +
    impactScore * 2 +
    actionPriorityInverse +
    breadthScore +
    leakBonus +
    (affectedComponentCount > 0 ? 1 : 0);

  return Math.round(raw * 10);
}

/**
 * Enriches rules with workspace violation and affected-component data,
 * and computes priority scores.
 */
export function enrichRulesWithWorkspaceData(
  rules: RuleMetadata[],
  ruleViolationCounts: Record<string, number>,
  ruleToAffectedComponents: Record<string, string[]>,
  totalComponents: number
): EnrichedRule[] {
  return rules.map((rule) => {
    const violationCount = ruleViolationCounts[rule.id] ?? 0;
    const affectedPaths = ruleToAffectedComponents[rule.id] ?? [];
    const affectedComponentCount = affectedPaths.length;

    const priorityScore = computeRulePriorityScore(
      rule,
      violationCount,
      affectedComponentCount,
      totalComponents
    );

    return {
      rule,
      violationCount,
      affectedComponentCount,
      priorityScore,
    };
  });
}

/**
 * Returns top N rules to act on first, sorted by priority score descending.
 */
export function getTopActionableRules(
  enrichedRules: EnrichedRule[],
  limit = 5
): EnrichedRule[] {
  return enrichedRules
    .filter((e) => e.violationCount > 0 || e.affectedComponentCount > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}
