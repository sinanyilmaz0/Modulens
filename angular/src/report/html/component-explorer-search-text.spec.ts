import { strict as assert } from "node:assert";
import {
  buildComponentExplorerSearchText,
  normalizeExplorerSearchBlob,
  DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH,
} from "./component-explorer-search-text";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("component-explorer-search-text");

test("normalizes whitespace and lowercases", () => {
  assert.strictEqual(normalizeExplorerSearchBlob("  Foo\tBar  "), "foo bar");
});

test("includes path, issue, diagnostic, pattern, family, rule ids and titles", () => {
  const blob = buildComponentExplorerSearchText({
    displayName: "MyComp",
    className: "MyComp",
    filePath: "src/app/my.comp.ts",
    mainIssueFormatted: "God component",
    diagnosticLabel: "Heavy orchestration",
    patternKey: "GOD_COMPONENT",
    familyName: "Admin feature",
    triggeredRuleIds: ["rule-a", "rule-b"],
    ruleTitles: ["Title A", "Title B"],
  });
  assert.ok(blob.includes("mycomp"));
  assert.ok(blob.includes("src/app/my.comp.ts"));
  assert.ok(blob.includes("god component"));
  assert.ok(blob.includes("heavy orchestration"));
  assert.ok(blob.includes("god_component"));
  assert.ok(blob.includes("admin feature"));
  assert.ok(blob.includes("rule-a"));
  assert.ok(blob.includes("title a"));
});

test("omits empty optional fields", () => {
  const blob = buildComponentExplorerSearchText({
    displayName: "X",
    className: "",
    filePath: "/p/x.ts",
    mainIssueFormatted: "No dominant issue",
    diagnosticLabel: null,
    patternKey: null,
    familyName: undefined,
  });
  assert.ok(blob.includes("/p/x.ts"));
  assert.ok(!blob.includes("null"));
  assert.ok(!blob.includes("undefined"));
});

test("truncates long blob at maxBlobLength", () => {
  const filler = "word ".repeat(500);
  const blob = buildComponentExplorerSearchText(
    {
      displayName: "N",
      filePath: "/x.ts",
      mainIssueFormatted: "I",
      summaryLine: filler,
    },
    { maxBlobLength: 120 }
  );
  assert.ok(blob.length <= 120, `got ${blob.length}`);
});

test("default max blob is DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH", () => {
  const huge = "x".repeat(DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH + 400);
  const blob = buildComponentExplorerSearchText({
    displayName: huge,
    filePath: "/a.ts",
    mainIssueFormatted: "Y",
  });
  assert.ok(blob.length <= DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH);
});
