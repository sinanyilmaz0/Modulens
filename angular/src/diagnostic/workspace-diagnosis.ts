/**
 * Central diagnosis model for workspace-level and pattern-level reporting.
 * Provides a single source of truth for: primary symptom, root cause,
 * most affected area, first action, and expected impact.
 */

import type { ScanResult, BreakdownMode, ProjectBreakdownItem } from "../core/scan-result";
import type { DominantIssueType } from "./diagnostic-models";
import type { ComponentDiagnostic } from "./diagnostic-models";
import { getProjectForPath } from "../report/report-view-model";
import { inferFeatureFromPath } from "../report/html/feature-extraction";
import { formatAreaLabelForDisplay } from "../report/html/feature-extraction";
import { getTranslations } from "../report/html/i18n/translations";

export type PriorityLens = "template" | "component" | "responsibility" | "lifecycle";
export type ScopeLabel = "project" | "feature-area" | "workspace";

export interface WorkspaceDiagnosis {
  /** En baskın kullanıcı-visible problem (örn: "Template Too Complex") */
  primarySymptom: string;
  /** Altta yatan esas neden (örn: "Large templates, complex bindings") */
  rootCause: string;
  /** En yoğun problem görülen proje/alan */
  mostAffectedProject: string;
  /** İlk refactor adımı */
  firstAction: string;
  /** Beklenen etki */
  expectedImpact: string;
  /** Dominant issue key for primary symptom */
  symptomLens: DominantIssueType | null;
  /** Hangi skor dimension'ının en düşük olduğu */
  priorityLens: PriorityLens;
  /** breakdown mode'a göre scope */
  scopeLabel: ScopeLabel;
  /** Components with dominant issue count */
  componentsWithDominantIssue: number;
  /** Total components */
  totalComponents: number;
  /** Chip entries: [{key, count}] for overview hero */
  chipEntries: Array<{ key: DominantIssueType; count: number }>;
}

export interface PatternDiagnosis {
  patternKey: string;
  /** Bu pattern için en yoğun alan */
  mostAffectedAreaForPattern: string;
  firstAction: string;
  scopeLabel: string;
}

const ISSUE_ORDER: DominantIssueType[] = [
  "TEMPLATE_HEAVY_COMPONENT",
  "GOD_COMPONENT",
  "CLEANUP_RISK_COMPONENT",
  "ORCHESTRATION_HEAVY_COMPONENT",
  "LIFECYCLE_RISKY_COMPONENT",
];

const REFACTOR_FIRST_STEP: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Extract template sections into focused child views",
  GOD_COMPONENT: "Split presentation and orchestration",
  CLEANUP_RISK_COMPONENT: "Add ngOnDestroy cleanup",
  ORCHESTRATION_HEAVY_COMPONENT: "Split into thin container and presentation components",
  LIFECYCLE_RISKY_COMPONENT: "Move heavy logic out of lifecycle hooks",
};

function totalFindings(p: ProjectBreakdownItem): number {
  return (
    (p.componentFindings ?? p.componentsWithFindings ?? 0) +
    (p.templateFindings ?? 0) +
    (p.responsibilityFindings ?? 0) +
    (p.lifecycleFindings ?? 0)
  );
}

function pickPrimarySymptomKey(
  dc: Record<DominantIssueType, number>,
  scores: ScanResult["scores"]
): DominantIssueType | null {
  const entries = ISSUE_ORDER.map((key) => ({ key, count: dc[key] ?? 0 })).filter((e) => e.count > 0);
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const ties = sorted.filter((e) => e.count === top!.count);
  if (ties.length === 1) return top!.key;
  // Tie-break by lowest score dimension
  const scoreOrder: Array<{ key: DominantIssueType; score: number }> = ties.map((e) => ({
    key: e.key,
    score:
      e.key === "TEMPLATE_HEAVY_COMPONENT"
        ? scores.template.score
        : e.key === "GOD_COMPONENT" || e.key === "ORCHESTRATION_HEAVY_COMPONENT"
          ? scores.responsibility.score
          : e.key === "CLEANUP_RISK_COMPONENT" || e.key === "LIFECYCLE_RISKY_COMPONENT"
            ? scores.lifecycle.score
            : scores.component.score,
  }));
  scoreOrder.sort((a, b) => a.score - b.score);
  return scoreOrder[0]!.key;
}

function pickPriorityLens(scores: ScanResult["scores"]): PriorityLens {
  const t = scores.template.score;
  const c = scores.component.score;
  const r = scores.responsibility.score;
  const l = scores.lifecycle.score;
  const min = Math.min(t, c, r, l);
  if (t === min) return "template";
  if (c === min) return "component";
  if (r === min) return "responsibility";
  return "lifecycle";
}

function getScopeLabel(breakdownMode?: BreakdownMode): ScopeLabel {
  if (breakdownMode === "project") return "project";
  if (breakdownMode === "feature-area") return "feature-area";
  return "workspace";
}

/**
 * Build workspace-level diagnosis from scan result.
 */
export function buildWorkspaceDiagnosis(
  result: ScanResult,
  formatIssue: (issue: string | null) => string
): WorkspaceDiagnosis {
  const t = getTranslations();
  const dc = result.diagnosticSummary.dominantIssueCounts;
  const projectBreakdown = result.projectBreakdown;
  const breakdownMode = result.breakdownMode;

  const symptomKey = pickPrimarySymptomKey(dc, result.scores);
  const primarySymptom = symptomKey ? formatIssue(symptomKey) : "Multiple quality concerns";
  let rootCause = symptomKey
    ? ((t.overview.issueExplanation as Record<string, string>)[symptomKey] ?? "Multiple dimensions need attention").split(".")[0]?.trim() ?? "Quality dimensions need attention"
    : "Multiple dimensions need attention";
  if (rootCause.length > 120) rootCause = rootCause.slice(0, 117) + "...";

  const worstProject = projectBreakdown
    .filter((p) => {
      const label = p.sourceRoot.toLowerCase();
      const isOther = label === "other" || label === "unclassified";
      return totalFindings(p) > 0 && !isOther;
    })
    .reduce(
      (best, p) => {
        const total = totalFindings(p);
        return total > (best?.total ?? 0) ? { ...p, total } : best;
      },
      null as (ProjectBreakdownItem & { total: number }) | null
    );

  const rawMostAffected = worstProject
    ? worstProject.sourceRoot
        .replace(/^projects\//, "")
        .replace(/^libs\//, "")
        .replace(/^apps\//, "")
        .replace(/\/src$/, "")
    : null;
  const mostAffectedProject = rawMostAffected
    ? formatAreaLabelForDisplay(rawMostAffected) ?? rawMostAffected
    : (t.overview.noDominantArea ?? "Workspace-wide");

  let firstAction = "";
  const top = result.diagnosticSummary.topCrossCuttingRisks[0];
  const wf = result.refactorPlan?.whatToFixFirst?.[0];
  const refactorTask = result.refactorTasks?.[0];
  if (refactorTask?.suggestedAction) {
    firstAction = refactorTask.suggestedAction;
  } else if (wf && "description" in wf) {
    firstAction = (wf as { description?: string }).description ?? "";
  } else if (top?.refactorDirection) {
    firstAction = top.refactorDirection.split(/[;.]/)[0]?.trim() ?? top.refactorDirection;
  }
  if (!firstAction && symptomKey) {
    firstAction = REFACTOR_FIRST_STEP[symptomKey] ?? "Address top critical components.";
  }
  if (!firstAction) {
    firstAction = (t.overview.recommendationPrefix ?? "Start with") + " address top critical components.";
  }
  const firstActionTruncated = firstAction.length > 100 ? firstAction.slice(0, 97) + "..." : firstAction;

  const expectedImpact = (t.overview as { expectedImpactValue?: string }).expectedImpactValue ?? "Lower warning density and easier maintenance.";

  const chipEntries = ISSUE_ORDER.map((key) => ({ key, count: dc[key] ?? 0 })).filter((e) => e.count > 0);

  return {
    primarySymptom,
    rootCause,
    mostAffectedProject,
    firstAction: firstActionTruncated,
    expectedImpact,
    symptomLens: symptomKey,
    priorityLens: pickPriorityLens(result.scores),
    scopeLabel: getScopeLabel(breakdownMode),
    componentsWithDominantIssue: result.diagnosticSummary.componentsWithDominantIssue,
    totalComponents: result.diagnosticSummary.totalComponents,
    chipEntries,
  };
}

/**
 * Build pattern-level diagnosis.
 */
export function buildPatternDiagnosis(
  patternKey: string,
  diagnostics: ComponentDiagnostic[],
  projectBreakdown: ProjectBreakdownItem[],
  refactorStrategy: string,
  formatIssue: (issue: string | null) => string
): PatternDiagnosis {
  const areaCounts = new Map<string, number>();
  for (const d of diagnostics) {
    const area = getProjectForPath(d.filePath, projectBreakdown) ?? inferFeatureFromPath(d.filePath) ?? "other";
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }
  const rawTopArea = Array.from(areaCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostAffectedAreaForPattern = rawTopArea ? (formatAreaLabelForDisplay(rawTopArea) ?? rawTopArea) : "Workspace-wide";
  const firstAction = refactorStrategy.split(/[;.]/)[0]?.trim() ?? refactorStrategy;
  return {
    patternKey,
    mostAffectedAreaForPattern,
    firstAction,
    scopeLabel: "workspace",
  };
}

/** Minimal project breakdown shape for legacy adapter */
interface LegacyProjectBreakdownItem {
  sourceRoot: string;
  components?: number;
  componentsWithFindings?: number;
  componentFindings?: number;
  templateFindings?: number;
  responsibilityFindings?: number;
  lifecycleFindings?: number;
}

/** Build diagnosis from legacy template params (for deprecated renderExecutiveHero). */
export function buildWorkspaceDiagnosisFromLegacy(
  scores: ScanResult["scores"],
  diagnosticSummary: { componentsWithDominantIssue: number; totalComponents: number; dominantIssueCounts: Record<DominantIssueType, number> },
  projectBreakdown: LegacyProjectBreakdownItem[],
  firstActionText: string,
  formatIssue: (issue: string | null) => string,
  breakdownMode?: BreakdownMode
): WorkspaceDiagnosis {
  const t = getTranslations();
  const dc = diagnosticSummary.dominantIssueCounts;
  const symptomKey = pickPrimarySymptomKey(dc, scores);
  const primarySymptom = symptomKey ? formatIssue(symptomKey) : "Multiple quality concerns";
  let rootCause = symptomKey
    ? ((t.overview.issueExplanation as Record<string, string>)[symptomKey] ?? "Multiple dimensions need attention").split(".")[0]?.trim() ?? "Quality dimensions need attention"
    : "Multiple dimensions need attention";
  if (rootCause.length > 120) rootCause = rootCause.slice(0, 117) + "...";

  const legacyTotal = (p: LegacyProjectBreakdownItem) =>
    (p.componentFindings ?? p.componentsWithFindings ?? 0) +
    (p.templateFindings ?? 0) +
    (p.responsibilityFindings ?? 0) +
    (p.lifecycleFindings ?? 0);
  const worstProject = projectBreakdown
    .filter((p) => {
      const label = p.sourceRoot.toLowerCase();
      const isOther = label === "other" || label === "unclassified";
      return legacyTotal(p) > 0 && !isOther;
    })
    .reduce(
      (best, p) => {
        const total = legacyTotal(p);
        return total > (best?.total ?? 0) ? { ...p, total } : best;
      },
      null as (LegacyProjectBreakdownItem & { total: number }) | null
    );
  const rawMostAffected = worstProject
    ? worstProject.sourceRoot.replace(/^projects\//, "").replace(/^libs\//, "").replace(/^apps\//, "").replace(/\/src$/, "")
    : null;
  const mostAffectedProject = rawMostAffected
    ? formatAreaLabelForDisplay(rawMostAffected) ?? rawMostAffected
    : (t.overview.noDominantArea ?? "Workspace-wide");

  let firstAction = firstActionText;
  if (!firstAction && symptomKey) firstAction = REFACTOR_FIRST_STEP[symptomKey] ?? "Address top critical components.";
  if (!firstAction) firstAction = (t.overview.recommendationPrefix ?? "Start with") + " address top critical components.";
  const firstActionTruncated = firstAction.length > 100 ? firstAction.slice(0, 97) + "..." : firstAction;

  const chipEntries = ISSUE_ORDER.map((key) => ({ key, count: dc[key] ?? 0 })).filter((e) => e.count > 0);
  return {
    primarySymptom,
    rootCause,
    mostAffectedProject,
    firstAction: firstActionTruncated,
    expectedImpact: (t.overview as { expectedImpactValue?: string }).expectedImpactValue ?? "Lower warning density and easier maintenance.",
    symptomLens: symptomKey,
    priorityLens: pickPriorityLens(scores),
    scopeLabel: getScopeLabel(breakdownMode),
    componentsWithDominantIssue: diagnosticSummary.componentsWithDominantIssue,
    totalComponents: diagnosticSummary.totalComponents,
    chipEntries,
  };
}

export interface FormatDiagnosisCopyOptions {
  /** Summary format: short one-liner for hero */
  format: "summary" | "full" | "chips" | "recommendation";
  recommendationPrefix?: string;
  worstProjectName?: string;
  secondSymptom?: string;
}

/**
 * Format diagnosis for UI copy.
 */
export function formatDiagnosisCopy(
  diagnosis: WorkspaceDiagnosis,
  formatIssue: (issue: string | null) => string,
  opts: FormatDiagnosisCopyOptions
): string {
  const { format } = opts;
  const t = getTranslations();
  const prefix = opts.recommendationPrefix ?? t.overview.recommendationPrefix ?? "Start with";

  if (format === "summary") {
    const symptom = diagnosis.symptomLens ? formatIssue(diagnosis.symptomLens).toLowerCase() : "quality concerns";
    return `${diagnosis.componentsWithDominantIssue} components with dominant issue. Primary: ${diagnosis.primarySymptom}.`;
  }

  if (format === "recommendation") {
    const topKey = diagnosis.chipEntries[0]?.key;
    const secondKey = diagnosis.chipEntries[1]?.key;
    const worstName = opts.worstProjectName ?? "";
    if (topKey && worstName) {
      const second = secondKey ? `, then ${formatIssue(secondKey).toLowerCase()}` : "";
      return `${prefix} ${formatIssue(topKey).toLowerCase()} in ${worstName}${second}.`;
    }
    if (topKey) {
      return `${prefix} ${formatIssue(topKey).toLowerCase()} components.`;
    }
    return "";
  }

  if (format === "chips") {
    return diagnosis.chipEntries
      .slice(0, 3)
      .map((e) => `${e.count} ${formatIssue(e.key).toLowerCase()}`)
      .join("; ");
  }

  return diagnosis.primarySymptom;
}
