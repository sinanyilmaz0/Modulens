import { strict as assert } from "node:assert";
import { deriveComponentSummaryLine } from "./feature-extraction";

console.log("components-summary-line");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("dominant cleanup risk uses expert-toned lifecycle copy", () => {
  const line = deriveComponentSummaryLine({
    dominantIssue: "CLEANUP_RISK_COMPONENT",
    subscriptionCount: 5,
    computedSeverity: "HIGH",
  });

  assert.ok(line, "summary line should be defined");
  const value = line ?? "";
  assert.ok(
    value.toLowerCase().includes("teardown") ||
      value.toLowerCase().includes("lifecycle"),
    "cleanup summary should talk about teardown / lifecycle"
  );
  assert.ok(
    !value.includes("Check cleanup paths for subscriptions and timers."),
    "legacy cleanup boilerplate should not appear"
  );
});

test("dominant orchestration-heavy uses orchestration-focused copy", () => {
  const line = deriveComponentSummaryLine({
    dominantIssue: "ORCHESTRATION_HEAVY_COMPONENT",
    serviceOrchestrationCount: 6,
    computedSeverity: "HIGH",
  });

  assert.ok(line, "summary line should be defined");
  const value = line ?? "";
  assert.ok(
    value.toLowerCase().includes("orchestration") ||
      value.toLowerCase().includes("workflow"),
    "orchestration summary should highlight workflow orchestration"
  );
  assert.ok(
    !value.includes("Extract service orchestration into dedicated services."),
    "legacy orchestration boilerplate should not appear"
  );
});

test("rule-group lifecycle fallback avoids legacy cleanup boilerplate", () => {
  const line = deriveComponentSummaryLine({
    triggeredRuleIds: ["lifecycle-cleanup::test"],
    computedSeverity: "WARNING",
  });

  assert.ok(line, "summary line should be defined");
  const value = line ?? "";
  assert.ok(
    !value.includes("Check cleanup paths for subscriptions and timers."),
    "lifecycle fallback should not use the old cleanup boilerplate"
  );
});

test("anomaly note for inferred severity uses refined wording", () => {
  const line = deriveComponentSummaryLine({
    triggeredRuleIds: ["some-critical-rule", "another-critical-rule"],
    computedSeverity: "HIGH",
    confidence: "inferred",
  });

  assert.ok(line, "summary line should be defined");
  const value = line ?? "";
  assert.ok(
    value.toLowerCase().includes("rule patterns") ||
      value.toLowerCase().includes("several rule") ||
      value.toLowerCase().includes("elevated risk"),
    "anomaly note should reference combined rule signals without internal jargon"
  );
  assert.ok(
    !value.includes("Risk is inferred from rules; treat this as suspicious."),
    "legacy anomaly boilerplate should not appear"
  );
  assert.ok(!/\binferred\b/i.test(value), "summary line should not expose the word 'inferred' to users");
});

test("metric-based hints still provide a concrete action", () => {
  const line = deriveComponentSummaryLine({
    templateLineCount: 200,
    structuralDepth: 6,
  });

  assert.ok(line, "summary line should be defined");
  const value = line ?? "";
  assert.ok(
    value.toLowerCase().includes("template") ||
      value.toLowerCase().includes("sub-views") ||
      value.toLowerCase().includes("structural depth"),
    "metric hint should mention templates / structure"
  );
});

test("severity-based fallback for warnings is non-empty and concrete", () => {
  const line = deriveComponentSummaryLine({
    computedSeverity: "WARNING",
    totalWarningCount: 3,
  });

  assert.ok(line, "summary line should be defined for warning rows");
  const value = line ?? "";
  assert.ok(
    value.toLowerCase().includes("cleanups") ||
      value.toLowerCase().includes("hotspot"),
    "warning fallback should talk about small cleanups / hotspot prevention"
  );
});

