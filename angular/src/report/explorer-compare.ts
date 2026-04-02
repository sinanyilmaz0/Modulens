import type { CompactComponentChange, ComponentChangeType, ProjectComparison } from "./snapshot-compare";

/** Client filter value for Components Explorer compare dropdown. */
export type ExplorerCompareFilter =
  | "all"
  | "changed-only"
  | "worse"
  | "better"
  | "resolved"
  | "new"
  | "issue-changed";

export type ExplorerCompareSort = "diff-impact" | "worse-first" | "better-first";

const IMPACT_RANK: Record<ComponentChangeType, number> = {
  worsened: 100,
  newlyFlagged: 90,
  issueChanged: 70,
  improved: 50,
  resolved: 30,
  unchanged: 0,
};

/** Map changeType to stable badge kind for CSS / labels. */
export function changeTypeToBadgeKind(change: ComponentChangeType): "new" | "resolved" | "worse" | "better" | "changed" | null {
  switch (change) {
    case "newlyFlagged":
      return "new";
    case "resolved":
      return "resolved";
    case "worsened":
      return "worse";
    case "improved":
      return "better";
    case "issueChanged":
      return "changed";
    default:
      return null;
  }
}

export function compareImpactScore(change: CompactComponentChange): number {
  const base = IMPACT_RANK[change.changeType] ?? 0;
  const dw = Math.abs((change.currentWarningCount ?? 0) - (change.previousWarningCount ?? 0));
  return base * 1000 + dw;
}

export function lookupComponentChange(
  pc: ProjectComparison | null | undefined,
  componentKey: string
): CompactComponentChange | undefined {
  if (!pc?.componentChangesByKey) return undefined;
  return pc.componentChangesByKey[componentKey];
}

export function matchesExplorerCompareFilter(
  filter: ExplorerCompareFilter,
  change: CompactComponentChange | undefined
): boolean {
  if (filter === "all") return true;
  if (!change) return false;
  const t = change.changeType;
  switch (filter) {
    case "changed-only":
      return t !== "unchanged";
    case "worse":
      return t === "worsened";
    case "better":
      return t === "improved";
    case "resolved":
      return t === "resolved";
    case "new":
      return t === "newlyFlagged";
    case "issue-changed":
      return t === "issueChanged";
    default:
      return true;
  }
}

/** @deprecated Legacy client shape; HTML report uses `__overviewCompareHistoryIndex__` / `__componentsCompareHistoryIndex__`. */
export type ActiveCompareContext = {
  sourceRoot: string;
  historyIndex: number;
};

/**
 * Components Explorer row state derived from DOM (`data-source-root`, `data-compare-impact`, `data-compare-kind`).
 * With a Components baseline, compare filters apply per row using that row’s project slice (`projectComparisons[sourceRoot]`).
 * Pass `activeSourceRoot: null` for workspace-wide compare (any row with payload); or a single project to mirror legacy single-project scope.
 *
 * Keep in sync with `matchCompareFilter` in `report-client-script.ts`.
 */
export function rowMatchesExplorerCompareScope(input: {
  compareFilter: ExplorerCompareFilter;
  /** `filter-compare-diff` is enabled (Components baseline selected). */
  compareDropdownEnabled: boolean;
  /** When set, only this source root; `null` = workspace-wide (each row uses its own `itemSourceRoot`). */
  activeSourceRoot: string | null;
  itemSourceRoot: string;
  hasBaselinePayload: boolean;
  hasDiff: boolean;
  compareKind: string;
}): boolean {
  if (!input.compareDropdownEnabled) return true;
  if (input.activeSourceRoot && input.itemSourceRoot !== input.activeSourceRoot) return false;
  if (input.compareFilter === "all") return true;
  if (!input.hasBaselinePayload) return false;
  if (input.compareFilter === "changed-only") return input.hasDiff;
  if (!input.hasDiff) return false;
  const k = input.compareKind;
  if (input.compareFilter === "worse") return k === "worse";
  if (input.compareFilter === "better") return k === "better";
  if (input.compareFilter === "resolved") return k === "resolved";
  if (input.compareFilter === "new") return k === "new";
  if (input.compareFilter === "issue-changed") return k === "changed";
  return false;
}

/** Sort order: higher impact first (for diff-impact and worse-first). */
export function compareSortKeyWorseFirst(change: CompactComponentChange | undefined): number {
  if (!change) return -1;
  if (change.changeType === "worsened" || change.changeType === "newlyFlagged") {
    return (change.currentWarningCount ?? 0) - (change.previousWarningCount ?? 0);
  }
  if (change.changeType === "improved" || change.changeType === "resolved") {
    return (change.previousWarningCount ?? 0) - (change.currentWarningCount ?? 0);
  }
  return compareImpactScore(change);
}

/** Better / resolved improvements first (larger reduction in warnings). */
export function compareSortKeyBetterFirst(change: CompactComponentChange | undefined): number {
  if (!change) return -1;
  if (change.changeType === "improved" || change.changeType === "resolved") {
    return (change.previousWarningCount ?? 0) - (change.currentWarningCount ?? 0);
  }
  if (change.changeType === "worsened" || change.changeType === "newlyFlagged") {
    return (change.currentWarningCount ?? 0) - (change.previousWarningCount ?? 0);
  }
  return compareImpactScore(change);
}

export type CompareSummaryCounts = {
  worsened: number;
  improved: number;
  resolved: number;
  newlyFlagged: number;
  issueChanged: number;
};

export function countCompareCategoriesInRows(
  rows: Array<{ change: CompactComponentChange | undefined }>
): CompareSummaryCounts {
  const out: CompareSummaryCounts = {
    worsened: 0,
    improved: 0,
    resolved: 0,
    newlyFlagged: 0,
    issueChanged: 0,
  };
  for (const r of rows) {
    const c = r.change;
    if (!c) continue;
    switch (c.changeType) {
      case "worsened":
        out.worsened++;
        break;
      case "improved":
        out.improved++;
        break;
      case "resolved":
        out.resolved++;
        break;
      case "newlyFlagged":
        out.newlyFlagged++;
        break;
      case "issueChanged":
        out.issueChanged++;
        break;
      default:
        break;
    }
  }
  return out;
}
