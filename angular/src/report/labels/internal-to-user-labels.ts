/**
 * Internal schema → user-facing label mapping layer.
 * Keeps machine identifiers (enums, family suffixes) separate from product copy.
 * Use these maps for UI, HTML report, and text formatters. Raw internal values
 * stay in backend, JSON export, and data-* attributes for filtering.
 */

/** Dominant issue (component diagnostic) → user label */
export const DOMINANT_ISSUE_TO_USER_LABEL: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Template-heavy component",
  GOD_COMPONENT: "Overloaded component",
  CLEANUP_RISK_COMPONENT: "Cleanup / memory risk",
  ORCHESTRATION_HEAVY_COMPONENT: "Heavy orchestration",
  LIFECYCLE_RISKY_COMPONENT: "Lifecycle risk",
};

/** Architecture smell type → user label */
export const ARCHITECTURE_SMELL_TO_USER_LABEL: Record<string, string> = {
  GOD_PAGE_SMELL: "Overloaded page",
  CONTAINER_EXPLOSION_SMELL: "Overloaded container",
  TEMPLATE_EXPLOSION_SMELL: "Template explosion",
  REPEATED_DETAIL_PAGE_SMELL: "Repeated detail view pattern",
  PLAYER_ORCHESTRATION_SMELL: "Player orchestration",
  FRAGMENT_MANAGEMENT_SMELL: "Fragment management",
  FORM_ORCHESTRATION_SMELL: "Form orchestration",
};

/** Family pattern (internal suffix) → user label */
export const FAMILY_NAME_TO_USER_LABEL: Record<string, string> = {
  "*-detail": "Repeated detail view pattern",
  "*-detail-fragment": "Detail fragment pattern",
  "*-fragment-player": "Media player pattern",
  "*-content-files": "Content files pattern",
  "*-manage-fragments": "Fragment management",
  "*-form": "Form pattern",
  "*-list": "List pattern",
  "*-view": "View pattern",
  "*-editor": "Editor pattern",
  "*-card": "Card pattern",
  "*-item": "Item pattern",
  "*-header": "Header pattern",
  "*-footer": "Footer pattern",
  "*-modal": "Modal pattern",
  "*-dialog": "Dialog pattern",
  "*-picker": "Picker pattern",
  "*-selector": "Selector pattern",
};

/** Structure concern type → user label */
export const STRUCTURE_CONCERN_TO_USER_LABEL: Record<string, string> = {
  "deep-nesting": "Deep nesting",
  "shared-dumping-risk": "Shared dumping risk",
  "folder-density-concern": "Folder density",
  "suspicious-placement": "Suspicious placement",
  "feature-boundary-blur": "Feature boundary blur",
  "generic-folder-overuse": "Generic folder overuse",
};

/** Feature pattern type → user label */
export const FEATURE_PATTERN_TO_USER_LABEL: Record<string, string> = {
  PLAYER_FEATURE_PATTERN: "Media player pattern",
  DETAIL_PAGE_PATTERN: "Detail page pattern",
  CONTENT_PUBLISH_PATTERN: "Content publish pattern",
  LIST_PAGE_PATTERN: "List page pattern",
  FRAGMENT_MANAGEMENT_PATTERN: "Fragment management pattern",
};

/**
 * Resolve internal identifier to user-facing label.
 * Falls back to formatted internal value if not in map.
 */
export function toUserLabel(
  internal: string | null | undefined,
  map: Record<string, string>,
  fallback?: string
): string {
  if (internal == null || internal === "") return fallback ?? "";
  const mapped = map[internal];
  if (mapped) return mapped;
  if (fallback) return fallback;
  return formatInternalAsFallback(internal);
}

/** Format internal enum (e.g. CONTAINER_EXPLOSION_SMELL) as readable fallback */
function formatInternalAsFallback(internal: string): string {
  return internal
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDominantIssueUserLabel(internal: string | null | undefined): string {
  return toUserLabel(internal, DOMINANT_ISSUE_TO_USER_LABEL);
}

export function getArchitectureSmellUserLabel(internal: string | null | undefined): string {
  return toUserLabel(internal, ARCHITECTURE_SMELL_TO_USER_LABEL);
}

export function getFamilyNameUserLabel(internal: string | null | undefined): string {
  return toUserLabel(internal, FAMILY_NAME_TO_USER_LABEL);
}

export function getStructureConcernUserLabel(internal: string | null | undefined): string {
  return toUserLabel(internal, STRUCTURE_CONCERN_TO_USER_LABEL);
}

export function getFeaturePatternUserLabel(internal: string | null | undefined): string {
  return toUserLabel(internal, FEATURE_PATTERN_TO_USER_LABEL);
}
