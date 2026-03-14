/**
 * Builds user-facing score explanations and ranking reasons.
 * Ensures explanations reflect the actual dominant factors (by contribution magnitude).
 */

import type { ScoreFactor, ExplainedScore } from "./scan-result";
import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { TemplateAnalysisResult } from "../angular/analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../angular/analyzers/responsibility/responsibility-models";
import type { DominantIssueType } from "../diagnostic/diagnostic-models";

/** Maps factor names to user-friendly explanation labels */
const FACTOR_LABELS: Record<string, string> = {
  "Severity (Critical)": "critical hotspots",
  "Severity (High)": "high-severity components",
  "Severity (Warning)": "warning density",
  "Warning Density": "high warning density",
  "Risky Subscriptions": "unmanaged subscriptions",
  "Managed Subscriptions": "managed subscriptions",
  "Missing Interval Cleanup": "missing interval cleanup",
  "Missing Listener Cleanup": "missing listener cleanup",
  "Missing Timeout Cleanup": "missing timeout cleanup",
  "Missing Renderer Listen Cleanup": "missing renderer cleanup",
  "Verified Cleanup": "verified cleanup",
  "Rule Warnings": "lifecycle rule violations",
  "Hook Count": "lifecycle hook usage",
  "ngDoCheck": "ngDoCheck usage",
  "AfterView/ContentChecked": "after-view hooks",
  "ngOnChanges Without Inputs": "ngOnChanges without inputs",
  "Warning Volume": "warning volume",
  "Template Size": "large templates",
  "Structural Directives": "structural directive complexity",
  "Event Bindings": "event binding density",
  "Structural Depth": "deep nesting",
  "Method Count": "method count",
  "Property Count": "property count",
  "Service Orchestration": "service orchestration",
};

const MAX_FACTORS_IN_EXPLANATION = 3;

/** Similar/duplicate groups - keep only the stronger/more specific label */
const SIMILAR_GROUPS: string[][] = [
  ["warning density", "high warning density"],
  ["warning volume", "high warning density"],
];

function deduplicateLabels(labels: string[]): string[] {
  let result = [...labels];
  for (const group of SIMILAR_GROUPS) {
    const inGroup = result.filter((l) =>
      group.some((x) => l.toLowerCase().includes(x) || x.includes(l.toLowerCase()))
    );
    if (inGroup.length > 1) {
      const preferred = group[group.length - 1];
      result = result.filter((l) => !inGroup.includes(l));
      result.push(preferred);
    }
  }
  const seen = new Set<string>();
  return result.filter((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Builds a short explanation from score factors, sorted by contribution magnitude.
 * Uses the top 2-3 factors that actually drive the score.
 * Deduplicates similar labels (e.g. "warning density" and "high warning density").
 */
export function buildScoreExplanation(factors: ScoreFactor[]): string | undefined {
  if (factors.length === 0) return undefined;

  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );
  const top = sorted.slice(0, MAX_FACTORS_IN_EXPLANATION * 2);
  let labels = top.map(
    (f) => FACTOR_LABELS[f.name] ?? f.name.toLowerCase()
  );
  labels = deduplicateLabels(labels).slice(0, MAX_FACTORS_IN_EXPLANATION);

  if (labels.length === 1) {
    return `Score impacted mostly by ${labels[0]}.`;
  }
  if (labels.length === 2) {
    return `Score impacted mostly by ${labels[0]} and ${labels[1]}.`;
  }
  if (labels.length >= 3) {
    return `Score impacted by ${labels[0]}, ${labels[1]} and ${labels[2]}.`;
  }
  return undefined;
}

/**
 * Enriches an ExplainedScore with a shortExplanation built from its factors.
 */
export function enrichExplainedScore(explained: ExplainedScore): ExplainedScore {
  if (explained.factors.length === 0) return explained;
  const shortExplanation = buildScoreExplanation(explained.factors);
  return { ...explained, shortExplanation };
}

/**
 * Builds a human-readable ranking reason for a problematic component.
 * Uses full sentences instead of keyword lists.
 */
export function buildRankingReason(
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined,
  dominantIssue: DominantIssueType | null
): string | undefined {
  const lineCount = component.lineCount;
  const dependencyCount = component.dependencyCount;
  const tmplLines = templateResult?.metrics?.lineCount ?? 0;
  const structuralDepth = templateResult?.metrics?.structuralDepth ?? 0;
  const eventBindings = templateResult?.metrics?.eventBindingCount ?? 0;
  const orchestration =
    responsibilityResult?.metrics?.serviceOrchestrationCount ?? 0;

  const signals: { weight: number; text: string }[] = [];

  if (dominantIssue === "CLEANUP_RISK_COMPONENT") {
    signals.push({ weight: 10, text: "Possible memory leaks; add proper cleanup." });
  }
  if (dominantIssue === "GOD_COMPONENT") {
    signals.push({ weight: 9, text: "Component orchestrates too many concerns." });
  }
  if (orchestration >= 5) {
    signals.push({ weight: 8, text: "Component orchestrates many services." });
  }
  if (dependencyCount >= 8) {
    signals.push({ weight: 7, text: "High dependency injection." });
  }
  if (lineCount >= 400) {
    signals.push({ weight: 6, text: "Large component." });
  }
  if (tmplLines >= 150 && structuralDepth >= 5) {
    signals.push({
      weight: 7,
      text: "Heavy template logic with deep structural nesting.",
    });
  } else if (tmplLines >= 150) {
    signals.push({ weight: 5, text: "Heavy template logic." });
  } else if (structuralDepth >= 5) {
    signals.push({ weight: 5, text: "Deep structural nesting in template." });
  }
  if (eventBindings >= 10) {
    signals.push({ weight: 4, text: "Many event bindings." });
  }

  if (signals.length === 0) return undefined;

  signals.sort((a, b) => b.weight - a.weight);
  const primary = signals[0].text;
  const secondary = signals[1]?.text;
  const hasLarge = primary.includes("Large component") || secondary?.includes("Large component");
  const hasDeps =
    primary.includes("High dependency") || secondary?.includes("High dependency");
  const hasTemplate =
    primary.includes("Heavy template") ||
    primary.includes("Deep structural") ||
    secondary?.includes("Heavy template") ||
    secondary?.includes("Deep structural");
  const hasOrchestration =
    primary.includes("orchestrat") || secondary?.includes("orchestrat");
  const hasGod = dominantIssue === "GOD_COMPONENT";

  if (!secondary) return primary;

  if (hasLarge && hasOrchestration) {
    return "Large component orchestrating many services.";
  }
  if (hasDeps && hasTemplate) {
    return "High dependency injection and template complexity.";
  }
  if (hasTemplate && hasGod) {
    return "Deep template nesting and multiple responsibilities.";
  }
  if (hasOrchestration && hasGod) {
    return "Component orchestrates many services with multiple responsibilities.";
  }
  if (hasLarge && hasDeps) {
    return "Large component with high dependency injection.";
  }
  if (hasLarge && hasTemplate) {
    return "Large component with heavy template logic.";
  }
  if (primary.includes("Heavy template") && hasDeps) {
    return "Heavy template logic with high dependency injection.";
  }
  if (primary.includes("Component orchestrates many") && hasDeps) {
    return "Component orchestrates many services with high dependency injection.";
  }
  if (primary.includes("Heavy template") && secondary?.includes("Deep structural")) {
    return "Heavy template logic with deep structural nesting.";
  }

  return primary;
}
