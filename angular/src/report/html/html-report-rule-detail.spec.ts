import { strict as assert } from "node:assert";
import { createAnalysisSnapshot } from "../../core/analysis-snapshot";
import type { ScanResult } from "../../core/scan-result";
import { renderHtmlReport } from "./html-report-view";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

/** Minimal ScanResult aligned with analysis-snapshot.spec for HTML smoke tests. */
function createMinimalResult(overrides: Partial<ScanResult> = {}): ScanResult {
  const base: ScanResult = {
    workspacePath: "/test/workspace",
    generatedAt: new Date().toISOString(),
    workspaceSummary: {
      projectCount: 1,
      componentCount: 10,
      riskLevel: "Low",
      totalFindings: 25,
    },
    scores: {
      overall: 8,
      component: { score: 8, factors: [] },
      lifecycle: { score: 8, factors: [] },
      template: { score: 8, factors: [] },
      responsibility: { score: 8, factors: [] },
    },
    projectBreakdown: [
      {
        sourceRoot: "app",
        components: 10,
        componentsWithFindings: 5,
        lifecycleTargets: 10,
        lifecycleFindings: 10,
        templateFindings: 8,
        responsibilityFindings: 7,
      },
    ],
    topProblematicComponents: [],
    diagnosticSummary: {
      componentsWithDominantIssue: 5,
      totalComponents: 10,
      dominantIssueCounts: {
        TEMPLATE_HEAVY_COMPONENT: 2,
        GOD_COMPONENT: 1,
        CLEANUP_RISK_COMPONENT: 1,
        ORCHESTRATION_HEAVY_COMPONENT: 1,
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
        totalLifecycleTargets: 10,
        likelyUnmanagedSubscriptions: 0,
      },
    },
    template: { summary: {} as never, topRisks: [] },
    responsibility: { summary: {} as never, topRisks: [] },
    commonWarnings: [],
    ruleViolationCounts: { "rule-a": 15, "rule-b": 10 },
    warningsAndRecommendations: [],
    componentsBySeverity: { warning: 6, high: 3, critical: 1 },
  };
  return { ...base, ...overrides } as ScanResult;
}

console.log("html-report-rule-detail");

test("HTML embeds resolveRuleTitle and rule drawer trigger for related rules", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const html = renderHtmlReport(snapshot);
  assert.ok(html.includes("function resolveRuleTitle"));
  assert.ok(html.includes("rule-drawer-detail-trigger"));
  assert.ok(html.includes("drawer-related-rule-filter-link"));
  assert.ok(html.includes("Show in component list"));
});

test("HTML embeds rule detail copy keys for unknown-rule fallback", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const html = renderHtmlReport(snapshot);
  assert.ok(html.includes("ruleDetailUnknownBody"));
  assert.ok(html.includes("not in the Modulens rule catalog"));
  assert.ok(html.includes("ruleDetailLimited"));
});

test("HTML rule detail uses collapsible more section", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const html = renderHtmlReport(snapshot);
  assert.ok(html.includes("rule-detail-more"));
  assert.ok(html.includes("Examples and technical detail"));
});
