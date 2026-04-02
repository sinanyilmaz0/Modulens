import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createAnalysisSnapshot } from "../core/analysis-snapshot";
import type { ScanResult } from "../core/scan-result";
import { JsonFormatter } from "../formatters/json-formatter";
import {
  buildSnapshotFileName,
  getReportsDirectory,
  getSnapshotDirectory,
  sanitizeGeneratedAtForSnapshotFilename,
  writeWorkspaceJsonSnapshot,
} from "./snapshot-file";

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

console.log("cli/snapshot-file");

test("sanitizeGeneratedAtForSnapshotFilename uses HH-mm-ss without colons", () => {
  assert.strictEqual(
    sanitizeGeneratedAtForSnapshotFilename("2026-04-01T14:22:31.456Z"),
    "2026-04-01T14-22-31"
  );
});

test("buildSnapshotFileName matches snapshot-YYYY-MM-DDTHH-mm-ss-<8hex>.json", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const name = buildSnapshotFileName(snapshot);
  assert.ok(
    /^snapshot-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-[a-f0-9]{8}\.json$/.test(name),
    name
  );
  assert.strictEqual(
    name.slice(-13, -5),
    snapshot.snapshotHash.slice(0, 8),
    "short id is snapshotHash prefix"
  );
  assert.ok(name.includes("2026-04-01T14-22-31"), name);
});

test("getSnapshotDirectory joins .modulens/snapshots under workspace", () => {
  const root = path.resolve("/tmp/ws");
  assert.strictEqual(
    getSnapshotDirectory(root),
    path.join(root, ".modulens", "snapshots")
  );
});

test("getReportsDirectory joins .modulens/reports under workspace", () => {
  const root = path.resolve("/tmp/ws");
  assert.strictEqual(
    getReportsDirectory(root),
    path.join(root, ".modulens", "reports")
  );
});

test("writeWorkspaceJsonSnapshot creates nested dir and writes JsonFormatter-equivalent JSON", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-snap-"));
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const jsonPayload = new JsonFormatter().format(snapshot);
  const w = writeWorkspaceJsonSnapshot({
    workspaceRootAbsolute: tmp,
    jsonPayload,
    snapshot,
  });
  assert.strictEqual(w.ok, true);
  if (!w.ok) return;
  assert.strictEqual(fs.readFileSync(w.absolutePath, "utf-8"), jsonPayload);
  const snapDir = path.join(tmp, ".modulens", "snapshots");
  assert.ok(fs.statSync(snapDir).isDirectory());
});

test("writeWorkspaceJsonSnapshot returns error when .modulens cannot be created as directory", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-snap-bad-"));
  const blocker = path.join(tmp, ".modulens");
  fs.writeFileSync(blocker, "x", "utf-8");
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const w = writeWorkspaceJsonSnapshot({
    workspaceRootAbsolute: tmp,
    jsonPayload: "{}",
    snapshot,
  });
  assert.strictEqual(w.ok, false);
  if (w.ok) return;
  assert.ok(w.message.length > 0);
});
