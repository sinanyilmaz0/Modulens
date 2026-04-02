import { strict as assert } from "node:assert";
import * as path from "path";
import {
  parseScanFormat,
  resolveScanOutput,
  shouldOpenBrowser,
  slugifyWorkspaceName,
} from "./scan-output";

console.log("cli/scan-output");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

const workspaceRoot = path.resolve("/tmp", "my-workspace");

test("slugifyWorkspaceName trims and slugifies", () => {
  assert.strictEqual(slugifyWorkspaceName("  My App!  "), "My-App");
  assert.strictEqual(slugifyWorkspaceName("---"), "workspace");
  assert.strictEqual(slugifyWorkspaceName("my_app"), "my_app");
});

test("parseScanFormat accepts html/json case-insensitively", () => {
  assert.strictEqual(parseScanFormat("html"), "html");
  assert.strictEqual(parseScanFormat("JSON"), "json");
  assert.strictEqual(parseScanFormat("  Html  "), "html");
  assert.strictEqual(parseScanFormat("yaml"), null);
  assert.strictEqual(parseScanFormat(""), null);
});

test("resolveScanOutput default html path in workspace", () => {
  const r = resolveScanOutput({
    format: "html",
    outputOption: undefined,
    workspaceRootAbsolute: workspaceRoot,
    cwd: "/cwd",
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.strictEqual(r.target.kind, "file");
  if (r.target.kind !== "file") return;
  assert.strictEqual(
    r.target.absolutePath,
    path.join(workspaceRoot, ".modulens", "reports", "modulens-angular-report-my-workspace.html")
  );
});

test("resolveScanOutput default json path in workspace", () => {
  const r = resolveScanOutput({
    format: "json",
    outputOption: undefined,
    workspaceRootAbsolute: workspaceRoot,
    cwd: "/cwd",
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.strictEqual(r.target.kind, "file");
  if (r.target.kind !== "file") return;
  assert.strictEqual(
    r.target.absolutePath,
    path.join(workspaceRoot, ".modulens", "reports", "modulens-angular-report-my-workspace.json")
  );
});

test("resolveScanOutput resolves explicit path from cwd", () => {
  const r = resolveScanOutput({
    format: "json",
    outputOption: "reports/out.json",
    workspaceRootAbsolute: workspaceRoot,
    cwd: "/projects",
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.strictEqual(r.target.kind, "file");
  if (r.target.kind !== "file") return;
  assert.strictEqual(r.target.absolutePath, path.resolve("/projects", "reports/out.json"));
});

test("resolveScanOutput stdout for json and -", () => {
  const r = resolveScanOutput({
    format: "json",
    outputOption: "-",
    workspaceRootAbsolute: workspaceRoot,
    cwd: "/cwd",
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.strictEqual(r.target.kind, "stdout");
});

test("resolveScanOutput rejects html with stdout dash", () => {
  const r = resolveScanOutput({
    format: "html",
    outputOption: "-",
    workspaceRootAbsolute: workspaceRoot,
    cwd: "/cwd",
  });
  assert.ok(!r.ok);
  if (r.ok) return;
  assert.ok(r.message.includes("stdout"));
});

test("shouldOpenBrowser: html opens unless --no-open", () => {
  assert.strictEqual(shouldOpenBrowser("html", false), true);
  assert.strictEqual(shouldOpenBrowser("html", true), false);
  assert.strictEqual(shouldOpenBrowser("json", false), false);
  assert.strictEqual(shouldOpenBrowser("json", true), false);
});
