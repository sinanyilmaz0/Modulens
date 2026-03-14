import { strict as assert } from "node:assert";
import { validateMetricsConsistency } from "./metrics-validation";
import type { ScanResult } from "./scan-result";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
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
      componentCount: 100,
      riskLevel: "Low",
      totalFindings: 50,
    },
    scores: { overall: 8, component: { score: 8, factors: [] }, lifecycle: { score: 8, factors: [] }, template: { score: 8, factors: [] }, responsibility: { score: 8, factors: [] } },
    projectBreakdown: [],
    topProblematicComponents: [],
    diagnosticSummary: {
      componentsWithDominantIssue: 0,
      totalComponents: 100,
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
    lifecycle: { summary: {} as never, topRisks: [], manualReview: [], cleanupStats: { verifiedCleanupTargets: 0, totalLifecycleTargets: 0, likelyUnmanagedSubscriptions: 0 } },
    template: { summary: {} as never, topRisks: [] },
    responsibility: { summary: {} as never, topRisks: [] },
    commonWarnings: [],
    ruleViolationCounts: { "rule-a": 50 },
    warningsAndRecommendations: [],
    componentsBySeverity: { warning: 30, high: 15, critical: 5 },
  };
  return { ...base, ...overrides } as ScanResult;
}

console.log("validateMetricsConsistency");

test("valid when totalFindings matches ruleViolationCounts sum", () => {
  const result = createMinimalResult({
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 50 },
    ruleViolationCounts: { "rule-a": 30, "rule-b": 20 },
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.warnings.length, 0);
});

test("valid when componentsBySeverity sum <= componentCount", () => {
  const result = createMinimalResult({
    componentsBySeverity: { warning: 30, high: 15, critical: 5 },
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 50 },
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, true);
});

test("warns when componentsBySeverity sum exceeds componentCount", () => {
  const result = createMinimalResult({
    componentsBySeverity: { warning: 60, high: 30, critical: 20 },
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 50 },
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, false);
  assert.ok(r.warnings.some((w) => w.includes("componentsBySeverity")));
});

test("warns when projectBreakdown componentsWithFindings exceeds components", () => {
  const result = createMinimalResult({
    projectBreakdown: [
      { sourceRoot: "app", components: 10, componentsWithFindings: 15, lifecycleTargets: 10, lifecycleFindings: 5, templateFindings: 3, responsibilityFindings: 2 },
    ],
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, false);
  assert.ok(r.warnings.some((w) => w.includes("componentsWithFindings")));
});

test("valid when projectBreakdown componentsWithFindings <= components", () => {
  const result = createMinimalResult({
    projectBreakdown: [
      { sourceRoot: "app", components: 10, componentsWithFindings: 5, lifecycleTargets: 10, lifecycleFindings: 5, templateFindings: 3, responsibilityFindings: 2 },
    ],
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 50 },
    ruleViolationCounts: { "rule-a": 30, "rule-b": 20 },
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, true);
});

test("warns when totalFindings differs from ruleViolationCounts sum", () => {
  const result = createMinimalResult({
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 50 },
    ruleViolationCounts: { "rule-a": 30, "rule-b": 19 },
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, false);
  assert.ok(r.warnings.some((w) => w.includes("totalFindings") && w.includes("ruleViolationCounts")));
});

test("valid when totalFindings and ruleViolationCounts sum are both zero", () => {
  const result = createMinimalResult({
    workspaceSummary: { projectCount: 1, componentCount: 100, riskLevel: "Low", totalFindings: 0 },
    ruleViolationCounts: {},
  });
  const r = validateMetricsConsistency(result);
  assert.strictEqual(r.valid, true);
});
