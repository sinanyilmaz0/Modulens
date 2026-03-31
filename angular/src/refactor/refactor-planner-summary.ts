import type {
  TopRefactorTarget,
  ExtractionOpportunity,
  QuickWinCatalogItem,
  RefactorPhase,
} from "./refactor-plan-models";

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
    if (extractions.length > 0) {
      const e = extractions[0];
      bestImmediateStartLabel = `${e.patternName} (${e.componentCount} components)`;
    } else {
      const phase3Target = topTargets.find((t) => t.phase === 3);
      if (phase3Target) bestImmediateStartLabel = phase3Target.componentName;
      else if (topTargets.length > 0) bestImmediateStartLabel = topTargets[0].componentName;
    }
  } else if (topTargets.length > 0) {
    bestImmediateStartLabel = topTargets[0].componentName;
  }

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
  bestStartingPoint: string;
  whyStartHere: string;
  whatUnlocksLater?: string;
  whereToStart: string;
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
  _phaseFacts: PlannerPhaseFacts,
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
