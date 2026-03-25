import { strict as assert } from "node:assert";
import { renderComponentExplorerRow } from "./templates";
import { getTranslations } from "./i18n/translations";

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
