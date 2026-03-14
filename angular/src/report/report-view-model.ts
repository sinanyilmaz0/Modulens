import type { ScanResult, ProjectBreakdownItem } from "../core/scan-result";
import type { DominantIssueType } from "../diagnostic/diagnostic-models";

/**
 * ReportViewModel - Re-export ScanResult for use in report layer.
 * Keeps the same structure; can be extended for React dashboard later.
 */
export type ReportViewModel = ScanResult;

/**
 * Extract project/sourceRoot from filePath for filtering.
 * Returns the sourceRoot that contains this filePath, or null.
 */
export function getProjectForPath(
  filePath: string,
  projectBreakdown: ProjectBreakdownItem[]
): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  const otherBucket = projectBreakdown.find((p) => p.sourceRoot === "other");
  const qualifiedBuckets = projectBreakdown.filter(
    (p) => p.sourceRoot !== "other"
  );
  for (const p of qualifiedBuckets) {
    const segments = p.pathSegments ?? [p.sourceRoot.replace(/\\/g, "/")];
    if (segments.some((seg) => normalized.includes(seg))) {
      return p.sourceRoot;
    }
  }
  if (otherBucket && otherBucket.components > 0) {
    return "other";
  }
  return null;
}

/**
 * Check if an item with filePath belongs to the given project filter.
 */
export function matchesProjectFilter(
  filePath: string,
  projectFilter: string | null,
  projectBreakdown: ProjectBreakdownItem[]
): boolean {
  if (!projectFilter || projectFilter === "all") return true;
  const project = getProjectForPath(filePath, projectBreakdown);
  return project === projectFilter;
}

/**
 * Check if an item matches the issue type filter.
 * For ComponentDiagnostic: dominantIssue
 * For ComponentAnalysisResult: issues[].type, highestSeverity
 * For Lifecycle/Template/Responsibility: warnings[].code maps to clusters
 */
export function matchesIssueTypeFilter(
  item: {
    dominantIssue?: DominantIssueType | null;
    highestSeverity?: string;
    issues?: Array<{ type: string }>;
    warnings?: Array<{ code?: string }>;
  },
  issueFilter: string | null
): boolean {
  if (!issueFilter || issueFilter === "all") return true;

  if (item.dominantIssue && item.dominantIssue === issueFilter) return true;
  if (item.highestSeverity && item.highestSeverity.toLowerCase() === issueFilter.toLowerCase())
    return true;
  if (item.issues?.some((i) => i.type === issueFilter)) return true;

  return false;
}

/**
 * Shorten file path for display in planner cards.
 * Strips workspace prefix and prefers segments after src/ or app/.
 * If path has more than 3 segments, shows last 2 segments only.
 */
export function shortenPathForDisplay(
  filePath: string,
  workspacePath?: string
): string {
  let path = filePath.replace(/\\/g, "/");
  if (workspacePath) {
    const ws = workspacePath.replace(/\\/g, "/").replace(/\/$/, "");
    if (path.startsWith(ws + "/")) path = path.slice(ws.length + 1);
  }
  const srcIdx = path.indexOf("src/");
  if (srcIdx >= 0) path = path.slice(srcIdx);
  const appIdx = path.indexOf("app/");
  if (appIdx >= 0) path = path.slice(appIdx);
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 3) {
    path = segments.slice(-2).join("/");
  }
  return path || filePath;
}
