import { getTranslations } from "./i18n/translations";
import {
  getArchitectureSmellUserLabel,
  getFamilyNameUserLabel,
  getFeaturePatternUserLabel,
} from "../labels/internal-to-user-labels";

/** Sentinel returned when component has no dominant issue; downstream uses it for special UI treatment */
export const NO_DOMINANT_ISSUE_SENTINEL = "__NO_DOMINANT_ISSUE__";

const UNCLASSIFIED_ISSUE_LABEL = "Unclassified issue";

export function formatDominantIssue(issue: string | null): string {
  if (!issue) return NO_DOMINANT_ISSUE_SENTINEL;
  const t = getTranslations();
  const mapped = (t.issues as Record<string, string>)[issue];
  if (mapped) return mapped;
  const fallback = (t as { unclassifiedIssue?: string }).unclassifiedIssue ?? UNCLASSIFIED_ISSUE_LABEL;
  return issue.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || fallback;
}

export function isNoDominantIssue(value: string): boolean {
  return value === NO_DOMINANT_ISSUE_SENTINEL;
}

/** Format architecture smell type for user display */
export function formatSmellType(smellType: string | null | undefined): string {
  if (!smellType) return "";
  const t = getTranslations();
  const mapped = t.architectureSmells?.[smellType];
  if (mapped) return mapped;
  return getArchitectureSmellUserLabel(smellType);
}

/** Format family name (e.g. *-detail) for user display */
export function formatFamilyName(familyName: string | null | undefined): string {
  if (!familyName) return "";
  const t = getTranslations();
  const mapped = t.familyNames?.[familyName];
  if (mapped) return mapped;
  return getFamilyNameUserLabel(familyName);
}

/** Format feature pattern type for user display */
export function formatFeaturePattern(patternType: string | null | undefined): string {
  if (!patternType) return "";
  const t = getTranslations();
  const mapped = t.featurePatterns?.[patternType];
  if (mapped) return mapped;
  return getFeaturePatternUserLabel(patternType);
}

const ISSUE_EXPLANATION_FALLBACKS: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Large or complex template detected",
  GOD_COMPONENT: "Component orchestrates too many concerns",
  CLEANUP_RISK_COMPONENT: "Possible memory leaks; add proper cleanup",
  ORCHESTRATION_HEAVY_COMPONENT: "Heavy service orchestration detected",
  LIFECYCLE_RISKY_COMPONENT: "Lifecycle hook risks; review subscriptions",
};

/** Variants per issue type for less repetitive list summaries. Short, high-signal microcopy. */
const ISSUE_EXPLANATION_VARIANTS: Record<string, string[]> = {
  TEMPLATE_HEAVY_COMPONENT: [
    "Extract child blocks from large templates.",
    "Split template into smaller components.",
    "Reduce template complexity; extract reusable blocks.",
  ],
  GOD_COMPONENT: [
    "Split orchestration from presentation.",
    "Extract focused logic; reduce responsibilities.",
    "Separate presentation from orchestration.",
  ],
  CLEANUP_RISK_COMPONENT: [
    "Review teardown and subscription cleanup.",
    "Add proper cleanup for subscriptions.",
    "Ensure subscriptions and timers are disposed.",
  ],
  ORCHESTRATION_HEAVY_COMPONENT: [
    "Move service-heavy coordination into dedicated services.",
    "Extract orchestration to dedicated services.",
    "Reduce component orchestration; use services.",
  ],
  LIFECYCLE_RISKY_COMPONENT: [
    "Review subscriptions and listeners.",
    "Ensure proper lifecycle cleanup.",
    "Add teardown in ngOnDestroy.",
  ],
};

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getDominantIssueExplanation(issue: string | null, filePath?: string): string {
  if (!issue) {
    const t = getTranslations();
    return t.drawer.noDominantIssueExplanation;
  }
  const variants = ISSUE_EXPLANATION_VARIANTS[issue];
  if (variants && filePath) {
    const idx = simpleHash(filePath) % variants.length;
    return variants[idx]!;
  }
  const t = getTranslations();
  const fallbacks = (t as { issueExplanations?: Record<string, string> }).issueExplanations ?? ISSUE_EXPLANATION_FALLBACKS;
  return (
    fallbacks[issue] ??
    ISSUE_EXPLANATION_FALLBACKS[issue] ??
    "Component has diagnostic signals that could not be classified into a known category."
  );
}
