import { strict as assert } from "node:assert";
import {
  resolveFinalSeverity,
  type SeverityResolutionInput,
} from "./severity-resolver";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("baseSeverity null + critical rule + score 60 → CRITICAL, inferred", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 1, high: 0, warning: 0, info: 0 },
    computedRiskScore: 60,
    dominantIssue: null,
    triggeredRuleIds: ["component-size"],
  });
  assert.strictEqual(result.finalSeverity, "CRITICAL");
  assert.strictEqual(result.confidence, "inferred");
  assert.strictEqual(result.ruleDerivedSeverity, "CRITICAL");
  assert.strictEqual(result.riskScoreSeverity, "HIGH");
});

test("baseSeverity WARNING + risk HIGH (score 55) → HIGH, measured", () => {
  const result = resolveFinalSeverity({
    baseSeverity: "WARNING",
    ruleHistogram: { critical: 0, high: 2, warning: 1, info: 0 },
    computedRiskScore: 55,
    dominantIssue: "TEMPLATE_HEAVY_COMPONENT",
    triggeredRuleIds: ["LARGE_TEMPLATE", "DEEP_STRUCTURAL_NESTING"],
  });
  assert.strictEqual(result.finalSeverity, "HIGH");
  assert.strictEqual(result.confidence, "measured");
  assert.strictEqual(result.baseSeverity, "WARNING");
});

test("baseSeverity HIGH + dominantIssue null → HIGH, measured", () => {
  const result = resolveFinalSeverity({
    baseSeverity: "HIGH",
    ruleHistogram: { critical: 0, high: 0, warning: 2, info: 0 },
    computedRiskScore: 45,
    dominantIssue: null,
    triggeredRuleIds: ["TEMPLATE_METHOD_CALL"],
  });
  assert.strictEqual(result.finalSeverity, "HIGH");
  assert.strictEqual(result.confidence, "measured");
});

test("baseSeverity null + score 30 + 2 high rules → WARNING, inferred", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 0, high: 2, warning: 0, info: 0 },
    computedRiskScore: 30,
    dominantIssue: null,
    triggeredRuleIds: ["LARGE_TEMPLATE", "GOD_COMPONENT_SMELL"],
  });
  assert.strictEqual(result.finalSeverity, "WARNING");
  assert.strictEqual(result.confidence, "inferred");
});

test("baseSeverity null + score 20 → LOW, inferred", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 0, high: 0, warning: 1, info: 2 },
    computedRiskScore: 20,
    dominantIssue: null,
    triggeredRuleIds: ["TEMPLATE_METHOD_CALL"],
  });
  assert.strictEqual(result.finalSeverity, "LOW");
  assert.strictEqual(result.confidence, "inferred");
});

test("baseSeverity null + score 75 → CRITICAL, inferred", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 0, high: 0, warning: 0, info: 0 },
    computedRiskScore: 75,
    dominantIssue: null,
    triggeredRuleIds: [],
  });
  assert.strictEqual(result.finalSeverity, "CRITICAL");
  assert.strictEqual(result.confidence, "inferred");
  assert.strictEqual(result.riskScoreSeverity, "CRITICAL");
});

test("baseSeverity CRITICAL → CRITICAL, measured", () => {
  const result = resolveFinalSeverity({
    baseSeverity: "CRITICAL",
    ruleHistogram: { critical: 1, high: 0, warning: 0, info: 0 },
    computedRiskScore: 80,
    dominantIssue: "GOD_COMPONENT",
    triggeredRuleIds: ["component-size", "constructor-dependencies"],
  });
  assert.strictEqual(result.finalSeverity, "CRITICAL");
  assert.strictEqual(result.confidence, "measured");
});

test("cleanup risk + template heavy + god component combination", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 2, high: 3, warning: 2, info: 1 },
    computedRiskScore: 65,
    dominantIssue: "CLEANUP_RISK_COMPONENT",
    triggeredRuleIds: [
      "SUBSCRIPTION_WITHOUT_DESTROY",
      "LARGE_TEMPLATE",
      "GOD_COMPONENT_SMELL",
    ],
  });
  assert.strictEqual(result.finalSeverity, "CRITICAL");
  assert.strictEqual(result.confidence, "inferred");
  assert.strictEqual(result.ruleDerivedSeverity, "CRITICAL");
});

test("explanation array is populated", () => {
  const result = resolveFinalSeverity({
    baseSeverity: null,
    ruleHistogram: { critical: 1, high: 0, warning: 0, info: 0 },
    computedRiskScore: 55,
    dominantIssue: null,
    triggeredRuleIds: ["component-size"],
  });
  assert.ok(Array.isArray(result.explanation));
  assert.ok(result.explanation.length > 0);
  assert.ok(
    result.explanation.some((e) =>
      e.toLowerCase().includes("critical") || e.toLowerCase().includes("risk")
    )
  );
});
