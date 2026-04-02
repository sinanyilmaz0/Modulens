
import type { ScanResult } from "../../core/scan-result";
import type { WorkspaceDiagnosis } from "../../diagnostic/workspace-diagnosis";
import type { ComponentDiagnostic } from "../../diagnostic/diagnostic-models";
import type { ComponentAnalysisResult } from "../../angular/analyzers/component-analyzer";
import { RULES_REGISTRY } from "../../rules/rule-registry";
import { enrichRulesWithWorkspaceData, getTopActionableRules } from "../../rules/rule-priority";
import type { Translations } from "./i18n/translations";
import type { SectionData } from "./html-report-presenter";

export function escapeHtmlInsight(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateAtWord(text: string, maxLen: number): string {
  const t = (text || "").trim();
  if (t.length <= maxLen) return t;
  const cut = t.lastIndexOf(" ", maxLen);
  const minCut = Math.floor(maxLen * 0.5);
  return (cut > minCut ? t.slice(0, cut) : t.slice(0, maxLen)) + "…";
}

function normalizeDedupeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

export interface ExecutiveSummaryModel {
  scaleLines: string[];
  riskSignalLines: string[];
  assessmentLines: string[];
}

const DOMINANT_ORDER = [
  "TEMPLATE_HEAVY_COMPONENT",
  "GOD_COMPONENT",
  "CLEANUP_RISK_COMPONENT",
  "ORCHESTRATION_HEAVY_COMPONENT",
  "LIFECYCLE_RISKY_COMPONENT",
] as const;

export function buildExecutiveSummaryModel(
  result: ScanResult,
  diagnosis: WorkspaceDiagnosis,
  formatIssue: (issue: string | null) => string,
  t: Translations
): ExecutiveSummaryModel {
  const ws = result.workspaceSummary;
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const scaleLines: string[] = [
    `${ws.projectCount} ${ws.projectCount === 1 ? "project" : "projects"}`,
    `${ws.componentCount} ${ws.componentCount === 1 ? "component" : "components"} analyzed`,
    `${ws.totalFindings} total ${ws.totalFindings === 1 ? "finding" : "findings"}`,
  ];

  const sev = result.componentsBySeverity;
  const riskParts: string[] = [];
  if (sev.critical > 0) {
    riskParts.push(`${sev.critical} ${t.severity.critical.toLowerCase()}`);
  }
  if (sev.high > 0) {
    riskParts.push(`${sev.high} ${t.severity.high.toLowerCase()}`);
  }
  if (sev.warning > 0) {
    riskParts.push(`${sev.warning} ${t.severity.warning.toLowerCase()}`);
  }
  const riskSignalLines: string[] = [
    `${ov.workspaceRiskLabel ?? "Workspace risk"}: ${ws.riskLevel} (${ov.basedOnAnalyzerSignals ?? "from analyzer signals"})`,
  ];
  if (riskParts.length > 0) {
    riskSignalLines.push(`${ov.componentsBySeverityLabel ?? "Components by highest severity"}: ${riskParts.join(", ")}`);
  }

  const dc = result.diagnosticSummary.dominantIssueCounts;
  const dominantSorted = [...DOMINANT_ORDER]
    .map((key) => ({ key, count: dc[key as keyof typeof dc] ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  for (const d of dominantSorted) {
    riskSignalLines.push(`${formatIssue(d.key)}: ${d.count} ${d.count === 1 ? "component" : "components"}`);
  }

  const assessmentLines = [
    `${ov.executivePrimaryFocus ?? "Primary focus"}: ${diagnosis.primarySymptom}`,
    truncateAtWord(diagnosis.rootCause, 160),
    `${ov.executiveFirstStep ?? "Suggested first step"}: ${diagnosis.firstAction}`,
  ];

  return { scaleLines, riskSignalLines, assessmentLines };
}

export type PriorityHotspotKind = "component" | "rule";

export interface PriorityHotspotRow {
  kind: PriorityHotspotKind;
  displayName: string;
  subtitle?: string;
  reason: string;
  filePath?: string;
  ruleId?: string;
}

function hotspotReasonFromDiagnostic(d: ComponentDiagnostic, formatIssue: (issue: string | null) => string): string {
  if (d.rankingReason?.trim()) {
    return truncateAtWord(d.rankingReason.trim(), 160);
  }
  if (d.refactorDirection?.trim()) {
    return truncateAtWord(d.refactorDirection.trim(), 160);
  }
  if (d.dominantIssue) {
    return `${formatIssue(d.dominantIssue)} — ${ovGenericHotspotReason()}`;
  }
  return ovGenericHotspotReason();
}

function ovGenericHotspotReason(): string {
  return "Flagged in cross-cutting risk analysis.";
}

function hotspotReasonFromComponent(c: ComponentAnalysisResult): string {
  const first = c.issues?.[0];
  if (first?.message?.trim()) {
    return truncateAtWord(first.message.trim(), 160);
  }
  if (first?.type) {
    return `Rule signal: ${first.type}`;
  }
  return "Prioritized in problematic-component shortlist.";
}

export function buildPriorityHotspotRows(
  result: ScanResult,
  formatIssue: (issue: string | null) => string
): PriorityHotspotRow[] {
  const rows: PriorityHotspotRow[] = [];
  const seenPaths = new Set<string>();

  const norm = (p: string) => p.replace(/\\/g, "/");

  for (const d of result.diagnosticSummary.topCrossCuttingRisks) {
    if (rows.length >= 5) break;
    const key = norm(d.filePath);
    if (seenPaths.has(key)) continue;
    seenPaths.add(key);
    const name =
      d.className?.trim() ||
      d.fileName.replace(/\.component\.ts$/i, "") ||
      d.fileName;
    rows.push({
      kind: "component",
      displayName: name,
      subtitle: truncateAtWord(norm(d.filePath), 80),
      reason: hotspotReasonFromDiagnostic(d, formatIssue),
      filePath: d.filePath,
    });
  }

  for (const c of result.topProblematicComponents) {
    if (rows.length >= 5) break;
    const key = norm(c.filePath);
    if (seenPaths.has(key)) continue;
    seenPaths.add(key);
    const name =
      c.fileName.replace(/\.component\.ts$/i, "") || c.fileName;
    rows.push({
      kind: "component",
      displayName: name,
      subtitle: truncateAtWord(norm(c.filePath), 80),
      reason: hotspotReasonFromComponent(c),
      filePath: c.filePath,
    });
  }

  const totalComponents =
    result.workspaceSummary.componentCount || result.diagnosticSummary.totalComponents || 1;
  const enriched = enrichRulesWithWorkspaceData(
    RULES_REGISTRY,
    result.ruleViolationCounts,
    result.ruleToAffectedComponents ?? {},
    totalComponents
  );
  const topRules = getTopActionableRules(enriched, 3);

  if (rows.length < 3 && topRules.length > 0) {
    const r = topRules[0]!;
    if (r.violationCount > 0 || r.affectedComponentCount > 0) {
      rows.push({
        kind: "rule",
        displayName: r.rule.title,
        subtitle: r.rule.id,
        reason: truncateAtWord(
          `${r.violationCount} violation(s), ${r.affectedComponentCount} affected component(s); rule-priority ranking.`,
          160
        ),
        ruleId: r.rule.id,
      });
    }
  }

  return rows.slice(0, 5);
}

export interface RecommendedActionItem {
  text: string;
}

export function buildRecommendedActionItems(
  result: ScanResult,
  sections: readonly SectionData[]
): RecommendedActionItem[] {
  const out: RecommendedActionItem[] = [];
  const seen = new Set<string>();

  const pushUnique = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const k = normalizeDedupeKey(t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ text: t });
  };

  for (const w of result.warningsAndRecommendations) {
    pushUnique(w);
    if (out.length >= 12) break;
  }

  const refactorFirst = sections.find((s) => s.id === "refactor-first");
  const tasks = (refactorFirst?.items ?? []) as Array<{
    suggestedAction?: string;
    whyNow?: string[];
  }>;
  for (const task of tasks.slice(0, 5)) {
    if (task.suggestedAction) pushUnique(task.suggestedAction);
    for (const line of task.whyNow ?? []) {
      pushUnique(line);
    }
    if (out.length >= 12) break;
  }

  const totalComponents =
    result.workspaceSummary.componentCount || result.diagnosticSummary.totalComponents || 1;
  const enriched = enrichRulesWithWorkspaceData(
    RULES_REGISTRY,
    result.ruleViolationCounts,
    result.ruleToAffectedComponents ?? {},
    totalComponents
  );
  const topRules = getTopActionableRules(enriched, 3);
  for (const e of topRules) {
    if (e.violationCount === 0 && e.affectedComponentCount === 0) continue;
    pushUnique(
      `Review rule “${e.rule.title}” (${e.violationCount} violations, ${e.affectedComponentCount} components).`
    );
    if (out.length >= 12) break;
  }

  return out.slice(0, 10);
}

export function renderExecutiveSummarySection(model: ExecutiveSummaryModel, t: Translations): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const title = ov.executiveSummary ?? "Executive summary";
  const helper = ov.executiveSummaryHelper ?? "";
  const scaleLabel = ov.executiveScaleLabel ?? "Scale";
  const riskLabel = ov.executiveRiskSignalsLabel ?? "Risk signals";
  const assessLabel = ov.executiveAssessmentLabel ?? "Assessment";
  const detailNote =
    ov.executiveDetailBelow ?? "Detailed charts and lists on this page expand on these points.";

  const ul = (lines: string[]) =>
    `<ul class="overview-insight-list">${lines.map((l) => `<li>${escapeHtmlInsight(l)}</li>`).join("")}</ul>`;

  return `
  <section class="overview-section overview-executive-summary" id="overview-executive-summary">
    <h2 class="page-section-title section-title-caps">${escapeHtmlInsight(title)}</h2>
    ${helper ? `<p class="section-helper text-muted">${escapeHtmlInsight(helper)}</p>` : ""}
    <div class="overview-insight-grid">
      <div class="overview-insight-card">
        <h3 class="overview-insight-card-title">${escapeHtmlInsight(scaleLabel)}</h3>
        ${ul(model.scaleLines)}
      </div>
      <div class="overview-insight-card">
        <h3 class="overview-insight-card-title">${escapeHtmlInsight(riskLabel)}</h3>
        ${ul(model.riskSignalLines)}
      </div>
      <div class="overview-insight-card overview-insight-card-wide">
        <h3 class="overview-insight-card-title">${escapeHtmlInsight(assessLabel)}</h3>
        ${ul(model.assessmentLines)}
        <p class="overview-insight-footnote text-muted">${escapeHtmlInsight(detailNote)}</p>
      </div>
    </div>
  </section>`;
}

export function renderPriorityFocusSection(rows: PriorityHotspotRow[], t: Translations): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const title = ov.priorityFocus ?? "Priority focus";
  const helper =
    ov.priorityFocusHelper ??
    "Ordered from cross-cutting diagnostics, then the problematic-component shortlist. At most one rule-level item appears when component signals are sparse.";
  const empty = ov.priorityFocusEmpty ?? "No prioritized hotspots in this run. The workspace may be healthy or signals were not strong enough to rank.";
  const kindComponent = ov.hotspotKindComponent ?? "Component";
  const kindRule = ov.hotspotKindRule ?? "Rule";

  if (rows.length === 0) {
    return `
  <section class="overview-section overview-priority-focus" id="overview-priority-focus">
    <h2 class="page-section-title section-title-caps">${escapeHtmlInsight(title)}</h2>
    <p class="section-helper text-muted">${escapeHtmlInsight(helper)}</p>
    <p class="overview-insight-empty text-muted">${escapeHtmlInsight(empty)}</p>
  </section>`;
  }

  const list = rows
    .map((r, i) => {
      const kindLabel = r.kind === "rule" ? kindRule : kindComponent;
      const nameHtml =
        r.kind === "component" && r.filePath
          ? `<button type="button" class="overview-hotspot-name-link top-problematic-action-link" data-file-path="${escapeHtmlInsight(r.filePath)}">${escapeHtmlInsight(r.displayName)}</button>`
          : `<span class="overview-hotspot-name">${escapeHtmlInsight(r.displayName)}</span>`;
      return `
    <li class="overview-hotspot-row">
      <span class="overview-hotspot-rank" aria-hidden="true">${i + 1}</span>
      <div class="overview-hotspot-body">
        <div class="overview-hotspot-heading">
          ${nameHtml}
          <span class="overview-hotspot-kind">${escapeHtmlInsight(kindLabel)}</span>
        </div>
        ${r.subtitle ? `<div class="overview-hotspot-subtitle text-muted">${escapeHtmlInsight(r.subtitle)}</div>` : ""}
        <div class="overview-hotspot-reason">${escapeHtmlInsight(r.reason)}</div>
      </div>
    </li>`;
    })
    .join("");

  return `
  <section class="overview-section overview-priority-focus" id="overview-priority-focus">
    <h2 class="page-section-title section-title-caps">${escapeHtmlInsight(title)}</h2>
    <p class="section-helper text-muted">${escapeHtmlInsight(helper)}</p>
    <ol class="overview-hotspot-list">${list}</ol>
  </section>`;
}

export function renderRecommendedActionsSection(items: RecommendedActionItem[], t: Translations): string {
  const ov = t.overview as unknown as Record<string, string | undefined>;
  const title = ov.recommendedActions ?? "Recommended actions";
  const helper =
    ov.recommendedActionsHelper ??
    "Derived from analyzer warnings, prioritized refactor hints, and high-impact rules. Items are deduplicated.";
  const empty =
    ov.recommendedActionsEmpty ??
    "No concrete recommendations were emitted for this run. Review Components and Rules for details.";

  if (items.length === 0) {
    return `
  <section class="overview-section overview-recommended-actions" id="overview-recommended-actions">
    <h2 class="page-section-title section-title-caps">${escapeHtmlInsight(title)}</h2>
    <p class="section-helper text-muted">${escapeHtmlInsight(helper)}</p>
    <p class="overview-insight-empty text-muted">${escapeHtmlInsight(empty)}</p>
  </section>`;
  }

  const lis = items.map((i) => `<li>${escapeHtmlInsight(i.text)}</li>`).join("");
  return `
  <section class="overview-section overview-recommended-actions" id="overview-recommended-actions">
    <h2 class="page-section-title section-title-caps">${escapeHtmlInsight(title)}</h2>
    <p class="section-helper text-muted">${escapeHtmlInsight(helper)}</p>
    <ul class="overview-recommended-list">${lis}</ul>
  </section>`;
}
