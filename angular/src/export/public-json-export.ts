import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import type { ExplainedScore, ScanResult, Scores } from "../core/scan-result";
import type { StructureAnalysisResult, StructureConcern } from "../core/structure-models";
import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import type { ArchitectureSmell, ArchitectureSmellSummary } from "../angular/intelligence/architecture-smell";
import type { FeaturePattern } from "../angular/intelligence/feature-pattern";
import type {
  LifecycleAnalysisResult,
  LifecycleSummary,
} from "../angular/analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult, TemplateSummary } from "../angular/analyzers/template/template-models";
import type {
  ResponsibilityAnalysisResult,
  ResponsibilitySummary,
} from "../angular/analyzers/responsibility/responsibility-models";
import type { RefactorTask } from "../refactor/refactor-task-models";
import type { ComponentDetailEntry } from "../report/html/html-report-presenter";
import { normalizePath } from "../report/html/html-report-presenter";
import { PUBLIC_JSON_SCHEMA_VERSION } from "./public-json-schema";

function strCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function sortedStringKeys<T>(obj: Record<string, T> | undefined): string[] {
  if (!obj) return [];
  return Object.keys(obj).sort(strCmp);
}

function toSortedRecord<T>(obj: Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of sortedStringKeys(obj)) {
    out[k] = obj![k]!;
  }
  return out;
}

function stableExplainedScore(e: ExplainedScore | undefined): ExplainedScore {
  if (!e) {
    return { score: 0, factors: [] };
  }
  return {
    score: e.score,
    factors: [...(e.factors ?? [])].sort((a, b) => strCmp(a.name, b.name)),
    shortExplanation: e.shortExplanation,
  };
}

function stableScores(s: Scores): Scores {
  return {
    overall: s.overall,
    component: stableExplainedScore(s.component),
    lifecycle: stableExplainedScore(s.lifecycle),
    template: stableExplainedScore(s.template),
    responsibility: stableExplainedScore(s.responsibility),
  };
}

function sortByNormalizedPath<T>(items: readonly T[], getPath: (t: T) => string): T[] {
  return [...items].sort((a, b) => strCmp(normalizePath(getPath(a)), normalizePath(getPath(b))));
}

function slimLifecycleRow(r: LifecycleAnalysisResult) {
  const warnings = [...(r.warnings ?? [])].sort((a, b) =>
    strCmp(`${a.code}\0${a.message}`, `${b.code}\0${b.message}`)
  );
  return {
    filePath: r.filePath,
    fileName: r.fileName,
    className: r.className,
    targetType: r.targetType,
    riskLevel: r.riskLevel,
    highestSeverity: r.highestSeverity,
    warningCount: r.warnings?.length ?? 0,
    warnings: warnings.map((w) => ({
      code: w.code,
      severity: w.severity,
      message: w.message,
    })),
  };
}

function slimTemplateRow(r: TemplateAnalysisResult) {
  const warnings = [...(r.warnings ?? [])].sort((a, b) =>
    strCmp(`${a.code}\0${a.message}`, `${b.code}\0${b.message}`)
  );
  return {
    filePath: r.filePath,
    fileName: r.fileName,
    className: r.className,
    warningCount: r.warnings?.length ?? 0,
    warnings: warnings.map((w) => ({
      code: w.code,
      severity: w.severity,
      message: w.message,
    })),
  };
}

function slimResponsibilityRow(r: ResponsibilityAnalysisResult) {
  const warnings = [...(r.warnings ?? [])].sort((a, b) =>
    strCmp(`${a.code}\0${a.message}`, `${b.code}\0${b.message}`)
  );
  return {
    filePath: r.filePath,
    fileName: r.fileName,
    className: r.className,
    warningCount: r.warnings?.length ?? 0,
    warnings: warnings.map((w) => ({
      code: w.code,
      severity: w.severity,
      message: w.message,
    })),
  };
}

function slimDiagnostic(d: ComponentDiagnostic) {
  return {
    filePath: d.filePath,
    fileName: d.fileName,
    className: d.className,
    dominantIssue: d.dominantIssue,
    totalWarningCount: d.totalWarningCount,
    diagnosticLabel: d.diagnosticLabel,
    diagnosticStatus: d.diagnosticStatus,
    refactorDirection: d.refactorDirection,
    componentRole: d.componentRole,
    roleConfidence: d.roleConfidence,
    triggeredRuleIds: d.triggeredRuleIds?.length ? [...d.triggeredRuleIds].sort(strCmp) : undefined,
  };
}

function slimComponentRow(e: ComponentDetailEntry) {
  const issues = e.issues
    ? [...e.issues].sort((a, b) => strCmp(`${a.type}\0${a.message}`, `${b.type}\0${b.message}`))
    : undefined;
  return {
    filePath: e.filePath,
    fileName: e.fileName,
    className: e.className,
    lineCount: e.lineCount,
    dependencyCount: e.dependencyCount,
    methodCount: e.methodCount,
    propertyCount: e.propertyCount,
    dominantIssue: e.dominantIssue ?? null,
    highestSeverity: e.highestSeverity,
    computedSeverity: e.computedSeverity,
    severityConfidence: e.confidence,
    severityNotesForDisplay: e.severityNotesForDisplay?.length ? [...e.severityNotesForDisplay] : undefined,
    componentRole: e.componentRole,
    roleConfidence: e.roleConfidence,
    diagnosticLabel: e.diagnosticLabel,
    refactorDirection: e.refactorDirection,
    supportingIssues: e.supportingIssues?.length ? [...e.supportingIssues].sort(strCmp) : undefined,
    sourceRoot: e.sourceRoot ?? null,
    inferredFeatureArea: e.inferredFeatureArea ?? null,
    template: e.template,
    lifecycle: e.lifecycle,
    responsibility: e.responsibility,
    issueCount: issues?.length,
    issues,
  };
}

function exportConcern(c: StructureConcern): StructureConcern {
  const affectedPaths = [...c.affectedPaths].map(normalizePath).sort(strCmp);
  const samplePaths = [...c.samplePaths].map(normalizePath).sort(strCmp);
  const suspiciousPlacementDetails = c.suspiciousPlacementDetails
    ? [...c.suspiciousPlacementDetails]
        .sort((x, y) => strCmp(normalizePath(x.path), normalizePath(y.path)))
        .map((d) => ({ ...d, path: normalizePath(d.path) }))
    : undefined;
  const affectedAreasWithCounts = c.affectedAreasWithCounts
    ? [...c.affectedAreasWithCounts].sort((x, y) => strCmp(x.area, y.area))
    : undefined;
  const affectedAreas = c.affectedAreas?.length ? [...c.affectedAreas].sort(strCmp) : undefined;
  return {
    ...c,
    affectedPaths,
    samplePaths,
    suspiciousPlacementDetails,
    affectedAreasWithCounts,
    affectedAreas,
  };
}

function exportStructure(s: StructureAnalysisResult | undefined): StructureAnalysisResult | null {
  if (!s) return null;
  const concerns = [...s.concerns].sort((a, b) => strCmp(a.concernType, b.concernType)).map(exportConcern);
  return {
    ...s,
    concerns,
  };
}

function exportSmell(smell: ArchitectureSmell): ArchitectureSmell {
  return {
    ...smell,
    affectedComponents: [...smell.affectedComponents].map(normalizePath).sort(strCmp),
    relatedFamilies: [...smell.relatedFamilies].sort(strCmp),
    evidence: [...smell.evidence].sort(strCmp),
    suggestedRefactorActions: [...smell.suggestedRefactorActions].sort(strCmp),
  };
}

function exportFeaturePattern(p: FeaturePattern): FeaturePattern {
  const components = [...p.components].sort(strCmp);
  const filePaths = p.filePaths?.length
    ? [...p.filePaths].map(normalizePath).sort(strCmp)
    : undefined;
  const sharedSignals = [...p.sharedSignals].sort(strCmp);
  const suggestedRefactor = [...p.suggestedRefactor].sort(strCmp);
  return {
    ...p,
    components,
    filePaths,
    sharedSignals,
    suggestedRefactor,
  };
}

const TASK_PRIORITY_ORDER: Record<RefactorTask["priority"], number> = {
  "fix-now": 0,
  "fix-soon": 1,
  monitor: 2,
};

function sortRefactorTasks(tasks: readonly RefactorTask[]): RefactorTask[] {
  return [...tasks].sort((a, b) => {
    const pa = TASK_PRIORITY_ORDER[a.priority] ?? 9;
    const pb = TASK_PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return strCmp(normalizePath(a.filePath), normalizePath(b.filePath));
  });
}

function buildRulesExport(result: ScanResult) {
  const counts = toSortedRecord(result.ruleViolationCounts);
  const affected = result.ruleToAffectedComponents;
  const affectedOut: Record<string, string[]> = {};
  for (const ruleId of sortedStringKeys(affected)) {
    affectedOut[ruleId] = [...affected![ruleId]!].map(normalizePath).sort(strCmp);
  }
  return {
    violationCounts: counts,
    affectedComponentsByRule: Object.keys(affectedOut).length ? affectedOut : undefined,
  };
}

function buildPatternsExport(snapshot: AnalysisSnapshot) {
  const keys = sortedStringKeys(snapshot.patternData.patterns);
  return keys.map((id) => {
    const p = snapshot.patternData.patterns[id]!;
    return {
      id,
      name: p.name,
      meta: p.meta,
    };
  });
}

function stableLifecycleSummary(s: LifecycleSummary): LifecycleSummary {
  return {
    ...s,
    explainedScore: stableExplainedScore(s.explainedScore),
    severityCounts: (s.severityCounts
      ? toSortedRecord(s.severityCounts as Record<string, number>)
      : {}) as LifecycleSummary["severityCounts"],
    confidenceCounts: (s.confidenceCounts
      ? toSortedRecord(s.confidenceCounts as Record<string, number>)
      : {}) as LifecycleSummary["confidenceCounts"],
    hookUsageCounts: (s.hookUsageCounts
      ? toSortedRecord(s.hookUsageCounts as Record<string, number>)
      : {}) as LifecycleSummary["hookUsageCounts"],
  };
}

function stableTemplateSummary(s: TemplateSummary): TemplateSummary {
  return {
    ...s,
    explainedScore: stableExplainedScore(s.explainedScore),
    severityCounts: (s.severityCounts
      ? toSortedRecord(s.severityCounts as Record<string, number>)
      : {}) as TemplateSummary["severityCounts"],
    confidenceCounts: (s.confidenceCounts
      ? toSortedRecord(s.confidenceCounts as Record<string, number>)
      : {}) as TemplateSummary["confidenceCounts"],
  };
}

function stableResponsibilitySummary(s: ResponsibilitySummary): ResponsibilitySummary {
  return {
    ...s,
    explainedScore: stableExplainedScore(s.explainedScore),
    severityCounts: (s.severityCounts
      ? toSortedRecord(s.severityCounts as Record<string, number>)
      : {}) as ResponsibilitySummary["severityCounts"],
    confidenceCounts: (s.confidenceCounts
      ? toSortedRecord(s.confidenceCounts as Record<string, number>)
      : {}) as ResponsibilitySummary["confidenceCounts"],
  };
}

function buildInsights(result: ScanResult) {
  const lifecycle = {
    summary: stableLifecycleSummary(result.lifecycle.summary),
    cleanupStats: result.lifecycle.cleanupStats,
    topRisks: sortByNormalizedPath(result.lifecycle.topRisks, (r) => r.filePath).map(slimLifecycleRow),
    manualReview: sortByNormalizedPath(result.lifecycle.manualReview, (r) => r.filePath).map(slimLifecycleRow),
  };
  const template = {
    summary: stableTemplateSummary(result.template.summary),
    topRisks: sortByNormalizedPath(result.template.topRisks, (r) => r.filePath).map(slimTemplateRow),
  };
  const responsibility = {
    summary: stableResponsibilitySummary(result.responsibility.summary),
    topRisks: sortByNormalizedPath(result.responsibility.topRisks, (r) => r.filePath).map(slimResponsibilityRow),
  };

  const architecture: {
    smellSummary?: ArchitectureSmellSummary;
    smells?: ArchitectureSmell[];
    featurePatterns?: FeaturePattern[];
  } = {};

  if (result.architectureSmellSummary) {
    architecture.smellSummary = { ...result.architectureSmellSummary };
  }
  if (result.architectureSmells?.length) {
    architecture.smells = [...result.architectureSmells]
      .sort((a, b) => strCmp(a.smellType, b.smellType) || strCmp(a.description, b.description))
      .map(exportSmell);
  }
  if (result.featurePatterns?.length) {
    architecture.featurePatterns = [...result.featurePatterns]
      .sort((a, b) => strCmp(a.patternType, b.patternType) || strCmp(a.featureName, b.featureName))
      .map(exportFeaturePattern);
  }

  const insights: Record<string, unknown> = { lifecycle, template, responsibility };
  if (architecture.smellSummary || architecture.smells?.length || architecture.featurePatterns?.length) {
    insights.architecture = architecture;
  }
  return insights;
}

/**
 * Builds the stable, CI-oriented JSON object written by `JsonFormatter`.
 * Does not mutate the snapshot or internal models.
 */
export function buildPublicJsonExport(snapshot: AnalysisSnapshot): Record<string, unknown> {
  const result = snapshot.result;
  const meta = snapshot.meta;

  const diagnosticSource =
    result.diagnosticSummary.componentDiagnostics ?? result.diagnosticSummary.topCrossCuttingRisks;
  const diagnosticDetails = sortByNormalizedPath(diagnosticSource, (d) => d.filePath).map(slimDiagnostic);

  const componentRows = sortedStringKeys(snapshot.componentDetailsMap as Record<string, ComponentDetailEntry>).map(
    (k) => slimComponentRow((snapshot.componentDetailsMap as Record<string, ComponentDetailEntry>)[k]!)
  );

  const refactorTasks = sortRefactorTasks(result.refactorTasks ?? []);

  return {
    schemaVersion: PUBLIC_JSON_SCHEMA_VERSION,
    metadata: {
      runId: meta.runId,
      workspacePath: meta.workspacePath,
      generatedAt: meta.generatedAt,
      snapshotHash: meta.snapshotHash,
      toolVersion: meta.analyzerVersion,
    },
    workspace: {
      summary: { ...result.workspaceSummary },
      breakdownMode: result.breakdownMode,
      projectBreakdown: [...result.projectBreakdown].sort((a, b) => strCmp(a.sourceRoot, b.sourceRoot)),
      otherMinorClusters: result.otherMinorClusters?.length
        ? [...result.otherMinorClusters].sort((a, b) => strCmp(a.sourceRoot, b.sourceRoot))
        : undefined,
    },
    health: {
      riskLevel: result.workspaceSummary.riskLevel,
      scores: stableScores(result.scores),
      componentsBySeverity: {
        critical: result.componentsBySeverity.critical,
        high: result.componentsBySeverity.high,
        warning: result.componentsBySeverity.warning,
      },
    },
    diagnostics: {
      summary: {
        componentsWithDominantIssue: result.diagnosticSummary.componentsWithDominantIssue,
        totalComponents: result.diagnosticSummary.totalComponents,
        dominantIssueCounts: toSortedRecord(result.diagnosticSummary.dominantIssueCounts as Record<string, number>),
        roleCounts: result.diagnosticSummary.roleCounts
          ? toSortedRecord(result.diagnosticSummary.roleCounts as Record<string, number>)
          : undefined,
      },
      details: diagnosticDetails,
    },
    rules: buildRulesExport(result),
    patterns: buildPatternsExport(snapshot),
    structure: exportStructure(result.structureConcerns),
    components: componentRows,
    insights: buildInsights(result),
    recommendedActions: {
      messages: [...result.warningsAndRecommendations],
      refactorTasks: refactorTasks.map((t) => ({
        componentName: t.componentName,
        filePath: t.filePath,
        dominantIssue: t.dominantIssue,
        priority: t.priority,
        effort: t.effort,
        impactScore: t.impactScore,
        suggestedAction: t.suggestedAction,
        whyNow: [...t.whyNow],
      })),
    },
    commonWarnings: [...result.commonWarnings].sort((a, b) => strCmp(a.code, b.code) || a.count - b.count),
  };
}
