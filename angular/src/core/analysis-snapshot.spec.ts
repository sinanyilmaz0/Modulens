import { strict as assert } from "node:assert";
import {
  createAnalysisSnapshot,
  parseSnapshot,
  CURRENT_SNAPSHOT_VERSION,
} from "./analysis-snapshot";
import type { ScanResult } from "./scan-result";
import { renderHtmlReport } from "../report/html/html-report-view";
import { JsonFormatter } from "../formatters/json-formatter";

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

console.log("analysis-snapshot");

test("createAnalysisSnapshot produces snapshot with runId, meta, hash", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  assert.ok(snapshot.runId);
  assert.ok(snapshot.snapshotHash);
  assert.strictEqual(snapshot.snapshotVersion, CURRENT_SNAPSHOT_VERSION);
  assert.strictEqual(snapshot.meta.runId, snapshot.runId);
  assert.strictEqual(snapshot.meta.workspacePath, result.workspacePath);
  assert.strictEqual(snapshot.meta.generatedAt, result.generatedAt);
  assert.ok(snapshot.meta.analyzerVersion);
});

test("same result => same hash (deterministic)", () => {
  const result = createMinimalResult();
  const s1 = createAnalysisSnapshot(result);
  const s2 = createAnalysisSnapshot(result);
  assert.strictEqual(s1.snapshotHash, s2.snapshotHash, "identical input must produce identical hash");
});

test("different data => different hash", () => {
  const r1 = createMinimalResult({ workspaceSummary: { projectCount: 1, componentCount: 10, riskLevel: "Low", totalFindings: 25 } });
  const r2 = createMinimalResult({ workspaceSummary: { projectCount: 1, componentCount: 10, riskLevel: "Low", totalFindings: 30 } });
  const s1 = createAnalysisSnapshot(r1);
  const s2 = createAnalysisSnapshot(r2);
  assert.notStrictEqual(s1.snapshotHash, s2.snapshotHash);
});

test("snapshot contains precomputed sections, componentDetailsMap, patternData", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  assert.ok(Array.isArray(snapshot.sections));
  assert.ok(snapshot.sections.length > 0);
  assert.ok(typeof snapshot.componentDetailsMap === "object");
  assert.ok(snapshot.patternData);
  assert.ok("patterns" in snapshot.patternData);
  assert.ok(Array.isArray(snapshot.componentsExplorerItems));
});

test("same snapshot => same totals in HTML and JSON", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  const html = renderHtmlReport(snapshot);
  const jsonStr = new JsonFormatter().format(snapshot);
  const json = JSON.parse(jsonStr);

  assert.strictEqual(json._meta.runId, snapshot.runId);
  assert.strictEqual(json.result.workspaceSummary.totalFindings, result.workspaceSummary.totalFindings);
  assert.strictEqual(json.result.workspaceSummary.componentCount, result.workspaceSummary.componentCount);
  assert.ok(html.includes(String(result.workspaceSummary.totalFindings)));
  assert.ok(html.includes(String(result.workspaceSummary.componentCount)));
});

test("componentsBySeverity.critical is preserved in snapshot JSON", () => {
  const result = createMinimalResult({
    componentsBySeverity: { warning: 2, high: 1, critical: 2 },
  });

  const snapshot = createAnalysisSnapshot(result);
  const formatter = new JsonFormatter();
  const json = JSON.parse(formatter.format(snapshot));

  const exported = json.result as typeof result;
  assert.strictEqual(
    exported.componentsBySeverity.critical,
    result.componentsBySeverity.critical
  );
});

test("HTML contains __REPORT_META__ and run-id meta tag", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  const html = renderHtmlReport(snapshot);
  assert.ok(html.includes("__REPORT_META__"));
  assert.ok(html.includes(snapshot.runId));
  assert.ok(html.includes('name="modulens-run-id"'));
});

test("parseSnapshot accepts version 1 snapshot", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  const json = JSON.stringify(snapshot);
  const parsed = parseSnapshot(json);
  assert.strictEqual(parsed.runId, snapshot.runId);
  assert.strictEqual(parsed.snapshotHash, snapshot.snapshotHash);
});

test("parseSnapshot migrates old format (result at root)", () => {
  const result = createMinimalResult();
  const oldFormat = JSON.stringify(result);
  const parsed = parseSnapshot(oldFormat);
  assert.ok(parsed.runId);
  assert.ok(parsed.snapshotHash);
  assert.strictEqual(parsed.result.workspacePath, result.workspacePath);
});
