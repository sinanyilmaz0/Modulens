import type { StructureConcern } from "./structure-models";

export interface StructureConcernValidationResult {
  valid: boolean;
  checks: {
    sumEqualsAffectedCount: boolean;
    areasMatchCounts: boolean;
    noDuplicateAreas: boolean;
    samplePathsSubset: boolean;
  };
}

/**
 * Validates that a structure concern's derived fields are consistent.
 * - affectedAreasWithCounts sum must equal affectedCount
 * - affectedAreas must match affectedAreasWithCounts area names
 * - No duplicate area labels
 * - samplePaths must be a subset of affectedPaths
 */
export function validateStructureConcern(c: StructureConcern): StructureConcernValidationResult {
  const areaCounts = c.affectedAreasWithCounts ?? [];
  const areas = c.affectedAreas ?? [];
  const sum = areaCounts.reduce((s, x) => s + x.count, 0);
  const affectedSet = new Set(c.affectedPaths);

  const checks = {
    sumEqualsAffectedCount: sum === c.affectedCount,
    areasMatchCounts:
      areas.length === 0 ||
      areas.every((a) => areaCounts.some((x) => x.area === a)),
    noDuplicateAreas: new Set(areas).size === areas.length,
    samplePathsSubset: c.samplePaths.every((p) => affectedSet.has(p)),
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checks,
  };
}
