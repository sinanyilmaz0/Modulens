/**
 * Component explorer summary lines from diagnostics.
 */

import type { CanonicalSeverityCode } from "../presenter-severity";
import type { SeverityConfidence } from "../../severity/severity-resolver";
import { getTranslations } from "../i18n/translations";
import {
  RULES_REGISTRY,
  type RuleCategory,
  type RuleSeverity,
  type RuleMetadata,
} from "../../../rules/rule-registry";
import type { ComponentSummaryInput, RuleGroup } from "./feature-extraction-types";

const DOMINANT_ISSUE_ACTIONS: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Extract template branches into child sections",
  GOD_COMPONENT:
    "Split orchestration, data access, and presentation into smaller components",
  CLEANUP_RISK_COMPONENT:
    "Consolidate subscriptions and timers behind clear teardown ownership",
  ORCHESTRATION_HEAVY_COMPONENT: "Move orchestration into facade/service",
  LIFECYCLE_RISKY_COMPONENT:
    "Centralize side effects so init and teardown stay predictable",
};

const RULE_CATEGORY_TO_GROUP: Record<RuleCategory, RuleGroup> = {
  "template-complexity": "template",
  "lifecycle-cleanup": "lifecycle",
  "responsibility-god": "responsibility",
  "component-size": "complexity",
  "dependency-orchestration": "orchestration",
};

const RULE_GROUP_ACTIONS: Record<RuleGroup, string> = {
  template: "Extract template branches into child components",
  lifecycle: "Consolidate subscriptions and timers behind clear teardown",
  responsibility: "Split UI, orchestration, and data handling into focused units",
  complexity: "Break into smaller pieces and prune incidental logic",
  orchestration: "Move orchestration into dedicated services",
  generic: "Tackle highest-impact refactors first",
};

const RULE_SEVERITY_WEIGHT: Record<RuleSeverity, number> = {
  critical: 3,
  high: 2,
  warning: 1,
  info: 0,
};

const RULE_GROUP_PRIORITY: RuleGroup[] = [
  "template",
  "lifecycle",
  "responsibility",
  "complexity",
  "orchestration",
  "generic",
];

const CONFIDENCE_NOTES: Record<SeverityConfidence, string | undefined> = {
  measured: undefined,
  inferred:
    "Several rule patterns together suggest elevated risk; review evidence before acting.",
  low: "Metrics are partial for this component; review evidence before acting.",
};

const RULE_METADATA_BY_ID: Map<string, RuleMetadata> = new Map();
for (const rule of RULES_REGISTRY) {
  RULE_METADATA_BY_ID.set(rule.id, rule);
}

function mapDominantIssueToAction(issue: string | null | undefined): string | undefined {
  if (!issue) return undefined;
  if (issue === "NO_DOMINANT_ISSUE" || issue === "__NO_DOMINANT_ISSUE__") return undefined;
  return DOMINANT_ISSUE_ACTIONS[issue];
}

function deriveRuleGroupFromRules(triggeredRuleIds?: string[]): RuleGroup | undefined {
  if (!triggeredRuleIds || triggeredRuleIds.length === 0) return undefined;
  const scores = new Map<
    RuleGroup,
    {
      maxSeverityWeight: number;
      count: number;
    }
  >();

  for (const id of triggeredRuleIds) {
    const meta = RULE_METADATA_BY_ID.get(id);
    if (!meta) continue;
    const group = RULE_CATEGORY_TO_GROUP[meta.category] ?? "generic";
    const weight = RULE_SEVERITY_WEIGHT[meta.severity] ?? 0;
    const current = scores.get(group) ?? { maxSeverityWeight: -1, count: 0 };
    if (weight > current.maxSeverityWeight) {
      current.maxSeverityWeight = weight;
    }
    current.count += 1;
    scores.set(group, current);
  }

  if (scores.size === 0) return undefined;

  const getPriorityIndex = (group: RuleGroup): number =>
    RULE_GROUP_PRIORITY.findIndex((g) => g === group);

  let bestGroup: RuleGroup | undefined;
  let bestSeverity = -1;
  let bestCount = -1;

  for (const [group, info] of scores.entries()) {
    if (
      info.maxSeverityWeight > bestSeverity ||
      (info.maxSeverityWeight === bestSeverity &&
        (info.count > bestCount ||
          (info.count === bestCount &&
            (bestGroup == null ||
              getPriorityIndex(group) < getPriorityIndex(bestGroup)))))
    ) {
      bestGroup = group;
      bestSeverity = info.maxSeverityWeight;
      bestCount = info.count;
    }
  }

  return bestGroup;
}

function mapRuleGroupToAction(group: RuleGroup | undefined): string | undefined {
  if (!group) return undefined;
  return RULE_GROUP_ACTIONS[group];
}

function deriveMetricHint(input: ComponentSummaryInput): string | undefined {
  const tmpl = input.templateLineCount ?? 0;
  const deps = input.dependencyCount ?? 0;
  const depth = input.structuralDepth ?? 0;
  const subs = input.subscriptionCount ?? 0;
  const orch = input.serviceOrchestrationCount ?? 0;

  if (tmpl >= 150 || depth > 5) {
    return "Flatten deeply nested templates into sub-views";
  }

  if (deps >= 8) {
    return "Push orchestration into services to keep component lean";
  }

  if (subs >= 4 || orch >= 4) {
    return "Consolidate subscriptions and orchestration into fewer paths";
  }

  if (tmpl >= 80 || deps >= 4) {
    return "Extract reusable blocks into focused child components";
  }

  return undefined;
}

function appendConfidenceNote(
  action: string | undefined,
  confidence: SeverityConfidence | undefined,
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none"
): string | undefined {
  if (!action) return undefined;
  const conf = confidence ?? (anomalyFlag === "severity-missing-with-critical-rules" ? "inferred" : anomalyFlag === "metrics-missing-with-warnings" ? "low" : undefined);
  if (!conf || conf === "measured") return action;
  const note = CONFIDENCE_NOTES[conf];
  if (!note) return action;
  return `${action} ${note}`;
}

function buildSeverityFallbackSummary(input: ComponentSummaryInput): string | undefined {
  const sev: CanonicalSeverityCode | null | undefined =
    input.computedSeverity ?? input.baseSeverity;
  const warnings = input.totalWarningCount ?? 0;

  if (sev === "CRITICAL" || sev === "HIGH") {
    return "Translate strongest diagnostic signals into concrete refactors";
  }

  if (warnings > 0 || sev === "WARNING") {
    return "Schedule small cleanups to prevent future hotspot";
  }

  return undefined;
}

function isFlaggedRow(input: ComponentSummaryInput): boolean {
  const sev: CanonicalSeverityCode | null | undefined =
    input.computedSeverity ?? input.baseSeverity;
  if (sev && sev !== "LOW") return true;
  if ((input.totalWarningCount ?? 0) > 0) return true;
  return false;
}

/**
 * Components explorer summary copy examples (before/after, internal reference only):
 *
 * - Cleanup risk (dominant issue):
 *   - Before: "Check cleanup paths for subscriptions and timers."
 *   - After:  "Tighten teardown paths for subscriptions, timers, and listeners to reduce memory risk and lifecycle surprises."
 *
 * - Orchestration-heavy (dominant issue):
 *   - Before: "Extract service orchestration into dedicated services."
 *   - After:  "This component mixes orchestration and UI concerns; extract workflow logic into a dedicated service or facade."
 *
 * - Lifecycle-risky (dominant issue):
 *   - Before: "Review lifecycle hooks and ensure teardown logic is in place."
   *   - After:  "Simplify lifecycle hooks and centralize side effects so initialization and teardown stay predictable."
 *
 * - Template-heavy (dominant issue):
 *   - Before: "Move repeated template expressions into view helpers."
 *   - After:  "Reduce template branching and move repeated expressions into focused child views to make behavior easier to reason about."
 *
 * - God component (dominant issue):
 *   - Before: "Split orchestration and presentation into smaller components."
   *   - After:  "Separate orchestration, data access, and presentation into smaller components so each part has a clear responsibility."
 *
 * - Lifecycle rule-group fallback:
 *   - Before: "Check cleanup paths for subscriptions and timers."
 *   - After:  "Stabilize lifecycle behavior by consolidating subscriptions and timers behind clear teardown ownership."
 *
 * - Orchestration rule-group fallback:
 *   - Before: "Extract service orchestration into dedicated services."
   *   - After:  "Move cross-service workflow orchestration into dedicated services so the component stays focused on view concerns."
 *
 * - Combined-signal anomaly note:
 *   - Before: "Risk is inferred from rules; treat this as suspicious."
   *   - After:  "High risk is inferred from rule patterns rather than a single smell; treat this component as suspicious until you confirm the evidence."
 *
 * - Metric hint (deep templates):
 *   - Before: "Extract sub-templates; reduce structural nesting."
   *   - After:  "Flatten deeply nested templates into sub-views to reduce structural depth and make layout changes safer."
 *
 * - Severity-based fallback (warning-level rows):
 *   - Before: "Review the diagnostic findings and apply suggested low-effort fixes."
   *   - After:  "Schedule small cleanups based on these warnings to keep the component from becoming a future hotspot."
 */

/**
 * Derive a short summary line for a component from diagnostic data.
 * Used in the component explorer list for quick scanning.
 */
export function deriveComponentSummaryLine(
  input: ComponentSummaryInput
): string | undefined {
  // 1) Prefer explicit refactor direction or diagnostic label when they contain meaningful guidance.
  if (input.refactorDirection && input.refactorDirection.length > 10) {
    const trimmed = input.refactorDirection.trim();
    const maxLen = 100;
    if (trimmed.length <= maxLen) {
      return appendConfidenceNote(trimmed, input.confidence, input.anomalyFlag);
    }
    const cut = trimmed.lastIndexOf(" ", maxLen);
    const truncated =
      (cut > Math.floor(maxLen * 0.4) ? trimmed.slice(0, cut) : trimmed.slice(0, maxLen)) +
      "…";
    return appendConfidenceNote(truncated, input.confidence, input.anomalyFlag);
  }

  if (input.diagnosticLabel && input.diagnosticLabel.length > 10) {
    const trimmed = input.diagnosticLabel.trim();
    const maxLen = 100;
    if (trimmed.length <= maxLen) {
      return appendConfidenceNote(trimmed, input.confidence, input.anomalyFlag);
    }
    const cut = trimmed.lastIndexOf(" ", maxLen);
    const truncated =
      (cut > Math.floor(maxLen * 0.4) ? trimmed.slice(0, cut) : trimmed.slice(0, maxLen)) +
      "…";
    return appendConfidenceNote(truncated, input.confidence, input.anomalyFlag);
  }

  const flagged = isFlaggedRow(input);

  // 2) Deterministic dominant-issue microcopy.
  const dominantAction = mapDominantIssueToAction(input.dominantIssue ?? null);
  if (dominantAction) {
    return appendConfidenceNote(dominantAction, input.confidence, input.anomalyFlag);
  }

  // 3) Combined-signal explanation when severity is high/critical but no single dominant issue is present.
  const sev: CanonicalSeverityCode | null | undefined =
    input.computedSeverity ?? input.baseSeverity;
  const rulesCount = (input.triggeredRuleIds ?? []).length;
  const isHighOrCritical = sev === "HIGH" || sev === "CRITICAL";
  const noDominantExplicit =
    !input.dominantIssue ||
    input.dominantIssue === "NO_DOMINANT_ISSUE" ||
    input.dominantIssue === "__NO_DOMINANT_ISSUE__";

  if (noDominantExplicit && isHighOrCritical && rulesCount >= 2) {
    const t = getTranslations();
    const componentsText = t.components as Record<string, string | undefined>;
    const base =
      (rulesCount >= 4
        ? componentsText.multipleModerateIssuesElevated
        : componentsText.noSingleDominantIssue) ??
      (rulesCount >= 4
        ? "Multiple moderate issues, elevated overall risk"
        : "No single dominant issue; high risk inferred from multiple rules acting together.");
    return appendConfidenceNote(base, input.confidence, input.anomalyFlag);
  }

  // 4) Rule-group based fallback when no dominant issue is available.
  const ruleGroup = deriveRuleGroupFromRules(input.triggeredRuleIds);
  const ruleAction = mapRuleGroupToAction(ruleGroup);
  if (ruleAction) {
    return appendConfidenceNote(ruleAction, input.confidence, input.anomalyFlag);
  }

  // 5) Metric-based hints when rules are weak or absent but metrics show pressure.
  const metricHint = deriveMetricHint(input);
  if (metricHint) {
    return appendConfidenceNote(metricHint, input.confidence, input.anomalyFlag);
  }

  // 6) Final severity-based safety net: only for flagged rows, so we avoid noisy hints on healthy components.
  if (flagged) {
    const severityFallback = buildSeverityFallbackSummary(input);
    if (severityFallback) {
      return appendConfidenceNote(severityFallback, input.confidence, input.anomalyFlag);
    }
  }

  return undefined;
}

const DOMINANT_ACTION_MAX_LEN = 60;

/**
 * Derive a single-line imperative action for a component row.
 * Used for quick scanning: problem + severity + first action.
 * No anomaly note (shown in detail drawer instead).
 */
export function deriveDominantAction(input: ComponentSummaryInput): string | undefined {
  function truncate(s: string, max = DOMINANT_ACTION_MAX_LEN): string {
    const trimmed = s.trim();
    if (trimmed.length <= max) return trimmed;
    const cut = trimmed.lastIndexOf(" ", max);
    return (cut > max * 0.4 ? trimmed.slice(0, cut) : trimmed.slice(0, max)) + "…";
  }

  if (input.refactorDirection && input.refactorDirection.length > 10) {
    const first = input.refactorDirection.split(/[.;]\s+/)[0]?.trim();
    if (first && first.length > 8) return truncate(first);
  }

  if (input.diagnosticLabel && input.diagnosticLabel.length > 10) {
    const first = input.diagnosticLabel.split(/[.;]\s+/)[0]?.trim();
    if (first && first.length > 8) return truncate(first);
  }

  const dominantAction = mapDominantIssueToAction(input.dominantIssue ?? null);
  if (dominantAction) return truncate(dominantAction);

  const ruleGroup = deriveRuleGroupFromRules(input.triggeredRuleIds);
  const ruleAction = mapRuleGroupToAction(ruleGroup);
  if (ruleAction) return truncate(ruleAction);

  const metricHint = deriveMetricHint(input);
  if (metricHint) return truncate(metricHint);

  if (isFlaggedRow(input)) {
    const severityFallback = buildSeverityFallbackSummary(input);
    if (severityFallback) return truncate(severityFallback);
  }

  return undefined;
}

