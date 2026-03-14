import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { runScan } from "./run-scan";
import { ModulensError } from "./modulens-error";

console.log("run-scan-validation");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("run-scan.ts does not call process.exit", () => {
  const runScanPath = path.join(__dirname, "run-scan.ts");
  const runScanJsPath = path.join(__dirname, "run-scan.js");
  const content = fs.existsSync(runScanPath)
    ? fs.readFileSync(runScanPath, "utf-8")
    : fs.existsSync(runScanJsPath)
      ? fs.readFileSync(runScanJsPath, "utf-8")
      : "";
  assert.ok(
    !content.includes("process.exit"),
    "run-scan must not call process.exit; core should throw, CLI handles exit"
  );
});

test("runScan throws ModulensError on invalid angular.json (no crash)", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-runscan-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "angular.json"), "{ broken json", "utf-8");
    let threw = false;
    try {
      await runScan(tmpDir);
    } catch (e) {
      threw = true;
      assert.ok(e instanceof ModulensError, "should throw ModulensError");
      assert.strictEqual((e as ModulensError).code, "JSON_PARSE_ERROR");
    }
    assert.ok(threw, "should throw on invalid JSON, not crash");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
