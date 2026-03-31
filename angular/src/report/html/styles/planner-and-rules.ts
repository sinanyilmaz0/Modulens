/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_PLANNER_AND_RULES = `
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rule-card-compact { padding: 12px 16px; }
.rule-card-compact.rule-card-triggered {
  border-left: 3px solid var(--color-warning);
  background: rgba(210, 153, 34, 0.04);
}
.rule-card-compact.rule-card-not-triggered {
  opacity: 0.92;
  background: var(--color-surface-elevated);
}
.rule-card-compact.rule-card-not-triggered .rule-card-title { color: var(--color-text-muted); }
.rule-card-compact .rule-card-title { margin: 0; font-size: 15px; font-weight: 600; }
.rule-card-compact .rule-card-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rule-card-summary {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-top: 6px;
}
.rule-trigger-count.rule-triggered { font-weight: 600; color: var(--color-warning); }
.rule-trigger-count.rule-not-triggered { color: var(--color-text-muted); font-size: 12px; }
.rule-card-expand-btn { margin-top: 4px; align-self: flex-start; }
.rule-card-compact .rule-card-body {
  padding-top: 16px;
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
}
.rule-explanation { margin: 0 0 16px 0; color: var(--color-text-secondary); }
.rule-section-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 12px 0 6px 0;
}
.rule-why { margin: 0 0 12px 0; color: var(--color-text-secondary); }
.rule-example {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 12px;
  border-radius: var(--radius);
  margin: 0 0 12px 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.rule-example.rule-bad {
  background: rgba(248,81,73,0.08);
  border: 1px solid rgba(248,81,73,0.2);
  color: var(--color-text-secondary);
}
.rule-example.rule-good {
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
  color: var(--color-text-secondary);
}
.rule-refactor { margin: 0 0 12px 0; color: var(--color-accent); font-weight: 500; }
.rule-usage {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 500;
}
.rule-usage.rule-triggered { color: var(--color-warning); }
.rule-usage.rule-not-triggered { color: var(--color-text-muted); }

.rule-example-compact { font-size: 11px; padding: 8px 10px; }
.rule-workspace-impact { margin: 0 0 8px 0; font-size: 13px; color: var(--color-text); }
.rule-workspace-impact-label { margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
.rule-affected-paths { margin: 0 0 8px 0; padding-left: 20px; font-size: 12px; }
.rule-affected-paths code { font-size: 11px; }
.rule-affected-more { margin: 0 0 12px 0; font-size: 11px; color: var(--color-text-muted); }
.rule-investigation-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
.rule-action-link { font-size: 13px; font-weight: 500; color: var(--color-text); text-decoration: none; }
.rule-action-link:hover { text-decoration: underline; }
.rule-action-open-affected { display: inline-flex; align-items: center; padding: 8px 16px; font-weight: 600; border-radius: var(--radius); }
.rule-impact-badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.rule-impact-informational { background: rgba(100, 116, 139, 0.15); color: var(--color-text-muted); }
.rule-impact-local_maintainability { background: rgba(245, 158, 11, 0.15); color: var(--color-warning); }
.rule-impact-cross_cutting_maintainability { background: rgba(239, 68, 68, 0.12); color: var(--color-error); }
.rule-impact-behavior_leak_risk { background: rgba(239, 68, 68, 0.2); color: var(--color-error); font-weight: 700; }
.rule-card-suggested-action { font-size: 12px; color: var(--color-accent); margin: 6px 0 0 0; font-weight: 500; }
.rule-impact-band-drawer { margin: 12px 0; }
.rule-common-false-positives { margin: 0 0 12px 0; font-size: 13px; color: var(--color-text-muted); font-style: italic; }

.rule-drawer-detail .rule-detail-id-line {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.rule-detail-meta-label { font-weight: 600; color: var(--color-text-muted); margin-right: 6px; }
.rule-detail-id-code {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
}
.rule-detail-limited-badge {
  margin: 0 0 10px 0;
  font-size: 12px;
  font-weight: 600;
}
.rule-detail-more {
  margin: 14px 0 16px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 8px 12px;
  background: var(--color-surface-elevated);
}
.rule-detail-more-summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
.rule-detail-more-body { margin-top: 12px; padding-top: 4px; border-top: 1px solid var(--color-border); }
.rule-detail-more-body .rule-section-label:first-child { margin-top: 0; }

.drawer-related-rule-item { margin-bottom: 10px; }
.drawer-related-rule-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.drawer-related-rule-title-btn {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--color-accent);
  text-align: left;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.drawer-related-rule-title-btn:hover { color: var(--color-text); }
.drawer-related-rule-meta { font-size: 12px; color: var(--color-text-muted); }
.drawer-related-rule-filter-link {
  display: inline-block;
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: none;
}
.drawer-related-rule-filter-link:hover { text-decoration: underline; color: var(--color-text-secondary); }

.top-actionable-rules-section {
  margin-bottom: 28px;
  padding: 20px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.top-actionable-rules-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.top-actionable-rule-card {
  padding: 14px 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.top-actionable-rule-card:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}
.top-actionable-rule-title { font-size: 15px; font-weight: 600; color: var(--color-text); margin: 0 0 8px 0; }
.top-actionable-rule-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
.top-actionable-rule-usage { font-size: 12px; color: var(--color-text-muted); }
.top-actionable-rule-action { font-size: 13px; color: var(--color-accent); margin: 0; font-weight: 500; }

.rules-page-identity {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.rules-page-identity-purpose { font-size: 14px; font-weight: 600; color: var(--color-text); margin: 0 0 4px 0; }
.rules-page-identity-context,
.rules-page-identity-action { font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.4; }

.rules-summary-block {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.rules-summary-item { display: flex; flex-direction: column; gap: 4px; }
.rules-summary-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.rules-summary-value { font-size: 20px; font-weight: 600; color: var(--color-text); }
.rules-page { max-width: 1200px; margin: 0 auto; }

/* Structure page */
.structure-page { max-width: 1200px; margin: 0 auto; padding-top: 8px; }
.structure-page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}
.structure-page-title { margin: 0 0 6px 0; font-size: 22px; font-weight: 600; color: var(--color-text); }
.structure-page-context { margin: 0; font-size: 13px; color: var(--color-text-muted); }
.structure-summary-header {
  margin-bottom: 20px;
  padding: 18px 22px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.structure-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px 24px;
  margin-bottom: 12px;
}
.structure-kpi-item { display: flex; flex-direction: column; gap: 4px; }
.structure-kpi-label { font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.structure-kpi-value { font-size: 18px; font-weight: 600; color: var(--color-text); }
.structure-kpi-chip { font-size: 14px; font-weight: 500; }
.structure-insight { font-size: 14px; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.structure-most-common-share { font-size: 13px; color: var(--color-text-muted); margin: 8px 0 0 0; }
.structure-recommended-first {
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 3px solid var(--color-accent);
  background: rgba(59,130,246,0.06);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 14px;
}
.structure-recommended-label { color: var(--color-text-muted); font-weight: 600; margin-right: 6px; }
.structure-recommended-concern { background: none; border: none; color: var(--color-accent); cursor: pointer; font-size: inherit; padding: 0; text-decoration: underline; font-weight: 500; }
.structure-recommended-concern:hover { color: var(--color-accent-hover); }
.structure-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.structure-toolbar-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-right: 6px; }
.structure-select { font-size: 12px; padding: 5px 8px; border-radius: var(--radius); border: 1px solid var(--color-border); background: var(--color-surface-elevated); color: var(--color-text); min-width: 100px; }
.structure-sort, .structure-filters { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; }
.structure-concern-card {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.structure-concern-card:hover { border-color: var(--color-border-strong); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.structure-concern-card.selected { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }
.structure-concern-card.most-common { border-left: 3px solid var(--color-accent); }
.structure-concern-header { cursor: pointer; }
.structure-concern-top { margin-bottom: 8px; }
.structure-concern-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.structure-concern-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--color-text); }
.structure-concern-chips { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; }
.structure-concern-chips .structure-chip-area { max-width: 100%; }
.structure-chip { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
.structure-chip-impact.impact-high { background: rgba(248,81,73,0.15); color: var(--color-critical); }
.structure-chip-impact.impact-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.structure-chip-impact.impact-low { background: rgba(100,100,100,0.2); color: var(--color-text-muted); }
.structure-chip-confidence.confidence-high { background: rgba(34,139,34,0.2); color: var(--color-success); }
.structure-chip-confidence.confidence-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.structure-chip-confidence.confidence-low { background: rgba(88,166,255,0.15); color: var(--color-accent); }
.structure-chip-area { background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.structure-chip-count { font-weight: 600; color: var(--color-text); }
.structure-chip-most-common { background: rgba(59,130,246,0.2); color: var(--color-accent); }
.structure-chip-more { background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 10px; }
.structure-area-count { font-size: 10px; opacity: 0.9; margin-left: 2px; }
.structure-concern-summary { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 8px 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
.structure-concern-suggested-fix {
  margin: 0 0 8px 0;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: var(--radius);
  border-left: 2px solid var(--color-border-strong);
}
.structure-concern-suggested-fix-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); display: block; margin-bottom: 4px; }
.structure-concern-suggested-fix-content { font-size: 12px; color: var(--color-text-muted); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
.structure-concern-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.structure-btn-view, .structure-btn-inspect { font-size: 12px; padding: 6px 12px; text-decoration: none; color: inherit; border-radius: var(--radius); }

/* Structure modal */
.structure-modal-content { padding: 0; }
.structure-modal-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 8px; }
.structure-modal-badge.confidence-high { background: rgba(34,139,34,0.2); color: var(--color-success); }
.structure-modal-badge.confidence-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.structure-modal-badge.confidence-low { background: rgba(88,166,255,0.15); color: var(--color-accent); }
.structure-modal-badge.impact-high { background: rgba(248,81,73,0.15); color: var(--color-critical); }
.structure-modal-badge.impact-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.structure-modal-badge.impact-low { background: rgba(100,100,100,0.2); color: var(--color-text-muted); }
.structure-modal-section { margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
.structure-modal-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.structure-modal-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin: 0 0 8px 0; font-weight: 600; }
.structure-modal-why, .structure-modal-why-flagged { font-size: 14px; line-height: 1.5; color: var(--color-text-secondary); margin: 0; }
.structure-paths-summary { font-size: 13px; color: var(--color-text-muted); margin: 0 0 6px 0; }
.structure-sample-paths { margin: 0; padding: 0; list-style: none; }
.structure-path-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; padding: 4px 8px; background: var(--color-bg); border-radius: var(--radius); border: 1px solid var(--color-border); }
.structure-path-code { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); max-width: 100%; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.structure-path-more { font-size: 11px; color: var(--color-text-muted); padding: 4px 8px; margin: 0; list-style: none; }
.path-segment-highlight { background: rgba(210,153,34,0.25); color: var(--color-warning); padding: 0 2px; border-radius: 2px; }
.structure-path-copy { font-size: 10px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; flex-shrink: 0; }
.structure-path-copy:hover { color: var(--color-text); background: var(--color-surface-hover); }
.structure-area-chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.structure-area-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 12px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.structure-area-chip .structure-area-count { font-weight: 600; color: var(--color-accent); flex-shrink: 0; }
.structure-area-more { font-size: 11px; color: var(--color-text-muted); padding: 2px 6px; }
.structure-refactor-guidance { padding: 12px 16px; background: var(--color-bg); border-radius: var(--radius); border: 1px solid var(--color-border); }
.structure-refactor-main { font-size: 14px; line-height: 1.5; color: var(--color-text); margin: 0; }
.structure-refactor-bullets { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: var(--color-text); }
.structure-refactor-bullets li { margin-bottom: 4px; }
.structure-refactor-bullets li:last-child { margin-bottom: 0; }
.structure-suggested-step {
  font-size: 14px; font-weight: 600; color: var(--color-text); margin: 0;
  padding: 12px 14px;
  background: rgba(59,130,246,0.08);
  border-left: 3px solid var(--color-accent);
  border-radius: 0 var(--radius) var(--radius) 0;
}
.structure-modal-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.structure-modal-actions .btn-secondary { font-size: 13px; padding: 8px 14px; }

.rules-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.rules-filter-primary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: flex-end;
}
.rules-filter-primary .rules-filter-row-search { flex: 1; min-width: 200px; }
.rules-filter-primary .rules-filter-search-input { min-width: 220px; }
.rules-filter-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}
.rules-filter-secondary .rules-filter-row label { font-size: 10px; opacity: 0.9; }
.rules-filter-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rules-filter-row label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}
.rules-filter-row select,
.rules-filter-row input {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text);
  min-width: 140px;
}
.rules-filter-row input { min-width: 180px; }
.rules-showing-strip {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}
.rules-card-list .card { margin-bottom: 8px; }
.rules-card-list .card:last-child { margin-bottom: 0; }
.card-title { font-weight: 600; margin-bottom: 4px; }
.card-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.card-body { font-size: 13px; }
.card-body ul { margin: 8px 0 0 0; padding-left: 20px; }
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.badge.critical { background: var(--severity-critical-bg); color: var(--severity-critical-fg); }
.badge.high { background: var(--severity-high-bg); color: var(--severity-high-fg); }
.badge.warning { background: var(--severity-warning-bg); color: var(--severity-warning-fg); }
.badge.low { background: var(--severity-low-bg); color: var(--severity-low-fg); }
.badge.info { background: rgba(88,166,255,0.2); color: var(--color-accent); }
.badge.badge-smell { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); font-weight: 500; }
.badge.confidence-low { background: rgba(88,166,255,0.15); color: var(--color-accent); }
.badge.confidence-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.badge.confidence-high { background: rgba(34,139,34,0.2); color: var(--color-success); }

.architecture-smell-card .card-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.architecture-smell-card .confidence-badge {
  font-size: 11px;
  color: var(--color-text-muted);
  background: rgba(88,166,255,0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.confidence-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}
.confidence-badge.confidence-weak,
.confidence-badge.confidence-low,
.confidence-badge.confidence-reviewNeeded { background: rgba(150,150,150,0.2); color: var(--color-text-muted); }
.confidence-badge.confidence-moderate,
.confidence-badge.confidence-medium { background: rgba(88,166,255,0.15); color: var(--color-accent); }
.confidence-badge.confidence-strong,
.confidence-badge.confidence-high { background: rgba(88,166,255,0.25); color: var(--color-accent); }
.confidence-badge.confidence-very-strong,
.confidence-badge.confidence-very-high { background: rgba(88,166,255,0.3); color: var(--color-accent); }

.confidence-breakdown {
  margin-top: 6px;
  font-size: 11px;
}
.confidence-breakdown summary {
  cursor: pointer;
  color: var(--color-accent);
  user-select: none;
}
.confidence-breakdown summary:hover { text-decoration: underline; }
.confidence-breakdown-intro {
  margin: 6px 0 0 0;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
}
.confidence-breakdown .contributing-signals {
  margin: 6px 0 0 0;
  padding-left: 18px;
  list-style: disc;
}
.confidence-breakdown .contributing-signal {
  margin: 2px 0;
  font-size: 11px;
  color: var(--color-text-muted);
}
.confidence-breakdown .contributing-signal.matched .signal-name { font-weight: 500; color: var(--color-text); }

.metric.confidence-metric .metric-value { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.architecture-smell-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.architecture-smell-summary span { font-size: 13px; }
.smell-affected-list, .smell-evidence-list, .smell-actions-list {
  margin: 4px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
}

.chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  margin: 2px 4px 2px 0;
  background: rgba(88,166,255,0.12);
  color: var(--color-accent);
}
.chip-list { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.family-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}
.family-card .family-name { font-weight: 600; font-size: 15px; margin-bottom: 8px; }
.family-card .family-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.family-card .family-common-warnings { font-size: 12px; margin-bottom: 8px; }
.family-card .members { font-family: var(--font-mono); font-size: 12px; }
.family-card .members li { margin: 4px 0; }
.family-card .refactor { margin-top: 8px; font-size: 13px; color: var(--color-accent); }

.empty-state {
  color: var(--color-text-muted);
  font-style: italic;
  padding: 24px;
  text-align: center;
}

.empty-state-contextual {
  text-align: left;
  font-style: normal;
  max-width: 480px;
  line-height: 1.5;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
`;
