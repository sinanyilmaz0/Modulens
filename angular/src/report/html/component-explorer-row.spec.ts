import { strict as assert } from "node:assert";
import { renderComponentExplorerRow } from "./templates";
import { getTranslations } from "./i18n/translations";
import { getRuleById } from "../../rules/rule-registry";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("component-explorer-row");

const t = getTranslations();

test("explorer row does not leak internal anomaly attributes or raw resolver text", () => {
  const html = renderComponentExplorerRow(
    {
      filePath: "/proj/src/app/c.component.ts",
      fileName: "c.component.ts",
      className: "C",
      dominantIssue: null,
      mainIssueFormatted: "No dominant issue",
      computedSeverity: "HIGH",
      totalWarningCount: 2,
      confidence: "inferred",
      anomalyFlag: "severity-missing-with-critical-rules",
      anomalyReasons: ["High-severity rules triggered; risk score 40 supports WARNING. No component-size baseline."],
      triggeredRuleIds: ["R1"],
    },
    (issue) => issue ?? "",
    t
  );

  assert.ok(!html.includes("data-anomaly-reasons"), "must not expose raw reasons in DOM");
  assert.ok(!html.includes("data-anomaly="), "must not expose internal anomaly flag");
  assert.ok(!html.includes("data-confidence="), "must not expose raw severity confidence");
  assert.ok(!html.includes("No component-size baseline"));
  assert.ok(!html.includes("severity-missing-with-critical-rules"));
  assert.ok(!html.includes('confidence="inferred"'));
});

test("explorer row data-search includes precomputed blob (rules, diagnostic, family, pattern)", () => {
  const rule = getRuleById("GOD_COMPONENT_SMELL");
  assert.ok(rule?.title);
  const explorerSearchText = [
    "mywidget",
    "src/app/my-widget.component.ts",
    "god component",
    "diagnostic-heavy-ui",
    "GOD_COMPONENT",
    "checkout family",
    "GOD_COMPONENT_SMELL",
    rule!.title,
  ]
    .join(" ")
    .toLowerCase();
  const html = renderComponentExplorerRow(
    {
      filePath: "src/app/my-widget.component.ts",
      fileName: "my-widget.component.ts",
      className: "MyWidget",
      dominantIssue: "GOD_COMPONENT",
      mainIssueFormatted: "God component",
      computedSeverity: "HIGH",
      totalWarningCount: 1,
      confidence: "measured",
      triggeredRuleIds: ["GOD_COMPONENT_SMELL"],
      explorerSearchText,
      familyName: "Checkout family",
      patternKey: "GOD_COMPONENT",
    },
    (issue) => issue ?? "",
    t
  );
  assert.ok(html.includes('data-search="'));
  assert.ok(html.includes("god_component_smell"));
  assert.ok(html.includes("god component smell"));
  assert.ok(html.includes("diagnostic-heavy-ui"));
  assert.ok(html.includes("checkout family"));
});
