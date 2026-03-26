import { strict as assert } from "node:assert";
import {
  firstSentenceOrSegment,
  getRuleTitleForDisplay,
  truncatePlainText,
} from "./rule-display-helpers";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("rule-display-helpers");

test("getRuleTitleForDisplay returns registry title", () => {
  assert.ok(getRuleTitleForDisplay("component-size").length > 0);
  assert.ok(!getRuleTitleForDisplay("component-size").includes("component-size"));
});

test("getRuleTitleForDisplay returns id for unknown rule", () => {
  assert.strictEqual(getRuleTitleForDisplay("__UNKNOWN_RULE_XYZ__"), "__UNKNOWN_RULE_XYZ__");
});

test("getRuleTitleForDisplay trims id", () => {
  assert.strictEqual(
    getRuleTitleForDisplay("  component-size  "),
    getRuleTitleForDisplay("component-size")
  );
});

test("truncatePlainText respects max and ellipsis", () => {
  assert.strictEqual(truncatePlainText("short", 20), "short");
  const long = "one two three four five six seven eight nine ten";
  const out = truncatePlainText(long, 20);
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 21);
});

test("firstSentenceOrSegment takes first sentence", () => {
  assert.strictEqual(
    firstSentenceOrSegment("Do A. Then B.", 80),
    "Do A."
  );
});

test("firstSentenceOrSegment truncates long single segment", () => {
  const s = "x".repeat(100);
  const out = firstSentenceOrSegment(s, 40);
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 41);
});
