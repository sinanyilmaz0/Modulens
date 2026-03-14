import { strict as assert } from "node:assert";
import { getBreakdownNouns, formatWorstBucketFinding } from "./breakdown-labels";
import { getTranslations } from "./i18n/translations";

console.log("breakdown-labels");

function test(name: string, fn: () => void): void {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

const t = getTranslations();

test("getBreakdownNouns returns mode-aware nouns", () => {
  assert.strictEqual(getBreakdownNouns("project").singular, "project");
  assert.strictEqual(getBreakdownNouns("feature-area").singular, "feature area");
  assert.strictEqual(getBreakdownNouns("source-root").singular, "source root");
  assert.strictEqual(getBreakdownNouns("package").singular, "package");
  assert.strictEqual(getBreakdownNouns(undefined).singular, "cluster");
});

test("formatWorstBucketFinding uses project-specific copy in project mode", () => {
  const msg = formatWorstBucketFinding("Admin", "2.5", "project", t);
  assert.ok(
    msg.toLowerCase().includes("admin"),
    "message should include the area name"
  );
  assert.ok(
    msg.toLowerCase().includes("project"),
    "project mode should use project-specific wording"
  );
});

test("formatWorstBucketFinding avoids hard-coded 'project' noun in non-project modes", () => {
  const area = "Admin";
  const msgFeature = formatWorstBucketFinding(area, "2.5", "feature-area", t);
  const msgSource = formatWorstBucketFinding(area, "2.5", "source-root", t);
  const msgPackage = formatWorstBucketFinding(area, "2.5", "package", t);

  for (const msg of [msgFeature, msgSource, msgPackage]) {
    assert.ok(
      msg.toLowerCase().includes(area.toLowerCase()),
      "message should include area label"
    );
    assert.ok(
      !msg.toLowerCase().includes("project project"),
      "non-project modes should not duplicate 'project' noun"
    );
  }
});

test("formatWorstBucketFinding interpolates project name without leaking placeholders", () => {
  const msg = formatWorstBucketFinding("foo-app", "3.2", "project", t);
  assert.ok(
    msg.includes("foo-app"),
    "message should include the project name"
  );
  assert.ok(
    !msg.includes("{project}"),
    "message should not contain raw {project} placeholder"
  );
});

