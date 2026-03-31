/**
 * Shared constants for feature path inference and breakdown.
 */

/** Folders that are infrastructure/technical - group as "infrastructure" not business features */
export const INFRASTRUCTURE_FOLDERS = new Set([
  "shared",
  "common",
  "ui",
  "components",
  "layout",
  "wrappers",
  "core",
  "infra",
  "utils",
  "pipes",
  "directives",
  "guards",
  "interceptors",
  "menu-item",
]);

/** Minimum component count for a folder to be listed as a standalone feature */
export const MIN_COMPONENTS_FOR_FEATURE = 5;

/** Minimum component warnings for a group to qualify */
export const MIN_COMPONENT_WARNINGS = 3;

/** Architectural pressure: template + responsibility + lifecycle >= this qualifies */
export const MIN_ARCHITECTURAL_PRESSURE = 5;

/** Max qualified features before merging overflow into "other" (overview: 6-8 clusters) */
export const MAX_QUALIFIED_FEATURES = 6;

/** When other exceeds this: promote overflow or split. Other is "large" if > 25% of total or 15+ components */
export const LARGE_OTHER_RATIO_THRESHOLD = 0.25;
export const LARGE_OTHER_ABSOLUTE_THRESHOLD = 15;

/** Extra slots when other would be large - promote overflow clusters to reduce other size */
export const LARGE_OTHER_PROMOTE_EXTRA = 3;

/** Parent feature patterns - priority order for "other" reduction */
export const PARENT_FEATURE_PATTERNS = [
  /(?:^|\/)features?\/([^/]+)/gi,
  /(?:^|\/)pages?\/([^/]+)/gi,
  /(?:^|\/)modules?\/([^/]+)/gi,
  /(?:^|\/)admin(?:[-_]?panel)?\/([^/]+)/gi,
  /(?:^|\/)public(?:[-_]?area)?\/([^/]+)/gi,
];

/** Feature name normalization: report/reports/additionalReport -> canonical form */
export const FEATURE_NORMALIZE_ALIASES: Record<string, string> = {
  report: "reports",
  additionalreport: "reports",
  additionalReport: "reports",
  match: "matches",
  gamematch: "matches",
  newsitem: "news",
  newsItem: "news",
  authmodule: "auth",
  authModule: "auth",
  adminpanel: "admin",
  adminPanel: "admin",
  publicarea: "public",
  publicArea: "public",
  userprofile: "user-profile",
  userProfile: "user-profile",
  userdashboard: "dashboard",
  userDashboard: "dashboard",
  settings: "settings",
  dashboard: "dashboard",
  home: "home",
};

/** Very short or technical folder names - treat as "other" to avoid noisy cards */
export const NOISE_FOLDER_NAMES = new Set(["x", "util", "utils", "lib", "helpers", "misc"]);

/** User-friendly area labels for "Most affected area" display. Standardizes admin, infrastructure, public, etc. */
export const AREA_DISPLAY_ALIASES: Record<string, string> = {
  admin: "admin",
  adminpanel: "admin",
  public: "public",
  publicarea: "public",
  infrastructure: "infrastructure",
  shared: "shared",
  common: "shared",
  other: "other",
  player: "player",
  doi: "public",
};
