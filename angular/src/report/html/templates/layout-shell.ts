/**
 * Report shell: sidebar, top bar, generic section wrapper, detail modal.
 */

import type { Translations } from "../i18n/translations";
import { escapeHtml } from "./primitives";

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
