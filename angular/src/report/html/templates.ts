/**
 * Pure template functions for HTML report sections.
 * No inline string concatenation; structured render functions.
 */

import type { BreakdownMode, ExplainedScore, Scores } from "../../core/scan-result";
import type { StructureConcern } from "../../core/structure-models";
import type { Translations } from "./i18n/translations";
import type { RuleMetadata, RuleImpactCategory } from "../../rules/rule-registry";
import {
  getConfidenceBucket,
  getConfidenceBucketFromCategorical,
  getConfidenceDisplayLabel,
  getRoleDisplayWithConfidence,
} from "../../confidence/confidence-labels";
import {
  getConfidenceAwareCopy,
  getExtractionHeaderCopy,
  getRefactorHeaderCopy,
} from "../../confidence/confidence-copy";
import { getProjectForPath } from "../report-view-model";
import { inferFeatureFromPath, formatAreaLabelForDisplay } from "./feature-extraction";
import {
  getComponentDetailEntry,
  getDominantIssueExplanation,
  isNoDominantIssue,
  normalizeSeverityCode,
  severityCodeToClass,
  type CanonicalSeverityCode,
} from "./html-report-presenter";
import type { ConfidenceBreakdown } from "../../confidence/confidence-models";
import { getBreakdownNouns, formatWorstBucketFinding } from "./breakdown-labels";
import { ensureNoUnresolvedTokens, formatTemplate } from "./format-template";
import { normalizeTextList } from "./section-normalization";
import { formatDiagnosisCopy, buildWorkspaceDiagnosisFromLegacy, type WorkspaceDiagnosis } from "../../diagnostic/workspace-diagnosis";

/** User-friendly display labels for heuristic signal IDs (replaces raw technical names) */
export const SIGNAL_DISPLAY_LABELS: Record<string, string> = {
  "file-name-pattern": "Inferred from naming",
  "router-outlet": "Template contains router outlet",
  "form-group-ngform": "Form structure detected",
  "video-audio-element": "Media elements present",
  "ngfor-list": "List-like template structure",
  "activated-route": "Uses route parameters",
  "form-builder": "Form builder usage",
  "media-player-service": "Media/player service usage",
  "many-dependencies": "High dependency usage",
  "router-usage": "Route-driven behavior detected",
  "form-group-count": "Multiple form groups",
  "service-orchestration": "High service orchestration",
  "ui-state-fields": "Multiple UI state fields",
  "orchestration-heavy": "Orchestration-heavy diagnostic",
  "template-heavy-ngfor": "Template-heavy with list",
  "mat-dialog-modal": "Dialog/modal usage",
  "modal-drawer-usage": "Modal or drawer usage",
  "heuristic_count_3+": "Multiple decomposition heuristics",
  "heuristic_count_2": "Two decomposition heuristics",
  "heuristic_count_1": "One decomposition heuristic",
  "dominant_issue_match": "Dominant issue aligns with target",
  "role_heuristic_match": "Role aligns with heuristic type",
  "line_count_1000+": "Component exceeds 1000 lines",
  "source_suffix": "Shared name suffix",
  "source_directory": "Shared directory",
  "source_prefix": "Shared name prefix",
  "source_role": "Shared component role",
  "common_signals_1": "1+ common signals",
  "common_signals_2": "2+ common signals",
  "common_signals_3": "3+ common signals",
  "common_signals_4": "4+ common signals",
  "common_signals_5": "5+ common signals",
  "dominant_issues_2+": "2+ shared dominant issues",
  "dominant_issues_1": "1 shared dominant issue",
  "line_count_consistency": "Similar line counts",
};

function getSignalDisplayLabel(signal: string, note: string): string {
  return SIGNAL_DISPLAY_LABELS[signal] ?? note ?? (signal || "").replace(/-/g, " ").replace(/_/g, " ");
}

function renderConfidenceBadge(
  score: number,
  breakdown?: ConfidenceBreakdown,
  t?: { confidenceLabels?: Record<string, string>; confidenceTooltips?: Record<string, string>; confidenceHelpText?: string }
): string {
  const pct = Math.round(score * 100);
  const bucket = getConfidenceBucket(score);
  const displayLabel = getConfidenceDisplayLabel(bucket, t?.confidenceLabels);
  const tooltip = t?.confidenceTooltips?.[bucket] ?? t?.confidenceHelpText ?? "";
  const titleAttr = tooltip ? ` title="${escapeHtml(tooltip)}"` : "";
  let html = `<span class="confidence-badge confidence-${bucket}"${titleAttr}>${escapeHtml(displayLabel)} (${pct}%)</span>`;
  if (breakdown?.contributingSignals?.length) {
    const matchedSignals = breakdown.contributingSignals.filter((s) => s.matched);
    if (matchedSignals.length >= 2) {
      const signalsHtml = matchedSignals
        .map(
          (s) =>
            `<li class="contributing-signal matched"><span class="signal-name">${escapeHtml(getSignalDisplayLabel(s.signal || "", s.note || ""))}</span>${s.note ? `: ${escapeHtml(s.note)}` : ""}</li>`
        )
        .join("");
      html += `<details class="confidence-breakdown"><summary>Supporting signals</summary><p class="confidence-breakdown-intro">These signals influenced the role/confidence score.</p><ul class="contributing-signals">${signalsHtml}</ul></details>`;
    }
  }
  return html;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ICON_INFO = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4v1"/></svg>`;

export function renderInfoTooltip(explanation: string): string {
  const safe = escapeHtml(explanation);
  return `<span class="info-tooltip" title="${safe}" aria-label="${safe}">${ICON_INFO}</span>`;
}

/** Reusable section header: title + optional helper + optional tooltip in title */
export function renderSectionHeader(
  title: string,
  options?: { helper?: string; titleHtml?: string }
): string {
  const titleEl = options?.titleHtml ?? escapeHtml(title);
  const helperHtml = options?.helper ? `<p class="section-helper text-muted">${escapeHtml(options.helper)}</p>` : "";
  return `<h2 class="page-section-title section-title-caps">${titleEl}</h2>${helperHtml}`;
}

const ICON_OVERVIEW = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>`;
const ICON_COMPONENTS = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h8"/></svg>`;
const ICON_PATTERNS = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="4" height="4"/><rect x="10" y="2" width="4" height="4"/><rect x="2" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><path d="M6 4h4M6 12h4M4 6v4M12 6v4"/></svg>`;
const ICON_PLANNER = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12v9H2z"/><path d="M2 6h12M5 2v4M11 2v4"/></svg>`;
const ICON_RULES = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h12v10H2z"/><path d="M5 6h6M5 8h6M5 10h4"/></svg>`;
const ICON_STRUCTURE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h4v4H2z"/><path d="M10 3h4v4h-4z"/><path d="M2 9h4v4H2z"/><path d="M10 9h4v4h-4z"/><path d="M6 2v2M6 12v2M6 6v4M2 6h2M12 6h2M2 10h2M12 10h2"/></svg>`;

export function renderSidebar(t: Translations): string {
  const navGroupLabel = t.nav.groupAnalysis ?? "Analysis";
  const refGroupLabel = t.nav.groupReference ?? "Reference";
  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="sidebar-brand-title">Modulens</span>
        <span class="sidebar-brand-subtitle">Architecture Intelligence</span>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-nav-group">
          <span class="sidebar-nav-group-label">${escapeHtml(navGroupLabel)}</span>
          <a href="#overview" data-page="overview" class="nav-link"><span class="nav-icon">${ICON_OVERVIEW}</span><span class="nav-label" data-i18n="nav.overview">${escapeHtml(t.nav.overview)}</span></a>
          <a href="#components" data-page="components" class="nav-link"><span class="nav-icon">${ICON_COMPONENTS}</span><span class="nav-label" data-i18n="nav.components">${escapeHtml(t.nav.components)}</span></a>
          <a href="#patterns" data-page="patterns" class="nav-link"><span class="nav-icon">${ICON_PATTERNS}</span><span class="nav-label" data-i18n="nav.patterns">${escapeHtml(t.nav.patterns)}</span></a>
          <a href="#structure" data-page="structure" class="nav-link"><span class="nav-icon">${ICON_STRUCTURE}</span><span class="nav-label" data-i18n="nav.structure">${escapeHtml(t.nav.structure)}</span></a>
          <a href="#planner" data-page="planner" class="nav-link"><span class="nav-icon">${ICON_PLANNER}</span><span class="nav-label" data-i18n="nav.refactorPlan">${escapeHtml(t.nav.refactorPlan)}</span></a>
        </div>
        <div class="sidebar-nav-group sidebar-nav-group-reference">
          <span class="sidebar-nav-group-label">${escapeHtml(refGroupLabel)}</span>
          <a href="#rules" data-page="rules" class="nav-link nav-link-reference"><span class="nav-icon">${ICON_RULES}</span><span class="nav-label" data-i18n="nav.rules">${escapeHtml(t.nav.rules)}</span></a>
        </div>
      </nav>
    </aside>`;
}

export function renderTopBar(
  t: Translations,
  workspacePath: string,
  generatedDate: string,
  riskLevel: string,
  riskBadgeClass: string
): string {
  return `
    <div class="top-bar">
      <div class="top-bar-left">
        <h1 class="page-title" id="page-title">${escapeHtml(t.overview.reportTitle)}</h1>
        <span class="workspace-meta">${escapeHtml(workspacePath)}</span>
        <span class="workspace-meta">${escapeHtml(generatedDate)}</span>
        <span class="risk-badge ${riskBadgeClass}">${escapeHtml(riskLevel)} Risk</span>
      </div>
      <div class="top-actions">
        <button type="button" class="export-btn" id="export-report-btn" data-i18n="actions.exportReport">${escapeHtml(t.actions.exportReport)}</button>
      </div>
    </div>`;
}

export function renderWorkspaceHealthHero(
  scores: Scores,
  workspaceSummary: { riskLevel: string; componentCount: number; totalFindings: number },
  hotspotCount: number,
  t: Translations
): string {
  const score = scores.overall;
  const riskLevel = workspaceSummary.riskLevel;
  const riskBadgeClass = riskLevel.toLowerCase() === "critical" ? "critical" : riskLevel.toLowerCase() === "high" ? "high" : "medium";
  const pct = Math.round((score / 10) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (pct / 100) * circumference;

  const metrics = [
    { value: workspaceSummary.componentCount, label: t.hero.components },
    { value: workspaceSummary.totalFindings, label: t.hero.warnings },
    { value: hotspotCount, label: t.hero.hotspots },
    { value: scores.template.score.toFixed(1), label: t.hero.templateIndex },
  ];

  const metricPills = metrics
    .map(
      (m) => `
    <div class="hero-metric-pill">
      <span class="hero-metric-value">${escapeHtml(String(m.value))}</span>
      <span class="hero-metric-label">${escapeHtml(m.label)}</span>
    </div>`
    )
    .join("");

  return `
    <div class="workspace-health-hero">
      <h2 class="hero-title section-title-caps">${escapeHtml(t.hero.workspaceHealth)}</h2>
      <div class="hero-score-block">
        <div class="hero-score-ring">
          <svg viewBox="0 0 100 100" class="hero-ring-svg">
            <circle class="hero-ring-bg" cx="50" cy="50" r="45"/>
            <circle class="hero-ring-fill" cx="50" cy="50" r="45" stroke-dasharray="${strokeDash} ${circumference}"/>
          </svg>
          <span class="hero-score-value">${score.toFixed(1)}<span class="hero-score-max">/10</span></span>
        </div>
        <span class="risk-badge ${riskBadgeClass} hero-risk-badge">${escapeHtml(riskLevel)} Risk</span>
      </div>
      <div class="hero-metrics">${metricPills}</div>
    </div>`;
}

function renderMainDiagnosisBlock(
  diagnosis: WorkspaceDiagnosis,
  t: Translations
): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const primarySymptomLabel = ov.primarySymptom ?? ov.primaryRisk ?? "Primary symptom";
  const mostAffectedLabel = ov.mostAffectedProject ?? ov.mostAffectedArea ?? "Most affected project";
  const rootCauseLabel = ov.rootCause ?? ov.mainReason ?? "Root cause";
  const firstActionLabel = ov.firstAction ?? "First action";
  const expectedImpactLabel = ov.expectedImpact ?? "Expected impact";

  return `
    <div class="main-diagnosis-block">
      <div class="main-diagnosis-title">${escapeHtml(ov.mainDiagnosis ?? "Main Diagnosis")}</div>
      <dl class="main-diagnosis-list">
        <dt>${escapeHtml(primarySymptomLabel)}</dt>
        <dd>${escapeHtml(diagnosis.primarySymptom)}</dd>
        <dt>${escapeHtml(mostAffectedLabel)}</dt>
        <dd>${escapeHtml(diagnosis.mostAffectedProject)}</dd>
        <dt>${escapeHtml(rootCauseLabel)}</dt>
        <dd>${escapeHtml(diagnosis.rootCause)}</dd>
        <dt>${escapeHtml(firstActionLabel)}</dt>
        <dd>${escapeHtml(diagnosis.firstAction)}</dd>
        <dt>${escapeHtml(expectedImpactLabel)}</dt>
        <dd>${escapeHtml(diagnosis.expectedImpact)}</dd>
      </dl>
    </div>`;
}

export function renderOverviewHero(
  scores: Scores,
  workspaceSummary: { riskLevel: string; componentCount: number; totalFindings: number },
  diagnosis: WorkspaceDiagnosis,
  projectBreakdown: Array<{ sourceRoot: string; components?: number; templateFindings: number; responsibilityFindings: number; componentsWithFindings: number; componentFindings?: number; lifecycleFindings?: number }>,
  formatIssue: (issue: string | null) => string,
  t: Translations,
  breakdownMode?: BreakdownMode
): string {
  const score = scores.overall;
  const riskLevel = workspaceSummary.riskLevel;
  const riskBadgeClass = riskLevel.toLowerCase() === "critical" ? "critical" : riskLevel.toLowerCase() === "high" ? "high" : "medium";
  const pct = Math.round((score / 10) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (pct / 100) * circumference;

  const summaryText = formatDiagnosisCopy(diagnosis, formatIssue, { format: "summary" });

  const chips = diagnosis.chipEntries
    .slice(0, 3)
    .map((e) => `<span class="overview-hero-chip">${e.count} ${formatIssue(e.key).toLowerCase()}</span>`)
    .join("");

  const coveragePct = diagnosis.totalComponents > 0
    ? Math.round((diagnosis.componentsWithDominantIssue / diagnosis.totalComponents) * 100)
    : 0;
  const topIssueKey = diagnosis.chipEntries[0]?.key;
  const dominantIssueLabel = topIssueKey ? formatIssue(topIssueKey).toLowerCase() : "";
  const totalFindings = (p: typeof projectBreakdown[0]) =>
    (p.componentFindings ?? p.componentsWithFindings ?? 0) + (p.templateFindings ?? 0) + (p.responsibilityFindings ?? 0) + (p.lifecycleFindings ?? 0);
  const worstProject = projectBreakdown
    .filter((p) => {
      const total = totalFindings(p);
      const label = p.sourceRoot.toLowerCase();
      const isOther = label === "other" || label === "unclassified";
      return total > 0 && !isOther;
    })
    .reduce(
      (best, p) => {
        const total = totalFindings(p);
        return total > (best?.total ?? 0) ? { ...p, total } : best;
      },
      null as { sourceRoot: string; total: number; components?: number } | null
    );
  const worstName = worstProject
    ? worstProject.sourceRoot
        .replace(/^projects\//, "")
        .replace(/^libs\//, "")
        .replace(/^apps\//, "")
        .replace(/\/src$/, "")
    : "";
  const recommendation = formatDiagnosisCopy(diagnosis, formatIssue, {
    format: "recommendation",
    worstProjectName: worstName,
  });

  const keyFindings: string[] = [];
  if (diagnosis.totalComponents > 0) {
    keyFindings.push(
      formatTemplate(
        t.overview.keyFindingCoverage,
        { pct: coveragePct, total: diagnosis.totalComponents },
        {
          fallback: `${coveragePct}% of components have a clear dominant issue`,
          context: "overview.keyFindingCoverage",
        }
      )
    );
  }
  if (dominantIssueLabel) {
    keyFindings.push(
      formatTemplate(
        t.overview.keyFindingDominant,
        { issue: dominantIssueLabel },
        {
          fallback: `${dominantIssueLabel} components dominate the workspace`,
          context: "overview.keyFindingDominant",
        }
      )
    );
  }
  if (worstName && worstProject) {
    const worstTotal = worstProject.total;
    const worstComponents = worstProject.components ?? 0;
    const density = worstComponents > 0 ? (worstTotal / worstComponents).toFixed(1) : "0";
    keyFindings.push(formatWorstBucketFinding(worstName, density, breakdownMode, t));
  } else if (diagnosis.totalComponents > 0 && breakdownMode === "project") {
    keyFindings.push(
      (t.overview.riskDistributed ??
        "Warning density is distributed across multiple projects")
    );
  }

  if (keyFindings.length === 0 && diagnosis.totalComponents > 0) {
    if (breakdownMode === "feature-area") {
      keyFindings.push((t.overview.noDominantArea ?? "No dominant feature area detected"));
    } else {
      keyFindings.push((t.overview.riskDistributed ?? "Workspace risk is distributed across multiple areas"));
    }
  }
  const keyFindingsHtml = keyFindings.length > 0
    ? `<div class="overview-hero-key-findings">
        <div class="overview-hero-key-findings-title">${escapeHtml(t.overview.keyFindings)}</div>
        <ul class="overview-hero-key-findings-list">${keyFindings
          .map((f) => ensureNoUnresolvedTokens(f, {
            fallback: "Warning density is distributed across multiple projects",
            context: "overview.hero.keyFindings",
          }))
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join("")}</ul>
      </div>`
    : "";

  const scoreRingHelper = (t.hero as { scoreRingHelper?: string }).scoreRingHelper;
  const mainDiagnosisHtml = renderMainDiagnosisBlock(diagnosis, t);

  const scoreBreakdownItems = [
    { label: t.scores.componentQuality, v: scores.component.score },
    { label: t.scores.lifecycleCleanup, v: scores.lifecycle.score },
    { label: t.scores.templateComplexity, v: scores.template.score },
    { label: t.scores.responsibility, v: scores.responsibility.score },
  ];
  const scoreBreakdownHtml = scoreBreakdownItems
    .map((item) => {
      const cls = item.v >= 7 ? "good" : item.v >= 5 ? "medium" : "bad";
      return `<div class="overview-hero-score-mini"><span class="overview-hero-score-mini-label">${escapeHtml(item.label)}</span><div class="overview-hero-score-mini-bar"><div class="overview-hero-score-mini-fill ${cls}" style="width:${(item.v / 10) * 100}%"></div></div><span class="overview-hero-score-mini-value ${cls}">${item.v.toFixed(1)}</span></div>`;
    })
    .join("");

  const quickNavHtml = `
    <div class="overview-hero-quick-nav">
      <a href="#components" class="planner-nav-link overview-hero-quick-link" data-nav="components">${escapeHtml(t.overview.actionExploreComponents ?? "Explore components")}</a>
      <a href="#planner" class="planner-nav-link overview-hero-quick-link" data-nav="planner">${escapeHtml(t.overview.actionOpenRefactorPlan ?? "Refactor plan")}</a>
    </div>`;

  return `
    <div class="overview-hero">
      <h2 class="overview-hero-title">${escapeHtml(t.hero.workspaceHealth)}</h2>
      <div class="overview-hero-grid">
        <div class="overview-hero-left">
          <div class="overview-hero-score-ring">
            <svg viewBox="0 0 100 100" class="overview-hero-ring-svg">
              <circle class="overview-hero-ring-bg" cx="50" cy="50" r="45"/>
              <circle class="overview-hero-ring-fill" cx="50" cy="50" r="45" stroke-dasharray="${strokeDash} ${circumference}"/>
            </svg>
            <span class="overview-hero-score-value">${score.toFixed(1)}<span class="overview-hero-score-max">/10</span></span>
          </div>
          ${scoreRingHelper ? `<p class="overview-hero-score-helper">${escapeHtml(scoreRingHelper)}${((t.overview as { scoreExplanation?: string }).scoreExplanation) ? " " + renderInfoTooltip((t.overview as { scoreExplanation?: string }).scoreExplanation!) : ""}</p>` : ""}
          <div class="overview-hero-score-breakdown">${scoreBreakdownHtml}</div>
        </div>
        <div class="overview-hero-right">
          ${mainDiagnosisHtml}
          <span class="risk-badge ${riskBadgeClass} overview-hero-risk-badge">${escapeHtml(riskLevel)} Risk</span>
          <p class="overview-hero-summary">${escapeHtml(summaryText)}</p>
          ${keyFindingsHtml}
          ${chips ? `<div class="overview-hero-chips">${chips}</div>` : ""}
          ${recommendation ? `<div class="overview-hero-recommendation">${escapeHtml(recommendation)}</div>` : ""}
          ${quickNavHtml}
        </div>
      </div>
    </div>`;
}

/** @deprecated Use renderOverviewHero with buildWorkspaceDiagnosis instead */
export function renderExecutiveHero(
  scores: Scores,
  workspaceSummary: { riskLevel: string; componentCount: number; totalFindings: number },
  diagnosticSummary: { componentsWithDominantIssue: number; totalComponents: number; dominantIssueCounts: Record<string, number> },
  projectBreakdown: Array<{ sourceRoot: string; components?: number; templateFindings: number; responsibilityFindings: number; componentsWithFindings: number; componentFindings?: number; lifecycleFindings?: number }>,
  formatIssue: (issue: string | null) => string,
  t: Translations,
  breakdownMode?: BreakdownMode
): string {
  const diagnosis = buildWorkspaceDiagnosisFromLegacy(
    scores,
    diagnosticSummary,
    projectBreakdown,
    "",
    formatIssue,
    breakdownMode
  );
  return renderOverviewHero(scores, workspaceSummary, diagnosis, projectBreakdown, formatIssue, t, breakdownMode);
}

export function renderSecondaryMetricCards(
  workspaceSummary: { componentCount: number; totalFindings: number },
  diagnosticSummary: { componentsWithDominantIssue: number; totalComponents: number },
  topCrossCount: number,
  t: Translations
): string {
  const coveragePct = diagnosticSummary.totalComponents > 0
    ? Math.round((diagnosticSummary.componentsWithDominantIssue / diagnosticSummary.totalComponents) * 100)
    : 0;

  const ov = t.overview as unknown as Record<string, string | undefined>;
  const hintComponents = ov.metricHintComponents ?? "Total components in workspace";
  const hintWarnings = ov.metricHintWarnings ?? "Total warnings across all rules";
  const hintCritical = ov.metricHintCriticalComponents ?? "Components flagged as top risks";
  const hintDominant = (ov.metricHintDominantIssueCoverage ?? "{n} of {total} components")
    .replace("{n}", String(diagnosticSummary.componentsWithDominantIssue))
    .replace("{total}", String(diagnosticSummary.totalComponents));
  const secComponents = ov.metricSecondaryComponents ?? "Used to compute workspace health.";
  const secWarnings = ov.metricSecondaryWarnings ?? "Indicates rule violations across all components.";
  const secCritical = ov.metricSecondaryCriticalComponents ?? "These components drive the most risk.";
  const secDominant = ov.metricSecondaryDominantIssueCoverage ?? "Components with a clear primary architectural smell.";
  const cards = [
    { label: t.hero.components, value: workspaceSummary.componentCount, hint: hintComponents, secondary: secComponents },
    { label: t.hero.warnings, value: workspaceSummary.totalFindings, hint: hintWarnings, secondary: secWarnings },
    { label: t.overview.criticalComponents, value: topCrossCount, hint: hintCritical, secondary: secCritical },
    { label: t.overview.dominantIssueCoverage, value: `${coveragePct}%`, hint: hintDominant, secondary: secDominant },
  ];

  const html = cards
    .map(
      (c) => `
    <div class="secondary-metric-card">
      <div class="secondary-metric-label">${escapeHtml(c.label)}</div>
      <div class="secondary-metric-value">${escapeHtml(String(c.value))}</div>
      <div class="secondary-metric-hint">${escapeHtml(c.hint)}</div>
      <div class="secondary-metric-secondary">${escapeHtml(c.secondary)}</div>
    </div>`
    )
    .join("");

  return `<div class="secondary-metrics">${html}</div>`;
}

export function renderGroupedOverviewMetrics(
  workspaceSummary: { componentCount: number; totalFindings: number },
  diagnosticSummary: { componentsWithDominantIssue: number; totalComponents: number },
  topCrossCount: number,
  scores: Scores,
  t: Translations
): string {
  const coveragePct = diagnosticSummary.totalComponents > 0
    ? Math.round((diagnosticSummary.componentsWithDominantIssue / diagnosticSummary.totalComponents) * 100)
    : 0;

  const ov = t.overview as unknown as Record<string, string | undefined>;
  const scaleLabel = ov.metricGroupScale ?? "Scale";
  const riskLabel = ov.metricGroupRisk ?? "Risk";
  const qualityLabel = ov.metricGroupQuality ?? "Quality Dimensions";

  const scaleCards = [
    { label: t.hero.components, value: workspaceSummary.componentCount, hint: ov.metricHintComponents ?? "Total components in workspace", secondary: ov.metricSecondaryComponents ?? "Used to compute workspace health." },
    { label: t.hero.warnings, value: workspaceSummary.totalFindings, hint: ov.metricHintWarnings ?? "Total warnings across all rules", secondary: ov.metricSecondaryWarnings ?? "Indicates rule violations across all components." },
  ];
  const riskCards = [
    { label: t.overview.criticalComponents, value: topCrossCount, hint: ov.metricHintCriticalComponents ?? "Components flagged as top risks", secondary: ov.metricSecondaryCriticalComponents ?? "These components drive the most risk." },
    { label: t.overview.dominantIssueCoverage, value: `${coveragePct}%`, hint: (ov.metricHintDominantIssueCoverage ?? "{n} of {total} components").replace("{n}", String(diagnosticSummary.componentsWithDominantIssue)).replace("{total}", String(diagnosticSummary.totalComponents)), secondary: ov.metricSecondaryDominantIssueCoverage ?? "Components with a clear primary architectural smell." },
  ];

  const scoresT = t.scores as Record<string, string | undefined>;
  const hint = (explained: ExplainedScore, dimensionKey: string) => {
    const fromExplained = explained.shortExplanation ?? (explained.factors.length > 0 ? explained.factors[0].description : "");
    if (fromExplained) return fromExplained;
    const helperKey = dimensionKey === "componentQuality" ? "dimensionHelperComponentQuality"
      : dimensionKey === "lifecycleCleanup" ? "dimensionHelperLifecycleCleanup"
      : dimensionKey === "templateComplexity" ? "dimensionHelperTemplateComplexity"
      : "dimensionHelperResponsibility";
    return scoresT[helperKey] ?? "";
  };
  const verdict = (v: number) => v >= 7 ? t.scores.verdictGood : v >= 5 ? t.scores.verdictAcceptable : t.scores.verdictNeedsAttention;
  const qualityItems: Array<{ label: string; explained: ExplainedScore; dimensionKey: string }> = [
    { label: t.scores.componentQuality, explained: scores.component, dimensionKey: "componentQuality" },
    { label: t.scores.lifecycleCleanup, explained: scores.lifecycle, dimensionKey: "lifecycleCleanup" },
    { label: t.scores.templateComplexity, explained: scores.template, dimensionKey: "templateComplexity" },
    { label: t.scores.responsibility, explained: scores.responsibility, dimensionKey: "responsibility" },
  ];

  const renderCard = (c: { label: string; value: string | number; hint: string; secondary: string }) => `
    <div class="secondary-metric-card">
      <div class="secondary-metric-label">${escapeHtml(c.label)}</div>
      <div class="secondary-metric-value">${escapeHtml(String(c.value))}</div>
      <div class="secondary-metric-hint">${escapeHtml(c.hint)}</div>
      <div class="secondary-metric-secondary">${escapeHtml(c.secondary)}</div>
    </div>`;

  const scaleHtml = scaleCards.map(renderCard).join("");
  const riskHtml = riskCards.map(renderCard).join("");
  const qualityHtml = qualityItems.map((item) => {
    const v = item.explained.score;
    const cls = v >= 7 ? "good" : v >= 5 ? "medium" : "bad";
    return `
    <div class="score-breakdown-card">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="verdict ${cls}">${escapeHtml(verdict(v))}</div>
      <div class="value ${cls}">${v.toFixed(1)}/10</div>
      <div class="bar"><div class="bar-fill ${cls}" style="width:${(v / 10) * 100}%"></div></div>
      ${hint(item.explained, item.dimensionKey) ? `<div class="hint">${escapeHtml(hint(item.explained, item.dimensionKey))}</div>` : ""}
    </div>`;
  }).join("");

  const topRiskExpl = ov.topRiskExplanation ?? "";
  const riskTitleHtml = topRiskExpl
    ? `${escapeHtml(riskLabel)} ${renderInfoTooltip(topRiskExpl)}`
    : escapeHtml(riskLabel);

  return `
    <div class="overview-metrics-grouped">
      <div class="metric-group metric-group-scale">
        <div class="metric-group-title">${escapeHtml(scaleLabel)}</div>
        <div class="metric-group-cards">${scaleHtml}</div>
      </div>
      <div class="metric-group metric-group-risk">
        <div class="metric-group-title">${riskTitleHtml}</div>
        <div class="metric-group-cards">${riskHtml}</div>
      </div>
      <div class="metric-group metric-group-quality">
        <div class="metric-group-title">${escapeHtml(qualityLabel)}</div>
        <div class="metric-group-cards">${qualityHtml}</div>
      </div>
    </div>`;
}

export function renderScoreBreakdownCards(scores: Scores, t: Translations): string {
  const scoresT = t.scores as Record<string, string | undefined>;
  const hint = (explained: ExplainedScore, dimensionKey: string) => {
    const fromExplained = explained.shortExplanation ?? (explained.factors.length > 0 ? explained.factors[0].description : "");
    if (fromExplained) return fromExplained;
    const helperKey = dimensionKey === "componentQuality" ? "dimensionHelperComponentQuality"
      : dimensionKey === "lifecycleCleanup" ? "dimensionHelperLifecycleCleanup"
      : dimensionKey === "templateComplexity" ? "dimensionHelperTemplateComplexity"
      : "dimensionHelperResponsibility";
    return scoresT[helperKey] ?? "";
  };

  const items: Array<{ label: string; explained: ExplainedScore; dimensionKey: string }> = [
    { label: t.scores.componentQuality, explained: scores.component, dimensionKey: "componentQuality" },
    { label: t.scores.lifecycleCleanup, explained: scores.lifecycle, dimensionKey: "lifecycleCleanup" },
    { label: t.scores.templateComplexity, explained: scores.template, dimensionKey: "templateComplexity" },
    { label: t.scores.responsibility, explained: scores.responsibility, dimensionKey: "responsibility" },
  ];

  const verdict = (v: number) => v >= 7 ? t.scores.verdictGood : v >= 5 ? t.scores.verdictAcceptable : t.scores.verdictNeedsAttention;

  const html = items
    .map((item) => {
      const v = item.explained.score;
      const cls = v >= 7 ? "good" : v >= 5 ? "medium" : "bad";
      return `
    <div class="score-breakdown-card">
      <div class="label">${escapeHtml(item.label)}</div>
      <div class="verdict ${cls}">${escapeHtml(verdict(v))}</div>
      <div class="value ${cls}">${v.toFixed(1)}/10</div>
      <div class="bar"><div class="bar-fill ${cls}" style="width:${(v / 10) * 100}%"></div></div>
      ${hint(item.explained, item.dimensionKey) ? `<div class="hint">${escapeHtml(hint(item.explained, item.dimensionKey))}</div>` : ""}
    </div>`;
    })
    .join("");

  return `<div class="score-breakdown-cards">${html}</div>`;
}

function computeProjectDominantIssue(
  projectSourceRoot: string,
  topCrossCuttingRisks: Array<{ filePath: string; dominantIssue?: string | null }>,
  projectBreakdown: Array<{ sourceRoot: string; pathSegments?: string[]; components?: number }>
): string | null {
  const counts = new Map<string, number>();
  const breakdown = projectBreakdown as unknown as Parameters<typeof getProjectForPath>[1];
  for (const d of topCrossCuttingRisks) {
    const project = getProjectForPath(d.filePath, breakdown);
    if (project !== projectSourceRoot || !d.dominantIssue) continue;
    counts.set(d.dominantIssue, (counts.get(d.dominantIssue) ?? 0) + 1);
  }
  let top: string | null = null;
  let maxCount = 0;
  counts.forEach((count, issue) => {
    if (count > maxCount) {
      maxCount = count;
      top = issue;
    }
  });
  return top;
}

export function renderProjectHotspotsOverview(
  projectBreakdown: Array<{
    sourceRoot: string;
    components: number;
    componentsWithFindings?: number;
    templateFindings?: number;
    responsibilityFindings?: number;
    lifecycleFindings?: number;
    componentFindings?: number;
    pathSegments?: string[];
  }>,
  t: Translations,
  breakdownMode?: "project" | "feature-area" | "source-root" | "package",
  options?: {
    topCrossCuttingRisks?: Array<{ filePath: string; dominantIssue?: string | null }>;
    formatIssue?: (issue: string | null) => string;
  }
): string {
  const totalFindings = (p: typeof projectBreakdown[0]) =>
    (p.componentFindings ?? p.componentsWithFindings ?? 0) + (p.templateFindings ?? 0) + (p.responsibilityFindings ?? 0) + (p.lifecycleFindings ?? 0);
  const projects = projectBreakdown
    .filter((p) => p.components > 0)
    .map((p) => ({ ...p, total: totalFindings(p), density: p.components > 0 ? totalFindings(p) / p.components : 0 }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.density - a.density)
    .slice(0, 6);

  if (projects.length === 0) return "";

  const maxDensity = projects.length > 0 ? projects[0].density : 0;
  const formatIssue = options?.formatIssue ?? ((s: string | null) => s ?? "");
  const topRisks = options?.topCrossCuttingRisks ?? [];

  const getLabel = (sourceRoot: string): string => {
    if (sourceRoot === "other") {
      if (breakdownMode === "feature-area") return t.overview.uncategorizedFeatureAreas ?? "Uncategorized";
      return t.overview.otherAreas ?? "Other";
    }
    if (sourceRoot.toLowerCase() === "infrastructure") return t.overview.sharedInfrastructure ?? "Shared & infrastructure";
    return sourceRoot.replace(/^projects\//, "").replace(/^libs\//, "").replace(/^apps\//, "").replace(/\/src$/, "") || sourceRoot;
  };

  const hotspotsLabel = (t.overview as { hotspotsByProject?: string }).hotspotsByProject ?? "Hotspots by project / area";
  const hotspotsHelper = (t.overview as { hotspotsHelper?: string }).hotspotsHelper;
  const itemsHtml = projects
    .map((p) => {
      const dominantSmell = topRisks.length > 0 ? computeProjectDominantIssue(p.sourceRoot, topRisks, projectBreakdown) : null;
      const dominantLabel = dominantSmell ? formatIssue(dominantSmell) : null;
      const riskSummary = dominantLabel ?? (p.density >= 3 ? "High density" : null);
      const isWorst = p.density >= maxDensity && maxDensity > 0;
      const worstClass = isWorst ? " project-hotspot-item-worst" : "";
      return `
    <a href="#components" class="project-hotspot-item planner-nav-link${worstClass}" data-nav="components" data-project="${escapeHtml(p.sourceRoot)}" role="button">
      <span class="project-hotspot-name">${escapeHtml(getLabel(p.sourceRoot))}</span>
      <span class="project-hotspot-stats">${p.components} components · ${p.total} findings</span>
      <span class="project-hotspot-density">${p.density.toFixed(1)} per component</span>
      ${riskSummary ? `<span class="project-hotspot-risk-summary">${escapeHtml(riskSummary)}</span>` : ""}
    </a>`;
    })
    .join("");

  return `
    <div class="overview-section project-hotspots-overview">
      ${renderSectionHeader(hotspotsLabel, { helper: hotspotsHelper })}
      <div class="project-hotspots-grid">${itemsHtml}</div>
    </div>`;
}

export function renderDominantIssueDistribution(
  dominantIssueCounts: Record<string, number>,
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  const entries = [
    "TEMPLATE_HEAVY_COMPONENT",
    "GOD_COMPONENT",
    "CLEANUP_RISK_COMPONENT",
    "ORCHESTRATION_HEAVY_COMPONENT",
    "LIFECYCLE_RISKY_COMPONENT",
  ]
    .map((key) => ({ key, count: dominantIssueCounts[key] ?? 0 }))
    .filter((e) => e.count > 0);

  const maxCount = Math.max(...entries.map((e) => e.count), 1);

  const colors = ["#3b82f6", "#f97316", "#f59e0b", "#ef4444", "#22c55e"];

  const explanation = (key: string) => (t.overview.issueExplanation as Record<string, string>)[key] ?? getDominantIssueExplanation(key);

  const html = entries
    .map(
      (e, i) => {
        const pct = (e.count / maxCount) * 100;
        const color = colors[i % colors.length];
        const expl = explanation(e.key);
        return `
    <a href="#components" class="what-hurts-bar-item-wrap planner-nav-link" data-nav="components" data-issue-type="${escapeHtml(e.key)}" role="button">
      <div class="what-hurts-bar-item">
        <span class="what-hurts-bar-label">${escapeHtml(formatIssue(e.key))}</span>
        <div class="what-hurts-bar-track">
          <div class="what-hurts-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="what-hurts-bar-count">${e.count}</span>
      </div>
      ${expl ? `<div class="what-hurts-bar-explanation">${escapeHtml(expl)}</div>` : ""}
    </a>`;
      }
    )
    .join("");

  const whatHurtsHelper = (t.overview as unknown as Record<string, string | undefined>).whatHurtsMostHelper;
  const dominantExpl = (t.overview as unknown as Record<string, string | undefined>).dominantIssueExplanation;
  const titleWithTooltip = dominantExpl
    ? `${escapeHtml(t.overview.whatHurtsMost)} ${renderInfoTooltip(dominantExpl)}`
    : escapeHtml(t.overview.whatHurtsMost);
  return `
    <div class="what-hurts-section">
      <h2 class="page-section-title section-title-caps">${titleWithTooltip}</h2>
      ${whatHurtsHelper ? `<p class="section-helper text-muted">${escapeHtml(whatHurtsHelper)}</p>` : ""}
      <div class="what-hurts-bars">${html}</div>
    </div>`;
}

export function renderProjectBreakdownCards(
  projectBreakdown: Array<{
    sourceRoot: string;
    components: number;
    componentsWithFindings: number;
    componentFindings?: number;
    templateFindings?: number;
    responsibilityFindings?: number;
    lifecycleFindings?: number;
  }>,
  t: Translations,
  breakdownMode?: "project" | "feature-area" | "source-root" | "package",
  otherMinorClusters?: Array<{
    sourceRoot: string;
    components: number;
    componentsWithFindings: number;
    componentFindings?: number;
    templateFindings?: number;
    responsibilityFindings?: number;
    lifecycleFindings?: number;
  }>
): string {
  let projects = projectBreakdown.filter((p) => p.components > 0);
  const totalFindings = (p: typeof projects[0]) =>
    (p.componentFindings ?? p.componentsWithFindings ?? 0) + (p.templateFindings ?? 0) + (p.responsibilityFindings ?? 0) + (p.lifecycleFindings ?? 0);
  const isFeatureAreaMode = breakdownMode === "feature-area";
  if (isFeatureAreaMode) {
    projects = [...projects].sort((a, b) => totalFindings(b) - totalFindings(a));
  }
  const worstProject = projects.reduce(
    (best, p) => {
      const total = totalFindings(p);
      return total > (best?.total ?? 0) ? { ...p, total } : best;
    },
    null as { sourceRoot: string; total: number } | null
  );

  const getBreakdownCardLabel = (sourceRoot: string): string => {
    if (sourceRoot === "other") {
      if (breakdownMode === "project") {
        return t.overview.otherProjects ?? "Other projects";
      }
      if (breakdownMode === "feature-area") {
        return (
          t.overview.uncategorizedFeatureAreas ??
          t.overview.otherFeatureAreas ??
          t.overview.otherAreas ??
          "Uncategorized feature areas"
        );
      }
      return t.overview.otherAreas ?? "Other areas";
    }
    if (sourceRoot.toLowerCase() === "infrastructure") {
      return t.overview.sharedInfrastructure ?? "Shared & infrastructure";
    }
    return sourceRoot.replace(/^projects\//, "").replace(/^libs\//, "").replace(/^apps\//, "").replace(/\/src$/, "") || sourceRoot;
  };

  const getDimension = (p: typeof projects[0]) => {
    const tw = p.templateFindings ?? 0;
    const rw = p.responsibilityFindings ?? 0;
    const lw = p.lifecycleFindings ?? 0;
    const cw = p.componentFindings ?? p.componentsWithFindings ?? 0;
    const max = Math.max(tw, rw, lw, cw);
    if (max === 0) return "";
    if (max === tw) return t.overview.dimensionTemplate;
    if (max === rw) return t.overview.dimensionResponsibility;
    if (max === lw) return t.overview.dimensionLifecycle;
    return t.overview.dimensionComponent;
  };

  const html = projects
    .map((p) => {
      const total = totalFindings(p);
      const isWorst = worstProject && p.sourceRoot === worstProject.sourceRoot;
      const shortName = getBreakdownCardLabel(p.sourceRoot);
      const dimension = getDimension(p);
      const isOtherWithMinor =
        isFeatureAreaMode &&
        p.sourceRoot === "other" &&
        otherMinorClusters &&
        otherMinorClusters.length > 0;

      if (isOtherWithMinor) {
        const exploreLabel = t.overview.exploreMinorAreas ?? "Explore minor areas";
        return `
    <div class="project-breakdown-card project-breakdown-card-other ${isWorst ? "project-breakdown-worst" : ""}">
      <div class="project-name">${escapeHtml(shortName)}</div>
      <div class="project-stats">${p.components} components</div>
      <div class="project-stats project-breakdown-other-minor-count">${(t.overview.minorAreasCount ?? "{count} smaller areas").replace("{count}", String(otherMinorClusters.length))}</div>
      <div class="project-warnings">${total} findings</div>
      ${dimension ? `<div class="project-dimension"><span class="project-dimension-label">${escapeHtml(t.overview.primaryPressureArea)}:</span> ${escapeHtml(dimension)}</div>` : ""}
      <button type="button" class="explore-minor-areas-btn" data-explore-minor-areas>${escapeHtml(exploreLabel)}</button>
    </div>`;
      }

      return `
    <div class="project-breakdown-card ${isWorst ? "project-breakdown-worst" : ""}">
      <div class="project-name">${escapeHtml(shortName)}</div>
      <div class="project-stats">${p.components} components</div>
      <div class="project-warnings">${total} findings</div>
      ${dimension ? `<div class="project-dimension"><span class="project-dimension-label">${escapeHtml(t.overview.primaryPressureArea)}:</span> ${escapeHtml(dimension)}</div>` : ""}
    </div>`;
    })
    .join("");

  const sectionTitleMap: Record<string, string> = {
    project: t.overview.projectBreakdown,
    "feature-area": t.overview.featureAreaBreakdown ?? t.overview.featureBreakdown,
    "source-root": t.overview.sourceRootBreakdown,
    package: t.overview.packageBreakdown ?? "Package Breakdown",
  };
  const sectionTitle = breakdownMode ? sectionTitleMap[breakdownMode] : (t.overview.workspaceBreakdown ?? "Workspace Breakdown");
  const breakdownHelper = (t.overview as unknown as Record<string, string | undefined>).breakdownHelper;
  const lowSignalNote =
    isFeatureAreaMode && t.overview.lowSignalClustersMerged
      ? `<p class="workspace-breakdown-note">${escapeHtml(t.overview.lowSignalClustersMerged)}</p>`
      : "";
  return `
    <div class="overview-section workspace-breakdown-section" data-breakdown-mode="${breakdownMode ?? "source-root"}">
      <h2 class="page-section-title section-title-caps">${escapeHtml(sectionTitle)}</h2>
      ${breakdownHelper ? `<p class="section-helper text-muted">${escapeHtml(breakdownHelper)}</p>` : ""}
      <div class="workspace-breakdown-cards project-breakdown-cards">${html}</div>
      ${lowSignalNote}
    </div>`;
}

export function renderTopProblematicCompactList(
  items: Array<{
    filePath: string;
    fileName: string;
    className?: string;
    mainIssue: string;
    highestSeverity?: string;
    project?: string | null;
  }>,
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  const topProbIntro = (t.overview as unknown as Record<string, string | undefined>).topProblematicIntro;
  const openComponentsLabel = (t.overview as unknown as Record<string, string | undefined>).actionOpenComponents ?? "Open Components";
  const detailsLinkLabel = (t.overview as unknown as Record<string, string | undefined>).actionViewDetailsShort ?? "Details";
  if (items.length === 0) {
    return `
    <div class="overview-section">
      <h2 class="page-section-title section-title-caps">${escapeHtml(t.overview.topProblematic)}</h2>
      ${renderEmptyState(t.empty.noComponents)}
      <a href="#components" class="overview-action-link planner-nav-link" data-nav="components">${escapeHtml(openComponentsLabel)}</a>
    </div>`;
  }
  const rows = items
    .slice(0, 5)
    .map(
      (item) => {
        const name = item.className || item.fileName.replace(/\.component\.ts$/, "");
        const canonicalSeverity = item.highestSeverity ? normalizeSeverityCode(item.highestSeverity) : "LOW";
        const severityClass = severityCodeToClass(canonicalSeverity);
        const severityLabelKey = severityClass;
        const severityLabel = (t.severity as Record<string, string>)[severityLabelKey] ?? canonicalSeverity;
        const severityBadge = `<span class="badge-severity badge-severity-${severityClass}">${escapeHtml(severityLabel)}</span>`;
        return `
    <tr class="top-problematic-table-row" data-file-path="${escapeHtml(item.filePath)}" data-project="${escapeHtml(item.project ?? "")}" data-issue-type="${escapeHtml(item.mainIssue)}">
      <td class="top-problematic-col-name">${escapeHtml(name)}</td>
      <td class="top-problematic-col-issue top-problematic-col-smell">${escapeHtml(item.mainIssue)}</td>
      <td class="top-problematic-col-severity">${severityBadge}</td>
      <td class="top-problematic-col-action"><a href="#" class="top-problematic-action-link" data-file-path="${escapeHtml(item.filePath)}">${escapeHtml(detailsLinkLabel)}</a></td>
    </tr>`;
      }
    )
    .join("");

  return `
    <div class="overview-section">
      ${renderSectionHeader(t.overview.topProblematic, { helper: topProbIntro })}
      <div class="top-problematic-table-wrap">
        <table class="top-problematic-table top-problematic-overview-table">
          <colgroup>
            <col />
            <col style="width: 120px" />
            <col style="width: 80px" />
            <col style="width: 90px" />
          </colgroup>
          <thead>
            <tr>
              <th>Component</th>
              <th>Smell</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <a href="#components" class="overview-action-link planner-nav-link" data-nav="components">${escapeHtml(openComponentsLabel)}</a>
    </div>`;
}

export function renderOverviewActionNav(
  t: Translations,
  options?: { primaryCtaLabel?: string; hasPatterns?: boolean }
): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const title = ov.actionNavTitle ?? "Where should I go next?";
  const exploreComponents = ov.actionExploreComponents ?? "Explore problem components";
  const reviewPatterns = ov.actionReviewPatterns ?? "Review repeated patterns";
  const inspectStructure = ov.actionInspectStructure ?? "Inspect structure concerns";
  const openRefactorPlan = ov.actionOpenRefactorPlan ?? "Open refactor plan";

  const primaryLabel = options?.primaryCtaLabel ?? ov.ctaPrimaryCritical ?? "Start with top critical components";
  const primaryCta = `<a href="#components" class="overview-action-card overview-action-card-primary planner-nav-link" data-nav="components">${escapeHtml(primaryLabel)}</a>`;
  const secondaryCtas = [
    `<a href="#structure" class="overview-action-card planner-nav-link" data-nav="structure">${escapeHtml(inspectStructure)}</a>`,
    options?.hasPatterns !== false
      ? `<a href="#patterns" class="overview-action-card planner-nav-link" data-nav="patterns">${escapeHtml(reviewPatterns)}</a>`
      : "",
    `<a href="#planner" class="overview-action-card planner-nav-link" data-nav="planner">${escapeHtml(openRefactorPlan)}</a>`,
  ].filter(Boolean);

  return `
    <div class="overview-section overview-action-nav">
      <h2 class="page-section-title section-title-caps">${escapeHtml(title)}</h2>
      <div class="overview-action-nav-grid">
        ${primaryCta}
        ${secondaryCtas.join("")}
      </div>
    </div>`;
}

function truncateHint(s: string, maxLen = 80): string {
  const t = (s || "").trim();
  if (t.length <= maxLen) return t;
  const cut = t.lastIndexOf(" ", maxLen);
  return (cut > 40 ? t.slice(0, cut) : t.slice(0, maxLen)) + "...";
}

/** Truncate at word boundary to avoid mid-word cuts like "based on rep..." */
function truncateAtWordBoundary(text: string, maxLen: number): string {
  const t = (text || "").trim();
  if (t.length <= maxLen) return t;
  const cut = t.lastIndexOf(" ", maxLen);
  const minCut = Math.floor(maxLen * 0.4);
  return (cut > minCut ? t.slice(0, cut) : t.slice(0, maxLen)) + "...";
}

export function renderOverviewPatternPreview(
  archPatterns: Array<{
    familyName: string;
    components: Array<{ className: string; fileName: string; filePath: string; dominantIssue: string }>;
    sharedRefactorOpportunity?: string;
  }>,
  featurePatterns: Array<{
    featureName: string;
    instanceCount: number;
    recommendation?: string;
  }>,
  _formatIssue: (issue: string | null) => string,
  formatFamily: (name: string) => string,
  t: Translations
): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const openPatternsLabel = ov.actionOpenPatterns ?? "Open Patterns";

  const previewItems: string[] = [];
  const maxPreview = 2;

  for (let i = 0; i < Math.min(archPatterns.length, maxPreview); i++) {
    const p = archPatterns[i];
    const count = p.components.length;
    const hint = p.sharedRefactorOpportunity ? truncateHint(p.sharedRefactorOpportunity) : "";
    previewItems.push(
      `<div class="overview-pattern-preview-item">
        <div class="overview-pattern-preview-row">
          <span class="overview-pattern-preview-name">${escapeHtml(formatFamily(p.familyName))}</span>
          <span class="overview-pattern-preview-meta">${count} components</span>
        </div>
        ${hint ? `<div class="overview-pattern-preview-hint">${escapeHtml(hint)}</div>` : ""}
      </div>`
    );
  }
  for (let i = 0; i < Math.min(featurePatterns.length, maxPreview - previewItems.length); i++) {
    const fp = featurePatterns[i];
    const hint = fp.recommendation ? truncateHint(fp.recommendation) : "";
    previewItems.push(
      `<div class="overview-pattern-preview-item">
        <div class="overview-pattern-preview-row">
          <span class="overview-pattern-preview-name">${escapeHtml(fp.featureName)}</span>
          <span class="overview-pattern-preview-meta">${fp.instanceCount} implementations</span>
        </div>
        ${hint ? `<div class="overview-pattern-preview-hint">${escapeHtml(hint)}</div>` : ""}
      </div>`
    );
  }

  if (previewItems.length === 0) {
    const noPatternsMsg = ov.noRepeatedPatternsGood ?? t.empty.noPatterns;
    return `
    <div class="overview-section overview-pattern-preview overview-pattern-preview-empty">
      <h2 class="page-section-title section-title-caps">${escapeHtml(t.overview.repeatedPatterns)}</h2>
      <div class="overview-pattern-empty-state">${escapeHtml(noPatternsMsg)}</div>
      <span class="overview-action-link overview-action-secondary" aria-disabled="true">${escapeHtml(openPatternsLabel)}</span>
    </div>`;
  }

  return `
    <div class="overview-section overview-pattern-preview">
      <h2 class="page-section-title section-title-caps">${escapeHtml(t.overview.repeatedPatterns)}</h2>
      <div class="overview-pattern-preview-list">${previewItems.join("")}</div>
      <a href="#patterns" class="overview-action-link planner-nav-link" data-nav="patterns">${escapeHtml(openPatternsLabel)}</a>
    </div>`;
}

export function renderRefactoringStrategySection(
  architectureRefactorPlan: Array<{ familyName: string; whyFirst?: string[]; percentageOfTotalIssues: number }>,
  dominantIssueCounts: Record<string, number>,
  projectBreakdown: Array<{ sourceRoot: string; components: number; templateFindings: number; responsibilityFindings: number; componentsWithFindings: number; componentFindings?: number; lifecycleFindings?: number }>,
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  const steps: string[] = [];

  if (architectureRefactorPlan && architectureRefactorPlan.length > 0) {
    architectureRefactorPlan.slice(0, 4).forEach((item, i) => {
      const action = item.familyName;
      const desc = item.whyFirst?.[0] ?? `Fixing this addresses ${item.percentageOfTotalIssues}% of issues`;
      steps.push(`<div class="refactoring-strategy-step"><strong>${i + 1}. ${escapeHtml(action)}</strong><span class="refactoring-strategy-desc">${escapeHtml(desc)}</span></div>`);
    });
  } else {
    const dc = dominantIssueCounts;
    const projects = projectBreakdown.filter((p) => p.components > 0);
    const totalFindings = (p: typeof projects[0]) =>
      (p.componentFindings ?? p.componentsWithFindings ?? 0) + (p.templateFindings ?? 0) + (p.responsibilityFindings ?? 0) + (p.lifecycleFindings ?? 0);
    const worstProj = projects.reduce(
      (best, p) => {
        const total = totalFindings(p);
        return total > (best?.total ?? 0) ? { ...p, total } : best;
      },
      null as { sourceRoot: string; total: number } | null
    );
    const worstName = worstProj ? worstProj.sourceRoot.replace(/^projects\//, "").replace(/\/src$/, "") : "";

    const entries = [
      { key: "TEMPLATE_HEAVY_COMPONENT", count: dc.TEMPLATE_HEAVY_COMPONENT ?? 0 },
      { key: "GOD_COMPONENT", count: dc.GOD_COMPONENT ?? 0 },
      { key: "CLEANUP_RISK_COMPONENT", count: dc.CLEANUP_RISK_COMPONENT ?? 0 },
      { key: "ORCHESTRATION_HEAVY_COMPONENT", count: dc.ORCHESTRATION_HEAVY_COMPONENT ?? 0 },
    ].filter((e) => e.count > 0);

    const fallbackDescs: Record<string, string> = {
      TEMPLATE_HEAVY_COMPONENT: t.overview.issueExplanation.TEMPLATE_HEAVY_COMPONENT,
      GOD_COMPONENT: t.overview.issueExplanation.GOD_COMPONENT,
      CLEANUP_RISK_COMPONENT: t.overview.issueExplanation.CLEANUP_RISK_COMPONENT,
      ORCHESTRATION_HEAVY_COMPONENT: t.overview.issueExplanation.ORCHESTRATION_HEAVY_COMPONENT,
    };
    entries.slice(0, 4).forEach((e, i) => {
      const ctx = worstName ? ` in ${worstName}` : "";
      const action = `Address ${formatIssue(e.key).toLowerCase()} components (${e.count})${ctx}`;
      const desc = fallbackDescs[e.key] ?? "";
      steps.push(`<div class="refactoring-strategy-step"><strong>${i + 1}. ${escapeHtml(action)}</strong>${desc ? `<span class="refactoring-strategy-desc">${escapeHtml(desc)}</span>` : ""}</div>`);
    });
  }

  if (steps.length === 0) return "";

  const listHtml = steps.map((s) => `<li>${s}</li>`).join("");
  const refactorStrategyHelper = (t.overview as unknown as Record<string, string | undefined>).refactoringStrategyHelper;

  return `
    <div class="overview-section refactoring-strategy-section">
      <h2 class="page-section-title section-title-caps">${escapeHtml(t.overview.refactoringStrategy)}</h2>
      ${refactorStrategyHelper ? `<p class="section-helper text-muted">${escapeHtml(refactorStrategyHelper)}</p>` : ""}
      <ol class="refactoring-strategy-list">${listHtml}</ol>
    </div>`;
}

export function renderTopProblematicTable(
  items: Array<{
    filePath: string;
    fileName: string;
    className?: string;
    mainIssue: string;
    highestSeverity?: string;
    project?: string | null;
    lineCount?: number;
    dependencyCount?: number;
  }>,
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  const rows = items
    .slice(0, 5)
    .map(
      (item) => {
        const name = item.className || item.fileName.replace(/\.component\.ts$/, "");
        const severityClass = item.highestSeverity === "CRITICAL" ? "critical" : item.highestSeverity === "HIGH" ? "high" : "warning";
        return `
    <tr data-file-path="${escapeHtml(item.filePath)}" data-project="${escapeHtml(item.project ?? "")}">
      <td>${escapeHtml(name)}</td>
      <td>${renderBadge(item.mainIssue, "warning")}</td>
      <td class="col-loc">${item.lineCount != null ? item.lineCount : "—"}</td>
      <td class="col-deps">${item.dependencyCount != null ? item.dependencyCount : "—"}</td>
      <td>${item.highestSeverity ? renderBadge(item.highestSeverity, severityClass as "critical" | "high" | "warning") : "—"}</td>
      <td><button type="button" class="view-details-btn" data-file-path="${escapeHtml(item.filePath)}">${escapeHtml(t.actions.viewDetails)}</button></td>
    </tr>`;
      }
    )
    .join("");

  const ov = t.overview as unknown as Record<string, string | undefined>;
  const topProbHelper = ov.topProblematicHelper;
  const tableHeaderHelper = ov.tableHeaderHelper;
  return `
    <div class="overview-section">
      <h2 class="page-section-title section-title-caps">${escapeHtml(t.overview.topProblematic)}</h2>
      ${topProbHelper ? `<p class="section-helper text-muted">${escapeHtml(topProbHelper)}</p>` : ""}
      <div class="top-problematic-table-wrap">
        <table class="top-problematic-table">
          <thead><tr><th>${escapeHtml(t.components.component)}</th><th>${escapeHtml(t.components.mainIssue)}</th><th title="${escapeHtml(tableHeaderHelper ?? "LOC = lines of code; Deps = constructor dependencies")}">LOC</th><th>Deps</th><th>${escapeHtml(t.components.risk)}</th><th>${escapeHtml(t.components.action)}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderOverviewSummaryCards(scores: Scores, t: Translations): string {
  const overallCls = scores.overall >= 7 ? "good" : scores.overall >= 5 ? "medium" : "bad";
  const componentCls = scores.component.score >= 7 ? "good" : scores.component.score >= 5 ? "medium" : "bad";
  const templateCls = scores.template.score >= 7 ? "good" : scores.template.score >= 5 ? "medium" : "bad";
  const lifecycleCls = scores.lifecycle.score >= 7 ? "good" : scores.lifecycle.score >= 5 ? "medium" : "bad";

  const hint = (explained: ExplainedScore) =>
    explained.factors.length > 0
      ? explained.factors[0].description
      : "";

  const cards = [
    { label: t.scores.overallHealth, value: scores.overall, cls: overallCls, hint: "" },
    { label: t.scores.componentQuality, value: scores.component.score, cls: componentCls, hint: hint(scores.component) },
    { label: t.scores.templateComplexity, value: scores.template.score, cls: templateCls, hint: hint(scores.template) },
    { label: t.scores.lifecycleCleanup, value: scores.lifecycle.score, cls: lifecycleCls, hint: hint(scores.lifecycle) },
  ];

  const cardHtml = cards
    .map(
      (c) => `
    <div class="dashboard-summary-card">
      <div class="dashboard-summary-label">${escapeHtml(c.label)}</div>
      <div class="dashboard-summary-value ${c.cls}">${c.value.toFixed(1)}/10</div>
      <div class="dashboard-summary-bar"><div class="dashboard-summary-bar-fill ${c.cls}" style="width:${(c.value / 10) * 100}%"></div></div>
      ${c.hint ? `<div class="dashboard-summary-hint">${escapeHtml(c.hint)}</div>` : ""}
    </div>`
    )
    .join("");

  return `<div class="dashboard-summary-cards">${cardHtml}</div>`;
}

export function renderScoreCard(label: string, value: number, max = 10): string {
  const cls =
    value >= 7 ? "good" : value >= 5 ? "medium" : "bad";
  return `
    <div class="score-card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value ${cls}">${value.toFixed(1)}/${max}</div>
    </div>`;
}

export function renderScoreCards(scores: Scores): string {
  const cards = [
    renderScoreCard("Overall", scores.overall),
    renderScoreCard("Component", scores.component.score),
    renderScoreCard("Lifecycle", scores.lifecycle.score),
    renderScoreCard("Template", scores.template.score),
    renderScoreCard("Responsibility", scores.responsibility.score),
  ];
  return `<div class="score-cards">${cards.join("")}</div>`;
}

export function renderDashboardCard(
  label: string,
  value: string,
  valueClass: "good" | "medium" | "bad" | "high" | "low",
  asBadge = false
): string {
  const valueHtml = asBadge
    ? `<span class="risk-badge ${valueClass}">${escapeHtml(value)}</span>`
    : escapeHtml(value);
  const cardClass = asBadge ? "dashboard-card dashboard-card-badge" : "dashboard-card";
  return `
    <div class="${cardClass}">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value ${valueClass}">${valueHtml}</div>
    </div>`;
}

export function renderDashboardCards(scores: Scores, riskLevel: string): string {
  const componentScore = scores.component.score;
  const lifecycleScore = scores.lifecycle.score;
  const templateScore = scores.template.score;
  const responsibilityScore = scores.responsibility.score;

  const overallCls = scores.overall >= 7 ? "good" : scores.overall >= 5 ? "medium" : "bad";
  const componentCls = componentScore >= 7 ? "good" : componentScore >= 5 ? "medium" : "bad";
  const lifecycleCls = lifecycleScore >= 7 ? "good" : lifecycleScore >= 5 ? "medium" : "bad";
  const templateCls = templateScore >= 7 ? "good" : templateScore >= 5 ? "medium" : "bad";
  const responsibilityCls = responsibilityScore >= 7 ? "good" : responsibilityScore >= 5 ? "medium" : "bad";
  const riskBadgeCls = /high|critical/i.test(riskLevel) ? "high" : /medium|moderate/i.test(riskLevel) ? "medium" : "low";

  const cards = [
    renderDashboardCard("Overall Score", `${scores.overall.toFixed(1)}/10`, overallCls),
    renderDashboardCard("Risk Level", riskLevel, riskBadgeCls, true),
    renderDashboardCard("Component Size", `${componentScore.toFixed(1)}/10`, componentCls),
    renderDashboardCard("Lifecycle", `${lifecycleScore.toFixed(1)}/10`, lifecycleCls),
    renderDashboardCard("Template", `${templateScore.toFixed(1)}/10`, templateCls),
    renderDashboardCard("Responsibility", `${responsibilityScore.toFixed(1)}/10`, responsibilityCls),
  ];
  return `<div class="dashboard-cards">${cards.join("")}</div>`;
}

export function renderScoreBreakdown(scoreLabel: string, explained: ExplainedScore): string {
  if (explained.factors.length === 0) {
    return `<div class="score-breakdown-item">
      <div class="score-breakdown-header">
        <span class="score-breakdown-title">${escapeHtml(scoreLabel)}</span>
        <span class="score-breakdown-score">${explained.score.toFixed(1)}/10</span>
      </div>
      <p class="score-breakdown-empty">No contributing factors.</p>
    </div>`;
  }

  const factorRows = explained.factors
    .map(
      (f) => `
    <tr class="score-breakdown-factor">
      <td class="factor-name">${escapeHtml(f.name)}</td>
      <td class="factor-weight">${(f.weight * 100).toFixed(0)}%</td>
      <td class="factor-contribution">${f.contribution >= 0 ? "+" : ""}${f.contribution.toFixed(2)}</td>
      <td class="factor-description">${escapeHtml(f.description)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="score-breakdown-item">
    <div class="score-breakdown-header">
      <span class="score-breakdown-title">${escapeHtml(scoreLabel)}</span>
      <span class="score-breakdown-score">${explained.score.toFixed(1)}/10</span>
    </div>
    <table class="score-breakdown-table">
      <thead>
        <tr>
          <th>Factor</th>
          <th>Weight</th>
          <th>Effect on Score</th>
          <th>Explanation</th>
        </tr>
      </thead>
      <tbody>${factorRows}</tbody>
    </table>
  </div>`;
}

export function renderScoreBreakdownSection(scores: Scores): string {
  const items = [
    renderScoreBreakdown("Component Size", scores.component),
    renderScoreBreakdown("Lifecycle", scores.lifecycle),
    renderScoreBreakdown("Template", scores.template),
    renderScoreBreakdown("Responsibility", scores.responsibility),
  ];
  return `
  <div class="score-breakdown-collapsible collapsible">
    <h3 class="score-breakdown-heading score-breakdown-toggle">Score Breakdown</h3>
    <div class="score-breakdown-content">
      <p class="score-breakdown-intro">Contributing factors for each score. Negative values reduce the score; positive values improve it.</p>
      <div class="score-breakdown-list">${items.join("")}</div>
    </div>
  </div>`;
}

export function renderDiagnosticSummaryItem(label: string, count: number | string): string {
  return `
    <div class="diagnostic-summary-item">
      <div class="count">${escapeHtml(String(count))}</div>
      <div class="label">${escapeHtml(label)}</div>
    </div>`;
}

export function renderDiagnosticSummaryBarItem(
  label: string,
  count: number,
  maxCount: number
): string {
  const pct = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0;
  return `
    <div class="diagnostic-summary-bar-item">
      <div class="label">${escapeHtml(label)}</div>
      <div class="count">${count} components</div>
      <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
}

export function renderChip(text: string): string {
  return `<span class="chip">${escapeHtml(text)}</span>`;
}

export function renderChipList(texts: string[]): string {
  if (texts.length === 0) return "—";
  return `<span class="chip-list">${texts.map((t) => renderChip(t)).join("")}</span>`;
}

export type TableCell = string | { __raw: string };

export function raw(html: string): { __raw: string } {
  return { __raw: html };
}

function renderCell(cell: TableCell): string {
  if (typeof cell === "object" && cell && "__raw" in cell) {
    return (cell as { __raw: string }).__raw;
  }
  return escapeHtml(String(cell));
}

export function renderTable(
  headers: string[],
  rows: TableCell[][],
  rowAttrs?: (rowIndex: number) => string,
  columnClasses?: string[]
): string {
  const th = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows.map(
    (row, i) =>
      `<tr ${rowAttrs ? rowAttrs(i) : ""}>${row
        .map(
          (cell, j) =>
            `<td${columnClasses?.[j] ? ` class="${escapeHtml(columnClasses[j])}"` : ""}>${renderCell(cell)}</td>`
        )
        .join("")}</tr>`
  );
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${th}</tr></thead>
        <tbody>${trs.join("")}</tbody>
      </table>
    </div>`;
}

export function renderBadge(text: string, severity: "critical" | "high" | "warning" | "low" | "info"): string {
  return `<span class="badge ${severity}">${escapeHtml(text)}</span>`;
}

export function renderSmellBadge(text: string): string {
  return `<span class="badge badge-smell">${escapeHtml(text)}</span>`;
}

export interface ComponentExplorerRowInput {
  filePath: string;
  fileName: string;
  className?: string;
  lineCount?: number | null;
  lineCountStatus?: "known" | "zero" | "unknown";
  dependencyCount?: number | null;
  dependencyCountStatus?: "known" | "zero" | "unknown";
  dominantIssue?: string | null;
  highestSeverity?: string;
  componentRole?: string;
  roleConfidence?: number;
  sourceRoot?: string | null;
  inferredFeatureArea?: string | null;
  templateLineCount?: number | null;
  templateLineCountStatus?: "known" | "zero" | "unknown";
  methodCount?: number | null;
  methodCountStatus?: "known" | "zero" | "unknown";
  propertyCount?: number;
  subscriptionCount?: number | null;
  subscriptionCountStatus?: "known" | "zero" | "unknown";
  serviceOrchestrationCount?: number | null;
  serviceOrchestrationCountStatus?: "known" | "zero" | "unknown";
  totalWarningCount?: number;
  project?: string | null;
  mainIssueFormatted: string;
  summaryLine?: string;
  /** Single-line imperative action for quick scanning (from deriveDominantAction) */
  actionSuggestion?: string;
  /** Pattern/family context for row badge and detail */
  patternKey?: string | null;
  familyName?: string | null;
  isExtractionCandidate?: boolean;
  triggeredRuleIds?: string[];
  // Normalized component-level severity and risk information coming from the canonical row model.
  computedRiskScore?: number;
  computedSeverity?: CanonicalSeverityCode;
   baseSeverity?: CanonicalSeverityCode | null;
  /** measured | inferred | low. From severity resolution. */
  confidence?: "measured" | "inferred" | "low";
  anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
  anomalyReasons?: string[];
}

export function renderComponentExplorerRow(
  item: ComponentExplorerRowInput,
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  const canonicalSeverity =
    item.computedSeverity ?? normalizeSeverityCode(item.highestSeverity);
  const severityClass = severityCodeToClass(canonicalSeverity);
  const isNoIssue =
    item.mainIssueFormatted && isNoDominantIssue(item.mainIssueFormatted);

  // Smell badge logic:
  // - Keep explicit dominant issues as-is.
  // - Use plain "No dominant issue" only for genuinely low-signal / low-risk rows.
  // - For high/critical rows where risk is inferred from multiple rules, surface
  //   combined-signal copy instead of the ambiguous "No dominant issue".
  let smellBadge = "";
  if (item.mainIssueFormatted) {
    const hasDominant =
      !!item.dominantIssue && !isNoDominantIssue(item.mainIssueFormatted);
    if (hasDominant) {
      smellBadge = renderBadge(item.mainIssueFormatted, "warning");
    } else if (isNoIssue) {
      const warnings = item.totalWarningCount ?? 0;
      const rulesCount = (item.triggeredRuleIds ?? []).length;
      const isHighOrCritical =
        canonicalSeverity === "HIGH" || canonicalSeverity === "CRITICAL";
      const isSeverityInferred =
        (item.confidence ?? (item.anomalyFlag === "severity-missing-with-critical-rules" ? "inferred" : "measured")) === "inferred";
      const componentsText = t.components as Record<string, string | undefined>;

      if (
        canonicalSeverity === "LOW" &&
        warnings === 0 &&
        rulesCount === 0 &&
        !isSeverityInferred
      ) {
        // Healthy / low-signal component: keep the simple label.
        smellBadge = renderBadge(
          componentsText.noDominantIssue ?? t.drawer.noDominantIssue,
          "info"
        );
      } else if (isHighOrCritical && rulesCount >= 2 && isSeverityInferred) {
        // High/critical severity inferred from multiple rules with no single dominant issue.
        smellBadge = renderBadge(
          componentsText.riskFromCombinedSignals ??
            "Risk comes from combined signals",
          "warning"
        );
      } else if (isHighOrCritical && rulesCount >= 2 && !isSeverityInferred) {
        // High/critical with a strong multi-rule signal but no clear dominant issue.
        smellBadge = renderBadge(
          componentsText.noSingleDominantButMultiRule ??
            "No single dominant issue, but multiple rules elevate risk",
          "warning"
        );
      } else if (warnings > 0 || rulesCount > 0) {
        // Non-low rows with some risk signals but no dominant issue – be explicit.
        smellBadge = renderBadge(
          componentsText.noSingleDominantIssue ??
            "No single dominant issue",
          "info"
        );
      } else {
        // Fallback to the legacy label if nothing else matches.
        smellBadge = renderBadge(
          componentsText.noDominantIssue ?? t.drawer.noDominantIssue,
          "info"
        );
      }
    }
  }

  const severityLabelKey = severityClass;
  const severityLabel = (t.severity as Record<string, string>)[severityLabelKey] ?? canonicalSeverity;
  const severityPill = `<span class="severity-pill severity-pill-${severityClass}">${escapeHtml(severityLabel)}</span>`;
  const componentsText = t.components as Record<string, string | undefined>;
  const displayName = item.className || item.fileName.replace(/\.component\.ts$/, "");
  const searchText = [displayName, item.className ?? "", item.filePath].filter(Boolean).join(" ").toLowerCase();
  const severityOrder = { CRITICAL: 3, HIGH: 2, WARNING: 1, LOW: 0 } as const;
  const riskScore =
    typeof item.computedRiskScore === "number"
      ? item.computedRiskScore
      : severityOrder[canonicalSeverity];
  const issueTypeAttr = item.dominantIssue && item.dominantIssue.trim() ? item.dominantIssue : "NO_DOMINANT_ISSUE";
  const ruleIdsAttr = (item.triggeredRuleIds ?? []).length > 0
    ? `data-rule-ids="${escapeHtml((item.triggeredRuleIds ?? []).join(" "))}"`
    : "";
  const lineCountAttr = item.lineCount != null ? String(item.lineCount) : "";
  const dependencyCountAttr = item.dependencyCount != null ? String(item.dependencyCount) : "";
  const templateLinesAttr = item.templateLineCount != null ? String(item.templateLineCount) : "";
  const warningCountAttr = item.totalWarningCount != null ? String(item.totalWarningCount) : "0";
  const anomalyAttr = item.anomalyFlag ?? "none";
  const confidenceAttr = item.confidence ?? (item.anomalyFlag === "severity-missing-with-critical-rules" ? "inferred" : item.anomalyFlag === "metrics-missing-with-warnings" ? "low" : "measured");
  const anomalyReasonsAttr = (item.anomalyReasons ?? []).join("; ");

  const patternKeyAttr = item.patternKey && item.patternKey !== "NO_DOMINANT_ISSUE" ? `data-pattern-key="${escapeHtml(item.patternKey)}"` : "";
  const dataAttrs = [
    `data-file-path="${escapeHtml(item.filePath)}"`,
    `data-project="${escapeHtml(item.project ?? "")}"`,
    `data-issue-type="${escapeHtml(issueTypeAttr)}"`,
    patternKeyAttr,
    `data-severity="${escapeHtml(canonicalSeverity)}"`,
    `data-component-role="${escapeHtml(item.componentRole ?? "")}"`,
    `data-search="${escapeHtml(searchText)}"`,
    `data-line-count="${escapeHtml(lineCountAttr)}"`,
    `data-dependency-count="${escapeHtml(dependencyCountAttr)}"`,
    `data-template-lines="${escapeHtml(templateLinesAttr)}"`,
    `data-warning-count="${escapeHtml(warningCountAttr)}"`,
    `data-risk-score="${riskScore}"`,
    `data-name="${escapeHtml(displayName.toLowerCase())}"`,
    `data-anomaly="${escapeHtml(anomalyAttr)}"`,
    `data-confidence="${escapeHtml(confidenceAttr)}"`,
    anomalyReasonsAttr ? `data-anomaly-reasons="${escapeHtml(anomalyReasonsAttr)}"` : "",
    ruleIdsAttr,
  ].filter(Boolean).join(" ");
  const actionText = item.actionSuggestion ?? (item.summaryLine ? (item.summaryLine.length > 65 ? item.summaryLine.substring(0, 65) + "…" : item.summaryLine) : "");
  const familyBadge =
    item.familyName
      ? `<span class="comp-row-family-badge">${escapeHtml((t.components as Record<string, string>).partOfFamily ?? "Part of")} ${escapeHtml(item.familyName)}</span>`
      : item.isExtractionCandidate
        ? `<span class="comp-row-family-badge">${escapeHtml((t.components as Record<string, string>).sharedRefactorOpportunity ?? "Shared refactor opportunity")}</span>`
        : "";
  const viewDetailsLabel = (t.actions as Record<string, string>).viewDetails ?? "View Details";
  const nameTitle = escapeHtml(item.filePath);
  return `
    <div class="component-explorer-row component-explorer-row-compact severity-${severityClass}" ${dataAttrs} role="button" tabindex="0">
      <div class="comp-row-primary">
        <span class="comp-row-name" title="${nameTitle}">${escapeHtml(displayName)}</span>
      </div>
      <div class="comp-row-smell">
        ${smellBadge}
        ${severityPill}
      </div>
      <div class="comp-row-summary">
        ${actionText ? `<span class="component-explorer-action">${escapeHtml(actionText)}</span>` : ""}
        ${familyBadge}
      </div>
      <div class="comp-row-action">
        <button type="button" class="view-details-btn component-explorer-view-btn" data-file-path="${escapeHtml(item.filePath)}">${escapeHtml(viewDetailsLabel)}</button>
      </div>
    </div>`;
}

export function renderComponentExplorerList(
  items: ComponentExplorerRowInput[],
  formatIssue: (issue: string | null) => string,
  t: Translations
): string {
  if (items.length === 0) return "";
  return `<div class="component-explorer-list">${items.map((i) => renderComponentExplorerRow(i, formatIssue, t)).join("")}</div>`;
}

export function renderComponentsSummaryStrip(
  showing: number,
  total: number,
  criticalCount: number,
  highCount: number,
  dominantLabel: string,
  sourceLabel: string,
  t: Translations,
  range?: { start: number; end: number }
): string {
  const parts: string[] = [];
  const summaryShowing = (t.components as Record<string, string>).summaryShowing ?? "Showing";
  const summaryOf = (t.components as Record<string, string>).summaryOf ?? "of";
  const summaryRange = (t.components as Record<string, string>).summaryRange ?? "Showing {start}-{end} of {total}";
  const criticalLabel = (t.components as Record<string, string>).critical ?? "critical";
  const highLabel = (t.components as Record<string, string>).high ?? "high";
  if (range) {
    parts.push(summaryRange.replace("{start}", String(range.start)).replace("{end}", String(range.end)).replace("{total}", String(total)) + " components");
  } else {
    parts.push(`${summaryShowing} ${showing} ${summaryOf} ${total} components`);
  }
  if (criticalCount > 0 || highCount > 0) {
    const severityParts: string[] = [];
    if (criticalCount > 0) severityParts.push(`${criticalCount} ${criticalLabel}`);
    if (highCount > 0) severityParts.push(`${highCount} ${highLabel}`);
    parts.push(severityParts.join(" · "));
  }
  if (dominantLabel) parts.push(`Dominant: ${dominantLabel}`);
  if (sourceLabel) parts.push(`Source: ${sourceLabel}`);
  return `<div class="components-summary-strip">${parts.join(" · ")}</div>`;
}

export function renderSection(
  id: string,
  title: string,
  content: string,
  collapsible = false,
  description?: string,
  isPlannerSection = false
): string {
  const collClass = collapsible ? " collapsible" : "";
  const titleClass = isPlannerSection ? "section-title section-title-planner" : "section-title";
  const descHtml = description
    ? isPlannerSection
      ? `<p class="section-subtitle">${escapeHtml(description)}</p>`
      : `<p class="section-description">${escapeHtml(description)}</p>`
    : "";
  return `
    <section id="${escapeHtml(id)}" class="section${collClass}" data-section="${escapeHtml(id)}">
      <h2 class="${titleClass}">${escapeHtml(title)}</h2>
      ${descHtml}
      <div class="section-content">${content}</div>
    </section>`;
}

export function renderCard(
  title: string,
  meta: string,
  body: string,
  dataAttrs?: Record<string, string>
): string {
  const attrs = dataAttrs
    ? Object.entries(dataAttrs)
        .map(([k, v]) => `data-${k}="${escapeHtml(v)}"`)
        .join(" ")
    : "";
  return `
    <div class="card" ${attrs}>
      <div class="card-title">${escapeHtml(title)}</div>
      <div class="card-meta">${escapeHtml(meta)}</div>
      <div class="card-body">${body}</div>
    </div>`;
}

export function renderFamilyCard(
  familyName: string,
  memberCount: number,
  commonIssue: string | null,
  members: string[],
  refactorDirection: string,
  dataProject?: string,
  dataIssueType?: string
): string {
  const meta = commonIssue
    ? `${memberCount} components · ${escapeHtml(commonIssue)}`
    : `${memberCount} components`;
  const memberList = members
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");
  const attrs = [
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
    dataIssueType ? `data-issue-type="${escapeHtml(dataIssueType)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="family-card" ${attrs}>
      <div class="family-name">${escapeHtml(familyName)}</div>
      <div class="family-meta">${meta}</div>
      <ul class="members">${memberList}</ul>
      <div class="refactor">${escapeHtml(refactorDirection)}</div>
    </div>`;
}

export interface ExtractionCardOptions {
  isWeakGrouping?: boolean;
  weakGroupingLabel?: string;
  representativeEvidence?: string[];
  outliers?: Array<{ fileName: string }>;
}

export function renderSimilarFamilyCard(
  familyName: string,
  memberCount: number,
  commonIssue: string | null,
  commonWarnings: string[],
  refactorDirection: string,
  members: string[],
  dataProject?: string,
  dataIssueType?: string,
  detectedRolePattern?: string,
  options?: ExtractionCardOptions
): string {
  const meta = commonIssue
    ? `${memberCount} components · ${escapeHtml(commonIssue)}`
    : `${memberCount} components`;
  const memberList = members
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");
  const warningChips = commonWarnings.length > 0 ? renderChipList(commonWarnings.slice(0, 5)) : "—";
  const roleLine = detectedRolePattern
    ? `<div class="family-role"><strong>Detected Role:</strong> ${escapeHtml(detectedRolePattern)}</div>`
    : "";
  const weakBadge =
    options?.isWeakGrouping && options?.weakGroupingLabel
      ? `<div class="family-weak-badge" title="Review similarity before extraction">${escapeHtml(options.weakGroupingLabel)}</div>`
      : "";
  const outlierHtml =
    options?.outliers && options.outliers.length > 0
      ? `<div class="family-outliers"><strong>Review:</strong> May not belong: ${options.outliers
          .map((o) => escapeHtml(o.fileName))
          .join(", ")}</div>`
      : "";
  const attrs = [
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
    dataIssueType ? `data-issue-type="${escapeHtml(dataIssueType)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="family-card ${options?.isWeakGrouping ? "family-card-weak" : ""}" ${attrs}>
      ${weakBadge}
      <div class="family-name">${escapeHtml(familyName)}</div>
      <div class="family-meta">${meta}</div>
      ${roleLine}
      <div class="family-common-warnings"><strong>Common warnings:</strong> ${warningChips}</div>
      ${outlierHtml}
      <ul class="members">${memberList}</ul>
      <div class="refactor">${escapeHtml(refactorDirection)}</div>
    </div>`;
}

export function renderExtractionCard(
  familyName: string,
  memberCount: number,
  avgLineCount: number,
  refactorDirection: string,
  dataProject?: string,
  dataIssueType?: string,
  detectedRolePattern?: string,
  options?: ExtractionCardOptions
): string {
  const attrs = [
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
    dataIssueType ? `data-issue-type="${escapeHtml(dataIssueType)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const roleLine = detectedRolePattern
    ? `<div class="extraction-role"><strong>Detected Role:</strong> ${escapeHtml(detectedRolePattern)}</div>`
    : "";
  const weakBadge =
    options?.isWeakGrouping && options?.weakGroupingLabel
      ? `<div class="extraction-weak-badge" title="Review similarity before extraction">${escapeHtml(options.weakGroupingLabel)}</div>`
      : "";
  const evidenceHtml =
    options?.representativeEvidence && options.representativeEvidence.length > 0
      ? `<div class="extraction-evidence"><strong>Evidence:</strong><ul>${options.representativeEvidence
          .map((e) => `<li>${escapeHtml(e)}</li>`)
          .join("")}</ul></div>`
      : "";
  const outlierHtml =
    options?.outliers && options.outliers.length > 0
      ? `<div class="extraction-outliers"><strong>Review:</strong> May not belong: ${options.outliers
          .map((o) => escapeHtml(o.fileName))
          .join(", ")}</div>`
      : "";
  return `
    <div class="extraction-card ${options?.isWeakGrouping ? "extraction-card-weak" : ""}" ${attrs}>
      ${weakBadge}
      <div class="extraction-family">${escapeHtml(familyName)}</div>
      <div class="extraction-meta">${memberCount} components · Avg ${avgLineCount} lines</div>
      ${roleLine}
      ${evidenceHtml}
      ${outlierHtml}
      <div class="extraction-suggestion">${escapeHtml(refactorDirection)}</div>
    </div>`;
}

export interface PatternSummaryZoneInput {
  result: import("../../core/scan-result").ScanResult;
  sections: { id: string; items?: unknown[] }[];
  formatIssue: (issue: string | null) => string;
  t: Translations;
}

export function renderPatternSummaryZone(input: PatternSummaryZoneInput): string {
  const { result, sections, formatIssue, t } = input;
  const diag = result.diagnosticSummary;
  const dc = diag.dominantIssueCounts;
  const totalComponents = diag.totalComponents;
  const withDominant = diag.componentsWithDominantIssue;
  const topRisks = diag.topCrossCuttingRisks ?? [];
  const patternExplanations = (t.patternExplanations ?? {}) as Record<
    string,
    { meaning: string; whyItMatters: string; refactorStrategy: string }
  >;

  const pt = t.patterns as {
    summaryDominant?: string;
    summaryTotalAffected?: string;
    summaryStrongestFamily?: string;
    summaryTopArea?: string;
    summaryExtractionCount?: string;
    summaryFirstAction?: string;
  };

  const dominantEntry = PATTERN_ISSUE_ORDER.map((key) => ({
    key,
    count: dc[key] ?? 0,
    name: formatIssue(key),
    pct: totalComponents > 0 ? (dc[key] ?? 0) / totalComponents : 0,
  }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const topAreaByProject = new Map<string, number>();
  const topAreaByFeature = new Map<string, number>();
  for (const r of topRisks) {
    const project = getProjectForPath(r.filePath, result.projectBreakdown);
    const area = project ?? inferFeatureFromPath(r.filePath) ?? "other";
    if (project) {
      topAreaByProject.set(project, (topAreaByProject.get(project) ?? 0) + 1);
    }
    topAreaByFeature.set(area, (topAreaByFeature.get(area) ?? 0) + 1);
  }
  const topProject =
    Array.from(topAreaByProject.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topFeature =
    Array.from(topAreaByFeature.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topArea = formatAreaLabelForDisplay(topProject ?? topFeature ?? null) ?? "—";

  const featureSection = sections.find((s) => s.id === "feature-patterns");
  const archSection = sections.find((s) => s.id === "architecture-patterns");
  const featureItems = (featureSection?.items ?? []) as Array<{ duplicationRisk?: string }>;
  const archItems = (archSection?.items ?? []) as unknown[];
  const extractionCount =
    featureItems.filter((p) => p.duplicationRisk === "high").length + archItems.length;

  const firstAction = dominantEntry
    ? (() => {
        const expl = patternExplanations[dominantEntry.key];
        const strategy = expl?.refactorStrategy ?? "";
        const firstSentence = strategy.split(/[;.]/)[0]?.trim() ?? strategy;
        return firstSentence || "—";
      })()
    : "—";

  const items: string[] = [];
  if (dominantEntry) {
    const dominantLabel = pt.summaryDominant ?? "Dominant pattern";
    items.push(
      `<div class="pattern-summary-item"><span class="pattern-summary-label">${escapeHtml(dominantLabel)}</span><span class="pattern-summary-value">${escapeHtml(dominantEntry.name)} (${dominantEntry.count})</span></div>`
    );
  }
  const totalLabel = pt.summaryTotalAffected ?? "Total affected";
  items.push(
    `<div class="pattern-summary-item"><span class="pattern-summary-label">${escapeHtml(totalLabel)}</span><span class="pattern-summary-value">${withDominant} components</span></div>`
  );
  if (dominantEntry) {
    const strongestLabel = pt.summaryStrongestFamily ?? "Strongest family";
    const pct = Math.round(dominantEntry.pct * 100);
    items.push(
      `<div class="pattern-summary-item"><span class="pattern-summary-label">${escapeHtml(strongestLabel)}</span><span class="pattern-summary-value">${escapeHtml(dominantEntry.name)} (${pct}%)</span></div>`
    );
  }
  const areaLabel = (pt as { mostAffectedForPattern?: string }).mostAffectedForPattern ?? pt.summaryTopArea ?? "Most affected area for this pattern";
  items.push(
    `<div class="pattern-summary-item"><span class="pattern-summary-label">${escapeHtml(areaLabel)}</span><span class="pattern-summary-value">${escapeHtml(String(topArea))}</span></div>`
  );
  const extractionLabel = pt.summaryExtractionCount ?? "Extraction opportunities";
  items.push(
    `<div class="pattern-summary-item"><span class="pattern-summary-label">${escapeHtml(extractionLabel)}</span><span class="pattern-summary-value">${extractionCount}</span></div>`
  );
  const firstActionLabel = pt.summaryFirstAction ?? "First action";
  items.push(
    `<div class="pattern-summary-item pattern-summary-action"><span class="pattern-summary-label">${escapeHtml(firstActionLabel)}</span><span class="pattern-summary-value">${escapeHtml(firstAction)}</span></div>`
  );

  return `<div class="pattern-summary-zone">${items.join("")}</div>`;
}

const PATTERN_ISSUE_ORDER = [
  "TEMPLATE_HEAVY_COMPONENT",
  "GOD_COMPONENT",
  "CLEANUP_RISK_COMPONENT",
  "ORCHESTRATION_HEAVY_COMPONENT",
  "LIFECYCLE_RISKY_COMPONENT",
] as const;

const PATTERN_IMPACT_COLORS: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "template",
  GOD_COMPONENT: "god",
  CLEANUP_RISK_COMPONENT: "cleanup",
  ORCHESTRATION_HEAVY_COMPONENT: "orchestration",
  LIFECYCLE_RISKY_COMPONENT: "lifecycle",
};

export function renderPatternOverviewCard(input: {
  patternKey: string;
  patternName: string;
  count: number;
  totalComponents: number;
  shortExplanation: string;
  exploreLabel: string;
  impactLabel: string;
  impactLevel: "low" | "medium" | "high";
  mostAffectedArea?: string;
  /** Label for pattern-level affected area (e.g. "Most affected area for this pattern") */
  mostAffectedAreaLabel?: string;
  firstActionSuggestion?: string;
  topExampleComponent?: string;
  isPrimary?: boolean;
}): string {
  const pct = input.totalComponents > 0 ? Math.round((input.count / input.totalComponents) * 100) : 0;
  const colorClass = PATTERN_IMPACT_COLORS[input.patternKey] ?? "";
  const primaryClass = input.isPrimary ? " pattern-card-primary" : "";
  const areaLabel = input.mostAffectedAreaLabel ?? "Most affected area for this pattern";
  const areaHtml = input.mostAffectedArea
    ? `<div class="pattern-card-area">${escapeHtml(areaLabel)}: ${escapeHtml(formatAreaLabelForDisplay(input.mostAffectedArea) ?? input.mostAffectedArea)}</div>`
    : "";
  const actionHtml = input.firstActionSuggestion
    ? `<div class="pattern-card-action">First action: ${escapeHtml(input.firstActionSuggestion)}</div>`
    : "";
  const exampleHtml = input.topExampleComponent
    ? `<div class="pattern-card-example">Example: ${escapeHtml(input.topExampleComponent)}</div>`
    : "";
  return `
    <div class="pattern-card pattern-card-impact-${input.impactLevel} ${colorClass ? `pattern-card-color-${colorClass}` : ""}${primaryClass}">
      <div class="pattern-card-header">
        <div class="pattern-card-title">${escapeHtml(input.patternName)}</div>
        <div class="pattern-card-impact-badge">${escapeHtml(input.impactLabel)}</div>
      </div>
      <div class="pattern-card-meta">
        <span class="pattern-card-count">${input.count} components</span>
        <span class="pattern-card-pct">${pct}% of workspace</span>
      </div>
      ${areaHtml}
      ${actionHtml}
      ${exampleHtml}
      <div class="pattern-card-explanation">${escapeHtml(input.shortExplanation)}</div>
      <button type="button" class="pattern-explore-btn btn-secondary" data-pattern-key="${escapeHtml(input.patternKey)}">${escapeHtml(input.exploreLabel)}</button>
    </div>`;
}

function getImpactLevel(pct: number): "low" | "medium" | "high" {
  if (pct <= 5) return "low";
  if (pct <= 15) return "medium";
  return "high";
}

export interface PatternOverviewGridInput {
  dominantIssueCounts: Record<string, number>;
  totalComponents: number;
  formatIssue: (issue: string | null) => string;
  t: Translations;
  result?: import("../../core/scan-result").ScanResult;
}

export function renderPatternOverviewGrid(
  input: PatternOverviewGridInput | Record<string, number>,
  totalComponents?: number,
  formatIssue?: (issue: string | null) => string,
  t?: Translations
): string {
  const normalized: PatternOverviewGridInput =
    typeof (input as PatternOverviewGridInput).dominantIssueCounts === "object" &&
    (input as PatternOverviewGridInput).totalComponents != null
      ? (input as PatternOverviewGridInput)
      : {
          dominantIssueCounts: input as Record<string, number>,
          totalComponents: totalComponents ?? 0,
          formatIssue: formatIssue ?? (() => ""),
          t: t ?? ({} as Translations),
        };
  const { dominantIssueCounts, totalComponents: total, formatIssue: fmt, t: trans, result } = normalized;
  const shortExpl = (trans.patterns as { shortExplanation?: Record<string, string> }).shortExplanation ?? {};
  const impactLabels = {
    low: (trans.patterns as { impactLow?: string }).impactLow ?? "Low",
    medium: (trans.patterns as { impactMedium?: string }).impactMedium ?? "Medium",
    high: (trans.patterns as { impactHigh?: string }).impactHigh ?? "High",
  };
  const patternExplanations = (trans.patternExplanations ?? {}) as Record<
    string,
    { refactorStrategy: string }
  >;
  const diagnostics = result?.diagnosticSummary?.componentDiagnostics ?? result?.diagnosticSummary?.topCrossCuttingRisks ?? [];
  const projectBreakdown = result?.projectBreakdown ?? [];

  const entries = PATTERN_ISSUE_ORDER.map((key) => {
    const count = dominantIssueCounts[key] ?? 0;
    const pct = total > 0 ? (count / total) * 100 : 0;
    const matching = diagnostics.filter((d) => d.dominantIssue === key);
    const areaCounts = new Map<string, number>();
    for (const d of matching) {
      const fp = (d as { filePath?: string }).filePath;
      if (fp) {
        const area = getProjectForPath(fp, projectBreakdown) ?? inferFeatureFromPath(fp) ?? "other";
        areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
      }
    }
    const rawTopArea = Array.from(areaCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topArea = rawTopArea ? formatAreaLabelForDisplay(rawTopArea) : undefined;
    const expl = patternExplanations[key];
    const strategy = expl?.refactorStrategy ?? "";
    const firstAction = strategy.split(/[;.]/)[0]?.trim() ?? undefined;
    const topExample = matching[0]
      ? ((matching[0] as { className?: string }).className ??
        ((matching[0] as { fileName?: string }).fileName ?? "").replace(/\.component\.ts$/i, "").replace(/[-.]/g, " "))
      : undefined;
    return {
      key,
      count,
      name: fmt(key),
      shortExplanation: shortExpl[key] ?? (trans.overview?.issueExplanation as Record<string, string>)?.[key] ?? "",
      impactLevel: getImpactLevel(pct),
      impactLabel: impactLabels[getImpactLevel(pct)],
      mostAffectedArea: topArea,
      firstActionSuggestion: firstAction,
      topExampleComponent: topExample,
    };
  }).filter((e) => e.count > 0);

  const maxPct = entries.length > 0 ? Math.max(...entries.map((e) => (e.count / total) * 100)) : 0;
  const primaryKey = entries.find((e) => (e.count / total) * 100 === maxPct)?.key;

  if (entries.length === 0) return "";
  const exploreLabel = (trans.patterns as { explore?: string }).explore ?? "Explore";
  const mostAffectedAreaLabel = (trans.overview as { mostAffectedForPattern?: string }).mostAffectedForPattern ?? "Most affected area for this pattern";
  return `<div class="pattern-overview-grid">${entries
    .map((e) =>
      renderPatternOverviewCard({
        patternKey: e.key,
        patternName: e.name,
        count: e.count,
        totalComponents: total,
        shortExplanation: e.shortExplanation,
        exploreLabel,
        impactLabel: e.impactLabel,
        impactLevel: e.impactLevel,
        mostAffectedArea: e.mostAffectedArea,
        mostAffectedAreaLabel,
        firstActionSuggestion: e.firstActionSuggestion,
        topExampleComponent: e.topExampleComponent,
        isPrimary: e.key === primaryKey,
      })
    )
    .join("")}</div>`;
}

export interface PatternComponentEvidence {
  templateLines?: number;
  eventBindings?: number;
  structuralDirectives?: number;
  dependencyCount?: number;
  lineCount?: number;
  subscribeCount?: number;
  riskySubscribeCount?: number;
  addEventListenerCount?: number;
  serviceOrchestrationCount?: number;
  methodCount?: number;
  propertyCount?: number;
}

const PATTERN_CHIP_CONFIG: Record<
  string,
  Array<{ key: keyof PatternComponentEvidence; label: string }>
> = {
  CLEANUP_RISK_COMPONENT: [
    { key: "subscribeCount", label: "Subs" },
    { key: "riskySubscribeCount", label: "Risky subs" },
    { key: "addEventListenerCount", label: "Listeners" },
  ],
  ORCHESTRATION_HEAVY_COMPONENT: [
    { key: "dependencyCount", label: "Deps" },
    { key: "serviceOrchestrationCount", label: "Orchestration" },
  ],
  GOD_COMPONENT: [
    { key: "methodCount", label: "Methods" },
    { key: "propertyCount", label: "Props" },
    { key: "dependencyCount", label: "Deps" },
    { key: "templateLines", label: "Template" },
  ],
  TEMPLATE_HEAVY_COMPONENT: [
    { key: "templateLines", label: "Template" },
    { key: "eventBindings", label: "Event bindings" },
    { key: "structuralDirectives", label: "Structural" },
  ],
  LIFECYCLE_RISKY_COMPONENT: [
    { key: "subscribeCount", label: "Subs" },
    { key: "riskySubscribeCount", label: "Risky subs" },
    { key: "addEventListenerCount", label: "Listeners" },
  ],
};

const FALLBACK_CHIP_KEYS: Array<keyof PatternComponentEvidence> = [
  "lineCount",
  "dependencyCount",
  "templateLines",
  "eventBindings",
  "structuralDirectives",
];

const STRUCTURE_CONCERN_TO_LABEL: Record<string, string> = {
  "deep-nesting": "Deep Nesting",
  "shared-dumping-risk": "Shared Dumping Risk",
  "generic-folder-overuse": "Generic Folder Overuse",
  "suspicious-placement": "Suspicious Placement",
  "feature-boundary-blur": "Feature Boundary Blur",
  "folder-density-concern": "Folder Density",
};

export function renderPatternDrawerContent(input: {
  patternName: string;
  patternKey?: string;
  meaning: string;
  whyItMatters: string;
  refactorStrategy: string;
  components: Array<{
    filePath: string;
    className?: string;
    fileName: string;
    evidence: PatternComponentEvidence;
  }>;
  t: Translations;
  affectedArea?: string;
  extractionType?: string;
  architecturalPayoff?: string;
  relatedStructureConcerns?: string[];
}): string {
  const dt = input.t;
  const pt = dt.patterns as {
    meaning?: string;
    whyItMatters?: string;
    refactorStrategy?: string;
    componentsInPattern?: string;
    drawerLinesLabel?: string;
    clickComponentToViewDetails?: string;
  };
  const meaningLabel = pt.meaning ?? "Meaning";
  const whyLabel = pt.whyItMatters ?? "Why it matters";
  const strategyLabel = pt.refactorStrategy ?? "Refactor strategy";
  const componentsLabel = pt.componentsInPattern ?? "Components in this pattern";
  const clickHint = pt.clickComponentToViewDetails ?? "Click a component to view details.";
  const templateLinesLabel = "Template lines";
  const eventBindingsLabel = "Event bindings";
  const structuralLabel = "Structural directives";
  const dependencyLabel = "Dependencies";
  const linesLabel = pt.drawerLinesLabel ?? "Lines";

  const chipConfig =
    input.patternKey && PATTERN_CHIP_CONFIG[input.patternKey]
      ? PATTERN_CHIP_CONFIG[input.patternKey]
      : FALLBACK_CHIP_KEYS.map((k) => ({
          key: k,
          label:
            k === "lineCount"
              ? linesLabel
              : k === "dependencyCount"
                ? dependencyLabel
                : k === "templateLines"
                  ? templateLinesLabel
                  : k === "eventBindings"
                    ? eventBindingsLabel
                    : structuralLabel,
        }));

  const getEvidenceParts = (evidence: PatternComponentEvidence): string[] => {
    const parts: string[] = [];
    for (const { key, label } of chipConfig) {
      const val = evidence[key];
      if (val != null && typeof val === "number") parts.push(`${label}: ${val}`);
    }
    return parts;
  };

  const openAffectedLabel = (dt.patterns as { ctaOpenAffectedComponents?: string }).ctaOpenAffectedComponents ?? (dt.patterns as { ctaOpenInComponents?: string }).ctaOpenInComponents ?? "Open affected components";
  const openRefactorLabel = (dt.patterns as { ctaOpenRefactorTargets?: string }).ctaOpenRefactorTargets ?? "Open refactor targets";
  const copyMigrationLabel = (dt.patterns as { ctaCopyMigrationStrategy?: string }).ctaCopyMigrationStrategy ?? (dt.patterns as { ctaCopyStrategy?: string }).ctaCopyStrategy ?? "Copy migration strategy";
  const affectedAreaLabel = (dt.patterns as { affectedArea?: string }).affectedArea ?? "Affected area";
  const extractionTypeLabel = (dt.patterns as { extractionType?: string }).extractionType ?? "Extraction type";
  const architecturalPayoffLabel = (dt.patterns as { architecturalPayoff?: string }).architecturalPayoff ?? "Architectural payoff";
  const relatedStructureLabel = (dt.patterns as { relatedStructureIssues?: string }).relatedStructureIssues ?? "Related structure issues";
  const patternKeyAttr = input.patternKey ? ` data-pattern-key="${escapeHtml(input.patternKey)}"` : "";

  const quickSummary = `${input.meaning} ${input.whyItMatters}`.slice(0, 180).trim() + (input.meaning.length + input.whyItMatters.length > 180 ? "…" : "");
  const migrationStrategy = [input.refactorStrategy, input.architecturalPayoff].filter(Boolean).join("\n\n");

  let html = `<div class="pattern-drawer-quick-summary">${escapeHtml(quickSummary)}</div>`;
  html += `
    <div class="pattern-drawer-explanation pattern-drawer-compact">
      <div class="pattern-drawer-section">
        <div class="pattern-drawer-section-title">${escapeHtml(whyLabel)}</div>
        <p>${escapeHtml(input.whyItMatters)}</p>
      </div>`;
  if (input.affectedArea || input.extractionType || input.architecturalPayoff) {
    html += `<div class="pattern-drawer-section pattern-drawer-scope">`;
    if (input.affectedArea) {
      html += `<div class="pattern-drawer-scope-row"><strong>${escapeHtml(affectedAreaLabel)}:</strong> ${escapeHtml(input.affectedArea)}</div>`;
    }
    if (input.extractionType) {
      html += `<div class="pattern-drawer-scope-row"><strong>${escapeHtml(extractionTypeLabel)}:</strong> ${escapeHtml(input.extractionType.replace(/-/g, " "))}</div>`;
    }
    if (input.architecturalPayoff) {
      html += `<div class="pattern-drawer-scope-row"><strong>${escapeHtml(architecturalPayoffLabel)}:</strong> ${escapeHtml(input.architecturalPayoff)}</div>`;
    }
    html += `</div>`;
  }
  html += `
      <div class="pattern-drawer-section">
        <div class="pattern-drawer-section-title">${escapeHtml(meaningLabel)}</div>
        <p>${escapeHtml(input.meaning)}</p>
      </div>
      <div class="pattern-drawer-section">
        <div class="pattern-drawer-section-title">${escapeHtml(strategyLabel)}</div>
        <p>${escapeHtml(input.refactorStrategy)}</p>
      </div>
    </div>`;
  if (input.relatedStructureConcerns && input.relatedStructureConcerns.length > 0) {
    const concernChips = input.relatedStructureConcerns
      .map((c) => STRUCTURE_CONCERN_TO_LABEL[c] ?? c.replace(/-/g, " "))
      .map((l) => `<span class="pattern-related-concern-chip">${escapeHtml(l)}</span>`)
      .join("");
    html += `<div class="pattern-drawer-section pattern-drawer-related"><div class="pattern-drawer-section-title">${escapeHtml(relatedStructureLabel)}</div><div class="pattern-related-concerns">${concernChips}</div></div>`;
  }

  const componentRows = input.components
    .map((c) => {
      const name = c.className ?? c.fileName.replace(/\.component\.ts$/i, "").replace(/[-.]/g, " ");
      const evidenceParts = getEvidenceParts(c.evidence);
      const evidenceStr = evidenceParts.length > 0 ? evidenceParts.map((p) => escapeHtml(p)).join(" · ") : "";
      const shortPath = c.filePath.split(/[/\\]/).slice(-3).join("/");
      const viewDetailsLabel = (dt.patterns as { viewDetails?: string }).viewDetails ?? "View details";
      return `
        <div class="pattern-component-row pattern-component-row-compact" data-file-path="${escapeHtml(c.filePath)}" role="button" tabindex="0" title="${escapeHtml(viewDetailsLabel)}">
          <span class="pattern-component-name">${escapeHtml(name)}</span>
          <span class="pattern-component-path" title="${escapeHtml(c.filePath)}">${escapeHtml(shortPath)}</span>
          ${evidenceStr ? `<span class="pattern-component-metrics">${evidenceStr}</span>` : ""}
          <span class="pattern-component-action">${escapeHtml(viewDetailsLabel)}</span>
        </div>`;
    })
    .join("");

  html += `
    <div class="pattern-drawer-components">
      <div class="pattern-drawer-section-title">${escapeHtml(componentsLabel)}</div>
      <p class="pattern-drawer-components-hint">${escapeHtml(clickHint)}</p>
      <div class="pattern-component-list pattern-component-list-compact">${componentRows}</div>
    </div>`;

  html += `
    <div class="pattern-drawer-cta-footer">
      <a href="#components" class="btn-primary planner-nav-link" data-nav="components" data-issue-type="${escapeHtml(input.patternKey ?? "")}"${patternKeyAttr}>${escapeHtml(openAffectedLabel)}</a>
      <a href="#planner" class="btn-secondary planner-nav-link" data-nav="planner" data-planner-section="extraction-opportunities" data-issue-type="${escapeHtml(input.patternKey ?? "")}">${escapeHtml(openRefactorLabel)}</a>
      <button type="button" class="btn-secondary pattern-copy-strategy-btn" data-strategy="${escapeHtml(migrationStrategy.replace(/\n/g, " "))}">${escapeHtml(copyMigrationLabel)}</button>
    </div>`;

  return html;
}

export function renderArchitecturePatternCard(family: {
  familyName: string;
  components: string[];
  dominantIssues: string[];
  suggestedRefactor: string;
  filePaths?: string[];
}): string {
  const componentChips = family.components
    .map((name, i) => {
      const fp = family.filePaths?.[i];
      const attrs = fp ? ` class="chip clickable" data-file-path="${escapeHtml(fp)}"` : ` class="chip"`;
      return `<span${attrs}>${escapeHtml(name)}</span>`;
    })
    .join("");
  const issueBadges = family.dominantIssues.length > 0
    ? family.dominantIssues.map((d) => renderBadge(d, "warning")).join("")
    : "—";
  return `
    <div class="architecture-pattern-card">
      <div class="architecture-pattern-header">
        <div class="architecture-pattern-name">${escapeHtml(family.familyName)}</div>
      </div>
      <div class="architecture-pattern-section">
        <strong>Components:</strong>
        <div class="chip-list">${componentChips}</div>
      </div>
      <div class="architecture-pattern-section">
        <strong>Shared problems:</strong>
        <div class="architecture-pattern-issues">${issueBadges}</div>
      </div>
      <div class="architecture-pattern-section">
        <strong>Refactor suggestion:</strong>
        <div class="architecture-pattern-refactor">${escapeHtml(family.suggestedRefactor)}</div>
      </div>
    </div>`;
}

export function renderComponentFamilyInsightCard(
  family: {
    familyName: string;
    components: Array<{ className: string; fileName: string; filePath: string; dominantIssue: string }>;
    commonSignals: string[];
    dominantIssues: string[];
    sharedRefactorOpportunity: string;
    recommendedExtractions: string[];
    confidence: number;
    confidenceBreakdown?: ConfidenceBreakdown;
  },
  t?: Translations
): string {
  const bucket = getConfidenceBucket(family.confidence);
  const confidenceBadge = renderConfidenceBadge(
    family.confidence,
    family.confidenceBreakdown,
    t ? { confidenceLabels: t.confidenceLabels, confidenceTooltips: t.confidenceTooltips, confidenceHelpText: t.confidenceHelpText } : undefined
  );
  const componentChips = family.components
    .map((c) => {
      const label = c.className || c.fileName;
      return `<span class="chip clickable" data-file-path="${escapeHtml(c.filePath)}">${escapeHtml(label)}</span>`;
    })
    .join("");
  const issueBadges =
    family.dominantIssues.length > 0
      ? family.dominantIssues.map((d) => renderBadge(d, "warning")).join("")
      : "—";
  const signalChips =
    family.commonSignals.length > 0 ? renderChipList(family.commonSignals.slice(0, 6)) : "—";
  const extractionList =
    family.recommendedExtractions.length > 0
      ? family.recommendedExtractions.map((e) => `<li>${escapeHtml(e)}</li>`).join("")
      : "<li><em>None suggested</em></li>";
  const whyMatters =
    family.sharedRefactorOpportunity ||
    getConfidenceAwareCopy("family-grouping", bucket, "family");
  const extractionHeader = getExtractionHeaderCopy(bucket);

  const sameFamilyNames = family.components.slice(0, 4).map((c) => c.className || c.fileName);
  const sameFamilyAsLabel = sameFamilyNames.length > 0
    ? (t?.patterns as { sameFamilyAsChip?: string })?.sameFamilyAsChip?.replace("{names}", sameFamilyNames.join(", ")) ??
      `Same family as: ${sameFamilyNames.join(", ")}`
    : "";
  const sharedRefactorBlock = family.sharedRefactorOpportunity
    ? `<div class="architecture-pattern-shared-refactor-highlight"><span class="badge badge-smell">${escapeHtml((t?.patterns as { sharedRefactorHighlight?: string })?.sharedRefactorHighlight ?? "Shared refactor")}</span> ${escapeHtml(family.sharedRefactorOpportunity)}</div>`
    : "";

  return `
    <div class="architecture-pattern-card pattern-card-v2 component-family-insight-card">
      <div class="architecture-pattern-header">
        <div class="architecture-pattern-name pattern-section-title">${escapeHtml(family.familyName)}</div>
        ${confidenceBadge}
        ${sameFamilyAsLabel ? `<div class="architecture-pattern-same-family-chip">${escapeHtml(sameFamilyAsLabel)}</div>` : ""}
      </div>
      ${sharedRefactorBlock}
      <div class="architecture-pattern-section pattern-section">
        <div class="pattern-section-title">Why this pattern matters</div>
        <div class="architecture-pattern-refactor">${escapeHtml(whyMatters)}</div>
      </div>
      <div class="architecture-pattern-section pattern-section">
        <div class="pattern-section-title">Candidate components</div>
        <div class="chip-list">${componentChips}</div>
      </div>
      <div class="architecture-pattern-section pattern-section">
        <div class="pattern-section-title">Dominant shared issues</div>
        <div class="architecture-pattern-issues">${issueBadges}</div>
      </div>
      <div class="architecture-pattern-section pattern-section">
        <div class="pattern-section-title">${escapeHtml(extractionHeader)}</div>
        <ul class="architecture-pattern-extractions">${extractionList}</ul>
      </div>
    </div>`;
}

export function renderFeaturePatternCard(
  p: {
    featureName: string;
    patternType: string;
    instanceCount: number;
    confidence: number;
    duplicationRisk: string;
    components: string[];
    filePaths?: string[];
    sharedSignals: string[];
    architecturalPattern: string;
    recommendation: string;
    suggestedRefactor: string[];
    sharedSignalsHelper?: string;
  },
  componentDetailsMap?: Record<
    string,
    {
      lineCount?: number;
      dependencyCount?: number;
      dominantIssue?: string | null;
      componentRole?: string;
      template?: { lineCount?: number };
      lifecycle?: { subscribeCount?: number; riskySubscribeCount?: number };
      responsibility?: { serviceOrchestrationCount?: number };
    }
  >,
  t?: { patterns?: { candidatesShort?: string; extractionAndStructure?: string; ctaSeeInRefactorPlan?: string } }
): string {
  const candidatesLabel = t?.patterns?.candidatesShort ?? "Candidates";
  const extractionLabel = t?.patterns?.extractionAndStructure ?? "Extraction & structure";
  const riskClass = p.duplicationRisk === "high" ? "high" : p.duplicationRisk === "medium" ? "medium" : "low";
  const confidencePct = Math.round(p.confidence * 100);
  const filePaths = p.filePaths ?? [];
  const hasClickableComponents = filePaths.length > 0 && filePaths.length === p.components.length;

  const formatIssueShort = (issue: string | null | undefined): string => {
    if (!issue) return "";
    return issue
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .replace(/Component$/i, "")
      .trim();
  };

  const componentList = hasClickableComponents
    ? p.components
        .map((c, i) => {
          const fp = filePaths[i];
          if (!fp) return `<li class="feature-pattern-simple-item">${escapeHtml(c)}</li>`;
          const entry = componentDetailsMap ? getComponentDetailEntry(componentDetailsMap, fp) : undefined;
          const evidenceParts: string[] = [];
          if (entry?.dominantIssue) evidenceParts.push(formatIssueShort(entry.dominantIssue));
          if (entry?.template?.lineCount != null) evidenceParts.push(`Tmpl: ${entry.template.lineCount}`);
          if (entry?.dependencyCount != null) evidenceParts.push(`Deps: ${entry.dependencyCount}`);
          const chips = evidenceParts.slice(0, 2);
          const metricsStr = chips.length > 0 ? chips.map((ep) => escapeHtml(ep)).join(" · ") : "";
          const shortPath = fp.split(/[/\\]/).slice(-3).join("/");
          return `
        <div class="feature-pattern-candidate-row" data-file-path="${escapeHtml(fp)}" role="button" tabindex="0">
          <div class="feature-pattern-candidate-line1"><span class="feature-pattern-candidate-name">${escapeHtml(c)}</span>${metricsStr ? `<span class="feature-pattern-candidate-metrics">${metricsStr}</span>` : ""}</div>
          <div class="feature-pattern-candidate-path" title="${escapeHtml(fp)}">${escapeHtml(shortPath)}</div>
        </div>`;
        })
        .join("")
    : p.components.map((c) => `<li class="feature-pattern-simple-item">${escapeHtml(c)}</li>`).join("");

  const componentSection = hasClickableComponents
    ? `<div class="feature-pattern-candidate-list">${componentList}</div>`
    : `<ul class="feature-pattern-components">${componentList}</ul>`;

  const signalChips = p.sharedSignals.length > 0 ? renderChipList(p.sharedSignals.slice(0, 5)) : "—";
  const refactorList = p.suggestedRefactor
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join("");
  const riskLabel = p.duplicationRisk.charAt(0).toUpperCase() + p.duplicationRisk.slice(1);
  const firstRefactor = p.suggestedRefactor[0] ?? p.recommendation;
  return `
    <div class="feature-pattern-card feature-pattern-card-collapsible pattern-card-v2 feature-pattern-card-compact">
      <div class="feature-pattern-card-header" role="button" tabindex="0" aria-expanded="false">
        <div class="feature-pattern-header">
          <div class="feature-pattern-name pattern-section-title">${escapeHtml(p.featureName)}</div>
          <div class="feature-pattern-badges">
            <span class="badge ${riskClass}">${riskLabel} risk</span>
            <span class="badge info">${p.instanceCount} impl</span>
            <span class="badge info">${confidencePct}%</span>
          </div>
        </div>
        <div class="feature-pattern-card-summary">${escapeHtml(p.recommendation)}</div>
        ${firstRefactor ? `<div class="feature-pattern-refactor-hint">${escapeHtml(firstRefactor)}</div>` : ""}
        <button type="button" class="feature-pattern-card-expand-btn btn-secondary" aria-label="Explore">Explore</button>
      </div>
      <div class="feature-pattern-card-body" style="display:none">
        <div class="feature-pattern-section pattern-section">
          <div class="pattern-section-title">${escapeHtml(candidatesLabel)}</div>
          ${componentSection}
        </div>
        <div class="feature-pattern-section pattern-section feature-pattern-section-grouped">
          <div class="pattern-section-title">${escapeHtml(extractionLabel)}</div>
          <ul class="feature-pattern-refactor feature-pattern-refactor-compact">${refactorList}</ul>
          <div class="feature-pattern-architecture-compact">${escapeHtml(p.architecturalPattern)}</div>
          ${p.sharedSignals.length > 0 ? `<div class="feature-pattern-signals-inline">${signalChips}</div>` : ""}
          <a href="#planner" class="feature-pattern-see-in-planner planner-nav-link" data-nav="planner" data-planner-section="extraction-opportunities">${escapeHtml(t?.patterns?.ctaSeeInRefactorPlan ?? "See in Refactor Plan")}</a>
        </div>
      </div>
    </div>`;
}

export function renderWarningCard(code: string, count: number): string {
  return `
    <div class="warning-card">
      <div class="code">${escapeHtml(code)}</div>
      <div class="count">${count} occurrences</div>
    </div>`;
}

export function renderEmptyState(message: string, contextual = false): string {
  const cls = contextual ? "empty-state empty-state-contextual" : "empty-state";
  return `<div class="${cls}">${escapeHtml(message)}</div>`;
}

export function renderPatternEmptyState(input: {
  message: string;
  hint?: string;
  nextAction?: string;
  links?: Array<{ href: string; label: string }>;
}): string {
  const { message, hint, nextAction, links } = input;
  let html = `<div class="pattern-empty-state">`;
  html += `<div class="pattern-empty-message">${escapeHtml(message)}</div>`;
  if (hint) {
    html += `<div class="pattern-empty-hint">${escapeHtml(hint)}</div>`;
  }
  if (nextAction) {
    html += `<div class="pattern-empty-next">${escapeHtml(nextAction)}</div>`;
  }
  if (links && links.length > 0) {
    html += `<div class="pattern-empty-links">${links
      .map((l) => {
        const hash = l.href.replace("#", "");
        const isPlannerSection = hash === "top-refactor-targets" || hash === "extraction-opportunities";
        const nav = isPlannerSection ? "planner" : hash;
        const sectionAttr = isPlannerSection ? ` data-planner-section="${escapeHtml(hash)}"` : "";
        return `<a href="#${escapeHtml(nav)}" class="pattern-empty-link planner-nav-link" data-nav="${escapeHtml(nav)}"${sectionAttr}>${escapeHtml(l.label)}</a>`;
      })
      .join(" · ")}</div>`;
  }
  html += `</div>`;
  return html;
}

/** Compact meta row: LOC · deps · Impact: X · Effort: Y */
export function renderCompactMetaRow(items: Array<{ label: string; value: string } | string>): string {
  const parts = items.map((item) =>
    typeof item === "string" ? escapeHtml(item) : `${escapeHtml(item.label)}: ${escapeHtml(item.value)}`
  );
  return `<div class="compact-meta-row">${parts.join(" · ")}</div>`;
}

/** Single-line rationale: Priority · Phase · Sequencing */
export function renderRationaleRow(priority?: string, phase?: string, sequencing?: string): string {
  const parts: string[] = [];
  if (priority) parts.push(`Priority: ${escapeHtml(priority)}`);
  if (phase) parts.push(`Phase: ${escapeHtml(phase)}`);
  if (sequencing) parts.push(`Sequencing: ${escapeHtml(sequencing)}`);
  if (parts.length === 0) return "";
  return `<div class="rationale-row">${parts.join(" · ")}</div>`;
}

/** CTA hierarchy: primary + secondary + tertiary */
export function renderActionFooter(input: {
  primary: string;
  secondary?: string;
  tertiary?: string[];
}): string {
  const { primary, secondary, tertiary } = input;
  let html = `<div class="action-footer-hierarchy">`;
  html += `<div class="action-footer-primary">${primary}</div>`;
  if (secondary) html += `<div class="action-footer-secondary">${secondary}</div>`;
  if (tertiary && tertiary.length > 0) {
    html += `<div class="action-footer-tertiary">${tertiary.join("")}</div>`;
  }
  html += `</div>`;
  return html;
}

/** Planner empty state with hint, reassurance, best first step, and nav links */
export function renderPlannerEmptyState(input: {
  message: string;
  hint?: string;
  /** Reassurance that empty state is not bad */
  reassurance?: string;
  /** Recommended first step when empty */
  bestFirstStep?: string;
  /** Label for best first step (e.g. "Recommended first step") */
  bestFirstStepLabel?: string;
  links?: Array<{ href: string; label: string }>;
}): string {
  const {
    message,
    hint,
    reassurance,
    bestFirstStep,
    bestFirstStepLabel = "Recommended first step",
    links,
  } = input;
  let html = `<div class="empty-guidance-panel">`;
  html += `<div class="empty-guidance-message">${escapeHtml(message)}</div>`;
  if (reassurance) {
    html += `<div class="empty-guidance-reassurance">${escapeHtml(reassurance)}</div>`;
  }
  if (hint) {
    html += `<div class="empty-guidance-hint">${escapeHtml(hint)}</div>`;
  }
  if (bestFirstStep) {
    html += `<div class="empty-guidance-best-step"><strong>${escapeHtml(bestFirstStepLabel)}:</strong> <a href="#planner" class="empty-guidance-link planner-nav-link" data-nav="planner" data-planner-section="top-refactor-targets">${escapeHtml(bestFirstStep)}</a></div>`;
  }
  if (links && links.length > 0) {
    html += `<div class="empty-guidance-links">${links
      .map((l) => {
        const hash = l.href.replace("#", "");
        const isPlannerSection = hash === "top-refactor-targets" || hash === "extraction-opportunities";
        const nav = isPlannerSection ? "planner" : hash;
        const sectionAttr = isPlannerSection ? ` data-planner-section="${escapeHtml(hash)}"` : "";
        return `<a href="#${escapeHtml(nav)}" class="empty-guidance-link planner-nav-link" data-nav="${escapeHtml(nav)}"${sectionAttr}>${escapeHtml(l.label)}</a>`;
      })
      .join(" · ")}</div>`;
  }
  html += `</div>`;
  return html;
}

export function renderRefactorPlannerSummary(plan: {
  architectureRoadmap?: unknown[];
  quickWins: unknown[];
  familyRefactorPlaybooks?: unknown[];
  familyRefactorStrategies?: unknown[];
  componentDecompositionHints: unknown[];
}): string {
  const roadmapCount = plan.architectureRoadmap?.length ?? 0;
  const playbookCount = plan.familyRefactorPlaybooks?.length ?? plan.familyRefactorStrategies?.length ?? 0;
  const items = [
    ["Architecture Roadmap", roadmapCount],
    ["Quick Wins", plan.quickWins.length],
    ["Family Playbooks", playbookCount],
    ["Suggested First Extractions", plan.componentDecompositionHints.length],
  ];
  const html = items
    .map(
      ([label, count]) =>
        `<div class="refactor-summary-item"><span class="count">${count}</span><span class="label">${escapeHtml(String(label))}</span></div>`
    )
    .join("");
  return `<div class="refactor-planner-summary">${html}</div>`;
}

export interface PlannerFirstStepInput {
  label: string;
  phase: 1 | 2 | 3 | 4;
  /** Actionable copy for display */
  actionableCopy?: string;
}

export interface PlanningSummaryInput {
  topCount: number;
  quickWinCount: number;
  extractionCount: number;
  highestRoiHint?: string;
  /** Best immediate starting point hint (quick win / Phase 1 / Phase 2 / Phase 3-only). */
  bestImmediateStartHint?: string;
  /** Best starting point – explicit first step */
  bestStartingPoint?: string;
  /** Why start here – rationale */
  whyStartHere?: string;
  /** What unlocks later */
  whatUnlocksLater?: string;
  /** Highest ROI later-stage extraction hint (Phase 3) when earlier phases exist. */
  highestRoiLaterHint?: string;
  suggestedPhase?: 1 | 2 | 3;
  oneLiner?: string;
  /** Phase-aware: where to start */
  whereToStart?: string;
  /** Phase-aware: what comes next */
  whatComesNext?: string;
  /** Phase-aware: cross-cutting note */
  crossCuttingNote?: string;
  /** First 3 steps, phase-ordered */
  firstSteps?: PlannerFirstStepInput[];
  /** Phase deliverables for Phase 1/2/3 */
  phaseDeliverables?: { phase1?: string; phase2?: string; phase3?: string };
  labels?: {
    topTargets?: string;
    quickWins?: string;
    extractionGroups?: string;
    highestRoi?: string;
    bestImmediateStart?: string;
    highestRoiLater?: string;
    bestStartingPoint?: string;
    whyStartHere?: string;
    whatUnlocksLater?: string;
    suggestedPhase?: string;
    phase1?: string;
    phase2?: string;
    phase3?: string;
    phase1Desc?: string;
    phase2Desc?: string;
    phase3Desc?: string;
    phase1Deliverable?: string;
    phase2Deliverable?: string;
    phase3Deliverable?: string;
    firstStepsTitle?: string;
  };
}

export function renderPlanningSummary(input: PlanningSummaryInput): string {
  const {
    topCount,
    quickWinCount,
    extractionCount,
    highestRoiHint,
    bestImmediateStartHint,
    bestStartingPoint,
    whyStartHere,
    whatUnlocksLater,
    highestRoiLaterHint,
    suggestedPhase,
    oneLiner,
    whereToStart,
    whatComesNext,
    crossCuttingNote,
    firstSteps,
    phaseDeliverables,
    labels = {},
  } = input;
  const topTargetsLabel = labels.topTargets ?? "Top refactor targets";
  const quickWinsLabel = labels.quickWins ?? "Quick wins";
  const extractionGroupsLabel = labels.extractionGroups ?? "Extraction groups";
  const highestRoiLabel = labels.highestRoi ?? "Highest ROI starting point";
  const bestImmediateStartLabel =
    labels.bestImmediateStart ?? "Best immediate starting point";
  const bestStartingPointLabel =
    labels.bestStartingPoint ?? "Best starting point";
  const whyStartHereLabel = labels.whyStartHere ?? "Why start here";
  const whatUnlocksLaterLabel =
    labels.whatUnlocksLater ?? "What unlocks later";
  const highestRoiLaterLabel =
    labels.highestRoiLater ?? "Highest ROI later-stage extraction";
  const suggestedPhaseLabel = labels.suggestedPhase ?? "Suggested first phase";
  const firstStepsTitle = labels.firstStepsTitle ?? "Your first 3 steps";
  const phaseLabels = {
    1: labels.phase1 ?? "Phase 1",
    2: labels.phase2 ?? "Phase 2",
    3: labels.phase3 ?? "Phase 3",
  };
  const phase1Deliverable =
    phaseDeliverables?.phase1 ?? labels.phase1Deliverable;
  const phase2Deliverable =
    phaseDeliverables?.phase2 ?? labels.phase2Deliverable;
  const phase3Deliverable =
    phaseDeliverables?.phase3 ?? labels.phase3Deliverable;

  const kpiHtml = `
    <div class="planner-summary-kpi">
      <div class="planner-summary-kpi-item">
        <span class="planner-summary-count">${topCount}</span>
        <span class="planner-summary-label">${escapeHtml(topTargetsLabel)}</span>
      </div>
      <div class="planner-summary-kpi-item">
        <span class="planner-summary-count">${quickWinCount}</span>
        <span class="planner-summary-label">${escapeHtml(quickWinsLabel)}</span>
      </div>
      <div class="planner-summary-kpi-item">
        <span class="planner-summary-count">${extractionCount}</span>
        <span class="planner-summary-label">${escapeHtml(extractionGroupsLabel)}</span>
      </div>
    </div>`;

  const hasSuggestedPhase = typeof suggestedPhase === "number";
  const phaseChip = hasSuggestedPhase
    ? `<span class="planner-chip planner-chip-phase planner-chip-phase-${suggestedPhase}">${escapeHtml(
        phaseLabels[suggestedPhase]
      )}</span>`
    : "";

  const effectiveBestStart =
    bestStartingPoint ?? bestImmediateStartHint ?? highestRoiHint;
  const summaryText =
    whyStartHere ?? whereToStart ?? oneLiner ?? "Use this plan as your execution roadmap.";
  const effectiveWhatNext = whatUnlocksLater ?? whatComesNext;

  let insightHtml = `
    <div class="planner-summary-insight">
      <div class="planner-summary-insight-row">`;
  if (hasSuggestedPhase) {
    insightHtml += `
        <div class="planner-summary-phase">${escapeHtml(
          suggestedPhaseLabel
        )}: ${phaseChip}</div>`;
  }

  if (effectiveBestStart) {
    insightHtml += `
        <div class="planner-summary-roi">${escapeHtml(
          bestStartingPointLabel
        )}: <strong>${escapeHtml(effectiveBestStart)}</strong></div>`;
  }
  if (highestRoiLaterHint) {
    insightHtml += `
        <div class="planner-summary-roi-later">${escapeHtml(
          highestRoiLaterLabel
        )}: <strong>${escapeHtml(highestRoiLaterHint)}</strong></div>`;
  }
  insightHtml += `
      </div>
      <div class="planner-summary-oneliner"><span class="planner-summary-label-inline">${escapeHtml(whyStartHereLabel)}:</span> ${escapeHtml(summaryText)}</div>`;
  if (effectiveWhatNext) {
    insightHtml += `
      <div class="planner-summary-what-next"><span class="planner-summary-label-inline">${escapeHtml(whatUnlocksLaterLabel)}:</span> ${escapeHtml(effectiveWhatNext)}</div>`;
  }
  if (crossCuttingNote) {
    insightHtml += `
      <div class="planner-summary-cross-cutting"><span class="planner-summary-label-inline">Cross-cutting:</span> ${escapeHtml(crossCuttingNote)}</div>`;
  }
  if (
    (phase1Deliverable || phase2Deliverable || phase3Deliverable) &&
    hasSuggestedPhase
  ) {
    insightHtml += `
      <div class="planner-summary-phase-deliverables">`;
    if (phase1Deliverable) {
      insightHtml += `<div class="planner-phase-deliverable"><span class="planner-chip planner-chip-phase planner-chip-phase-1">Phase 1</span> ${escapeHtml(phase1Deliverable)}</div>`;
    }
    if (phase2Deliverable) {
      insightHtml += `<div class="planner-phase-deliverable"><span class="planner-chip planner-chip-phase planner-chip-phase-2">Phase 2</span> ${escapeHtml(phase2Deliverable)}</div>`;
    }
    if (phase3Deliverable) {
      insightHtml += `<div class="planner-phase-deliverable"><span class="planner-chip planner-chip-phase planner-chip-phase-3">Phase 3</span> ${escapeHtml(phase3Deliverable)}</div>`;
    }
    insightHtml += `</div>`;
  }
  if (firstSteps && firstSteps.length > 0) {
    insightHtml += `
      <div class="planner-summary-first-steps">
        <span class="planner-summary-label-inline">${escapeHtml(firstStepsTitle)}:</span>
        <ol class="planner-first-steps-list">${firstSteps
          .map((s) => {
            const displayText = s.actionableCopy ?? s.label;
            return `<li><span class="planner-chip planner-chip-phase planner-chip-phase-${s.phase}">${escapeHtml(phaseLabels[s.phase as 1 | 2 | 3])}</span> ${escapeHtml(displayText)}</li>`;
          })
          .join("")}</ol>
      </div>`;
  }
  insightHtml += `
    </div>`;

  return `<div class="planner-planning-summary">${kpiHtml}${insightHtml}</div>`;
}

export function renderArchitectureRefactorPlan(
  items: Array<{
    familyName: string;
    impactScore: number;
    normalizedImpactScore?: number;
    impactBand?: string;
    percentageOfTotalIssues: number;
    whyFirst?: string[];
  }>
): string {
  if (items.length === 0) {
    return "<p class=\"empty-hint\">No architecture refactor plan items.</p>";
  }
  const listHtml = items
    .map(
      (item, i) => {
        const scoreDisplay =
          item.normalizedImpactScore != null && item.impactBand
            ? `Impact: ${item.normalizedImpactScore} (${item.impactBand})`
            : `Impact score: ${item.impactScore}`;
        const whyHtml =
          item.whyFirst && item.whyFirst.length > 0
            ? `<div class="why-first"><strong>Why first:</strong><ul>${item.whyFirst
                .map((r) => `<li>${escapeHtml(r)}</li>`)
                .join("")}</ul></div>`
            : "";
        return `<div class="architecture-refactor-plan-item">
          <strong>${i + 1}. ${escapeHtml(item.familyName)} family</strong>
          ${scoreDisplay} · Fixing this removes ${item.percentageOfTotalIssues}% of issues
          ${whyHtml}
        </div>`;
      }
    )
    .join("");
  return `
    <div class="architecture-refactor-plan">
      <h3 class="architecture-refactor-plan-title">Architecture Refactor Plan</h3>
      <div class="architecture-refactor-plan-list">${listHtml}</div>
    </div>`;
}

export function renderRefactorPriorityCard(
  label: string,
  description: string,
  impact: number,
  effort: number,
  ratio: number,
  filePath?: string,
  dataProject?: string
): string {
  const attrs = [
    filePath ? `data-file-path="${escapeHtml(filePath)}"` : "",
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="refactor-priority-card card" ${attrs}>
      <div class="card-title">${escapeHtml(label)}</div>
      <div class="card-meta">Impact: ${impact} · Effort: ${effort} · Ratio: ${ratio.toFixed(1)}</div>
      <div class="card-body">${escapeHtml(description)}</div>
    </div>`;
}

function getImpactLabel(impactScore: number, t: Translations): string {
  if (impactScore >= 8) return t.impact.critical;
  if (impactScore >= 5) return t.impact.high;
  if (impactScore >= 3) return t.impact.medium;
  return t.impact.low;
}

function getEffortLabel(effort: string, t: Translations): string {
  const key = effort.toLowerCase() as "low" | "medium" | "high";
  return t.effort[key] ?? effort;
}

export function renderFixFirstCard(
  componentName: string,
  dominantIssue: string,
  priority: "fix-now" | "fix-soon" | "monitor",
  impactScore: number,
  effort: string,
  whyNow: string[],
  filePath: string,
  t: Translations,
  dataProject?: string,
  options?: {
    refactorDirection?: string;
    evidence?: Array<{ key: string; value: number | string; description?: string }>;
    lineCount?: number;
    dependencyCount?: number;
    dominantIssueKey?: string;
    rankingReason?: string;
  }
): string {
  const accentClass = priority === "fix-now" ? "critical" : priority === "fix-soon" ? "high" : "warning";
  const impactLabel = getImpactLabel(impactScore, t);
  const effortLabel = `${t.refactorEffort}: ${getEffortLabel(effort, t)}`;
  let shortExplanation =
    whyNow.length > 0
      ? whyNow[0]
      : options?.rankingReason
        ? `Ranking boosted by ${options.rankingReason}`
        : options?.dominantIssueKey
          ? getDominantIssueExplanation(options.dominantIssueKey)
          : "";
  if (shortExplanation && shortExplanation.length > FIX_FIRST_EXPLANATION_MAX_LEN) {
    shortExplanation = shortExplanation.slice(0, FIX_FIRST_EXPLANATION_MAX_LEN - 3) + "...";
  }
  const refactorDir = options?.refactorDirection ?? "";

  const evidenceChips: string[] = [];
  if (options?.lineCount != null) evidenceChips.push(`${options.lineCount} LOC`);
  if (options?.dependencyCount != null) evidenceChips.push(`${options.dependencyCount} deps`);
  if (options?.evidence) {
    const templateLines = options.evidence.find((e) => e.key === "templateLineCount");
    if (templateLines != null) evidenceChips.push(`${templateLines.value} template lines`);
  }
  const evidenceChipsLimited = evidenceChips.slice(0, 3);
  const evidenceHtml =
    evidenceChipsLimited.length > 0
      ? `<div class="fix-first-evidence-chips">${evidenceChipsLimited.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join("")}</div>`
      : "";

  const issueTypeAttr = options?.dominantIssueKey ?? dominantIssue;
  const attrs = [
    `data-file-path="${escapeHtml(filePath)}"`,
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
    `data-issue-type="${escapeHtml(issueTypeAttr)}"`,
  ]
    .filter(Boolean)
    .join(" ");
  const metaLine = `Impact: ${impactLabel} · ${effortLabel}`;
  return `
    <div class="fix-first-card fix-first-card-compact card fix-first-accent-${accentClass}" ${attrs}>
      <div class="fix-first-card-body">
        <div class="fix-first-card-header">
          <h3 class="fix-first-component-name">${escapeHtml(componentName)}</h3>
          ${renderSmellBadge(dominantIssue)}
        </div>
        <div class="fix-first-meta">${escapeHtml(metaLine)}</div>
        ${shortExplanation ? `<p class="fix-first-explanation">${escapeHtml(shortExplanation)}</p>` : ""}
        ${refactorDir ? `<p class="fix-first-refactor">${escapeHtml(refactorDir)}</p>` : ""}
        ${evidenceHtml}
        <button type="button" class="view-details-btn" data-file-path="${escapeHtml(filePath)}">${escapeHtml(t.actions.viewDetails)}</button>
      </div>
    </div>`;
}

export function renderRefactorPlannerBuckets(
  refactorTasks: Array<{
    componentName: string;
    filePath: string;
    dominantIssue: string;
    priority: "fix-now" | "fix-soon" | "monitor";
    impactScore: number;
    effort: string;
    whyNow: string[];
    suggestedAction: string;
    project?: string | null;
  }>,
  formatIssue: (issue: string) => string,
  t: Translations
): string {
  const fixNow = refactorTasks.filter((x) => x.priority === "fix-now");
  const fixSoon = refactorTasks.filter((x) => x.priority === "fix-soon");
  const monitor = refactorTasks.filter((x) => x.priority === "monitor");

  if (fixNow.length === 0 && fixSoon.length === 0 && monitor.length === 0) {
    return "";
  }

  const renderBucket = (
    title: string,
    items: typeof refactorTasks
  ) => {
    const cards = items.map((task) =>
      renderFixFirstCard(
        task.componentName,
        formatIssue(task.dominantIssue),
        task.priority,
        task.impactScore,
        task.effort,
        task.whyNow,
        task.filePath,
        t,
        task.project ?? undefined
      )
    ).join("");
    return `
      <div class="planner-bucket">
        <h3 class="planner-bucket-title">${escapeHtml(title)}</h3>
        <div class="planner-bucket-cards">${cards || `<p class="planner-bucket-empty">—</p>`}</div>
      </div>`;
  };

  return `
    <div class="planner-buckets">
      ${renderBucket(t.priority.fixNow, fixNow)}
      ${renderBucket(t.priority.fixSoon, fixSoon)}
      ${renderBucket(t.priority.monitor, monitor)}
    </div>`;
}

const FIX_FIRST_INITIAL_VISIBLE = 4;
const FIX_FIRST_EXPLANATION_MAX_LEN = 120;

export function renderFixFirstSection(
  refactorTasks: Array<{
    componentName: string;
    filePath: string;
    dominantIssue: string;
    priority: "fix-now" | "fix-soon" | "monitor";
    impactScore: number;
    effort: string;
    whyNow: string[];
    suggestedAction: string;
    project?: string | null;
    refactorDirection?: string;
    evidence?: Array<{ key: string; value: number | string; description?: string }>;
    lineCount?: number;
    dependencyCount?: number;
  }>,
  formatIssue: (issue: string) => string,
  t: Translations,
  componentDetailsMap?: Record<
    string,
    { lineCount?: number; dependencyCount?: number; evidence?: Array<{ key: string; value: number | string }>; refactorDirection?: string }
  >
): string {
  if (refactorTasks.length === 0) return "";
  const tasks = refactorTasks.slice(0, 5);
  const cardHtml = (task: (typeof tasks)[0], hidden: boolean) => {
    const details = componentDetailsMap ? getComponentDetailEntry(componentDetailsMap, task.filePath) : undefined;
    const refactorDir = (task as { refactorDirection?: string; suggestedAction?: string }).refactorDirection
      ?? (task as { refactorDirection?: string; suggestedAction?: string }).suggestedAction
      ?? details?.refactorDirection;
    const options = {
      refactorDirection: refactorDir,
      evidence: (task as { evidence?: Array<{ key: string; value: number | string }> }).evidence ?? details?.evidence,
      lineCount: (task as { lineCount?: number }).lineCount ?? details?.lineCount,
      dependencyCount: (task as { dependencyCount?: number }).dependencyCount ?? details?.dependencyCount,
      dominantIssueKey: task.dominantIssue,
      rankingReason: (task as { rankingReason?: string }).rankingReason ?? (details as { rankingReason?: string } | undefined)?.rankingReason,
    };
    const hasOptions = options.refactorDirection || options.evidence?.length || options.lineCount != null || options.dependencyCount != null || options.rankingReason;
    const needsFallback = task.whyNow.length === 0;
    const card = renderFixFirstCard(
      task.componentName,
      formatIssue(task.dominantIssue),
      task.priority,
      task.impactScore,
      task.effort,
      task.whyNow,
      task.filePath,
      t,
      task.project ?? undefined,
      hasOptions || needsFallback ? options : undefined
    );
    return hidden ? `<div class="fix-first-card-hidden" data-fix-first-expanded="false">${card}</div>` : card;
  };
  const visibleCards = tasks.slice(0, FIX_FIRST_INITIAL_VISIBLE).map((task) => cardHtml(task, false)).join("");
  const hiddenTasks = tasks.slice(FIX_FIRST_INITIAL_VISIBLE);
  const hiddenCards = hiddenTasks.map((task) => cardHtml(task, true)).join("");
  const ov = t.overview as { fixFirstShowMore?: string; fixFirstShowMoreOne?: string };
  const showMoreLabel = hiddenTasks.length === 1
    ? (ov.fixFirstShowMoreOne ?? "View remaining")
    : (ov.fixFirstShowMore ?? "View {count} more").replace("{count}", String(hiddenTasks.length));
  const showMoreBtn =
    hiddenTasks.length > 0
      ? `<div class="fix-first-show-more-wrap"><button type="button" class="fix-first-show-more-btn" data-hidden-count="${hiddenTasks.length}" aria-expanded="false">${escapeHtml(showMoreLabel)}</button></div>`
      : "";
  return `<div class="fix-first-section fix-first-grid">${visibleCards}${hiddenCards}</div>${showMoreBtn}`;
}

export function renderRefactorTaskCard(
  componentName: string,
  dominantIssue: string,
  priority: "fix-now" | "fix-soon" | "monitor",
  impactScore: number,
  effort: string,
  whyNow: string[],
  suggestedAction: string,
  filePath: string,
  dataProject?: string,
  viewDetailsLabel = "View Details"
): string {
  const priorityBadgeClass =
    priority === "fix-now" ? "critical" : priority === "fix-soon" ? "high" : "info";
  const priorityLabel = priority === "fix-now" ? "Fix now" : priority === "fix-soon" ? "Fix soon" : "Monitor";
  const metaParts = [
    escapeHtml(dominantIssue),
    renderBadge(priorityLabel, priorityBadgeClass),
    `Impact: ${Math.round(impactScore)}`,
    `Effort: ${effort}`,
  ];
  const whyNowHtml =
    whyNow.length > 0
      ? `<div class="refactor-task-why"><strong>Why now:</strong><ul>${whyNow.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul></div>`
      : "";
  const attrs = [
    `data-file-path="${escapeHtml(filePath)}"`,
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
    `data-issue-type="${escapeHtml(dominantIssue)}"`,
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="refactor-task-card card" ${attrs}>
      <div class="card-title">${escapeHtml(componentName)}</div>
      <div class="card-meta">${metaParts.join(" · ")}</div>
      <div class="card-body">
        ${whyNowHtml}
        <div class="refactor-task-action"><strong>Suggested action:</strong> ${escapeHtml(suggestedAction)}</div>
        <button type="button" class="view-details-btn" data-file-path="${escapeHtml(filePath)}">${escapeHtml(viewDetailsLabel)}</button>
      </div>
    </div>`;
}

export function renderQuickWinCard(
  label: string,
  shortDescription: string,
  reason: string,
  filePath?: string,
  dataProject?: string
): string {
  const attrs = [
    filePath ? `data-file-path="${escapeHtml(filePath)}"` : "",
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="quick-win-card card" ${attrs}>
      <div class="card-title">${escapeHtml(label)}</div>
      <div class="card-body">${escapeHtml(shortDescription)}</div>
      <div class="card-meta">${escapeHtml(reason)}</div>
    </div>`;
}

const PATH_TRUNCATE_LEN = 55;

function truncatePath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path;
  return path.slice(0, maxLen - 3) + "...";
}

export function renderTopRefactorTargetCard(
  componentName: string,
  filePath: string,
  shortPath: string,
  lineCount: number,
  dependencyCount: number,
  dominantIssue: string | null,
  refactorSteps: string[],
  possibleExtractions: string[],
  impact: string,
  effort: string,
  rankingReason: string,
  formatIssue: (issue: string | null) => string,
  dataProject?: string,
  dominantIssueKey?: string,
  options?: {
    whyPrioritized?: string;
    phase?: number;
    roiLabel?: string;
    priorityScore?: number;
    confidence?: number;
    confidenceBucket?: "low" | "medium" | "high";
    whyInThisPhase?: string;
    whyBeforeAfter?: string;
    coordinationCost?: "Low" | "Medium" | "High";
    coordinationLabels?: string[];
    patternGroupSize?: number;
    patternLabel?: string;
    componentSpecificNote?: string;
    familyName?: string;
    sameFamilyComponentNames?: string[];
    showFullSteps?: boolean;
    sharesRefactorPatternWithLabel?: string;
    sameFamilyAsLabel?: string;
    sameStepsAsAboveLabel?: string;
  }
): string {
  const bucket =
    options?.confidence != null
      ? getConfidenceBucket(options.confidence)
      : options?.confidenceBucket != null
        ? getConfidenceBucketFromCategorical(options.confidenceBucket)
        : "medium";
  const refactorHeader = getRefactorHeaderCopy(bucket);
  const extractionHeader = getExtractionHeaderCopy(bucket);
  const attrs = [
    `data-file-path="${escapeHtml(filePath)}"`,
    `data-search="${escapeHtml(componentName)}"`,
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const displayPath = truncatePath(shortPath, PATH_TRUNCATE_LEN);
  const pathCopyAttr = `data-copy-path="${escapeHtml(filePath).replace(/"/g, "&quot;")}"`;
  const pathHtml = `<div class="refactor-target-path-wrap"><code class="refactor-target-path" title="${escapeHtml(filePath)}">${escapeHtml(displayPath)}</code><button type="button" class="refactor-target-path-copy planner-btn-utility" ${pathCopyAttr} aria-label="Copy path">Copy</button></div>`;

  const normalizedRefactorSteps = normalizeTextList(refactorSteps);
  const normalizedExtractions = normalizeTextList(possibleExtractions);

  const extractionsHtml =
    normalizedExtractions.length > 0
      ? `<div class="refactor-target-extractions"><strong>${escapeHtml(extractionHeader)}:</strong><ul>${normalizedExtractions
          .map((e) => `<li>${escapeHtml(e)}</li>`)
          .join("")}</ul></div>`
      : "";
  const copyStepsArr =
    normalizedRefactorSteps.length > 0
      ? normalizedRefactorSteps.map((s, i) => `${i + 1}. ${s}`)
      : normalizedExtractions.length > 0
        ? normalizedExtractions.map((e, i) => `${i + 1}. Extract ${e}`)
        : [];
  const copyDataAttr = copyStepsArr.length > 0
    ? ` data-copy-steps="${escapeHtml(JSON.stringify(copyStepsArr)).replace(/"/g, "&quot;")}"`
    : "";
  const patternKey = dominantIssueKey ?? dominantIssue ?? "";

  const whyPrioritized = options?.whyPrioritized;
  const phase = options?.phase;
  const roiLabel = options?.roiLabel;
  const whyInThisPhase = options?.whyInThisPhase;
  const whyBeforeAfter = options?.whyBeforeAfter;
  const coordinationCost = options?.coordinationCost;
  const coordinationLabels = options?.coordinationLabels;
  const patternGroupSize = options?.patternGroupSize ?? 0;
  const patternLabel = options?.patternLabel;
  const componentSpecificNote = options?.componentSpecificNote;
  const sameFamilyComponentNames = options?.sameFamilyComponentNames ?? [];
  const showFullSteps = options?.showFullSteps ?? true;
  const sharesRefactorPatternWithLabel = options?.sharesRefactorPatternWithLabel;
  const sameFamilyAsLabel = options?.sameFamilyAsLabel;
  const sameStepsAsAboveLabel = options?.sameStepsAsAboveLabel ?? "Same steps as above";

  const chipsHtml: string[] = [];
  if (phase != null) chipsHtml.push(`<span class="planner-chip planner-chip-phase planner-chip-phase-${phase}">Phase ${phase}</span>`);
  if (roiLabel) {
    const roiClass = roiLabel === "Cross-cutting" ? "planner-chip-cross-cutting" : "planner-chip-roi";
    chipsHtml.push(`<span class="planner-chip ${roiClass}">${escapeHtml(roiLabel)}</span>`);
  }
  if (coordinationLabels?.length) {
    for (const label of coordinationLabels) {
      if (label !== `Phase ${phase}` && label !== roiLabel) {
        chipsHtml.push(`<span class="planner-chip planner-chip-coordination">${escapeHtml(label)}</span>`);
      }
    }
  }
  if (patternGroupSize > 1 && sharesRefactorPatternWithLabel) {
    chipsHtml.push(`<span class="planner-chip planner-chip-pattern-group">${escapeHtml(sharesRefactorPatternWithLabel)}</span>`);
  }
  if (sameFamilyComponentNames.length > 0 && sameFamilyAsLabel) {
    chipsHtml.push(`<span class="planner-chip planner-chip-same-family">${escapeHtml(sameFamilyAsLabel)}</span>`);
  }
  const chipsBlock = chipsHtml.length > 0 ? `<div class="refactor-target-chips">${chipsHtml.join("")}</div>` : "";

  const componentNoteBlock =
    patternGroupSize > 1 && componentSpecificNote
      ? `<div class="refactor-target-component-note"><strong>Note:</strong> ${escapeHtml(componentSpecificNote)}</div>`
      : "";

  let stepsBlock = "";
  if (normalizedRefactorSteps.length > 0) {
    if (showFullSteps) {
      stepsBlock = `<div class="refactor-target-steps"><strong>${escapeHtml(refactorHeader)}:</strong><ul>${normalizedRefactorSteps
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ul></div>`;
    } else {
      const expandId = `refactor-steps-${escapeHtml(filePath).replace(/[^a-zA-Z0-9-]/g, "-")}`;
      const summaryLabel = sameStepsAsAboveLabel;
      stepsBlock = `<details class="refactor-target-steps-collapsed" id="${expandId}"><summary>${escapeHtml(summaryLabel)}</summary><ul>${normalizedRefactorSteps
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ul></details>`;
    }
  }

  const metaItems: Array<{ label: string; value: string } | string> = [
    `${lineCount} LOC`,
    `${dependencyCount} deps`,
    { label: "Impact", value: impact },
    { label: "Effort", value: effort },
    ...(coordinationCost ? [{ label: "Coordination", value: coordinationCost }] : []),
  ];
  const rationaleHtml = renderRationaleRow(whyPrioritized, whyInThisPhase, whyBeforeAfter);
  const whyNowHtml =
    whyBeforeAfter
      ? `<div class="refactor-target-why-now"><strong>Why now:</strong> ${escapeHtml(whyBeforeAfter)}</div>`
      : "";

  const tertiaryButtons: string[] = [];
  if (patternKey) {
    tertiaryButtons.push(`<a href="#patterns" class="planner-btn-tertiary planner-nav-link" data-nav="patterns" data-pattern-key="${escapeHtml(patternKey)}">Patterns</a>`);
  }
  if (copyStepsArr.length > 0) {
    tertiaryButtons.push(`<button type="button" class="copy-refactor-steps-btn planner-btn-utility"${copyDataAttr}>Copy</button>`);
  }
  const actionsHtml = renderActionFooter({
    primary: `<button type="button" class="view-details-btn planner-btn-primary" data-file-path="${escapeHtml(filePath)}">Details</button>`,
    secondary: `<a href="#components" class="planner-btn-secondary planner-nav-link" data-nav="components" data-search="${escapeHtml(componentName)}">Components</a>`,
    tertiary: tertiaryButtons.length > 0 ? tertiaryButtons : undefined,
  });

  return `
    <div class="top-refactor-target-card card" ${attrs}>
      <div class="refactor-target-header">
        <div class="card-title">${escapeHtml(componentName)}</div>
        ${pathHtml}
      </div>
      <div class="refactor-target-meta-compact">${renderCompactMetaRow(metaItems)}${dominantIssue ? ` <span class="dominant-issue-badge">${escapeHtml(formatIssue(dominantIssue))}</span>` : ""}</div>
      ${chipsBlock}
      ${rationaleHtml}
      ${whyNowHtml}
      ${componentNoteBlock}
      ${stepsBlock}
      ${extractionsHtml}
      ${actionsHtml}
    </div>`;
}

export function renderExtractionOpportunityCard(
  patternName: string,
  componentCount: number,
  whyThisMatters: string,
  recommendedExtractions: string[],
  affectedComponents: string[],
  expectedBenefit?: string,
  expandId?: string,
  confidence?: number,
  options?: {
    phase?: number;
    whyInThisPhase?: string;
    coordinationLabels?: string[];
    /** ROI: duplication level (low/medium/high) */
    duplicationLevel?: "low" | "medium" | "high";
    /** ROI: extraction type (shared-component/facade/service/utility) */
    extractionType?: "shared-component" | "facade" | "service" | "utility";
  }
): string {
  const bucket = confidence != null ? getConfidenceBucket(confidence) : "medium";
  const extractionHeader = getExtractionHeaderCopy(bucket);
  const maxShow = 4;
  const normalizedAffected = normalizeTextList(affectedComponents);
  const shown = normalizedAffected.slice(0, maxShow);
  const hidden = normalizedAffected.slice(maxShow);
  const more = hidden.length;
  const id = expandId ?? `extraction-${patternName.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const chipsHtml =
    shown.length > 0
      ? `${shown.map((c) => `<span class="extraction-chip">${escapeHtml(c)}</span>`).join("")}${hidden
          .map((c) => `<span class="extraction-chip extraction-chip-hidden">${escapeHtml(c)}</span>`)
          .join("")}${more > 0 ? `<button type="button" class="extraction-expand-btn planner-btn-utility" data-expand-id="${escapeHtml(id)}" aria-expanded="false">+${more} more</button>` : ""}`
      : "";
  const componentsHtml =
    chipsHtml
      ? `<div class="extraction-affected" data-expand-id="${escapeHtml(id)}"><strong>Affected components:</strong><div class="extraction-affected-chips">${chipsHtml}</div></div>`
      : "";
  const normalizedExtractions = normalizeTextList(recommendedExtractions);
  const extractionsHtml =
    normalizedExtractions.length > 0
      ? `<div class="extraction-recommended"><strong>${escapeHtml(extractionHeader)}:</strong><ul>${normalizedExtractions
          .map((e) => `<li>${escapeHtml(e)}</li>`)
          .join("")}</ul></div>`
      : "";
  const phase = options?.phase ?? 3;
  const coordinationLabels = options?.coordinationLabels ?? ["Phase 3", "Cross-cutting"];
  const duplicationLevel = options?.duplicationLevel;
  const extractionType = options?.extractionType;
  const roiParts: string[] = [`${componentCount} components benefit`];
  if (duplicationLevel) roiParts.push(`${duplicationLevel} duplication`);
  if (extractionType) {
    const typeLabel =
      extractionType === "shared-component"
        ? "Shared component"
        : extractionType === "facade"
          ? "Facade"
          : extractionType === "service"
            ? "Service"
            : "Utility";
    roiParts.push(typeLabel);
  }
  const roiHtml =
    roiParts.length > 1
      ? `<div class="extraction-roi-row">${escapeHtml(roiParts.join(" · "))}</div>`
      : "";
  const phaseChipsHtml =
    coordinationLabels.length > 0
      ? `<div class="extraction-phase-chips">${coordinationLabels
          .map((l) => {
            const chipClass =
              l === "Cross-cutting"
                ? "planner-chip planner-chip-cross-cutting"
                : l.startsWith("Phase ")
                  ? `planner-chip planner-chip-phase planner-chip-phase-${phase}`
                  : "planner-chip planner-chip-coordination";
            return `<span class="${chipClass}">${escapeHtml(l)}</span>`;
          })
          .join("")}</div>`
      : "";
  const summaryParts: string[] = [whyThisMatters];
  if (expectedBenefit) summaryParts.push(expectedBenefit);
  const extractionSummaryHtml = `<div class="extraction-summary">${escapeHtml(summaryParts.join(" · "))}</div>`;
  return `
    <div class="extraction-opportunity-card card">
      <div class="extraction-card-header">
        <div class="card-title">${escapeHtml(patternName)}</div>
        <div class="extraction-count-badge">${componentCount} components</div>
      </div>
      ${phaseChipsHtml}
      ${roiHtml}
      ${extractionSummaryHtml}
      ${extractionsHtml}
      ${componentsHtml}
      <a href="#patterns" class="planner-btn-primary planner-cta-primary extraction-cta planner-nav-link" data-nav="patterns">Patterns</a>
    </div>`;
}

export function renderQuickWinCatalogCard(
  issueName: string,
  affectedCount: number,
  explanation: string,
  suggestedFix: string,
  bulkFixPotential?: string,
  whyMatters?: string,
  quickWinRationale?: string,
  options?: {
    whyInThisPhase?: string;
    coordinationLabels?: string[];
  }
): string {
  const bulkBadge =
    bulkFixPotential
      ? `<div class="quick-win-bulk"><span class="bulk-fix-badge bulk-fix-${bulkFixPotential.toLowerCase()}">Bulk fix: ${escapeHtml(bulkFixPotential)} — fix many at once</span></div>`
      : "";
  const coordinationLabels = options?.coordinationLabels ?? ["Phase 1", "Safe starting point", "Low coordination"];
  const phaseChipsHtml =
    coordinationLabels.length > 0
      ? `<div class="quick-win-phase-chips">${coordinationLabels
          .map((l) => {
            const chipClass =
              l === "Safe starting point" || l === "Low coordination"
                ? "planner-chip planner-chip-coordination"
                : `planner-chip planner-chip-phase planner-chip-phase-1`;
            return `<span class="${chipClass}">${escapeHtml(l)}</span>`;
          })
          .join("")}</div>`
      : "";
  const whyBlock = (whyMatters ?? explanation)
    ? `<div class="quick-win-why"><strong>Why this matters:</strong> ${escapeHtml(whyMatters ?? explanation)}</div>`
    : "";
  const rationaleBlock = quickWinRationale
    ? `<div class="quick-win-rationale"><strong>Why quick win:</strong> ${escapeHtml(quickWinRationale)}</div>`
    : "";
  const whyInThisPhaseBlock = options?.whyInThisPhase
    ? `<div class="quick-win-why-phase"><strong>Why in this phase:</strong> ${escapeHtml(options.whyInThisPhase)}</div>`
    : "";
  const fixBlock = `<div class="quick-win-fix"><strong>Fix:</strong> ${escapeHtml(suggestedFix)}</div>`;
  const ctaHtml = `<a href="#patterns" class="planner-btn-primary planner-cta-primary quick-win-cta planner-nav-link" data-nav="patterns">Patterns</a>`;
  return `
    <div class="quick-win-catalog-card card quick-win-card-emphasized">
      <div class="quick-win-card-header">
        <div class="card-title">${escapeHtml(issueName)}</div>
        <div class="quick-win-count-badge">${affectedCount} affected</div>
      </div>
      ${phaseChipsHtml}
      ${bulkBadge}
      <div class="quick-win-explanation">${escapeHtml(explanation)}</div>
      ${whyBlock}
      ${rationaleBlock}
      ${whyInThisPhaseBlock}
      ${fixBlock}
      ${ctaHtml}
    </div>`;
}

export function renderFamilyRefactorCard(
  familyName: string,
  patternSummary: string,
  extraction: string,
  service: string,
  splitDirection: string,
  memberCount: number,
  dataProject?: string
): string {
  const attrs = dataProject ? `data-project="${escapeHtml(dataProject)}"` : "";
  return `
    <div class="family-refactor-card card" ${attrs}>
      <div class="card-title">${escapeHtml(familyName)} (${memberCount} components)</div>
      <div class="card-meta"><strong>Pattern:</strong> ${escapeHtml(patternSummary)}</div>
      <div class="card-body">
        <p><strong>Extract:</strong> ${escapeHtml(extraction)}</p>
        <p><strong>Service:</strong> ${escapeHtml(service)}</p>
        <p><strong>Split:</strong> ${escapeHtml(splitDirection)}</p>
      </div>
    </div>`;
}

export function renderFamilyRefactorStrategyCard(
  familyName: string,
  memberCount: number,
  patternSummary: string,
  likelySharedConcerns: string[],
  suggestedExtractionTargets: string[],
  suggestedAngularStructure: string,
  suggestedRefactorSteps: string[],
  expectedBenefits: string[],
  dataProject?: string
): string {
  const attrs = dataProject ? `data-project="${escapeHtml(dataProject)}"` : "";
  const concernsHtml = likelySharedConcerns.length > 0
    ? `<p><strong>Likely shared concerns:</strong> ${escapeHtml(likelySharedConcerns.join(", "))}</p>`
    : "";
  const targetsHtml = suggestedExtractionTargets.length > 0
    ? `<p><strong>Suggested extraction targets:</strong> ${escapeHtml(suggestedExtractionTargets.join(", "))}</p>`
    : "";
  const structureHtml = suggestedAngularStructure
    ? `<p><strong>Suggested structure:</strong> ${escapeHtml(suggestedAngularStructure)}</p>`
    : "";
  const stepsHtml = suggestedRefactorSteps.length > 0
    ? `<p><strong>Suggested steps:</strong> ${escapeHtml(suggestedRefactorSteps.join("; "))}</p>`
    : "";
  const benefitsHtml = expectedBenefits.length > 0
    ? `<p><strong>Expected benefits:</strong> ${escapeHtml(expectedBenefits.join(", "))}</p>`
    : "";
  return `
    <div class="family-refactor-card card" ${attrs}>
      <div class="card-title">${escapeHtml(familyName)} (${memberCount} components)</div>
      <div class="card-meta"><strong>Pattern:</strong> ${escapeHtml(patternSummary)}</div>
      <div class="card-body">
        ${concernsHtml}
        ${targetsHtml}
        ${structureHtml}
        ${stepsHtml}
        ${benefitsHtml}
      </div>
    </div>`;
}

export function renderArchitectureHotspotCard(
  familyName: string,
  componentCount: number,
  avgLineCount: number,
  dominantIssue: string | null,
  impactScore: number,
  estimatedFixImpact: number,
  percentageOfTotalIssues: number,
  suggestedRefactor: string[],
  commonIssues: string[],
  playbookSummary: string,
  dataProject?: string,
  options?: {
    normalizedImpactScore?: number;
    impactBand?: string;
    hotspotReasons?: string[];
    impactBreakdown?: {
      componentCountWeight: number;
      avgLineCountWeight: number;
      warningDensityWeight: number;
      dominantIssueWeight: number;
      repeatedPatternWeight: number;
    };
    estimatedWarningsAffected?: number;
    estimatedComponentsAffected?: number;
    estimatedIssueCoveragePercent?: number;
    roiDisclaimer?: string;
    detectedRolePattern?: string;
    roleDescription?: string;
    recommendedArchitectureBlueprint?: string;
  }
): string {
  const attrs = [
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const issuesHtml = commonIssues.length > 0
    ? renderChipList(commonIssues)
    : "—";
  const dominantHtml = dominantIssue ? escapeHtml(dominantIssue.replace(/_/g, " ").toLowerCase()) : "—";

  const normScore = options?.normalizedImpactScore ?? impactScore;
  const band = options?.impactBand;
  const bandClass = band ? band.toLowerCase().replace(/\s+/g, "-") : "";
  const scoreMeta = band
    ? `Impact: ${normScore} <span class="impact-badge impact-band ${bandClass}">${escapeHtml(band)}</span>`
    : `Impact score: ${impactScore}`;
  const scoreBarHtml =
    options?.normalizedImpactScore != null
      ? `<div class="impact-score-bar"><div class="impact-score-fill" style="width:${options.normalizedImpactScore}%"></div></div><span class="impact-score-value">${options.normalizedImpactScore}/100</span>`
      : "";

  const whySection =
    options?.hotspotReasons && options.hotspotReasons.length > 0
      ? `<p><strong>Why this is a hotspot:</strong></p>
        <ul class="hotspot-reasons-list">${options.hotspotReasons
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join("")}</ul>`
      : "";

  const breakdown = options?.impactBreakdown;
  const breakdownTotal =
    breakdown
      ? breakdown.componentCountWeight +
        breakdown.avgLineCountWeight +
        breakdown.warningDensityWeight +
        breakdown.dominantIssueWeight +
        breakdown.repeatedPatternWeight
      : 0;
  const breakdownHtml =
    breakdown && breakdownTotal > 0
      ? `<p><strong>Score breakdown:</strong></p>
        <div class="impact-breakdown-bar" title="Impact factors">
          <div class="breakdown-segment" style="width:${breakdown.componentCountWeight}%" title="Component count"></div>
          <div class="breakdown-segment" style="width:${breakdown.avgLineCountWeight}%" title="Avg lines"></div>
          <div class="breakdown-segment" style="width:${breakdown.warningDensityWeight}%" title="Warning density"></div>
          <div class="breakdown-segment" style="width:${breakdown.dominantIssueWeight}%" title="Dominant issue"></div>
          <div class="breakdown-segment" style="width:${breakdown.repeatedPatternWeight}%" title="Repeated pattern"></div>
        </div>
        <div class="breakdown-legend">
          <span>Components ${breakdown.componentCountWeight}%</span>
          <span>Lines ${breakdown.avgLineCountWeight}%</span>
          <span>Density ${breakdown.warningDensityWeight}%</span>
          <span>Issue ${breakdown.dominantIssueWeight}%</span>
          <span>Pattern ${breakdown.repeatedPatternWeight}%</span>
        </div>`
      : "";

  const compAffected = options?.estimatedComponentsAffected ?? estimatedFixImpact;
  const covPercent = options?.estimatedIssueCoveragePercent ?? percentageOfTotalIssues;
  const warnAffected = options?.estimatedWarningsAffected;
  const roiDisclaimer = options?.roiDisclaimer ?? "";
  const refactorImpactText =
    `Approximate ROI: Refactoring could affect ~${compAffected} components` +
    (covPercent > 0 ? ` and ~${covPercent}% of architecture warnings` : "") +
    (warnAffected != null ? ` (~${warnAffected} warnings)` : "") +
    "." +
    (roiDisclaimer ? ` ${escapeHtml(roiDisclaimer)}` : "");

  const suggestedList =
    suggestedRefactor.length > 0
      ? `<ul class="suggested-refactor-list">${suggestedRefactor
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join("")}</ul>`
      : "";
  const roleSection =
    options?.detectedRolePattern
      ? `<p><strong>Detected Role Pattern:</strong> ${escapeHtml(options.detectedRolePattern)}</p>` +
        (options.roleDescription ? `<p>${escapeHtml(options.roleDescription)}</p>` : "")
      : "";

  const blueprintSection =
    options?.recommendedArchitectureBlueprint
      ? `<p><strong>Recommended Architecture</strong></p><pre class="architecture-blueprint">${escapeHtml(options.recommendedArchitectureBlueprint)}</pre>`
      : "";

  return `
    <div class="architecture-hotspot-card card" ${attrs}>
      <div class="card-title">${escapeHtml(familyName)} Family</div>
      <div class="card-meta">
        Components: ${componentCount} · Avg size: ${avgLineCount} lines · Dominant issue: ${dominantHtml} · ${scoreMeta}
      </div>
      ${scoreBarHtml ? `<div class="impact-score-container">${scoreBarHtml}</div>` : ""}
      <div class="card-body">
        ${roleSection}
        ${blueprintSection}
        ${whySection}
        <p>${refactorImpactText}</p>
        ${breakdownHtml}
        ${suggestedList ? `<p><strong>Suggested refactor:</strong></p>${suggestedList}` : ""}
        <p><strong>Common issues:</strong> ${issuesHtml}</p>
        <p><strong>Playbook:</strong> ${escapeHtml(playbookSummary)}</p>
      </div>
    </div>`;
}

export function renderArchitectureRoadmapItem(
  rank: number,
  familyName: string,
  reason: string,
  impact: "high" | "medium" | "low",
  suggestedAction: string,
  componentCount: number
): string {
  const impactClass = impact === "high" ? "high" : impact === "medium" ? "medium" : "low";
  return `
    <div class="architecture-roadmap-item card">
      <div class="card-title">${rank}. ${escapeHtml(familyName)} family</div>
      <div class="card-meta"><strong>Impact:</strong> <span class="impact-badge ${impactClass}">${escapeHtml(impact)}</span> · ${componentCount} components</div>
      <div class="card-body">
        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
        <p><strong>Suggested action:</strong> ${escapeHtml(suggestedAction)}</p>
      </div>
    </div>`;
}

export function renderDecompositionHintCard(
  fileName: string,
  lineCount: number,
  blocks: string[],
  suggestedSplit: string,
  confidence: string,
  filePath: string,
  dataProject?: string,
  familyContext?: string,
  suggestedBlockDecomposition?: string[],
  familySpecificHints?: string[],
  decompositionBlueprint?: string,
  expectedImpactPercent?: number
): string {
  const attrs = [
    `data-file-path="${escapeHtml(filePath)}"`,
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const familyBadge = familyContext
    ? ` <span class="family-badge">${escapeHtml(familyContext)}</span>`
    : "";
  const blockDecompHtml = suggestedBlockDecomposition && suggestedBlockDecomposition.length > 0
    ? `<p><strong>Suggested blocks:</strong> ${escapeHtml(suggestedBlockDecomposition.join(", "))}</p>`
    : "";
  const familyHintsHtml = familySpecificHints && familySpecificHints.length > 0
    ? `<p><strong>Family hints:</strong> ${escapeHtml(familySpecificHints.join("; "))}</p>`
    : "";
  const blueprintHtml = decompositionBlueprint
    ? `<p><strong>Recommended Architecture</strong></p><pre class="architecture-blueprint">${escapeHtml(decompositionBlueprint)}</pre>`
    : "";
  const impactHtml = expectedImpactPercent != null
    ? `<p><strong>Expected impact:</strong> reduces component size by ~${expectedImpactPercent}%</p>`
    : "";
  return `
    <div class="decomposition-hint-card card" ${attrs}>
      <div class="card-title">${escapeHtml(fileName)} (${lineCount} lines)${familyBadge}</div>
      <div class="card-meta">Blocks: ${escapeHtml(blocks.join(", "))} · ${escapeHtml(confidence)} confidence</div>
      <div class="card-body">
        <p>${escapeHtml(suggestedSplit)}</p>
        ${blueprintHtml}
        ${impactHtml}
        ${blockDecompHtml}
        ${familyHintsHtml}
      </div>
    </div>`;
}

export function renderArchitectureSmellCard(
  smellType: string,
  severity: string,
  confidence: number,
  description: string,
  affectedComponents: string[],
  relatedFamilies: string[],
  evidence: string[],
  suggestedArchitecture: string,
  suggestedRefactorActions: string[]
): string {
  const severityClass = severity.toLowerCase();
  const affectsText =
    relatedFamilies.length > 0
      ? `${relatedFamilies.join(", ")} family · ${affectedComponents.length} components`
      : `${affectedComponents.length} components`;
  const componentsList =
    affectedComponents.length > 0
      ? `<ul class="smell-affected-list">${affectedComponents
          .slice(0, 8)
          .map((c) => `<li>${escapeHtml(c)}</li>`)
          .join("")}${affectedComponents.length > 8 ? `<li><em>+${affectedComponents.length - 8} more</em></li>` : ""}</ul>`
      : "";
  const evidenceList =
    evidence.length > 0
      ? `<p><strong>Evidence:</strong></p><ul class="smell-evidence-list">${evidence
          .slice(0, 5)
          .map((e) => `<li>${escapeHtml(e)}</li>`)
          .join("")}</ul>`
      : "";
  const actionsList =
    suggestedRefactorActions.length > 0
      ? `<ul class="smell-actions-list">${suggestedRefactorActions
          .map((a) => `<li>${escapeHtml(a)}</li>`)
          .join("")}</ul>`
      : "";
  const smellTypeLabel = smellType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `
    <div class="architecture-smell-card card">
      <div class="card-title">
        ${escapeHtml(smellTypeLabel)}
        <span class="badge ${severityClass}">${escapeHtml(severity)}</span>
        <span class="confidence-badge">${Math.round(confidence * 100)}% confidence</span>
      </div>
      <div class="card-meta">Affects: ${escapeHtml(affectsText)}</div>
      <div class="card-body">
        <p><strong>Why:</strong> ${escapeHtml(description)}</p>
        ${evidenceList}
        <p><strong>Suggested architecture:</strong> ${escapeHtml(suggestedArchitecture)}</p>
        ${actionsList ? `<p><strong>Refactor actions:</strong></p>${actionsList}` : ""}
        ${componentsList ? `<p><strong>Affected components:</strong></p>${componentsList}` : ""}
      </div>
    </div>`;
}

function formatProposedShapeAsTree(proposedShape: string[]): string {
  if (proposedShape.length === 0) return "";
  const root = proposedShape[0];
  const children = proposedShape.slice(1);
  if (children.length === 0) return root;
  const lines: string[] = [root];
  for (let i = 0; i < children.length; i++) {
    const isLast = i === children.length - 1;
    const prefix = isLast ? " └ " : " ├ ";
    lines.push(`${prefix}${children[i]}`);
  }
  return lines.join("\n");
}

export function renderRefactorBlueprintCard(
  targetName: string,
  targetType: "component" | "family",
  currentProblem: string,
  proposedShape: string[],
  stateOwnership: string[],
  serviceBoundaries: string[],
  uiBoundaries: string[],
  migrationSteps: string[],
  dataProject?: string
): string {
  const attrs = [
    dataProject ? `data-project="${escapeHtml(dataProject)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const typeBadge =
    targetType === "family"
      ? '<span class="badge family-badge">family</span>'
      : '<span class="badge component-badge">component</span>';
  const structureHtml =
    proposedShape.length > 0
      ? `<p><strong>Proposed Structure</strong></p><pre class="architecture-blueprint">${escapeHtml(formatProposedShapeAsTree(proposedShape))}</pre>`
      : "";
  const stateHtml =
    stateOwnership.length > 0
      ? `<p><strong>State Ownership</strong></p><ul class="blueprint-list">${stateOwnership
          .map((s) => `<li><code>${escapeHtml(s)}</code></li>`)
          .join("")}</ul>`
      : "";
  const serviceHtml =
    serviceBoundaries.length > 0
      ? `<p><strong>Service Boundaries</strong></p><ul class="blueprint-list">${serviceBoundaries
          .map((s) => `<li><code>${escapeHtml(s)}</code></li>`)
          .join("")}</ul>`
      : "";
  const uiHtml =
    uiBoundaries.length > 0
      ? `<p><strong>UI Boundaries</strong></p><ul class="blueprint-list">${uiBoundaries
          .map((s) => `<li><code>${escapeHtml(s)}</code></li>`)
          .join("")}</ul>`
      : "";
  const stepsHtml =
    migrationSteps.length > 0
      ? `<p><strong>Migration Steps</strong></p><ol class="blueprint-steps">${migrationSteps
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join("")}</ol>`
      : "";
  return `
    <div class="refactor-blueprint-card card" ${attrs}>
      <div class="card-title">${escapeHtml(targetName)} ${typeBadge}</div>
      <div class="card-meta"><strong>Current problem:</strong> ${escapeHtml(currentProblem)}</div>
      <div class="card-body">
        ${structureHtml}
        ${stateHtml}
        ${serviceHtml}
        ${uiHtml}
        ${stepsHtml}
      </div>
    </div>`;
}

function getShortExplanation(explanation: string, maxLen = 100): string {
  if (!explanation || !explanation.trim()) return "";
  const parts = explanation.split(/\.\s+/);
  const first = (parts[0] || "").trim();
  const withPeriod = first ? (first.endsWith(".") ? first : first + ".") : explanation;
  if (withPeriod.length <= maxLen) return withPeriod;
  return withPeriod.slice(0, maxLen).trim() + "…";
}

function getImpactBandLabel(category: RuleImpactCategory, t: Translations): string {
  const map: Record<RuleImpactCategory, string> = {
    informational: t.rules.impactBandInformational ?? "Informational",
    local_maintainability: t.rules.impactBandLocalMaintainability ?? "Local maintainability risk",
    cross_cutting_maintainability: t.rules.impactBandCrossCutting ?? "Cross-cutting maintainability risk",
    behavior_leak_risk: t.rules.impactBandBehaviorLeakRisk ?? "Behavior / leak risk",
  };
  return map[category] ?? category;
}

function formatRuleUsageText(
  violationCount: number,
  affectedComponentCount: number,
  t: Translations
): string {
  if (violationCount === 0 && affectedComponentCount === 0) {
    return t.rules.notTriggered;
  }
  const affectedTpl =
    affectedComponentCount === 1
      ? (t.rules.triggeredInComponents ?? "Triggered in {count} component")
      : (t.rules.triggeredInComponentsPlural ?? "Triggered in {count} components");
  const affectedText = affectedTpl.replace("{count}", String(affectedComponentCount));
  if (affectedComponentCount === 1 && violationCount === 1) {
    return affectedText;
  }
  if (affectedComponentCount === 1 && violationCount > 1) {
    return `${affectedText} (${violationCount} occurrences)`;
  }
  return `${affectedText} (${violationCount} times across workspace)`;
}

export function renderRuleCard(
  rule: RuleMetadata,
  t: Translations,
  violationCount?: number,
  affectedComponentCount?: number,
  priorityScore?: number
): string {
  const vCount = violationCount ?? 0;
  const aCount = affectedComponentCount ?? 0;
  const usageText = formatRuleUsageText(vCount, aCount, t);
  const usageClass = vCount > 0 || aCount > 0 ? "rule-triggered" : "rule-not-triggered";
  const shortExplanation = getShortExplanation(rule.explanation);
  const triggered = vCount > 0 || aCount > 0;

  const severityBadge = renderBadge(
    rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1),
    rule.severity
  );
  const categoryLabel = getCategoryLabel(rule.category, t);
  const categoryBadge = `<span class="badge info rule-category-badge">${escapeHtml(categoryLabel)}</span>`;
  const impactBandLabel = getImpactBandLabel(rule.impactCategory, t);
  const impactBandBadge = `<span class="badge rule-impact-badge rule-impact-${escapeHtml(rule.impactCategory)}">${escapeHtml(impactBandLabel)}</span>`;

  const detailsBody = `
        <p class="rule-explanation">${escapeHtml(rule.explanation)}</p>
        <h4 class="rule-section-label">${escapeHtml(t.rules.whyItMatters)}</h4>
        <p class="rule-why">${escapeHtml(rule.whyItMatters)}</p>
        ${rule.suggestedAction ? `<h4 class="rule-section-label">${escapeHtml(t.rules.suggestedAction ?? "Suggested action")}</h4><p class="rule-suggested-action">${escapeHtml(rule.suggestedAction)}</p>` : ""}
        <h4 class="rule-section-label">${escapeHtml(t.rules.badExample)}</h4>
        <pre class="rule-example rule-bad">${escapeHtml(rule.badExample)}</pre>
        <h4 class="rule-section-label">${escapeHtml(t.rules.goodExample)}</h4>
        <pre class="rule-example rule-good">${escapeHtml(rule.goodExample)}</pre>
        <h4 class="rule-section-label">${escapeHtml(t.rules.refactorDirection)}</h4>
        <p class="rule-refactor">${escapeHtml(rule.refactorDirection)}</p>
        <div class="rule-usage ${usageClass}">${escapeHtml(usageText)}</div>`;

  const investigateLabel = (t.rules as Record<string, string | undefined>).investigateRule ?? t.rules.viewDetails;
  return `
    <div class="rule-card-compact card rule-card-${triggered ? "triggered" : "not-triggered"}" data-rule-id="${escapeHtml(rule.id)}" data-category="${escapeHtml(rule.category)}" data-severity="${escapeHtml(rule.severity)}" data-triggered="${triggered}" data-rule-title="${escapeHtml(rule.title)}" data-rule-explanation="${escapeHtml(rule.explanation)}" data-impact-category="${escapeHtml(rule.impactCategory)}" data-affected-count="${aCount}" data-violation-count="${vCount}" data-priority-score="${priorityScore ?? 0}">
      <div class="rule-card-header" role="button" tabindex="0" aria-expanded="false">
        <div class="rule-card-header-top">
          <h3 class="rule-card-title">${escapeHtml(rule.title)}</h3>
          <div class="rule-card-badges">
            ${severityBadge}
            ${categoryBadge}
            ${impactBandBadge}
            <span class="rule-trigger-count ${usageClass}">${escapeHtml(usageText)}</span>
          </div>
        </div>
        <div class="rule-card-summary">${escapeHtml(shortExplanation)}</div>
        ${rule.suggestedAction ? `<p class="rule-card-suggested-action">${escapeHtml(rule.suggestedAction)}</p>` : ""}
        <button type="button" class="rule-card-expand-btn btn-secondary" aria-label="${escapeHtml(investigateLabel)}">${escapeHtml(investigateLabel)}</button>
      </div>
      <div class="rule-card-body" style="display:none">
        ${detailsBody}
      </div>
    </div>`;
}

export function renderTopActionableRuleCard(
  rule: RuleMetadata,
  t: Translations,
  violationCount: number,
  affectedComponentCount: number
): string {
  const impactBandLabel = getImpactBandLabel(rule.impactCategory, t);
  const usageText = formatRuleUsageText(violationCount, affectedComponentCount, t);
  return `
    <div class="top-actionable-rule-card" data-rule-id="${escapeHtml(rule.id)}" data-rule-title="${escapeHtml(rule.title)}" role="button" tabindex="0">
      <div class="top-actionable-rule-title">${escapeHtml(rule.title)}</div>
      <div class="top-actionable-rule-meta">
        <span class="badge rule-impact-badge rule-impact-${escapeHtml(rule.impactCategory)}">${escapeHtml(impactBandLabel)}</span>
        <span class="top-actionable-rule-usage">${escapeHtml(usageText)}</span>
      </div>
      <p class="top-actionable-rule-action">${escapeHtml(rule.suggestedAction)}</p>
    </div>`;
}

function getCategoryLabel(
  category: string,
  t: Translations
): string {
  const map: Record<string, string> = {
    "component-size": t.rules.categoryComponentSize,
    "template-complexity": t.rules.categoryTemplateComplexity,
    "responsibility-god": t.rules.categoryResponsibilityGod,
    "lifecycle-cleanup": t.rules.categoryLifecycleCleanup,
    "dependency-orchestration": t.rules.categoryDependencyOrchestration,
  };
  return map[category] ?? category;
}

const STRUCTURE_CONCERN_TYPE_KEYS: Record<string, string> = {
  "deep-nesting": "deepNesting",
  "shared-dumping-risk": "sharedDumpingRisk",
  "generic-folder-overuse": "genericFolderOveruse",
  "suspicious-placement": "suspiciousPlacement",
  "feature-boundary-blur": "featureBoundaryBlur",
  "folder-density-concern": "folderDensity",
};

function getStructureConcernTypeLabel(concernType: string, t: Translations): string {
  const s = (t as { structure?: Record<string, string> }).structure;
  if (!s) return concernType.replace(/-/g, " ");
  const key = STRUCTURE_CONCERN_TYPE_KEYS[concernType] ?? concernType.replace(/-/g, "");
  return (s as Record<string, string>)[key] ?? concernType.replace(/-/g, " ");
}

function getStructureConfidenceLabel(confidence: string | undefined, t: Translations): string {
  const c = confidence ?? "medium";
  const s = (t as { structure?: Record<string, string> }).structure;
  if (!s) return c;
  const key = c === "low" ? "confidenceLow" : c === "medium" ? "confidenceMedium" : "confidenceHigh";
  return (s as Record<string, string>)[key] ?? c;
}

function getStructureConfidenceDisplayLabel(confidence: string | undefined, t: Translations): string {
  const bucket = getConfidenceBucketFromCategorical((confidence ?? "medium") as "low" | "medium" | "high");
  return getConfidenceDisplayLabel(bucket, t.confidenceLabels);
}

function getStructureConfidenceTooltip(confidence: string | undefined, t: Translations): string {
  const bucket = getConfidenceBucketFromCategorical((confidence ?? "medium") as "low" | "medium" | "high");
  if (t.confidenceTooltips?.[bucket]) return t.confidenceTooltips[bucket];
  const s = t.structure;
  if (s) {
    if (bucket === "high") return s.confidenceHighTooltip ?? "";
    if (bucket === "medium") return s.confidenceMediumTooltip ?? "";
    if (bucket === "low") return s.confidenceLowTooltip ?? "";
  }
  return "";
}

export function renderStructureConcernCard(
  concern: StructureConcern,
  t: Translations,
  isMostCommon = false
): string {
  const title = getStructureConcernTypeLabel(concern.concernType, t);
  const s = (t as { structure?: Record<string, string> }).structure;
  const viewDetailsLabel = s?.viewDetails ?? "View details";
  const inspectFilesLabel = s?.ctaOpenAffectedComponents ?? s?.viewAffectedFiles ?? s?.inspectFiles ?? "Open affected components";
  const inspectFilesTooltip = s?.viewAffectedFilesTooltip ?? "Opens Components page filtered to files affected by this concern";
  const openPlanLabel = s?.ctaOpenRefactorPlan ?? "Open refactor plan";
  const suggestedFixLabel = s?.suggestedFixLabel ?? "Suggested fix";
  const confidenceDisplay = getStructureConfidenceDisplayLabel(concern.confidence ?? "medium", t);
  const confidenceTooltip = getStructureConfidenceTooltip(concern.confidence ?? "medium", t);
  const impact = concern.impact ?? "medium";
  const areaCounts = (concern.affectedAreasWithCounts ?? []).filter(
    (a) => a && typeof a.area === "string" && a.area.trim().length > 0
  );
  const affectedCount = concern.affectedCount ?? 0;
  const totalFromCounts = areaCounts.reduce(
    (sum, a) => sum + (a.count ?? 0),
    0
  );
  const otherEntry = areaCounts.find(
    (a) => (a.area || "").toLowerCase() === "other"
  );
  const otherCount = otherEntry ? otherEntry.count ?? 0 : 0;
  const otherShare =
    affectedCount > 0 ? otherCount / affectedCount : 0;
  const hasCanonicalAreas =
    areaCounts.length > 0 && totalFromCounts === affectedCount;
  const isWeakAreaInference =
    !hasCanonicalAreas || otherShare >= 0.6;

  const visibleAreaChips =
    hasCanonicalAreas && !isWeakAreaInference
      ? areaCounts.slice(0, 4)
      : [];

  const areasDataAttr =
    visibleAreaChips.length > 0
      ? visibleAreaChips.map((ac) => ac.area).join(",")
      : "multiple";
  const shortExplanation =
    concern.explanation.length > 140
      ? truncateAtWordBoundary(concern.explanation, 140)
      : concern.explanation;
  const actionPreview =
    concern.refactorDirection.length > 80
      ? truncateAtWordBoundary(concern.refactorDirection, 80)
      : concern.refactorDirection;

  const moreCount = hasCanonicalAreas && !isWeakAreaInference && areaCounts.length > 4 ? areaCounts.length - 4 : 0;
  const areaChipsHtml =
    visibleAreaChips.length > 0
      ? visibleAreaChips
          .map((ac) => {
            const area = ac.area;
            const count = ac.count ?? 0;
            return `<span class="structure-chip structure-chip-area">${escapeHtml(
              area
            )}${
              count > 0
                ? ` <span class="structure-area-count">${count}</span>`
                : ""
            }</span>`;
          })
          .join("") +
        (moreCount > 0 ? `<span class="structure-chip structure-chip-more">+${moreCount} more</span>` : "")
      : `<span class="structure-chip structure-chip-area">${escapeHtml(
          s?.multipleAreasAffected ?? "Multiple areas affected"
        )}</span>`;

  const mostCommonClass = isMostCommon ? " most-common" : "";

  return `
    <div class="structure-concern-card card rule-card-compact${mostCommonClass}" data-concern-type="${escapeHtml(concern.concernType)}" data-confidence="${escapeHtml(concern.confidence ?? "medium")}" data-impact="${escapeHtml(impact)}" data-affected-count="${concern.affectedCount}" data-areas="${escapeHtml(areasDataAttr)}">
      <div class="structure-concern-header" role="button" tabindex="0">
        <div class="structure-concern-top">
          <div class="structure-concern-title-row">
            <h3 class="structure-concern-title">${escapeHtml(title)}</h3>
            ${isMostCommon ? `<span class="structure-chip structure-chip-most-common">Most common</span>` : ""}
          </div>
          <div class="structure-concern-chips">
            <span class="structure-chip structure-chip-impact impact-${escapeHtml(impact)}">${escapeHtml(impact)} impact</span>
            <span class="structure-chip structure-chip-confidence confidence-${escapeHtml(concern.confidence ?? "medium")}"${confidenceTooltip ? ` title="${escapeHtml(confidenceTooltip)}"` : ""}>${escapeHtml(confidenceDisplay)}</span>
            <span class="structure-chip structure-chip-count">${concern.affectedCount} files</span>
            ${areaChipsHtml}
          </div>
        </div>
        <p class="structure-concern-summary">${escapeHtml(shortExplanation)}</p>
        <div class="structure-concern-suggested-fix">
          <span class="structure-concern-suggested-fix-label">${escapeHtml(suggestedFixLabel)}</span>
          <p class="structure-concern-suggested-fix-content">${escapeHtml(actionPreview)}</p>
        </div>
        <div class="structure-concern-actions">
          <button type="button" class="btn-secondary structure-btn-view" aria-label="${escapeHtml(viewDetailsLabel)}">${escapeHtml(viewDetailsLabel)}</button>
          <a href="#components" class="btn-secondary structure-btn-inspect planner-nav-link" data-nav="components" data-structure-concern="${escapeHtml(concern.concernType)}" aria-label="${escapeHtml(inspectFilesLabel)}" title="${escapeHtml(inspectFilesTooltip)}">${escapeHtml(inspectFilesLabel)}</a>
          <a href="#planner" class="btn-secondary planner-nav-link" data-nav="planner" data-planner-section="extraction-opportunities" data-structure-concern="${escapeHtml(concern.concernType)}">${escapeHtml(openPlanLabel)}</a>
        </div>
      </div>
    </div>`;
}

export function renderDetailModalShell(t: { drawer?: { back?: string } }): string {
  const backLabel = t?.drawer?.back ?? "Back";
  return `
    <div id="detail-modal-overlay" class="detail-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
      <div class="detail-modal" role="document">
        <div class="detail-modal-header">
          <button type="button" class="detail-modal-back" id="detail-modal-back" aria-label="${escapeHtml(backLabel)}" style="display:none">← ${escapeHtml(backLabel)}</button>
          <div class="detail-modal-title-wrap">
            <h2 id="detail-modal-title" class="detail-modal-title">Detail</h2>
            <span id="detail-modal-subtitle" class="detail-modal-subtitle"></span>
          </div>
          <button type="button" class="detail-modal-close" id="detail-modal-close" aria-label="Close">×</button>
        </div>
        <div class="detail-modal-body" id="detail-modal-body"></div>
      </div>
    </div>`;
}
