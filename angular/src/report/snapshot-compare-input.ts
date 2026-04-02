import * as path from "path";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import type { ProjectBreakdownItem, ScanResult } from "../core/scan-result";
import type { DiagnosticStatus } from "../diagnostic/diagnostic-models";
import { normalizePath } from "./html/html-report-presenter";
import { getProjectForPath } from "./report-view-model";
import type { SnapshotSummary } from "./snapshot-history";

/** Stable key for component matching: normalized path (slashes, lowercased). */
export function normalizeFileKey(filePath: string): string {
  try {
    return normalizePath(path.normalize(filePath)).toLowerCase();
  } catch {
    return normalizePath(filePath).toLowerCase();
  }
}

export interface CompareComponentSlice {
  filePath: string;
  className: string | null;
  diagnosticStatus: DiagnosticStatus;
  dominantIssue: string | null;
  totalWarningCount: number;
  triggeredRuleIds: readonly string[];
  sourceRoot: string | null;
}

export interface CompareWorkspaceSlice {
  totalFindings: number;
  riskLevel: string;
  overallScore: number;
  componentScore: number;
  lifecycleScore: number;
  templateScore: number;
  responsibilityScore: number;
  criticalCount: number;
  highCount: number;
  warningSeverityCount: number;
  dominantIssueCounts: Record<string, number>;
}

export interface CompareProjectSlice {
  sourceRoot: string;
  components: number;
  componentsWithFindings: number;
  componentFindings: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
}

export interface CompareInput {
  workspace: CompareWorkspaceSlice;
  projects: CompareProjectSlice[];
  componentsByKey: Map<string, CompareComponentSlice>;
}

function safeDominantIssueCounts(d: ScanResult["diagnosticSummary"]): Record<string, number> {
  const raw = d.dominantIssueCounts;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number") out[k] = v;
  }
  return out;
}

function buildComponentsFromScan(result: ScanResult): Map<string, CompareComponentSlice> {
  const diagnostics =
    result.diagnosticSummary.componentDiagnostics?.length ?
      result.diagnosticSummary.componentDiagnostics
    : result.diagnosticSummary.topCrossCuttingRisks;
  const map = new Map<string, CompareComponentSlice>();
  const breakdown = result.projectBreakdown;
  for (const d of diagnostics) {
    const fp = d.filePath ?? "";
    const key = normalizeFileKey(fp);
    const sr = getProjectForPath(fp, breakdown);
    const rules = [...(d.triggeredRuleIds ?? [])].sort();
    map.set(key, {
      filePath: fp,
      className: d.className ?? null,
      diagnosticStatus: d.diagnosticStatus,
      dominantIssue: d.dominantIssue ?? null,
      totalWarningCount: d.totalWarningCount ?? 0,
      triggeredRuleIds: rules,
      sourceRoot: sr,
    });
  }
  return map;
}

export function compareInputFromAnalysisSnapshot(snapshot: AnalysisSnapshot): CompareInput {
  const result = snapshot.result;
  const ws = result.workspaceSummary;
  const scores = result.scores;
  const sev = result.componentsBySeverity;
  return {
    workspace: {
      totalFindings: ws.totalFindings ?? 0,
      riskLevel: ws.riskLevel ?? "",
      overallScore: scores.overall ?? 0,
      componentScore: scores.component?.score ?? 0,
      lifecycleScore: scores.lifecycle?.score ?? 0,
      templateScore: scores.template?.score ?? 0,
      responsibilityScore: scores.responsibility?.score ?? 0,
      criticalCount: sev?.critical ?? 0,
      highCount: sev?.high ?? 0,
      warningSeverityCount: sev?.warning ?? 0,
      dominantIssueCounts: safeDominantIssueCounts(result.diagnosticSummary),
    },
    projects: result.projectBreakdown.map((p) => ({
      sourceRoot: p.sourceRoot,
      components: p.components ?? 0,
      componentsWithFindings: p.componentsWithFindings ?? 0,
      componentFindings: p.componentFindings ?? p.componentsWithFindings ?? 0,
      lifecycleFindings: p.lifecycleFindings ?? 0,
      templateFindings: p.templateFindings ?? 0,
      responsibilityFindings: p.responsibilityFindings ?? 0,
    })),
    componentsByKey: buildComponentsFromScan(result),
  };
}

function num(o: unknown): number {
  return typeof o === "number" && !Number.isNaN(o) ? o : 0;
}

function str(o: unknown): string {
  return typeof o === "string" ? o : "";
}

/** Parse on-disk public JSON (JsonFormatter / workspace snapshot) into CompareInput. */
export function compareInputFromPublicJson(parsed: unknown): CompareInput | null {
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  const meta = root.metadata as Record<string, unknown> | undefined;
  const workspace = root.workspace as Record<string, unknown> | undefined;
  const ws = workspace?.summary as Record<string, unknown> | undefined;
  const health = root.health as Record<string, unknown> | undefined;
  const scores = health?.scores as Record<string, unknown> | undefined;
  const compSev = health?.componentsBySeverity as Record<string, unknown> | undefined;
  const diagSummary = (root.diagnostics as Record<string, unknown> | undefined)?.summary as
    | Record<string, unknown>
    | undefined;
  const details = (root.diagnostics as Record<string, unknown> | undefined)?.details as unknown[] | undefined;
  const projectBreakdown = workspace?.projectBreakdown as unknown[] | undefined;

  if (!ws && !health) return null;

  const dominantRaw = diagSummary?.dominantIssueCounts as Record<string, unknown> | undefined;
  const dominantIssueCounts: Record<string, number> = {};
  if (dominantRaw && typeof dominantRaw === "object") {
    for (const [k, v] of Object.entries(dominantRaw)) {
      if (typeof v === "number") dominantIssueCounts[k] = v;
    }
  }

  const projects: CompareProjectSlice[] = [];
  if (Array.isArray(projectBreakdown)) {
    for (const p of projectBreakdown) {
      if (!p || typeof p !== "object") continue;
      const o = p as Record<string, unknown>;
      const sr = str(o.sourceRoot);
      if (!sr) continue;
      projects.push({
        sourceRoot: sr,
        components: num(o.components),
        componentsWithFindings: num(o.componentsWithFindings),
        componentFindings: num(o.componentFindings) || num(o.componentsWithFindings),
        lifecycleFindings: num(o.lifecycleFindings),
        templateFindings: num(o.templateFindings),
        responsibilityFindings: num(o.responsibilityFindings),
      });
    }
  }

  const componentsByKey = new Map<string, CompareComponentSlice>();
  const breakdownForPath = projects as ProjectBreakdownItem[];
  if (Array.isArray(details)) {
    for (const row of details) {
      if (!row || typeof row !== "object") continue;
      const d = row as Record<string, unknown>;
      const fp = str(d.filePath);
      if (!fp) continue;
      const key = normalizeFileKey(fp);
      const st = d.diagnosticStatus;
      const status: DiagnosticStatus =
        st === "ranked" || st === "unranked" || st === "quiet" ? st : "quiet";
      const rulesRaw = d.triggeredRuleIds;
      const rules = Array.isArray(rulesRaw) ?
        [...rulesRaw].filter((x): x is string => typeof x === "string").sort()
      : [];
      const sr = getProjectForPath(fp, breakdownForPath);
      componentsByKey.set(key, {
        filePath: fp,
        className: typeof d.className === "string" ? d.className : null,
        diagnosticStatus: status,
        dominantIssue: typeof d.dominantIssue === "string" ? d.dominantIssue : null,
        totalWarningCount: num(d.totalWarningCount),
        triggeredRuleIds: rules,
        sourceRoot: sr,
      });
    }
  }

  const risk =
    typeof ws?.riskLevel === "string" ? ws.riskLevel
    : typeof health?.riskLevel === "string" ? health.riskLevel
    : "";

  return {
    workspace: {
      totalFindings: num(ws?.totalFindings),
      riskLevel: risk,
      overallScore: num((scores as Record<string, unknown> | undefined)?.overall),
      componentScore: num((scores?.component as Record<string, unknown> | undefined)?.score),
      lifecycleScore: num((scores?.lifecycle as Record<string, unknown> | undefined)?.score),
      templateScore: num((scores?.template as Record<string, unknown> | undefined)?.score),
      responsibilityScore: num((scores?.responsibility as Record<string, unknown> | undefined)?.score),
      criticalCount: num(compSev?.critical),
      highCount: num(compSev?.high),
      warningSeverityCount: num(compSev?.warning),
      dominantIssueCounts,
    },
    projects,
    componentsByKey,
  };
}

export function baselineKeyFromSummary(s: SnapshotSummary): string | null {
  if (s.snapshotHash && s.snapshotHash.length > 0) return s.snapshotHash;
  if (s.runId && s.runId.length > 0) return s.runId;
  return null;
}
