import { strict as assert } from "node:assert";
import { escapeHtml } from "./templates";

console.log("escape-html");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("escapes < and > to prevent script injection", () => {
  const input = "<script>alert(1)</script>";
  const result = escapeHtml(input);
  assert.ok(!result.includes("<script>"), "should not contain raw script tag");
  assert.ok(result.includes("&lt;"), "should contain escaped <");
  assert.ok(result.includes("&gt;"), "should contain escaped >");
});

test("escapes double quotes", () => {
  const input = 'foo"bar';
  const result = escapeHtml(input);
  assert.strictEqual(result, 'foo&quot;bar');
});

test("escapes ampersand", () => {
  const input = "a & b";
  const result = escapeHtml(input);
  assert.strictEqual(result, "a &amp; b");
});

test("escapes combined XSS payload so it is not interpreted as HTML", () => {
  const input = '<img src=x onerror="alert(1)">';
  const result = escapeHtml(input);
  assert.ok(!result.includes("<") && !result.includes(">"), "angle brackets must be escaped");
  assert.ok(result.includes("&lt;") && result.includes("&gt;") && result.includes("&quot;"));
});
