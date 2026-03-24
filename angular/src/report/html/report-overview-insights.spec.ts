import { strict as assert } from "node:assert";
import type { ScanResult } from "../../core/scan-result";
import type { WorkspaceDiagnosis } from "../../diagnostic/workspace-diagnosis";
import { getTranslations } from "./i18n/translations";
import { prepareSections } from "./html-report-presenter";
import {
  buildExecutiveSummaryModel,
  buildPriorityHotspotRows,
  buildRecommendedActionItems,
} from "./report-overview-insights";

console.log("report-overview-insights");

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

function formatIssueMock(issue: string | null): string {
  return issue ?? "";
}

function minimalResult(overrides: Partial<ScanResult> = {}): ScanResult {
  const base: ScanResult = {
    workspacePath: "/w",
    generatedAt: new Date().toISOString(),
    workspaceSummary: {
      projectCount: 2,
      componentCount: 20,
      riskLevel: "Medium",
      totalFindings: 40,
    },
    scores: {
      overall: 6,
      component: { score: 6, factors: [] },
      lifecycle: { score: 6, factors: [] },
      template: { score: 6, factors: [] },
      responsibility: { score: 6, factors: [] },
    },
    projectBreakdown: [],
    topProblematicComponents: [],
    diagnosticSummary: {
      componentsWithDominantIssue: 4,
      totalComponents: 20,
      dominantIssueCounts: {
        TEMPLATE_HEAVY_COMPONENT: 3,
        GOD_COMPONENT: 1,
        CLEANUP_RISK_COMPONENT: 0,
        ORCHESTRATION_HEAVY_COMPONENT: 0,
        LIFECYCLE_RISKY_COMPONENT: 0,
      },
      topCrossCuttingRisks: [],
    },
    similarComponentFamilies: [],
    repeatedArchitectureHotspots: [],
    extractionCandidates: [],
    lifecycle: { summary: {} as never, topRisks: [], manualReview: [], cleanupStats: {} as never },
    template: { summary: {} as never, topRisks: [] },
    responsibility: { summary: {} as never, topRisks: [] },
    commonWarnings: [],
    ruleViolationCounts: {},
    warningsAndRecommendations: [],
    componentsBySeverity: { warning: 5, high: 2, critical: 1 },
  };
  return { ...base, ...overrides } as ScanResult;
}

const stubDiagnosis: WorkspaceDiagnosis = {
  primarySymptom: "Template-heavy components",
  rootCause: "Large templates drive maintenance cost.",
  mostAffectedProject: "App",
  firstAction: "Extract child templates.",
  expectedImpact: "Lower complexity.",
  symptomLens: "TEMPLATE_HEAVY_COMPONENT",
  priorityLens: "template",
  scopeLabel: "workspace",
  componentsWithDominantIssue: 4,
  totalComponents: 20,
  chipEntries: [],
};

test("executive summary includes scale and risk lines", () => {
  const r = minimalResult();
  const m = buildExecutiveSummaryModel(r, stubDiagnosis, formatIssueMock, t);
  assert.ok(m.scaleLines.some((l) => l.includes("2") && l.includes("project")));
  assert.ok(m.scaleLines.some((l) => l.includes("20")));
  assert.ok(m.riskSignalLines.some((l) => l.includes("Medium")));
  assert.ok(m.assessmentLines.some((l) => l.includes("Template-heavy")));
});

test("priority hotspots cap at five and prefer cross-cutting order", () => {
  const cross = Array.from({ length: 6 }, (_, i) => ({
    filePath: `/src/c${i}.component.ts`,
    fileName: `c${i}.component.ts`,
    className: `C${i}`,
    dominantIssue: "GOD_COMPONENT" as const,
    rankingReason: `Reason ${i}`,
    refactorDirection: "",
    supportingIssues: [],
    evidence: [],
    componentRole: "container" as const,
    roleConfidence: 0.5,
    roleSignals: [],
    totalWarningCount: 0,
    fileNameShort: `c${i}`,
  }));
  const problematic = [
    {
      filePath: "/src/extra.component.ts",
      fileName: "extra.component.ts",
      lineCount: 100,
      dependencyCount: 5,
      issues: [{ type: "X", message: "Big component", severity: "WARNING" }],
      highestSeverity: "WARNING",
    },
  ];
  const r = minimalResult({
    diagnosticSummary: {
      ...minimalResult().diagnosticSummary,
      topCrossCuttingRisks: cross as never,
    },
    topProblematicComponents: problematic as never,
  });
  const rows = buildPriorityHotspotRows(r, formatIssueMock);
  assert.strictEqual(rows.length, 5);
  assert.strictEqual(rows[0]!.displayName, "C0");
  assert.ok(rows.every((x) => x.kind === "component"));
});

test("priority hotspots dedupes path when cross-cutting already listed", () => {
  const r = minimalResult({
    diagnosticSummary: {
      ...minimalResult().diagnosticSummary,
      topCrossCuttingRisks: [
        {
          filePath: "/dup/a.component.ts",
          fileName: "a.component.ts",
          className: "A",
          dominantIssue: "GOD_COMPONENT",
          rankingReason: "Top",
          supportingIssues: [],
          evidence: [],
          componentRole: "container",
          roleConfidence: 0.5,
          roleSignals: [],
          totalWarningCount: 1,
          fileNameShort: "a",
        } as never,
      ],
    },
    topProblematicComponents: [
      {
        filePath: "/dup/a.component.ts",
        fileName: "a.component.ts",
        lineCount: 900,
        dependencyCount: 20,
        issues: [{ type: "Y", message: "Also bad", severity: "HIGH" }],
        highestSeverity: "HIGH",
      } as never,
    ],
  });
  const rows = buildPriorityHotspotRows(r, formatIssueMock);
  assert.strictEqual(rows.length, 1);
});

test("recommended actions dedupes and includes warnings", () => {
  const r = minimalResult({
    warningsAndRecommendations: ["Do X", "Do X", "Do Y"],
    refactorTasks: [
      {
        componentName: "Foo",
        filePath: "/f.ts",
        dominantIssue: "GOD_COMPONENT",
        priority: "fix-now" as const,
        impactScore: 8,
        effort: "low",
        whyNow: ["Because"],
        suggestedAction: "Do X",
      } as never,
    ],
  });
  const sections = prepareSections(r);
  const items = buildRecommendedActionItems(r, sections);
  const texts = items.map((i) => i.text);
  assert.ok(texts.includes("Do X"));
  assert.ok(texts.includes("Do Y"));
  assert.strictEqual(texts.filter((x) => x === "Do X").length, 1);
});
