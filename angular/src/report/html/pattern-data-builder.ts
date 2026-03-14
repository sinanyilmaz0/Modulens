/**
 * Builds pattern data for the Patterns page. Shared by snapshot creation and HTML report.
 */

import type { ScanResult } from "../../core/scan-result";
import type { ComponentDetailEntry } from "./html-report-presenter";
import { getComponentDetailEntry } from "./html-report-presenter";
import { formatDominantIssue } from "./html-report-presenter";
import { getTranslations } from "./i18n/translations";
import { renderPatternDrawerContent } from "./templates";
import { getProjectForPath } from "../report-view-model";
import { inferFeatureFromPath, formatAreaLabelForDisplay } from "./feature-extraction";
import { buildPatternDiagnosis } from "../../diagnostic/workspace-diagnosis";

const EXTRACTION_TYPE_BY_PATTERN: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "template-decomposition",
  GOD_COMPONENT: "component-split",
  CLEANUP_RISK_COMPONENT: "lifecycle-cleanup",
  ORCHESTRATION_HEAVY_COMPONENT: "service-extraction",
  LIFECYCLE_RISKY_COMPONENT: "lifecycle-cleanup",
};

const ARCHITECTURAL_PAYOFF_BY_PATTERN: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Lower template complexity, clearer ownership, better change detection.",
  GOD_COMPONENT: "Single responsibility, easier testing, reduced coupling.",
  CLEANUP_RISK_COMPONENT: "No memory leaks, predictable teardown, safer route changes.",
  ORCHESTRATION_HEAVY_COMPONENT: "Thinner components, testable services, clearer separation.",
  LIFECYCLE_RISKY_COMPONENT: "Safer subscriptions, predictable cleanup, fewer runtime surprises.",
};

export interface PatternMeta {
  impactLevel: "low" | "medium" | "high";
  count: number;
  /** @deprecated Use mostAffectedAreaForPattern */
  topArea?: string;
  /** Area with most components for this pattern (pattern-level scope) */
  mostAffectedAreaForPattern?: string;
  firstAction?: string;
}

export interface PatternData {
  patterns: Record<string, { name: string; drawerHtml: string; meta?: PatternMeta }>;
}

const PATTERN_ISSUE_KEYS = [
  "TEMPLATE_HEAVY_COMPONENT",
  "GOD_COMPONENT",
  "CLEANUP_RISK_COMPONENT",
  "ORCHESTRATION_HEAVY_COMPONENT",
  "LIFECYCLE_RISKY_COMPONENT",
] as const;

export function buildPatternData(
  result: ScanResult,
  componentDetailsMap: Record<string, ComponentDetailEntry>,
  formatIssue: (issue: string | null) => string = formatDominantIssue
): PatternData {
  const t = getTranslations();
  const diagnostics = result.diagnosticSummary.componentDiagnostics ?? result.diagnosticSummary.topCrossCuttingRisks;
  const dc = result.diagnosticSummary.dominantIssueCounts;
  const totalComponents = result.diagnosticSummary.totalComponents;
  const patternExplanations = (t.patternExplanations ?? {}) as Record<
    string,
    { meaning: string; whyItMatters: string; refactorStrategy: string }
  >;

  const patterns: Record<string, { name: string; drawerHtml: string; meta?: PatternMeta }> = {};

  for (const key of PATTERN_ISSUE_KEYS) {
    const count = dc[key] ?? 0;
    if (count === 0) continue;

    const matchingDiagnostics = diagnostics.filter((d) => d.dominantIssue === key);
    const severityOrder = (s: string | undefined) => (s === "CRITICAL" ? 0 : s === "HIGH" ? 1 : s === "WARNING" ? 2 : 3);
    const componentsRaw = matchingDiagnostics.map((d) => {
      const entry = getComponentDetailEntry(componentDetailsMap, d.filePath);
      const evidence: Record<string, number | undefined> = {};
      const fromEvidence = (k: string) => d.evidence?.find((e) => e.key === k)?.value;
      evidence.templateLines = (entry?.template?.lineCount ?? (fromEvidence("templateLineCount") as number | undefined)) ?? undefined;
      evidence.eventBindings = (entry?.template?.eventBindingCount ?? (fromEvidence("eventBindingCount") as number | undefined)) ?? undefined;
      evidence.structuralDirectives =
        (fromEvidence("structuralDirectiveCount") as number | undefined) ??
        (entry?.template?.structuralDepth ?? (fromEvidence("structuralDepth") as number | undefined)) ??
        undefined;
      evidence.dependencyCount = entry?.dependencyCount ?? undefined;
      evidence.lineCount = entry?.lineCount ?? undefined;
      evidence.subscribeCount = entry?.lifecycle?.subscribeCount ?? undefined;
      evidence.riskySubscribeCount = entry?.lifecycle?.riskySubscribeCount ?? undefined;
      evidence.addEventListenerCount = entry?.lifecycle?.addEventListenerCount ?? undefined;
      evidence.serviceOrchestrationCount = entry?.responsibility?.serviceOrchestrationCount ?? undefined;
      evidence.methodCount = entry?.methodCount ?? entry?.responsibility?.methodCount ?? undefined;
      evidence.propertyCount = entry?.propertyCount ?? entry?.responsibility?.propertyCount ?? undefined;
      return {
        filePath: d.filePath,
        className: d.className ?? entry?.className,
        fileName: d.fileName,
        evidence,
        highestSeverity: entry?.highestSeverity,
        lineCount: entry?.lineCount ?? 0,
        dependencyCount: entry?.dependencyCount ?? 0,
      };
    });
    const components = componentsRaw
      .sort((a, b) => {
        const sevA = severityOrder(a.highestSeverity);
        const sevB = severityOrder(b.highestSeverity);
        if (sevA !== sevB) return sevA - sevB;
        if ((b.lineCount ?? 0) !== (a.lineCount ?? 0)) return (b.lineCount ?? 0) - (a.lineCount ?? 0);
        return (b.dependencyCount ?? 0) - (a.dependencyCount ?? 0);
      })
      .map(({ filePath, className, fileName, evidence }) => ({ filePath, className, fileName, evidence }));

    const diag = matchingDiagnostics[0];
    const expl = patternExplanations[key] ?? {
      meaning: "",
      whyItMatters: "",
      refactorStrategy: diag?.refactorDirection ?? "",
    };
    const refactorStrategy = expl.refactorStrategy || (diag?.refactorDirection ?? "");

    const patternPaths = new Set(components.map((c) => c.filePath.replace(/\\/g, "/")));
    const relatedStructureConcerns: string[] = [];
    for (const c of result.structureConcerns?.concerns ?? []) {
      const overlap = c.affectedPaths.some((p) => patternPaths.has(p.replace(/\\/g, "/")));
      if (overlap) relatedStructureConcerns.push(c.concernType);
    }

    const patternDiagForDrawer = buildPatternDiagnosis(
      key,
      matchingDiagnostics,
      result.projectBreakdown,
      refactorStrategy,
      formatIssue
    );

    const drawerHtml = renderPatternDrawerContent({
      patternName: formatIssue(key),
      patternKey: key,
      meaning: expl.meaning,
      whyItMatters: expl.whyItMatters,
      refactorStrategy,
      components,
      t,
      affectedArea: patternDiagForDrawer.mostAffectedAreaForPattern ?? undefined,
      extractionType: EXTRACTION_TYPE_BY_PATTERN[key] ?? "component-split",
      architecturalPayoff: ARCHITECTURAL_PAYOFF_BY_PATTERN[key] ?? "Clearer ownership and maintainability.",
      relatedStructureConcerns: relatedStructureConcerns.length > 0 ? relatedStructureConcerns : undefined,
    });

    const topArea = patternDiagForDrawer.mostAffectedAreaForPattern || undefined;
    const firstAction = patternDiagForDrawer.firstAction;
    const pct = totalComponents > 0 ? (count / totalComponents) * 100 : 0;
    const impactLevel = pct <= 5 ? "low" : pct <= 15 ? "medium" : "high";

    patterns[key] = {
      name: formatIssue(key),
      drawerHtml,
      meta: {
        impactLevel,
        count,
        topArea,
        mostAffectedAreaForPattern: patternDiagForDrawer.mostAffectedAreaForPattern,
        firstAction,
      },
    };
  }

  return { patterns };
}
