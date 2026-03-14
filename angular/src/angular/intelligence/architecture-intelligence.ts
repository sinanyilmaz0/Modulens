import type { ScanResult } from "../../core/scan-result";
import type { ComponentFamily } from "../family/family-models";
import type { DominantIssueType } from "../../diagnostic/diagnostic-models";
import { formatDecompositionBlueprint } from "./decomposition";
import { DOMINANT_ISSUE_TO_LABEL } from "../../diagnostic/diagnostic-clusters";
import {
  FAMILY_STRATEGY_TEMPLATES,
  TARGET_FAMILY_SUFFIXES,
} from "../../refactor/family-strategy-templates";
import type {
  ArchitectureHotspot,
  ArchitectureRefactorPlanItem,
  FamilyRefactorPlaybook,
  ImpactBand,
  ImpactBreakdown,
  RefactorROI,
  ArchitectureRoadmapItem,
} from "../../refactor/refactor-plan-models";
import {
  computeArchitectureSmells,
  type ArchitectureSmell,
  type ArchitectureSmellSummary,
} from "./architecture-smell";

const TARGET_SUFFIXES_SET = new Set(TARGET_FAMILY_SUFFIXES as readonly string[]);

const DOMINANT_ISSUE_WEIGHT: Record<DominantIssueType, number> = {
  TEMPLATE_HEAVY_COMPONENT: 3,
  GOD_COMPONENT: 4,
  CLEANUP_RISK_COMPONENT: 2,
  ORCHESTRATION_HEAVY_COMPONENT: 3,
  LIFECYCLE_RISKY_COMPONENT: 2,
};

function getDominantIssueWeight(issue: DominantIssueType | null): number {
  return issue ? (DOMINANT_ISSUE_WEIGHT[issue] ?? 1) : 1;
}

function getStrongFamilies(result: ScanResult): ComponentFamily[] {
  const all = [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
  ];
  const seen = new Set<string>();
  return all.filter((f) => {
    if (seen.has(f.familyName)) return false;
    if (!TARGET_SUFFIXES_SET.has(f.familyName)) return false;
    seen.add(f.familyName);
    return true;
  });
}

function getCommonIssuesLabels(family: ComponentFamily): string[] {
  const labels = new Set<string>();
  for (const m of family.members) {
    if (m.dominantIssue) {
      const label = DOMINANT_ISSUE_TO_LABEL[m.dominantIssue as DominantIssueType];
      if (label) labels.add(label);
    }
  }
  return Array.from(labels);
}

function getPlaybookSummary(familyName: string): string {
  const template = FAMILY_STRATEGY_TEMPLATES[familyName];
  if (!template) return "Consider extracting shared logic.";
  return (
    template.suggestedComponentSplitDirection ??
    template.suggestedCommonExtraction ??
    template.suggestedRefactorSteps[0] ??
    "Consider extracting shared logic."
  );
}

function getSuggestedRefactor(familyName: string): string[] {
  const template = FAMILY_STRATEGY_TEMPLATES[familyName];
  if (!template) return ["Consider extracting shared logic."];
  const targets = template.suggestedExtractionTargets ?? [];
  const steps = template.suggestedRefactorSteps ?? [];
  if (targets.length > 0) {
    return targets.map((t) => `Extract ${t}`);
  }
  return steps.length > 0 ? steps : ["Consider extracting shared logic."];
}

function computeWarningDensity(family: ComponentFamily): number {
  const total = family.members.reduce((s, m) => s + m.warningCodes.length, 0);
  return family.members.length > 0 ? total / family.members.length : 0;
}

function computeImpactScore(
  family: ComponentFamily,
  warningDensity: number
): number {
  const componentCount = family.members.length;
  const avgLineCount = family.avgLineCount || 200;
  const dominantWeight = getDominantIssueWeight(family.commonDominantIssue);
  const density = Math.max(0.1, warningDensity);
  const raw =
    (componentCount * 2) *
    (avgLineCount / 200) *
    density *
    dominantWeight;
  return Math.round(raw);
}

function getImpactBand(normalizedScore: number): ImpactBand {
  if (normalizedScore >= 75) return "Very High";
  if (normalizedScore >= 50) return "High";
  if (normalizedScore >= 25) return "Medium";
  return "Low";
}

function normalizeImpactScores(hotspots: ArchitectureHotspot[]): void {
  if (hotspots.length === 0) return;
  const scores = hotspots.map((h) => h.impactScore);
  const minRaw = Math.min(...scores);
  const maxRaw = Math.max(...scores);
  for (const h of hotspots) {
    const normalized =
      minRaw === maxRaw
        ? 100
        : Math.round(((h.impactScore - minRaw) / (maxRaw - minRaw)) * 100);
    h.normalizedImpactScore = normalized;
    h.impactBand = getImpactBand(normalized);
  }
}

function computeHotspotReasons(family: ComponentFamily): string[] {
  const reasons: string[] = [];
  const n = family.members.length;
  const avgLines = Math.round(family.avgLineCount);
  const commonLabels = getCommonIssuesLabels(family);
  const density = computeWarningDensity(family);

  if (family.commonDominantIssue === "TEMPLATE_HEAVY_COMPONENT") {
    reasons.push("duplicated template-heavy structure");
  } else if (family.commonDominantIssue === "ORCHESTRATION_HEAVY_COMPONENT") {
    reasons.push("repeated form orchestration pattern");
  } else if (family.commonDominantIssue === "GOD_COMPONENT") {
    reasons.push("repeated god-component pattern");
  } else if (family.commonDominantIssue === "CLEANUP_RISK_COMPONENT") {
    reasons.push("repeated cleanup risk patterns");
  } else if (family.commonDominantIssue === "LIFECYCLE_RISKY_COMPONENT") {
    reasons.push("repeated lifecycle risk patterns");
  }

  if (n >= 5) {
    reasons.push(`repeated architecture across ${n} large components`);
  } else if (n >= 3) {
    reasons.push(`repeated architecture across ${n} components`);
  }

  if (avgLines >= 1100) {
    reasons.push("very high average component size");
  } else if (avgLines >= 800) {
    reasons.push(`avg component size exceeds ${avgLines} lines`);
  }

  if (density >= 10) {
    reasons.push("high warning density per component");
  }

  if (commonLabels.length >= 2) {
    reasons.push("overlap between template and responsibility issues");
  }

  const patterns = (family.commonWarningPatterns ?? []).join(" ").toLowerCase();
  if (
    patterns.includes("subscription") ||
    patterns.includes("listener") ||
    patterns.includes("timer") ||
    patterns.includes("cleanup")
  ) {
    reasons.push("repeated timer/listener orchestration");
  }

  return reasons.slice(0, 4);
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Player Page": "Components mix media playback orchestration and UI rendering.",
  "Player Container": "Container components with media playback controls.",
  "Detail Container": "Container components displaying entity details.",
  "Detail Page": "Page-level components for entity detail views.",
  "Form Container": "Container components with form orchestration.",
  "List Container": "Container components for list views.",
  "Page Container": "Page-level container components.",
};

function getRoleDescription(detectedRolePattern: string): string {
  return ROLE_DESCRIPTIONS[detectedRolePattern] ?? `Components with ${detectedRolePattern} role pattern.`;
}

function computeImpactBreakdown(
  family: ComponentFamily,
  warningDensity: number
): ImpactBreakdown {
  const componentCountFactor = family.members.length * 2;
  const avgLineCountFactor = family.avgLineCount / 200 || 1;
  const densityFactor = Math.max(0.1, warningDensity);
  const dominantFactor = getDominantIssueWeight(family.commonDominantIssue);
  const commonCount = getCommonIssuesLabels(family).length;
  const repeatedPatternFactor = Math.max(1.5, 1 + (commonCount + 1) * 0.5);

  const factors = [
    componentCountFactor,
    avgLineCountFactor,
    densityFactor,
    dominantFactor,
    repeatedPatternFactor,
  ];
  const logSum = factors.reduce((s, f) => s + Math.log(Math.max(1, f)), 0);
  const toPercent = (f: number) =>
    Math.round((Math.log(Math.max(1, f)) / logSum) * 100);

  return {
    componentCountWeight: toPercent(componentCountFactor),
    avgLineCountWeight: toPercent(avgLineCountFactor),
    warningDensityWeight: toPercent(densityFactor),
    dominantIssueWeight: toPercent(dominantFactor),
    repeatedPatternWeight: toPercent(repeatedPatternFactor),
  };
}

export function computeRefactorROI(
  result: ScanResult,
  families: ComponentFamily[]
): RefactorROI[] {
  const totalFindings = result.workspaceSummary.totalFindings || 1;
  return families.map((f) => {
    const warningsInFamily = f.members.reduce(
      (s, m) => s + m.warningCodes.length,
      0
    );
    const percentageOfTotalIssues = Math.round(
      (warningsInFamily / totalFindings) * 100
    );
    return {
      familyName: f.familyName,
      affectedComponents: f.members.length,
      warningsReduced: warningsInFamily,
      percentageOfTotalIssues,
    };
  });
}

function getDecompositionBlueprintForFamily(
  result: ScanResult,
  memberFilePaths: string[]
): string | undefined {
  const diagByPath = new Map(
    (result.diagnosticSummary.componentDiagnostics ?? []).map((d) => [
      d.filePath,
      d.decompositionSuggestion,
    ])
  );
  for (const path of memberFilePaths) {
    const suggestion = diagByPath.get(path);
    if (suggestion) {
      return formatDecompositionBlueprint(suggestion);
    }
  }
  return undefined;
}

export function computeArchitectureHotspots(result: ScanResult): ArchitectureHotspot[] {
  const families = getStrongFamilies(result);
  const totalFindings = result.workspaceSummary.totalFindings || 1;
  const hotspots: ArchitectureHotspot[] = families.map((f) => {
    const warningDensity = computeWarningDensity(f);
    const impactScore = computeImpactScore(f, warningDensity);
    const warningsInFamily = f.members.reduce(
      (s, m) => s + m.warningCodes.length,
      0
    );
    const estimatedIssueCoveragePercent = Math.round(
      (warningsInFamily / totalFindings) * 100
    );
    const detectedRolePattern = f.detectedRolePattern ?? "";
    const roleDescription = detectedRolePattern
      ? getRoleDescription(detectedRolePattern)
      : undefined;
    const memberFilePaths = f.members.map((m) => m.filePath);
    const recommendedArchitectureBlueprint = getDecompositionBlueprintForFamily(
      result,
      memberFilePaths
    );

    return {
      familyName: f.familyName,
      componentCount: f.members.length,
      avgLineCount: Math.round(f.avgLineCount),
      dominantIssue: f.commonDominantIssue,
      warningDensity: Math.round(warningDensity * 10) / 10,
      impactScore,
      hotspotReasons: computeHotspotReasons(f),
      impactBreakdown: computeImpactBreakdown(f, warningDensity),
      estimatedFixImpact: f.members.length,
      estimatedWarningsAffected: warningsInFamily,
      estimatedComponentsAffected: f.members.length,
      estimatedIssueCoveragePercent,
      roiDisclaimer: "Approximate impact based on repeated family pattern",
      suggestedRefactor: getSuggestedRefactor(f.familyName),
      commonIssues: getCommonIssuesLabels(f),
      playbookSummary: getPlaybookSummary(f.familyName),
      extractionScore: f.extractionScore,
      memberFilePaths,
      detectedRolePattern: detectedRolePattern || undefined,
      roleDescription,
      recommendedArchitectureBlueprint,
    };
  });
  normalizeImpactScores(hotspots);
  return hotspots;
}

export function computeFamilyRefactorPlaybooks(
  result: ScanResult
): FamilyRefactorPlaybook[] {
  const families = getStrongFamilies(result);
  const playbooks: FamilyRefactorPlaybook[] = [];

  for (const family of families) {
    const template = FAMILY_STRATEGY_TEMPLATES[family.familyName];
    if (!template) continue;

    playbooks.push({
      familyName: family.familyName,
      patternSummary: template.patternSummary,
      likelySharedConcerns: template.likelySharedConcerns,
      suggestedExtractionTargets: template.suggestedExtractionTargets,
      suggestedAngularStructure: template.suggestedAngularStructure,
      refactorSteps: template.suggestedRefactorSteps,
      expectedBenefits: template.expectedBenefits,
    });
  }

  return playbooks.sort(
    (a, b) =>
      (result.extractionCandidates.find((f) => f.familyName === b.familyName)
        ?.extractionScore ?? 0) -
      (result.extractionCandidates.find((f) => f.familyName === a.familyName)
        ?.extractionScore ?? 0)
  );
}

function getImpactLevel(extractionScore: number, componentCount: number): "high" | "medium" | "low" {
  const score = extractionScore * 0.7 + componentCount * 0.5;
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function getReason(family: ComponentFamily): string {
  const template = FAMILY_STRATEGY_TEMPLATES[family.familyName];
  const patternPart = template?.patternSummary ?? "similar architecture";
  const commonLabels = getCommonIssuesLabels(family);
  if (commonLabels.length > 0) {
    return `Repeated ${patternPart} across ${family.members.length} components. Common issues: ${commonLabels.join(", ")}.`;
  }
  return `Repeated ${patternPart} across ${family.members.length} components.`;
}

export function computeArchitectureRoadmap(
  result: ScanResult
): ArchitectureRoadmapItem[] {
  const families = getStrongFamilies(result);
  const roadmap: ArchitectureRoadmapItem[] = [];

  const sorted = [...families].sort(
    (a, b) => b.extractionScore - a.extractionScore || b.members.length - a.members.length
  );

  sorted.forEach((family, index) => {
    const template = FAMILY_STRATEGY_TEMPLATES[family.familyName];
    const suggestedAction =
      template?.suggestedComponentSplitDirection ??
      template?.suggestedCommonExtraction ??
      family.refactorDirection ??
      "Extract shared logic.";

    roadmap.push({
      rank: index + 1,
      familyName: family.familyName,
      reason: getReason(family),
      impact: getImpactLevel(family.extractionScore, family.members.length),
      suggestedAction,
      componentCount: family.members.length,
    });
  });

  return roadmap;
}

function computeArchitectureRefactorPlan(
  hotspots: ArchitectureHotspot[],
  refactorROI: RefactorROI[]
): ArchitectureRefactorPlanItem[] {
  const roiByFamily = new Map(refactorROI.map((r) => [r.familyName, r]));
  return hotspots
    .map((h) => ({
      familyName: h.familyName,
      impactScore: h.impactScore,
      normalizedImpactScore: h.normalizedImpactScore,
      impactBand: h.impactBand,
      percentageOfTotalIssues: roiByFamily.get(h.familyName)?.percentageOfTotalIssues ?? 0,
      whyFirst: h.hotspotReasons?.slice(0, 3),
    }))
    .sort((a, b) => b.impactScore - a.impactScore);
}

export function computeArchitectureIntelligence(result: ScanResult): {
  architectureHotspots: ArchitectureHotspot[];
  familyRefactorPlaybooks: FamilyRefactorPlaybook[];
  architectureRoadmap: ArchitectureRoadmapItem[];
  refactorROI: RefactorROI[];
  architectureRefactorPlan: ArchitectureRefactorPlanItem[];
  architectureSmells: ArchitectureSmell[];
  architectureSmellSummary: ArchitectureSmellSummary;
} {
  const families = getStrongFamilies(result);
  const hotspots = computeArchitectureHotspots(result);
  const refactorROI = computeRefactorROI(result, families);
  const architectureRefactorPlan = computeArchitectureRefactorPlan(
    hotspots,
    refactorROI
  );
  const sortedHotspots = [...hotspots].sort(
    (a, b) => b.impactScore - a.impactScore
  );
  const { architectureSmells, architectureSmellSummary } =
    computeArchitectureSmells(result);
  return {
    architectureHotspots: sortedHotspots,
    familyRefactorPlaybooks: computeFamilyRefactorPlaybooks(result),
    architectureRoadmap: computeArchitectureRoadmap(result),
    refactorROI,
    architectureRefactorPlan,
    architectureSmells,
    architectureSmellSummary,
  };
}
