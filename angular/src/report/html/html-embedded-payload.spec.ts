import { strict as assert } from "node:assert";
import { normalizeFileKey } from "../snapshot-compare-input";
import { buildHtmlClientComponentDetailsMap, buildHtmlClientExplorerItems } from "./html-embedded-payload";
import type { ComponentDetailEntry, ComponentsExplorerItem } from "./html-report-presenter";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("html-embedded-payload");

test("client component map drops internal severity debug fields", () => {
  const row: ComponentDetailEntry = {
    filePath: "/a/x.component.ts",
    fileName: "x.component.ts",
    confidence: "inferred",
    anomalyFlag: "severity-missing-with-critical-rules",
    anomalyReasons: ["Internal resolver line"],
    severityTrustSummary: "Elevated from combined rule signals and risk score",
  };
  const out = buildHtmlClientComponentDetailsMap({ k: row }).k!;
  assert.ok(!("confidence" in out));
  assert.ok(!("anomalyFlag" in out));
  assert.ok(!("anomalyReasons" in out));
  assert.strictEqual(out.severityTrustSummary, row.severityTrustSummary);
  assert.strictEqual(out.filePath, row.filePath);
  assert.strictEqual(out.compareComponentKey, normalizeFileKey(row.filePath!));
});

test("client explorer items drop internal fields", () => {
  const item: ComponentsExplorerItem = {
    filePath: "/a/y.component.ts",
    fileName: "y.component.ts",
    confidence: "low",
    anomalyFlag: "metrics-missing-with-warnings",
    anomalyReasons: ["x"],
    computedSeverity: "WARNING",
  };
  const [out] = buildHtmlClientExplorerItems([item]);
  assert.ok(!("confidence" in out));
  assert.ok(!("anomalyFlag" in out));
  assert.ok(!("anomalyReasons" in out));
  assert.strictEqual(out.computedSeverity, "WARNING");
});

test("client component map omits roleSignals and keeps only matched breakdown signals without weight", () => {
  const row: ComponentDetailEntry = {
    filePath: "/a/x.component.ts",
    fileName: "x.component.ts",
    roleConfidence: 0.5,
    roleSignals: ["signal-a", "signal-b"],
    roleConfidenceBreakdown: {
      score: 0.5,
      contributingSignals: [
        { signal: "x", weight: 0.8, matched: true, note: "n1" },
        { signal: "y", weight: 0.2, matched: false, note: "" },
      ],
    },
  };
  const out = buildHtmlClientComponentDetailsMap({ k: row }).k!;
  assert.ok(!("roleSignals" in out));
  const bd = out.roleConfidenceBreakdown;
  assert.ok(bd);
  assert.strictEqual(bd.contributingSignals.length, 1);
  assert.strictEqual(bd.contributingSignals[0]!.signal, "x");
  assert.strictEqual(bd.contributingSignals[0]!.matched, true);
  assert.ok(!("weight" in (bd.contributingSignals[0] as object)));
});

test("roleSignals fold into breakdown when breakdown has no matched signals", () => {
  const row: ComponentDetailEntry = {
    filePath: "/a/z.component.ts",
    fileName: "z.component.ts",
    roleConfidence: 0.3,
    roleSignals: ["naming-convention"],
    roleConfidenceBreakdown: {
      score: 0.3,
      contributingSignals: [{ signal: "y", weight: 1, matched: false, note: "" }],
    },
  };
  const out = buildHtmlClientComponentDetailsMap({ k: row }).k!;
  assert.ok(!("roleSignals" in out));
  const bd = out.roleConfidenceBreakdown;
  assert.ok(bd?.contributingSignals?.length);
  assert.ok(bd!.contributingSignals!.every((s) => s.matched));
});

test("client map slims lifecycle template responsibility to drawer-used fields", () => {
  const row: ComponentDetailEntry = {
    filePath: "/a/l.component.ts",
    fileName: "l.component.ts",
    lifecycle: { subscribeCount: 1, riskySubscribeCount: 2, setTimeoutCount: 99 },
    template: { lineCount: 10, methodCallCount: 3, eventBindingCount: 9 },
    responsibility: { serviceOrchestrationCount: 2, methodCount: 88 },
  };
  const out = buildHtmlClientComponentDetailsMap({ k: row }).k!;
  assert.deepStrictEqual(out.lifecycle, { subscribeCount: 1, riskySubscribeCount: 2 });
  assert.deepStrictEqual(out.template, { lineCount: 10, methodCallCount: 3 });
  assert.deepStrictEqual(out.responsibility, { serviceOrchestrationCount: 2 });
});
