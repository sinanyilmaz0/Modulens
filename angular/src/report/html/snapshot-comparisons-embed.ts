import type {
  CompactComponentChange,
  ProjectComparison,
  RuleDeltaRow,
  SnapshotComparisonPayload,
} from "../snapshot-compare";

/** Drop empty rule arrays and null dominant issues to shrink embedded JSON; UI treats missing like empty/null. */
function slimCompactComponentChange(c: CompactComponentChange): CompactComponentChange {
  const out: Record<string, unknown> = {
    filePath: c.filePath,
    className: c.className,
    changeType: c.changeType,
    previousWarningCount: c.previousWarningCount,
    currentWarningCount: c.currentWarningCount,
  };
  if (c.previousDominantIssue != null) out.previousDominantIssue = c.previousDominantIssue;
  if (c.currentDominantIssue != null) out.currentDominantIssue = c.currentDominantIssue;
  if (c.addedRules && c.addedRules.length > 0) out.addedRules = c.addedRules;
  if (c.removedRules && c.removedRules.length > 0) out.removedRules = c.removedRules;
  return out as unknown as CompactComponentChange;
}

function slimProjectComparison(pc: ProjectComparison): ProjectComparison {
  const byKey: Record<string, CompactComponentChange> = {};
  for (const [key, ch] of Object.entries(pc.componentChangesByKey ?? {})) {
    byKey[key] = slimCompactComponentChange(ch);
  }
  const topW = (pc.topWorsenedComponents ?? []).map(slimCompactComponentChange);
  const topI = (pc.topImprovedComponents ?? []).map(slimCompactComponentChange);
  return {
    ...pc,
    componentChangesByKey: byKey,
    topWorsenedComponents: topW,
    topImprovedComponents: topI,
  };
}

/** Workspace rule rows are small; optional trim of flat deltas. */
function slimRuleRow(r: RuleDeltaRow): RuleDeltaRow {
  return r;
}

export function slimSnapshotComparisonsForHtml(
  payloads: Record<string, SnapshotComparisonPayload>
): Record<string, SnapshotComparisonPayload> {
  const out: Record<string, SnapshotComparisonPayload> = {};
  for (const [baselineKey, p] of Object.entries(payloads)) {
    const projectComparisons: Record<string, ProjectComparison> = {};
    for (const [sr, pc] of Object.entries(p.projectComparisons ?? {})) {
      projectComparisons[sr] = slimProjectComparison(pc);
    }
    out[baselineKey] = {
      ...p,
      projectComparisons,
      topRuleIncreasesWorkspace: (p.topRuleIncreasesWorkspace ?? []).map(slimRuleRow),
      topRuleDecreasesWorkspace: (p.topRuleDecreasesWorkspace ?? []).map(slimRuleRow),
    };
  }
  return out;
}
