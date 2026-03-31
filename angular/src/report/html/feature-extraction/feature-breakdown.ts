/**
 * Feature-area breakdown aggregation for overview.
 */

import type { ComponentWithAnalyses, FeatureBreakdownItem, FeatureBreakdownResult } from "./feature-extraction-types";
import {
  INFRASTRUCTURE_FOLDERS,
  NOISE_FOLDER_NAMES,
  MIN_COMPONENTS_FOR_FEATURE,
  MIN_COMPONENT_WARNINGS,
  MIN_ARCHITECTURAL_PRESSURE,
  MAX_QUALIFIED_FEATURES,
  LARGE_OTHER_RATIO_THRESHOLD,
  LARGE_OTHER_ABSOLUTE_THRESHOLD,
  LARGE_OTHER_PROMOTE_EXTRA,
} from "./feature-extraction-constants";
import { inferFeatureFromPath, normalizeFeatureName } from "./feature-inference";

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
    const pathSegments: string[] | undefined =
      item.sourceRoot.toLowerCase() === "infrastructure"
        ? Array.from(INFRASTRUCTURE_FOLDERS.values())
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

