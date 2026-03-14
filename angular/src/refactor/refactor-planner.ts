import type { ScanResult } from "../core/scan-result";
import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import { getDiagnosticRiskScore } from "../diagnostic/diagnostic-consolidator";
import { shortenPathForDisplay } from "../report/report-view-model";
import {
  FAMILY_STRATEGY_TEMPLATES,
  TARGET_FAMILY_SUFFIXES,
} from "./family-strategy-templates";
import { enrichTargetsWithDedupeMetadata } from "./recommendation-dedupe";
import { getConfidenceBucket } from "../confidence/confidence-labels";
import { getConfidenceAwareCopy } from "../confidence/confidence-copy";
import type {
  RefactorPlan,
  RefactorPriorityItem,
  RefactorQuickWin,
  FamilyRefactorStrategy,
  ComponentDecompositionHint,
  TopRefactorTarget,
  ExtractionOpportunity,
  QuickWinCatalogItem,
  QuickWinCategoryType,
  QuickWinEligibilityFactors,
  ImpactLevel,
  EffortLevel,
  RefactorPhase,
  RoiLabel,
  ExtractionType,
  DuplicationLevel,
} from "./refactor-plan-models";
import {
  buildWorkspaceSequencingState,
  buildTargetSequencingCopy,
  buildExtractionSequencingCopy,
} from "./sequencing-copy";

const EFFORT_BY_ISSUE: Record<string, number> = {
  CLEANUP_RISK_COMPONENT: 2,
  TEMPLATE_HEAVY_COMPONENT: 4,
  GOD_COMPONENT: 6,
  ORCHESTRATION_HEAVY_COMPONENT: 5,
  LIFECYCLE_RISKY_COMPONENT: 5,
};

const FAMILY_EXTRACTION_EFFORT = 7;
const WHAT_TO_FIX_FIRST_MAX = 10;
const QUICK_WINS_MAX = 8;
const TOP_REFACTOR_TARGETS_MAX = 10;

const REFACTOR_STEPS_BY_ISSUE: Record<string, string[]> = {
  TEMPLATE_HEAVY_COMPONENT: [
    "Extract template sections into focused child views",
    "Split large template into smaller blocks",
    "Reduce page responsibility to routing + composition",
  ],
  GOD_COMPONENT: [
    "Split presentation and orchestration",
    "Move orchestration into facade/service layer",
    "Extract form logic to child components",
  ],
  CLEANUP_RISK_COMPONENT: [
    "Add ngOnDestroy and unsubscribe in takeUntilDestroyed",
    "Use takeUntilDestroyed() for all subscriptions",
    "Store and clear timer/listener handles in ngOnDestroy",
  ],
  ORCHESTRATION_HEAVY_COMPONENT: [
    "Split into thin container and presentation components",
    "Extract form/router logic to dedicated services",
  ],
  LIFECYCLE_RISKY_COMPONENT: [
    "Move heavy logic out of lifecycle hooks",
    "Enable OnPush change detection where safe",
    "Avoid ngDoCheck and other checked hooks",
  ],
};

/** Catalog config with eligibility metadata (1-5 scale: 1=best, 5=worst) */
interface QuickWinCatalogConfig {
  issueName: string;
  explanation: string;
  suggestedFix: string;
  whyMatters?: string;
  categoryType: QuickWinCategoryType;
  eligibilityFactors: QuickWinEligibilityFactors;
  quickWinRationale: string;
}

const QUICK_WIN_CATALOG: Record<string, QuickWinCatalogConfig> = {
  NGFOR_WITHOUT_TRACKBY: {
    issueName: "ngFor without trackBy",
    explanation: "List iterations without trackBy cause unnecessary DOM churn.",
    suggestedFix: "Add trackBy function",
    whyMatters: "Improves list rendering performance and reduces DOM churn.",
    categoryType: "trackby_fix",
    eligibilityFactors: {
      effort: 1,
      coordinationScope: 1,
      confidence: 1,
      blastRadius: 1,
      reversibility: 1,
      automationPotential: 4,
      filesAffected: 0,
    },
    quickWinRationale: "Low effort, affects many components. Mechanical fix with limited blast radius.",
  },
  SUBSCRIPTION_WITHOUT_DESTROY: {
    issueName: "Missing subscription cleanup",
    explanation: "Subscriptions may leak memory if not unsubscribed.",
    suggestedFix: "use takeUntilDestroyed()",
    whyMatters: "Prevents memory leaks and unexpected behavior.",
    categoryType: "subscription_cleanup",
    eligibilityFactors: {
      effort: 2,
      coordinationScope: 1,
      confidence: 1,
      blastRadius: 1,
      reversibility: 1,
      automationPotential: 3,
      filesAffected: 0,
    },
    quickWinRationale: "Safe lifecycle cleanup. Localized change with limited blast radius.",
  },
  LISTENER_WITHOUT_CLEANUP: {
    issueName: "Missing listener cleanup",
    explanation: "Event listeners may leak if not removed on destroy.",
    suggestedFix: "Remove listeners in ngOnDestroy",
    whyMatters: "Prevents memory leaks and unexpected behavior.",
    categoryType: "missing_teardown",
    eligibilityFactors: {
      effort: 2,
      coordinationScope: 1,
      confidence: 1,
      blastRadius: 1,
      reversibility: 1,
      automationPotential: 3,
      filesAffected: 0,
    },
    quickWinRationale: "Safe lifecycle cleanup. Localized change with limited blast radius.",
  },
};
const QUICK_WIN_ELIGIBILITY_THRESHOLD = 60;
const DECOMPOSITION_MIN_LINES = 150;
const DECOMPOSITION_MIN_RESPONSIBILITY_SCORE = 6;

function computeQuickWinEligibilityScore(
  factors: QuickWinEligibilityFactors,
  filesAffected: number
): number {
  const f = { ...factors, filesAffected };
  const effortScore = (6 - f.effort) * 15;
  const coordinationScore = (6 - f.coordinationScope) * 15;
  const confidenceScore = (6 - f.confidence) * 10;
  const blastRadiusScore = (6 - f.blastRadius) * 10;
  const reversibilityScore = (6 - f.reversibility) * 10;
  const automationScore = (6 - f.automationPotential) * 10;
  const filesPenalty = f.filesAffected > 50 ? -20 : f.filesAffected > 20 ? -10 : 0;
  const raw =
    effortScore +
    coordinationScore +
    confidenceScore +
    blastRadiusScore +
    reversibilityScore +
    automationScore +
    filesPenalty;
  return clamp(raw, 0, 100);
}

function isQuickWinEligible(
  score: number,
  factors: QuickWinEligibilityFactors,
  filesAffected: number
): boolean {
  if (score < QUICK_WIN_ELIGIBILITY_THRESHOLD) return false;
  if (factors.effort > 3) return false;
  if (factors.coordinationScope > 3) return false;
  if (filesAffected > 50) return false;
  return true;
}

const TARGET_SUFFIXES = ["detail", "fragment-player", "content-files", "manage-fragments", "form"];
const FAMILY_SUFFIX_REGEX = new RegExp(
  `^(.+)-(${TARGET_SUFFIXES.join("|")})\\.component\\.ts$`,
  "i"
);

function extractFamilyContextFromFileName(fileName: string): string | null {
  const match = fileName.match(FAMILY_SUFFIX_REGEX);
  return match ? `*-${match[2].toLowerCase()}` : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeComponentImpact(
  lineCount: number,
  responsibilityScore: number,
  templateScore: number
): number {
  const raw =
    lineCount * 0.01 + (10 - responsibilityScore) + (10 - templateScore);
  return clamp(raw, 1, 10);
}

function computeFamilyImpact(extractionScore: number, memberCount: number): number {
  const raw = extractionScore * 0.8 + memberCount * 0.3;
  return clamp(raw, 1, 10);
}

function getEffortForIssue(dominantIssue: string | null): number {
  if (!dominantIssue) return 5;
  return EFFORT_BY_ISSUE[dominantIssue] ?? 5;
}

function computeImpactLevel(
  severity: string | undefined,
  lineCount: number,
  totalWarningCount: number
): ImpactLevel {
  const severityScore = severity === "CRITICAL" ? 3 : severity === "HIGH" ? 2 : severity === "WARNING" ? 1 : 0;
  const lineScore = lineCount > 1000 ? 2 : lineCount > 500 ? 1 : 0;
  const warningScore = totalWarningCount > 5 ? 2 : totalWarningCount > 2 ? 1 : 0;
  const total = severityScore + lineScore + warningScore;
  if (total >= 5) return "High";
  if (total >= 2) return "Medium";
  return "Low";
}

function computeEffortLevel(
  dominantIssue: string | null,
  lineCount: number
): EffortLevel {
  const effortNum = getEffortForIssue(dominantIssue);
  if (lineCount < 300 && dominantIssue === "CLEANUP_RISK_COMPONENT") return "Small";
  if (lineCount > 800 || dominantIssue === "GOD_COMPONENT") return "Large";
  if (effortNum <= 3 || lineCount < 400) return "Small";
  if (effortNum >= 5 || lineCount > 600) return "Large";
  return "Medium";
}

function buildRankingReason(
  severity: string | undefined,
  lineCount: number,
  dependencyCount: number,
  totalWarningCount: number
): string {
  const parts: string[] = [];
  if (severity === "CRITICAL") parts.push("critical severity");
  else if (severity === "HIGH") parts.push("high severity");
  if (lineCount > 1000) parts.push(`large component (${lineCount}+ LOC)`);
  else if (lineCount > 500) parts.push("significant size");
  if (dependencyCount >= 7) parts.push("high dependency count");
  else if (dependencyCount >= 5) parts.push("elevated dependencies");
  if (totalWarningCount > 5) parts.push("many warnings");
  if (parts.length === 0) return "Ranked by composite risk score.";
  return "Ranked high due to " + parts.slice(0, 3).join(", ") + ".";
}

function buildWhyPrioritized(
  severity: string | undefined,
  lineCount: number,
  dependencyCount: number,
  totalWarningCount: number,
  dominantIssue: string | null
): string {
  const parts: string[] = [];
  if (severity === "CRITICAL") parts.push("critical severity");
  else if (severity === "HIGH") parts.push("high severity");
  if (lineCount > 1000) parts.push("large size");
  else if (lineCount > 500) parts.push("significant size");
  if (dependencyCount >= 7) parts.push("high deps");
  else if (dependencyCount >= 5) parts.push("elevated deps");
  if (totalWarningCount > 5) parts.push("many warnings");
  if (dominantIssue === "TEMPLATE_HEAVY_COMPONENT") parts.push("template complexity");
  if (parts.length === 0) return "composite risk score";
  return parts.slice(0, 3).join(", ");
}

function computePhase(
  dominantIssue: string | null,
  impact: ImpactLevel,
  effort: EffortLevel,
  isCrossCutting: boolean
): RefactorPhase {
  if (isCrossCutting) return 3;
  if (dominantIssue === "CLEANUP_RISK_COMPONENT" && effort === "Small") return 1;
  if (impact === "High" && effort === "Small") return 1;
  if (
    dominantIssue === "GOD_COMPONENT" ||
    dominantIssue === "TEMPLATE_HEAVY_COMPONENT" ||
    dominantIssue === "ORCHESTRATION_HEAVY_COMPONENT"
  ) {
    return effort === "Large" ? 3 : 2;
  }
  if (dominantIssue === "LIFECYCLE_RISKY_COMPONENT") return 2;
  return impact === "High" ? 2 : 1;
}

function computeRoiLabel(
  impact: ImpactLevel,
  effort: EffortLevel,
  isCrossCutting: boolean,
  phase: RefactorPhase
): RoiLabel {
  if (isCrossCutting) return "Cross-cutting";
  if (phase === 1) return "Low coordination";
  if (impact === "High" && effort === "Small") return "High ROI";
  if (impact === "High" && effort === "Medium") return "Medium ROI";
  return "Medium ROI";
}

function buildWhyInThisPhase(
  phase: RefactorPhase,
  roiLabel: RoiLabel,
  effort: EffortLevel
): string {
  if (phase === 1) return "Phase 1: safe start";
  if (phase === 2) return "Phase 2: high-impact";
  if (phase === 3) return "Phase 3: cross-cutting";
  return "Phase 4: structural";
}

function buildWhyBeforeAfter(
  phase: RefactorPhase,
  roiLabel: RoiLabel
): string {
  // Legacy helper kept for backward compatibility; callers should prefer
  // sequencing-aware copy from sequencing-copy.ts.
  if (phase === 1) return "Helps unlock later refactors.";
  if (phase === 2) return "Connects early clean-up to cross-cutting changes.";
  if (phase === 3) return "Cross-cutting work that may depend on earlier clean-up.";
  return "Requires team coordination.";
}

function buildCoordinationCost(
  phase: RefactorPhase,
  roiLabel: RoiLabel
): "Low" | "Medium" | "High" {
  if (phase === 1 || roiLabel === "Low coordination") return "Low";
  if (phase === 3 || roiLabel === "Cross-cutting") return "High";
  return "Medium";
}

function buildCoordinationLabels(
  phase: RefactorPhase,
  roiLabel: RoiLabel
): Array<"Phase 1" | "Phase 2" | "Phase 3" | "Phase 4" | "Cross-cutting" | "Low coordination" | "Team-wide" | "Needs review" | "Safe starting point"> {
  const labels: Array<"Phase 1" | "Phase 2" | "Phase 3" | "Phase 4" | "Cross-cutting" | "Low coordination" | "Team-wide" | "Needs review" | "Safe starting point"> = [
    `Phase ${phase}` as "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4",
  ];
  if (roiLabel === "Cross-cutting") labels.push("Cross-cutting");
  else if (roiLabel === "Low coordination") {
    labels.push("Low coordination");
    labels.push("Safe starting point");
  } else if (phase === 3) labels.push("Cross-cutting");
  return labels;
}

function buildRefactorSteps(
  dominantIssue: string | null,
  refactorDirection: string,
  possibleExtractions: string[]
): string[] {
  const steps: string[] = [];
  if (possibleExtractions.length > 0) {
    for (const ext of possibleExtractions) {
      steps.push(ext.startsWith("Extract ") ? ext : `Extract ${ext}`);
    }
  }
  const issueSteps = dominantIssue ? REFACTOR_STEPS_BY_ISSUE[dominantIssue] : null;
  if (issueSteps?.length) {
    for (const s of issueSteps) {
      if (!steps.some((x) => x.toLowerCase().includes(s.toLowerCase().slice(0, 15)))) {
        steps.push(s);
      }
    }
  }
  if (steps.length === 0) {
    const split = refactorDirection.split(/[;,]+\s*/).filter((x) => x.trim().length > 10);
    if (split.length >= 2) return split.map((s) => s.trim());
    return [refactorDirection];
  }
  return steps.slice(0, 5);
}

export function computeRefactorPlan(result: ScanResult): RefactorPlan {
  const whatToFixFirst = buildWhatToFixFirst(result);
  const quickWins = buildQuickWins(result);
  const familyRefactorStrategies = buildFamilyRefactorStrategies(result);
  const componentDecompositionHints = buildComponentDecompositionHints(result);

  // Planner sequencing engine – normalize phase facts and sequencing-aware copy
  // for planner JSON/export consumers.
  const topRefactorTargets = buildTopRefactorTargets(result);
  const extractionOpportunities = buildExtractionOpportunities(result);
  const quickWinCatalog = buildQuickWinCatalog(result);

  const phaseFacts = computePlannerPhaseFacts(
    topRefactorTargets,
    quickWinCatalog,
    extractionOpportunities
  );
  const workspaceState = buildWorkspaceSequencingState(phaseFacts);

  const enrichedTopTargets = topRefactorTargets.map((t) => {
    const sequencingCopy =
      t.phase != null
        ? buildTargetSequencingCopy(t.phase, workspaceState) ?? t.whyBeforeAfter
        : t.whyBeforeAfter;
    return {
      ...t,
      whyBeforeAfter: sequencingCopy,
    };
  });

  const enrichedExtractions = extractionOpportunities.map((o) => {
    const sequencingCopy =
      buildExtractionSequencingCopy(workspaceState) ?? o.whyInThisPhase;
    return {
      ...o,
      whyInThisPhase: sequencingCopy,
    };
  });

  return {
    whatToFixFirst,
    quickWins,
    familyRefactorStrategies,
    componentDecompositionHints,
    architectureRefactorPlan: [],
    topRefactorTargets: enrichedTopTargets,
    extractionOpportunities: enrichedExtractions,
  };
}

export function buildTopRefactorTargets(result: ScanResult): TopRefactorTarget[] {
  const lineCountByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.lineCount])
  );
  const dependencyCountByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.dependencyCount])
  );
  const fileNameByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.fileName])
  );
  const severityByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.highestSeverity ?? ""])
  );
  const diagnosticsByPath = new Map(
    (result.diagnosticSummary.componentDiagnostics ?? []).map((d) => [
      d.filePath,
      d,
    ])
  );

  const seenPaths = new Set<string>();
  const candidates: Array<{
        filePath: string;
        riskScore: number;
        lineCount: number;
        diagnostic: (typeof result.diagnosticSummary.topCrossCuttingRisks)[0];
      }> = [];

  for (const d of result.diagnosticSummary.topCrossCuttingRisks) {
    if (seenPaths.has(d.filePath)) continue;
    seenPaths.add(d.filePath);
    const lineCount = lineCountByPath.get(d.filePath) ?? 200;
    const riskScore = getDiagnosticRiskScore(d);
    candidates.push({ filePath: d.filePath, riskScore, lineCount, diagnostic: d });
  }

  for (const c of result.topProblematicComponents) {
    if (seenPaths.has(c.filePath)) continue;
    seenPaths.add(c.filePath);
    const diagnostic = diagnosticsByPath.get(c.filePath);
    const riskScore = diagnostic
      ? getDiagnosticRiskScore(diagnostic)
      : c.lineCount * 0.01;
    candidates.push({
      filePath: c.filePath,
      riskScore,
      lineCount: c.lineCount,
      diagnostic:
      diagnostic ??
      ({
        filePath: c.filePath,
        fileName: c.fileName,
        dominantIssue: null,
        supportingIssues: [],
        refactorDirection: "Review component size and responsibilities.",
        diagnosticLabel: "",
        clusterScores: {
          template_heavy: 0,
          god_component: 0,
          cleanup_risk: 0,
          orchestration_heavy: 0,
          lifecycle_risky: 0,
        },
        totalWarningCount: 0,
        evidence: [],
        decompositionSuggestion: null,
      } as ComponentDiagnostic),
    });
  }

  const crossCuttingPaths = new Set(
    result.diagnosticSummary.topCrossCuttingRisks.map((d) => d.filePath)
  );

  const maxScore =
    candidates.length > 0
      ? Math.max(
          ...candidates.map((c) => c.riskScore + c.lineCount * 0.001)
        )
      : 1;

  const mapped = candidates.map(({ filePath, lineCount, riskScore, diagnostic }) => {
    const componentName = (
      fileNameByPath.get(filePath) ??
      diagnostic.fileName ??
      filePath.split(/[/\\]/).pop() ??
      "unknown"
    ).replace(/\.component\.ts$/i, "");
    const possibleExtractions =
      diagnostic.decompositionSuggestion?.extractedComponents ?? [];
    const dependencyCount = dependencyCountByPath.get(filePath) ?? 0;
    const severity = severityByPath.get(filePath);
    const totalWarningCount = diagnostic.totalWarningCount ?? 0;

    const impact = computeImpactLevel(severity, lineCount, totalWarningCount);
    const effort = computeEffortLevel(diagnostic.dominantIssue, lineCount);
    const isCrossCutting = crossCuttingPaths.has(filePath);
    const phase = computePhase(
      diagnostic.dominantIssue,
      impact,
      effort,
      isCrossCutting
    );
    const roiLabel = computeRoiLabel(impact, effort, isCrossCutting, phase);

    const rawScore = riskScore + lineCount * 0.001;
    const priorityScore = Math.round((rawScore / maxScore) * 100);

    const refactorSteps = buildRefactorSteps(
      diagnostic.dominantIssue,
      diagnostic.refactorDirection,
      possibleExtractions
    );

    const target: TopRefactorTarget = {
      componentName,
      filePath,
      shortPath: shortenPathForDisplay(filePath, result.workspacePath),
      lineCount,
      dependencyCount,
      dominantIssue: diagnostic.dominantIssue,
      suggestedRefactor: diagnostic.refactorDirection,
      refactorSteps,
      possibleExtractions,
      impact,
      effort,
      rankingReason: buildRankingReason(
        severity,
        lineCount,
        dependencyCount,
        totalWarningCount
      ),
      priorityScore,
      whyPrioritized: buildWhyPrioritized(
        severity,
        lineCount,
        dependencyCount,
        totalWarningCount,
        diagnostic.dominantIssue
      ),
      phase,
      roiLabel,
      whyInThisPhase: buildWhyInThisPhase(phase, roiLabel, effort),
      coordinationLabels: buildCoordinationLabels(phase, roiLabel),
      coordinationCost: buildCoordinationCost(phase, roiLabel),
      roleConfidence: diagnostic.roleConfidence,
    };
    return target;
  });

  const sorted = mapped
    .sort((a, b) => {
      const phaseA = a.phase ?? 2;
      const phaseB = b.phase ?? 2;
      if (phaseA !== phaseB) return phaseA - phaseB;
      return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
    })
    .slice(0, TOP_REFACTOR_TARGETS_MAX);

  return enrichTargetsWithDedupeMetadata(sorted, result);
}

export function buildExtractionOpportunities(
  result: ScanResult
): ExtractionOpportunity[] {
  const opportunities: ExtractionOpportunity[] = [];
  const seenPatterns = new Set<string>();

  for (const p of result.featurePatterns ?? []) {
    const key = p.featureName;
    if (seenPatterns.has(key)) continue;
    seenPatterns.add(key);
    if (p.instanceCount < 2) continue;
    const confidence = p.confidence ?? 0.5;
    const bucket = getConfidenceBucket(confidence);
    if (bucket === "low" || bucket === "reviewNeeded") continue;
    const baseWhy =
      p.recommendation ||
      p.architecturalPattern ||
      `Repeated implementations across ${p.instanceCount} components. Extracting shared logic improves consistency and maintainability.`;
    const whyThisMatters =
      bucket === "high"
        ? baseWhy
        : bucket === "medium"
          ? `Likely shared pattern. Verify before refactoring. ${baseWhy}`
          : getConfidenceAwareCopy("extraction-candidate", bucket, "extraction");
    const expectedBenefit = `Fixes ${p.instanceCount} at once`;
    opportunities.push({
      patternName: p.featureName,
      componentCount: p.instanceCount,
      whyThisMatters,
      recommendedExtractions: p.suggestedRefactor ?? [],
      affectedComponents: p.components.map((path) =>
        path.split(/[/\\]/).pop()?.replace(/\.component\.ts$/i, "") ?? path
      ),
      expectedBenefit,
      confidence,
      phase: 3,
      coordinationLabels: ["Phase 3", "Cross-cutting"],
    });
  }

  const familyInsightsByName = new Map(
    (result.componentFamilies ?? []).map((f) => [f.familyName, f] as const)
  );
  for (const family of [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
  ]) {
    if (family.members.length < 2) continue;
    if (family.isWeakGrouping) continue;
    const key = family.familyName;
    if (seenPatterns.has(key)) continue;
    seenPatterns.add(key);
    const insight = familyInsightsByName.get(family.familyName);
    const confidence = family.confidence ?? insight?.confidence ?? 0.5;
    const bucket = getConfidenceBucket(confidence);
    if (bucket === "low" || bucket === "reviewNeeded") continue;
    const template = FAMILY_STRATEGY_TEMPLATES[family.familyName];
    const recommendedExtractions =
      template?.suggestedExtractionTargets ?? [family.refactorDirection];
    const baseWhy =
      template?.patternSummary
        ? `${template.patternSummary} Extracting shared logic fixes multiple components at once.`
        : "Repeated architecture across components. Extracting shared logic reduces duplication and improves maintainability.";
    const whyThisMatters =
      bucket === "high"
        ? baseWhy
        : bucket === "medium"
          ? `Likely shared pattern. Verify before refactoring. ${baseWhy}`
          : getConfidenceAwareCopy("extraction-candidate", bucket, "extraction");
    const expectedBenefit = `Fixes ${family.members.length} at once`;
    opportunities.push({
      patternName: family.familyName,
      componentCount: family.members.length,
      whyThisMatters,
      recommendedExtractions,
      affectedComponents: family.members
        .map((m) => m.fileName?.replace(/\.component\.ts$/i, "") ?? m.filePath.split(/[/\\]/).pop() ?? "")
        .filter(Boolean),
      expectedBenefit,
      confidence,
      phase: 3,
      coordinationLabels: ["Phase 3", "Cross-cutting"],
    });
  }

  return opportunities
    .map(enrichExtractionWithRoi)
    .sort((a, b) => b.componentCount - a.componentCount);
}

function inferDuplicationLevel(componentCount: number): DuplicationLevel {
  if (componentCount >= 6) return "high";
  if (componentCount >= 4) return "medium";
  return "low";
}

function inferExtractionType(recommendedExtractions: string[]): ExtractionType {
  const text = recommendedExtractions.join(" ").toLowerCase();
  if (text.includes("service") || text.includes("facade")) return "service";
  if (text.includes("component") || text.includes("shell") || text.includes("container")) return "shared-component";
  if (text.includes("utility") || text.includes("helper")) return "utility";
  if (text.includes("facade")) return "facade";
  return "service";
}

function enrichExtractionWithRoi(
  o: ExtractionOpportunity
): ExtractionOpportunity {
  return {
    ...o,
    duplicationLevel: inferDuplicationLevel(o.componentCount),
    extractionType: inferExtractionType(o.recommendedExtractions),
  };
}

export function buildQuickWinCatalog(result: ScanResult): QuickWinCatalogItem[] {
  const warningCountByCode = new Map(
    result.commonWarnings.map((w) => [w.code, w.count])
  );

  const subscriptionCount =
    warningCountByCode.get("SUBSCRIPTION_WITHOUT_DESTROY") ??
    [
      ...result.lifecycle.topRisks,
      ...result.lifecycle.manualReview,
    ].filter((r) => r.warnings.some((w) => w.code.includes("SUBSCRIPTION")))
      .length;

  const items: QuickWinCatalogItem[] = [];

  for (const [code, config] of Object.entries(QUICK_WIN_CATALOG)) {
    const count =
      code === "SUBSCRIPTION_WITHOUT_DESTROY"
        ? subscriptionCount
        : warningCountByCode.get(code) ?? 0;
    if (count > 0) {
      const factors = { ...config.eligibilityFactors, filesAffected: count };
      const eligibilityScore = computeQuickWinEligibilityScore(config.eligibilityFactors, count);
      const passesValidation = isQuickWinEligible(
        eligibilityScore,
        config.eligibilityFactors,
        count
      );
      if (!passesValidation) continue;

      const bulkFixPotential =
        count >= 50 ? ("High" as const) : count >= 20 ? ("Medium" as const) : undefined;
      items.push({
        issueName: config.issueName,
        affectedCount: count,
        explanation: config.explanation,
        suggestedFix: config.suggestedFix,
        bulkFixPotential,
        whyMatters: config.whyMatters,
        categoryType: config.categoryType,
        quickWinRationale: config.quickWinRationale,
        eligibilityScore,
        passesValidation,
        phase: 1,
        whyInThisPhase: "Phase 1: safe start",
        coordinationLabels: ["Phase 1", "Safe starting point", "Low coordination"],
      });
    }
  }

  return items.sort((a, b) => b.affectedCount - a.affectedCount);
}

function buildWhatToFixFirst(result: ScanResult): RefactorPriorityItem[] {
  const items: RefactorPriorityItem[] = [];
  let idCounter = 0;

  const lineCountByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.lineCount])
  );

  const respByPath = new Map(
    result.responsibility.topRisks.map((r) => [r.filePath, r])
  );
  const templateByPath = new Map(
    result.template.topRisks.map((r) => [r.filePath, r])
  );

  for (const d of result.diagnosticSummary.topCrossCuttingRisks) {
    if (!d.dominantIssue) continue;

    const lineCount = lineCountByPath.get(d.filePath) ?? 200;
    const resp = respByPath.get(d.filePath);
    const template = templateByPath.get(d.filePath);
    const responsibilityScore = resp?.score ?? 10;
    const templateScore = template?.score ?? 10;

    const impact = computeComponentImpact(
      lineCount,
      responsibilityScore,
      templateScore
    );
    const effort = getEffortForIssue(d.dominantIssue);
    const effortImpactRatio = impact / Math.max(0.5, effort);

    const source =
      d.dominantIssue === "CLEANUP_RISK_COMPONENT"
        ? "lifecycle"
        : d.dominantIssue === "TEMPLATE_HEAVY_COMPONENT"
          ? "template"
          : "responsibility";

    items.push({
      id: `wf-${++idCounter}`,
      type: "component",
      filePath: d.filePath,
      description: `${d.dominantIssue}: ${d.refactorDirection}`,
      impact,
      effort,
      effortImpactRatio,
      source,
    });
  }

  for (const family of result.extractionCandidates) {
    const impact = computeFamilyImpact(family.extractionScore, family.members.length);
    const effort = FAMILY_EXTRACTION_EFFORT;
    const effortImpactRatio = impact / effort;

    items.push({
      id: `wf-${++idCounter}`,
      type: "family",
      familyName: family.familyName,
      description: `Extract shared logic: ${family.refactorDirection}`,
      impact,
      effort,
      effortImpactRatio,
      source: "extraction",
    });
  }

  return items
    .sort((a, b) => b.effortImpactRatio - a.effortImpactRatio)
    .slice(0, WHAT_TO_FIX_FIRST_MAX);
}

function buildQuickWins(result: ScanResult): RefactorQuickWin[] {
  const wins: RefactorQuickWin[] = [];
  const lineCountByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.lineCount])
  );
  const severityByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.highestSeverity ?? ""])
  );

  for (const d of result.diagnosticSummary.topCrossCuttingRisks) {
    if (d.dominantIssue !== "CLEANUP_RISK_COMPONENT") continue;

    const lineCount = lineCountByPath.get(d.filePath) ?? 999;
    const supportingCount = d.supportingIssues?.length ?? 0;
    if (lineCount >= 200 || supportingCount > 1) continue;

    const severity = severityByPath.get(d.filePath);
    const totalWarningCount = d.totalWarningCount ?? 0;
    const impact = computeImpactLevel(severity, lineCount, totalWarningCount);
    const effort = computeEffortLevel(d.dominantIssue, lineCount);
    const phase = computePhase(d.dominantIssue, impact, effort, false);
    if (phase !== 1) continue;

    wins.push({
      filePath: d.filePath,
      shortDescription: "Add takeUntilDestroyed for subscriptions",
      reason: "Safe lifecycle cleanup. Localized change with limited blast radius.",
    });
  }

  for (const r of result.lifecycle.manualReview) {
    const hasHighConfidence = r.warnings.some((w) => w.confidence === "high");
    if (!hasHighConfidence || !r.warnings.some((w) => w.code.includes("SUBSCRIPTION"))) continue;

    const lineCount = lineCountByPath.get(r.filePath) ?? 200;
    if (lineCount >= 200) continue;

    const dominantIssue = "CLEANUP_RISK_COMPONENT" as const;
    const totalWarningCount = r.warnings.length;
    const severity = severityByPath.get(r.filePath);
    const impact = computeImpactLevel(severity, lineCount, totalWarningCount);
    const effort = computeEffortLevel(dominantIssue, lineCount);
    const phase = computePhase(dominantIssue, impact, effort, false);
    if (phase !== 1) continue;

    wins.push({
      filePath: r.filePath,
      shortDescription: "Verify subscription cleanup",
      reason: "Safe lifecycle cleanup. Localized change with limited blast radius.",
    });
  }

  return wins.slice(0, QUICK_WINS_MAX);
}

function buildFamilyRefactorStrategies(
  result: ScanResult
): FamilyRefactorStrategy[] {
  const strategies: FamilyRefactorStrategy[] = [];
  const allFamilies = [
    ...result.extractionCandidates,
    ...result.similarComponentFamilies,
    ...result.repeatedArchitectureHotspots,
  ];

  const seenFamilies = new Set<string>();

  for (const family of allFamilies) {
    const key = family.familyName;
    if (seenFamilies.has(key)) continue;
    seenFamilies.add(key);

    if (!(TARGET_FAMILY_SUFFIXES as readonly string[]).includes(key)) {
      continue;
    }

    const template = FAMILY_STRATEGY_TEMPLATES[key];
    if (!template) continue;

    strategies.push({
      familyName: family.familyName,
      memberCount: family.members.length,
      memberFilePaths: family.members.map((m) => m.filePath),
      extractionScore: family.extractionScore,
      patternSummary: template.patternSummary,
      likelySharedConcerns: template.likelySharedConcerns,
      suggestedExtractionTargets: template.suggestedExtractionTargets,
      suggestedAngularStructure: template.suggestedAngularStructure,
      suggestedRefactorSteps: template.suggestedRefactorSteps,
      expectedBenefits: template.expectedBenefits,
      suggestedCommonExtraction: template.suggestedCommonExtraction,
      suggestedServiceBaseAbstraction: template.suggestedServiceBaseAbstraction,
      suggestedComponentSplitDirection:
        family.refactorDirection || template.suggestedComponentSplitDirection,
    });
  }

  return strategies.sort(
    (a, b) => b.extractionScore - a.extractionScore
  );
}

const DECOMPOSITION_EXPECTED_IMPACT_PERCENT = 60;

function buildComponentDecompositionHints(
  result: ScanResult
): ComponentDecompositionHint[] {
  const hints: ComponentDecompositionHint[] = [];
  const lineCountByPath = new Map(
    result.topProblematicComponents.map((c) => [c.filePath, c.lineCount])
  );

  const respByPath = new Map(
    result.responsibility.topRisks.map((r) => [r.filePath, r])
  );
  const templateByPath = new Map(
    result.template.topRisks.map((r) => [r.filePath, r])
  );

  const decompositionByPath = new Map(
    (result.diagnosticSummary.componentDiagnostics ?? [])
      .filter((d) => d.decompositionSuggestion)
      .map((d) => [d.filePath, d.decompositionSuggestion!] as const)
  );

  const candidates = new Set<string>();
  for (const r of result.responsibility.topRisks) {
    candidates.add(r.filePath);
  }
  for (const t of result.template.topRisks) {
    candidates.add(t.filePath);
  }
  for (const path of Array.from(decompositionByPath.keys())) {
    candidates.add(path);
  }

  for (const filePath of Array.from(candidates)) {
    const resp = respByPath.get(filePath);
    const template = templateByPath.get(filePath);
    const hasDecomposition = decompositionByPath.has(filePath);
    const lineCount =
      lineCountByPath.get(filePath) ??
      resp?.lineCount ??
      template?.metrics?.lineCount ??
      (hasDecomposition ? 600 : 0);

    if (lineCount < DECOMPOSITION_MIN_LINES && !hasDecomposition) continue;

    const responsibilityScore = resp?.score ?? 10;
    if (responsibilityScore >= DECOMPOSITION_MIN_RESPONSIBILITY_SCORE) continue;

    const blocks: string[] = [];
    let suggestedSplit = "";
    let triggerCount = 0;

    const m = resp?.metrics;
    const tm = template?.metrics;

    if (m) {
      if (m.formGroupCount >= 2 && m.formPatchSetUpdateCount >= 5) {
        blocks.push("form logic");
        suggestedSplit =
          "Extract form handling to child component or FormService";
        triggerCount++;
      }
      if (m.serviceOrchestrationCount >= 4) {
        blocks.push("orchestration");
        if (!suggestedSplit) {
          suggestedSplit = "Split container (orchestration) vs presentation";
        }
        triggerCount++;
      }
      if (m.uiStateFieldCount >= 4) {
        blocks.push("UI state");
        if (!suggestedSplit) {
          suggestedSplit = "Extract UI state to dedicated store or child";
        }
        triggerCount++;
      }
      if (m.methodCount >= 15 && m.propertyCount >= 12) {
        blocks.push("presentation", "orchestration");
        if (!suggestedSplit) {
          suggestedSplit = "Split by responsibility; extract event handlers";
        }
        triggerCount++;
      }
    }

    if (tm && tm.lineCount > 80 && tm.structuralDepth > 4) {
      blocks.push("template blocks");
      if (!suggestedSplit) {
        suggestedSplit = "Extract template sections to child components";
      }
      triggerCount++;
    }

    if (blocks.length === 0) {
      if (m && (m.methodCount >= 12 || m.propertyCount >= 10)) {
        blocks.push("presentation", "orchestration");
        suggestedSplit = "Consider splitting by responsibility";
        triggerCount = 1;
      }
    }

    if (blocks.length === 0) continue;

    const confidence: "low" | "medium" | "high" =
      triggerCount >= 2 ? "high" : triggerCount === 1 ? "medium" : "low";

    const fileName = resp?.fileName ?? template?.fileName ?? filePath.split(/[/\\]/).pop() ?? "unknown";

    const familyContext = extractFamilyContextFromFileName(fileName);
    const familyTemplate = familyContext ? FAMILY_STRATEGY_TEMPLATES[familyContext] : undefined;

    const hint: ComponentDecompositionHint = {
      filePath,
      fileName,
      lineCount,
      separableBlocks: Array.from(new Set(blocks)),
      suggestedSplit,
      confidence,
    };

    if (familyTemplate) {
      hint.familyContext = familyContext ?? undefined;
      hint.suggestedBlockDecomposition = familyTemplate.suggestedBlockDecomposition;
      hint.familySpecificHints = familyTemplate.familySpecificHintSnippets.slice(0, 2);
    }

    const decompositionSuggestion = decompositionByPath.get(filePath);
    if (decompositionSuggestion) {
      hint.decompositionSuggestion = decompositionSuggestion;
      hint.expectedImpactPercent = DECOMPOSITION_EXPECTED_IMPACT_PERCENT;
      if (!hint.suggestedSplit && decompositionSuggestion.extractedComponents.length > 0) {
        const extractList = [
          ...decompositionSuggestion.extractedComponents.map((c) => `Extract ${c}`),
          ...decompositionSuggestion.extractedServices.map((s) => `Extract ${s}`),
        ];
        hint.suggestedSplit = extractList.join("; ");
      }
    }

    hints.push(hint);
  }

  return hints.sort((a, b) => b.lineCount - a.lineCount);
}

/** Unified step for first-3-steps list */
export interface PlannerFirstStep {
  label: string;
  phase: RefactorPhase;
  type: "quick-win" | "target" | "extraction";
  /** Actionable copy for display (e.g., "Fix X: do Y") */
  actionableCopy?: string;
}

/** Normalized planner phase facts reused across summary + ROI helpers */
export interface PlannerPhaseFacts {
  hasQuickWins: boolean;
  hasPhase1Targets: boolean;
  hasPhase2Targets: boolean;
  hasPhase3Work: boolean;
  /** Suggested first phase chip; omitted when there is no meaningful work yet. */
  suggestedPhase?: 1 | 2 | 3;
}

/** ROI hints split into immediate vs later-stage extractions */
export interface PlannerRoiHints {
  /** Best immediate starting point (quick win / Phase 1 / Phase 2 / Phase 3-only). */
  bestImmediateStartLabel?: string;
  /** Highest ROI later-stage extraction (Phase 3) when there is also earlier-phase work. */
  bestLaterStageExtractionLabel?: string;
}

/**
 * Compute highest ROI starting point: Phase 1 quick win > Phase 1 target > Phase 2 target > Phase 3 extraction.
 */
export function computeHighestRoiStartingPoint(
  topTargets: TopRefactorTarget[],
  quickWins: QuickWinCatalogItem[],
  extractions: ExtractionOpportunity[]
): string | undefined {
  if (quickWins.length > 0) {
    const q = quickWins[0];
    return `${q.issueName} (${q.affectedCount} affected)`;
  }
  const phase1Target = topTargets.find((t) => t.phase === 1);
  if (phase1Target) return phase1Target.componentName;
  const phase2Target = topTargets.find((t) => t.phase === 2);
  if (phase2Target) return phase2Target.componentName;
  if (extractions.length > 0) {
    const e = extractions[0];
    return `${e.patternName} (${e.componentCount} components)`;
  }
  if (topTargets.length > 0) return topTargets[0].componentName;
  return undefined;
}

/**
 * Compute normalized phase facts based on available planner items.
 * Reused to drive deterministic summary and suggested phase decisions.
 */
export function computePlannerPhaseFacts(
  topTargets: TopRefactorTarget[],
  quickWins: QuickWinCatalogItem[],
  extractions: ExtractionOpportunity[]
): PlannerPhaseFacts {
  const hasQuickWins = quickWins.length > 0;
  const hasPhase1Targets = topTargets.some((t) => t.phase === 1);
  const hasPhase2Targets = topTargets.some((t) => t.phase === 2);
  const hasPhase3Targets = topTargets.some((t) => t.phase === 3);
  const hasPhase3Extractions = extractions.length > 0;
  const hasPhase3Work = hasPhase3Targets || hasPhase3Extractions;

  let suggestedPhase: 1 | 2 | 3 | undefined;
  if (hasQuickWins || hasPhase1Targets) {
    suggestedPhase = 1;
  } else if (hasPhase2Targets) {
    suggestedPhase = 2;
  } else if (hasPhase3Work) {
    suggestedPhase = 3;
  }

  return {
    hasQuickWins,
    hasPhase1Targets,
    hasPhase2Targets,
    hasPhase3Work,
    suggestedPhase,
  };
}

/**
 * Compute immediate vs later-stage ROI hints for planner header.
 * - Best immediate start prefers quick wins → Phase 1 → Phase 2 → Phase 3 (when only work).
 * - Highest ROI later-stage extraction surfaces Phase 3 only when earlier-phase work exists.
 */
export function computePlannerRoiHints(
  topTargets: TopRefactorTarget[],
  quickWins: QuickWinCatalogItem[],
  extractions: ExtractionOpportunity[]
): PlannerRoiHints {
  const facts = computePlannerPhaseFacts(topTargets, quickWins, extractions);
  const { hasQuickWins, hasPhase1Targets, hasPhase2Targets, hasPhase3Work } = facts;

  let bestImmediateStartLabel: string | undefined;
  let bestLaterStageExtractionLabel: string | undefined;

  // Best immediate starting point
  if (hasQuickWins && quickWins.length > 0) {
    const q = quickWins[0];
    bestImmediateStartLabel = `${q.issueName} (${q.affectedCount} affected)`;
  } else if (hasPhase1Targets) {
    const phase1Target = topTargets.find((t) => t.phase === 1);
    if (phase1Target) bestImmediateStartLabel = phase1Target.componentName;
  } else if (hasPhase2Targets) {
    const phase2Target = topTargets.find((t) => t.phase === 2);
    if (phase2Target) bestImmediateStartLabel = phase2Target.componentName;
  } else if (hasPhase3Work) {
    // Only Phase 3 work remains – treat best extraction/target as immediate start.
    if (extractions.length > 0) {
      const e = extractions[0];
      bestImmediateStartLabel = `${e.patternName} (${e.componentCount} components)`;
    } else {
      const phase3Target = topTargets.find((t) => t.phase === 3);
      if (phase3Target) bestImmediateStartLabel = phase3Target.componentName;
      else if (topTargets.length > 0) bestImmediateStartLabel = topTargets[0].componentName;
    }
  } else if (topTargets.length > 0) {
    // Generic fallback when nothing is phase-labelled yet.
    bestImmediateStartLabel = topTargets[0].componentName;
  }

  // Highest ROI later-stage extraction – only when there is earlier-phase work.
  const hasEarlierPhaseWork = hasQuickWins || hasPhase1Targets || hasPhase2Targets;
  if (hasEarlierPhaseWork && extractions.length > 0) {
    const bestExtraction = [...extractions].sort(
      (a, b) => b.componentCount - a.componentCount
    )[0];
    bestLaterStageExtractionLabel = `${bestExtraction.patternName} (${bestExtraction.componentCount} components)`;
  }

  return { bestImmediateStartLabel, bestLaterStageExtractionLabel };
}

/**
 * Build first 3 steps from planner items, phase-ordered, with actionable copy.
 */
export function computeFirstThreeSteps(
  topTargets: TopRefactorTarget[],
  quickWins: QuickWinCatalogItem[],
  extractions: ExtractionOpportunity[]
): PlannerFirstStep[] {
  const steps: PlannerFirstStep[] = [];
  for (const q of quickWins) {
    if (steps.length >= 3) break;
    steps.push({
      label: `${q.issueName} (${q.affectedCount} affected)`,
      phase: 1,
      type: "quick-win",
      actionableCopy: `Fix ${q.issueName}: ${q.suggestedFix}`,
    });
  }
  for (const t of topTargets.filter((x) => x.phase === 1)) {
    if (steps.length >= 3) break;
    const firstStep = t.refactorSteps?.[0] ?? t.possibleExtractions?.[0];
    steps.push({
      label: t.componentName,
      phase: 1,
      type: "target",
      actionableCopy: firstStep
        ? `Refactor ${t.componentName}: ${firstStep.startsWith("Extract ") ? firstStep : `Extract ${firstStep}`}`
        : undefined,
    });
  }
  for (const t of topTargets.filter((x) => x.phase === 2)) {
    if (steps.length >= 3) break;
    const firstStep = t.refactorSteps?.[0] ?? t.possibleExtractions?.[0];
    steps.push({
      label: t.componentName,
      phase: 2,
      type: "target",
      actionableCopy: firstStep
        ? `Refactor ${t.componentName}: ${firstStep.startsWith("Extract ") ? firstStep : `Extract ${firstStep}`}`
        : undefined,
    });
  }
  for (const e of extractions) {
    if (steps.length >= 3) break;
    const firstExtraction = e.recommendedExtractions?.[0];
    steps.push({
      label: `${e.patternName} (${e.componentCount} components)`,
      phase: 3,
      type: "extraction",
      actionableCopy: firstExtraction
        ? `Extract ${e.patternName}: ${firstExtraction.startsWith("Extract ") ? firstExtraction.slice(8) : firstExtraction}`
        : undefined,
    });
  }
  for (const t of topTargets.filter((x) => x.phase === 3)) {
    if (steps.length >= 3) break;
    const firstStep = t.refactorSteps?.[0] ?? t.possibleExtractions?.[0];
    steps.push({
      label: t.componentName,
      phase: 3,
      type: "target",
      actionableCopy: firstStep
        ? `Refactor ${t.componentName}: ${firstStep.startsWith("Extract ") ? firstStep : `Extract ${firstStep}`}`
        : undefined,
    });
  }
  return steps.slice(0, 3);
}

/** Phase-aware planning summary strings */
export interface PlanningSummaryStrings {
  /** Best starting point (component/quick win/extraction name) */
  bestStartingPoint: string;
  /** Why start here – rationale for beginning at this point */
  whyStartHere: string;
  /** What unlocks later – what becomes possible after this phase */
  whatUnlocksLater?: string;
  /** Legacy: same as whyStartHere for backward compatibility */
  whereToStart: string;
  /** Legacy: same as whatUnlocksLater */
  whatComesNext?: string;
  crossCuttingNote?: string;
}

/**
 * Build phase-aware summary strings for the planner.
 */
export function computePlanningSummaryStrings(
  topTargets: TopRefactorTarget[],
  quickWins: QuickWinCatalogItem[],
  extractions: ExtractionOpportunity[],
  roiHints?: PlannerRoiHints
): PlanningSummaryStrings {
  const facts = computePlannerPhaseFacts(topTargets, quickWins, extractions);
  const { hasQuickWins, hasPhase1Targets, hasPhase2Targets, hasPhase3Work } = facts;

  const bestStartingPoint =
    roiHints?.bestImmediateStartLabel ??
    computeHighestRoiStartingPoint(topTargets, quickWins, extractions) ??
    "Top refactor targets";

  let whyStartHere: string;
  type StartCategory = "quickWins" | "phase1" | "phase2" | "phase3" | "generic";
  let startCategory: StartCategory = "generic";

  if (hasQuickWins) {
    whyStartHere = "Begin with quick wins to build momentum — low effort, minimal coordination.";
    startCategory = "quickWins";
  } else if (hasPhase1Targets) {
    whyStartHere =
      "Start with 1–2 Phase 1 component fixes — low coordination, safe to begin.";
    startCategory = "phase1";
  } else if (hasPhase2Targets) {
    whyStartHere = "Start with 1–2 high-impact Phase 2 component fixes.";
    startCategory = "phase2";
  } else if (hasPhase3Work) {
    whyStartHere =
      "Start with 1–2 cross-cutting extractions — no Phase 1–2 component refactors detected.";
    startCategory = "phase3";
  } else {
    whyStartHere = "Use this plan as your execution roadmap.";
    startCategory = "generic";
  }

  let whatUnlocksLater: string | undefined;
  const startIsEarlyPhase = startCategory === "quickWins" || startCategory === "phase1";
  const startIsEarlyOrMidPhase =
    startCategory === "quickWins" ||
    startCategory === "phase1" ||
    startCategory === "phase2";

  if (startIsEarlyPhase && hasPhase2Targets) {
    whatUnlocksLater = "Then tackle high-impact component refactors (Phase 2).";
  } else if (startIsEarlyOrMidPhase && hasPhase3Work) {
    whatUnlocksLater = "Then consolidate repeated patterns with Phase 3 extractions.";
  }

  let crossCuttingNote: string | undefined;
  if (hasPhase3Work && (hasQuickWins || hasPhase1Targets || hasPhase2Targets)) {
    crossCuttingNote =
      "Use Phase 3 cross-cutting extractions after local complexity is reduced.";
  } else if (hasPhase3Work) {
    crossCuttingNote =
      "Your main opportunities are Phase 3 cross-cutting extractions — coordinate with the team before large shared changes.";
  }

  return {
    bestStartingPoint,
    whyStartHere,
    whatUnlocksLater,
    whereToStart: whyStartHere,
    whatComesNext: whatUnlocksLater,
    crossCuttingNote,
  };
}

/** Quick wins empty state copy when no quick wins exist */
export interface QuickWinsEmptyStateCopy {
  whyNoQuickWins: string;
  reassurance: string;
  bestFirstStep: string;
}

/**
 * Compute context-aware copy for the quick wins empty state.
 */
export function computeQuickWinsEmptyStateCopy(
  topTargets: TopRefactorTarget[],
  extractions: ExtractionOpportunity[],
  phaseFacts: PlannerPhaseFacts,
  roiHints?: PlannerRoiHints
): QuickWinsEmptyStateCopy {
  const bestFirstStep =
    roiHints?.bestImmediateStartLabel ??
    (topTargets.length > 0
      ? topTargets[0].componentName
      : extractions.length > 0
        ? `${extractions[0].patternName} (${extractions[0].componentCount} components)`
        : "Top refactor targets");

  return {
    whyNoQuickWins:
      "No low-effort, low-coordination quick wins were identified (e.g., subscription cleanup, trackBy fixes).",
    reassurance:
      "Start with Top Refactor Targets or Extraction Opportunities for higher-impact work.",
    bestFirstStep,
  };
}
