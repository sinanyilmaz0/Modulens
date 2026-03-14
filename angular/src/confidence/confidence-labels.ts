import { UNCERTAINTY_LABELS } from "../report/labels/uncertainty-copy";

export type ConfidenceLabel = "weak" | "moderate" | "strong" | "very strong";

/**
 * Normalized confidence bucket for consistent UI and copy across the app.
 * - high: >= 0.7 numeric, or categorical "high"
 * - medium: 0.4-0.69 numeric, or categorical "medium"
 * - low: 0.2-0.39 numeric, or categorical "low"
 * - reviewNeeded: < 0.2 numeric only (categorical has no equivalent)
 */
export type ConfidenceBucket = "high" | "medium" | "low" | "reviewNeeded";

export type CategoricalConfidence = "low" | "medium" | "high";

/**
 * Maps a numeric confidence score (0-1) to a ConfidenceBucket.
 * Thresholds: >= 0.7 high, 0.4-0.69 medium, 0.2-0.39 low, < 0.2 reviewNeeded
 */
export function getConfidenceBucket(score: number): ConfidenceBucket {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  if (score >= 0.2) return "low";
  return "reviewNeeded";
}

/**
 * Maps categorical confidence to bucket. Categorical has no "reviewNeeded".
 */
export function getConfidenceBucketFromCategorical(
  cat: CategoricalConfidence
): ConfidenceBucket {
  return cat;
}

/**
 * Maps a confidence score (0-1) to an interpretable label (legacy).
 * 0.0 - 0.39 = weak
 * 0.4 - 0.64 = moderate
 * 0.65 - 0.84 = strong
 * 0.85 - 1.0 = very strong
 */
export function getConfidenceLabel(score: number): ConfidenceLabel {
  if (score < 0.4) return "weak";
  if (score < 0.65) return "moderate";
  if (score < 0.85) return "strong";
  return "very strong";
}

export type RoleDisplayLevel = "definite" | "likely" | "muted";

/** Translation keys for confidence display labels */
export interface ConfidenceLabelTranslations {
  high?: string;
  medium?: string;
  low?: string;
  reviewNeeded?: string;
}

/**
 * Returns the display label for a confidence bucket.
 * Uses translations when provided; falls back to trust-focused defaults.
 */
export function getConfidenceDisplayLabel(
  bucket: ConfidenceBucket,
  t?: ConfidenceLabelTranslations
): string {
  if (t) {
    const label = t[bucket];
    if (label) return label;
  }
  return UNCERTAINTY_LABELS[bucket];
}

/**
 * Role display with confidence qualifier for UX.
 * Uses bucket-based thresholds for consistent tone:
 * - high (>= 0.7): definite (e.g. "Page", "Container")
 * - medium (0.4-0.69): likely (e.g. "Likely Page", "Likely Container")
 * - low (0.2-0.39): possible (e.g. "Possible page-like component")
 * - reviewNeeded (< 0.2) or null: "Unclear"
 */
export function getRoleDisplayWithConfidence(
  role: string,
  confidence: number | undefined
): { display: string; level: RoleDisplayLevel; isSecondary: boolean } {
  // No clear role or no numeric confidence → treat as low-visibility hint.
  if (!role || role === "unknown" || confidence == null) {
    return {
      display: "Role unclear",
      level: "muted",
      isSecondary: true,
    };
  }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const bucket = getConfidenceBucket(confidence);

  if (bucket === "high") {
    // High-confidence: definitive, short role label.
    return { display: roleLabel, level: "definite", isSecondary: false };
  }

  if (bucket === "medium") {
    // Medium-confidence: explicitly marked as likely, but still primary.
    return { display: `Likely ${roleLabel}`, level: "likely", isSecondary: false };
  }

  if (bucket === "low") {
    return {
      display: `Likely ${roleLabel}`,
      level: "muted",
      isSecondary: true,
    };
  }

  return {
    display: "Role heuristic",
    level: "muted",
    isSecondary: true,
  };
}
