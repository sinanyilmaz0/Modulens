import * as fs from "fs";
import * as path from "path";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";

/** Relative to workspace root; uses platform path separators when joined. */
export const SNAPSHOT_DIR_SEGMENTS = [".modulens", "snapshots"] as const;

export const REPORTS_DIR_SEGMENTS = [".modulens", "reports"] as const;

export function getSnapshotDirectory(workspaceRootAbsolute: string): string {
  return path.join(workspaceRootAbsolute, ...SNAPSHOT_DIR_SEGMENTS);
}

/** Default directory for HTML/JSON reports (when --output is omitted). */
export function getReportsDirectory(workspaceRootAbsolute: string): string {
  return path.join(workspaceRootAbsolute, ...REPORTS_DIR_SEGMENTS);
}

/**
 * Maps ISO-8601 `generatedAt` to a filesystem-safe token: `YYYY-MM-DDTHH-mm-ss` (no `:`).
 * Falls back to current time if parsing fails.
 */
export function sanitizeGeneratedAtForSnapshotFilename(iso: string): string {
  const d = new Date(iso);
  const effective = Number.isNaN(d.getTime()) ? new Date() : d;
  const s = effective.toISOString();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    return `${m[1]}T${m[2]}-${m[3]}-${m[4]}`;
  }
  return s.replace(/:/g, "-").replace(/\.\d{3}Z?$/, "").replace(/Z$/, "");
}

export function buildSnapshotFileName(
  snapshot: Pick<AnalysisSnapshot, "generatedAt" | "snapshotHash">
): string {
  const stamp = sanitizeGeneratedAtForSnapshotFilename(snapshot.generatedAt);
  const shortId = snapshot.snapshotHash.slice(0, 8);
  return `snapshot-${stamp}-${shortId}.json`;
}

export type WriteWorkspaceSnapshotResult =
  | { ok: true; absolutePath: string }
  | { ok: false; message: string };

export function writeWorkspaceJsonSnapshot(options: {
  workspaceRootAbsolute: string;
  jsonPayload: string;
  snapshot: Pick<AnalysisSnapshot, "generatedAt" | "snapshotHash">;
}): WriteWorkspaceSnapshotResult {
  const dir = getSnapshotDirectory(options.workspaceRootAbsolute);
  const fileName = buildSnapshotFileName(options.snapshot);
  const absolutePath = path.join(dir, fileName);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, options.jsonPayload, "utf-8");
    return { ok: true, absolutePath };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
