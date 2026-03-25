import { strict as assert } from "node:assert";
import { mapSeverityReasonsForDisplay } from "./severity-reason-copy";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("severity-reason-copy");

test("maps baseline phrasing out of user-facing lines", () => {
  const out = mapSeverityReasonsForDisplay([
    "Critical rules triggered; risk score 60 supports CRITICAL. No component-size baseline.",
  ]);
  assert.ok(out && out.length >= 1);
  const joined = (out ?? []).join(" ");
  assert.ok(!joined.includes("No component-size baseline"), "raw baseline phrase must not appear");
  assert.ok(!joined.includes("component-size baseline"));
});

test("maps metrics-missing internal note to advisory wording", () => {
  const out = mapSeverityReasonsForDisplay([
    "Warnings present but complexity metrics for this component are missing or incomplete.",
  ]);
  assert.ok(out && out[0]?.includes("advisory"));
});

test("empty input yields undefined", () => {
  assert.strictEqual(mapSeverityReasonsForDisplay(undefined), undefined);
  assert.strictEqual(mapSeverityReasonsForDisplay([]), undefined);
});
