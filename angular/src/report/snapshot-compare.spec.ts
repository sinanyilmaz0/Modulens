import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createAnalysisSnapshot } from "../core/analysis-snapshot";
import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import type { ScanResult } from "../core/scan-result";
import { compareSnapshotInputs } from "./snapshot-compare";
import {
  baselineKeyFromSummary,
  compareInputFromAnalysisSnapshot,
  compareInputFromPublicJson,
  normalizeFileKey,
} from "./snapshot-compare-input";
import { precomputeSnapshotComparisons } from "./snapshot-compare-precompute";
import type { SnapshotSummary } from "./snapshot-history";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("report/snapshot-compare");

function minimalDiag(
  filePath: string,
  overrides: Partial<ComponentDiagnostic> = {}
): ComponentDiagnostic {
  return {
    filePath,
    fileName: path.basename(filePath),
    className: "X",
    dominantIssue: "GOD_COMPONENT",
    supportingIssues: [],
    refactorDirection: "",
    diagnosticLabel: "",
    diagnosticStatus: "ranked",
    clusterScores: {} as never,
    totalWarningCount: 3,
    evidence: [],
    triggeredRuleIds: ["rule-a"],
    ...overrides,
  } as ComponentDiagnostic;
}

function createScanWithDiagnostics(
  diagnostics: ComponentDiagnostic[],
  projectBreakdown: ScanResult["projectBreakdown"],
  overrides: Partial<ScanResult> = {}
): ScanResult {
  const base = {
    workspacePath: "/test/workspace",
    generatedAt: "2026-04-01T14:22:31.123Z",
    workspaceSummary: {
      projectCount: 1,
      componentCount: diagnostics.length || 1,
      riskLevel: "Low",
      totalFindings: 10,
    },
    scores: {
      overall: 7,
      component: { score: 7, factors: [] },
      lifecycle: { score: 7, factors: [] },
      template: { score: 7, factors: [] },
      responsibility: { score: 7, factors: [] },
    },
    projectBreakdown,
    topProblematicComponents: [],
    diagnosticSummary: {
      componentsWithDominantIssue: 1,
      totalComponents: diagnostics.length || 1,
      dominantIssueCounts: {
        TEMPLATE_HEAVY_COMPONENT: 0,
        GOD_COMPONENT: 1,
        CLEANUP_RISK_COMPONENT: 0,
        ORCHESTRATION_HEAVY_COMPONENT: 0,
        LIFECYCLE_RISKY_COMPONENT: 0,
      },
      componentDiagnostics: diagnostics,
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
    componentsBySeverity: { warning: 1, high: 0, critical: 0 },
    ...overrides,
  } as ScanResult;
  return base;
}

test("normalizeFileKey lowercases path", () => {
  assert.strictEqual(normalizeFileKey("C:\\\\Foo\\\\a.ts"), "c:/foo/a.ts");
});

test("normalizeFileKey collapses dot segments and duplicate slashes like path.normalize", () => {
  assert.strictEqual(normalizeFileKey("/proj/foo/../bar//x.ts"), normalizeFileKey(path.join("/proj", "bar", "x.ts")));
  assert.strictEqual(normalizeFileKey("foo//bar/./baz.ts"), normalizeFileKey("foo/bar/baz.ts"));
});

test("compareInputFromPublicJson parses workspace and diagnostics", () => {
  const json = {
    metadata: { runId: "r1", workspacePath: "/test/workspace", snapshotHash: "abc", generatedAt: "2026-01-01" },
    workspace: {
      summary: { totalFindings: 5, riskLevel: "Medium", projectCount: 1, componentCount: 2 },
      projectBreakdown: [
        {
          sourceRoot: "app",
          components: 2,
          componentsWithFindings: 1,
          componentFindings: 2,
          lifecycleFindings: 0,
          templateFindings: 0,
          responsibilityFindings: 0,
        },
      ],
    },
    health: {
      riskLevel: "Medium",
      scores: {
        overall: 6,
        component: { score: 6, factors: [] },
        lifecycle: { score: 6, factors: [] },
        template: { score: 6, factors: [] },
        responsibility: { score: 6, factors: [] },
      },
      componentsBySeverity: { critical: 0, high: 1, warning: 2 },
    },
    diagnostics: {
      summary: {
        componentsWithDominantIssue: 1,
        totalComponents: 2,
        dominantIssueCounts: { GOD_COMPONENT: 1 },
      },
      details: [
        {
          filePath: "/test/workspace/projects/app/src/x.component.ts",
          fileName: "x.component.ts",
          className: "X",
          dominantIssue: "GOD_COMPONENT",
          totalWarningCount: 2,
          diagnosticStatus: "ranked",
          triggeredRuleIds: ["r1"],
        },
      ],
    },
  };
  const input = compareInputFromPublicJson(json);
  assert.ok(input);
  assert.strictEqual(input.workspace.totalFindings, 5);
  assert.strictEqual(input.componentsByKey.size, 1);
});

test("compareSnapshotInputs workspace diff deltas", () => {
  const pb = [
    {
      sourceRoot: "app",
      components: 2,
      componentsWithFindings: 1,
      componentFindings: 2,
      lifecycleTargets: 2,
      lifecycleFindings: 0,
      templateFindings: 0,
      responsibilityFindings: 0,
    },
  ];
  const prev = createScanWithDiagnostics(
    [minimalDiag("/test/workspace/projects/app/src/x.component.ts", { totalWarningCount: 2 })],
    pb,
    {
      workspaceSummary: {
        projectCount: 1,
        componentCount: 2,
        riskLevel: "Low",
        totalFindings: 10,
      },
      scores: {
        overall: 6,
        component: { score: 6, factors: [] },
        lifecycle: { score: 6, factors: [] },
        template: { score: 6, factors: [] },
        responsibility: { score: 6, factors: [] },
      },
      componentsBySeverity: { warning: 1, high: 0, critical: 0 },
    }
  );
  const cur = createScanWithDiagnostics(
    [minimalDiag("/test/workspace/projects/app/src/x.component.ts", { totalWarningCount: 5 })],
    pb,
    {
      workspaceSummary: {
        projectCount: 1,
        componentCount: 2,
        riskLevel: "Medium",
        totalFindings: 15,
      },
      scores: {
        overall: 7,
        component: { score: 7, factors: [] },
        lifecycle: { score: 7, factors: [] },
        template: { score: 7, factors: [] },
        responsibility: { score: 7, factors: [] },
      },
      componentsBySeverity: { warning: 2, high: 0, critical: 0 },
    }
  );
  const aPrev = compareInputFromAnalysisSnapshot(createAnalysisSnapshot(prev));
  const aCur = compareInputFromAnalysisSnapshot(createAnalysisSnapshot(cur));
  const summary: SnapshotSummary = {
    fileName: "old.json",
    absolutePath: "/x/old.json",
    generatedAt: "2026-01-01",
    workspacePath: "/test/workspace",
    totalFindings: 10,
    overallScore: 6,
    riskLevel: "Low",
    snapshotHash: "hash1",
    runId: "r-old",
  };
  const out = compareSnapshotInputs(aCur, aPrev, "hash1", summary);
  assert.strictEqual(out.workspace.totalFindings.delta, 5);
  assert.strictEqual(out.workspace.overallScore.delta, 1);
});

test("component classification newlyFlagged and resolved", () => {
  const pb = [
    {
      sourceRoot: "app",
      components: 2,
      componentsWithFindings: 2,
      componentFindings: 3,
      lifecycleTargets: 2,
      lifecycleFindings: 0,
      templateFindings: 0,
      responsibilityFindings: 0,
    },
  ];
  const baseline = createScanWithDiagnostics(
    [
      minimalDiag("/test/workspace/projects/app/src/a.component.ts", { totalWarningCount: 0, diagnosticStatus: "quiet" }),
    ],
    pb
  );
  const current = createScanWithDiagnostics(
    [
      minimalDiag("/test/workspace/projects/app/src/a.component.ts", { totalWarningCount: 4 }),
      minimalDiag("/test/workspace/projects/app/src/b.component.ts", { totalWarningCount: 2 }),
    ],
    pb
  );
  const out = compareSnapshotInputs(
    compareInputFromAnalysisSnapshot(createAnalysisSnapshot(current)),
    compareInputFromAnalysisSnapshot(createAnalysisSnapshot(baseline)),
    "k",
    {
      fileName: "x",
      absolutePath: "/x",
      generatedAt: null,
      workspacePath: "/test/workspace",
      totalFindings: null,
      overallScore: null,
      riskLevel: null,
      snapshotHash: "k",
      runId: null,
    }
  );
  const pc = out.projectComparisons["app"];
  assert.ok(pc.newlyFlaggedCount >= 1);
  assert.ok(Object.keys(pc.componentChangesByKey).length >= 1);
});

test("componentChangesByKey includes issueChanged details", () => {
  const pb = [
    {
      sourceRoot: "app",
      components: 2,
      componentsWithFindings: 2,
      componentFindings: 4,
      lifecycleTargets: 2,
      lifecycleFindings: 0,
      templateFindings: 0,
      responsibilityFindings: 0,
    },
  ];
  const pathA = "/test/workspace/projects/app/src/a.component.ts";
  const dBase = (issue: "GOD_COMPONENT" | "TEMPLATE_HEAVY_COMPONENT") =>
    minimalDiag(pathA, {
      totalWarningCount: 2,
      diagnosticStatus: "ranked",
      dominantIssue: issue,
    });
  const baseline = createScanWithDiagnostics([dBase("GOD_COMPONENT")], pb);
  const current = createScanWithDiagnostics([dBase("TEMPLATE_HEAVY_COMPONENT")], pb);
  const out = compareSnapshotInputs(
    compareInputFromAnalysisSnapshot(createAnalysisSnapshot(current)),
    compareInputFromAnalysisSnapshot(createAnalysisSnapshot(baseline)),
    "k",
    {
      fileName: "x",
      absolutePath: "/x",
      generatedAt: null,
      workspacePath: "/test/workspace",
      totalFindings: null,
      overallScore: null,
      riskLevel: null,
      snapshotHash: "k",
      runId: null,
    }
  );
  const pc = out.projectComparisons["app"];
  assert.strictEqual(pc.issueChangedCount, 1);
  const keys = Object.keys(pc.componentChangesByKey);
  assert.ok(keys.length >= 1);
  const first = pc.componentChangesByKey[keys[0]!];
  assert.strictEqual(first?.changeType, "issueChanged");
});

test("baselineKeyFromSummary prefers snapshotHash", () => {
  assert.strictEqual(
    baselineKeyFromSummary({
      fileName: "a",
      absolutePath: "/a",
      generatedAt: null,
      workspacePath: null,
      totalFindings: null,
      overallScore: null,
      riskLevel: null,
      snapshotHash: "abc",
      runId: "rid",
    }),
    "abc"
  );
  assert.strictEqual(
    baselineKeyFromSummary({
      fileName: "a",
      absolutePath: "/a",
      generatedAt: null,
      workspacePath: null,
      totalFindings: null,
      overallScore: null,
      riskLevel: null,
      snapshotHash: null,
      runId: "rid",
    }),
    "rid"
  );
});

test("precomputeSnapshotComparisons skips invalid JSON and still returns map", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-snap-"));
  const goodPath = path.join(dir, "good.json");
  const badPath = path.join(dir, "bad.json");
  fs.writeFileSync(badPath, "not json", "utf-8");
  fs.writeFileSync(
    goodPath,
    JSON.stringify({
      metadata: {
        runId: "prev-run",
        workspacePath: path.join(dir, "ws"),
        snapshotHash: "baselinehash001",
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
      workspace: {
        summary: { totalFindings: 1, riskLevel: "Low", projectCount: 1, componentCount: 1 },
        projectBreakdown: [
          {
            sourceRoot: "app",
            components: 1,
            componentsWithFindings: 0,
            componentFindings: 0,
            lifecycleFindings: 0,
            templateFindings: 0,
            responsibilityFindings: 0,
          },
        ],
      },
      health: {
        riskLevel: "Low",
        scores: {
          overall: 5,
          component: { score: 5, factors: [] },
          lifecycle: { score: 5, factors: [] },
          template: { score: 5, factors: [] },
          responsibility: { score: 5, factors: [] },
        },
        componentsBySeverity: { critical: 0, high: 0, warning: 0 },
      },
      diagnostics: {
        summary: { componentsWithDominantIssue: 0, totalComponents: 1, dominantIssueCounts: {} },
        details: [],
      },
    }),
    "utf-8"
  );

  const wsPath = path.join(dir, "ws");
  fs.mkdirSync(wsPath, { recursive: true });

  const current = createAnalysisSnapshot(
    createScanWithDiagnostics([], [
      {
        sourceRoot: "app",
        components: 1,
        componentsWithFindings: 0,
        componentFindings: 0,
        lifecycleTargets: 0,
        lifecycleFindings: 0,
        templateFindings: 0,
        responsibilityFindings: 0,
      },
    ])
  );

  const history: SnapshotSummary[] = [
    {
      fileName: "bad.json",
      absolutePath: badPath,
      generatedAt: null,
      workspacePath: wsPath,
      totalFindings: null,
      overallScore: null,
      riskLevel: null,
      snapshotHash: "bad",
      runId: null,
    },
    {
      fileName: "good.json",
      absolutePath: goodPath,
      generatedAt: "2026-01-01",
      workspacePath: wsPath,
      totalFindings: 1,
      overallScore: 5,
      riskLevel: "Low",
      snapshotHash: "baselinehash001",
      runId: "prev-run",
    },
  ];

  const map = precomputeSnapshotComparisons(current, history);
  assert.ok(!map.bad);
  assert.ok(map.baselinehash001);
});
