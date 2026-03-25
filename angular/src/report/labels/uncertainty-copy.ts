/**
 * Centralized uncertainty / trust-focused wording.
 * Keeps alarmist or vague language out of the UI; uses calm, professional copy.
 * Use for confidence labels, role heuristics, and anomaly/secondary metadata.
 */

import type { ConfidenceBucket } from "../../confidence/confidence-labels";

/** Confidence bucket → UI label (drawer/secondary use) */
export const UNCERTAINTY_LABELS: Record<ConfidenceBucket, string> = {
  high: "High confidence",
  medium: "Review recommended",
  low: "Derived from code signals",
  reviewNeeded: "Best-effort classification",
};

/** Role display for low/reviewNeeded buckets (trust-focused language) */
export function getRoleHeuristicDisplay(
  role: string,
  bucket: ConfidenceBucket
): string {
  if (bucket === "low" && role && role !== "unknown") {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    return `Likely ${roleLabel}`;
  }
  if (bucket === "reviewNeeded") {
    return "Role heuristic";
  }
  return "Unclear";
}

/** @deprecated Use getConfidenceLabel instead. Anomaly flag → secondary label (for drawer / Analysis notes) */
export const ANOMALY_SECONDARY_LABELS: Record<
  "severity-missing-with-critical-rules" | "metrics-missing-with-warnings" | string,
  string
> = {
  "severity-missing-with-critical-rules":
    "Elevated from combined rule signals and risk score",
  "metrics-missing-with-warnings": "Limited metric coverage—advisory interpretation",
  default: "Heuristic classification",
};

/** Confidence → secondary label (for drawer / Analysis notes). Prefer over getAnomalySecondaryLabel. */
export const CONFIDENCE_LABELS: Record<"measured" | "inferred" | "low", string> = {
  measured: "Backed by file-size and dependency metrics",
  inferred: "Elevated from combined rule signals and risk score",
  low: "Limited metric coverage—advisory interpretation",
};

export function getAnomalySecondaryLabel(
  anomalyFlag: string | undefined | null
): string | null {
  if (!anomalyFlag || anomalyFlag === "none") return null;
  return (
    ANOMALY_SECONDARY_LABELS[anomalyFlag] ??
    ANOMALY_SECONDARY_LABELS.default
  );
}

export function getConfidenceLabel(
  confidence: "measured" | "inferred" | "low" | undefined | null
): string | null {
  if (!confidence || confidence === "measured") return null;
  return CONFIDENCE_LABELS[confidence] ?? null;
}
