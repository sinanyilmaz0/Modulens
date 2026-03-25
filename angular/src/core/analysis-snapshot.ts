/**
 * Immutable analysis snapshot - single source of truth for UI, HTML export, JSON export.
 * All consumers read from this snapshot to ensure artifact parity.
 */

import { createHash, randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import { ModulensError } from "./modulens-error";
import type { ScanResult } from "./scan-result";
import type { SectionData } from "../report/html/html-report-presenter";
import type { ComponentDetailEntry, ComponentsExplorerItem } from "../report/html/html-report-presenter";
import {
  buildComponentDetailsMap,
  buildComponentsExplorerItems,
  prepareSections,
  normalizePath,
  getComponentDetailEntry,
} from "../report/html/html-report-presenter";
import { getProjectForPath } from "../report/report-view-model";
import { buildPatternData } from "../report/html/pattern-data-builder";
import { getConfidenceLabel } from "../report/labels/uncertainty-copy";

export const CURRENT_SNAPSHOT_VERSION = 1;

export interface ReportMeta {
  runId: string;
  workspacePath: string;
  generatedAt: string;
  analyzerVersion: string;
  snapshotHash: string;
}

import type { PatternData } from "../report/html/pattern-data-builder";

export type { PatternData };

export interface AnalysisSnapshot {
  readonly snapshotVersion: number;
  readonly runId: string;
  readonly workspacePath: string;
  readonly generatedAt: string;
  readonly analyzerVersion: string;
  readonly snapshotHash: string;
  readonly meta: ReportMeta;
  /** Raw ScanResult for text formatters and backward compatibility */
  readonly result: ScanResult;
  /** Precomputed section data for all report pages */
  readonly sections: readonly SectionData[];
  /** Precomputed component details map for drawer/modal */
  readonly componentDetailsMap: Readonly<Record<string, ComponentDetailEntry>>;
  /** Precomputed pattern data for Patterns page */
  readonly patternData: PatternData;
  /** Precomputed explorer items for Components page */
  readonly componentsExplorerItems: readonly ComponentsExplorerItem[];
}

function getAnalyzerVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "../../package.json");
    const content = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content) as { version?: string };
    return pkg?.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function computeSnapshotHash(data: Omit<AnalysisSnapshot, "snapshotHash" | "meta">): string {
  const canonical = JSON.stringify({
    snapshotVersion: data.snapshotVersion,
    workspacePath: data.workspacePath,
    generatedAt: data.generatedAt,
    workspaceSummary: data.result.workspaceSummary,
    diagnosticSummary: data.result.diagnosticSummary,
    projectBreakdown: data.result.projectBreakdown,
    ruleViolationCounts: data.result.ruleViolationCounts,
    componentsBySeverity: data.result.componentsBySeverity,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/**
 * Creates an immutable analysis snapshot from a completed ScanResult.
 * All UI pages, HTML export, and JSON export should consume this snapshot.
 */
export function createAnalysisSnapshot(result: ScanResult, analyzerVersion?: string): AnalysisSnapshot {
  const runId = randomUUID();
  const version = getAnalyzerVersion();
  const analyzerVer = analyzerVersion ?? version;

  const componentDetailsMap = buildComponentDetailsMap(result);
  const sections = prepareSections(result);
  const explorerSection = sections.find((s) => s.id === "components-explorer");
  const explorerItems = (explorerSection?.items ?? []) as ComponentsExplorerItem[];

  const mapWithExplorer: Record<string, ComponentDetailEntry> = { ...componentDetailsMap };
  for (const item of explorerItems) {
    const key = normalizePath(item.filePath);
    const existing = getComponentDetailEntry(mapWithExplorer, item.filePath);
    if (!existing) {
      mapWithExplorer[key] = {
        filePath: item.filePath,
        fileName: item.fileName,
        className: item.className,
        lineCount: item.lineCount,
        dependencyCount: item.dependencyCount,
        dominantIssue: item.dominantIssue,
        highestSeverity: item.highestSeverity,
        componentRole: item.componentRole,
        sourceRoot:
          item.sourceRoot ??
          item.project ??
          getProjectForPath(item.filePath, result.projectBreakdown) ??
          undefined,
        inferredFeatureArea: item.inferredFeatureArea ?? undefined,
        triggeredRuleIds: item.triggeredRuleIds,
        anomalyFlag: item.anomalyFlag,
        anomalyReasons: item.anomalyReasons,
        confidence: item.confidence,
        computedSeverity: item.computedSeverity,
        severityNotesForDisplay: item.severityNotesForDisplay,
      };
    } else {
      existing.anomalyFlag = item.anomalyFlag;
      existing.anomalyReasons = item.anomalyReasons;
      existing.confidence = item.confidence;
      existing.computedSeverity = item.computedSeverity ?? existing.computedSeverity;
      existing.severityNotesForDisplay = item.severityNotesForDisplay ?? existing.severityNotesForDisplay;
      if (!existing.sourceRoot) {
        existing.sourceRoot =
          item.sourceRoot ?? item.project ?? getProjectForPath(item.filePath, result.projectBreakdown) ?? undefined;
      }
      if (item.triggeredRuleIds?.length && !existing.triggeredRuleIds?.length) {
        existing.triggeredRuleIds = item.triggeredRuleIds;
      }
    }
  }

  for (const key of Object.keys(mapWithExplorer)) {
    const e = mapWithExplorer[key];
    if (!e) continue;
    const trust = getConfidenceLabel(e.confidence ?? null);
    e.severityTrustSummary = trust ?? undefined;
  }

  const patternData = buildPatternData(result, mapWithExplorer);
  const componentsExplorerItems = explorerItems.length > 0 ? explorerItems : buildComponentsExplorerItems(result);

  const withoutHash: Omit<AnalysisSnapshot, "snapshotHash" | "meta"> = {
    snapshotVersion: CURRENT_SNAPSHOT_VERSION,
    runId,
    workspacePath: result.workspacePath,
    generatedAt: result.generatedAt,
    analyzerVersion: analyzerVer,
    result,
    sections,
    componentDetailsMap: mapWithExplorer,
    patternData,
    componentsExplorerItems,
  };

  const snapshotHash = computeSnapshotHash(withoutHash);
  const meta: ReportMeta = {
    runId,
    workspacePath: result.workspacePath,
    generatedAt: result.generatedAt,
    analyzerVersion: analyzerVer,
    snapshotHash,
  };

  const snapshot: AnalysisSnapshot = Object.freeze({
    ...withoutHash,
    snapshotHash,
    meta,
  });

  if (process.env.ANGULAR_DOCTOR_DEBUG === "1") {
    console.debug("[Modulens] Snapshot:", runId, snapshotHash, analyzerVer);
  }

  return snapshot;
}

/**
 * Parses a snapshot from JSON. Validates version and migrates if needed.
 * Throws ModulensError on invalid JSON; throws Error if version is incompatible.
 */
export function parseSnapshot(json: string): AnalysisSnapshot {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch (err) {
    throw new ModulensError(
      "Could not parse snapshot. Check file is valid JSON.",
      "JSON_PARSE_ERROR",
      err
    );
  }
  let version: number;
  if (typeof parsed.snapshotVersion === "number") {
    version = parsed.snapshotVersion;
  } else if (parsed.result && parsed._meta) {
    version = 1;
  } else if (parsed.workspacePath && parsed.workspaceSummary) {
    version = 0;
  } else {
    version = 1;
  }
  if (version > CURRENT_SNAPSHOT_VERSION) {
    throw new Error(
      `Snapshot version ${version} is newer than supported ${CURRENT_SNAPSHOT_VERSION}. Upgrade Modulens.`
    );
  }
  if (version < CURRENT_SNAPSHOT_VERSION) {
    return migrateSnapshot(parsed, version);
  }
  return parsed as unknown as AnalysisSnapshot;
}

function migrateSnapshot(parsed: Record<string, unknown>, fromVersion: number): AnalysisSnapshot {
  if (fromVersion === 0) {
    const result = (parsed.result ?? parsed) as ScanResult;
    return createAnalysisSnapshot(result);
  }
  throw new Error(`No migration path from snapshot version ${fromVersion}`);
}
