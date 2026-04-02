import { strict as assert } from "node:assert";
import type { CompactComponentChange, SnapshotComparisonPayload, WorkspaceComparison } from "../snapshot-compare";
import { getTranslations } from "./i18n/translations";
import { slimSnapshotComparisonsForHtml } from "./snapshot-comparisons-embed";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("html/snapshot-comparisons-embed");

test("translations include compare filter disabled hint for UI tooltips", () => {
  const t = getTranslations().filters;
  assert.ok(t?.compareFilterDisabledHint && t.compareFilterDisabledHint.length > 0);
  assert.ok(t?.projectCompareUnavailable && t?.projectCompareNoDiff);
});

const sampleChange = (): CompactComponentChange => ({
  filePath: "app/a.ts",
  className: "A",
  changeType: "worsened",
  previousWarningCount: 1,
  currentWarningCount: 3,
  previousDominantIssue: null,
  currentDominantIssue: "GOD_COMPONENT",
  addedRules: [],
  removedRules: [],
});

const emptyWorkspaceComparison = (): WorkspaceComparison => ({
  totalFindings: { previous: 0, current: 0, delta: 0 },
  riskLevel: { previous: "", current: "" },
  overallScore: { previous: 0, current: 0, delta: 0 },
  componentScore: { previous: 0, current: 0, delta: 0 },
  lifecycleScore: { previous: 0, current: 0, delta: 0 },
  templateScore: { previous: 0, current: 0, delta: 0 },
  responsibilityScore: { previous: 0, current: 0, delta: 0 },
  criticalCount: { previous: 0, current: 0, delta: 0 },
  highCount: { previous: 0, current: 0, delta: 0 },
  warningSeverityCount: { previous: 0, current: 0, delta: 0 },
  dominantIssueCountsDelta: {},
});

test("slimSnapshotComparisonsForHtml omits empty rule arrays and null issues", () => {
  const full: CompactComponentChange = sampleChange();
  const payload: SnapshotComparisonPayload = {
    baselineKey: "k1",
    baselineSummary: {
      generatedAt: null,
      snapshotHash: "h",
      runId: null,
      totalFindings: 1,
      riskLevel: "Low",
      overallScore: 5,
    },
    workspace: emptyWorkspaceComparison(),
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
        worsenedCount: 1,
        improvedCount: 0,
        resolvedCount: 0,
        newlyFlaggedCount: 0,
        issueChangedCount: 0,
        unchangedCount: 0,
        topWorsenedComponents: [full],
        topImprovedComponents: [],
        componentChangesByKey: { "app/a.ts": full },
        topRuleIncreases: [],
        topRuleDecreases: [],
      },
    },
    topRuleIncreasesWorkspace: [],
    topRuleDecreasesWorkspace: [],
  };
  const slim = slimSnapshotComparisonsForHtml({ x: payload }).x!;
  const json = JSON.stringify(slim.projectComparisons.app.componentChangesByKey["app/a.ts"]);
  assert.ok(!json.includes('"addedRules"'));
  assert.ok(!json.includes('"removedRules"'));
  assert.ok(!json.includes('"previousDominantIssue"'));
});
