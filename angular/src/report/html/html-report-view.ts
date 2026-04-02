import { REPORT_CLIENT_SCRIPT } from "./report-client-script";
import type { ScanResult } from "../../core/scan-result";
import type { AnalysisSnapshot } from "../../core/analysis-snapshot";
import type { ComponentDiagnostic } from "../../diagnostic/diagnostic-models";
import type { ComponentFamily } from "../../angular/family/family-models";
import { buildWorkspaceDiagnosis } from "../../diagnostic/workspace-diagnosis";
import { prepareSections, formatDominantIssue, formatFamilyName, formatSmellType, buildComponentDetailsMap, getComponentDetailEntry, normalizePath, getDominantIssueExplanation } from "./html-report-presenter";
import { buildPatternData } from "./pattern-data-builder";
import {
  formatDecompositionBlueprint,
  type FocusedDecompositionSuggestion,
} from "../../angular/intelligence/decomposition";
import { REPORT_STYLES } from "./styles";
import { SIGNAL_DISPLAY_LABELS } from "./templates";
import { buildHtmlClientComponentDetailsMap } from "./html-embedded-payload";
import { slimSnapshotComparisonsForHtml } from "./snapshot-comparisons-embed";
import { buildComponentExplorerSearchText } from "./component-explorer-search-text";
import {
  escapeHtml,
  renderDashboardCard,
  renderDashboardCards,
  renderScoreBreakdownSection,
  renderSection,
  renderTable,
  renderBadge,
  renderCard,
  renderFamilyCard,
  renderSimilarFamilyCard,
  renderExtractionCard,
  renderWarningCard,
  renderDiagnosticSummaryItem,
  renderDiagnosticSummaryBarItem,
  renderChipList,
  renderDetailModalShell,
  renderEmptyState,
  renderPatternEmptyState,
  renderPlannerEmptyState,
  renderRefactorPlannerSummary,
  renderPlanningSummary,
  renderArchitectureRefactorPlan,
  renderRefactorPriorityCard,
  renderRefactorTaskCard,
  renderFixFirstSection,
  renderRefactorPlannerBuckets,
  renderQuickWinCard,
  renderTopRefactorTargetCard,
  renderExtractionOpportunityCard,
  renderQuickWinCatalogCard,
  renderFamilyRefactorCard,
  renderFamilyRefactorStrategyCard,
  renderDecompositionHintCard,
  renderArchitectureHotspotCard,
  renderArchitectureRoadmapItem,
  renderArchitectureSmellCard,
  renderFeaturePatternCard,
  renderArchitecturePatternCard,
  renderComponentFamilyInsightCard,
  renderRefactorBlueprintCard,
  renderRuleCard,
  renderTopActionableRuleCard,
  renderStructureConcernCard,
  renderSidebar,
  renderTopBar,
  renderOverviewSummaryCards,
  renderWorkspaceHealthHero,
  renderOverviewHero,
  renderGroupedOverviewMetrics,
  renderSecondaryMetricCards,
  renderScoreBreakdownCards,
  renderDominantIssueDistribution,
  renderTopProblematicCompactList,
  renderOverviewActionNav,
  renderOverviewPatternPreview,
  renderComponentExplorerList,
  renderComponentsSummaryStrip,
  renderPatternOverviewGrid,
  renderPatternSummaryZone,
  renderProjectBreakdownCards,
  type ComponentExplorerRowInput,
  raw,
  type TableCell,
} from "./templates";
import { formatTemplate, ensureNoUnresolvedTokens } from "./format-template";
import {
  deriveComponentSummaryLine,
  deriveDominantAction,
  formatAreaLabelForDisplay,
} from "./feature-extraction";
import { getRulesByCategory, RULES_REGISTRY, getRuleById } from "../../rules/rule-registry";
import { getRuleTitleForDisplay } from "./rule-display-helpers";
import {
  enrichRulesWithWorkspaceData,
  getTopActionableRules,
} from "../../rules/rule-priority";
import type { StructureConcern } from "../../core/structure-models";
import type { TopRefactorTarget, ExtractionOpportunity, QuickWinCatalogItem } from "../../refactor/refactor-plan-models";
import {
  computeFirstThreeSteps,
  computePlanningSummaryStrings,
  computePlannerPhaseFacts,
  computePlannerRoiHints,
  computeQuickWinsEmptyStateCopy,
} from "../../refactor/refactor-planner";
import {
  buildExtractionSequencingCopy,
  buildTargetSequencingCopy,
  buildWorkspaceSequencingState,
  type WorkspaceSequencingState,
} from "../../refactor/sequencing-copy";
import { MAX_WARNINGS_PER_RISK } from "../../formatters/format-helpers";
import { getTranslations } from "./i18n/translations";
import {
  buildExecutiveSummaryModel,
  buildPriorityHotspotRows,
  buildRecommendedActionItems,
  renderExecutiveSummarySection,
  renderPriorityFocusSection,
  renderRecommendedActionsSection,
} from "./report-overview-insights";
import type { SnapshotComparisonPayload } from "../snapshot-compare";
import type { SnapshotSummary } from "../snapshot-history";

function getRiskBadgeClass(riskLevel: string): string {
  const lower = riskLevel.toLowerCase();
  if (["high", "critical"].includes(lower)) return "high";
  if (["medium", "moderate"].includes(lower)) return "medium";
  if (["low"].includes(lower)) return "low";
  return "high";
}

function renderSnapshotCompareModal(t: ReturnType<typeof getTranslations>): string {
  const tf = t.filters as Record<string, string | undefined>;
  const title = tf.snapshotCompareModalTitle ?? "Compare with previous snapshot";
  const helper = tf.snapshotCompareModalHelper ?? "Choose a stored snapshot to compare this run against.";
  return `
  <div id="snapshot-compare-modal" class="snapshot-compare-modal" hidden aria-hidden="true">
    <div class="snapshot-compare-modal-backdrop" data-snapshot-compare-close tabindex="-1"></div>
    <div class="snapshot-compare-modal-panel" role="dialog" aria-modal="true" aria-labelledby="snapshot-compare-modal-title">
      <h3 id="snapshot-compare-modal-title" class="snapshot-compare-modal-title">${escapeHtml(title)}</h3>
      <p class="snapshot-compare-modal-helper text-muted">${escapeHtml(helper)}</p>
      <div class="snapshot-compare-list" data-snapshot-compare-list></div>
      <div class="snapshot-compare-modal-actions">
        <button type="button" class="snapshot-compare-modal-close-btn" data-snapshot-compare-close>Close</button>
      </div>
    </div>
  </div>`;
}

function renderOverviewCompareDetailModal(t: ReturnType<typeof getTranslations>): string {
  const o = t.overview;
  const title = o.compareDetailModalTitle ?? "Baseline vs current report";
  const closeLbl = o.compareDetailClose ?? "Close";
  return `
  <div id="overview-compare-detail-modal" class="overview-compare-detail-modal" hidden aria-hidden="true">
    <div class="overview-compare-detail-backdrop" data-overview-compare-detail-close tabindex="-1"></div>
    <div class="overview-compare-detail-panel" role="dialog" aria-modal="true" aria-labelledby="overview-compare-detail-title">
      <div class="overview-compare-detail-head">
        <h3 id="overview-compare-detail-title" class="overview-compare-detail-title">${escapeHtml(title)}</h3>
        <button type="button" class="overview-compare-detail-dismiss" data-overview-compare-detail-close aria-label="${escapeHtml(closeLbl)}">×</button>
      </div>
      <div id="overview-compare-detail-body" class="overview-compare-detail-body" data-overview-compare-detail-body></div>
      <div class="overview-compare-detail-footer">
        <button type="button" class="overview-compare-detail-close-btn" data-overview-compare-detail-close>${escapeHtml(closeLbl)}</button>
      </div>
    </div>
  </div>`;
}

function renderOverviewComparePanel(t: ReturnType<typeof getTranslations>, snapshotHistory: SnapshotSummary[]): string {
  if (snapshotHistory.length === 0) return "";
  const o = t.overview;
  const title = o.compareSectionTitle ?? "Compare";
  const cta = o.compareReportCta ?? "Compare this report with a previous snapshot";
  const changeLbl = o.compareChangeBaseline ?? "Change baseline";
  const clearLbl = o.compareClearCompare ?? "Clear compare";
  const detailBtn = o.compareDetailViewDetailsBtn ?? "View compare details";
  return `
    <div id="overview-compare-panel" class="overview-compare-panel overview-section" data-overview-compare-panel>
      <h2 class="page-section-title section-title-caps">${escapeHtml(title)}</h2>
      <div class="overview-compare-inner" data-overview-compare-inner>
        <div class="overview-compare-idle" data-overview-compare-idle>
          <button type="button" class="overview-compare-cta-btn" data-overview-compare-open>${escapeHtml(cta)}</button>
        </div>
        <div class="overview-compare-active" data-overview-compare-active hidden>
          <p class="overview-compare-baseline text-muted" data-overview-compare-baseline></p>
          <p class="overview-compare-summary overview-compare-summary-trigger" data-overview-compare-summary data-overview-compare-summary-open role="button" tabindex="0" title="${escapeHtml(detailBtn)}"></p>
          <p class="overview-compare-top-area text-muted" data-overview-compare-top-area hidden></p>
          <div class="overview-compare-actions">
            <button type="button" class="overview-compare-details-btn" data-overview-compare-details-open>${escapeHtml(detailBtn)}</button>
            <button type="button" class="overview-compare-change-btn" data-overview-compare-change>${escapeHtml(changeLbl)}</button>
            <button type="button" class="overview-compare-clear-btn" data-overview-compare-clear>${escapeHtml(clearLbl)}</button>
          </div>
        </div>
      </div>
    </div>`;
}

export interface RenderOptions {
  /** When true, adds data-artifact-source-snapshot-id and debug attributes to HTML */
  debug?: boolean;
  /** Workspace snapshot summaries for compare picker (embedded in HTML only). */
  snapshotHistory?: SnapshotSummary[];
  /** Precomputed current vs baseline compact diffs (key = snapshotHash or runId). */
  snapshotComparisons?: Record<string, SnapshotComparisonPayload>;
}

export function renderHtmlReport(snapshot: AnalysisSnapshot, options: RenderOptions = {}): string {
  const t = getTranslations();
  const result = snapshot.result;
  const sections = snapshot.sections;
  const componentDetailsMap = snapshot.componentDetailsMap as Record<string, import("./html-report-presenter").ComponentDetailEntry>;
  const patternData = snapshot.patternData;

  const formatIssue = (issue: string | null) => formatDominantIssue(issue);
  const formatFamily = (name: string) => formatFamilyName(name);
  const formatSmell = (smell: string) => formatSmellType(smell);

  const generatedDate = new Date(result.generatedAt).toLocaleString();
  const riskBadgeClass = getRiskBadgeClass(result.workspaceSummary.riskLevel);

  const sectionsArr = [...snapshot.sections];
  const snapshotHistory = options.snapshotHistory ?? [];
  const snapshotComparisons = slimSnapshotComparisonsForHtml(options.snapshotComparisons ?? {});
  const overviewHtml = renderOverviewPage(
    result,
    sectionsArr,
    t,
    formatIssue,
    formatFamily,
    componentDetailsMap,
    snapshotHistory
  );
  const componentsHtml = renderComponentsPage(snapshot, sectionsArr, t, formatIssue);
  const patternsHtml = renderPatternsPage(result, sectionsArr, t, formatIssue, formatFamily, patternData);
  const rulesHtml = renderRulesPage(result, t);
  const structureHtml = renderStructurePage(result, t);
  const plannerHtml = renderPlannerPage(result, sectionsArr, t, formatIssue, formatFamily, formatSmell);

  const pathToFamily: Record<string, { familyName: string; isExtraction: boolean }> = {};
  for (const f of result.extractionCandidates ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily[key]) pathToFamily[key] = { familyName: f.familyName, isExtraction: true };
    }
  }
  for (const f of result.similarComponentFamilies ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily[key]) pathToFamily[key] = { familyName: f.familyName, isExtraction: false };
    }
  }
  for (const f of result.repeatedArchitectureHotspots ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily[key]) pathToFamily[key] = { familyName: f.familyName, isExtraction: false };
    }
  }

  const htmlClientDetailsMap = buildHtmlClientComponentDetailsMap(componentDetailsMap);

  const translationsJson = JSON.stringify(getTranslations()).replace(/<\/script>/gi, "<\\/script>");
  const debugAttrs = options.debug
    ? ` data-artifact-source-snapshot-id="${snapshot.runId}" data-aggregation-version="${snapshot.snapshotVersion}" data-data-source="snapshot"`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modulens Report - ${escapeHtml(result.workspacePath)}</title>
  <meta name="modulens-run-id" content="${escapeHtml(snapshot.runId)}">
  <style>${REPORT_STYLES}</style>
</head>
<body${debugAttrs}>
  <div class="report-dashboard">
    ${renderSidebar(t)}
    <div class="main">
      ${renderTopBar(t, result.workspacePath, generatedDate, result.workspaceSummary.riskLevel, riskBadgeClass)}
      <div class="content">
        <div id="page-overview" class="dashboard-page active" data-page="overview">${overviewHtml}</div>
        <div id="page-components" class="dashboard-page" data-page="components">${componentsHtml}</div>
        <div id="page-patterns" class="dashboard-page" data-page="patterns">${patternsHtml}</div>
        <div id="page-rules" class="dashboard-page" data-page="rules">${rulesHtml}</div>
        <div id="page-structure" class="dashboard-page" data-page="structure">${structureHtml}</div>
        <div id="page-planner" class="dashboard-page" data-page="planner">${plannerHtml}</div>
      </div>
    </div>
  </div>

  ${renderDetailModalShell(t)}
  ${renderSnapshotCompareModal(t)}
  ${renderOverviewCompareDetailModal(t)}

  <script>
    window.__REPORT_META__ = ${JSON.stringify(snapshot.meta).replace(/<\/script>/gi, "<\\/script>")};
    window.__PATH_TO_FAMILY__ = ${JSON.stringify(pathToFamily).replace(/<\/script>/gi, "<\\/script>")};
    window.__REPORT_DATA__ = ${JSON.stringify(htmlClientDetailsMap).replace(/<\/script>/gi, "<\\/script>")};
    window.__OTHER_MINOR_CLUSTERS__ = ${JSON.stringify(result.otherMinorClusters ?? []).replace(/<\/script>/gi, "<\\/script>")};
    window.__BREAKDOWN_MODE__ = ${JSON.stringify(result.breakdownMode ?? "feature-area").replace(/<\/script>/gi, "<\\/script>")};
    window.__PATTERN_DATA__ = ${JSON.stringify(patternData).replace(/<\/script>/gi, "<\\/script>")};
    window.__RULES_BY_ID__ = ${JSON.stringify(Object.fromEntries(RULES_REGISTRY.map((r) => [r.id, r]))).replace(/<\/script>/gi, "<\\/script>")};
    window.__RULE_TO_AFFECTED__ = ${JSON.stringify(result.ruleToAffectedComponents ?? {}).replace(/<\/script>/gi, "<\\/script>")};
    window.__RULE_VIOLATION_COUNTS__ = ${JSON.stringify(result.ruleViolationCounts ?? {}).replace(/<\/script>/gi, "<\\/script>")};
    window.__STRUCTURE_BY_TYPE__ = ${JSON.stringify(Object.fromEntries((result.structureConcerns?.concerns ?? []).map((c: StructureConcern) => [c.concernType, c]))).replace(/<\/script>/gi, "<\\/script>")};
    window.__STRUCTURE_TO_PATHS__ = ${JSON.stringify(Object.fromEntries((result.structureConcerns?.concerns ?? []).map((c: StructureConcern) => [c.concernType, c.affectedPaths]))).replace(/<\/script>/gi, "<\\/script>")};
    window.__TRANSLATIONS__ = ${translationsJson};
    window.__SIGNAL_DISPLAY_LABELS__ = ${JSON.stringify(SIGNAL_DISPLAY_LABELS)};
    window.__SNAPSHOT_HISTORY__ = ${JSON.stringify(snapshotHistory).replace(/<\/script>/gi, "<\\/script>")};
    window.__SNAPSHOT_COMPARISONS__ = ${JSON.stringify(snapshotComparisons).replace(/<\/script>/gi, "<\\/script>")};
  </script>
  <script>
${REPORT_CLIENT_SCRIPT}
  </script>
</body>
</html>`;
}

function renderOverviewPage(
  result: ScanResult,
  sections: { id: string; title: string; description?: string; items?: unknown[]; data?: Record<string, unknown> }[],
  t: ReturnType<typeof getTranslations>,
  formatIssue: (issue: string | null) => string,
  formatFamily: (name: string) => string,
  componentDetailsMap: Record<string, unknown>,
  snapshotHistory: SnapshotSummary[]
): string {
  const scoresSection = sections.find((s) => s.id === "scores");
  const scores = scoresSection?.data?.scores as ScanResult["scores"] | undefined;
  const refactorFirstSection = sections.find((s) => s.id === "refactor-first");
  const refactorTasksRaw = (refactorFirstSection?.items ?? []) as Array<{
    componentName: string;
    filePath: string;
    dominantIssue: string;
    priority: "fix-now" | "fix-soon" | "monitor";
    impactScore: number;
    effort: string;
    whyNow: string[];
    suggestedAction: string;
    project?: string | null;
  }>;
  const topCrossSection = sections.find((s) => s.id === "top-cross-cutting");
  const topCrossItems = (topCrossSection?.items ?? []) as Array<ComponentDiagnostic & { project: string | null }>;
  const topProbSection = sections.find((s) => s.id === "top-problematic");
  const topProb = (topProbSection?.items ?? []) as Array<{
    filePath: string;
    fileName: string;
    lineCount: number;
    dependencyCount: number;
    issues: Array<{ type: string; message: string; severity: string }>;
    highestSeverity?: string;
    project: string | null;
  }>;
  const archPatternsSection = sections.find((s) => s.id === "architecture-patterns");
  const archPatterns = (archPatternsSection?.items ?? []) as Array<{
    familyName: string;
    components: Array<{ className: string; fileName: string; filePath: string; dominantIssue: string }>;
    commonSignals: string[];
    dominantIssues: string[];
    sharedRefactorOpportunity: string;
    recommendedExtractions: string[];
    confidence: number;
    confidenceBreakdown?: unknown;
  }>;
  const featurePatternsSection = sections.find((s) => s.id === "feature-patterns");
  const featurePatterns = (featurePatternsSection?.items ?? []) as Array<{
    featureName: string;
    instanceCount: number;
    duplicationRisk: string;
    recommendation: string;
  }>;

  const fixFirstItems =
    refactorTasksRaw.length > 0
      ? refactorTasksRaw
      : topCrossItems.slice(0, 5).map((d) => ({
          componentName: d.className ?? d.fileName.replace(/\.component\.ts$/, ""),
          filePath: d.filePath,
          dominantIssue: d.dominantIssue ?? "GOD_COMPONENT",
          priority: "fix-now" as const,
          impactScore: (d.totalWarningCount ?? 0) > 5 ? 8 : 5,
          effort: "Medium",
          whyNow: d.refactorDirection ? [d.refactorDirection] : [],
          suggestedAction: d.refactorDirection ?? "",
          project: d.project,
          refactorDirection: d.refactorDirection,
          evidence: d.evidence,
          lineCount: (getComponentDetailEntry(componentDetailsMap, d.filePath) as { lineCount?: number } | undefined)?.lineCount,
          dependencyCount: (getComponentDetailEntry(componentDetailsMap, d.filePath) as { dependencyCount?: number } | undefined)?.dependencyCount,
          rankingReason: d.rankingReason,
        }));

  const topProblematicItems =
    topCrossItems.length > 0
      ? topCrossItems.map((d) => {
          const details = getComponentDetailEntry(componentDetailsMap, d.filePath) as { lineCount?: number; dependencyCount?: number; highestSeverity?: string } | undefined;
          return {
            filePath: d.filePath,
            fileName: d.fileName,
            className: d.className ?? undefined,
            mainIssue: formatIssue(d.dominantIssue),
            highestSeverity: details?.highestSeverity,
            project: d.project,
            lineCount: details?.lineCount,
            dependencyCount: details?.dependencyCount,
          };
        })
      : topProb.map((c) => {
          const details = getComponentDetailEntry(componentDetailsMap, c.filePath) as { lineCount?: number; dependencyCount?: number } | undefined;
          return {
            filePath: c.filePath,
            fileName: c.fileName,
            className: undefined,
            mainIssue: formatIssue(c.issues[0]?.type ?? null),
            highestSeverity: c.highestSeverity,
            project: c.project,
            lineCount: details?.lineCount ?? c.lineCount,
            dependencyCount: details?.dependencyCount,
          };
        });

  const detailsMap = componentDetailsMap as Record<
    string,
    { lineCount?: number; dependencyCount?: number; evidence?: Array<{ key: string; value: number | string }>; refactorDirection?: string }
  >;

  let html = "";

  const diagnosis = buildWorkspaceDiagnosis(result, formatIssue);

  if (scores) {
    html += renderOverviewHero(
      scores,
      result.workspaceSummary,
      diagnosis,
      result.projectBreakdown,
      formatIssue,
      t,
      result.breakdownMode
    );
    html += renderGroupedOverviewMetrics(
      result.workspaceSummary,
      result.diagnosticSummary,
      topCrossItems.length || result.diagnosticSummary.topCrossCuttingRisks.length,
      scores,
      t
    );
  }

  if (snapshotHistory.length > 0) {
    html += renderOverviewComparePanel(t, snapshotHistory);
  }

  if (result.projectBreakdown.length > 0) {
    html += renderProjectBreakdownCards(
      result.projectBreakdown.map((p) => ({
        sourceRoot: p.sourceRoot,
        components: p.components,
        componentsWithFindings: p.componentsWithFindings,
        componentFindings: p.componentFindings,
        templateFindings: p.templateFindings,
        responsibilityFindings: p.responsibilityFindings,
        lifecycleFindings: p.lifecycleFindings,
      })),
      t,
      result.breakdownMode,
      result.otherMinorClusters
    );
  }

  html += renderExecutiveSummarySection(buildExecutiveSummaryModel(result, diagnosis, formatIssue, t), t);
  html += renderPriorityFocusSection(buildPriorityHotspotRows(result, formatIssue), t);

  html += renderDominantIssueDistribution(
    result.diagnosticSummary.dominantIssueCounts,
    formatIssue,
    t,
    "overview-dominant-issues"
  );

  const fixFirstHelper = (t.overview as { fixFirstHelper?: string }).fixFirstHelper;
  html += `<div class="overview-section" id="overview-fix-first"><h2 class="page-section-title section-title-caps" data-i18n="overview.fixFirst">${escapeHtml(t.overview.fixFirst)}</h2>`;
  if (fixFirstHelper) {
    html += `<p class="section-helper text-muted">${escapeHtml(fixFirstHelper)}</p>`;
  }
  if (fixFirstItems.length === 0) {
    html += renderEmptyState(t.empty.noRefactorTasks);
  } else {
    html += renderFixFirstSection(fixFirstItems, formatIssue, t, detailsMap);
  }
  html += `</div>`;

  html += renderTopProblematicCompactList(topProblematicItems, formatIssue, t, "overview-top-problematic");

  html += renderOverviewPatternPreview(
    archPatterns,
    featurePatterns as Array<{
      featureName: string;
      patternType: string;
      instanceCount: number;
      confidence: number;
      components: string[];
      sharedSignals: string[];
      architecturalPattern: string;
      duplicationRisk: string;
      recommendation: string;
      suggestedRefactor: string[];
    }>,
    formatIssue,
    formatFamily,
    t,
    "overview-pattern-preview"
  );

  html += renderRecommendedActionsSection(buildRecommendedActionItems(result, sections), t);

  const dc = result.diagnosticSummary.dominantIssueCounts;
  const topIssue = ["TEMPLATE_HEAVY_COMPONENT", "GOD_COMPONENT", "ORCHESTRATION_HEAVY_COMPONENT"]
    .map((k) => ({ k, c: dc[k as keyof typeof dc] ?? 0 }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)[0];
  const primaryCtaLabel = topIssue?.k === "TEMPLATE_HEAVY_COMPONENT"
    ? (t.overview as { ctaPrimaryTemplate?: string }).ctaPrimaryTemplate
    : topIssue?.k === "GOD_COMPONENT" || topIssue?.k === "ORCHESTRATION_HEAVY_COMPONENT"
      ? (t.overview as { ctaPrimaryOrchestration?: string }).ctaPrimaryOrchestration
      : (t.overview as { ctaPrimaryCritical?: string }).ctaPrimaryCritical;
  html += renderOverviewActionNav(t, {
    primaryCtaLabel: primaryCtaLabel ?? undefined,
    hasPatterns: archPatterns.length > 0 || featurePatterns.length > 0,
    sectionHtmlId: "overview-next-steps",
  });

  return html;
}

function renderComponentsPage(
  snapshot: AnalysisSnapshot,
  sections: { id: string; items?: unknown[]; data?: Record<string, unknown> }[],
  t: ReturnType<typeof getTranslations>,
  formatIssue: (issue: string | null) => string
): string {
  const result = snapshot.result;
  const pageTitle = (t.components as Record<string, string>).title ?? "Components";
  const pageHelper = (t.components as Record<string, string>).filterHelper;
  const filtersLabel = (t.filters as Record<string, string>).sortBy ?? "Sort by";
  const tf = t.filters as Record<string, string | undefined>;
  const searchPlaceholder = tf.searchPlaceholder ?? "Search components…";
  const searchAriaLabel = tf.searchAriaLabel ?? searchPlaceholder;
  const searchHelper = tf.searchHelper ?? "";
  const clearSearchLabel = (t.actions as Record<string, string | undefined>).clearSearch ?? "Clear search";
  const sortOptions = [
    { value: "highest-risk", label: tf.sortHighestRisk ?? "Highest risk" },
    { value: "line-count", label: tf.sortLineCount ?? "Line count" },
    { value: "dependency-count", label: tf.sortDependencyCount ?? "Dependency count" },
    { value: "template-complexity", label: tf.sortTemplateComplexity ?? "Template complexity" },
    { value: "warning-count", label: tf.sortWarningCount ?? "Warning count" },
    { value: "severity", label: tf.sortSeverity ?? "Severity (highest first)" },
    { value: "name", label: tf.sortName ?? "Name" },
    { value: "diff-impact", label: tf.sortDiffImpact ?? "Diff impact" },
    { value: "worse-first", label: tf.sortWorseFirst ?? "Worse first" },
    { value: "better-first", label: tf.sortBetterFirst ?? "Better first" },
  ];
  const sortHelper = tf.sortHelper ?? "";
  const showHealthyLabel = (t.components as Record<string, string>).showHealthyComponents ?? "Show healthy components";
  const pageSizeLabel = (t.filters as Record<string, string>).pageSize ?? "Per page";
  const tc = t.components as Record<string, string | undefined>;
  const baselineBarLabel = tc.explorerBaselineActive ?? "Comparing against snapshot: {date}";
  const baselineBarMulti = tc.explorerBaselineActiveMulti ?? "{count} baseline snapshots selected.";
  const baselineClearLbl = tc.explorerBaselineClearAll ?? "Clear compare";
  const baselineProjectTpl = tc.explorerBaselineComparingProject ?? "Comparing project: {project}";
  const baselineSnapshotTpl = tc.explorerBaselineSnapshotLabel ?? "Baseline snapshot: {date}";
  const baselineChangeLbl = tc.explorerChangeBaseline ?? "Change baseline";
  const componentsCompareCta = (tf as Record<string, string | undefined>).componentsCompareCta ?? "Compare components with a previous snapshot";
  const filtersHtml = `
    <div class="components-page-header">
      <h2 class="page-section-title section-title-caps">${escapeHtml(pageTitle)}</h2>
      ${pageHelper ? `<p class="section-helper text-muted">${escapeHtml(pageHelper)}</p>` : ""}
    </div>
    <div class="components-compare-entry" data-components-compare-entry>
      <button type="button" class="components-compare-entry-btn" data-components-compare-open>${escapeHtml(componentsCompareCta)}</button>
    </div>
    <div id="components-explorer-baseline-bar" class="components-explorer-baseline-bar" hidden aria-live="polite">
      <div class="components-explorer-baseline-main">
        <p id="components-explorer-baseline-project-line" class="components-explorer-baseline-line components-explorer-baseline-project-line" data-template-project="${escapeHtml(baselineProjectTpl)}"></p>
        <p id="components-explorer-baseline-snapshot-line" class="components-explorer-baseline-line text-muted components-explorer-baseline-snapshot-line" data-template-snapshot="${escapeHtml(baselineSnapshotTpl)}"></p>
        <p id="components-explorer-baseline-summary" class="components-explorer-baseline-summary-line text-muted"></p>
        <p id="components-explorer-baseline-legacy-text" class="components-explorer-baseline-text" hidden data-baseline-template-single="${escapeHtml(baselineBarLabel)}" data-baseline-template-multi="${escapeHtml(baselineBarMulti)}"></p>
      </div>
      <div class="components-explorer-baseline-actions">
        <button type="button" id="components-explorer-baseline-change" class="components-baseline-action-btn" hidden>${escapeHtml(baselineChangeLbl)}</button>
        <button type="button" id="components-explorer-baseline-clear" class="components-baseline-clear-btn" hidden>${escapeHtml(baselineClearLbl)}</button>
      </div>
    </div>
    <div class="components-explorer-filters" id="components-filters">
      <input type="hidden" id="filter-rule-id" value="" />
      <input type="hidden" id="filter-structure-concern" value="" />
      <input type="hidden" id="filter-project" value="" />
      <div class="components-explorer-filters-primary">
        <div class="components-search-row">
          <div class="components-search-wrap">
            <input type="search" id="components-search" class="components-search-input" placeholder="${escapeHtml(searchPlaceholder)}" aria-label="${escapeHtml(searchAriaLabel)}"${searchHelper ? ` aria-describedby="components-search-desc"` : ""} autocomplete="off" />
            <button type="button" id="components-search-clear" class="components-search-clear" hidden aria-label="${escapeHtml(clearSearchLabel)}">${escapeHtml(clearSearchLabel)}</button>
          </div>
          ${searchHelper ? `<p id="components-search-desc" class="components-search-helper text-muted">${escapeHtml(searchHelper)}</p>` : ""}
          <p id="components-search-match-count" class="components-search-match-count text-muted" role="status" aria-live="polite"></p>
        </div>
        <div class="components-explorer-filters-row">
          <div class="components-sort-wrap">
            <label class="components-sort-label">${escapeHtml(filtersLabel)}:
              <select id="components-sort" aria-describedby="components-sort-desc">
                ${sortOptions.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}
              </select>
            </label>
            <p id="components-sort-desc" class="components-sort-helper text-muted">${escapeHtml(sortHelper)}</p>
          </div>
          <label>${escapeHtml(pageSizeLabel)}:
            <select id="components-page-size">
              <option value="25" selected>25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>
      </div>
      <div class="components-explorer-filters-secondary">
        <label>${escapeHtml(t.filters.issueType)}:
          <select id="filter-issue-type">
            <option value="all">${escapeHtml(t.filters.allTypes)}</option>
            <option value="TEMPLATE_HEAVY_COMPONENT">${escapeHtml(t.issues.TEMPLATE_HEAVY_COMPONENT)}</option>
            <option value="GOD_COMPONENT">${escapeHtml(t.issues.GOD_COMPONENT)}</option>
            <option value="CLEANUP_RISK_COMPONENT">${escapeHtml(t.issues.CLEANUP_RISK_COMPONENT)}</option>
            <option value="ORCHESTRATION_HEAVY_COMPONENT">${escapeHtml(t.issues.ORCHESTRATION_HEAVY_COMPONENT)}</option>
            <option value="LIFECYCLE_RISKY_COMPONENT">${escapeHtml(t.issues.LIFECYCLE_RISKY_COMPONENT)}</option>
            <option value="NO_DOMINANT_ISSUE">${escapeHtml((t.components as Record<string, string>).noDominantIssue ?? "No dominant issue")}</option>
          </select>
        </label>
        <label>${escapeHtml(t.filters.severity)}:
          <select id="filter-severity">
            <option value="all">${escapeHtml(t.filters.all)}</option>
            <option value="CRITICAL">${escapeHtml(t.severity.critical)}</option>
            <option value="HIGH">${escapeHtml(t.severity.high)}</option>
            <option value="WARNING">${escapeHtml(t.severity.warning)}</option>
            <option value="LOW">${escapeHtml((t.severity as Record<string, string>).low ?? "Low")}</option>
          </select>
        </label>
        <label class="components-show-healthy-wrap">
          <input type="checkbox" id="show-healthy-components" />
          ${escapeHtml(showHealthyLabel)}
        </label>
        <div class="components-compare-filter-wrap">
          <label class="components-compare-filter-label">${escapeHtml(tf.compareBaseline ?? "Compare vs baseline")}
            <select id="filter-compare-diff" aria-describedby="filter-compare-diff-desc" disabled>
              <option value="all">${escapeHtml(tf.compareAll ?? "All (compare)")}</option>
              <option value="changed-only">${escapeHtml(tf.compareChangedOnly ?? "Changed only")}</option>
              <option value="worse">${escapeHtml(tf.compareWorse ?? "Worse")}</option>
              <option value="better">${escapeHtml(tf.compareBetter ?? "Better")}</option>
              <option value="resolved">${escapeHtml(tf.compareResolved ?? "Resolved")}</option>
              <option value="new">${escapeHtml(tf.compareNew ?? "New")}</option>
              <option value="issue-changed">${escapeHtml(tf.compareIssueChanged ?? "Issue changed")}</option>
            </select>
          </label>
          <p id="filter-compare-diff-desc" class="components-compare-filter-helper text-muted">${escapeHtml(tf.compareFilterHelper ?? "")}</p>
        </div>
      </div>
    </div>`;

  const explorerSection = sections.find((s) => s.id === "components-explorer");
  const explorerItems = (snapshot.componentsExplorerItems ?? []) as Array<{
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
    subscriptionCount?: number | null;
    subscriptionCountStatus?: "known" | "zero" | "unknown";
    serviceOrchestrationCount?: number | null;
    serviceOrchestrationCountStatus?: "known" | "zero" | "unknown";
    totalWarningCount?: number;
    project?: string | null;
    triggeredRuleIds?: string[];
    baseSeverity?: import("./html-report-presenter").CanonicalSeverityCode | null;
    computedRiskScore?: number;
    computedSeverity?: import("./html-report-presenter").CanonicalSeverityCode;
    confidence?: "measured" | "inferred" | "low";
    anomalyFlag?: "metrics-missing-with-warnings" | "severity-missing-with-critical-rules" | "none";
    anomalyReasons?: string[];
  }>;
  const totalComponents = (explorerSection?.data?.totalComponents as number) ?? result.workspaceSummary.componentCount;

  if (explorerItems.length === 0) {
    return filtersHtml + renderEmptyState(t.empty.noComponents);
  }

  const detailsMap = buildComponentDetailsMap(result);
  const pathToFamily = new Map<string, { familyName: string; isExtraction: boolean }>();
  for (const f of result.extractionCandidates ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily.has(key)) pathToFamily.set(key, { familyName: f.familyName, isExtraction: true });
    }
  }
  for (const f of result.similarComponentFamilies ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily.has(key)) pathToFamily.set(key, { familyName: f.familyName, isExtraction: false });
    }
  }
  for (const f of result.repeatedArchitectureHotspots ?? []) {
    for (const m of f.members ?? []) {
      const key = (m.filePath ?? "").replace(/\\/g, "/");
      if (key && !pathToFamily.has(key)) pathToFamily.set(key, { familyName: f.familyName, isExtraction: false });
    }
  }
  const rowInputs: ComponentExplorerRowInput[] = explorerItems.map((item) => {
    const entry = getComponentDetailEntry(detailsMap, item.filePath);
    const summaryInput = {
      refactorDirection: entry?.refactorDirection,
      diagnosticLabel: entry?.diagnosticLabel,
      dominantIssue: item.dominantIssue ?? entry?.dominantIssue,
      templateLineCount: item.templateLineCount ?? entry?.template?.lineCount,
      dependencyCount: item.dependencyCount ?? entry?.dependencyCount,
      structuralDepth: entry?.template?.structuralDepth,
      filePath: item.filePath,
      subscriptionCount: item.subscriptionCount ?? entry?.lifecycle?.subscribeCount,
      serviceOrchestrationCount:
        item.serviceOrchestrationCount ?? entry?.responsibility?.serviceOrchestrationCount,
      triggeredRuleIds: item.triggeredRuleIds,
      computedSeverity: item.computedSeverity,
      baseSeverity: item.baseSeverity ?? null,
      totalWarningCount: item.totalWarningCount,
      confidence: item.confidence,
      anomalyFlag: item.anomalyFlag,
      anomalyReasons: item.anomalyReasons,
    };
    const summaryLine = deriveComponentSummaryLine(summaryInput);
    const actionSuggestion = deriveDominantAction(summaryInput);
    const pathKey = (item.filePath ?? "").replace(/\\/g, "/");
    const familyInfo = pathToFamily.get(pathKey);
    const patternKey =
      item.dominantIssue && item.dominantIssue !== "NO_DOMINANT_ISSUE" && item.dominantIssue !== "__NO_DOMINANT_ISSUE__"
        ? item.dominantIssue
        : undefined;
    const displayName = item.className || item.fileName.replace(/\.component\.ts$/, "");
    const mainIssueFormatted = formatIssue(item.dominantIssue ?? null);
    const ruleTitles = (item.triggeredRuleIds ?? [])
      .map((id) => getRuleTitleForDisplay(id))
      .filter((x) => x.length > 0);
    const explorerSearchText = buildComponentExplorerSearchText({
      displayName,
      className: item.className,
      filePath: item.filePath,
      mainIssueFormatted,
      diagnosticLabel: entry?.diagnosticLabel,
      patternKey: patternKey ?? null,
      familyName: familyInfo?.familyName ?? null,
      project: item.project,
      componentRole: item.componentRole,
      inferredFeatureArea: item.inferredFeatureArea,
      sourceRoot: item.sourceRoot,
      triggeredRuleIds: item.triggeredRuleIds,
      ruleTitles,
      summaryLine,
      actionSuggestion,
    });
    return {
      ...item,
      mainIssueFormatted,
      summaryLine,
      actionSuggestion,
      patternKey: patternKey ?? null,
      familyName: familyInfo?.familyName ?? null,
      isExtractionCandidate: familyInfo?.isExtraction ?? false,
      propertyCount: entry?.propertyCount,
      subscriptionCount: item.subscriptionCount ?? entry?.lifecycle?.subscribeCount,
      serviceOrchestrationCount: item.serviceOrchestrationCount ?? entry?.responsibility?.serviceOrchestrationCount,
      explorerSearchText,
    };
  });

  const criticalCount = rowInputs.filter((r) => r.highestSeverity === "CRITICAL").length;
  const highCount = rowInputs.filter((r) => r.highestSeverity === "HIGH").length;
  const defaultPageSize = 25;
  const endRange = Math.min(defaultPageSize, rowInputs.length);
  const componentsSummaryHelper = (t.components as Record<string, string | undefined>).summaryHelper;
  const summaryStrip = renderComponentsSummaryStrip(
    endRange,
    rowInputs.length,
    criticalCount,
    highCount,
    "all",
    "all",
    t,
    rowInputs.length > 0 ? { start: 1, end: endRange } : undefined
  );

  const listHtml = renderComponentExplorerList(rowInputs, formatIssue, t);
  const emptyDetail =
    (t.empty as Record<string, string | undefined>).noMatchFiltersDetail ??
    "Active filters appear as chips below the toolbar. Remove chips or use Clear all filters.";
  const activeFiltersRegion =
    (t.components as Record<string, string | undefined>).activeFiltersRegion ?? "Active filters and sort";
  const emptyStateHtml = `
    <div class="components-explorer-empty components-empty-state-filtered" id="components-explorer-empty" style="display:none">
      <p class="components-explorer-empty-title" id="components-explorer-empty-title">${escapeHtml((t.empty as Record<string, string>).noMatchFilters ?? "No components match the current filters.")}</p>
      <p class="components-explorer-empty-hint" id="components-explorer-empty-hint">${escapeHtml((t.empty as Record<string, string>).noMatchFiltersHint ?? "Try adjusting filters or clearing them to see more results.")}</p>
      <p class="components-explorer-empty-detail">${escapeHtml(emptyDetail)}</p>
      <p class="components-explorer-empty-actions">
        <button type="button" id="components-reset-filters" class="btn-primary">${escapeHtml((t.components as Record<string, string>).clearAllFilters ?? (t.actions as Record<string, string>).resetFilters ?? "Clear all filters")}</button>
      </p>
    </div>`;
  const paginationHtml = `
    <div class="components-pagination" id="components-pagination">
      <button type="button" class="pagination-btn" id="pagination-prev" aria-label="Previous page">‹ Prev</button>
      <span class="pagination-pages" id="pagination-pages"></span>
      <button type="button" class="pagination-btn" id="pagination-next" aria-label="Next page">Next ›</button>
    </div>`;

  const activeFiltersHtml = `<div class="components-active-filters" id="components-active-filters" role="region" aria-label="${escapeHtml(activeFiltersRegion)}"></div>`;
  const helperHtml = componentsSummaryHelper ? `<p class="section-helper text-muted">${escapeHtml(componentsSummaryHelper)}</p>` : "";
  return filtersHtml + activeFiltersHtml + helperHtml + summaryStrip + `<div class="components-explorer-list-wrap" id="components-explorer-list-wrap" data-total-components="${totalComponents}">${listHtml}</div>` + paginationHtml + emptyStateHtml;
}

function renderPatternsPage(
  result: ScanResult,
  sections: { id: string; items?: unknown[] }[],
  t: ReturnType<typeof getTranslations>,
  formatIssue: (issue: string | null) => string,
  formatFamily: (name: string) => string,
  patternData: { patterns: Record<string, { name: string; drawerHtml: string }> }
): string {
  const diag = result.diagnosticSummary;
  const totalComponents = diag.totalComponents;
  const withDominant = diag.componentsWithDominantIssue;
  const workspaceContext = (t.patterns as { workspaceContext?: string }).workspaceContext ?? "{count} components with dominant architectural issues";
  const workspaceContextTotal = (t.patterns as { workspaceContextTotal?: string }).workspaceContextTotal ?? "Across {total} total components";

  const pt = t.patterns as {
    pagePurpose?: string;
    pagePurposeBullet1?: string;
    pagePurposeBullet2?: string;
    dominantFamiliesTitle?: string;
    dominantFamiliesHelper?: string;
    repeatedArchitectureTitle?: string;
    repeatedArchitectureHelper?: string;
    repeatedFeatureImplementationsTitle?: string;
    repeatedFeatureImplementationsHelper?: string;
    repeatedArchitectureEmptyCompact?: string;
    repeatedFeatureEmptyCompact?: string;
    repeatedFeatureEmptyCompactLine2?: string;
    ctaTitle?: string;
    ctaExploreComponents?: string;
    ctaRefactorPlan?: string;
    ctaReviewExtractionOpportunities?: string;
  };

  const workspaceContextFormatted = formatTemplate(
    workspaceContext,
    { count: withDominant },
    {
      fallback: `${withDominant} components with dominant architectural issues`,
      context: "patterns.workspaceContext",
    }
  );
  const workspaceContextSafe = ensureNoUnresolvedTokens(workspaceContextFormatted, {
    fallback: `${withDominant} components with dominant architectural issues`,
    context: "patterns.workspaceContext",
  });

  let html = `<div class="patterns-workspace-context">${escapeHtml(workspaceContextSafe)}<br><span class="patterns-workspace-total">${escapeHtml(workspaceContextTotal.replace("{total}", String(totalComponents)))}</span></div>`;

  html += renderPatternSummaryZone({ result, sections, formatIssue, t });

  if (pt.pagePurpose) {
    const bullet1 = pt.pagePurposeBullet1 ? escapeHtml(pt.pagePurposeBullet1) : "";
    const bullet2 = pt.pagePurposeBullet2 ? escapeHtml(pt.pagePurposeBullet2) : "";
    const bullets = [bullet1, bullet2].filter(Boolean).join(" · ");
    html += `<div class="patterns-page-purpose patterns-page-purpose-minimal">${escapeHtml(pt.pagePurpose)}${bullets ? `: ${bullets}` : ""}</div>`;
  }
  const diffExpl = (t.patterns as { crossFamilyVsRepeatedFeatureExplanation?: string }).crossFamilyVsRepeatedFeatureExplanation;
  if (diffExpl) {
    html += `<details class="patterns-difference-explanation"><summary>What's the difference?</summary><p class="section-helper text-muted">${escapeHtml(diffExpl)}</p></details>`;
  }

  const patternOverviewHtml = renderPatternOverviewGrid({
    dominantIssueCounts: result.diagnosticSummary.dominantIssueCounts,
    totalComponents,
    formatIssue,
    t,
    result,
  });

  if (patternOverviewHtml) {
    const dominantTitle = pt.dominantFamiliesTitle ?? (t.patterns as { patternOverview?: string }).patternOverview ?? "Dominant Pattern Families";
    const dominantHelper = pt.dominantFamiliesHelper;
    html += `<h2 class="page-section-title">${escapeHtml(dominantTitle)}</h2>`;
    if (dominantHelper) html += `<p class="section-helper text-muted">${escapeHtml(dominantHelper)}</p>`;
    html += patternOverviewHtml;
  }

  const archSection = sections.find((s) => s.id === "architecture-patterns");
  const featureSection = sections.find((s) => s.id === "feature-patterns");
  const archItems = (archSection?.items ?? []) as Array<{
    familyName: string;
    components: Array<{ className: string; fileName: string; filePath: string; dominantIssue: string }>;
    commonSignals: string[];
    dominantIssues: string[];
    sharedRefactorOpportunity: string;
    recommendedExtractions: string[];
    confidence: number;
    confidenceBreakdown?: unknown;
  }>;
  const featureItems = (featureSection?.items ?? []) as Array<{
    patternType: string;
    featureName: string;
    instanceCount: number;
    confidence: number;
    components: string[];
    filePaths?: string[];
    sharedSignals: string[];
    architecturalPattern: string;
    duplicationRisk: string;
    recommendation: string;
    suggestedRefactor: string[];
  }>;

  const archTitle = pt.repeatedArchitectureTitle ?? t.patterns.repeatedArchitecture;
  const archHelper = pt.repeatedArchitectureHelper;
  html += `<h2 class="page-section-title">${escapeHtml(archTitle)}</h2>`;
  if (archHelper) html += `<p class="section-helper text-muted">${escapeHtml(archHelper)}</p>`;
  if (archItems.length === 0) {
    html += renderPatternEmptyState({
      message: pt.repeatedArchitectureEmptyCompact ?? (t.empty as { noRepeatedArchitecture?: string }).noRepeatedArchitecture ?? t.empty.noPatterns,
      hint: (t.patterns as { repeatedArchitectureEmptyHint?: string }).repeatedArchitectureEmptyHint,
      nextAction: (t.patterns as { repeatedArchitectureEmptyNext?: string }).repeatedArchitectureEmptyNext,
      links: [
        { href: "#planner", label: pt.ctaRefactorPlan ?? "Refactor Plan" },
        { href: "#components", label: pt.ctaExploreComponents ?? "Components" },
      ],
    });
  } else {
    html += `<div class="card-list">${archItems
      .map((f) =>
        renderComponentFamilyInsightCard(
          {
            familyName: formatFamily(f.familyName),
            components: f.components,
            commonSignals: f.commonSignals ?? [],
            dominantIssues: f.dominantIssues.map((d) => formatIssue(d)),
            sharedRefactorOpportunity: f.sharedRefactorOpportunity,
            recommendedExtractions: f.recommendedExtractions ?? [],
            confidence: f.confidence ?? 0,
            confidenceBreakdown: f.confidenceBreakdown as import("../../confidence/confidence-models").ConfidenceBreakdown | undefined,
          },
          t
        )
      )
      .join("")}</div>`;
  }

  const featTitle = pt.repeatedFeatureImplementationsTitle ?? t.patterns.featurePatterns;
  const featHelper = pt.repeatedFeatureImplementationsHelper ?? (t.patterns as { featurePatternsHelper?: string }).featurePatternsHelper;
  html += `<h2 class="page-section-title">${escapeHtml(featTitle)}</h2>`;
  if (featHelper) html += `<p class="section-helper text-muted">${escapeHtml(featHelper)}</p>`;
  if (featureItems.length === 0) {
    html += renderPatternEmptyState({
      message: pt.repeatedFeatureEmptyCompact ?? (t.empty as { noFeaturePatterns?: string }).noFeaturePatterns ?? t.empty.noPatterns,
      hint: pt.repeatedFeatureEmptyCompactLine2 ?? (t.patterns as { repeatedFeatureEmptyHint?: string }).repeatedFeatureEmptyHint,
      nextAction: (t.patterns as { repeatedFeatureEmptyNext?: string }).repeatedFeatureEmptyNext,
      links: [
        { href: "#planner", label: pt.ctaRefactorPlan ?? "Refactor Plan" },
        { href: "#components", label: pt.ctaExploreComponents ?? "Components" },
      ],
    });
  } else {
    const componentDetailsMap = buildComponentDetailsMap(result);
    html += `<div class="card-list">${featureItems.map((p) => renderFeaturePatternCard(p, componentDetailsMap, t)).join("")}</div>`;
  }

  if (pt.ctaTitle && (pt.ctaExploreComponents || pt.ctaRefactorPlan || pt.ctaReviewExtractionOpportunities)) {
    const hasExtraction = featureItems.some((p: { duplicationRisk?: string }) => p.duplicationRisk === "high") || archItems.length > 0;
    const hasDominant = (result.diagnosticSummary.dominantIssueCounts && Object.values(result.diagnosticSummary.dominantIssueCounts).some((c: number) => c > 0));
    const ctaLinks: string[] = [];
    if (hasExtraction) {
      if (pt.ctaReviewExtractionOpportunities) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link patterns-cta-primary">${escapeHtml(pt.ctaReviewExtractionOpportunities)}</a>`);
      if (pt.ctaExploreComponents) ctaLinks.push(`<a href="#components" data-page="components" class="patterns-cta-link">${escapeHtml(pt.ctaExploreComponents)}</a>`);
      if (pt.ctaRefactorPlan) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link">${escapeHtml(pt.ctaRefactorPlan)}</a>`);
    } else if (hasDominant) {
      if (pt.ctaExploreComponents) ctaLinks.push(`<a href="#components" data-page="components" class="patterns-cta-link patterns-cta-primary">${escapeHtml(pt.ctaExploreComponents)}</a>`);
      if (pt.ctaRefactorPlan) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link">${escapeHtml(pt.ctaRefactorPlan)}</a>`);
      if (pt.ctaReviewExtractionOpportunities) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link">${escapeHtml(pt.ctaReviewExtractionOpportunities)}</a>`);
    } else {
      if (pt.ctaRefactorPlan) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link patterns-cta-primary">${escapeHtml(pt.ctaRefactorPlan)}</a>`);
      if (pt.ctaExploreComponents) ctaLinks.push(`<a href="#components" data-page="components" class="patterns-cta-link">${escapeHtml(pt.ctaExploreComponents)}</a>`);
      if (pt.ctaReviewExtractionOpportunities) ctaLinks.push(`<a href="#planner" data-page="planner" class="patterns-cta-link">${escapeHtml(pt.ctaReviewExtractionOpportunities)}</a>`);
    }
    if (ctaLinks.length > 0) {
      html += `<div class="patterns-cta-block"><h3 class="patterns-cta-title">${escapeHtml(pt.ctaTitle)}</h3><div class="patterns-cta-links">${ctaLinks.join("")}</div></div>`;
    }
  }

  return html;
}

function renderRulesPage(
  result: ScanResult,
  t: ReturnType<typeof getTranslations>
): string {
  const ruleViolationCounts = result.ruleViolationCounts ?? {};
  const ruleToAffectedComponents = result.ruleToAffectedComponents ?? {};
  const totalComponents = result.workspaceSummary.componentCount;
  const rulesByCategory = getRulesByCategory();
  const categoryLabels: Record<string, string> = {
    "component-size": t.rules.categoryComponentSize,
    "template-complexity": t.rules.categoryTemplateComplexity,
    "responsibility-god": t.rules.categoryResponsibilityGod,
    "lifecycle-cleanup": t.rules.categoryLifecycleCleanup,
    "dependency-orchestration": t.rules.categoryDependencyOrchestration,
  };

  const enrichedRules = enrichRulesWithWorkspaceData(
    RULES_REGISTRY,
    ruleViolationCounts,
    ruleToAffectedComponents,
    totalComponents
  );
  const enrichedByRuleId = new Map(enrichedRules.map((e) => [e.rule.id, e]));
  const topActionableRules = getTopActionableRules(enrichedRules, 5);

  const triggeredCount = RULES_REGISTRY.filter((r) => (ruleViolationCounts[r.id] ?? 0) > 0).length;
  const notTriggeredCount = RULES_REGISTRY.length - triggeredCount;

  const mostTriggered = Object.entries(ruleViolationCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];
  const mostTriggeredRule = mostTriggered ? getRuleById(mostTriggered[0]) : null;
  const mostTriggeredLabel = mostTriggeredRule
    ? `${mostTriggeredRule.title} (${mostTriggered[1]})`
    : t.rules.summaryMostTriggeredNone;

  const filterAll = t.rules.filterAll;
  const categoryOptions = Array.from(rulesByCategory.keys()).map(
    (cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(categoryLabels[cat] ?? cat)}</option>`
  );

  const pageIdentityPurpose = (t.rules as Record<string, string | undefined>).pageIdentityPurpose ?? "Architectural rules Modulens uses";
  const pageIdentityContext = (t.rules as Record<string, string | undefined>).pageIdentityContext ?? "How often they triggered in this workspace";
  const pageIdentityAction = (t.rules as Record<string, string | undefined>).pageIdentityAction ?? "How to inspect affected components";
  const summaryTriggered = (t.rules as Record<string, string | undefined>).summaryTriggered ?? "Triggered in workspace";
  const summaryNotTriggered = (t.rules as Record<string, string | undefined>).summaryNotTriggered ?? "Not triggered";
  const summaryTotalFindings = (t.rules as Record<string, string | undefined>).summaryTotalFindings ?? t.hero.warnings;
  const summaryTotalFindingsHelper = (t.rules as Record<string, string | undefined>).summaryTotalFindingsHelper;
  const totalFindings = result.workspaceSummary.totalFindings;

  const topRulesTitle = t.rules.topRulesToActOnFirst ?? "Top rules to act on first";
  const topRulesHelper = t.rules.topRulesToActOnFirstHelper ?? "Prioritized by impact, severity, and affected components.";
  const sortByLabel = t.rules.sortBy ?? "Sort by";
  const sortByPriority = t.rules.sortByPriority ?? "Priority";
  const sortByAffected = t.rules.sortByAffected ?? "Affected components";
  const sortByCount = t.rules.sortByCount ?? "Violation count";
  const sortByCategory = t.rules.sortByCategory ?? "Category";

  let html = `
    <div class="rules-page-identity">
      <p class="rules-page-identity-purpose">${escapeHtml(pageIdentityPurpose)}</p>
      <p class="rules-page-identity-context">${escapeHtml(pageIdentityContext)}</p>
      <p class="rules-page-identity-action">${escapeHtml(pageIdentityAction)}</p>
      ${summaryTotalFindingsHelper ? `<p class="section-helper text-muted">${escapeHtml(summaryTotalFindingsHelper)}</p>` : ""}
    </div>
    <div class="rules-summary-block">
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(summaryTotalFindings)}</span>
        <span class="rules-summary-value">${totalFindings}</span>
      </div>
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(t.rules.summaryTotalRules)}</span>
        <span class="rules-summary-value">${RULES_REGISTRY.length}</span>
      </div>
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(t.rules.summaryCategories)}</span>
        <span class="rules-summary-value">${rulesByCategory.size}</span>
      </div>
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(summaryTriggered)}</span>
        <span class="rules-summary-value">${triggeredCount}</span>
      </div>
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(summaryNotTriggered)}</span>
        <span class="rules-summary-value">${notTriggeredCount}</span>
      </div>
      <div class="rules-summary-item">
        <span class="rules-summary-label">${escapeHtml(t.rules.summaryMostTriggered)}</span>
        <span class="rules-summary-value">${escapeHtml(mostTriggeredLabel)}</span>
      </div>
    </div>`;

  if (topActionableRules.length > 0) {
    html += `
    <div class="top-actionable-rules-section">
      <h2 class="page-section-title">${escapeHtml(topRulesTitle)}</h2>
      <p class="section-helper text-muted">${escapeHtml(topRulesHelper)}</p>
      <div class="top-actionable-rules-list" id="top-actionable-rules-list">`;
    for (const enriched of topActionableRules) {
      html += renderTopActionableRuleCard(
        enriched.rule,
        t,
        enriched.violationCount,
        enriched.affectedComponentCount
      );
    }
    html += `</div></div>`;
  }

  html += `
    <div class="rules-filter-bar">
      <div class="rules-filter-primary">
        <div class="rules-filter-row rules-filter-row-search">
          <label for="rules-filter-search">${escapeHtml(t.rules.filterSearch)}</label>
          <input type="text" id="rules-filter-search" placeholder="${escapeHtml(t.rules.filterSearch)}" class="rules-filter-search-input" />
        </div>
        <div class="rules-filter-row">
          <label for="rules-filter-triggered">${escapeHtml(t.rules.filterTriggered)}</label>
          <select id="rules-filter-triggered">
            <option value="">${escapeHtml(filterAll)}</option>
            <option value="true">${escapeHtml(t.rules.filterTriggeredOnly)}</option>
            <option value="false">${escapeHtml(t.rules.filterNotTriggered)}</option>
          </select>
        </div>
      </div>
      <div class="rules-filter-secondary">
        <div class="rules-filter-row">
          <label for="rules-filter-sort">${escapeHtml(sortByLabel)}</label>
          <select id="rules-filter-sort">
            <option value="priority">${escapeHtml(sortByPriority)}</option>
            <option value="affected">${escapeHtml(sortByAffected)}</option>
            <option value="count">${escapeHtml(sortByCount)}</option>
            <option value="category">${escapeHtml(sortByCategory)}</option>
          </select>
        </div>
        <div class="rules-filter-row">
          <label for="rules-filter-category">${escapeHtml(t.rules.filterCategory)}</label>
          <select id="rules-filter-category">
            <option value="">${escapeHtml(filterAll)}</option>
            ${categoryOptions.join("")}
          </select>
        </div>
        <div class="rules-filter-row">
          <label for="rules-filter-severity">${escapeHtml(t.rules.filterSeverity)}</label>
          <select id="rules-filter-severity">
            <option value="">${escapeHtml(filterAll)}</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="warning">Warning</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>
    </div>
    <div class="rules-showing-strip" id="rules-showing-strip"></div>`;

  for (const [category, rules] of Array.from(rulesByCategory.entries())) {
    const label = categoryLabels[category] ?? category;
    html += `<div class="rules-category-section" data-category="${escapeHtml(category)}">`;
    html += `<h2 class="page-section-title">${escapeHtml(label)}</h2>`;
    html += `<div class="card-list rules-card-list">`;
    for (const rule of rules) {
      const enriched = enrichedByRuleId.get(rule.id);
      const count = enriched?.violationCount ?? ruleViolationCounts[rule.id] ?? 0;
      const affectedCount = enriched?.affectedComponentCount ?? ruleToAffectedComponents[rule.id]?.length ?? 0;
      const priorityScore = enriched?.priorityScore ?? 0;
      html += renderRuleCard(rule, t, count, affectedCount, priorityScore);
    }
    html += `</div></div>`;
  }

  return `<div class="rules-page">${html}</div>`;
}

function renderStructurePage(
  result: ScanResult,
  t: ReturnType<typeof getTranslations>
): string {
  const concerns = result.structureConcerns;
  const s = (t as { structure?: Record<string, string> }).structure;

  if (!concerns || concerns.concerns.length === 0) {
    const noConcerns = s?.noConcernsDetected ?? "No structural concerns detected";
    const helper = s?.noConcernsHelper ?? "Heuristics are conservative.";
    return `<div class="structure-page">
      <p class="section-helper text-muted">${escapeHtml(s?.pageHelper ?? "")}</p>
      <div class="structure-empty-state">
        <p class="structure-empty-message">${escapeHtml(noConcerns)}</p>
        <p class="structure-empty-helper text-muted">${escapeHtml(helper)}</p>
      </div>
    </div>`;
  }

  const mostCommonLabel = concerns.mostCommonType
    ? getStructureConcernTypeLabel(concerns.mostCommonType, t)
    : (s?.summaryMostCommon ?? "—");
  const primarySmellLabel = concerns.primaryStructuralSmell
    ? getStructureConcernTypeLabel(concerns.primaryStructuralSmell, t)
    : mostCommonLabel;
  const highConfidenceCount = concerns.highConfidenceCount ?? 0;
  const mostAffectedArea = formatAreaLabelForDisplay(concerns.mostAffectedArea ?? "") || "—";
  const insightSentence = concerns.insightSentence ?? "";
  const mostCommonShare =
    concerns.mostCommonShare ??
    (concerns.mostCommonType && concerns.totalConcerns > 0
      ? (concerns.concerns.find((c) => c.concernType === concerns.mostCommonType)?.affectedCount ?? 0) /
        concerns.totalConcerns
      : undefined);
  const recommendedFirst = concerns.concerns
    .filter((c) => c.confidence === "high" && (c.impact === "high" || c.impact === "medium"))
    .sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const aImp = impactOrder[a.impact ?? "medium"] ?? 1;
      const bImp = impactOrder[b.impact ?? "medium"] ?? 1;
      if (aImp !== bImp) return aImp - bImp;
      return (b.affectedCount ?? 0) - (a.affectedCount ?? 0);
    })[0];

  const generatedDate = result.generatedAt
    ? new Date(result.generatedAt).toLocaleString()
    : "";
  const workspaceShort =
    result.workspacePath && result.workspacePath.length > 50
      ? result.workspacePath.substring(0, 47) + "..."
      : result.workspacePath ?? "";

  let html = "";
  html += `
    <div class="structure-page-header">
      <h1 class="structure-page-title">${escapeHtml(s?.sectionTitle ?? "Structural Concerns")}</h1>
      ${workspaceShort || generatedDate ? `<p class="structure-page-context">${workspaceShort ? escapeHtml(workspaceShort) : ""}${workspaceShort && generatedDate ? " · " : ""}${generatedDate ? escapeHtml(generatedDate) : ""}</p>` : ""}
    </div>`;
  if (s?.pageHelper) {
    html += `<p class="section-helper text-muted">${escapeHtml(s.pageHelper)}</p>`;
  }
  html += `
    <div class="structure-summary-header">
      <div class="structure-kpi-grid">
        <div class="structure-kpi-item">
          <span class="structure-kpi-label">${escapeHtml(s?.summaryTotalConcerns ?? "Total structure concerns")}</span>
          <span class="structure-kpi-value">${concerns.totalConcerns}</span>
        </div>
        <div class="structure-kpi-item">
          <span class="structure-kpi-label">${escapeHtml(s?.summaryHighConfidence ?? "High confidence concerns")}</span>
          <span class="structure-kpi-value">${highConfidenceCount}</span>
        </div>
        <div class="structure-kpi-item">
          <span class="structure-kpi-label">${escapeHtml(s?.summaryMostAffectedArea ?? "Most affected area")}</span>
          <span class="structure-kpi-value structure-kpi-chip">${escapeHtml(mostAffectedArea || "—")}</span>
        </div>
        <div class="structure-kpi-item">
          <span class="structure-kpi-label">${escapeHtml(s?.summaryPrimarySmell ?? "Primary structural smell")}</span>
          <span class="structure-kpi-value">${escapeHtml(primarySmellLabel)}</span>
        </div>
      </div>
      ${insightSentence ? `<p class="structure-insight">${escapeHtml(insightSentence)}</p>` : ""}
      ${concerns.mostCommonType && mostCommonShare != null ? `<p class="structure-most-common-share">${(s?.mostCommonAccountsFor ?? "{type} accounts for {pct}% of detected structure concerns.").replace("{type}", escapeHtml(getStructureConcernTypeLabel(concerns.mostCommonType, t))).replace("{pct}", String(Math.round(mostCommonShare * 100)))}</p>` : ""}
      ${recommendedFirst ? `<div class="structure-recommended-first"><span class="structure-recommended-label">${escapeHtml(s?.recommendedFirstFix ?? "Recommended first fix")}:</span> <button type="button" class="structure-recommended-concern" data-concern-type="${escapeHtml(recommendedFirst.concernType)}">${escapeHtml(getStructureConcernTypeLabel(recommendedFirst.concernType, t))}</button></div>` : ""}
    </div>

    <div class="structure-toolbar">
      <div class="structure-sort">
        <label for="structure-sort" class="structure-toolbar-label">${escapeHtml(s?.sortBy ?? "Sort by")}</label>
        <select id="structure-sort" class="structure-select" aria-label="${escapeHtml(s?.sortBy ?? "Sort by")}">
          <option value="impact">${escapeHtml(s?.sortByImpact ?? "Impact")}</option>
          <option value="confidence">${escapeHtml(s?.sortByConfidence ?? "Confidence")}</option>
          <option value="affected">${escapeHtml(s?.sortByAffectedFiles ?? "Affected files")}</option>
          <option value="type">${escapeHtml(s?.sortByConcernType ?? "Concern type")}</option>
        </select>
      </div>
      <div class="structure-filters">
        <label for="structure-filter-confidence" class="structure-toolbar-label">${escapeHtml(s?.filterConfidence ?? "Confidence")}</label>
        <select id="structure-filter-confidence" class="structure-select" aria-label="${escapeHtml(s?.filterConfidence ?? "Confidence")}">
          <option value="">${escapeHtml(s?.filterAllConfidence ?? "All")}</option>
          <option value="high">${escapeHtml(s?.confidenceHigh ?? "High")}</option>
          <option value="medium">${escapeHtml(s?.confidenceMedium ?? "Medium")}</option>
          <option value="low">${escapeHtml(s?.confidenceLow ?? "Low")}</option>
        </select>
        <label for="structure-filter-impact" class="structure-toolbar-label">${escapeHtml(s?.filterImpact ?? "Impact")}</label>
        <select id="structure-filter-impact" class="structure-select" aria-label="${escapeHtml(s?.filterImpact ?? "Impact")}">
          <option value="">${escapeHtml(s?.filterAllImpact ?? "All")}</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
    <div class="card-list rules-card-list" id="structure-concerns-list">`;

  for (const concern of concerns.concerns) {
    const isMostCommon = concern.concernType === concerns.mostCommonType;
    html += renderStructureConcernCard(concern, t, isMostCommon);
  }
  html += `</div>`;

  return `<div class="structure-page">${html}</div>`;
}

function getStructureConcernTypeLabel(concernType: string, t: ReturnType<typeof getTranslations>): string {
  const s = (t as { structure?: Record<string, string> }).structure;
  if (!s) return concernType.replace(/-/g, " ");
  const keys: Record<string, string> = {
    "deep-nesting": "deepNesting",
    "shared-dumping-risk": "sharedDumpingRisk",
    "generic-folder-overuse": "genericFolderOveruse",
    "suspicious-placement": "suspiciousPlacement",
    "feature-boundary-blur": "featureBoundaryBlur",
    "folder-density-concern": "folderDensity",
  };
  const key = keys[concernType] ?? concernType.replace(/-/g, "");
  return (s as Record<string, string>)[key] ?? concernType.replace(/-/g, " ");
}

function renderPlannerPage(
  result: ScanResult,
  sections: { id: string; title: string; description?: string; items?: unknown[]; data?: Record<string, unknown> }[],
  t: ReturnType<typeof getTranslations>,
  formatIssue: (issue: string | null) => string,
  formatFamily: (name: string) => string,
  formatSmell: (smell: string) => string
): string {
  const topSection = sections.find((s) => s.id === "top-refactor-targets");
  const extractionSection = sections.find((s) => s.id === "extraction-opportunities");
  const quickWinSection = sections.find((s) => s.id === "quick-wins");

  const topTargets = (topSection?.items ?? []) as Array<TopRefactorTarget & { project?: string | null }>;
  const extractions = (extractionSection?.items ?? []) as ExtractionOpportunity[];
  const quickWins = (quickWinSection?.items ?? []) as QuickWinCatalogItem[];

  const topCount = topTargets.length;
  const quickWinCount = quickWins.length;
  const extractionCount = extractions.length;

  const phaseFacts = computePlannerPhaseFacts(
    topTargets as TopRefactorTarget[],
    quickWins,
    extractions
  );
  const roiHints = computePlannerRoiHints(
    topTargets as TopRefactorTarget[],
    quickWins,
    extractions
  );
  const firstSteps = computeFirstThreeSteps(
    topTargets as TopRefactorTarget[],
    quickWins,
    extractions
  );
  const summaryStrings = computePlanningSummaryStrings(
    topTargets as TopRefactorTarget[],
    quickWins,
    extractions,
    roiHints
  );

  const plannerLabels = t.planner as Record<string, string | undefined>;

  const planningSummaryHtml = renderPlanningSummary({
    topCount,
    quickWinCount,
    extractionCount,
    highestRoiHint: undefined,
    bestImmediateStartHint: roiHints.bestImmediateStartLabel,
    bestStartingPoint: summaryStrings.bestStartingPoint,
    whyStartHere: summaryStrings.whyStartHere,
    whatUnlocksLater: summaryStrings.whatUnlocksLater,
    highestRoiLaterHint: roiHints.bestLaterStageExtractionLabel,
    suggestedPhase: phaseFacts.suggestedPhase,
    whereToStart: summaryStrings.whereToStart,
    whatComesNext: summaryStrings.whatComesNext,
    crossCuttingNote: summaryStrings.crossCuttingNote,
    firstSteps: firstSteps.map((s) => ({
      label: s.label,
      phase: s.phase,
      actionableCopy: s.actionableCopy,
    })),
    phaseDeliverables: {
      phase1: plannerLabels.phase1Deliverable,
      phase2: plannerLabels.phase2Deliverable,
      phase3: plannerLabels.phase3Deliverable,
    },
    labels: {
      topTargets: plannerLabels.planningSummaryTopTargets,
      quickWins: plannerLabels.planningSummaryQuickWins,
      extractionGroups: plannerLabels.planningSummaryExtractionGroups,
      highestRoi: plannerLabels.planningSummaryHighestRoi,
      bestImmediateStart: plannerLabels.planningSummaryBestImmediateStart,
      highestRoiLater: plannerLabels.planningSummaryHighestRoiLater,
      suggestedPhase: plannerLabels.planningSummarySuggestedPhase,
      phase1: plannerLabels.planningSummaryPhase1,
      phase2: plannerLabels.planningSummaryPhase2,
      phase3: plannerLabels.planningSummaryPhase3,
      bestStartingPoint: plannerLabels.planningSummaryBestStartingPoint,
      whyStartHere: plannerLabels.planningSummaryWhyStartHere,
      whatUnlocksLater: plannerLabels.planningSummaryWhatUnlocksLater,
      phase1Deliverable: plannerLabels.phase1Deliverable,
      phase2Deliverable: plannerLabels.phase2Deliverable,
      phase3Deliverable: plannerLabels.phase3Deliverable,
      firstStepsTitle: plannerLabels.planningSummaryFirstStepsTitle,
    },
  });

  const sectionIds = [
    "top-refactor-targets",
    "extraction-opportunities",
    "quick-wins",
  ];
  let html = planningSummaryHtml;
  for (const id of sectionIds) {
    const section = sections.find((s) => s.id === id);
    if (!section) continue;
    html += renderSectionHtml(
      section,
      result,
      t,
      formatIssue,
      formatFamily,
      formatSmell,
      true,
      buildWorkspaceSequencingState(phaseFacts),
      { topTargets, extractions, phaseFacts, roiHints }
    );
  }
  const content = html || renderEmptyState(t.empty.noData);
  return `<div class="planner-page">${content}</div>`;
}

function renderSectionHtml(
  section: { id: string; title: string; description?: string; items?: unknown[]; data?: Record<string, unknown> },
  result: ScanResult,
  t?: ReturnType<typeof getTranslations>,
  formatIssue?: (issue: string | null) => string,
  formatFamily?: (name: string) => string,
  formatSmell?: (smell: string) => string,
  isPlannerSection = false,
  sequencingState?: WorkspaceSequencingState,
  plannerContext?: {
    topTargets: TopRefactorTarget[];
    extractions: ExtractionOpportunity[];
    phaseFacts: ReturnType<typeof computePlannerPhaseFacts>;
    roiHints: ReturnType<typeof computePlannerRoiHints>;
  }
): string {
  const fmt = formatIssue ?? ((s: string | null) => formatDominantIssue(s));
  const translations = t ?? getTranslations();
  let content = "";

  switch (section.id) {
    case "scores": {
      const scores = section.data?.scores as ScanResult["scores"];
      const riskLevel = (section.data?.riskLevel as string) ?? "Low";
      const featurePatternCount = (section.data?.featurePatternCount as number) ?? 0;
      const reusableOpportunities = (section.data?.reusableOpportunities as number) ?? 0;
      content = renderDashboardCards(scores, riskLevel);
      content += renderScoreBreakdownSection(scores);
      if (featurePatternCount > 0 || reusableOpportunities > 0) {
        const archCards = [
          renderDashboardCard("Feature Patterns", String(featurePatternCount), "good", false),
          renderDashboardCard("Reusable Opportunities", String(reusableOpportunities), reusableOpportunities > 0 ? "medium" : "good", false),
        ].join("");
        content += `<div class="architecture-intelligence-grid"><h3 class="architecture-intelligence-title">Architecture Intelligence</h3><div class="dashboard-cards">${archCards}</div></div>`;
      }
      break;
    }
    case "refactor-blueprints": {
      const items = (section.items ?? []) as Array<{
        targetName: string;
        targetType: "component" | "family";
        currentProblem: string;
        proposedShape: string[];
        stateOwnership: string[];
        serviceBoundaries: string[];
        uiBoundaries: string[];
        migrationSteps: string[];
        project?: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState("No refactor blueprints generated.");
      } else {
        content = items
          .map((b) =>
            renderRefactorBlueprintCard(
              b.targetName,
              b.targetType,
              b.currentProblem,
              b.proposedShape,
              b.stateOwnership,
              b.serviceBoundaries,
              b.uiBoundaries,
              b.migrationSteps,
              b.project ?? undefined
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "refactor-first": {
      const items = (section.items ?? []) as Array<{
        componentName: string;
        filePath: string;
        dominantIssue: string;
        priority: "fix-now" | "fix-soon" | "monitor";
        impactScore: number;
        effort: string;
        whyNow: string[];
        suggestedAction: string;
        project?: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noRefactorTasks);
      } else {
        content = renderRefactorPlannerBuckets(items, fmt, translations);
      }
      break;
    }
    case "diagnostic-summary": {
      const data = section.data as {
        componentsWithDominantIssue: number;
        totalComponents: number;
        dominantIssueCounts: Record<string, number>;
      };
      const maxCount = Math.max(
        ...Object.values(data.dominantIssueCounts).filter((c) => c > 0),
        1
      );
      const barItems = Object.entries(data.dominantIssueCounts)
        .filter(([, c]) => c > 0)
        .map(([k, c]) =>
          renderDiagnosticSummaryBarItem(fmt(k), c, maxCount)
        );
      const summaryItem = renderDiagnosticSummaryItem(
        "With dominant issue",
        `${data.componentsWithDominantIssue} / ${data.totalComponents}`
      );
      content = `<div class="diagnostic-summary-grid">${summaryItem}${barItems.join("")}</div>`;
      break;
    }
    case "top-cross-cutting": {
      const items = (section.items ?? []) as Array<
        ComponentDiagnostic & { project: string | null }
      >;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noComponents);
      } else {
        const rows: TableCell[][] = items.map((d) => [
          `${d.fileName} (${d.className ?? "—"})`,
          raw(renderBadge(fmt(d.dominantIssue), "warning")),
          raw(renderChipList((d.supportingIssues ?? []).map((s) => fmt(s)))),
          d.refactorDirection,
          d.filePath,
        ]);
        const colClasses = ["", "", "", "refactor-direction", "path"];
        content = renderTable(
          ["Component", "Dominant Issue", "Supporting Issues", "Refactor Direction", "File Path"],
          rows,
          (i) =>
            `data-project="${escapeHtml(items[i].project ?? "")}" data-issue-type="${escapeHtml(items[i].dominantIssue ?? "")}" data-file-path="${escapeHtml(items[i].filePath)}"`,
          ["", "", "", "refactor-direction", "path"]
        );
      }
      break;
    }
    case "similar-families":
    case "hotspots": {
      const items = (section.items ?? []) as Array<ComponentFamily & { project: string | null }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noData);
      } else {
        const fmtFamilySim = formatFamily ?? ((x: string) => formatFamilyName(x));
        content = items
          .map((f) => {
            const commonWarnings = f.commonWarningPatterns?.length
              ? f.commonWarningPatterns
              : (f.members[0]?.warningCodes ?? []);
            return renderSimilarFamilyCard(
              fmtFamilySim(f.familyName),
              f.members.length,
              f.commonDominantIssue ? fmt(f.commonDominantIssue) : null,
              commonWarnings,
              f.refactorDirection,
              f.members.map((m) => m.fileName),
              f.project ?? undefined,
              f.commonDominantIssue ?? undefined,
              f.detectedRolePattern,
              {
                isWeakGrouping: f.isWeakGrouping,
                weakGroupingLabel: f.isWeakGrouping
                  ? (translations.patterns?.weakGroupingLabel ?? f.weakGroupingLabel ?? "Review similarity before extraction")
                  : undefined,
                representativeEvidence: f.representativeEvidence,
                outliers: f.outliers?.map((o) => ({ fileName: o.fileName })),
              }
            );
          })
          .join("");
      }
      break;
    }
    case "extraction-candidates": {
      const items = (section.items ?? []) as Array<ComponentFamily & { project: string | null }>;
      if (items.length === 0) {
        content = renderEmptyState("No extraction candidates found.");
      } else {
        const fmtFamilyExt = formatFamily ?? ((x: string) => formatFamilyName(x));
        content = items
          .map((f) =>
            renderExtractionCard(
              fmtFamilyExt(f.familyName),
              f.members.length,
              f.avgLineCount,
              f.refactorDirection,
              f.project ?? undefined,
              f.commonDominantIssue ?? undefined,
              f.detectedRolePattern,
              {
                isWeakGrouping: f.isWeakGrouping,
                weakGroupingLabel: f.isWeakGrouping
                  ? (translations.patterns?.weakGroupingLabel ?? f.weakGroupingLabel ?? "Review similarity before extraction")
                  : undefined,
                representativeEvidence: f.representativeEvidence,
                outliers: f.outliers?.map((o) => ({ fileName: o.fileName })),
              }
            )
          )
          .join("");
      }
      break;
    }
    case "top-problematic": {
      const comps = (section.items ?? []) as Array<{
        filePath: string;
        fileName: string;
        lineCount: number;
        dependencyCount: number;
        issues: Array<{ type: string; message: string; severity: string }>;
        highestSeverity?: string;
        project: string | null;
      }>;
      if (comps.length === 0) {
        content = renderEmptyState(translations.empty.noComponents);
      } else {
        const rows: TableCell[][] = comps.map((c) => [
          c.fileName,
          String(c.lineCount),
          String(c.dependencyCount),
          raw(
            renderBadge(
              c.highestSeverity ?? "—",
              c.highestSeverity === "CRITICAL" ? "critical" : c.highestSeverity === "HIGH" ? "high" : "warning"
            )
          ),
          c.issues.map((i) => i.message).join("; "),
          c.filePath,
        ]);
        content = renderTable(
          ["File", "Lines", "Deps", "Severity", "Issues", "Path"],
          rows,
          (i) =>
            `data-project="${escapeHtml(comps[i].project ?? "")}" data-issue-type="${escapeHtml(comps[i].highestSeverity ?? "")} ${comps[i].issues.map((x) => x.type).join(" ")}" data-severity="${escapeHtml(comps[i].highestSeverity ?? "")}" data-file-path="${escapeHtml(comps[i].filePath)}"`,
          ["", "", "", "", "", "path"]
        );
      }
      break;
    }
    case "component-risks": {
      const data = section.data as {
        template: Array<{
          filePath: string;
          fileName: string;
          className?: string;
          score: number;
          warnings: Array<{ code: string; message: string; severity?: string; recommendation: string; confidence?: string }>;
          project: string | null;
        }>;
        lifecycle: Array<{
          filePath: string;
          fileName: string;
          className?: string;
          score: number;
          warnings: Array<{ code: string; message: string; severity?: string; recommendation: string; confidence?: string }>;
          project: string | null;
        }>;
        responsibility: Array<{
          filePath: string;
          fileName: string;
          className?: string;
          score: number;
          warnings: Array<{ code: string; message: string; severity?: string; recommendation: string; confidence?: string }>;
          project: string | null;
        }>;
      };
      const renderRiskCards = (
        items: Array<{
          filePath: string;
          fileName: string;
          className?: string;
          score: number;
          warnings: Array<{ code: string; message: string; severity?: string; recommendation: string; confidence?: string }>;
          project: string | null;
        }>
      ) => {
        if (items.length === 0) return renderEmptyState(translations.empty.noData);
        return items
          .map((r) => {
            const actionable = r.warnings.filter((w) => (w as { confidence?: string }).confidence !== "low");
            const displayed = actionable.slice(0, MAX_WARNINGS_PER_RISK);
            const warningsHtml = displayed
              .map(
                (w) =>
                  `<li>${escapeHtml(w.message)} — ${escapeHtml(w.recommendation)}</li>`
              )
              .join("");
            const more =
              actionable.length > displayed.length
                ? `<li><em>+${actionable.length - displayed.length} more</em></li>`
                : "";
            return renderCard(
              `${r.fileName} (${r.className ?? r.fileName})`,
              `Score: ${r.score}/10 · ${r.filePath}`,
              warningsHtml ? `<ul>${warningsHtml}${more}</ul>` : "Score-driven risk.",
              { project: r.project ?? "", "file-path": r.filePath }
            );
          })
          .join("");
      };
      const templateContent = renderRiskCards(data?.template ?? []);
      const lifecycleContent = renderRiskCards(data?.lifecycle ?? []);
      const responsibilityContent = renderRiskCards(data?.responsibility ?? []);
      content = `
        <div class="tab-bar">
          <button type="button" class="tab active" data-tab="template">Template</button>
          <button type="button" class="tab" data-tab="lifecycle">Lifecycle</button>
          <button type="button" class="tab" data-tab="responsibility">Responsibility</button>
        </div>
        <div id="tab-panel-template" class="tab-panel active"><div class="card-list">${templateContent}</div></div>
        <div id="tab-panel-lifecycle" class="tab-panel"><div class="card-list">${lifecycleContent}</div></div>
        <div id="tab-panel-responsibility" class="tab-panel"><div class="card-list">${responsibilityContent}</div></div>`;
      break;
    }
    case "architecture-smells": {
      const items = (section.items ?? []) as Array<{
        smellType: string;
        severity: string;
        confidence: number;
        description: string;
        affectedComponents: string[];
        relatedFamilies: string[];
        evidence: string[];
        suggestedArchitecture: string;
        suggestedRefactorActions: string[];
      }>;
      const summary = section.data?.architectureSmellSummary as {
        totalSmells: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
      } | null;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noData);
      } else {
        const summaryHtml =
          summary && summary.totalSmells > 0
            ? `<div class="architecture-smell-summary">
                <span>Total: ${summary.totalSmells}</span>
                ${summary.critical > 0 ? `<span class="badge critical">${summary.critical} critical</span>` : ""}
                ${summary.high > 0 ? `<span class="badge high">${summary.high} high</span>` : ""}
                ${summary.medium > 0 ? `<span class="badge warning">${summary.medium} medium</span>` : ""}
                ${summary.low > 0 ? `<span class="badge info">${summary.low} low</span>` : ""}
              </div>`
            : "";
        const fmtSmell = formatSmell ?? ((x: string) => formatSmellType(x));
        const cardsHtml = items
          .map((s) =>
            renderArchitectureSmellCard(
              fmtSmell(s.smellType),
              s.severity,
              s.confidence,
              s.description,
              s.affectedComponents ?? [],
              s.relatedFamilies ?? [],
              s.evidence ?? [],
              s.suggestedArchitecture ?? "",
              s.suggestedRefactorActions ?? []
            )
          )
          .join("");
        content = `${summaryHtml}<div class="card-list">${cardsHtml}</div>`;
      }
      break;
    }
    case "feature-patterns": {
      const items = (section.items ?? []) as Array<{
        patternType: string;
        featureName: string;
        instanceCount: number;
        confidence: number;
        components: string[];
        filePaths?: string[];
        sharedSignals: string[];
        architecturalPattern: string;
        duplicationRisk: string;
        recommendation: string;
        suggestedRefactor: string[];
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noFeaturePatterns ?? translations.empty.noData);
      } else {
        const sharedSignalsHelper = translations.patterns?.sharedSignalsHelper;
        const componentDetailsMap = buildComponentDetailsMap(result);
        content = items
          .map((p) => renderFeaturePatternCard({ ...p, sharedSignalsHelper }, componentDetailsMap, translations))
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "architecture-patterns": {
      const items = (section.items ?? []) as Array<{
        familyKey: string;
        familyName: string;
        components: Array<{ className: string; fileName: string; filePath: string; dominantIssue: string }>;
        commonSignals: string[];
        dominantIssues: string[];
        sharedRefactorOpportunity: string;
        recommendedExtractions: string[];
        confidence: number;
        confidenceBreakdown?: { score: number; contributingSignals: Array<{ signal: string; weight: number; matched: boolean; note: string }> };
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noRepeatedArchitecture ?? translations.empty.noData);
      } else {
        content = items
          .map((f) => renderComponentFamilyInsightCard(f, translations))
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "common-warnings": {
      const items = (section.items ?? []) as Array<{ code: string; count: number }>;
      if (items.length === 0) {
        content = renderEmptyState("No common findings.");
      } else {
        const cards = items.map((w) => renderWarningCard(w.code, w.count)).join("");
        content = `<div class="warning-grid">${cards}</div>`;
      }
      break;
    }
    case "refactor-planner": {
      const plan = section.data?.refactorPlan as {
        whatToFixFirst: unknown[];
        quickWins: unknown[];
        familyRefactorStrategies: unknown[];
        componentDecompositionHints: unknown[];
        architectureRefactorPlan: Array<{
          familyName: string;
          impactScore: number;
          percentageOfTotalIssues: number;
        }>;
      };
      const architectureRefactorPlan =
        (section.data?.architectureRefactorPlan as Array<{
          familyName: string;
          impactScore: number;
          normalizedImpactScore?: number;
          impactBand?: string;
          percentageOfTotalIssues: number;
          whyFirst?: string[];
        }>) ?? plan?.architectureRefactorPlan ?? [];
      const architectureRoadmap = (section.data?.architectureRoadmap as unknown[]) ?? [];
      const familyRefactorPlaybooks = (section.data?.familyRefactorPlaybooks as unknown[]) ?? [];
      if (!plan) {
        content = renderEmptyState("No refactor plan.");
      } else {
        const fmtFamilyPlan = formatFamily ?? ((x: string) => formatFamilyName(x));
        const planItemsFormatted = architectureRefactorPlan.map((item) => ({
          ...item,
          familyName: fmtFamilyPlan(item.familyName),
        }));
        const planContent = renderArchitectureRefactorPlan(planItemsFormatted);
        const summaryContent = renderRefactorPlannerSummary({
          architectureRoadmap,
          quickWins: plan.quickWins,
          familyRefactorPlaybooks,
          componentDecompositionHints: plan.componentDecompositionHints,
        });
        content = `${planContent}${summaryContent}`;
      }
      break;
    }
    case "architecture-roadmap": {
      const items = (section.items ?? []) as Array<{
        rank: number;
        familyName: string;
        reason: string;
        impact: "high" | "medium" | "low";
        suggestedAction: string;
        componentCount: number;
        project?: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noData);
      } else {
        const fmtFamily = formatFamily ?? ((x: string) => formatFamilyName(x));
        content = items
          .map((item) =>
            renderArchitectureRoadmapItem(
              item.rank,
              fmtFamily(item.familyName),
              item.reason,
              item.impact,
              item.suggestedAction,
              item.componentCount
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "architecture-hotspots": {
      const items = (section.items ?? []) as Array<{
        familyName: string;
        componentCount: number;
        avgLineCount: number;
        dominantIssue: string | null;
        impactScore: number;
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
        estimatedFixImpact: number;
        estimatedWarningsAffected?: number;
        estimatedComponentsAffected?: number;
        estimatedIssueCoveragePercent?: number;
        roiDisclaimer?: string;
        percentageOfTotalIssues: number;
        suggestedRefactor: string[];
        commonIssues: string[];
        playbookSummary: string;
        memberFilePaths: string[];
        detectedRolePattern?: string;
        roleDescription?: string;
        recommendedArchitectureBlueprint?: string;
        project?: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noHotspots);
      } else {
        const fmtFamilyHotspot = formatFamily ?? ((x: string) => formatFamilyName(x));
        content = items
          .map((h) =>
            renderArchitectureHotspotCard(
              fmtFamilyHotspot(h.familyName),
              h.componentCount,
              h.avgLineCount,
              h.dominantIssue ? fmt(h.dominantIssue) : null,
              h.impactScore ?? 0,
              h.estimatedFixImpact ?? h.componentCount,
              h.percentageOfTotalIssues ?? 0,
              h.suggestedRefactor ?? [],
              h.commonIssues ?? [],
              h.playbookSummary ?? "",
              h.project ?? undefined,
              {
                normalizedImpactScore: h.normalizedImpactScore,
                impactBand: h.impactBand,
                hotspotReasons: h.hotspotReasons,
                impactBreakdown: h.impactBreakdown,
                estimatedWarningsAffected: h.estimatedWarningsAffected,
                estimatedComponentsAffected: h.estimatedComponentsAffected,
                estimatedIssueCoveragePercent: h.estimatedIssueCoveragePercent,
                roiDisclaimer: h.roiDisclaimer,
                detectedRolePattern: h.detectedRolePattern,
                roleDescription: h.roleDescription,
                recommendedArchitectureBlueprint: h.recommendedArchitectureBlueprint,
              }
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "what-to-fix-first": {
      const items = (section.items ?? []) as Array<{
        id: string;
        type: string;
        filePath?: string;
        familyName?: string;
        description: string;
        impact: number;
        effort: number;
        effortImpactRatio: number;
        source: string;
        project: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noRefactorTasks);
      } else {
        content = items
          .map((item) => {
            const label = item.filePath?.split(/[/\\]/).pop() ?? item.familyName ?? "?";
            return renderRefactorPriorityCard(
              label,
              item.description,
              item.impact,
              item.effort,
              item.effortImpactRatio,
              item.filePath,
              item.project ?? undefined
            );
          })
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "top-refactor-targets": {
      const items = (section.items ?? []) as Array<{
        componentName: string;
        filePath: string;
        shortPath?: string;
        lineCount: number;
        dependencyCount: number;
        dominantIssue: string | null;
        suggestedRefactor: string;
        refactorSteps: string[];
        possibleExtractions: string[];
        impact: string;
        effort: string;
        rankingReason?: string;
        project?: string | null;
        whyPrioritized?: string;
        phase?: import("../../refactor/refactor-plan-models").RefactorPhase;
        roiLabel?: string;
        priorityScore?: number;
        patternGroupId?: string;
        patternGroupSize?: number;
        patternLabel?: string;
        componentSpecificNote?: string;
        familyName?: string;
        sameFamilyComponentNames?: string[];
      }>;
      if (items.length === 0) {
        content = renderEmptyState(translations.empty.noRefactorTasks);
      } else {
        const INITIAL_SHOW = 5;
        const seenPatternGroupIds = new Set<string>();
        const plannerLabels = translations.planner as Record<string, string | undefined>;
        const sharesLabel = plannerLabels.sharesRefactorPatternWith;
        const sameFamilyLabel = plannerLabels.sameFamilyAs;
        const sameStepsLabel = plannerLabels.sameStepsAsAbove ?? "Same steps as above";
        const patternGroupHasSteps = new Map<string, boolean>();
        for (const t of items) {
          const groupId = t.patternGroupId;
          if (!groupId) continue;
          const hasSteps =
            (t.refactorSteps ?? []).some((s) => typeof s === "string" && s.trim().length > 0);
          if (hasSteps) {
            patternGroupHasSteps.set(groupId, true);
          }
        }
        const cards = items.map((t, idx) => {
          const patternGroupId = t.patternGroupId;
          const patternGroupSize = t.patternGroupSize ?? 0;
          const groupHasSteps =
            !!patternGroupId && patternGroupHasSteps.get(patternGroupId) === true;
          const canCollapse =
            !!patternGroupId && patternGroupSize > 1 && groupHasSteps;
          const showFullSteps =
            !canCollapse || !seenPatternGroupIds.has(patternGroupId as string);
          if (canCollapse && showFullSteps && patternGroupId) {
            seenPatternGroupIds.add(patternGroupId);
          }
          const sharesRefactorPatternWithLabel =
            patternGroupSize > 1 && sharesLabel
              ? sharesLabel.replace("{count}", String(patternGroupSize - 1))
              : undefined;
          const sameFamilyAsLabel =
            t.sameFamilyComponentNames?.length && sameFamilyLabel
              ? sameFamilyLabel.replace("{names}", t.sameFamilyComponentNames.slice(0, 3).join(", "))
              : undefined;
          const sequencingCopy =
            sequencingState && t.phase
              ? buildTargetSequencingCopy(t.phase, sequencingState)
              : (t as { whyBeforeAfter?: string }).whyBeforeAfter;

          const cardHtml = renderTopRefactorTargetCard(
            t.componentName,
            t.filePath,
            t.shortPath ?? t.filePath,
            t.lineCount,
            t.dependencyCount,
            t.dominantIssue,
            t.refactorSteps ?? [],
            t.possibleExtractions ?? [],
            t.impact ?? "Medium",
            t.effort ?? "Medium",
            t.rankingReason ?? "Ranked by composite risk score.",
            fmt,
            t.project ?? undefined,
            t.dominantIssue ?? undefined,
            {
              whyPrioritized: t.whyPrioritized,
              phase: t.phase,
              roiLabel: t.roiLabel,
              priorityScore: t.priorityScore,
              confidence: (t as { roleConfidence?: number }).roleConfidence,
              whyInThisPhase: (t as { whyInThisPhase?: string }).whyInThisPhase,
              whyBeforeAfter: sequencingCopy,
              coordinationCost: (t as { coordinationCost?: "Low" | "Medium" | "High" }).coordinationCost,
              coordinationLabels: (t as { coordinationLabels?: string[] }).coordinationLabels,
              patternGroupSize: t.patternGroupSize,
              patternLabel: t.patternLabel,
              componentSpecificNote: t.componentSpecificNote,
              familyName: t.familyName,
              sameFamilyComponentNames: t.sameFamilyComponentNames,
              showFullSteps,
              sharesRefactorPatternWithLabel,
              sameFamilyAsLabel,
              sameStepsAsAboveLabel: canCollapse ? sameStepsLabel : undefined,
            }
          );
          const hiddenClass = idx >= INITIAL_SHOW ? " planner-target-hidden" : "";
          return `<div class="planner-target-wrap${hiddenClass}">${cardHtml}</div>`;
        });
        const moreCount = Math.max(0, items.length - INITIAL_SHOW);
        const showMoreLabel = (translations.planner as Record<string, string | undefined>).showMoreTargets
          ?.replace("{count}", String(moreCount))
          ?? `Show ${moreCount} more targets`;
        const showMoreBtn =
          moreCount > 0
            ? `<button type="button" class="planner-show-more-btn" data-hidden-count="${moreCount}">${escapeHtml(showMoreLabel)}</button>`
            : "";
        content = `<div class="planner-targets-list"><div class="card-list">${cards.join("")}</div>${showMoreBtn}</div>`;
      }
      break;
    }
    case "extraction-opportunities": {
      const items = (section.items ?? []) as Array<{
        patternName: string;
        componentCount: number;
        whyThisMatters: string;
        recommendedExtractions: string[];
        affectedComponents: string[];
        expectedBenefit?: string;
        confidence?: number;
        phase?: number;
        whyInThisPhase?: string;
        coordinationLabels?: string[];
        duplicationLevel?: "low" | "medium" | "high";
        extractionType?: "shared-component" | "facade" | "service" | "utility";
      }>;
      if (items.length === 0) {
        const planner = translations.planner as Record<string, string | undefined>;
        content = renderPlannerEmptyState({
          message: planner.noExtractionClusters ?? "No reusable extraction clusters detected.",
          hint: planner.noExtractionClustersHint,
          links: [
            { href: "#top-refactor-targets", label: planner.topRefactorTargets ?? "Top Refactor Targets" },
          ],
        });
      } else {
        content = items
          .map((o, i) =>
            renderExtractionOpportunityCard(
              o.patternName,
              o.componentCount,
              o.whyThisMatters ?? "Repeated architecture across components. Extracting shared logic reduces duplication and improves maintainability.",
              o.recommendedExtractions ?? [],
              o.affectedComponents ?? [],
              o.expectedBenefit,
              `extraction-exp-${i}`,
              o.confidence,
              {
                phase: o.phase ?? 3,
                whyInThisPhase:
                  (o.whyInThisPhase as string | undefined) ??
                  (sequencingState ? buildExtractionSequencingCopy(sequencingState) : undefined),
                coordinationLabels: o.coordinationLabels,
                duplicationLevel: o.duplicationLevel,
                extractionType: o.extractionType,
              }
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "quick-wins": {
      const items = (section.items ?? []) as Array<{
        issueName: string;
        affectedCount: number;
        explanation: string;
        suggestedFix: string;
        bulkFixPotential?: string;
        whyMatters?: string;
        quickWinRationale?: string;
        whyInThisPhase?: string;
        coordinationLabels?: string[];
      }>;
      const planner = translations.planner as Record<string, string | undefined>;
      const topTargetsForEmpty = plannerContext?.topTargets ?? [];
      const extractionsForEmpty = plannerContext?.extractions ?? [];
      const phaseFactsForEmpty = plannerContext?.phaseFacts ?? computePlannerPhaseFacts(topTargetsForEmpty, [], extractionsForEmpty);
      const roiHintsForEmpty = plannerContext?.roiHints ?? computePlannerRoiHints(topTargetsForEmpty, [], extractionsForEmpty);
      const emptyStateCopy = computeQuickWinsEmptyStateCopy(
        topTargetsForEmpty,
        extractionsForEmpty,
        phaseFactsForEmpty,
        roiHintsForEmpty
      );
      if (items.length === 0) {
        content = renderPlannerEmptyState({
          message: planner?.noQuickWins ?? "No quick architectural wins identified.",
          reassurance: emptyStateCopy.reassurance,
          bestFirstStep: emptyStateCopy.bestFirstStep,
          bestFirstStepLabel: planner?.noQuickWinsBestFirstStep,
          hint: planner?.noQuickWinsHint,
          links: [
            { href: "#top-refactor-targets", label: planner?.topRefactorTargets ?? "Top Refactor Targets" },
            { href: "#extraction-opportunities", label: planner?.extractionOpportunities ?? "Extraction Opportunities" },
          ],
        });
      } else {
        content = items
          .map((w) =>
            renderQuickWinCatalogCard(
              w.issueName,
              w.affectedCount,
              w.explanation,
              w.suggestedFix,
              w.bulkFixPotential,
              w.whyMatters,
              w.quickWinRationale,
              {
                whyInThisPhase: w.whyInThisPhase,
                coordinationLabels: w.coordinationLabels,
              }
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "family-refactor-strategies": {
      const items = (section.items ?? []) as Array<{
        familyName: string;
        memberCount: number;
        patternSummary: string;
        likelySharedConcerns: string[];
        suggestedExtractionTargets: string[];
        suggestedAngularStructure: string;
        suggestedRefactorSteps: string[];
        expectedBenefits: string[];
        project: string | null;
      }>;
      if (items.length === 0) {
        content = renderEmptyState("No family refactor strategies.");
      } else {
        content = items
          .map((f) =>
            renderFamilyRefactorStrategyCard(
              f.familyName,
              f.memberCount,
              f.patternSummary,
              f.likelySharedConcerns ?? [],
              f.suggestedExtractionTargets ?? [],
              f.suggestedAngularStructure ?? "",
              f.suggestedRefactorSteps ?? [],
              f.expectedBenefits ?? [],
              f.project ?? undefined
            )
          )
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    case "component-decomposition-hints": {
      const items = (section.items ?? []) as Array<{
        filePath: string;
        fileName: string;
        lineCount: number;
        separableBlocks: string[];
        suggestedSplit: string;
        confidence: string;
        project: string | null;
        familyContext?: string;
        suggestedBlockDecomposition?: string[];
        familySpecificHints?: string[];
        decompositionSuggestion?: FocusedDecompositionSuggestion;
        expectedImpactPercent?: number;
      }>;
      if (items.length === 0) {
        content = renderEmptyState("No decomposition hints.");
      } else {
        content = items
          .map((h) => {
            const blueprint = h.decompositionSuggestion
              ? formatDecompositionBlueprint(h.decompositionSuggestion)
              : undefined;
            return renderDecompositionHintCard(
              h.fileName,
              h.lineCount,
              h.separableBlocks,
              h.suggestedSplit,
              h.confidence,
              h.filePath,
              h.project ?? undefined,
              h.familyContext,
              h.suggestedBlockDecomposition,
              h.familySpecificHints,
              blueprint,
              h.expectedImpactPercent
            );
          })
          .join("");
        content = `<div class="card-list">${content}</div>`;
      }
      break;
    }
    default:
      content = renderEmptyState("No data.");
  }

  const collapsible = section.id !== "scores" && section.id !== "diagnostic-summary";
  let description = section.description;
  if (isPlannerSection && translations) {
    const planner = translations.planner as Record<string, string | undefined>;
    if (section.id === "top-refactor-targets" && planner.topRefactorTargetsDesc) description = planner.topRefactorTargetsDesc;
    else if (section.id === "extraction-opportunities" && planner.extractionOpportunitiesDesc) description = planner.extractionOpportunitiesDesc;
    else if (section.id === "quick-wins" && planner.quickWinsDesc) description = planner.quickWinsDesc;
  }
  return renderSection(section.id, section.title, content, collapsible, description, isPlannerSection);
}
