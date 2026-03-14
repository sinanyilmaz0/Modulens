import { strict as assert } from "node:assert";
import { computeStructureConcerns } from "./structure-analyzer";
import { validateStructureConcern } from "./structure-concern-validation";
import type { StructureConcern } from "./structure-models";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("structure-analyzer / structure-concern-validation");

test("validateStructureConcern passes for valid concern", () => {
  const c: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: ["/app/features/admin/pages/dashboard/dashboard.component.ts", "/app/features/admin/pages/users/users.component.ts"],
    affectedCount: 2,
    explanation: "Test",
    whyItMatters: "Test",
    refactorDirection: "Test",
    samplePaths: ["/app/features/admin/pages/dashboard/dashboard.component.ts"],
    affectedAreas: ["admin"],
    affectedAreasWithCounts: [{ area: "admin", count: 2 }],
    confidence: "medium",
  };
  const r = validateStructureConcern(c);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.checks.sumEqualsAffectedCount, true);
  assert.strictEqual(r.checks.samplePathsSubset, true);
});

test("validateStructureConcern fails when sum !== affectedCount", () => {
  const c: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: ["/a", "/b", "/c"],
    affectedCount: 3,
    explanation: "Test",
    whyItMatters: "Test",
    refactorDirection: "Test",
    samplePaths: ["/a"],
    affectedAreas: ["x"],
    affectedAreasWithCounts: [{ area: "x", count: 2 }],
    confidence: "medium",
  };
  const r = validateStructureConcern(c);
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.checks.sumEqualsAffectedCount, false);
});

test("validateStructureConcern fails when samplePaths not subset of affectedPaths", () => {
  const c: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: ["/a", "/b"],
    affectedCount: 2,
    explanation: "Test",
    whyItMatters: "Test",
    refactorDirection: "Test",
    samplePaths: ["/a", "/c"],
    affectedAreas: ["x"],
    affectedAreasWithCounts: [{ area: "x", count: 2 }],
    confidence: "medium",
  };
  const r = validateStructureConcern(c);
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.checks.samplePathsSubset, false);
});

test("validateStructureConcern fails when duplicate area labels present", () => {
  const c: StructureConcern = {
    concernType: "deep-nesting",
    affectedPaths: ["/a", "/b"],
    affectedCount: 2,
    explanation: "Test",
    whyItMatters: "Test",
    refactorDirection: "Test",
    samplePaths: ["/a"],
    affectedAreas: ["admin", "admin"],
    affectedAreasWithCounts: [
      { area: "admin", count: 1 },
      { area: "admin", count: 1 },
    ],
    confidence: "medium",
  };
  const r = validateStructureConcern(c);
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.checks.noDuplicateAreas, false);
});

test("computeStructureConcerns produces concerns that pass validation", () => {
  const paths: string[] = [];
  for (let i = 0; i < 16; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  assert.ok(result.concerns.length > 0, "Should produce at least one concern (folder-density)");
  for (const c of result.concerns) {
    const r = validateStructureConcern(c);
    assert.strictEqual(r.valid, true, `Concern ${c.concernType} should pass validation: ${JSON.stringify(r.checks)}`);
  }
});

test("concern invariant: no duplicate area labels in computed concerns", () => {
  const paths: string[] = [];
  for (let i = 0; i < 16; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  for (const c of result.concerns) {
    const r = validateStructureConcern(c);
    assert.strictEqual(
      r.checks.noDuplicateAreas,
      true,
      `Concern ${c.concernType} should not have duplicate area labels`
    );
  }
});

test("concern invariant: affectedAreasWithCounts sum equals affectedCount", () => {
  const paths: string[] = [];
  for (let i = 0; i < 16; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  for (const c of result.concerns) {
    const sum = (c.affectedAreasWithCounts ?? []).reduce((s, x) => s + x.count, 0);
    assert.strictEqual(sum, c.affectedCount, `Concern ${c.concernType}: sum ${sum} !== affectedCount ${c.affectedCount}`);
  }
});

test("concern invariant: affectedAreas matches affectedAreasWithCounts area names", () => {
  const paths: string[] = [];
  for (let i = 0; i < 16; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  for (const c of result.concerns) {
    const counts = c.affectedAreasWithCounts ?? [];
    const areas = c.affectedAreas ?? [];
    const countAreas = new Set(counts.map((x) => x.area));
    const areaSet = new Set(areas);
    assert.strictEqual(countAreas.size, areaSet.size, `Concern ${c.concernType}: area count mismatch`);
    for (const a of areas) {
      assert.ok(countAreas.has(a), `Concern ${c.concernType}: area ${a} not in counts`);
    }
  }
});

test("concern invariant: samplePaths subset of affectedPaths", () => {
  const paths: string[] = [];
  for (let i = 0; i < 16; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  for (const c of result.concerns) {
    const affectedSet = new Set(c.affectedPaths);
    for (const p of c.samplePaths) {
      assert.ok(affectedSet.has(p), `Concern ${c.concernType}: sample path ${p} not in affectedPaths`);
    }
  }
});

test("concern invariant: samplePaths length <= 5", () => {
  const paths: string[] = [];
  for (let i = 0; i < 20; i++) {
    paths.push(`C:/proj/src/app/shared/dense/file-${i}.component.ts`);
  }
  const result = computeStructureConcerns({
    componentPaths: paths,
    componentDiagnostics: [],
    workspacePath: "C:/proj",
  });
  for (const c of result.concerns) {
    assert.ok(c.samplePaths.length <= 5, `Concern ${c.concernType}: samplePaths.length ${c.samplePaths.length} > 5`);
  }
});
