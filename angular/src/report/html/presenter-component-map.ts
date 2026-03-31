import type { ScanResult } from "../../core/scan-result";
import type { DiagnosisEvidence, DiagnosticStatus } from "../../diagnostic/diagnostic-models";
import type { ConfidenceBreakdown } from "../../confidence/confidence-models";
import { RULES_REGISTRY, type RuleSeverity } from "../../rules/rule-registry";
import { getProjectForPath } from "../report-view-model";
import { inferFeatureFromPath, inferFeatureFromClassName } from "./feature-extraction";
import { getComponentDetailEntry, normalizePath } from "./presenter-paths";
import {
  normalizeSeverityCode,
  toCanonicalSeverityOrNull,
  type CanonicalSeverityCode,
} from "./presenter-severity";
import {
  resolveFinalSeverity,
  type SeverityConfidence,
} from "../severity/severity-resolver";
import { mapSeverityReasonsForDisplay } from "../presentation/severity-reason-copy";

/** Merged component details for the drawer, keyed by filePath */
export interface ComponentDetailEntry {
  filePath: string;
  fileName: string;
  className?: string;
  lineCount?: number;
  methodCount?: number;
  propertyCount?: number;
  dependencyCount?: number;
  dominantIssue?: string | null;
  supportingIssues?: string[];
  refactorDirection?: string;
  diagnosticLabel?: string;
  evidence?: DiagnosisEvidence[];
  componentRole?: string;
  roleConfidence?: number;
  roleSignals?: string[];
  roleConfidenceBreakdown?: ConfidenceBreakdown;
  issues?: Array<{ type: string; message: string; severity: string }>;
  highestSeverity?: CanonicalSeverityCode;
  lifecycle?: {
    subscribeCount?: number;
    riskySubscribeCount?: number;
    managedSubscribeCount?: number;
    longLivedRiskyCount?: number;
    setTimeoutCount?: number;
    clearTimeoutCount?: number;
    addEventListenerCount?: number;
    removeEventListenerCount?: number;
    missingTimeoutCleanupCount?: number;
    missingEventListenerCleanupCount?: number;
  };
  template?: {
    lineCount?: number;
    methodCallCount?: number;
    eventBindingCount?: number;
    structuralDepth?: number;
    propertyBindingCount?: number;
  };
  responsibility?: {
    methodCount?: number;
    propertyCount?: number;
    serviceOrchestrationCount?: number;
    uiStateFieldCount?: number;
    formGroupCount?: number;
    formPatchSetUpdateCount?: number;
  };
  decompositionSuggestion?: {
    originalComponent: string;
    suggestedArchitecture: string;
    extractedComponents: string[];
    extractedServices: string[];
    reasoning: string[];
    confidence: number;
    strategy: "minimal" | "moderate" | "aggressive";
    confidenceBreakdown?: ConfidenceBreakdown;
  } | null;
  sourceRoot?: string | null;
  inferredFeatureArea?: string | null;
  rankingReason?: string;
  /** measured | inferred | low. From severity resolution. */
  confidence?: SeverityConfidence;
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
  anomalyReasons?: string[];
  /** Canonical severity reconciled with rules + risk score (matches Components explorer). */
  computedSeverity?: CanonicalSeverityCode;
  /** User-facing lines derived from internal anomalyReasons. */
  severityNotesForDisplay?: string[];
  /** From full diagnostic consolidation (all components). */
  diagnosticStatus?: DiagnosticStatus;
  /** One-line severity trust hint for HTML client (no raw confidence enum). */
  severityTrustSummary?: string | null;
  /** Rule IDs for this component (drawer related-rules + explorer). */
  triggeredRuleIds?: string[];
}

export function buildComponentDetailsMap(result: ScanResult): Record<string, ComponentDetailEntry> {
  const map: Record<string, ComponentDetailEntry> = {};

  // Component-level metrics from size/dependency analyzer (top prioritized set).
  for (const c of result.topProblematicComponents) {
    const key = normalizePath(c.filePath);
    if (!map[key]) map[key] = { filePath: c.filePath, fileName: c.fileName };
    map[key].lineCount = c.lineCount;
    map[key].dependencyCount = c.dependencyCount;
    map[key].issues = c.issues;
    map[key].highestSeverity = c.highestSeverity ? normalizeSeverityCode(c.highestSeverity) : undefined;
  }

  for (const d of result.diagnosticSummary.topCrossCuttingRisks) {
    const key = normalizePath(d.filePath);
    if (!map[key]) map[key] = { filePath: d.filePath, fileName: d.fileName, className: d.className ?? undefined };
    map[key].dominantIssue = d.dominantIssue;
    map[key].supportingIssues = d.supportingIssues ?? [];
    map[key].refactorDirection = d.refactorDirection;
    map[key].diagnosticLabel = d.diagnosticLabel;
    map[key].diagnosticStatus = d.diagnosticStatus;
    map[key].evidence = d.evidence;
    map[key].componentRole = d.componentRole;
    map[key].roleConfidence = d.roleConfidence;
    map[key].roleSignals = d.roleSignals;
    map[key].roleConfidenceBreakdown = d.roleConfidenceBreakdown;
    map[key].decompositionSuggestion = d.decompositionSuggestion ?? undefined;
    map[key].rankingReason = d.rankingReason;
  }

  for (const d of result.diagnosticSummary.componentDiagnostics ?? []) {
    const key = normalizePath(d.filePath);
    if (!map[key]) map[key] = { filePath: d.filePath, fileName: d.fileName, className: d.className ?? undefined };
    map[key].dominantIssue = d.dominantIssue;
    map[key].supportingIssues = d.supportingIssues ?? [];
    map[key].refactorDirection = d.refactorDirection;
    map[key].diagnosticLabel = d.diagnosticLabel;
    map[key].diagnosticStatus = d.diagnosticStatus;
    map[key].componentRole = d.componentRole;
    map[key].roleConfidence = d.roleConfidence;
    map[key].roleSignals = d.roleSignals;
    map[key].roleConfidenceBreakdown = d.roleConfidenceBreakdown;
    map[key].evidence = d.evidence;
    map[key].rankingReason = d.rankingReason;
    map[key].triggeredRuleIds = d.triggeredRuleIds?.length ? [...d.triggeredRuleIds] : map[key].triggeredRuleIds;
    if (d.decompositionSuggestion) map[key].decompositionSuggestion = d.decompositionSuggestion;
  }

  // Responsibility analyzer (top risks) – enriched responsibility/template/lifecycle metrics.
  for (const r of result.responsibility.topRisks) {
    const key = normalizePath(r.filePath);
    if (!map[key]) map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    map[key].lineCount = map[key].lineCount ?? r.lineCount;
    map[key].methodCount = r.metrics?.methodCount;
    map[key].propertyCount = r.metrics?.propertyCount;
    map[key].responsibility = r.metrics
      ? {
          methodCount: r.metrics.methodCount,
          propertyCount: r.metrics.propertyCount,
          serviceOrchestrationCount: r.metrics.serviceOrchestrationCount,
          uiStateFieldCount: r.metrics.uiStateFieldCount,
          formGroupCount: r.metrics.formGroupCount,
          formPatchSetUpdateCount: r.metrics.formPatchSetUpdateCount,
        }
      : undefined;
    if (r.lifecycleSignals) {
      map[key].lifecycle = {
        subscribeCount: r.lifecycleSignals.subscribeCount,
        riskySubscribeCount: r.lifecycleSignals.riskySubscribeCount,
        managedSubscribeCount: r.lifecycleSignals.managedSubscribeCount,
        longLivedRiskyCount: r.lifecycleSignals.longLivedRiskyCount,
        setTimeoutCount: r.lifecycleSignals.setTimeoutCount,
        clearTimeoutCount: r.lifecycleSignals.clearTimeoutCount,
        addEventListenerCount: r.lifecycleSignals.addEventListenerCount,
        removeEventListenerCount: r.lifecycleSignals.removeEventListenerCount,
        missingTimeoutCleanupCount: r.lifecycleSignals.missingTimeoutCleanupCount,
        missingEventListenerCleanupCount: r.lifecycleSignals.missingEventListenerCleanupCount,
      };
    }
    if (r.templateMetrics) {
      map[key].template = {
        lineCount: r.templateMetrics.lineCount,
        methodCallCount: r.templateMetrics.methodCallCount,
        eventBindingCount: r.templateMetrics.eventBindingCount,
        structuralDepth: r.templateMetrics.structuralDepth,
        propertyBindingCount: r.templateMetrics.propertyBindingCount,
      };
    }
  }

  // Template analyzer (top risks) – template metrics for highlighted components.
  for (const r of result.template.topRisks) {
    const key = normalizePath(r.filePath);
    if (!map[key]) map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    map[key].template = {
      ...map[key].template,
      lineCount: r.metrics?.lineCount ?? map[key].template?.lineCount,
      methodCallCount: r.metrics?.methodCallCount ?? map[key].template?.methodCallCount,
      eventBindingCount: r.metrics?.eventBindingCount ?? map[key].template?.eventBindingCount,
      structuralDepth: r.metrics?.structuralDepth ?? map[key].template?.structuralDepth,
      propertyBindingCount: r.metrics?.propertyBindingCount ?? map[key].template?.propertyBindingCount,
    };
  }

  // Lifecycle analyzer (top risks) – subscription/cleanup metrics for highlighted components.
  for (const r of result.lifecycle.topRisks) {
    const key = normalizePath(r.filePath);
    if (!map[key]) map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    map[key].lifecycle = {
      ...map[key].lifecycle,
      subscribeCount: r.signals?.subscribeCount ?? map[key].lifecycle?.subscribeCount,
      riskySubscribeCount: r.signals?.riskySubscribeCount ?? map[key].lifecycle?.riskySubscribeCount,
      managedSubscribeCount: r.signals?.managedSubscribeCount ?? map[key].lifecycle?.managedSubscribeCount,
      longLivedRiskyCount: r.signals?.longLivedRiskyCount ?? map[key].lifecycle?.longLivedRiskyCount,
      setTimeoutCount: r.signals?.setTimeoutCount ?? map[key].lifecycle?.setTimeoutCount,
      clearTimeoutCount: r.signals?.clearTimeoutCount ?? map[key].lifecycle?.clearTimeoutCount,
      addEventListenerCount: r.signals?.addEventListenerCount ?? map[key].lifecycle?.addEventListenerCount,
      removeEventListenerCount: r.signals?.removeEventListenerCount ?? map[key].lifecycle?.removeEventListenerCount,
      missingTimeoutCleanupCount: r.signals?.missingTimeoutCleanupCount ?? map[key].lifecycle?.missingTimeoutCleanupCount,
      missingEventListenerCleanupCount: r.signals?.missingEventListenerCleanupCount ?? map[key].lifecycle?.missingEventListenerCleanupCount,
    };
  }

  // Backfill metrics for all analyzed components using full analyzer outputs (if available).
  // These arrays are optional for backward compatibility with older snapshots.
  // Component analyzer: authoritative lineCount/dependencyCount for every component.
  for (const c of result.allComponents ?? []) {
    const key = normalizePath(c.filePath);
    if (!map[key]) {
      map[key] = { filePath: c.filePath, fileName: c.fileName };
    }
    map[key].lineCount = map[key].lineCount ?? c.lineCount;
    map[key].dependencyCount = map[key].dependencyCount ?? c.dependencyCount;
    // Do not copy issues/highestSeverity here – topProblematicComponents already carries prioritized issues.
  }

  // Responsibility analyzer: full metrics for components even if they did not land in topRisks.
  for (const r of result.allResponsibilityResults ?? []) {
    const key = normalizePath(r.filePath);
    if (!map[key]) {
      map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    }
    const metrics = r.metrics;
    if (metrics) {
      map[key].lineCount = map[key].lineCount ?? r.lineCount;
      map[key].methodCount = map[key].methodCount ?? metrics.methodCount;
      map[key].propertyCount = map[key].propertyCount ?? metrics.propertyCount;
      map[key].dependencyCount = map[key].dependencyCount ?? metrics.dependencyCount;
      map[key].responsibility = {
        methodCount: map[key].responsibility?.methodCount ?? metrics.methodCount,
        propertyCount: map[key].responsibility?.propertyCount ?? metrics.propertyCount,
        serviceOrchestrationCount:
          map[key].responsibility?.serviceOrchestrationCount ?? metrics.serviceOrchestrationCount,
        uiStateFieldCount: map[key].responsibility?.uiStateFieldCount ?? metrics.uiStateFieldCount,
        formGroupCount: map[key].responsibility?.formGroupCount ?? metrics.formGroupCount,
        formPatchSetUpdateCount:
          map[key].responsibility?.formPatchSetUpdateCount ?? metrics.formPatchSetUpdateCount,
      };
    }
    if (r.lifecycleSignals) {
      const existing = map[key].lifecycle ?? {};
      map[key].lifecycle = {
        ...existing,
        subscribeCount: existing.subscribeCount ?? r.lifecycleSignals.subscribeCount,
        riskySubscribeCount: existing.riskySubscribeCount ?? r.lifecycleSignals.riskySubscribeCount,
        managedSubscribeCount:
          existing.managedSubscribeCount ?? r.lifecycleSignals.managedSubscribeCount,
        longLivedRiskyCount:
          existing.longLivedRiskyCount ?? r.lifecycleSignals.longLivedRiskyCount,
        setTimeoutCount: existing.setTimeoutCount ?? r.lifecycleSignals.setTimeoutCount,
        clearTimeoutCount: existing.clearTimeoutCount ?? r.lifecycleSignals.clearTimeoutCount,
        addEventListenerCount:
          existing.addEventListenerCount ?? r.lifecycleSignals.addEventListenerCount,
        removeEventListenerCount:
          existing.removeEventListenerCount ?? r.lifecycleSignals.removeEventListenerCount,
        missingTimeoutCleanupCount:
          existing.missingTimeoutCleanupCount ?? r.lifecycleSignals.missingTimeoutCleanupCount,
        missingEventListenerCleanupCount:
          existing.missingEventListenerCleanupCount ??
          r.lifecycleSignals.missingEventListenerCleanupCount,
      };
    }
    if (r.templateMetrics) {
      const existing = map[key].template ?? {};
      map[key].template = {
        ...existing,
        lineCount: existing.lineCount ?? r.templateMetrics.lineCount,
        methodCallCount: existing.methodCallCount ?? r.templateMetrics.methodCallCount,
        eventBindingCount: existing.eventBindingCount ?? r.templateMetrics.eventBindingCount,
        structuralDepth: existing.structuralDepth ?? r.templateMetrics.structuralDepth,
        propertyBindingCount:
          existing.propertyBindingCount ?? r.templateMetrics.propertyBindingCount,
      };
    }
  }

  // Template analyzer: full template metrics (line counts, depth, etc.) for all components with templates.
  for (const r of result.allTemplateResults ?? []) {
    const key = normalizePath(r.filePath);
    if (!map[key]) {
      map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    }
    const metrics = r.metrics;
    if (!metrics) continue;
    const existing = map[key].template ?? {};
    map[key].template = {
      ...existing,
      lineCount: existing.lineCount ?? metrics.lineCount,
      methodCallCount: existing.methodCallCount ?? metrics.methodCallCount,
      eventBindingCount: existing.eventBindingCount ?? metrics.eventBindingCount,
      structuralDepth: existing.structuralDepth ?? metrics.structuralDepth,
      propertyBindingCount: existing.propertyBindingCount ?? metrics.propertyBindingCount,
    };
  }

  // Lifecycle analyzer: full subscription/cleanup metrics for all lifecycle targets.
  for (const r of result.allLifecycleResults ?? []) {
    const key = normalizePath(r.filePath);
    if (!map[key]) {
      map[key] = { filePath: r.filePath, fileName: r.fileName, className: r.className };
    }
    const existing = map[key].lifecycle ?? {};
    map[key].lifecycle = {
      ...existing,
      subscribeCount: existing.subscribeCount ?? r.signals.subscribeCount,
      riskySubscribeCount: existing.riskySubscribeCount ?? r.signals.riskySubscribeCount,
      managedSubscribeCount: existing.managedSubscribeCount ?? r.signals.managedSubscribeCount,
      longLivedRiskyCount: existing.longLivedRiskyCount ?? r.signals.longLivedRiskyCount,
      setTimeoutCount: existing.setTimeoutCount ?? r.signals.setTimeoutCount,
      clearTimeoutCount: existing.clearTimeoutCount ?? r.signals.clearTimeoutCount,
      addEventListenerCount: existing.addEventListenerCount ?? r.signals.addEventListenerCount,
      removeEventListenerCount:
        existing.removeEventListenerCount ?? r.signals.removeEventListenerCount,
      missingTimeoutCleanupCount:
        existing.missingTimeoutCleanupCount ?? r.signals.missingTimeoutCleanupCount,
      missingEventListenerCleanupCount:
        existing.missingEventListenerCleanupCount ?? r.signals.missingEventListenerCleanupCount,
    };
  }

  for (const key of Object.keys(map)) {
    const entry = map[key];
    entry.sourceRoot = getProjectForPath(key, result.projectBreakdown) ?? undefined;
    entry.inferredFeatureArea = inferFeatureFromPath(key) ?? (entry.className ? inferFeatureFromClassName(entry.className) : null) ?? undefined;
  }

  return map;
}

export interface ComponentsExplorerItem {
  filePath: string;
  fileName: string;
  className?: string;
  lineCount?: number;
  lineCountStatus?: "known" | "zero" | "unknown";
  dependencyCount?: number;
  dependencyCountStatus?: "known" | "zero" | "unknown";
  dominantIssue?: string | null;
  highestSeverity?: CanonicalSeverityCode;
  componentRole?: string;
  roleConfidence?: number;
  sourceRoot?: string | null;
  inferredFeatureArea?: string | null;
  templateLineCount?: number;
  templateLineCountStatus?: "known" | "zero" | "unknown";
  methodCount?: number;
  methodCountStatus?: "known" | "zero" | "unknown";
  subscriptionCount?: number;
  subscriptionCountStatus?: "known" | "zero" | "unknown";
  serviceOrchestrationCount?: number;
  serviceOrchestrationCountStatus?: "known" | "zero" | "unknown";
  totalWarningCount?: number;
  project?: string | null;
  triggeredRuleIds?: string[];
  /** Highest severity coming from component analysis / componentsBySeverity, if any. */
  baseSeverity?: CanonicalSeverityCode | null;
  /** Computed numeric risk score (0-100) combining rules + metrics. */
  computedRiskScore?: number;
  /** Canonical severity derived from computedRiskScore + rule mix. */
  computedSeverity?: CanonicalSeverityCode;
  /** measured = baseSeverity present; inferred = rule/risk only; low = weak signals or missing metrics. */
  confidence?: SeverityConfidence;
  /** @deprecated Use confidence instead. Kept for backward compatibility with older snapshots. */
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
  anomalyReasons?: string[];
  /** User-facing severity notes (mapped from anomalyReasons). */
  severityNotesForDisplay?: string[];
}

export function buildComponentsExplorerItems(result: ScanResult): ComponentsExplorerItem[] {
  const detailsMap = buildComponentDetailsMap(result);
  const byPath = new Map<string, ComponentsExplorerItem>();

  const ruleSeverityById = new Map<string, RuleSeverity>();
  for (const rule of RULES_REGISTRY) {
    ruleSeverityById.set(rule.id, rule.severity);
  }

  const addFromDiagnostic = (d: {
    filePath: string;
    fileName: string;
    className?: string;
    dominantIssue?: string | null;
    totalWarningCount?: number;
    componentRole?: string;
    roleConfidence?: number;
    triggeredRuleIds?: string[];
  }) => {
    const key = normalizePath(d.filePath);
    const entry = getComponentDetailEntry(detailsMap, d.filePath);
    if (!byPath.has(key)) {
      byPath.set(key, {
        filePath: d.filePath,
        fileName: d.fileName,
        className: d.className,
        lineCount: entry?.lineCount,
        dependencyCount: entry?.dependencyCount,
        dominantIssue: d.dominantIssue ?? entry?.dominantIssue,
        highestSeverity: entry?.highestSeverity ? normalizeSeverityCode(entry.highestSeverity) : undefined,
        componentRole: d.componentRole ?? entry?.componentRole,
        roleConfidence: d.roleConfidence ?? entry?.roleConfidence,
        sourceRoot: entry?.sourceRoot,
        inferredFeatureArea: entry?.inferredFeatureArea,
        templateLineCount: entry?.template?.lineCount,
        methodCount: entry?.methodCount ?? entry?.responsibility?.methodCount,
        subscriptionCount: entry?.lifecycle?.subscribeCount,
        serviceOrchestrationCount: entry?.responsibility?.serviceOrchestrationCount,
        totalWarningCount: d.totalWarningCount,
        project: getProjectForPath(d.filePath, result.projectBreakdown),
        triggeredRuleIds: d.triggeredRuleIds,
      });
    } else {
      const existing = byPath.get(key)!;
      if (d.triggeredRuleIds && !existing.triggeredRuleIds) {
        existing.triggeredRuleIds = d.triggeredRuleIds;
      }
    }
  };

  const addFromProblematic = (c: {
    filePath: string;
    fileName: string;
    lineCount?: number;
    dependencyCount?: number;
    highestSeverity?: string;
    issues?: Array<{ type: string; severity: string }>;
  }, triggeredRuleIds: string[] = []) => {
    const key = normalizePath(c.filePath);
    const entry = getComponentDetailEntry(detailsMap, c.filePath);
    const existing = byPath.get(key);
    const canonical =
      c.highestSeverity != null
        ? toCanonicalSeverityOrNull(c.highestSeverity)
        : entry?.highestSeverity
        ? toCanonicalSeverityOrNull(entry.highestSeverity)
        : null;
    if (!existing) {
      byPath.set(key, {
        filePath: c.filePath,
        fileName: c.fileName,
        lineCount: c.lineCount ?? entry?.lineCount,
        dependencyCount: c.dependencyCount ?? entry?.dependencyCount,
        dominantIssue: entry?.dominantIssue,
        highestSeverity: canonical ?? undefined,
        componentRole: entry?.componentRole,
        roleConfidence: entry?.roleConfidence,
        sourceRoot: entry?.sourceRoot,
        inferredFeatureArea: entry?.inferredFeatureArea,
        templateLineCount: entry?.template?.lineCount,
        methodCount: entry?.methodCount ?? entry?.responsibility?.methodCount,
        subscriptionCount: entry?.lifecycle?.subscribeCount,
        serviceOrchestrationCount: entry?.responsibility?.serviceOrchestrationCount,
        totalWarningCount: c.issues?.length,
        project: getProjectForPath(c.filePath, result.projectBreakdown),
        triggeredRuleIds: triggeredRuleIds.length ? triggeredRuleIds : undefined,
        baseSeverity: canonical,
      });
    } else {
      existing.lineCount = existing.lineCount ?? c.lineCount ?? entry?.lineCount;
      existing.dependencyCount = existing.dependencyCount ?? c.dependencyCount ?? entry?.dependencyCount;
      if (!existing.highestSeverity && canonical) {
        existing.highestSeverity = canonical;
        existing.baseSeverity = canonical;
      }
      if (triggeredRuleIds.length && !existing.triggeredRuleIds) {
        existing.triggeredRuleIds = triggeredRuleIds;
      }
    }
  };

  const diagnostics = result.diagnosticSummary.componentDiagnostics ?? result.diagnosticSummary.topCrossCuttingRisks;
  const triggeredByPath = new Map<string, string[]>();
  for (const d of diagnostics) {
    if (d.triggeredRuleIds?.length) {
      triggeredByPath.set(normalizePath(d.filePath), d.triggeredRuleIds);
    }
    addFromDiagnostic(d);
  }
  for (const c of result.topProblematicComponents) {
    const ruleIds = triggeredByPath.get(normalizePath(c.filePath)) ?? c.issues?.map((i) => i.type) ?? [];
    addFromProblematic(c, ruleIds);
  }

  const items = Array.from(byPath.values());

  // Debug counters for internal visibility into missing metrics on flagged rows.
  let debugTotalRows = 0;
  let debugFlaggedRows = 0;
  let debugFlaggedWithMissingCoreMetrics = 0;

  for (const item of items) {
    const entry = getComponentDetailEntry(detailsMap, item.filePath);

    // Normalize numeric metrics: keep explicit 0, but treat missing as null.
    const lineCount =
      item.lineCount ??
      entry?.lineCount ??
      (entry?.template?.lineCount != null ? entry.template.lineCount : undefined);
    const dependencyCount = item.dependencyCount ?? entry?.dependencyCount;
    const templateLineCount =
      item.templateLineCount ??
      (entry?.template?.lineCount != null ? entry.template.lineCount : undefined);
    const methodCount =
      item.methodCount ??
      (entry?.methodCount != null
        ? entry.methodCount
        : entry?.responsibility?.methodCount != null
        ? entry.responsibility.methodCount
        : undefined);
    const subscriptionCount =
      item.subscriptionCount ??
      (entry?.lifecycle?.subscribeCount != null ? entry.lifecycle.subscribeCount : undefined);
    const serviceOrchestrationCount =
      item.serviceOrchestrationCount ??
      (entry?.responsibility?.serviceOrchestrationCount != null
        ? entry.responsibility.serviceOrchestrationCount
        : undefined);

    item.lineCount = lineCount;
    item.dependencyCount = dependencyCount;
    item.templateLineCount = templateLineCount;
    item.methodCount = methodCount;
    item.subscriptionCount = subscriptionCount;
    item.serviceOrchestrationCount = serviceOrchestrationCount;
    // propertyCount is only used for richer UIs; we don't expose it directly on the explorer item,
    // but we still account for it when computing anomalies and risk.

    // Track per-metric status to distinguish unknown vs computed zero.
    const lineCountStatus: ComponentsExplorerItem["lineCountStatus"] =
      lineCount == null ? "unknown" : lineCount === 0 ? "zero" : "known";
    const dependencyCountStatus: ComponentsExplorerItem["dependencyCountStatus"] =
      dependencyCount == null ? "unknown" : dependencyCount === 0 ? "zero" : "known";
    const templateLineCountStatus: ComponentsExplorerItem["templateLineCountStatus"] =
      templateLineCount == null ? "unknown" : templateLineCount === 0 ? "zero" : "known";
    const methodCountStatus: ComponentsExplorerItem["methodCountStatus"] =
      methodCount == null ? "unknown" : methodCount === 0 ? "zero" : "known";
    const subscriptionCountStatus: ComponentsExplorerItem["subscriptionCountStatus"] =
      subscriptionCount == null ? "unknown" : subscriptionCount === 0 ? "zero" : "known";
    const serviceOrchestrationCountStatus: ComponentsExplorerItem["serviceOrchestrationCountStatus"] =
      serviceOrchestrationCount == null ? "unknown" : serviceOrchestrationCount === 0 ? "zero" : "known";

    item.lineCountStatus = lineCountStatus;
    item.dependencyCountStatus = dependencyCountStatus;
    item.templateLineCountStatus = templateLineCountStatus;
    item.methodCountStatus = methodCountStatus;
    item.subscriptionCountStatus = subscriptionCountStatus;
    item.serviceOrchestrationCountStatus = serviceOrchestrationCountStatus;

    const warningCount = item.totalWarningCount ?? 0;
    item.totalWarningCount = warningCount;

    const baseSeverity = item.baseSeverity ?? toCanonicalSeverityOrNull(entry?.highestSeverity);
    item.baseSeverity = baseSeverity ?? null;

    // Build rule severity histogram from triggered rules.
    const histogram = {
      critical: 0,
      high: 0,
      warning: 0,
      info: 0,
    };
    const triggeredRuleIds = item.triggeredRuleIds ?? [];
    for (const id of triggeredRuleIds) {
      const sev = ruleSeverityById.get(id) ?? "warning";
      if (sev === "critical") histogram.critical++;
      else if (sev === "high") histogram.high++;
      else if (sev === "warning") histogram.warning++;
      else if (sev === "info") histogram.info++;
    }

    // Compute numeric risk score combining rules + metrics.
    let score = 0;

    // Rule-driven contributions (capped to avoid runaway scores).
    score += Math.min(histogram.critical, 3) * 30;
    score += Math.min(histogram.high, 4) * 20;
    score += Math.min(histogram.warning, 6) * 10;
    score += Math.min(histogram.info, 8) * 3;

    // Metric-driven contributions. Thresholds roughly aligned with rule descriptions.
    if (lineCount != null) {
      if (lineCount >= 1200) score += 20;
      else if (lineCount >= 800) score += 14;
      else if (lineCount >= 400) score += 8;
    }
    if (dependencyCount != null) {
      if (dependencyCount >= 12) score += 15;
      else if (dependencyCount >= 8) score += 10;
      else if (dependencyCount >= 6) score += 6;
    }
    if (templateLineCount != null) {
      if (templateLineCount >= 250) score += 12;
      else if (templateLineCount >= 150) score += 8;
    }
    if (subscriptionCount != null && subscriptionCount > 0) {
      if (subscriptionCount >= 8) score += 15;
      else if (subscriptionCount >= 4) score += 10;
      else score += 5;
    }
    if (serviceOrchestrationCount != null && serviceOrchestrationCount > 0) {
      if (serviceOrchestrationCount >= 8) score += 15;
      else if (serviceOrchestrationCount >= 4) score += 10;
      else score += 5;
    }

    // Total warning count influence (beyond a small baseline).
    if (warningCount > 3) {
      score += Math.min(warningCount - 3, 5) * 5;
    }

    // Small bump based on base severity, if present.
    if (baseSeverity === "CRITICAL") score += 15;
    else if (baseSeverity === "HIGH") score += 10;
    else if (baseSeverity === "WARNING") score += 5;

    const computedRiskScore = Math.max(0, Math.min(100, score));

    // Centralized severity resolution.
    const resolution = resolveFinalSeverity({
      baseSeverity,
      ruleHistogram: histogram,
      computedRiskScore,
      dominantIssue: item.dominantIssue ?? entry?.dominantIssue ?? null,
      triggeredRuleIds,
    });

    item.computedRiskScore = computedRiskScore;
    item.baseSeverity = resolution.baseSeverity;
    item.computedSeverity = resolution.finalSeverity;
    item.confidence = resolution.confidence;
    item.anomalyReasons = resolution.explanation.length ? resolution.explanation : undefined;

    // Data-quality: downgrade to "low" when metrics are missing but warnings present.
    const metricsAllUnknown =
      lineCountStatus === "unknown" &&
      dependencyCountStatus === "unknown" &&
      templateLineCountStatus === "unknown" &&
      subscriptionCountStatus === "unknown" &&
      serviceOrchestrationCountStatus === "unknown" &&
      methodCountStatus === "unknown";

    if (warningCount > 0 && metricsAllUnknown) {
      item.confidence = "low";
      item.anomalyReasons = [
        ...(item.anomalyReasons ?? []),
        "Warnings present but complexity metrics for this component are missing or incomplete.",
      ];
    }

    // Backward compatibility: derive anomalyFlag from confidence for older snapshots.
    if (item.confidence === "inferred") {
      item.anomalyFlag = "severity-missing-with-critical-rules";
    } else if (item.confidence === "low" && warningCount > 0 && metricsAllUnknown) {
      item.anomalyFlag = "metrics-missing-with-warnings";
    } else {
      item.anomalyFlag = "none";
    }

    item.severityNotesForDisplay = mapSeverityReasonsForDisplay(item.anomalyReasons);

    // Update debug counters.
    debugTotalRows++;
    const isFlagged =
      warningCount > 0 ||
      (item.computedSeverity != null && item.computedSeverity !== "LOW") ||
      (item.baseSeverity != null && item.baseSeverity !== "LOW");
    if (isFlagged) {
      debugFlaggedRows++;
      if (item.confidence === "low" && metricsAllUnknown) {
        debugFlaggedWithMissingCoreMetrics++;
      }
    }
  }

  if (process.env.ANGULAR_DOCTOR_DEBUG === "1") {
    const ratio =
      debugFlaggedRows > 0
        ? ((debugFlaggedWithMissingCoreMetrics / debugFlaggedRows) * 100).toFixed(1)
        : "0.0";
    // Short internal log only; surfaced when debugging is enabled.
    // eslint-disable-next-line no-console
    console.debug(
      `[Modulens] Components explorer: ${debugTotalRows} rows, ${debugFlaggedRows} flagged, ${debugFlaggedWithMissingCoreMetrics} flagged with missing core metrics (${ratio}%)`
    );
  }

  return items;
}
