import type { ConfidenceBucket } from "./confidence-labels";

export type ConfidenceCopyDomain =
  | "inferred-role"
  | "extraction-candidate"
  | "family-grouping"
  | "structure-concern"
  | "suggested-refactor"
  | "cross-cutting-risk";

/** Base keys for copy lookup: extraction, ownership, structural-issue, refactor */
export type ConfidenceCopyBaseKey =
  | "extraction"
  | "ownership"
  | "structural-issue"
  | "refactor"
  | "family"
  | "structure";

/** Translation structure for confidence-aware copy */
export interface ConfidenceCopyTranslations {
  extraction?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  ownership?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  structural?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  refactor?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  family?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  structure?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  /** Section headers: whatToExtract, considerExtracting, possibleExtractions, inspectFirst */
  extractionHeader?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
  refactorHeader?: { high?: string; medium?: string; low?: string; reviewNeeded?: string };
}

const DEFAULT_COPY: Record<ConfidenceCopyBaseKey, Record<ConfidenceBucket, string>> = {
  extraction: {
    high: "Strong candidate for extraction",
    medium: "Potential extraction opportunity",
    low: "Possible pattern candidate",
    reviewNeeded: "Limited signals; review context before acting",
  },
  ownership: {
    high: "High-confidence ownership mismatch",
    medium: "Likely shared pattern; verify architectural intent",
    low: "Possible ownership blur",
    reviewNeeded: "Needs verification",
  },
  "structural-issue": {
    high: "Likely structural issue",
    medium: "Candidate for review",
    low: "Naming or structure suggests similarity; review context before acting",
    reviewNeeded: "Limited signals",
  },
  refactor: {
    high: "Extract this",
    medium: "Consider extracting",
    low: "Review before extracting",
    reviewNeeded: "Inspect first",
  },
  family: {
    high: "Shared architecture across components suggests extraction opportunity. Fixing one pattern improves multiple components.",
    medium: "Likely shared pattern across components. Verify before refactoring.",
    low: "Naming or structure suggests similarity; review context before acting.",
    reviewNeeded: "Limited signals; verify context before acting.",
  },
  structure: {
    high: "Likely structural issue",
    medium: "Candidate for review",
    low: "Naming or structure suggests similarity; review context before acting",
    reviewNeeded: "Limited signals",
  },
};

/**
 * Returns true when confidence is low or reviewNeeded.
 * Use to gate direct-action language in favor of review-first tone.
 */
export function shouldUseSoftLanguage(bucket: ConfidenceBucket): boolean {
  return bucket === "low" || bucket === "reviewNeeded";
}

/**
 * Returns confidence-aware copy for a given domain and base key.
 * Uses translations when provided; falls back to English defaults.
 */
export function getConfidenceAwareCopy(
  domain: ConfidenceCopyDomain,
  bucket: ConfidenceBucket,
  baseKey: ConfidenceCopyBaseKey,
  t?: ConfidenceCopyTranslations
): string {
  const mapKey = baseKey === "structural-issue" ? "structural" : baseKey;
  const fromT = t?.[mapKey as keyof ConfidenceCopyTranslations] as
    | Record<ConfidenceBucket, string>
    | undefined;
  if (fromT?.[bucket]) return fromT[bucket];

  const defaults = DEFAULT_COPY[baseKey];
  return defaults[bucket] ?? defaults.medium;
}

/**
 * Returns the extraction section header based on confidence.
 * High: "What to extract", Medium: "Consider extracting", Low/Review: "Possible extraction candidates" / "Inspect first"
 */
export function getExtractionHeaderCopy(
  bucket: ConfidenceBucket,
  t?: ConfidenceCopyTranslations
): string {
  const fromT = t?.extractionHeader;
  if (fromT?.[bucket]) return fromT[bucket];
  const defaults: Record<ConfidenceBucket, string> = {
    high: "What to extract",
    medium: "Consider extracting",
    low: "Possible extraction candidates",
    reviewNeeded: "Inspect first",
  };
  return defaults[bucket];
}

/**
 * Returns the refactor section header based on confidence.
 * High: "Suggested refactor", Medium: "Consider refactoring", Low/Review: softer variants
 */
export function getRefactorHeaderCopy(
  bucket: ConfidenceBucket,
  t?: ConfidenceCopyTranslations
): string {
  const fromT = t?.refactorHeader;
  if (fromT?.[bucket]) return fromT[bucket];
  const defaults: Record<ConfidenceBucket, string> = {
    high: "Suggested refactor",
    medium: "Consider refactoring",
    low: "Possible refactor candidates",
    reviewNeeded: "Review before refactoring",
  };
  return defaults[bucket];
}
