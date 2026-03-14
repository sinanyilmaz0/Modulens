import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import type {
  StructureConcern,
  StructureConcernConfidence,
  StructureConcernType,
  StructureAnalysisResult,
  AffectedAreaWithCount,
  StructureConcernImpact,
  RefactorEffortEstimate,
  SuspiciousPlacementDetail,
  RefactorOption,
} from "./structure-models";
import { inferFeatureFromPath, inferFeatureFromClassName, normalizeFeatureName } from "../report/html/feature-extraction";
import { validateStructureConcern } from "./structure-concern-validation";

const GENERIC_FOLDER_NAMES = new Set([
  "shared",
  "common",
  "ui",
  "components",
  "layout",
  "core",
  "utils",
  "helpers",
  "pipes",
  "directives",
]);

const SHARED_DUMPING_FOLDERS = new Set(["shared", "common", "ui", "components"]);

const FEATURE_BOUNDARY_PAIRS = [
  ["admin", "public"],
  ["private", "public"],
  ["internal", "external"],
  ["backend", "frontend"],
];

const FEATURE_SPECIFIC_ROLES = new Set(["page", "detail", "list", "editor", "container"]);
const PAGE_LIKE_ROLES = new Set(["page", "container"]);

/** Legitimate shared UI - exclude from Suspicious Placement and often from Generic Folder Overuse */
const LEGITIMATE_SHARED_UI_NAMES = new Set([
  "topbar",
  "top-bar",
  "footer",
  "header",
  "dropdown",
  "modal",
  "dialog",
  "picker",
  "selector",
  "input",
  "button",
  "card",
  "chip",
  "badge",
  "spinner",
  "loader",
  "tooltip",
  "accordion",
  "tabs",
  "breadcrumb",
  "pagination",
  "table",
  "form-field",
  "search",
  "filter-panel",
  "layout",
  "sidebar",
  "nav",
  "menu",
]);

const MAX_SAMPLE_PATHS = 5;

/** Effort estimate by concern type */
const EFFORT_BY_TYPE: Record<StructureConcernType, RefactorEffortEstimate> = {
  "deep-nesting": "medium",
  "shared-dumping-risk": "high",
  "generic-folder-overuse": "medium",
  "suspicious-placement": "low",
  "feature-boundary-blur": "medium",
  "folder-density-concern": "low",
};

function computeAreaCounts(paths: string[]): AffectedAreaWithCount[] {
  const counts = new Map<string, number>();
  for (const rawPath of paths) {
    const normalizedPath = normalizePath(rawPath);
    const rawArea = inferFeatureFromPath(normalizedPath) ?? "other";
    const canonical =
      rawArea === "other" ? "other" : normalizeFeatureName(rawArea.trim());
    const key = canonical || "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries()).map(([area, count]) => ({
    area,
    count,
  }));
  const withOther = entries.filter((e) => e.area !== "other");
  const otherEntry = entries.find((e) => e.area === "other");
  withOther.sort((a, b) => b.count - a.count);
  if (otherEntry) withOther.push(otherEntry);
  return withOther;
}

function deriveImpact(confidence: StructureConcernConfidence, affectedCount: number): StructureConcernImpact {
  if (confidence === "high" && affectedCount >= 10) return "high";
  if (confidence === "medium" || affectedCount >= 5) return "medium";
  return "low";
}
const DEEP_NESTING_DEPTH_WEAK = 10;
const DEEP_NESTING_DEPTH_STRONG = 12;
const SHARED_DUMPING_THRESHOLD = 20;
const GENERIC_FOLDER_OVERUSE_RATIO = 0.6;
const FOLDER_DENSITY_THRESHOLD = 15;
const MIN_SIBLINGS_OVERLOADED = 10;
const MIN_LOW_CONFIDENCE_COUNT = 3;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function getPathSegments(path: string): string[] {
  return normalizePath(path).split("/").filter(Boolean);
}

function getPathDepth(path: string): number {
  return getPathSegments(path).length;
}

function pathContainsFolder(path: string, folderName: string): boolean {
  const segments = getPathSegments(path);
  return segments.some((s) => s.toLowerCase() === folderName.toLowerCase());
}

function pathContainsAnyFolder(path: string, folders: Set<string>): boolean {
  const segments = getPathSegments(path);
  return segments.some((s) => folders.has(s.toLowerCase()));
}

function getParentDir(path: string): string {
  const segments = getPathSegments(path);
  if (segments.length <= 1) return "";
  return segments.slice(0, -1).join("/");
}

function getFileNameBase(path: string): string {
  const segments = getPathSegments(path);
  const fileName = segments[segments.length - 1] ?? "";
  return fileName.replace(/\.component\.ts$/i, "").toLowerCase();
}

function isLegitimateSharedUI(path: string): boolean {
  const base = getFileNameBase(path);
  const baseNorm = base.replace(/-/g, "");
  const names = Array.from(LEGITIMATE_SHARED_UI_NAMES);
  for (const name of names) {
    const nameNorm = name.replace(/-/g, "");
    if (base === name || base.includes(name) || baseNorm.includes(nameNorm)) return true;
  }
  return false;
}

function countGenericFoldersInPath(path: string): number {
  const segments = getPathSegments(path);
  return segments.filter((s) => GENERIC_FOLDER_NAMES.has(s.toLowerCase())).length;
}

function hasRepeatedComponentsInPath(path: string): boolean {
  const segments = getPathSegments(path);
  const componentsCount = segments.filter((s) => s.toLowerCase() === "components").length;
  return componentsCount >= 2;
}

export interface StructureAnalyzerInput {
  componentPaths: string[];
  componentDiagnostics: ComponentDiagnostic[];
  workspacePath: string;
}

function createConcern(
  concernType: StructureConcernType,
  affectedPaths: string[],
  explanation: string,
  whyItMatters: string,
  refactorDirection: string,
  confidence: StructureConcernConfidence,
  whyFlaggedHere?: string,
  extras?: { suspiciousPlacementDetails?: SuspiciousPlacementDetail[]; refactorOptions?: RefactorOption[] }
): StructureConcern {
  const uniquePaths = Array.from(new Set(affectedPaths.map(normalizePath)));
  const samplePaths = uniquePaths.slice(0, MAX_SAMPLE_PATHS);
  const affectedCount = uniquePaths.length;
  const areaCounts = computeAreaCounts(uniquePaths);
  const affectedAreas = areaCounts.map(({ area }) => area);
  const concern: StructureConcern = {
    concernType,
    affectedPaths: uniquePaths,
    affectedCount,
    explanation,
    whyItMatters,
    refactorDirection,
    samplePaths,
    affectedAreas: affectedAreas.length > 0 ? affectedAreas : undefined,
    affectedAreasWithCounts: areaCounts.length > 0 ? areaCounts : undefined,
    confidence,
    impact: deriveImpact(confidence, affectedCount),
    effortEstimate: EFFORT_BY_TYPE[concernType],
    whyFlaggedHere,
  };
  if (extras?.suspiciousPlacementDetails?.length) {
    concern.suspiciousPlacementDetails = extras.suspiciousPlacementDetails;
  }
  if (extras?.refactorOptions?.length) {
    concern.refactorOptions = extras.refactorOptions;
  }
  return concern;
}

function shouldSuppressLowConfidence(concern: StructureConcern): boolean {
  return concern.confidence === "low" && concern.affectedCount < MIN_LOW_CONFIDENCE_COUNT;
}

export function computeStructureConcerns(input: StructureAnalyzerInput): StructureAnalysisResult {
  const { componentPaths, componentDiagnostics } = input;
  const diagnosticsByPath = new Map(
    componentDiagnostics.map((d) => [normalizePath(d.filePath), d] as const)
  );
  const allPaths = componentPaths.map(normalizePath);

  const byParentDir = new Map<string, string[]>();
  for (const p of allPaths) {
    const parent = getParentDir(p);
    const list = byParentDir.get(parent) ?? [];
    list.push(p);
    byParentDir.set(parent, list);
  }

  const concerns: StructureConcern[] = [];

  // A. Deep Nesting - multi-signal
  const deepNestingCandidates: Array<{ path: string; signals: number; depth: number }> = [];
  for (const p of allPaths) {
    const depth = getPathDepth(p);
    const parent = getParentDir(p);
    const siblingCount = byParentDir.get(parent)?.length ?? 0;

    let signals = 0;
    if (depth >= DEEP_NESTING_DEPTH_STRONG) {
      signals += 2;
    } else if (depth >= DEEP_NESTING_DEPTH_WEAK) {
      signals += 1;
    }
    if (countGenericFoldersInPath(p) >= 2) signals += 1;
    if (siblingCount >= MIN_SIBLINGS_OVERLOADED) signals += 1;
    if (hasRepeatedComponentsInPath(p)) signals += 1;

    if (signals >= 2) {
      deepNestingCandidates.push({ path: p, signals, depth });
    }
  }
  deepNestingCandidates.sort((a, b) => {
    if (b.signals !== a.signals) return b.signals - a.signals;
    return b.depth - a.depth;
  });
  const deepPaths = deepNestingCandidates.slice(0, 15).map((c) => c.path);
  if (deepPaths.length > 0) {
    const confidence: StructureConcernConfidence =
      deepNestingCandidates[0]!.signals >= 4 ? "high" : deepNestingCandidates[0]!.signals >= 3 ? "medium" : "low";
    let explanation = "Deep nesting combined with repeated generic segments (pages, components, shared) can reduce maintainability.";
    if (confidence === "medium") {
      explanation += " This concern is based on repeated deep path structure, not path length alone.";
    }
    const concern = createConcern(
      "deep-nesting",
      deepPaths,
      explanation,
      "Flatter structures improve clarity and make refactoring easier. Consider feature-based folders at a shallower depth.",
      "Flatten repeated page/component nesting where the same concern is described multiple times. Consider feature-based folders at a shallower depth.",
      confidence,
      "Flagged because affected files combine deep nesting with repeated generic segments such as pages, components, or shared."
    );
    if (!shouldSuppressLowConfidence(concern)) concerns.push(concern);
  }

  // B. Shared Dumping Risk - refined
  const byDir = new Map<string, string[]>();
  for (const p of allPaths) {
    const dir = getParentDir(p);
    if (!dir) continue;
    const segments = getPathSegments(dir);
    const hasSharedDumpingFolder = segments.some((s) =>
      SHARED_DUMPING_FOLDERS.has(s.toLowerCase())
    );
    if (!hasSharedDumpingFolder) continue;
    const key = dir;
    const list = byDir.get(key) ?? [];
    list.push(p);
    byDir.set(key, list);
  }

  const dumpingDirsWithRoles = Array.from(byDir.entries())
    .filter(([, files]) => files.length >= SHARED_DUMPING_THRESHOLD)
    .map(([dir, files]) => {
      const roles = new Set<string>();
      let legitimateCount = 0;
      for (const f of files) {
        const diag = diagnosticsByPath.get(f);
        if (diag?.componentRole) roles.add(diag.componentRole);
        if (isLegitimateSharedUI(f)) legitimateCount++;
      }
      const mixedRoles = roles.size >= 3;
      const mostlyLegitimate = files.length > 0 && legitimateCount / files.length > 0.5;
      return { dir, files, mixedRoles, mostlyLegitimate };
    })
    .filter((x) => x.mixedRoles && !x.mostlyLegitimate);

  if (dumpingDirsWithRoles.length > 0) {
    const allAffected = Array.from(new Set(dumpingDirsWithRoles.flatMap((x) => x.files).map(normalizePath)));
    const confidence: StructureConcernConfidence = "high";
    concerns.push(
      createConcern(
        "shared-dumping-risk",
        allAffected,
        "Shared/common/ui folders with many files and mixed roles can blur ownership. Organizing by domain improves maintainability.",
        "Clear ownership makes changes safer. Domain-specific subfolders improve discoverability and reduce cross-cutting dependencies.",
        "Keep shared folders focused and responsibility-specific. Split overloaded generic folders into domain-based folders.",
        confidence,
        "Flagged because these folders have high file count and mixed component roles (page, list, widget, etc.)."
      )
    );
  }

  // C. Generic Folder Overuse - multi-signal
  const genericCount = allPaths.filter((p) => pathContainsAnyFolder(p, GENERIC_FOLDER_NAMES)).length;
  const overuseRatio = allPaths.length > 0 ? genericCount / allPaths.length : 0;

  const genericByDir = new Map<string, string[]>();
  for (const p of allPaths) {
    if (!pathContainsAnyFolder(p, SHARED_DUMPING_FOLDERS)) continue;
    const dir = getParentDir(p);
    const list = genericByDir.get(dir) ?? [];
    list.push(p);
    genericByDir.set(dir, list);
  }

  const overloadedGenericDirs = Array.from(genericByDir.entries())
    .filter(([, files]) => files.length >= 20)
    .map(([dir, files]) => {
      const roles = new Set<string>();
      const features = new Set<string>();
      for (const f of files) {
        const diag = diagnosticsByPath.get(f);
        if (diag?.componentRole) roles.add(diag.componentRole);
        const feat = inferFeatureFromPath(f);
        if (feat) features.add(feat);
      }
      return { dir, files, mixedRoles: roles.size >= 2, mixedFeatures: features.size >= 2 };
    })
    .filter((x) => (x.mixedRoles || x.mixedFeatures) && (overuseRatio > GENERIC_FOLDER_OVERUSE_RATIO || x.files.length >= 25));

  if (overloadedGenericDirs.length > 0) {
    const allAffected = Array.from(new Set(overloadedGenericDirs.flatMap((x) => x.files).map(normalizePath)));
    const confidence: StructureConcernConfidence =
      overloadedGenericDirs.some((x) => x.mixedRoles && x.mixedFeatures) ? "high" : "medium";
    const concern = createConcern(
      "generic-folder-overuse",
      allAffected,
      "Generic folders (shared, common, ui) have high file count and mixed roles or features. Moving feature-owned components improves clarity.",
      "Feature-specific placement improves cohesion and maintainability. Prefer domain folders over generic ones for clearer ownership.",
      "Move feature-owned components closer to their owning feature. Prefer domain folders over generic ones.",
      confidence,
      "Flagged because folders under shared/common/ui have high file count and mix roles or features."
    );
    if (!shouldSuppressLowConfidence(concern)) concerns.push(concern);
  }

  // D. Suspicious Placement - multi-signal
  const suspiciousPaths: string[] = [];
  const suspiciousPathToRole = new Map<string, { role: string; roleConf: number }>();
  for (const p of allPaths) {
    if (isLegitimateSharedUI(p)) continue;
    const diag = diagnosticsByPath.get(p);
    const role = diag?.componentRole;
    const roleConf = diag?.roleConfidence ?? 0;
    if (!role || !FEATURE_SPECIFIC_ROLES.has(role)) continue;
    if (
      !pathContainsFolder(p, "shared") &&
      !pathContainsFolder(p, "common") &&
      !pathContainsFolder(p, "ui")
    ) {
      continue;
    }

    let signals = 1;
    if (roleConf >= 0.6) signals += 1;
    if (PAGE_LIKE_ROLES.has(role)) signals += 1;
    else if ((role === "detail" || role === "list") && roleConf >= 0.7) signals += 1;

    if (signals >= 2) {
      suspiciousPaths.push(p);
      suspiciousPathToRole.set(p, { role, roleConf });
    }
  }
  if (suspiciousPaths.length > 0) {
    const signalCount = suspiciousPaths.length;
    const confidence: StructureConcernConfidence =
      signalCount >= 5 ? "high" : signalCount >= 3 ? "medium" : "low";

    const suspiciousPlacementDetails: SuspiciousPlacementDetail[] = suspiciousPaths.map((p) => {
      const diag = diagnosticsByPath.get(p);
      const roleInfo = suspiciousPathToRole.get(p);
      const role = roleInfo?.role ?? diag?.componentRole ?? "container";
      const featFromPath = inferFeatureFromPath(p);
      const featFromClass = diag?.className ? inferFeatureFromClassName(diag.className) : null;
      const likelyOwningFeature =
        featFromPath && featFromPath !== "infrastructure"
          ? normalizeFeatureName(featFromPath)
          : featFromClass
            ? normalizeFeatureName(featFromClass)
            : null;

      const segs = getPathSegments(p);
      const sharedIdx = segs.findIndex((s) => ["shared", "common", "ui"].includes(s.toLowerCase()));
      const currentLocation =
        sharedIdx >= 0 ? segs.slice(Math.max(0, sharedIdx - 1), segs.length).join("/") : segs.slice(-3).join("/") || p;

      const whySuspicious = `Identified as ${role}-like component under shared/common/ui rather than a clear owning feature.`;

      const suggestedMoveDirection = likelyOwningFeature
        ? `Move to features/${likelyOwningFeature}/components or the owning feature folder.`
        : "Move to the owning feature folder. Reserve shared for reusable primitives only.";

      return {
        path: p,
        currentLocation: currentLocation || p,
        likelyOwningFeature,
        whySuspicious,
        suggestedMoveDirection,
        dominantIssue: diag?.dominantIssue ?? undefined,
      };
    });

    const refactorOptions: RefactorOption[] = [
      {
        id: "move-to-feature",
        label: "Move to owning feature",
        description: "Relocate the component into its owning feature folder. Improves cohesion and discoverability.",
        whenToUse: "When the component is clearly owned by a single feature.",
      },
      {
        id: "shallow-api",
        label: "Keep public API shallow",
        description: "If keeping the component in shared, expose a minimal public API. Delegate feature logic to services.",
        whenToUse: "When the component must stay in shared for reuse across features.",
      },
      {
        id: "wrapper-only",
        label: "Leave wrapper in shared only if truly reusable",
        description: "Only keep a thin wrapper in shared if it is genuinely reusable. Move feature-specific logic out.",
        whenToUse: "When the component has both reusable and feature-specific parts.",
      },
    ];

    const concern = createConcern(
      "suspicious-placement",
      suspiciousPaths,
      "Feature-owned components under shared folders can blur ownership. Moving them improves maintainability.",
      "Clear ownership makes changes safer and easier to reason about.",
      "Move feature-owned UI back into its owning feature folder. Reserve shared folders for reusable primitives only.",
      confidence,
      "Flagged because page/container-like components appear under shared/common areas rather than a clear owning feature.",
      { suspiciousPlacementDetails, refactorOptions }
    );
    if (!shouldSuppressLowConfidence(concern)) concerns.push(concern);
  }

  // E. Feature Boundary Blur - same-branch only
  const blurPaths: string[] = [];
  for (const p of allPaths) {
    const lower = p.toLowerCase();
    for (const [a, b] of FEATURE_BOUNDARY_PAIRS) {
      const aIdx = lower.indexOf(a);
      const bIdx = lower.indexOf(b);
      if (aIdx < 0 || bIdx < 0) continue;
      const minIdx = Math.min(aIdx, bIdx);
      const maxIdx = Math.max(aIdx, bIdx);
      const segment = lower.substring(minIdx, maxIdx + Math.max(a.length, b.length));
      if (segment.includes("/") && (segment.includes(a) && segment.includes(b))) {
        blurPaths.push(p);
        break;
      }
      if (/\badmin[-_]?public\b|\bpublic[-_]?admin\b|\badminpublic\b|\bpublicadmin\b/i.test(lower)) {
        blurPaths.push(p);
        break;
      }
    }
  }
  if (blurPaths.length > 0) {
    let blurExplanation = "Path structure suggests admin/public or cross-feature ownership may be mixed. Review for clearer boundaries.";
    blurExplanation += " This is a review signal, not a confirmed boundary violation.";
    const concern = createConcern(
      "feature-boundary-blur",
      blurPaths,
      blurExplanation,
      "Clear boundaries improve maintainability and make access control easier to reason about.",
      "Separate admin/public structures when ownership becomes unclear. Ensure clear path-based boundaries.",
      "low",
      "Flagged because path structure suggests admin/public or cross-feature ownership is mixed in ways that may deserve review."
    );
    if (!shouldSuppressLowConfidence(concern)) concerns.push(concern);
  }

  // F. Folder Density - refined
  const denseDirs = Array.from(byParentDir.entries())
    .filter(([, files]) => files.length >= FOLDER_DENSITY_THRESHOLD)
    .filter(([dir]) => {
      const segs = getPathSegments(dir);
      return segs.some((s) => SHARED_DUMPING_FOLDERS.has(s.toLowerCase()));
    });

  if (denseDirs.length > 0) {
    const allAffected = Array.from(new Set(denseDirs.flatMap(([, files]) => files).map(normalizePath)));
    const confidence: StructureConcernConfidence = "medium";
    concerns.push(
      createConcern(
        "folder-density-concern",
        allAffected,
        "Shared/common folders with many sibling components may benefit from sub-organization.",
        "Subfolders or grouping can improve clarity and make navigation easier.",
        "Split overloaded folders into subfolders or domain-based groups.",
        confidence,
        "Flagged because these shared/common folders have 15+ sibling components."
      )
    );
  }

  const filteredConcerns = concerns.filter((c) => !shouldSuppressLowConfidence(c));
  const totalConcerns = filteredConcerns.reduce((sum, c) => sum + c.affectedCount, 0);
  const mostCommon =
    filteredConcerns.length > 0
      ? (filteredConcerns.reduce((best, c) =>
          c.affectedCount > (best?.affectedCount ?? 0) ? c : best
        ) as StructureConcern)
      : undefined;

  const highConfidenceCount = filteredConcerns.filter((c) => c.confidence === "high").length;

  const allAffectedPaths = filteredConcerns.flatMap((c) => c.affectedPaths);
  const globalAreaCounts = computeAreaCounts(allAffectedPaths).filter(
    (e) => e.area !== "other"
  );
  const mostAffectedArea =
    globalAreaCounts.length > 0 ? globalAreaCounts[0]!.area : undefined;

  const mostCommonShare =
    mostCommon && totalConcerns > 0 ? mostCommon.affectedCount / totalConcerns : undefined;

  const recommendedForInsight = filteredConcerns
    .filter((c) => c.confidence === "high" && (c.impact === "high" || c.impact === "medium"))
    .sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const aImp = impactOrder[a.impact ?? "medium"] ?? 1;
      const bImp = impactOrder[b.impact ?? "medium"] ?? 1;
      if (aImp !== bImp) return aImp - bImp;
      return (b.affectedCount ?? 0) - (a.affectedCount ?? 0);
    })[0];

  const insightSentence = buildInsightSentence(
    mostCommon?.concernType,
    mostAffectedArea,
    filteredConcerns,
    recommendedForInsight
  );

  if (process.env.NODE_ENV !== "production") {
    for (const c of filteredConcerns) {
      const r = validateStructureConcern(c);
      if (!r.valid) {
        console.warn("[structure-concern] Validation failed:", c.concernType, r.checks);
      }
    }
  }

  const debugFlag = process.env.ANGULAR_DOCTOR_DEBUG_STRUCTURE;
  if (debugFlag && debugFlag.toLowerCase() !== "false" && debugFlag !== "0") {
    console.log(
      "[structure-debug] summary",
      {
        totalConcerns,
        categoryCount: filteredConcerns.length,
        mostCommonType: mostCommon?.concernType,
        mostAffectedArea,
        mostCommonShare,
        highConfidenceCount,
      }
    );
    for (const c of filteredConcerns) {
      const topAreas = (c.affectedAreasWithCounts ?? [])
        .slice(0, 3)
        .map((a) => `${a.area}:${a.count}`)
        .join(", ");
      console.log(
        "[structure-debug] concern",
        {
          type: c.concernType,
          affectedCount: c.affectedCount,
          confidence: c.confidence,
          impact: c.impact,
          areas: topAreas || "none",
          samplePath: c.samplePaths[0] ?? null,
        }
      );
    }
  }

  return {
    concerns: filteredConcerns,
    totalConcerns,
    categoryCount: filteredConcerns.length,
    mostCommonType: mostCommon?.concernType,
    mostCommonShare,
    highConfidenceCount,
    mostAffectedArea,
    primaryStructuralSmell: mostCommon?.concernType,
    insightSentence,
  };
}

const CONCERN_HINTS: Record<StructureConcernType, string> = {
  "deep-nesting": "repeated page/component nesting and path depth",
  "shared-dumping-risk": "overloaded shared folders with mixed responsibilities",
  "generic-folder-overuse": "feature-owned components in generic folders",
  "suspicious-placement": "feature ownership issues in shared containers",
  "feature-boundary-blur": "admin/public or cross-feature boundary mixing",
  "folder-density-concern": "overloaded folders needing sub-organization",
};

function buildInsightSentence(
  mostCommonType: StructureConcernType | undefined,
  mostAffectedArea: string | undefined,
  concerns: StructureConcern[],
  recommended?: StructureConcern
): string | undefined {
  const typeLabels: Record<StructureConcernType, string> = {
    "deep-nesting": "Deep Nesting",
    "shared-dumping-risk": "Shared Dumping Risk",
    "generic-folder-overuse": "Generic Folder Overuse",
    "suspicious-placement": "Suspicious Placement",
    "feature-boundary-blur": "Feature Boundary Blur",
    "folder-density-concern": "Folder Density",
  };

  if (recommended) {
    const hint = CONCERN_HINTS[recommended.concernType] ?? "structural organization";
    const areaPart = mostAffectedArea ? ` in ${mostAffectedArea}` : "";
    const conf = recommended.confidence;
    if (conf === "high") {
      return `Start with ${typeLabels[recommended.concernType]}: it is high-confidence and points to ${hint}${areaPart}.`;
    }
    if (conf === "medium") {
      return `Start with ${typeLabels[recommended.concernType]}: review recommended; it points to ${hint}${areaPart}.`;
    }
    return `Consider ${typeLabels[recommended.concernType]}: signal only; verify before acting. It may relate to ${hint}${areaPart}.`;
  }

  if (!mostCommonType) return undefined;
  const repeatedSegments = new Set<string>();
  for (const c of concerns) {
    for (const p of c.affectedPaths) {
      const segs = p.split("/").filter(Boolean);
      for (const s of segs) {
        const lower = s.toLowerCase();
        if (["pages", "components", "shared", "common"].includes(lower)) {
          repeatedSegments.add(lower);
        }
      }
    }
  }
  const segmentParts =
    repeatedSegments.size > 0
      ? ` and repeated ${Array.from(repeatedSegments).slice(0, 3).join("/")} nesting`
      : "";
  const areaPart = mostAffectedArea ? ` in ${mostAffectedArea} areas` : "";
  return `Most structure issues are ${typeLabels[mostCommonType].toLowerCase()}${areaPart}${segmentParts}.`;
}
