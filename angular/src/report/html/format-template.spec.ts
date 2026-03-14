import { strict as assert } from "node:assert";
import { formatTemplate, ensureNoUnresolvedTokens } from "./format-template";

console.log("format-template");

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

test("formatTemplate replaces known tokens and leaves no unresolved placeholders", () => {
  const template = "{project} project carries the highest warning density";
  const result = formatTemplate(template, { project: "foo-app" }, { context: "test.project" });
  assert.equal(result, "foo-app project carries the highest warning density");
});

test("formatTemplate warns and falls back when tokens are unresolved", () => {
  const template = "{project} project carries the highest warning density";
  const originalWarn = console.warn;
  let warned = false;
  // eslint-disable-next-line no-console
  console.warn = () => {
    warned = true;
  };

  const fallback = "Warning density is distributed across multiple projects";
  const result = formatTemplate(template, {}, {
    fallback,
    context: "test.unresolved",
  });

  assert.equal(result, fallback);
  assert.ok(warned, "console.warn should be called for unresolved tokens");
  console.warn = originalWarn;
});

test("formatTemplate handles multiple tokens when all are provided", () => {
  const template = "{n} of {total} components";
  const result = formatTemplate(
    template,
    { n: 5, total: 10 },
    { context: "test.multiple" }
  );
  assert.equal(result, "5 of 10 components");
});

test("ensureNoUnresolvedTokens passes through clean strings", () => {
  const value = "All good";
  const result = ensureNoUnresolvedTokens(value, {
    fallback: "fallback",
    context: "test.clean",
  });
  assert.equal(result, "All good");
});

test("ensureNoUnresolvedTokens falls back on unresolved tokens", () => {
  const value = "{unknown} token";
  const originalWarn = console.warn;
  let warned = false;
  // eslint-disable-next-line no-console
  console.warn = () => {
    warned = true;
  };

  const fallback = "Warning density is distributed across multiple projects";
  const result = ensureNoUnresolvedTokens(value, {
    fallback,
    context: "test.guard",
  });

  assert.equal(result, fallback);
  assert.ok(warned, "console.warn should be called for unresolved tokens");
  console.warn = originalWarn;
});


