/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_STRUCTURE_AND_MODAL = `
  border-bottom: 1px solid var(--color-border);
}
.tab-bar .tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-bar .tab:hover { color: var(--color-text); }
.tab-bar .tab.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Detail Modal - centered large modal (replaces right-side drawer) */
.detail-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}
.detail-modal-overlay.open {
  opacity: 1;
  visibility: visible;
}
.detail-modal {
  width: 100%;
  max-width: min(900px, 94vw);
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 48px rgba(0,0,0,0.4);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.detail-modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 20px 28px;
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.detail-modal-back {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: var(--radius);
}
.detail-modal-back:hover { color: var(--color-text); background: var(--color-surface-hover); }
.detail-modal-title-wrap {
  flex: 1;
  min-width: 0;
}
.detail-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}
.detail-modal-subtitle {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}
.detail-modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 28px;
  padding: 0 4px;
  line-height: 1;
  flex-shrink: 0;
}
.detail-modal-close:hover { color: var(--color-text); }
.detail-modal-body {
  padding: 28px 32px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* Content styles (used inside modal body - kept from drawer) */
.drawer-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.drawer-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.drawer-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin: 0 0 10px 0; font-weight: 600; }
.drawer-header-block { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.drawer-component-name { font-size: 20px; font-weight: 600; margin: 0 0 10px 0; color: var(--color-text); }
.drawer-header-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.drawer-issue-badge { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.drawer-diagnosis-line { font-size: 14px; line-height: 1.5; color: var(--color-text-secondary); margin: 0; }
.drawer-diagnosis-one-liner { margin-bottom: 16px; }
.diagnosis-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; margin-bottom: 20px; padding: 14px 16px; background: var(--color-surface-elevated); border-radius: var(--radius); border: 1px solid var(--color-border); }
.diagnosis-stat-grid { display: flex; flex-wrap: wrap; gap: 16px 24px; }
.diagnosis-stat { display: flex; flex-direction: column; gap: 2px; min-width: 60px; }
.diagnosis-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); }
.diagnosis-stat-value { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-text); }
.diagnosis-confidence-pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); }
.diagnosis-concerns-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.diagnosis-chip { font-size: 11px; padding: 4px 10px; border-radius: 6px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); }
.drawer-stats-row,
.drawer-metric-grid { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-bottom: 16px; }
.drawer-metric-grid .drawer-stat { min-width: 80px; }
.drawer-why-matters .drawer-why-text { margin: 0; font-size: 14px; line-height: 1.5; color: var(--color-text); }
.drawer-related-concerns { margin-top: 12px; }
.drawer-concerns-list { margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; color: var(--color-text-muted); }
.drawer-expected-outcome .drawer-expected-text { margin: 0; font-size: 14px; color: var(--color-text); }
.drawer-next-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.drawer-next-actions .btn-secondary,
.drawer-next-actions .btn-primary { padding: 8px 14px; font-size: 13px; }
.drawer-analysis-notes.drawer-meta-muted { font-size: 13px; color: var(--color-text-muted); }
.drawer-analysis-notes-list { margin: 0; padding-left: 20px; line-height: 1.5; }
.drawer-heuristics { border: 1px solid var(--color-border); border-radius: var(--radius); margin-top: 16px; }
.drawer-heuristics summary { padding: 12px 16px; cursor: pointer; font-weight: 500; }
.drawer-heuristics[open] summary { border-bottom: 1px solid var(--color-border); }
.drawer-stat { display: flex; flex-direction: column; gap: 2px; }
.drawer-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.drawer-stat-value { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-text); }
.drawer-why-list { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: var(--color-text-secondary); }
.drawer-why-list li { margin-bottom: 6px; }
.drawer-refactor-steps { margin: 0; padding-left: 22px; font-size: 14px; line-height: 1.6; color: var(--color-text); }
.drawer-refactor-steps li { margin-bottom: 8px; }
.drawer-refactor-steps li.drawer-refactor-step-first { font-size: 15px; font-weight: 600; color: var(--color-accent, var(--color-text)); margin-bottom: 10px; }
.drawer-evidence-group,
.evidence-card {
  margin-bottom: 12px;
  padding: 14px 16px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.drawer-evidence-group:last-child,
.evidence-card:last-child { margin-bottom: 0; }
.drawer-concerns-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.evidence-chip { font-size: 11px; padding: 4px 10px; border-radius: 6px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); }
.drawer-evidence-group-title { font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin: 0 0 8px 0; }
.drawer-evidence-list { margin: 0; padding-left: 18px; font-size: 13px; color: var(--color-text-secondary); }
.drawer-evidence-list li { margin-bottom: 4px; }
.drawer-file-context { display: flex; flex-direction: column; gap: 12px; }
.drawer-path-block { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.drawer-path-block .drawer-path { flex: 1; min-width: 120px; }
.drawer-path-copy { font-size: 12px; padding: 6px 12px; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: var(--radius); cursor: pointer; color: var(--color-text-muted); flex-shrink: 0; }
.drawer-path-copy:hover { color: var(--color-text); background: var(--color-surface-hover); }
.drawer-context-meta { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-top: 12px; align-items: start; }
.drawer-context-row { display: contents; font-size: 13px; }
.drawer-context-label { font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
.drawer-context-value { word-break: break-word; overflow-wrap: break-word; }
.drawer-heuristic-item { margin-bottom: 12px; font-size: 13px; display: flex; align-items: flex-start; gap: 10px; }
.drawer-heuristic-badge-wrap { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.drawer-confidence-helper { margin: 0; font-size: 12px; color: var(--color-text-muted); line-height: 1.4; max-width: 320px; }
.drawer-heuristics .drawer-section-content { padding: 18px; }
.drawer-evidence { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; }
.drawer-evidence li { margin: 0; font-size: 13px; padding: 6px 12px; background: var(--color-bg); border-radius: 6px; border: 1px solid var(--color-border); }
.drawer-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; font-size: 14px; }
.drawer-metrics .metric { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.drawer-metrics .metric-value { font-weight: 600; font-variant-numeric: tabular-nums; }
.drawer-path {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.drawer-collapsible { margin-bottom: 16px; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-card); background: var(--color-surface-elevated); }
.drawer-collapsible summary { padding: 14px 18px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); cursor: pointer; background: var(--color-surface-hover); }
.drawer-collapsible summary:hover { color: var(--color-text); }
.drawer-collapsible .drawer-section-content { padding: 18px; font-size: 14px; line-height: 1.6; }
.drawer-advanced summary { color: var(--color-text-muted); }
.drawer-heuristics .drawer-section-content { opacity: 0.9; font-size: 13px; }
.drawer-heuristics .drawer-subtitle { font-size: 12px; color: var(--color-text-muted); }

.warning-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.warning-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px;
}
.warning-card .code { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.warning-card .count { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }

.extraction-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}
.extraction-card .extraction-family { font-weight: 600; font-size: 15px; margin-bottom: 8px; }
.extraction-card .extraction-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.extraction-card .extraction-suggestion { font-size: 13px; color: var(--color-accent); }
.extraction-card .extraction-weak-badge { font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px; padding: 4px 8px; background: var(--color-surface-elevated); border-radius: var(--radius); display: inline-block; }
.extraction-card .extraction-evidence { font-size: 12px; margin: 8px 0; }
.extraction-card .extraction-evidence ul { margin: 4px 0 0 16px; padding: 0; }
.extraction-card .extraction-outliers { font-size: 12px; color: var(--color-warning); margin: 8px 0; }
.extraction-card-weak { border-color: var(--color-warning); opacity: 0.95; }
.family-card .family-weak-badge { font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px; padding: 4px 8px; background: var(--color-surface-elevated); border-radius: var(--radius); display: inline-block; }
.family-card .family-outliers { font-size: 12px; color: var(--color-warning); margin: 8px 0; }
.family-card-weak { border-color: var(--color-warning); opacity: 0.95; }

.feature-pattern-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
  margin-bottom: 16px;
}
.feature-pattern-card .feature-pattern-header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
.feature-pattern-card .feature-pattern-name { font-weight: 600; font-size: 16px; color: var(--color-text); }
.feature-pattern-card .feature-pattern-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.feature-pattern-card .feature-pattern-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; }
.feature-pattern-card .feature-pattern-section { margin-bottom: 6px; font-size: 13px; }
.feature-pattern-card .feature-pattern-section strong { display: block; margin-bottom: 4px; font-size: 12px; }
.feature-pattern-card .feature-pattern-components,
.feature-pattern-card .feature-pattern-refactor { font-family: var(--font-mono); font-size: 12px; margin: 2px 0; padding-left: 20px; }
.feature-pattern-card .feature-pattern-components li,
.feature-pattern-card .feature-pattern-refactor li { margin: 1px 0; }
.feature-pattern-card .feature-pattern-signals { margin-top: 4px; }
.feature-pattern-card .feature-pattern-architecture,
.feature-pattern-card .feature-pattern-recommendation { color: var(--color-accent); }

.architecture-pattern-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
  margin-bottom: 16px;
}
.architecture-pattern-card .architecture-pattern-header { margin-bottom: 12px; }
.architecture-pattern-card .architecture-pattern-name { font-weight: 600; font-size: 16px; color: var(--color-text); }
.architecture-pattern-card .architecture-pattern-section { margin-bottom: 10px; font-size: 13px; }
.architecture-pattern-card .architecture-pattern-section strong { display: block; margin-bottom: 4px; font-size: 12px; }
.architecture-pattern-card .architecture-pattern-issues { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.architecture-pattern-card .architecture-pattern-refactor { color: var(--color-accent); margin-top: 4px; }

/* Pattern Card V2 (structured) */
.pattern-card-v2 {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 24px;
  margin-bottom: 20px;
  transition: background 0.15s ease;
}
.pattern-card-v2:hover { background: var(--color-surface-hover); }
.pattern-card-v2 .pattern-section { margin-bottom: 16px; }
.pattern-card-v2 .pattern-section:last-child { margin-bottom: 0; }
.pattern-card-v2 .pattern-section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 6px; }
.pattern-card-v2 .pattern-section-content { font-size: 14px; line-height: 1.5; color: var(--color-text); }
.pattern-card-v2 .pattern-name { font-size: 17px; font-weight: 600; color: var(--color-text); margin-bottom: 12px; }

.chip[data-file-path],
.chip.clickable { cursor: pointer; }
.chip[data-file-path]:hover,
.chip.clickable:hover { text-decoration: underline; }

.architecture-intelligence-grid { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--color-border); }
.architecture-intelligence-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--color-text-muted); }

.card:hover, .family-card:hover, .feature-pattern-card:hover, .architecture-pattern-card:hover { background: var(--color-surface-hover); }
.card[data-file-path] { cursor: pointer; }
.card-title { font-size: 16px; }

/* Planner Planning Summary - header KPI block */
.planner-planning-summary {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 28px;
}
.planner-summary-kpi {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}
.planner-summary-kpi-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.planner-summary-count {
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}
.planner-summary-label {
  font-size: 13px;
  color: var(--color-text-muted);
}
.planner-summary-insight {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.planner-summary-insight-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.planner-summary-phase {
  font-size: 13px;
  color: var(--color-text-muted);
}
.planner-summary-roi {
  font-size: 14px;
  color: var(--color-text);
}
.planner-summary-label-inline {
  font-weight: 500;
  color: var(--color-text-muted);
  margin-right: 4px;
}
.planner-summary-oneliner,
.planner-summary-what-next,
.planner-summary-cross-cutting {
  font-size: 13px;
  line-height: 1.5;
}
.planner-summary-first-steps {
  margin-top: 10px;
}
.planner-first-steps-list {
  margin: 6px 0 0;
  padding-left: 20px;
  color: var(--color-text);
}
.planner-first-steps-list li {
  margin-bottom: 6px;
}
.planner-summary-phase-deliverables {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.planner-phase-deliverable {
  font-size: 13px;
  color: var(--color-text-muted);
}
.planner-phase-deliverable .planner-chip { margin-right: 6px; }
.planner-first-steps-list li:last-child {
  margin-bottom: 0;
}

/* Planner chips for phase / ROI labels */
.planner-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border);
}
.planner-chip-phase {
  background: rgba(88, 166, 255, 0.15);
  color: var(--color-accent);
}
.planner-chip-phase-1 { background: rgba(34, 139, 34, 0.2); color: var(--color-success); border-color: rgba(34, 139, 34, 0.3); }
.planner-chip-phase-2 { background: rgba(210, 153, 34, 0.2); color: var(--color-warning); border-color: rgba(210, 153, 34, 0.3); }
.planner-chip-phase-3 { background: rgba(88, 166, 255, 0.2); color: var(--color-accent); border-color: rgba(88, 166, 255, 0.3); }
.planner-chip-roi { background: rgba(34, 139, 34, 0.2); color: var(--color-success); }
.planner-chip-cross-cutting { background: rgba(150, 100, 200, 0.2); color: var(--color-accent); }
.planner-chip-coordination { background: rgba(100, 149, 237, 0.15); color: var(--color-accent); }
.planner-chip-phase-4 { background: rgba(128, 128, 128, 0.2); color: var(--color-text-muted); }
.extraction-phase-chips,
.quick-win-phase-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}
.refactor-target-why-phase,
.refactor-target-why-before-after {
  font-size: 13px;
  margin-top: 6px;
  color: var(--color-text-muted);
}

.refactor-planner-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.refactor-summary-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.refactor-summary-item .count {
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
}
.refactor-summary-item .label {
  font-size: 13px;
  color: var(--color-text-muted);
}
.refactor-priority-card .card-meta,
.quick-win-card .card-meta,
.decomposition-hint-card .card-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}
.family-refactor-card .card-body p { margin: 8px 0 0 0; }
.family-refactor-card .card-body p:first-child { margin-top: 0; }
.family-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-left: 6px;
  padding: 2px 6px;
  background: var(--color-bg-muted);
  border-radius: 4px;
}

.architecture-blueprint {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  white-space: pre;
}

.refactor-blueprint-card .blueprint-list,
.refactor-blueprint-card .blueprint-steps {
  margin: 8px 0;
  padding-left: 20px;
}
.refactor-blueprint-card .blueprint-list li,
.refactor-blueprint-card .blueprint-steps li {
  margin: 4px 0;
}
.refactor-blueprint-card code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-bg-muted);
  padding: 2px 6px;
  border-radius: 4px;
}
.component-badge {
  margin-left: 6px;
  padding: 2px 6px;
  background: var(--color-accent-muted);
  border-radius: 4px;
}

.patterns-workspace-context {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
  border-left: 4px solid var(--color-accent);
}

.patterns-workspace-total {
  font-size: 12px;
  opacity: 0.85;
}

.pattern-summary-zone {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 24px;
  padding: 20px;
  margin-bottom: 24px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.pattern-summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pattern-summary-item.pattern-summary-action {
  grid-column: 1 / -1;
}
.pattern-summary-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}
.pattern-summary-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.patterns-page-purpose {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}
.patterns-page-purpose-compact {
  margin-bottom: 16px;
  font-size: 12px;
`;
