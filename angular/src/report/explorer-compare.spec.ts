import { strict as assert } from "node:assert";
import {
  changeTypeToBadgeKind,
  compareImpactScore,
  compareSortKeyBetterFirst,
  compareSortKeyWorseFirst,
  countCompareCategoriesInRows,
  lookupComponentChange,
  matchesExplorerCompareFilter,
  rowMatchesExplorerCompareScope,
} from "./explorer-compare";
import type { CompactComponentChange, ProjectComparison } from "./snapshot-compare";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("report/explorer-compare");

const sample: CompactComponentChange = {
  filePath: "/a/x.ts",
  className: "X",
  changeType: "worsened",
  previousWarningCount: 1,
  currentWarningCount: 5,
  previousDominantIssue: "GOD_COMPONENT",
  currentDominantIssue: "GOD_COMPONENT",
  addedRules: ["r1"],
  removedRules: [],
};

test("changeTypeToBadgeKind maps types", () => {
  assert.strictEqual(changeTypeToBadgeKind("newlyFlagged"), "new");
  assert.strictEqual(changeTypeToBadgeKind("resolved"), "resolved");
  assert.strictEqual(changeTypeToBadgeKind("worsened"), "worse");
  assert.strictEqual(changeTypeToBadgeKind("improved"), "better");
  assert.strictEqual(changeTypeToBadgeKind("issueChanged"), "changed");
  assert.strictEqual(changeTypeToBadgeKind("unchanged"), null);
});

test("lookupComponentChange reads map", () => {
  const pc: ProjectComparison = {
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
    topWorsenedComponents: [],
    topImprovedComponents: [],
    componentChangesByKey: { "c:/a/x.ts": sample },
    topRuleIncreases: [],
    topRuleDecreases: [],
  };
  assert.strictEqual(lookupComponentChange(pc, "c:/a/x.ts")?.changeType, "worsened");
  assert.strictEqual(lookupComponentChange(pc, "missing"), undefined);
});

test("matchesExplorerCompareFilter", () => {
  assert.strictEqual(matchesExplorerCompareFilter("all", undefined), true);
  assert.strictEqual(matchesExplorerCompareFilter("worse", undefined), false);
  assert.strictEqual(matchesExplorerCompareFilter("changed-only", undefined), false);
  assert.strictEqual(matchesExplorerCompareFilter("changed-only", sample), true);
  assert.strictEqual(matchesExplorerCompareFilter("worse", sample), true);
  assert.strictEqual(matchesExplorerCompareFilter("better", sample), false);
  const issueChanged: CompactComponentChange = { ...sample, changeType: "issueChanged" };
  assert.strictEqual(matchesExplorerCompareFilter("issue-changed", issueChanged), true);
  assert.strictEqual(matchesExplorerCompareFilter("worse", issueChanged), false);
});

test("compareImpactScore orders worsened above resolved", () => {
  const resolved: CompactComponentChange = { ...sample, changeType: "resolved", previousWarningCount: 3, currentWarningCount: 0 };
  assert.ok(compareImpactScore(sample) > compareImpactScore(resolved));
});

test("sort keys", () => {
  const w = { ...sample, changeType: "worsened" as const };
  const r = { ...sample, changeType: "resolved" as const, previousWarningCount: 4, currentWarningCount: 0 };
  assert.ok(compareSortKeyWorseFirst(w) >= compareSortKeyWorseFirst(r));
  assert.ok(compareSortKeyBetterFirst(r) >= compareSortKeyBetterFirst(w));
});

test("countCompareCategoriesInRows", () => {
  const c = countCompareCategoriesInRows([{ change: sample }, { change: { ...sample, changeType: "resolved" } }]);
  assert.strictEqual(c.worsened, 1);
  assert.strictEqual(c.resolved, 1);
});

test("rowMatchesExplorerCompareScope: disabled dropdown passes all", () => {
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: false,
      activeSourceRoot: "projects/a/src",
      itemSourceRoot: "projects/b/src",
      hasBaselinePayload: true,
      hasDiff: true,
      compareKind: "worse",
    }),
    true
  );
});

test("rowMatchesExplorerCompareScope: active project only", () => {
  const active = "projects/kutuphane/src";
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: true,
      activeSourceRoot: active,
      itemSourceRoot: "projects/other/src",
      hasBaselinePayload: true,
      hasDiff: true,
      compareKind: "worse",
    }),
    false
  );
});

test("rowMatchesExplorerCompareScope: all filter shows entire active project", () => {
  const active = "projects/kutuphane/src";
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "all",
      compareDropdownEnabled: true,
      activeSourceRoot: active,
      itemSourceRoot: active,
      hasBaselinePayload: false,
      hasDiff: false,
      compareKind: "",
    }),
    true
  );
});

test("rowMatchesExplorerCompareScope: worse only worsened in active project", () => {
  const active = "projects/kutuphane/src";
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: true,
      activeSourceRoot: active,
      itemSourceRoot: active,
      hasBaselinePayload: true,
      hasDiff: true,
      compareKind: "worse",
    }),
    true
  );
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: true,
      activeSourceRoot: active,
      itemSourceRoot: active,
      hasBaselinePayload: true,
      hasDiff: true,
      compareKind: "better",
    }),
    false
  );
});

test("rowMatchesExplorerCompareScope: no payload hides narrowed filters", () => {
  const active = "projects/a/src";
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: true,
      activeSourceRoot: active,
      itemSourceRoot: active,
      hasBaselinePayload: false,
      hasDiff: false,
      compareKind: "",
    }),
    false
  );
});

test("rowMatchesExplorerCompareScope: workspace mode null activeSourceRoot applies filter per row", () => {
  assert.strictEqual(
    rowMatchesExplorerCompareScope({
      compareFilter: "worse",
      compareDropdownEnabled: true,
      activeSourceRoot: null,
      itemSourceRoot: "projects/other/src",
      hasBaselinePayload: true,
      hasDiff: true,
      compareKind: "worse",
    }),
    true
  );
});
