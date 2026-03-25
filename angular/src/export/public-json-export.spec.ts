import { strict as assert } from "node:assert";
import { createAnalysisSnapshot } from "../core/analysis-snapshot";
import type { ScanResult } from "../core/scan-result";
import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import { JsonFormatter } from "../formatters/json-formatter";
import { buildPublicJsonExport } from "./public-json-export";
import { PUBLIC_JSON_SCHEMA_VERSION } from "./public-json-schema";

const EMPTY_CLUSTER_SCORES: ComponentDiagnostic["clusterScores"] = {
  template_heavy: 0,
  god_component: 0,
  cleanup_risk: 0,
  orchestration_heavy: 0,
  lifecycle_risky: 0,
};

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
      component: { score: 8, factors: [{ name: "b", weight: 1, contribution: 1, description: "" }] },
      lifecycle: { score: 8, factors: [{ name: "a", weight: 1, contribution: 1, description: "" }] },
      template: { score: 8, factors: [] },
      responsibility: { score: 8, factors: [] },
    },
    projectBreakdown: [
      {
        sourceRoot: "zebra",
        components: 10,
        componentsWithFindings: 5,
        lifecycleTargets: 10,
        lifecycleFindings: 10,
        templateFindings: 8,
        responsibilityFindings: 7,
      },
      {
        sourceRoot: "app",
        components: 3,
        componentsWithFindings: 1,
        lifecycleTargets: 3,
        lifecycleFindings: 0,
        templateFindings: 0,
        responsibilityFindings: 0,
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
    commonWarnings: [
      { code: "z", count: 2 },
      { code: "a", count: 1 },
    ],
    ruleViolationCounts: { "rule-z": 5, "rule-a": 15 },
    warningsAndRecommendations: ["second", "first"],
    componentsBySeverity: { warning: 6, high: 3, critical: 1 },
  };
  return { ...base, ...overrides } as ScanResult;
}

console.log("public-json-export");

test("top-level public JSON shape and schemaVersion", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const json = buildPublicJsonExport(snapshot);
  assert.strictEqual(json.schemaVersion, PUBLIC_JSON_SCHEMA_VERSION);
  const keys = Object.keys(json);
  assert.deepStrictEqual(keys, [
    "schemaVersion",
    "metadata",
    "workspace",
    "health",
    "diagnostics",
    "rules",
    "patterns",
    "structure",
    "components",
    "insights",
    "recommendedActions",
    "commonWarnings",
  ]);
  assert.ok(typeof json.metadata === "object" && json.metadata !== null);
  assert.strictEqual((json.metadata as { toolVersion: string }).toolVersion, snapshot.meta.analyzerVersion);
});

test("buildPublicJsonExport is deterministic for identical snapshot", () => {
  const result = createMinimalResult();
  const snapshot = createAnalysisSnapshot(result);
  const a = JSON.stringify(buildPublicJsonExport(snapshot), null, 2);
  const b = JSON.stringify(buildPublicJsonExport(snapshot), null, 2);
  assert.strictEqual(a, b);
});

function collectJsonKeys(value: unknown, out: Set<string>): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonKeys(item, out);
    return;
  }
  for (const k of Object.keys(value as Record<string, unknown>)) {
    out.add(k);
    collectJsonKeys((value as Record<string, unknown>)[k], out);
  }
}

test("JsonFormatter output does not leak internal keys at top level", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const str = new JsonFormatter().format(snapshot);
  const parsed = JSON.parse(str) as Record<string, unknown>;
  const forbiddenRoots = ["_meta", "result", "sections", "componentDetailsMap", "patternData", "componentsExplorerItems"];
  for (const k of forbiddenRoots) {
    assert.ok(!(k in parsed), `top-level leak: ${k}`);
  }
  const allKeys = new Set<string>();
  collectJsonKeys(parsed, allKeys);
  assert.ok(!allKeys.has("drawerHtml"), "pattern drawer HTML must not appear in public JSON");
  assert.ok(!allKeys.has("allComponents"), "full analyzer arrays must not appear in public JSON");
});

test("rules.violationCounts keys are sorted", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const json = buildPublicJsonExport(snapshot) as { rules: { violationCounts: Record<string, number> } };
  assert.deepStrictEqual(Object.keys(json.rules.violationCounts), ["rule-a", "rule-z"]);
});

test("workspace.projectBreakdown is sorted by sourceRoot", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const json = buildPublicJsonExport(snapshot) as {
    workspace: { projectBreakdown: Array<{ sourceRoot: string }> };
  };
  assert.deepStrictEqual(
    json.workspace.projectBreakdown.map((p) => p.sourceRoot),
    ["app", "zebra"]
  );
});

test("health.scores factors are sorted by name", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const json = buildPublicJsonExport(snapshot) as {
    health: {
      scores: {
        lifecycle: { factors: Array<{ name: string }> };
        component: { factors: Array<{ name: string }> };
      };
    };
  };
  assert.deepStrictEqual(
    json.health.scores.lifecycle.factors.map((f: { name: string }) => f.name),
    ["a"]
  );
  assert.deepStrictEqual(
    json.health.scores.component.factors.map((f: { name: string }) => f.name),
    ["b"]
  );
});

test("commonWarnings sorted by code", () => {
  const snapshot = createAnalysisSnapshot(createMinimalResult());
  const json = buildPublicJsonExport(snapshot) as { commonWarnings: Array<{ code: string }> };
  assert.deepStrictEqual(
    json.commonWarnings.map((w) => w.code),
    ["a", "z"]
  );
});

test("diagnostics.details expose diagnosticStatus quiet vs unranked", () => {
  const quietDiag: ComponentDiagnostic = {
    filePath: "/test/workspace/app/quiet.component.ts",
    fileName: "quiet.component.ts",
    className: "Quiet",
    dominantIssue: null,
    supportingIssues: [],
    refactorDirection: "",
    diagnosticLabel: "No primary ranked issue",
    diagnosticStatus: "quiet",
    clusterScores: { ...EMPTY_CLUSTER_SCORES },
    totalWarningCount: 0,
    evidence: [],
  };
  const unrankedDiag: ComponentDiagnostic = {
    filePath: "/test/workspace/app/unranked.component.ts",
    fileName: "unranked.component.ts",
    className: "Unranked",
    dominantIssue: null,
    supportingIssues: [],
    refactorDirection: "",
    diagnosticLabel: "Findings present; no primary ranked issue",
    diagnosticStatus: "unranked",
    clusterScores: { ...EMPTY_CLUSTER_SCORES },
    totalWarningCount: 2,
    evidence: [],
  };
  const result = createMinimalResult({
    diagnosticSummary: {
      ...createMinimalResult().diagnosticSummary,
      componentDiagnostics: [quietDiag, unrankedDiag],
    },
  });
  const snapshot = createAnalysisSnapshot(result);
  const json = buildPublicJsonExport(snapshot) as {
    diagnostics: { details: Array<{ diagnosticStatus?: string; diagnosticLabel?: string; filePath?: string }> };
    components: Array<{ computedSeverity?: string; severityConfidence?: string }>;
  };
  const quiet = json.diagnostics.details.find((d) => d.filePath?.includes("quiet.component"));
  const unranked = json.diagnostics.details.find((d) => d.filePath?.includes("unranked.component"));
  assert.ok(quiet);
  assert.strictEqual(quiet!.diagnosticStatus, "quiet");
  assert.ok(unranked);
  assert.strictEqual(unranked!.diagnosticStatus, "unranked");
  if (json.components.length > 0) {
    const anyComp = json.components[0]!;
    assert.ok(
      anyComp.computedSeverity === undefined || typeof anyComp.computedSeverity === "string",
      "computedSeverity is optional or string"
    );
  }
});
