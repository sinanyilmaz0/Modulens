import { strict as assert } from "node:assert";
import { renderPlanningSummary, renderSecondaryMetricCards, renderStructureConcernCard } from "./templates";
import { getTranslations } from "./i18n/translations";
import type { StructureConcern } from "../../core/structure-models";
import type { PlannerPhaseFacts, PlannerRoiHints, PlannerFirstStep, PlanningSummaryStrings } from "../../refactor/refactor-planner";
import type { WorkspaceSequencingState } from "../../refactor/sequencing-copy";
import { buildWorkspaceSequencingState, buildTargetSequencingCopy, buildExtractionSequencingCopy } from "../../refactor/sequencing-copy";

console.log("overview-metrics");

const t = getTranslations();

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("critical components card uses shortlist label and helper text", () => {
  const html = renderSecondaryMetricCards(
    { componentCount: 100, totalFindings: 250 },
    { componentsWithDominantIssue: 40, totalComponents: 100 },
    7,
    t
  );

  const label = t.overview.criticalComponents;
  assert.ok(
    label.toLowerCase().includes("top"),
    "label should indicate top-risk shortlist, not raw critical count"
  );
  assert.ok(
    html.includes(label),
    "rendered HTML should include the shortlist label"
  );
  assert.ok(
    html.includes(String(7)),
    "HTML should display the shortlist size"
  );
  assert.ok(
    html.toLowerCase().includes("up to 10") ||
      html.toLowerCase().includes("max 10"),
    "helper text should mention the shortlist cap"
  );
  // Secondary copy may evolve; primary expectation is that HTML renders without error.
  assert.ok(html.length > 0, "secondary metrics card HTML should render");
});

test("structure card chips derive from affectedAreasWithCounts, not raw affectedAreas", () => {
  const t = getTranslations();
  const concern: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: ["/app/features/admin/dashboard.component.ts", "/app/features/admin/users.component.ts", "/app/features/reports/report.component.ts"],
    affectedCount: 3,
    explanation: "Test concern",
    whyItMatters: "Test",
    refactorDirection: "Test refactor direction.",
    samplePaths: ["/app/features/admin/dashboard.component.ts"],
    affectedAreas: ["admin", "legacy-feature"],
    affectedAreasWithCounts: [
      { area: "admin", count: 2 },
      { area: "reports", count: 1 },
    ],
    confidence: "medium",
  };

  const html = renderStructureConcernCard(concern, t, false);

  assert.ok(
    html.includes("admin") && html.includes("reports"),
    "card should render canonical areas from affectedAreasWithCounts"
  );
  assert.ok(
    html.includes("2") && html.includes("1"),
    "card should render counts from affectedAreasWithCounts"
  );
  assert.ok(
    !html.includes("legacy-feature"),
    "card should not render raw affectedAreas labels"
  );
});

test("structure card falls back to generic label when area inference is weak", () => {
  const t = getTranslations();
  const concern: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: Array.from({ length: 10 }, (_, i) => `/app/other/file-${i}.component.ts`),
    affectedCount: 10,
    explanation: "Test concern",
    whyItMatters: "Test",
    refactorDirection: "Test refactor direction.",
    samplePaths: ["/app/other/file-0.component.ts"],
    affectedAreasWithCounts: [{ area: "other", count: 10 }],
    confidence: "medium",
  };

  const html = renderStructureConcernCard(concern, t, false);
  const fallback = t.structure.multipleAreasAffected || "Multiple areas affected";

  assert.ok(
    html.includes(fallback),
    "card should show Multiple areas affected when inference is weak/other-only"
  );
});

test("planner sequencing copy adapts when there are no Phase 1–2 targets", () => {
  const phaseFacts: PlannerPhaseFacts = {
    hasQuickWins: false,
    hasPhase1Targets: false,
    hasPhase2Targets: false,
    hasPhase3Work: true,
    suggestedPhase: 3,
  };
  const roiHints: PlannerRoiHints = {
    bestImmediateStartLabel: "*-form (8 components)",
    bestLaterStageExtractionLabel: undefined,
  };
  const firstSteps: PlannerFirstStep[] = [
    { label: "*-form (8 components)", phase: 3, type: "extraction" },
  ];
  const summaryStrings: PlanningSummaryStrings = {
    bestStartingPoint: "*-form (8 components)",
    whyStartHere:
      "Start with 1–2 cross-cutting extractions — no Phase 1–2 component refactors detected.",
    whatUnlocksLater: undefined,
    whereToStart:
      "Start with 1–2 cross-cutting extractions — no Phase 1–2 component refactors detected.",
    whatComesNext: undefined,
    crossCuttingNote:
      "Your main opportunities are Phase 3 cross-cutting extractions — coordinate with the team before large shared changes.",
  };
  const sequencingState: WorkspaceSequencingState = buildWorkspaceSequencingState(phaseFacts);

  const html = renderPlanningSummary({
    topCount: 8,
    quickWinCount: 0,
    extractionCount: 1,
    highestRoiHint: undefined,
    bestImmediateStartHint: roiHints.bestImmediateStartLabel,
    highestRoiLaterHint: roiHints.bestLaterStageExtractionLabel,
    suggestedPhase: phaseFacts.suggestedPhase,
    bestStartingPoint: summaryStrings.bestStartingPoint,
    whyStartHere: summaryStrings.whyStartHere,
    whatUnlocksLater: summaryStrings.whatUnlocksLater,
    whereToStart: summaryStrings.whereToStart,
    whatComesNext: summaryStrings.whatComesNext,
    crossCuttingNote: summaryStrings.crossCuttingNote,
    firstSteps: firstSteps.map((s) => ({ label: s.label, phase: s.phase })),
    labels: {
      topTargets: t.planner.planningSummaryTopTargets,
      quickWins: t.planner.planningSummaryQuickWins,
      extractionGroups: t.planner.planningSummaryExtractionGroups,
      highestRoi: t.planner.planningSummaryHighestRoi,
      bestImmediateStart: t.planner.planningSummaryBestImmediateStart,
      highestRoiLater: t.planner.planningSummaryHighestRoiLater,
      suggestedPhase: t.planner.planningSummarySuggestedPhase,
      phase1: t.planner.planningSummaryPhase1,
      phase2: t.planner.planningSummaryPhase2,
      phase3: t.planner.planningSummaryPhase3,
      firstStepsTitle: t.planner.planningSummaryFirstStepsTitle,
    },
  });

  const targetSequencing = buildTargetSequencingCopy(3, sequencingState) ?? "";
  const extractionSequencing = buildExtractionSequencingCopy(sequencingState) ?? "";

  assert.ok(
    html.includes("Suggested first phase") && html.includes("Phase 3"),
    "planner summary should point to Phase 3 when that is the first phase with work"
  );
  assert.ok(
    summaryStrings.whereToStart.includes("no Phase 1–2 component refactors detected"),
    "summary whereToStart should explicitly mention absence of Phase 1–2 work"
  );
  assert.ok(
    targetSequencing.includes("no Phase 1–2 blockers"),
    "target sequencing copy should acknowledge no Phase 1–2 blockers when none exist"
  );
  assert.ok(
    extractionSequencing.includes("no earlier Phase 1–2 refactors"),
    "extraction sequencing copy should acknowledge no earlier Phase 1–2 refactors when none exist"
  );
});

