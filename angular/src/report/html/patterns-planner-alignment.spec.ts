import { strict as assert } from "node:assert";
import type { ScanResult } from "../../core/scan-result";
import { prepareSections } from "./html-report-presenter";
import { buildExtractionOpportunities } from "../../refactor/refactor-planner";
import { getTranslations } from "./i18n/translations";
import { renderPatternsPage } from "./html-report-view";

function test(name: string, fn: () => void): void {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

function createMinimalResult(overrides: Partial<ScanResult> = {}): ScanResult {
  const base: ScanResult = {
    workspacePath: "/test",
    generatedAt: new Date().toISOString(),
    workspaceSummary: {
      projectCount: 1,
      componentCount: 10,
      riskLevel: "Low",
      totalFindings: 0,
    },
    scores: {
      overall: 8,
      component: { score: 8, factors: [] },
      lifecycle: { score: 8, factors: [] },
      template: { score: 8, factors: [] },
      responsibility: { score: 8, factors: [] },
    },
    projectBreakdown: [],
    topProblematicComponents: [],
    diagnosticSummary: {
      componentsWithDominantIssue: 0,
      totalComponents: 10,
      dominantIssueCounts: {
        TEMPLATE_HEAVY_COMPONENT: 0,
        GOD_COMPONENT: 0,
        CLEANUP_RISK_COMPONENT: 0,
        ORCHESTRATION_HEAVY_COMPONENT: 0,
        LIFECYCLE_RISKY_COMPONENT: 0,
      },
      topCrossCuttingRisks: [],
    },
    similarComponentFamilies: [],
    repeatedArchitectureHotspots: [],
    extractionCandidates: [],
    lifecycle: {
      summary: {} as never,
      topRisks: [],
      manualReview: [],
      cleanupStats: {
        verifiedCleanupTargets: 0,
        totalLifecycleTargets: 0,
        likelyUnmanagedSubscriptions: 0,
      },
    },
    template: { summary: {} as never, topRisks: [] },
    responsibility: { summary: {} as never, topRisks: [] },
    commonWarnings: [],
    ruleViolationCounts: {},
    warningsAndRecommendations: [],
    componentsBySeverity: { warning: 0, high: 0, critical: 0 },
    ruleToAffectedComponents: {},
    architectureHotspots: [],
    familyRefactorPlaybooks: [],
    architectureRoadmap: [],
    featurePatterns: [],
    componentFamilies: [],
    refactorTasks: [],
    refactorPlan: {
      whatToFixFirst: [],
      quickWins: [],
      familyRefactorStrategies: [],
      componentDecompositionHints: [],
      architectureRefactorPlan: [],
    },
    architectureSmells: [],
    architectureSmellSummary: undefined,
    refactorROI: [],
    refactorBlueprints: [],
    structureConcerns: undefined,
  };
  return { ...base, ...overrides } as ScanResult;
}

console.log("patterns-planner-alignment");

test("high-confidence feature pattern appears in both Patterns and Planner extraction opportunities", () => {
  const featurePattern = {
    patternType: "LIST_PAGE_PATTERN",
    featureName: "List Page Feature",
    instanceCount: 3,
    confidence: 0.8,
    components: ["ListPageComponentA", "ListPageComponentB", "ListPageComponentC"],
    filePaths: ["/app/a-list.component.ts", "/app/b-list.component.ts", "/app/c-list.component.ts"],
    sharedSignals: [],
    architecturalPattern: "List Container + Filter/Search + Pagination",
    duplicationRisk: "high" as const,
    recommendation: "Extract shared list module",
    suggestedRefactor: ["Create shared list module"],
  };

  const result = createMinimalResult({
    featurePatterns: [featurePattern],
  });

  const sections = prepareSections(result);
  const featureSection = sections.find((s) => s.id === "feature-patterns");
  assert.ok(featureSection, "feature-patterns section should exist");
  const featureItems = (featureSection!.items ?? []) as typeof featurePattern[];
  assert.strictEqual(
    featureItems.length,
    1,
    "high-confidence feature pattern should appear in Patterns feature section"
  );

  const extractionOpps = buildExtractionOpportunities(result);
  const fromPatterns = extractionOpps.filter((e) => e.patternName === featurePattern.featureName);
  assert.strictEqual(
    fromPatterns.length,
    1,
    "high-confidence feature pattern should contribute an extraction opportunity in planner"
  );
});

test("medium-confidence feature pattern is planner-only extraction opportunity and hidden in Patterns feature section", () => {
  const mediumPattern = {
    patternType: "LIST_PAGE_PATTERN",
    featureName: "Medium List Feature",
    instanceCount: 3,
    confidence: 0.5,
    components: ["ListPageComponentA", "ListPageComponentB", "ListPageComponentC"],
    filePaths: ["/app/a-list.component.ts", "/app/b-list.component.ts", "/app/c-list.component.ts"],
    sharedSignals: [],
    architecturalPattern: "List Container + Filter/Search + Pagination",
    duplicationRisk: "medium" as const,
    recommendation: "Extract shared list module",
    suggestedRefactor: ["Create shared list module"],
  };

  const result = createMinimalResult({
    featurePatterns: [mediumPattern],
  });

  const sections = prepareSections(result);
  const featureSection = sections.find((s) => s.id === "feature-patterns");
  assert.ok(featureSection, "feature-patterns section should exist");
  const featureItems = (featureSection!.items ?? []) as typeof mediumPattern[];
  assert.strictEqual(
    featureItems.length,
    0,
    "medium-confidence feature pattern should be filtered out from Patterns feature section"
  );

  const extractionOpps = buildExtractionOpportunities(result);
  const fromPatterns = extractionOpps.filter((e) => e.patternName === mediumPattern.featureName);
  assert.strictEqual(
    fromPatterns.length,
    1,
    "medium-confidence feature pattern should still appear as planner extraction opportunity"
  );
});

test("Patterns empty state explains strong-only scope when no feature patterns are shown", () => {
  const t = getTranslations();
  const result = createMinimalResult({
    featurePatterns: [],
  });

  const sections = [
    { id: "architecture-patterns", items: [] },
    { id: "feature-patterns", items: [] },
  ];

  const html = renderPatternsPage(
    result,
    sections,
    t,
    (issue) => issue ?? "",
    (name) => name,
    { patterns: {} }
  );

  assert.ok(
    html.includes("No strong repeated feature implementations detected."),
    "Patterns page should use strong-only empty state message for repeated feature implementations"
  );
  assert.ok(
    html.includes("Broader extraction opportunities for planning may still appear in the Refactor Plan.") ||
      html.includes("Broader extraction opportunities may still appear in the Refactor Plan."),
    "Patterns empty state should explain that broader planning opportunities may exist in Refactor Plan"
  );
});

