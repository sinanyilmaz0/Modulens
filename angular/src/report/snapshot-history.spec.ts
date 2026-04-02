import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  extractSnapshotSummary,
  filterSummariesForWorkspace,
  listWorkspaceSnapshotSummaries,
  normalizeWorkspacePathKey,
} from "./snapshot-history";
import { getSnapshotDirectory } from "../cli/snapshot-file";
import { createAnalysisSnapshot } from "../core/analysis-snapshot";
import type { ScanResult } from "../core/scan-result";
import type { SnapshotComparisonPayload } from "./snapshot-compare";
import { renderHtmlReport } from "./html/html-report-view";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("report/snapshot-history");

function createMinimalResult(overrides: Partial<ScanResult> = {}): ScanResult {
  const base: ScanResult = {
    workspacePath: "/test/workspace",
    generatedAt: "2026-04-01T14:22:31.123Z",
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

test("normalizeWorkspacePathKey lowercases and normalizes slashes", () => {
  const a = normalizeWorkspacePathKey("C:\\\\Foo\\\\Bar");
  const b = normalizeWorkspacePathKey("c:/foo/bar");
  assert.strictEqual(a, b);
});

test("extractSnapshotSummary reads public JSON shape", () => {
  const parsed = {
    schemaVersion: 1,
    metadata: {
      runId: "r1",
      workspacePath: "/proj/ws",
      generatedAt: "2026-01-15T10:00:00.000Z",
      snapshotHash: "abc123def456",
      toolVersion: "0.2.0",
    },
    workspace: {
      summary: { totalFindings: 42, riskLevel: "High", projectCount: 1, componentCount: 5 },
    },
    health: {
      riskLevel: "High",
      scores: { overall: 6.5, component: { score: 6, factors: [] }, lifecycle: { score: 7, factors: [] }, template: { score: 6, factors: [] }, responsibility: { score: 7, factors: [] } },
    },
  };
  const s = extractSnapshotSummary(parsed, "snap.json", "/x/snap.json");
  assert.ok(s);
  if (!s) return;
  assert.strictEqual(s.fileName, "snap.json");
  assert.strictEqual(s.absolutePath, "/x/snap.json");
  assert.strictEqual(s.generatedAt, "2026-01-15T10:00:00.000Z");
  assert.strictEqual(s.workspacePath, "/proj/ws");
  assert.strictEqual(s.snapshotHash, "abc123def456");
  assert.strictEqual(s.runId, "r1");
  assert.strictEqual(s.totalFindings, 42);
  assert.strictEqual(s.riskLevel, "High");
  assert.strictEqual(s.overallScore, 6.5);
});

test("listWorkspaceSnapshotSummaries skips invalid JSON and sorts newest first", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-hist-"));
  const dir = getSnapshotDirectory(tmp);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "bad.txt"),
    "not json",
    "utf-8"
  );
  fs.writeFileSync(
    path.join(dir, "bad.json"),
    "{ not json",
    "utf-8"
  );
  const older = {
    metadata: {
      generatedAt: "2020-01-01T00:00:00.000Z",
      workspacePath: tmp,
      snapshotHash: "aaaaaaaaaaaaaaaa",
      runId: "a",
    },
    workspace: { summary: { totalFindings: 1, riskLevel: "Low", projectCount: 1, componentCount: 1 } },
    health: { scores: { overall: 5, component: { score: 5, factors: [] }, lifecycle: { score: 5, factors: [] }, template: { score: 5, factors: [] }, responsibility: { score: 5, factors: [] } } },
  };
  const newer = {
    metadata: {
      generatedAt: "2026-06-01T12:00:00.000Z",
      workspacePath: tmp,
      snapshotHash: "bbbbbbbbbbbbbbbb",
      runId: "b",
    },
    workspace: { summary: { totalFindings: 2, riskLevel: "Medium", projectCount: 1, componentCount: 2 } },
    health: { scores: { overall: 7, component: { score: 7, factors: [] }, lifecycle: { score: 7, factors: [] }, template: { score: 7, factors: [] }, responsibility: { score: 7, factors: [] } } },
  };
  fs.writeFileSync(path.join(dir, "older.json"), JSON.stringify(older), "utf-8");
  fs.writeFileSync(path.join(dir, "newer.json"), JSON.stringify(newer), "utf-8");

  const all = listWorkspaceSnapshotSummaries(tmp);
  assert.strictEqual(all.length, 2);
  assert.strictEqual(all[0].fileName, "newer.json");
  assert.strictEqual(all[1].fileName, "older.json");

  const excluded = listWorkspaceSnapshotSummaries(tmp, { excludeSnapshotHash: "bbbbbbbbbbbbbbbb" });
  assert.strictEqual(excluded.length, 1);
  assert.strictEqual(excluded[0].snapshotHash, "aaaaaaaaaaaaaaaa");
});

test("filterSummariesForWorkspace keeps matching paths only", () => {
  const ws = path.resolve("/tmp/my-ws");
  const summaries = [
    { fileName: "a.json", absolutePath: "/x/a.json", generatedAt: null, workspacePath: ws, totalFindings: null, overallScore: null, riskLevel: null, snapshotHash: null, runId: null },
    { fileName: "b.json", absolutePath: "/x/b.json", generatedAt: null, workspacePath: "/other", totalFindings: null, overallScore: null, riskLevel: null, snapshotHash: null, runId: null },
    { fileName: "c.json", absolutePath: "/x/c.json", generatedAt: null, workspacePath: null, totalFindings: null, overallScore: null, riskLevel: null, snapshotHash: null, runId: null },
  ];
  const f = filterSummariesForWorkspace(summaries, ws);
  assert.strictEqual(f.length, 1);
  assert.strictEqual(f[0].fileName, "a.json");
});

test("renderHtmlReport embeds __SNAPSHOT_HISTORY__ and compare UI hooks", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  const hist = [
    {
      fileName: "prev.json",
      absolutePath: "/x/prev.json",
      generatedAt: "2025-01-01T00:00:00.000Z",
      workspacePath: result.workspacePath,
      totalFindings: 100,
      overallScore: 6.25,
      riskLevel: "Medium",
      snapshotHash: "deadbeefcafebabe",
      runId: "run-prev",
    },
  ];
  const mockCompare: Record<string, SnapshotComparisonPayload> = {
    deadbeefcafebabe: {
      baselineKey: "deadbeefcafebabe",
      baselineSummary: {
        generatedAt: hist[0].generatedAt,
        snapshotHash: hist[0].snapshotHash,
        runId: hist[0].runId,
        totalFindings: hist[0].totalFindings,
        riskLevel: hist[0].riskLevel,
        overallScore: hist[0].overallScore,
      },
      workspace: {
        totalFindings: { previous: 100, current: 25, delta: -75 },
        riskLevel: { previous: "Medium", current: "Low" },
        overallScore: { previous: 6.25, current: 8, delta: 1.75 },
        componentScore: { previous: 6, current: 8, delta: 2 },
        lifecycleScore: { previous: 6, current: 8, delta: 2 },
        templateScore: { previous: 6, current: 8, delta: 2 },
        responsibilityScore: { previous: 6, current: 8, delta: 2 },
        criticalCount: { previous: 1, current: 1, delta: 0 },
        highCount: { previous: 3, current: 3, delta: 0 },
        warningSeverityCount: { previous: 6, current: 6, delta: 0 },
        dominantIssueCountsDelta: {},
      },
      projectComparisons: {
        app: {
          sourceRoot: "app",
          summaryDeltas: {
            components: 0,
            componentsWithFindings: 0,
            componentFindings: 0,
            lifecycleFindings: 0,
            templateFindings: 0,
            responsibilityFindings: 0,
          },
          worsenedCount: 0,
          improvedCount: 0,
          resolvedCount: 0,
          newlyFlaggedCount: 0,
          issueChangedCount: 0,
          unchangedCount: 0,
          topWorsenedComponents: [],
          topImprovedComponents: [],
          componentChangesByKey: {},
          topRuleIncreases: [],
          topRuleDecreases: [],
        },
      },
      topRuleIncreasesWorkspace: [],
      topRuleDecreasesWorkspace: [],
    },
  };
  const html = renderHtmlReport(snapshot, { snapshotHistory: hist, snapshotComparisons: mockCompare });
  assert.ok(html.includes("__SNAPSHOT_HISTORY__"));
  assert.ok(html.includes("__SNAPSHOT_COMPARISONS__"));
  assert.ok(html.includes("deadbeefcafebabe"));
  assert.ok(html.includes("snapshot-compare-modal"));
  assert.ok(html.includes("overview-compare-panel"));
  assert.ok(html.includes("data-overview-compare-panel"));
  assert.ok(html.includes("data-overview-compare-open"));
  assert.ok(html.includes("data-overview-compare-details-open"));
  assert.ok(html.includes("overview-compare-detail-modal"));
  assert.ok(html.includes("data-overview-compare-detail-close"));
  assert.ok(html.includes("data-components-compare-open"));
  assert.ok(html.includes("__overviewCompareHistoryIndex__"));
  assert.ok(html.includes("__componentsCompareHistoryIndex__"));
  assert.ok(html.includes("components-explorer-baseline-bar"));
});
