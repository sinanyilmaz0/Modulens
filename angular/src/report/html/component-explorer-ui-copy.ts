/**
 * Pure copy builders for the HTML report Components explorer (filters, summary, chips).
 * Client-side script in html-report-view.ts mirrors this behavior; keep severity rank in sync.
 */

/** DOM `data-severity` values → rank for descending sort (higher = more severe). */
const SEVERITY_SORT_RANK: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  WARNING: 2,
  LOW: 1,
};

export function explorerSeveritySortRank(severityAttr: string): number {
  const s = (severityAttr || "").trim();
  return SEVERITY_SORT_RANK[s] ?? 0;
}

export type ExplorerChipType =
  | "search"
  | "issue"
  | "severity"
  | "structure"
  | "rule"
  | "project"
  | "healthyHidden"
  | "sort";

export interface ExplorerChipDescriptor {
  type: ExplorerChipType;
  /** Visible chip text */
  label: string;
  /** Full text for title tooltip */
  fullLabel: string;
}

export interface BuildExplorerChipsInput {
  searchNormalized: string;
  issueType: string;
  severity: string;
  structureFilter: string;
  structureDisplayLabel?: string;
  ruleFilter: string;
  ruleTitle?: string;
  projectFilter: string;
  showHealthy: boolean;
  healthyCount: number;
  sortValue: string;
  sortLabel: string;
  issueLabels: Record<string, string | undefined>;
  severityLabels: Record<string, string | undefined>;
  chipSearchPrefix: string;
  chipIssuePrefix: string;
  chipSeverityPrefix: string;
  chipAreaPrefix: string;
  chipRulePrefix: string;
  chipProjectPrefix: string;
  chipSortPrefix: string;
  healthyHiddenChipLabel: string;
}

export function buildExplorerChipDescriptors(input: BuildExplorerChipsInput): ExplorerChipDescriptor[] {
  const chips: ExplorerChipDescriptor[] = [];
  const s = input.searchNormalized.trim();
  if (s) {
    const display = s.length > 40 ? `${s.slice(0, 40)}…` : s;
    const label = `${input.chipSearchPrefix}${display}`;
    chips.push({ type: "search", label, fullLabel: `${input.chipSearchPrefix}${s}` });
  }
  if (input.issueType && input.issueType !== "all") {
    const issueText = input.issueLabels[input.issueType] ?? input.issueType;
    chips.push({
      type: "issue",
      label: `${input.chipIssuePrefix}${issueText}`,
      fullLabel: `${input.chipIssuePrefix}${issueText}`,
    });
  }
  if (input.severity && input.severity !== "all") {
    const sevKey = input.severity.toLowerCase();
    const sevText = input.severityLabels[sevKey] ?? input.severity;
    chips.push({
      type: "severity",
      label: `${input.chipSeverityPrefix}${sevText}`,
      fullLabel: `${input.chipSeverityPrefix}${sevText}`,
    });
  }
  if (input.structureFilter) {
    const area = input.structureDisplayLabel ?? input.structureFilter;
    chips.push({
      type: "structure",
      label: `${input.chipAreaPrefix}${area}`,
      fullLabel: `${input.chipAreaPrefix}${area}`,
    });
  }
  if (input.ruleFilter) {
    const rt = input.ruleTitle ?? input.ruleFilter;
    chips.push({
      type: "rule",
      label: `${input.chipRulePrefix}${rt}`,
      fullLabel: `${input.chipRulePrefix}${rt}`,
    });
  }
  if (input.projectFilter) {
    chips.push({
      type: "project",
      label: `${input.chipProjectPrefix}${input.projectFilter}`,
      fullLabel: `${input.chipProjectPrefix}${input.projectFilter}`,
    });
  }
  if (!input.showHealthy && input.healthyCount > 0) {
    chips.push({
      type: "healthyHidden",
      label: input.healthyHiddenChipLabel,
      fullLabel: input.healthyHiddenChipLabel,
    });
  }
  if (input.sortValue !== "highest-risk") {
    chips.push({
      type: "sort",
      label: `${input.chipSortPrefix}${input.sortLabel}`,
      fullLabel: `${input.chipSortPrefix}${input.sortLabel}`,
    });
  }
  return chips;
}

export interface ExplorerSummaryTemplates {
  /** When zero results after filters */
  primaryEmpty: string;
  /** {start} {end} {matching} {listTotal} */
  primaryRange: string;
  /** Appended when workspace component count differs from list length, e.g. " · {workspaceTotal} in workspace" */
  primaryWorkspaceSegment: string;
  /** {sortLabel} */
  secondarySorted: string;
  /** {count} — rows hidden by “healthy” toggle */
  secondaryHealthyHidden: string;
  /** Shown when search text is non-empty */
  secondarySearch: string;
  /** When issue filter is NO_DOMINANT_ISSUE */
  secondaryNoDominantView: string;
  /** {critical} {high} — only when showHealthy and counts > 0 */
  secondarySeverityInView: string;
}

export interface BuildExplorerSummaryInput {
  totalMatching: number;
  showingStart: number;
  showingEnd: number;
  listTotal: number;
  workspaceTotal: number | null | undefined;
  sortLabel: string;
  showHealthy: boolean;
  issueType: string;
  healthyHiddenCount: number;
  criticalInMatching: number;
  highInMatching: number;
  searchActive: boolean;
  templates: ExplorerSummaryTemplates;
}

export function buildComponentsExplorerSummaryParts(
  input: BuildExplorerSummaryInput
): { primary: string; secondary: string } {
  const t = input.templates;
  let primary: string;
  if (input.totalMatching === 0) {
    primary = t.primaryEmpty;
  } else {
    primary = t.primaryRange
      .replace("{start}", String(input.showingStart))
      .replace("{end}", String(input.showingEnd))
      .replace("{matching}", String(input.totalMatching))
      .replace("{listTotal}", String(input.listTotal));
  }

  if (
    input.totalMatching > 0 &&
    input.workspaceTotal != null &&
    input.workspaceTotal !== input.listTotal
  ) {
    primary += t.primaryWorkspaceSegment.replace("{workspaceTotal}", String(input.workspaceTotal));
  }

  const secondaryParts: string[] = [t.secondarySorted.replace("{sortLabel}", input.sortLabel)];

  if (input.issueType === "NO_DOMINANT_ISSUE") {
    secondaryParts.push(t.secondaryNoDominantView);
  }

  if (!input.showHealthy && input.healthyHiddenCount > 0) {
    secondaryParts.push(t.secondaryHealthyHidden.replace("{count}", String(input.healthyHiddenCount)));
  }

  if (input.searchActive) {
    secondaryParts.push(t.secondarySearch);
  }

  if (
    input.showHealthy &&
    input.issueType !== "NO_DOMINANT_ISSUE" &&
    (input.criticalInMatching > 0 || input.highInMatching > 0)
  ) {
    secondaryParts.push(
      t.secondarySeverityInView
        .replace("{critical}", String(input.criticalInMatching))
        .replace("{high}", String(input.highInMatching))
    );
  }

  return { primary, secondary: secondaryParts.join(" ") };
}
