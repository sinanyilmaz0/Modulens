import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as path from "path";
import { readCliPackageVersion } from "./package-version";

console.log("cli/package-version");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("readCliPackageVersion matches angular/package.json", () => {
  const pkgPath = path.join(__dirname, "../../package.json");
  const raw = fs.readFileSync(pkgPath, "utf-8");
  const expected = (JSON.parse(raw) as { version: string }).version;
  assert.strictEqual(readCliPackageVersion(), expected);
  assert.ok(/^\d+\.\d+\.\d+/.test(readCliPackageVersion()), "semver-like version");
});
