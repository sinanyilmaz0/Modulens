import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getAngularProjects } from "./workspace-reader";
import { ModulensError } from "../../core/modulens-error";

console.log("workspace-reader");

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

test("returns empty array when angular.json does not exist", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-test-"));
  try {
    const result = getAngularProjects(tmpDir);
    assert.deepStrictEqual(result, [], "should return empty array");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("throws ModulensError with JSON_PARSE_ERROR when angular.json is invalid JSON", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-test-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "angular.json"), "{ invalid json }", "utf-8");
    let threw = false;
    try {
      getAngularProjects(tmpDir);
    } catch (e) {
      threw = true;
      assert.ok(e instanceof ModulensError, "should throw ModulensError");
      assert.strictEqual((e as ModulensError).code, "JSON_PARSE_ERROR");
      assert.ok(
        (e as ModulensError).message.toLowerCase().includes("parse"),
        "message should mention parse"
      );
    }
    assert.ok(threw, "should have thrown");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("throws ModulensError with INVALID_ANGULAR_JSON when projects is missing", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-test-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "angular.json"), "{}", "utf-8");
    let threw = false;
    try {
      getAngularProjects(tmpDir);
    } catch (e) {
      threw = true;
      assert.ok(e instanceof ModulensError, "should throw ModulensError");
      assert.strictEqual((e as ModulensError).code, "INVALID_ANGULAR_JSON");
      assert.ok(
        (e as ModulensError).message.includes("projects"),
        "message should mention projects"
      );
    }
    assert.ok(threw, "should have thrown");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("returns source roots when angular.json is valid", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "modulens-test-"));
  try {
    const angularJson = {
      projects: {
        app: { sourceRoot: "src" },
        lib: { sourceRoot: "libs/shared/src" },
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, "angular.json"),
      JSON.stringify(angularJson),
      "utf-8"
    );
    const result = getAngularProjects(tmpDir);
    assert.deepStrictEqual(result, ["src", "libs/shared/src"]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
