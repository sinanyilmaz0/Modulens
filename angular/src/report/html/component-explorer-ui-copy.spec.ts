import { strict as assert } from "node:assert";
import {
  buildComponentsExplorerSummaryParts,
  buildExplorerChipDescriptors,
  explorerSeveritySortRank,
} from "./component-explorer-ui-copy";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("component-explorer-ui-copy");

const summaryT = {
  primaryEmpty: "No matches.",
  primaryRange: "Showing {start}–{end} of {matching} matching · {listTotal} in this list",
  primaryWorkspaceSegment: " · {workspaceTotal} in workspace",
  secondarySorted: "Sorted by {sortLabel}.",
  secondaryHealthyHidden: "{count} without a ranked primary issue hidden.",
  secondarySearch: "Search applies together with filters.",
  secondaryNoDominantView: "View: without a ranked primary issue.",
  secondarySeverityInView: "In view: {critical} critical, {high} high.",
};

test("explorerSeveritySortRank orders CRITICAL above LOW", () => {
  assert.ok(explorerSeveritySortRank("CRITICAL") > explorerSeveritySortRank("LOW"));
  assert.ok(explorerSeveritySortRank("HIGH") > explorerSeveritySortRank("WARNING"));
  assert.strictEqual(explorerSeveritySortRank(""), 0);
  assert.strictEqual(explorerSeveritySortRank("UNKNOWN"), 0);
});

test("buildExplorerChipDescriptors includes search, issue, severity, sort when non-default", () => {
  const chips = buildExplorerChipDescriptors({
    searchNormalized: "foo",
    issueType: "GOD_COMPONENT",
    severity: "HIGH",
    structureFilter: "",
    ruleFilter: "",
    projectFilter: "",
    showHealthy: true,
    healthyCount: 5,
    sortValue: "name",
    sortLabel: "Name",
    issueLabels: { GOD_COMPONENT: "God component" },
    severityLabels: { high: "High" },
    chipSearchPrefix: "Search: ",
    chipIssuePrefix: "Issue: ",
    chipSeverityPrefix: "Severity: ",
    chipAreaPrefix: "Area: ",
    chipRulePrefix: "Rule: ",
    chipProjectPrefix: "Project: ",
    chipSortPrefix: "Sort: ",
    healthyHiddenChipLabel: "Healthy hidden",
  });
  assert.strictEqual(chips.length, 4);
  assert.strictEqual(chips[0].type, "search");
  assert.strictEqual(chips[1].type, "issue");
  assert.strictEqual(chips[2].type, "severity");
  assert.strictEqual(chips[3].type, "sort");
});

test("buildExplorerChipDescriptors adds healthyHidden chip when healthy rows hidden", () => {
  const chips = buildExplorerChipDescriptors({
    searchNormalized: "",
    issueType: "all",
    severity: "all",
    structureFilter: "",
    ruleFilter: "",
    projectFilter: "",
    showHealthy: false,
    healthyCount: 3,
    sortValue: "highest-risk",
    sortLabel: "Highest risk",
    issueLabels: {},
    severityLabels: {},
    chipSearchPrefix: "Search: ",
    chipIssuePrefix: "Issue: ",
    chipSeverityPrefix: "Severity: ",
    chipAreaPrefix: "Area: ",
    chipRulePrefix: "Rule: ",
    chipProjectPrefix: "Project: ",
    chipSortPrefix: "Sort: ",
    healthyHiddenChipLabel: "Without ranked primary hidden",
  });
  assert.strictEqual(chips.length, 1);
  assert.strictEqual(chips[0].type, "healthyHidden");
});

test("buildComponentsExplorerSummaryParts: range and workspace note", () => {
  const { primary, secondary } = buildComponentsExplorerSummaryParts({
    totalMatching: 10,
    showingStart: 1,
    showingEnd: 10,
    listTotal: 120,
    workspaceTotal: 500,
    sortLabel: "Warning count",
    showHealthy: false,
    issueType: "all",
    healthyHiddenCount: 40,
    criticalInMatching: 0,
    highInMatching: 0,
    searchActive: false,
    templates: summaryT,
  });
  assert.ok(primary.includes("1–10"));
  assert.ok(primary.includes("10"));
  assert.ok(primary.includes("120"));
  assert.ok(primary.includes("500"));
  assert.ok(secondary.includes("Warning count"));
  assert.ok(secondary.includes("40"));
});

test("buildComponentsExplorerSummaryParts: empty primary and search secondary", () => {
  const { primary, secondary } = buildComponentsExplorerSummaryParts({
    totalMatching: 0,
    showingStart: 0,
    showingEnd: 0,
    listTotal: 50,
    workspaceTotal: 50,
    sortLabel: "Name",
    showHealthy: true,
    issueType: "all",
    healthyHiddenCount: 0,
    criticalInMatching: 0,
    highInMatching: 0,
    searchActive: true,
    templates: summaryT,
  });
  assert.strictEqual(primary, "No matches.");
  assert.ok(secondary.includes("Search applies together with filters"));
});

test("buildComponentsExplorerSummaryParts: NO_DOMINANT_ISSUE view line", () => {
  const { secondary } = buildComponentsExplorerSummaryParts({
    totalMatching: 5,
    showingStart: 1,
    showingEnd: 5,
    listTotal: 5,
    workspaceTotal: 5,
    sortLabel: "Highest risk",
    showHealthy: true,
    issueType: "NO_DOMINANT_ISSUE",
    healthyHiddenCount: 0,
    criticalInMatching: 0,
    highInMatching: 0,
    searchActive: false,
    templates: summaryT,
  });
  assert.ok(secondary.includes("without a ranked primary"));
});

test("buildComponentsExplorerSummaryParts: severity counts when showHealthy and not NO_DOMINANT", () => {
  const { secondary } = buildComponentsExplorerSummaryParts({
    totalMatching: 5,
    showingStart: 1,
    showingEnd: 5,
    listTotal: 5,
    workspaceTotal: 5,
    sortLabel: "Highest risk",
    showHealthy: true,
    issueType: "all",
    healthyHiddenCount: 0,
    criticalInMatching: 1,
    highInMatching: 2,
    searchActive: false,
    templates: summaryT,
  });
  assert.ok(secondary.includes("1"));
  assert.ok(secondary.includes("2"));
  assert.ok(secondary.includes("critical"));
});
