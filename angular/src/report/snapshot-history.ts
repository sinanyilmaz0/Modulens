import * as fs from "fs";
import * as path from "path";
import { getSnapshotDirectory } from "../cli/snapshot-file";

/**
 * Minimal snapshot metadata for the HTML compare picker (not full JSON).
 */
export interface SnapshotSummary {
  fileName: string;
  absolutePath: string;
  generatedAt: string | null;
  workspacePath: string | null;
  totalFindings: number | null;
  overallScore: number | null;
  riskLevel: string | null;
  snapshotHash: string | null;
  runId: string | null;
}

export function normalizeWorkspacePathKey(p: string): string {
  return path.normalize(p).replace(/\\/g, "/").toLowerCase();
}

export function extractSnapshotSummary(
  parsed: unknown,
  fileName: string,
  absolutePath: string
): SnapshotSummary | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const meta = o.metadata as Record<string, unknown> | undefined;
  const workspace = o.workspace as Record<string, unknown> | undefined;
  const ws = workspace?.summary as Record<string, unknown> | undefined;
  const health = o.health as Record<string, unknown> | undefined;
  const scores = health?.scores as Record<string, unknown> | undefined;

  return {
    fileName,
    absolutePath,
    generatedAt: typeof meta?.generatedAt === "string" ? meta.generatedAt : null,
    workspacePath: typeof meta?.workspacePath === "string" ? meta.workspacePath : null,
    snapshotHash: typeof meta?.snapshotHash === "string" ? meta.snapshotHash : null,
    runId: typeof meta?.runId === "string" ? meta.runId : null,
    totalFindings: typeof ws?.totalFindings === "number" ? ws.totalFindings : null,
    riskLevel:
      typeof ws?.riskLevel === "string"
        ? ws.riskLevel
        : typeof health?.riskLevel === "string"
          ? health.riskLevel
          : null,
    overallScore: typeof scores?.overall === "number" ? scores.overall : null,
  };
}

export type ListWorkspaceSnapshotOptions = {
  /** Omit snapshots whose hash matches the current run (picker baseline only). */
  excludeSnapshotHash?: string;
};

/**
 * Lists Modulens JSON snapshots under `.modulens/snapshots`, newest first.
 * Skips unreadable or non-JSON files. Does not filter by workspace; use `filterSummariesForWorkspace`.
 */
export function listWorkspaceSnapshotSummaries(
  workspaceRootAbsolute: string,
  options?: ListWorkspaceSnapshotOptions
): SnapshotSummary[] {
  const dir = getSnapshotDirectory(workspaceRootAbsolute);
  if (!fs.existsSync(dir)) return [];
  let stat: fs.Stats;
  try {
    stat = fs.statSync(dir);
  } catch {
    return [];
  }
  if (!stat.isDirectory()) return [];

  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }

  const rows: Array<{ summary: SnapshotSummary; sortKey: number }> = [];

  for (const fileName of names) {
    if (!fileName.endsWith(".json")) continue;
    const absolutePath = path.join(dir, fileName);
    let st: fs.Stats;
    try {
      st = fs.statSync(absolutePath);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;

    let raw: string;
    try {
      raw = fs.readFileSync(absolutePath, "utf-8");
    } catch {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const summary = extractSnapshotSummary(parsed, fileName, absolutePath);
    if (!summary) continue;
    if (options?.excludeSnapshotHash && summary.snapshotHash === options.excludeSnapshotHash) {
      continue;
    }

    const t = summary.generatedAt ? Date.parse(summary.generatedAt) : NaN;
    const sortKey = Number.isNaN(t) ? st.mtimeMs : t;
    rows.push({ summary, sortKey });
  }

  rows.sort((a, b) => b.sortKey - a.sortKey);
  return rows.map((r) => r.summary);
}

/** Keep summaries that belong to the same workspace as the current report (path-normalized). */
export function filterSummariesForWorkspace(
  summaries: readonly SnapshotSummary[],
  workspacePathAbsolute: string
): SnapshotSummary[] {
  const key = normalizeWorkspacePathKey(workspacePathAbsolute);
  return summaries.filter((s) => {
    if (!s.workspacePath) return false;
    return normalizeWorkspacePathKey(s.workspacePath) === key;
  });
}
