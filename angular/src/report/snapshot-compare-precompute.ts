import * as fs from "fs";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import { compareSnapshotInputs, type SnapshotComparisonPayload } from "./snapshot-compare";
import {
  baselineKeyFromSummary,
  compareInputFromAnalysisSnapshot,
  compareInputFromPublicJson,
} from "./snapshot-compare-input";
import type { SnapshotSummary } from "./snapshot-history";

/**
 * For each history entry, load the JSON snapshot from disk and compute a compact
 * current-vs-baseline comparison. Failures are logged; the map omits that baseline.
 */
export function precomputeSnapshotComparisons(
  current: AnalysisSnapshot,
  history: readonly SnapshotSummary[]
): Record<string, SnapshotComparisonPayload> {
  const currentInput = compareInputFromAnalysisSnapshot(current);
  const out: Record<string, SnapshotComparisonPayload> = {};

  for (const summary of history) {
    const key = baselineKeyFromSummary(summary);
    if (!key) {
      console.warn(`[Modulens] Skipping snapshot compare: no snapshotHash/runId for ${summary.fileName}`);
      continue;
    }
    let raw: string;
    try {
      raw = fs.readFileSync(summary.absolutePath, "utf-8");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[Modulens] Could not read snapshot for compare (${summary.fileName}): ${msg}`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`[Modulens] Invalid JSON snapshot for compare: ${summary.absolutePath}`);
      continue;
    }
    const baselineInput = compareInputFromPublicJson(parsed);
    if (!baselineInput) {
      console.warn(`[Modulens] Could not parse snapshot structure for compare: ${summary.absolutePath}`);
      continue;
    }
    try {
      out[key] = compareSnapshotInputs(currentInput, baselineInput, key, summary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[Modulens] Compare failed for baseline ${key}: ${msg}`);
    }
  }
  return out;
}
