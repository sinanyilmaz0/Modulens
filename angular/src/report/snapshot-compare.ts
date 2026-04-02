import type { DiagnosticStatus } from "../diagnostic/diagnostic-models";
import type { SnapshotSummary } from "./snapshot-history";
import type { CompareComponentSlice, CompareInput, CompareProjectSlice, CompareWorkspaceSlice } from "./snapshot-compare-input";

export type ComponentChangeType =
  | "newlyFlagged"
  | "resolved"
  | "worsened"
  | "improved"
  | "issueChanged"
  | "unchanged";

export interface WorkspaceComparison {
  totalFindings: { previous: number; current: number; delta: number };
  riskLevel: { previous: string; current: string };
  overallScore: { previous: number; current: number; delta: number };
  componentScore: { previous: number; current: number; delta: number };
  lifecycleScore: { previous: number; current: number; delta: number };
  templateScore: { previous: number; current: number; delta: number };
  responsibilityScore: { previous: number; current: number; delta: number };
  criticalCount: { previous: number; current: number; delta: number };
  highCount: { previous: number; current: number; delta: number };
  warningSeverityCount: { previous: number; current: number; delta: number };
  dominantIssueCountsDelta: Record<string, number>;
}

export interface ProjectSummaryDeltas {
  components: number;
  componentsWithFindings: number;
  componentFindings: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
}

export interface CompactComponentChange {
  filePath: string;
  className: string | null;
  changeType: ComponentChangeType;
  previousWarningCount: number;
  currentWarningCount: number;
  previousDominantIssue: string | null;
  currentDominantIssue: string | null;
  addedRules: string[];
  removedRules: string[];
}

export interface RuleDeltaRow {
  ruleId: string;
  previousCount: number;
  currentCount: number;
  delta: number;
  trend: "up" | "down" | "flat";
}

export interface ProjectComparison {
  sourceRoot: string;
  summaryDeltas: ProjectSummaryDeltas;
  worsenedCount: number;
  improvedCount: number;
  resolvedCount: number;
  newlyFlaggedCount: number;
  issueChangedCount: number;
  unchangedCount: number;
  topWorsenedComponents: CompactComponentChange[];
  topImprovedComponents: CompactComponentChange[];
  /** All non-unchanged component deltas for this project, keyed like `normalizeFileKey` (matches explorer `data-component-key`). */
  componentChangesByKey: Record<string, CompactComponentChange>;
  topRuleIncreases: RuleDeltaRow[];
  topRuleDecreases: RuleDeltaRow[];
}

export interface SnapshotComparisonPayload {
  baselineKey: string;
  baselineSummary: {
    generatedAt: string | null;
    snapshotHash: string | null;
    runId: string | null;
    totalFindings: number | null;
    riskLevel: string | null;
    overallScore: number | null;
  };
  workspace: WorkspaceComparison;
  projectComparisons: Record<string, ProjectComparison>;
  topRuleIncreasesWorkspace: RuleDeltaRow[];
  topRuleDecreasesWorkspace: RuleDeltaRow[];
}

const TOP_N = 5;

function deltaNum(prev: number, cur: number): number {
  return cur - prev;
}

function classifyComponent(
  prev: CompareComponentSlice | undefined,
  cur: CompareComponentSlice | undefined
): { change: ComponentChangeType; detail: CompactComponentChange | null } {
  if (!prev && !cur) return { change: "unchanged", detail: null };
  const emptySlice = (c: CompareComponentSlice | undefined): boolean =>
    !c || ((c.totalWarningCount ?? 0) === 0 && (c.triggeredRuleIds?.length ?? 0) === 0);

  if (!prev && cur) {
    const hasFindings = (cur.totalWarningCount ?? 0) > 0 || (cur.triggeredRuleIds?.length ?? 0) > 0;
    const change: ComponentChangeType = hasFindings ? "newlyFlagged" : "unchanged";
    return {
      change,
      detail:
        change === "newlyFlagged" ?
          {
            filePath: cur.filePath,
            className: cur.className,
            changeType: "newlyFlagged",
            previousWarningCount: 0,
            currentWarningCount: cur.totalWarningCount,
            previousDominantIssue: null,
            currentDominantIssue: cur.dominantIssue,
            addedRules: [...cur.triggeredRuleIds],
            removedRules: [],
          }
        : null,
    };
  }
  if (prev && !cur) {
    const hadFindings = (prev.totalWarningCount ?? 0) > 0 || (prev.triggeredRuleIds?.length ?? 0) > 0;
    return {
      change: hadFindings ? "resolved" : "unchanged",
      detail:
        hadFindings ?
          {
            filePath: prev.filePath,
            className: prev.className,
            changeType: "resolved",
            previousWarningCount: prev.totalWarningCount,
            currentWarningCount: 0,
            previousDominantIssue: prev.dominantIssue,
            currentDominantIssue: null,
            addedRules: [],
            removedRules: [...prev.triggeredRuleIds],
          }
        : null,
    };
  }
  const p = prev!;
  const c = cur!;
  const prevW = p.totalWarningCount ?? 0;
  const curW = c.totalWarningCount ?? 0;
  const prevRules = new Set(p.triggeredRuleIds);
  const curRules = new Set(c.triggeredRuleIds);
  const addedRules = [...curRules].filter((x) => !prevRules.has(x)).sort();
  const removedRules = [...prevRules].filter((x) => !curRules.has(x)).sort();

  if (prevW === 0 && curW > 0) {
    return {
      change: "newlyFlagged",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "newlyFlagged",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }
  if (prevW > 0 && curW === 0) {
    return {
      change: "resolved",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "resolved",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }

  const ranked = (s: DiagnosticStatus) => s === "ranked";
  const pRanked = ranked(p.diagnosticStatus);
  const cRanked = ranked(c.diagnosticStatus);

  if (!pRanked && cRanked && prevW > 0 && curW > 0) {
    return {
      change: "worsened",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "worsened",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }
  if (pRanked && !cRanked && prevW > 0 && curW > 0) {
    return {
      change: "improved",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "improved",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }
  if (curW > prevW) {
    return {
      change: "worsened",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "worsened",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }
  if (curW < prevW) {
    return {
      change: "improved",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "improved",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: p.dominantIssue,
        currentDominantIssue: c.dominantIssue,
        addedRules,
        removedRules,
      },
    };
  }
  const domP = p.dominantIssue ?? null;
  const domC = c.dominantIssue ?? null;
  if (domP !== domC && (!emptySlice(p) || !emptySlice(c))) {
    return {
      change: "issueChanged",
      detail: {
        filePath: c.filePath,
        className: c.className,
        changeType: "issueChanged",
        previousWarningCount: prevW,
        currentWarningCount: curW,
        previousDominantIssue: domP,
        currentDominantIssue: domC,
        addedRules,
        removedRules,
      },
    };
  }
  return {
    change: "unchanged",
    detail: null,
  };
}

function workspaceDiff(prev: CompareWorkspaceSlice, cur: CompareWorkspaceSlice): WorkspaceComparison {
  const keys = new Set([...Object.keys(prev.dominantIssueCounts), ...Object.keys(cur.dominantIssueCounts)]);
  const dominantIssueCountsDelta: Record<string, number> = {};
  for (const k of keys) {
    const d = (cur.dominantIssueCounts[k] ?? 0) - (prev.dominantIssueCounts[k] ?? 0);
    if (d !== 0) dominantIssueCountsDelta[k] = d;
  }
  return {
    totalFindings: { previous: prev.totalFindings, current: cur.totalFindings, delta: deltaNum(prev.totalFindings, cur.totalFindings) },
    riskLevel: { previous: prev.riskLevel, current: cur.riskLevel },
    overallScore: {
      previous: prev.overallScore,
      current: cur.overallScore,
      delta: deltaNum(prev.overallScore, cur.overallScore),
    },
    componentScore: {
      previous: prev.componentScore,
      current: cur.componentScore,
      delta: deltaNum(prev.componentScore, cur.componentScore),
    },
    lifecycleScore: {
      previous: prev.lifecycleScore,
      current: cur.lifecycleScore,
      delta: deltaNum(prev.lifecycleScore, cur.lifecycleScore),
    },
    templateScore: {
      previous: prev.templateScore,
      current: cur.templateScore,
      delta: deltaNum(prev.templateScore, cur.templateScore),
    },
    responsibilityScore: {
      previous: prev.responsibilityScore,
      current: cur.responsibilityScore,
      delta: deltaNum(prev.responsibilityScore, cur.responsibilityScore),
    },
    criticalCount: {
      previous: prev.criticalCount,
      current: cur.criticalCount,
      delta: deltaNum(prev.criticalCount, cur.criticalCount),
    },
    highCount: {
      previous: prev.highCount,
      current: cur.highCount,
      delta: deltaNum(prev.highCount, cur.highCount),
    },
    warningSeverityCount: {
      previous: prev.warningSeverityCount,
      current: cur.warningSeverityCount,
      delta: deltaNum(prev.warningSeverityCount, cur.warningSeverityCount),
    },
    dominantIssueCountsDelta,
  };
}

function projectMap(projects: CompareProjectSlice[]): Map<string, CompareProjectSlice> {
  const m = new Map<string, CompareProjectSlice>();
  for (const p of projects) m.set(p.sourceRoot, p);
  return m;
}

function projectSummaryDeltas(prev: CompareProjectSlice, cur: CompareProjectSlice): ProjectSummaryDeltas {
  return {
    components: deltaNum(prev.components, cur.components),
    componentsWithFindings: deltaNum(prev.componentsWithFindings, cur.componentsWithFindings),
    componentFindings: deltaNum(prev.componentFindings, cur.componentFindings),
    lifecycleFindings: deltaNum(prev.lifecycleFindings, cur.lifecycleFindings),
    templateFindings: deltaNum(prev.templateFindings, cur.templateFindings),
    responsibilityFindings: deltaNum(prev.responsibilityFindings, cur.responsibilityFindings),
  };
}

function ruleFrequencyWorkspace(components: Map<string, CompareComponentSlice>): Map<string, number> {
  const freq = new Map<string, number>();
  for (const c of components.values()) {
    for (const r of c.triggeredRuleIds) {
      freq.set(r, (freq.get(r) ?? 0) + 1);
    }
  }
  return freq;
}

function mergeRuleFreqForProject(
  components: Map<string, CompareComponentSlice>,
  sourceRoot: string
): Map<string, number> {
  const freq = new Map<string, number>();
  for (const c of components.values()) {
    if (c.sourceRoot !== sourceRoot) continue;
    for (const r of c.triggeredRuleIds) {
      freq.set(r, (freq.get(r) ?? 0) + 1);
    }
  }
  return freq;
}

function topRuleDeltas(prevFreq: Map<string, number>, curFreq: Map<string, number>): {
  increases: RuleDeltaRow[];
  decreases: RuleDeltaRow[];
} {
  const rules = new Set([...prevFreq.keys(), ...curFreq.keys()]);
  const rows: RuleDeltaRow[] = [];
  for (const ruleId of rules) {
    const previousCount = prevFreq.get(ruleId) ?? 0;
    const currentCount = curFreq.get(ruleId) ?? 0;
    const d = currentCount - previousCount;
    const trend: "up" | "down" | "flat" = d > 0 ? "up" : d < 0 ? "down" : "flat";
    rows.push({ ruleId, previousCount, currentCount, delta: d, trend });
  }
  const increases = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, TOP_N);
  const decreases = [...rows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, TOP_N);
  return { increases, decreases };
}

function sortWorsened(a: CompactComponentChange, b: CompactComponentChange): number {
  const da = (a.currentWarningCount ?? 0) - (a.previousWarningCount ?? 0);
  const db = (b.currentWarningCount ?? 0) - (b.previousWarningCount ?? 0);
  if (db !== da) return db - da;
  return a.filePath.localeCompare(b.filePath);
}

function sortImproved(a: CompactComponentChange, b: CompactComponentChange): number {
  const da = (a.previousWarningCount ?? 0) - (a.currentWarningCount ?? 0);
  const db = (b.previousWarningCount ?? 0) - (b.currentWarningCount ?? 0);
  if (db !== da) return db - da;
  return a.filePath.localeCompare(b.filePath);
}

/**
 * Compare current run vs baseline snapshot input. `baseline` is the **previous** run, `current` is this report.
 */
export function compareSnapshotInputs(
  current: CompareInput,
  baseline: CompareInput,
  baselineKey: string,
  baselineSummaryMeta: SnapshotSummary
): SnapshotComparisonPayload {
  const ws = workspaceDiff(baseline.workspace, current.workspace);
  const prevPm = projectMap(baseline.projects);
  const curPm = projectMap(current.projects);
  const sourceRoots = new Set([...prevPm.keys(), ...curPm.keys()]);

  const allKeys = new Set([...baseline.componentsByKey.keys(), ...current.componentsByKey.keys()]);
  const classifications = new Map<
    string,
    { change: ComponentChangeType; detail: CompactComponentChange | null }
  >();
  for (const key of allKeys) {
    const pComp = baseline.componentsByKey.get(key);
    const cComp = current.componentsByKey.get(key);
    classifications.set(key, classifyComponent(pComp, cComp));
  }

  const byProject: Record<string, ProjectComparison> = {};

  for (const sr of sourceRoots) {
    const pp = prevPm.get(sr) ?? {
      sourceRoot: sr,
      components: 0,
      componentsWithFindings: 0,
      componentFindings: 0,
      lifecycleFindings: 0,
      templateFindings: 0,
      responsibilityFindings: 0,
    };
    const cp = curPm.get(sr) ?? {
      sourceRoot: sr,
      components: 0,
      componentsWithFindings: 0,
      componentFindings: 0,
      lifecycleFindings: 0,
      templateFindings: 0,
      responsibilityFindings: 0,
    };

    let worsenedCount = 0;
    let improvedCount = 0;
    let resolvedCount = 0;
    let newlyFlaggedCount = 0;
    let issueChangedCount = 0;
    let unchangedCount = 0;
    const worsened: CompactComponentChange[] = [];
    const improved: CompactComponentChange[] = [];
    const componentChangesByKey: Record<string, CompactComponentChange> = {};

    for (const key of allKeys) {
      const pComp = baseline.componentsByKey.get(key);
      const cComp = current.componentsByKey.get(key);
      const targetRoot = cComp?.sourceRoot ?? pComp?.sourceRoot ?? null;
      if (targetRoot !== sr) continue;

      const { change, detail } = classifications.get(key)!;
      if (detail) {
        componentChangesByKey[key] = detail;
      }
      switch (change) {
        case "worsened":
          worsenedCount++;
          if (detail) worsened.push(detail);
          break;
        case "improved":
          improvedCount++;
          if (detail) improved.push(detail);
          break;
        case "resolved":
          resolvedCount++;
          if (detail) improved.push(detail);
          break;
        case "newlyFlagged":
          newlyFlaggedCount++;
          if (detail) worsened.push(detail);
          break;
        case "issueChanged":
          issueChangedCount++;
          break;
        case "unchanged":
          unchangedCount++;
          break;
        default:
          break;
      }
    }

    worsened.sort(sortWorsened);
    improved.sort(sortImproved);

    const prevRf = mergeRuleFreqForProject(baseline.componentsByKey, sr);
    const curRf = mergeRuleFreqForProject(current.componentsByKey, sr);
    const { increases, decreases } = topRuleDeltas(prevRf, curRf);

    byProject[sr] = {
      sourceRoot: sr,
      summaryDeltas: projectSummaryDeltas(pp, cp),
      worsenedCount,
      improvedCount,
      resolvedCount,
      newlyFlaggedCount,
      issueChangedCount,
      unchangedCount,
      topWorsenedComponents: worsened.slice(0, TOP_N),
      topImprovedComponents: improved.slice(0, TOP_N),
      componentChangesByKey,
      topRuleIncreases: increases,
      topRuleDecreases: decreases,
    };
  }

  const wf = ruleFrequencyWorkspace(baseline.componentsByKey);
  const wc = ruleFrequencyWorkspace(current.componentsByKey);
  const wsRules = topRuleDeltas(wf, wc);

  return {
    baselineKey,
    baselineSummary: {
      generatedAt: baselineSummaryMeta.generatedAt,
      snapshotHash: baselineSummaryMeta.snapshotHash,
      runId: baselineSummaryMeta.runId,
      totalFindings: baselineSummaryMeta.totalFindings,
      riskLevel: baselineSummaryMeta.riskLevel,
      overallScore: baselineSummaryMeta.overallScore,
    },
    workspace: ws,
    projectComparisons: byProject,
    topRuleIncreasesWorkspace: wsRules.increases,
    topRuleDecreasesWorkspace: wsRules.decreases,
  };
}

