import type { ScanResult } from "../core/scan-result";
import type { TopRefactorTarget } from "./refactor-plan-models";

/** Human-readable pattern labels by dominant issue */
const PATTERN_LABEL_BY_ISSUE: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Template logic extraction",
  GOD_COMPONENT: "Split presentation and orchestration",
  CLEANUP_RISK_COMPONENT: "Verify subscription cleanup",
  ORCHESTRATION_HEAVY_COMPONENT: "Isolate orchestration",
  LIFECYCLE_RISKY_COMPONENT: "Lifecycle risk mitigation",
};

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

/** Compute pattern signature from dominantIssue + refactorSteps */
function computePatternSignature(
  dominantIssue: string | null,
  refactorSteps: string[]
): string {
  const issue = dominantIssue ?? "unknown";
  const stepsKey = JSON.stringify(refactorSteps.slice().sort());
  return `${issue}:${simpleHash(stepsKey)}`;
}

/** Build filePath -> familyName map from scan result */
function buildFilePathToFamilyMap(result: ScanResult): Map<string, string> {
  const map = new Map<string, string>();

  for (const insight of result.componentFamilies ?? []) {
    for (const c of insight.components ?? []) {
      if (c.filePath) map.set(c.filePath, insight.familyName);
    }
  }

  for (const family of [
    ...(result.similarComponentFamilies ?? []),
    ...(result.extractionCandidates ?? []),
    ...(result.repeatedArchitectureHotspots ?? []),
  ]) {
    for (const m of family.members ?? []) {
      if (m.filePath) map.set(m.filePath, family.familyName);
    }
  }

  return map;
}

/** Generate component-specific one-liner for a target */
function buildComponentSpecificNote(target: TopRefactorTarget): string {
  const parts: string[] = [];

  if (target.lineCount > 800) {
    parts.push(`${target.lineCount} LOC`);
  } else if (target.lineCount > 500) {
    parts.push(`${target.lineCount} LOC`);
  }

  if (target.dependencyCount >= 7) {
    parts.push(`${target.dependencyCount} deps`);
  } else if (target.dependencyCount >= 5) {
    parts.push(`${target.dependencyCount} deps`);
  }

  if (target.possibleExtractions?.length > 0) {
    const extras = target.possibleExtractions.slice(0, 2).join(", ");
    parts.push(`consider extracting ${extras}`);
  }

  if (parts.length === 0) {
    return `${target.lineCount} LOC, ${target.dependencyCount} deps`;
  }

  return parts.join("; ");
}

/** Group targets by pattern signature; returns map of groupId -> targets */
export function groupTargetsByPattern(
  targets: TopRefactorTarget[]
): Map<string, TopRefactorTarget[]> {
  const groups = new Map<string, TopRefactorTarget[]>();

  for (const t of targets) {
    const sig = computePatternSignature(t.dominantIssue, t.refactorSteps ?? []);
    const existing = groups.get(sig) ?? [];
    existing.push(t);
    groups.set(sig, existing);
  }

  return groups;
}

/** Enrich targets with pattern group metadata, component-specific notes, and family names */
export function enrichTargetsWithDedupeMetadata(
  targets: TopRefactorTarget[],
  result: ScanResult
): TopRefactorTarget[] {
  const groups = groupTargetsByPattern(targets);
  const filePathToFamily = buildFilePathToFamilyMap(result);

  const enriched: TopRefactorTarget[] = [];

  for (const t of targets) {
    const sig = computePatternSignature(t.dominantIssue, t.refactorSteps ?? []);
    const group = groups.get(sig) ?? [t];
    const patternGroupSize = group.length;
    const patternGroupId = patternGroupSize > 1 ? sig : undefined;
    const patternLabel =
      t.dominantIssue && PATTERN_LABEL_BY_ISSUE[t.dominantIssue]
        ? PATTERN_LABEL_BY_ISSUE[t.dominantIssue]
        : undefined;
    const componentSpecificNote = buildComponentSpecificNote(t);
    const familyName = filePathToFamily.get(t.filePath);

    let sameFamilyComponentNames: string[] | undefined;
    if (familyName && patternGroupSize > 1) {
      sameFamilyComponentNames = group
        .filter((o) => o.filePath !== t.filePath && filePathToFamily.get(o.filePath) === familyName)
        .map((o) => o.componentName)
        .filter(Boolean);
      if (sameFamilyComponentNames.length === 0) sameFamilyComponentNames = undefined;
    }

    enriched.push({
      ...t,
      patternGroupId,
      patternGroupSize: patternGroupSize > 1 ? patternGroupSize : undefined,
      patternLabel,
      componentSpecificNote,
      familyName,
      sameFamilyComponentNames,
    });
  }

  return enriched;
}
