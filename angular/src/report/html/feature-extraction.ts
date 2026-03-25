/**
 * Feature extraction helpers for Hot Feature Clusters and adaptive breakdown modes.
 * Infers feature area from file path; supports impact-aware grouping and normalization.
 */

import type { CanonicalSeverityCode } from "./html-report-presenter";
import type { SeverityConfidence } from "../severity/severity-resolver";
import { getTranslations } from "./i18n/translations";
import {
  RULES_REGISTRY,
  type RuleCategory,
  type RuleSeverity,
  type RuleMetadata,
} from "../../rules/rule-registry";

export interface FeatureBreakdownItem {
  sourceRoot: string;
  components: number;
  componentsWithFindings: number;
  /** Sum of component issues in this cluster. Used for total findings. */
  componentFindings?: number;
  lifecycleTargets: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
  /** For merged groups (e.g. infrastructure): path segments for getProjectForPath matching */
  pathSegments?: string[];
}

export interface ComponentWithAnalyses {
  filePath: string;
  componentFindings: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
}

/** Folders that are infrastructure/technical - group as "infrastructure" not business features */
const INFRASTRUCTURE_FOLDERS = new Set([
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
const MIN_COMPONENTS_FOR_FEATURE = 5;

/** Minimum component warnings for a group to qualify */
const MIN_COMPONENT_WARNINGS = 3;

/** Architectural pressure: template + responsibility + lifecycle >= this qualifies */
const MIN_ARCHITECTURAL_PRESSURE = 5;

/** Max qualified features before merging overflow into "other" (overview: 6-8 clusters) */
const MAX_QUALIFIED_FEATURES = 6;

/** When other exceeds this: promote overflow or split. Other is "large" if > 25% of total or 15+ components */
const LARGE_OTHER_RATIO_THRESHOLD = 0.25;
const LARGE_OTHER_ABSOLUTE_THRESHOLD = 15;

/** Extra slots when other would be large - promote overflow clusters to reduce other size */
const LARGE_OTHER_PROMOTE_EXTRA = 3;

/** Parent feature patterns - priority order for "other" reduction */
const PARENT_FEATURE_PATTERNS = [
  /(?:^|\/)features?\/([^/]+)/gi,
  /(?:^|\/)pages?\/([^/]+)/gi,
  /(?:^|\/)modules?\/([^/]+)/gi,
  /(?:^|\/)admin(?:[-_]?panel)?\/([^/]+)/gi,
  /(?:^|\/)public(?:[-_]?area)?\/([^/]+)/gi,
];

/** Feature name normalization: report/reports/additionalReport -> canonical form */
const FEATURE_NORMALIZE_ALIASES: Record<string, string> = {
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
const NOISE_FOLDER_NAMES = new Set(["x", "util", "utils", "lib", "helpers", "misc"]);

/** User-friendly area labels for "Most affected area" display. Standardizes admin, infrastructure, public, etc. */
const AREA_DISPLAY_ALIASES: Record<string, string> = {
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

/**
 * Format raw area/project value for display in Patterns. Returns short user-friendly label.
 * Use everywhere "Most affected area" is shown for consistency.
 */
export function formatAreaLabelForDisplay(rawArea: string | null | undefined): string {
  if (!rawArea || rawArea === "—") return "—";
  const normalized = rawArea.replace(/\\/g, "/").toLowerCase().trim();
  if (!normalized) return "—";
  const alias = AREA_DISPLAY_ALIASES[normalized];
  if (alias) return alias;
  if (INFRASTRUCTURE_FOLDERS.has(normalized)) return "infrastructure";
  if (normalized.includes("/")) {
    const appsMatch = normalized.match(/(?:^|\/)apps?\/([^/]+)/i);
    if (appsMatch) {
      const name = (appsMatch[1] ?? "app").toLowerCase();
      return AREA_DISPLAY_ALIASES[name] ?? name.replace(/-/g, " ");
    }
    const libsMatch = normalized.match(/(?:^|\/)libs\/([^/]+)/i);
    if (libsMatch) {
      const name = (libsMatch[1] ?? "lib").toLowerCase();
      return AREA_DISPLAY_ALIASES[name] ?? name.replace(/-/g, " ");
    }
    const segments = normalized.split("/").filter((s) => s && !["src", "app", "lib", "dist", "projects"].includes(s.toLowerCase()));
    const candidate = segments[segments.length - 1] ?? segments[0];
    if (candidate && !candidate.includes(".") && candidate.length <= 20) {
      const lower = candidate.toLowerCase();
      return AREA_DISPLAY_ALIASES[lower] ?? FEATURE_NORMALIZE_ALIASES[lower] ?? candidate.replace(/-/g, " ");
    }
  }
  return rawArea.length <= 20 ? rawArea.replace(/-/g, " ") : rawArea.slice(0, 18).replace(/-/g, " ") + "…";
}

export function normalizeFeatureName(name: string): string {
  const lower = name.toLowerCase();
  return FEATURE_NORMALIZE_ALIASES[lower] ?? FEATURE_NORMALIZE_ALIASES[name] ?? name;
}

function getTotalFindings(item: {
  componentFindingsSum?: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
}): number {
  return (
    (item.componentFindingsSum ?? 0) +
    item.lifecycleFindings +
    item.templateFindings +
    item.responsibilityFindings
  );
}

/**
 * Split unclassified components by path prefix (segment after app/ or src/) into sub-clusters.
 * Used when "other" is large to reduce the bucket size.
 */
function splitUnclassifiedByPathPrefix(
  unclassified: ComponentWithAnalyses[]
): FeatureBreakdownItem[] {
  const byPrefix = new Map<string, ComponentWithAnalyses[]>();
  for (const c of unclassified) {
    const norm = c.filePath.replace(/\\/g, "/");
    const appIdx = norm.indexOf("app/");
    const srcIdx = norm.indexOf("src/");
    const searchFrom = appIdx >= 0 ? appIdx + 4 : srcIdx >= 0 ? srcIdx + 4 : 0;
    const after = norm.slice(searchFrom);
    const firstSeg = after.split("/")[0] ?? "root";
    const key = firstSeg.toLowerCase();
    if (!INFRASTRUCTURE_FOLDERS.has(key) && !NOISE_FOLDER_NAMES.has(key)) {
      const list = byPrefix.get(key) ?? [];
      list.push(c);
      byPrefix.set(key, list);
    }
  }
  return Array.from(byPrefix.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([prefix, items]) => {
      const componentsWithFindings = items.filter((i) => i.componentFindings > 0).length;
      const componentFindings = items.reduce((s, i) => s + i.componentFindings, 0);
      return {
        sourceRoot: prefix,
        components: items.length,
        componentsWithFindings,
        componentFindings,
        lifecycleTargets: items.length,
        lifecycleFindings: items.reduce((s, i) => s + i.lifecycleFindings, 0),
        templateFindings: items.reduce((s, i) => s + i.templateFindings, 0),
        responsibilityFindings: items.reduce((s, i) => s + i.responsibilityFindings, 0),
      };
    });
}

export interface FeatureBreakdownResult {
  items: FeatureBreakdownItem[];
  otherMinorClusters?: FeatureBreakdownItem[];
}

/**
 * Group components by inferred feature and produce breakdown items.
 * Uses visibility thresholds: componentCount>=5, componentsWithFindings>=3,
 * architectural pressure>=5, or contains top problematic component.
 * Infrastructure folders merge into "infrastructure". Max 6 qualified + 1 other.
 */
export function getFeatureBreakdownItems(
  components: ComponentWithAnalyses[],
  topProblematicPaths?: string[]
): FeatureBreakdownResult {
  const topSet = topProblematicPaths
    ? new Set(topProblematicPaths.map((p) => p.replace(/\\/g, "/")))
    : null;

  const byRawFeature = new Map<string, ComponentWithAnalyses[]>();
  for (const c of components) {
    const feature = inferFeatureFromPath(c.filePath) ?? "other";
    const list = byRawFeature.get(feature) ?? [];
    list.push(c);
    byRawFeature.set(feature, list);
  }

  const rawItems = Array.from(byRawFeature.entries()).map(([feature, items]) => {
    const componentsWithFindings = items.filter((i) => i.componentFindings > 0).length;
    const componentFindingsSum = items.reduce((s, i) => s + i.componentFindings, 0);
    const lifecycleFindings = items.reduce((s, i) => s + i.lifecycleFindings, 0);
    const templateFindings = items.reduce((s, i) => s + i.templateFindings, 0);
    const responsibilityFindings = items.reduce(
      (s, i) => s + i.responsibilityFindings,
      0
    );
    const totalFindings =
      componentFindingsSum + lifecycleFindings + templateFindings + responsibilityFindings;
    const filePaths = items.map((i) => i.filePath.replace(/\\/g, "/"));
    const hasTopProblematic =
      topSet && filePaths.some((fp) => topSet.has(fp));
    const archPressure = templateFindings + responsibilityFindings + lifecycleFindings;
    return {
      sourceRoot: feature,
      components: items.length,
      componentsWithFindings,
      componentFindingsSum,
      lifecycleTargets: items.length,
      lifecycleFindings,
      templateFindings,
      responsibilityFindings,
      totalFindings,
      warningDensity: items.length > 0 ? totalFindings / items.length : 0,
      filePaths,
      hasTopProblematic: !!hasTopProblematic,
      archPressure,
    };
  });

  const other = rawItems.find((x) => x.sourceRoot === "other");
  const businessFeatures = rawItems.filter(
    (x) =>
      x.sourceRoot !== "other" &&
      !INFRASTRUCTURE_FOLDERS.has(x.sourceRoot.toLowerCase())
  );

  const byNormalized = new Map<string, typeof rawItems>();
  for (const item of businessFeatures) {
    const norm = normalizeFeatureName(item.sourceRoot);
    const list = byNormalized.get(norm) ?? [];
    list.push(item);
    byNormalized.set(norm, list);
  }

  const mergedBusiness = Array.from(byNormalized.entries()).map(
    ([norm, items]) => {
      const first = items[0]!;
      if (items.length === 1) {
        return {
          ...first,
          sourceRoot: norm,
          filePaths: first.filePaths ?? [],
          hasTopProblematic: first.hasTopProblematic ?? false,
          archPressure: first.archPressure ?? 0,
        };
      }
      return {
        sourceRoot: norm,
        components: items.reduce((s, x) => s + x.components, 0),
        componentsWithFindings: items.reduce((s, x) => s + x.componentsWithFindings, 0),
        componentFindingsSum: items.reduce((s, x) => s + (x.componentFindingsSum ?? 0), 0),
        lifecycleTargets: items.reduce((s, x) => s + x.lifecycleTargets, 0),
        lifecycleFindings: items.reduce((s, x) => s + x.lifecycleFindings, 0),
        templateFindings: items.reduce((s, x) => s + x.templateFindings, 0),
        responsibilityFindings: items.reduce(
          (s, x) => s + x.responsibilityFindings,
          0
        ),
        filePaths: items.flatMap((x) => x.filePaths ?? []),
        hasTopProblematic: items.some((x) => x.hasTopProblematic),
        archPressure: items.reduce((s, x) => s + (x.archPressure ?? 0), 0),
      };
    }
  );

  const meetsVisibilityThreshold = (
    item: {
      components: number;
      componentsWithFindings: number;
      lifecycleFindings: number;
      templateFindings: number;
      responsibilityFindings: number;
      hasTopProblematic?: boolean;
      archPressure?: number;
    }
  ) => {
    return (
      item.components >= MIN_COMPONENTS_FOR_FEATURE ||
      item.componentsWithFindings >= MIN_COMPONENT_WARNINGS ||
      (item.archPressure ?? 0) >= MIN_ARCHITECTURAL_PRESSURE ||
      item.hasTopProblematic === true
    );
  };

  const qualifiedFeatures = mergedBusiness.filter((x) =>
    meetsVisibilityThreshold(x)
  );
  const smallFeatures = mergedBusiness.filter(
    (x) => !meetsVisibilityThreshold(x)
  );

  const otherComponents = other?.components ?? 0;
  const smallComponentCount = smallFeatures.reduce((s, x) => s + x.components, 0);
  const totalComponents = components.length;

  const byImpact = [...qualifiedFeatures].sort((a, b) => {
    const aTotal = getTotalFindings(a);
    const bTotal = getTotalFindings(b);
    if (bTotal !== aTotal) return bTotal - aTotal;
    return b.componentsWithFindings - a.componentsWithFindings;
  });

  let maxQualified = MAX_QUALIFIED_FEATURES;
  let overflowIntoOther: typeof qualifiedFeatures = [];
  let topQualified = qualifiedFeatures;

  if (qualifiedFeatures.length > MAX_QUALIFIED_FEATURES) {
    overflowIntoOther = byImpact.slice(MAX_QUALIFIED_FEATURES);
    const tentativeOtherSize =
      otherComponents +
      smallComponentCount +
      overflowIntoOther.reduce((s, x) => s + x.components, 0);
    const isLargeOther =
      tentativeOtherSize >= LARGE_OTHER_ABSOLUTE_THRESHOLD ||
      (totalComponents > 0 && tentativeOtherSize / totalComponents > LARGE_OTHER_RATIO_THRESHOLD);

    if (isLargeOther && qualifiedFeatures.length >= MAX_QUALIFIED_FEATURES + LARGE_OTHER_PROMOTE_EXTRA) {
      maxQualified = MAX_QUALIFIED_FEATURES + LARGE_OTHER_PROMOTE_EXTRA;
    }
    topQualified = byImpact.slice(0, maxQualified);
    overflowIntoOther = byImpact.slice(maxQualified);
  }

  let mergedOther = {
    sourceRoot: "other",
    components:
      otherComponents +
      smallComponentCount +
      overflowIntoOther.reduce((s, x) => s + x.components, 0),
    componentsWithFindings:
      (other?.componentsWithFindings ?? 0) +
      smallFeatures.reduce((s, x) => s + x.componentsWithFindings, 0) +
      overflowIntoOther.reduce((s, x) => s + x.componentsWithFindings, 0),
    componentFindingsSum:
      (other?.componentFindingsSum ?? 0) +
      smallFeatures.reduce((s, x) => s + (x.componentFindingsSum ?? 0), 0) +
      overflowIntoOther.reduce((s, x) => s + (x.componentFindingsSum ?? 0), 0),
    lifecycleTargets:
      otherComponents +
      smallComponentCount +
      overflowIntoOther.reduce((s, x) => s + x.components, 0),
    lifecycleFindings:
      (other?.lifecycleFindings ?? 0) +
      smallFeatures.reduce((s, x) => s + x.lifecycleFindings, 0) +
      overflowIntoOther.reduce((s, x) => s + x.lifecycleFindings, 0),
    templateFindings:
      (other?.templateFindings ?? 0) +
      smallFeatures.reduce((s, x) => s + x.templateFindings, 0) +
      overflowIntoOther.reduce((s, x) => s + x.templateFindings, 0),
    responsibilityFindings:
      (other?.responsibilityFindings ?? 0) +
      smallFeatures.reduce((s, x) => s + x.responsibilityFindings, 0) +
      overflowIntoOther.reduce((s, x) => s + x.responsibilityFindings, 0),
  };

  const unclassifiedComponents = byRawFeature.get("other") ?? [];
  const isStillLargeOther =
    mergedOther.components >= LARGE_OTHER_ABSOLUTE_THRESHOLD ||
    (totalComponents > 0 && mergedOther.components / totalComponents > LARGE_OTHER_RATIO_THRESHOLD);

  let pathSubclusters: FeatureBreakdownItem[] = [];
  let remainingOtherComponents = otherComponents;
  let remainingOtherFindings = other?.componentsWithFindings ?? 0;
  let remainingOtherComponentFindings = other?.componentFindingsSum ?? 0;
  let remainingOtherLifecycle = other?.lifecycleFindings ?? 0;
  let remainingOtherTemplate = other?.templateFindings ?? 0;
  let remainingOtherResponsibility = other?.responsibilityFindings ?? 0;

  if (isStillLargeOther && unclassifiedComponents.length >= 4) {
    pathSubclusters = splitUnclassifiedByPathPrefix(unclassifiedComponents);
    if (pathSubclusters.length > 0) {
      const promotedCount = pathSubclusters.reduce((s, x) => s + x.components, 0);
      remainingOtherComponents = otherComponents - promotedCount;
      remainingOtherFindings =
        (other?.componentsWithFindings ?? 0) -
        pathSubclusters.reduce((s, x) => s + x.componentsWithFindings, 0);
      remainingOtherComponentFindings =
        (other?.componentFindingsSum ?? 0) -
        pathSubclusters.reduce((s, x) => s + (x.componentFindings ?? 0), 0);
      remainingOtherLifecycle =
        (other?.lifecycleFindings ?? 0) -
        pathSubclusters.reduce((s, x) => s + x.lifecycleFindings, 0);
      remainingOtherTemplate =
        (other?.templateFindings ?? 0) -
        pathSubclusters.reduce((s, x) => s + x.templateFindings, 0);
      remainingOtherResponsibility =
        (other?.responsibilityFindings ?? 0) -
        pathSubclusters.reduce((s, x) => s + x.responsibilityFindings, 0);

      mergedOther = {
        sourceRoot: "other",
        components:
          Math.max(0, remainingOtherComponents) +
          smallComponentCount +
          overflowIntoOther.reduce((s, x) => s + x.components, 0),
        componentsWithFindings:
          Math.max(0, remainingOtherFindings) +
          smallFeatures.reduce((s, x) => s + x.componentsWithFindings, 0) +
          overflowIntoOther.reduce((s, x) => s + x.componentsWithFindings, 0),
        componentFindingsSum:
          (other?.componentFindingsSum ?? 0) -
          pathSubclusters.reduce((s, x) => s + (x.componentFindings ?? 0), 0) +
          smallFeatures.reduce((s, x) => s + (x.componentFindingsSum ?? 0), 0) +
          overflowIntoOther.reduce((s, x) => s + (x.componentFindingsSum ?? 0), 0),
        lifecycleTargets:
          Math.max(0, remainingOtherComponents) +
          smallComponentCount +
          overflowIntoOther.reduce((s, x) => s + x.components, 0),
        lifecycleFindings:
          Math.max(0, remainingOtherLifecycle) +
          smallFeatures.reduce((s, x) => s + x.lifecycleFindings, 0) +
          overflowIntoOther.reduce((s, x) => s + x.lifecycleFindings, 0),
        templateFindings:
          Math.max(0, remainingOtherTemplate) +
          smallFeatures.reduce((s, x) => s + x.templateFindings, 0) +
          overflowIntoOther.reduce((s, x) => s + x.templateFindings, 0),
        responsibilityFindings:
          Math.max(0, remainingOtherResponsibility) +
          smallFeatures.reduce((s, x) => s + x.responsibilityFindings, 0) +
          overflowIntoOther.reduce((s, x) => s + x.responsibilityFindings, 0),
      };
    }
  }

  const itemsToSort = [...topQualified, ...pathSubclusters];
  if (mergedOther.components > 0) {
    itemsToSort.push(mergedOther as (typeof topQualified)[0]);
  }
  const sortedItems = itemsToSort.sort((a, b) => {
    const aTotal = getTotalFindings(a);
    const bTotal = getTotalFindings(b);
    return bTotal - aTotal;
  });

  const result: FeatureBreakdownItem[] = sortedItems.map((item) => {
    const pathSegments =
      item.sourceRoot.toLowerCase() === "infrastructure"
        ? Array.from(INFRASTRUCTURE_FOLDERS)
        : undefined;
    const raw = item as { componentFindingsSum?: number; componentFindings?: number };
    return {
      sourceRoot: item.sourceRoot,
      components: item.components,
      componentsWithFindings: item.componentsWithFindings,
      componentFindings: raw.componentFindings ?? raw.componentFindingsSum ?? 0,
      lifecycleTargets: item.lifecycleTargets,
      lifecycleFindings: item.lifecycleFindings,
      templateFindings: item.templateFindings,
      responsibilityFindings: item.responsibilityFindings,
      pathSegments,
    };
  });

  const toBreakdownItem = (
    x: { sourceRoot: string; components: number; componentsWithFindings: number; componentFindingsSum?: number; lifecycleTargets: number; lifecycleFindings: number; templateFindings: number; responsibilityFindings: number }
  ): FeatureBreakdownItem => ({
    sourceRoot: x.sourceRoot,
    components: x.components,
    componentsWithFindings: x.componentsWithFindings,
    componentFindings: x.componentFindingsSum ?? 0,
    lifecycleTargets: x.lifecycleTargets,
    lifecycleFindings: x.lifecycleFindings,
    templateFindings: x.templateFindings,
    responsibilityFindings: x.responsibilityFindings,
  });

  const effectiveUnclassifiedCount =
    pathSubclusters.length > 0 ? remainingOtherComponents : otherComponents;
  const minorClusters: FeatureBreakdownItem[] = [
    ...smallFeatures.map(toBreakdownItem),
    ...overflowIntoOther.map(toBreakdownItem),
  ];
  if (effectiveUnclassifiedCount > 0) {
    minorClusters.push({
      sourceRoot: "unclassified",
      components: effectiveUnclassifiedCount,
      componentsWithFindings:
        pathSubclusters.length > 0 ? remainingOtherFindings : (other?.componentsWithFindings ?? 0),
      componentFindings:
        pathSubclusters.length > 0 ? remainingOtherComponentFindings : (other?.componentFindingsSum ?? 0),
      lifecycleTargets: effectiveUnclassifiedCount,
      lifecycleFindings:
        pathSubclusters.length > 0 ? remainingOtherLifecycle : (other?.lifecycleFindings ?? 0),
      templateFindings:
        pathSubclusters.length > 0 ? remainingOtherTemplate : (other?.templateFindings ?? 0),
      responsibilityFindings:
        pathSubclusters.length > 0
          ? remainingOtherResponsibility
          : (other?.responsibilityFindings ?? 0),
    });
  }
  const otherMinorClusters =
    minorClusters.length > 0
      ? minorClusters.sort((a, b) => b.components - a.components)
      : undefined;

  return { items: result, otherMinorClusters };
}

/**
 * Infer a feature label from a file path.
 * Priority: features? > pages? > modules? > app (excluding infrastructure).
 * Paths under shared/common/ui/etc. return "infrastructure".
 * app.component.ts never treated as feature.
 */
export function inferFeatureFromPath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] ?? "";

  if (fileName === "app.component.ts") {
    return null;
  }

  const libsMatch = normalized.match(/(?:^|\/)libs\/([^/]+)/i);
  if (libsMatch) {
    const name = libsMatch[1] ?? "";
    if (name && !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) return name;
  }

  const appsMatch = normalized.match(/(?:^|\/)apps\/([^/]+)/i);
  if (appsMatch) {
    const name = appsMatch[1] ?? "";
    if (name && !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) return name;
  }

  if (/\/(?:admin|admin-panel|adminpanel)(?:\/|$)/i.test(normalized)) return "admin";
  if (/\/(?:public|public-area|publicarea)(?:\/|$)/i.test(normalized)) return "public";

  const featurePatterns = [
    /(?:^|\/)features?\/([^/]+)/i,
    /(?:^|\/)pages?\/([^/]+)/i,
    /(?:^|\/)modules?\/([^/]+)/i,
    /(?:^|\/)views?\/([^/]+)/i,
    /(?:^|\/)containers?\/([^/]+)/i,
  ];

  for (const pattern of featurePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const name = match[1] ?? "";
      if (
        name &&
        !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase()) &&
        !NOISE_FOLDER_NAMES.has(name.toLowerCase())
      ) {
        return name;
      }
    }
  }

  const appMatch = normalized.match(/(?:^|\/)app\/([^/]+)/i);
  if (appMatch) {
    const name = appMatch[1];
    if (name) {
      if (INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) {
        return "infrastructure";
      }
      if (NOISE_FOLDER_NAMES.has(name.toLowerCase())) {
        return null;
      }
      return name;
    }
  }

  const componentIdx = segments.findIndex((s) => s.endsWith(".component.ts"));
  if (componentIdx > 0) {
    const parent = segments[componentIdx - 1];
    if (
      parent &&
      !parent.includes(".") &&
      !INFRASTRUCTURE_FOLDERS.has(parent.toLowerCase()) &&
      !NOISE_FOLDER_NAMES.has(parent.toLowerCase())
    ) {
      return parent;
    }
  }

  const parentFeature = inferParentFeatureFromPath(normalized);
  if (parentFeature) return parentFeature;

  return null;
}

/**
 * When direct inference returns null, scan path for features?/X, pages?/X, modules?/X
 * and return the deepest non-infrastructure X. Reduces "other" by assigning to parent feature.
 */
function inferParentFeatureFromPath(normalized: string): string | null {
  let best: { name: string; priority: number; index: number } | null = null;
  for (let p = 0; p < PARENT_FEATURE_PATTERNS.length; p++) {
    const pattern = new RegExp(PARENT_FEATURE_PATTERNS[p].source, "gi");
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(normalized)) !== null) {
      const name = m[1] ?? "";
      if (
        name &&
        !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase()) &&
        !NOISE_FOLDER_NAMES.has(name.toLowerCase())
      ) {
        if (
          !best ||
          m.index > best.index ||
          (m.index === best.index && p < best.priority)
        ) {
          best = { name, priority: p, index: m.index };
        }
      }
    }
  }
  return best?.name ?? null;
}

/**
 * Infer feature from component class name (e.g. AdminDashboardComponent -> admin-dashboard).
 */
export function inferFeatureFromClassName(className: string): string | null {
  if (!className) return null;
  const base = className
    .replace(/Component$/, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return base || null;
}

type RuleGroup =
  | "template"
  | "lifecycle"
  | "responsibility"
  | "complexity"
  | "orchestration"
  | "generic";

export interface ComponentSummaryInput {
  refactorDirection?: string;
  diagnosticLabel?: string;
  dominantIssue?: string | null;
  templateLineCount?: number;
  dependencyCount?: number;
  structuralDepth?: number;
  filePath?: string;
  subscriptionCount?: number;
  serviceOrchestrationCount?: number;
  triggeredRuleIds?: string[];
  computedSeverity?: CanonicalSeverityCode;
  baseSeverity?: CanonicalSeverityCode | null;
  totalWarningCount?: number;
  /** measured | inferred | low. Prefer over anomalyFlag. */
  confidence?: SeverityConfidence;
  /** @deprecated Use confidence instead. */
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
  anomalyReasons?: string[];
}

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
