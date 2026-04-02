/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_DASHBOARD_LAYOUT = `
}

/* Secondary Metrics */
.secondary-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-card);
  margin-bottom: var(--spacing-section);
}
@media (max-width: 900px) { .secondary-metrics { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .secondary-metrics { grid-template-columns: 1fr; } }
.secondary-metric-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--color-border);
  transition: background 0.15s ease;
}
.secondary-metric-card:hover { background: var(--color-surface-hover); }
.secondary-metric-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.secondary-metric-value { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--color-text); margin-bottom: 4px; }
.secondary-metric-hint { font-size: 13px; color: var(--color-text-muted); line-height: 1.4; }
.secondary-metric-secondary { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.55; }

/* Score Breakdown Cards */
.score-breakdown-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-card);
  margin-bottom: var(--spacing-section);
}
@media (max-width: 900px) { .score-breakdown-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .score-breakdown-cards { grid-template-columns: 1fr; } }
.score-breakdown-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--color-border);
  transition: background 0.15s ease;
}
.score-breakdown-card:hover { background: var(--color-surface-hover); }
.score-breakdown-card .label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.score-breakdown-card .value { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; margin-bottom: 12px; }
.score-breakdown-card .value.good { color: var(--color-success); }
.score-breakdown-card .value.medium { color: var(--color-warning); }
.score-breakdown-card .value.bad { color: var(--color-critical); }
.score-breakdown-card .verdict { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.score-breakdown-card .verdict.good { color: var(--color-success); }
.score-breakdown-card .verdict.medium { color: var(--color-warning); }
.score-breakdown-card .verdict.bad { color: var(--color-critical); }
.score-breakdown-card .bar { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
.score-breakdown-card .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
.score-breakdown-card .hint { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }

/* Project Hotspots Overview */
.project-hotspots-overview { margin-bottom: var(--spacing-section); }
.project-hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
@media (max-width: 600px) {
  .project-hotspots-grid { grid-template-columns: repeat(2, 1fr); }
}
.project-hotspot-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.project-hotspot-item:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
  color: inherit;
  text-decoration: none;
}
.project-hotspot-item:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.project-hotspot-item.project-hotspot-item-worst { border-left: 4px solid var(--color-critical); }
.project-hotspot-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.project-hotspot-stats { font-size: 12px; color: var(--color-text-muted); }
.project-hotspot-density { font-size: 11px; color: var(--color-text-secondary); font-variant-numeric: tabular-nums; }
.project-hotspot-risk-summary { font-size: 12px; color: var(--color-text-secondary); font-style: italic; }

/* What Hurts Most */
.what-hurts-section { margin-bottom: var(--spacing-section); }
.what-hurts-bars { display: flex; flex-direction: column; gap: 12px; }
.what-hurts-bar-item-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.what-hurts-bar-item-wrap:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}
.what-hurts-bar-item-wrap:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.what-hurts-bar-item {
  display: flex;
  align-items: center;
  gap: 16px;
}
.what-hurts-bar-label { font-size: 14px; color: var(--color-text); min-width: 180px; white-space: normal; word-break: break-word; }
.what-hurts-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  min-width: 80px;
}
.what-hurts-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.what-hurts-bar-count { font-size: 14px; font-weight: 600; margin-left: 12px; min-width: 36px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.what-hurts-bar-explanation { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; margin-left: 196px; }
@media (max-width: 600px) {
  .what-hurts-bar-explanation { margin-left: 0; }
}

/* Project Breakdown */
.project-breakdown-cards {
  display: flex;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-card);
  align-items: start;
  margin-bottom: var(--spacing-section);
}
.project-breakdown-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--color-border);
  transition: background 0.15s ease;
  width: 100%;
}
.project-breakdown-card:hover { background: var(--color-surface-hover); }
.project-breakdown-card.project-breakdown-worst { border-color: rgba(239,68,68,0.3); }
.project-breakdown-card.project-breakdown-card--compare-active {
  border-color: rgba(129, 140, 248, 0.42);
  box-shadow:
    0 0 0 1px rgba(129, 140, 248, 0.14),
    0 12px 32px -14px rgba(0, 0, 0, 0.45);
}
.project-breakdown-card .project-name { font-size: 13px; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
.project-breakdown-card .project-stats { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.project-breakdown-card .project-warnings { font-size: 12px; font-weight: 600; color: var(--color-warning); margin-bottom: 6px; }
.project-breakdown-card .project-dimension { font-size: 12px; color: var(--color-text-secondary); margin-top: 6px; }
.project-breakdown-card .project-dimension-label { font-weight: 600; color: var(--color-text-muted); }
.workspace-breakdown-note { font-size: 12px; color: var(--color-text-muted); margin-top: 12px; margin-bottom: 0; }

/* Other card - compact, no inline expand */
.project-breakdown-card-other .project-breakdown-other-minor-count { color: var(--color-text-muted); }
.explore-minor-areas-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.explore-minor-areas-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}

/* Compare baseline — project card strip (matches dashboard cards / hotspots) */
.project-compare-strip {
  margin-top: 14px;
  padding: 14px 14px 12px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}
.project-compare-strip-kicker {
  margin: 0 0 10px 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.project-compare-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: center;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 1px 3px rgba(0, 0, 0, 0.07);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.18s ease;
}
.project-compare-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
.project-compare-btn:active {
  transform: translateY(0);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 1px 2px rgba(0, 0, 0, 0.06);
}
.project-compare-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.project-compare-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
.project-compare-status-line { display: block; }
.project-compare-inline-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.project-compare-inline-actions button {
  font-size: 11px;
  font-weight: 600;
  padding: 6px 12px;
  margin: 0;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.project-compare-inline-actions button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
  text-decoration: none;
}

.project-compare-diff-wrap {
  margin-top: 12px;
}
.project-compare-diff {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.project-compare-diff[hidden] { display: none !important; }
.project-compare-diff-inner-compact {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.project-compare-diff-inner {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: var(--color-surface);
}
.project-compare-card-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
  justify-content: flex-start;
}
.project-compare-card-chip {
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  text-align: center;
}
.project-compare-card-chip-findings { font-weight: 700; color: var(--color-text); }
.project-compare-card-chip-worse {
  border-color: rgba(239, 68, 68, 0.28);
  color: var(--color-text);
}
.project-compare-card-chip-better {
  border-color: rgba(34, 197, 94, 0.35);
  color: var(--color-text);
}
.project-compare-details-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 12px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-accent);
  background: transparent;
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
}
.project-compare-details-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
  border-color: var(--color-accent);
}
.project-compare-details-toggle:active {
  transform: scale(0.99);
}
.project-compare-details-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.project-compare-details-toggle[hidden] { display: none !important; }

/* Compare details modal */
.project-compare-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 1003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
}
.project-compare-detail-modal[hidden] { display: none !important; }
.project-compare-detail-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.project-compare-detail-modal-panel {
  position: relative;
  width: 100%;
  max-width: min(640px, 94vw);
  max-height: min(88vh, 920px);
  display: flex;
  flex-direction: column;
  background: var(--color-surface-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 32px 64px -12px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.project-compare-detail-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px 16px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.project-compare-detail-modal-head-text {
  min-width: 0;
  flex: 1;
}
.project-compare-detail-modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text);
  line-height: 1.35;
  padding-right: 8px;
}
.project-compare-detail-modal-subtitle {
  margin: 8px 0 0 0;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 400;
}
.project-compare-detail-modal-dismiss {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: -6px -8px -6px 0;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.project-compare-detail-modal-dismiss:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
  border-color: var(--color-border);
}
.project-compare-detail-modal-body {
  padding: 18px 20px 22px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  -webkit-overflow-scrolling: touch;
}
.project-compare-modal-empty {
  padding: 32px 16px 24px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.55;
}

/* Inline detail header (if ever rendered outside modal) */
.project-compare-details-header {
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.project-compare-details-heading {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.project-compare-details-inner--modal {
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.project-compare-detail-section {
  margin: 0 0 20px 0;
  padding: 0 0 16px 0;
  border-bottom: 1px solid var(--color-border);
}
.project-compare-detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.project-compare-detail-section-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text);
  line-height: 1.4;
}
.project-compare-detail-section-title--full {
  margin-bottom: 10px;
}
.project-compare-details-inner--modal .project-compare-detail-chips {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 10px;
}
.project-compare-detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.project-compare-detail-chip {
  display: block;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  text-align: center;
  line-height: 1.35;
}
.project-compare-detail-chip--stacked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px 12px;
  min-height: 72px;
  box-sizing: border-box;
}
.project-compare-detail-chip-value {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--color-text);
}
.project-compare-detail-chip-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: 1.3;
  text-align: center;
}
.project-compare-detail-chip-worse {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.06);
}
.project-compare-detail-chip-worse .project-compare-detail-chip-value {
  color: var(--color-text);
}
.project-compare-detail-chip-better {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}
.project-compare-detail-chip-better .project-compare-detail-chip-value {
  color: var(--color-text);
}

.project-compare-details-inner--modal .project-compare-dimensions {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.project-compare-dimensions--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
@media (max-width: 420px) {
  .project-compare-dimensions--grid {
    grid-template-columns: 1fr;
  }
}
.project-compare-details-inner--modal .project-compare-dim-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 10px 12px;
  font-size: 12px;
  background: var(--color-surface);
}
.project-compare-dimensions--grid .project-compare-dim-row {
  margin: 0;
  border: none;
}
.project-compare-dim-label {
  color: var(--color-text-secondary);
  font-weight: 500;
}
.project-compare-dim-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.project-compare-details-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 0;
}
@media (max-width: 560px) {
  .project-compare-details-columns {
    grid-template-columns: 1fr;
  }
}
.project-compare-details-inner--modal .project-compare-details-col {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  min-height: 0;
}
.project-compare-details-col .project-compare-list-block:first-child { margin-top: 0; }
.project-compare-details-inner--modal .project-compare-list-block { margin-top: 12px; }
.project-compare-details-inner--modal .project-compare-list-block:first-child { margin-top: 0; }
.project-compare-list-title {
  font-weight: 600;
  margin: 0 0 8px 0;
  font-size: 12px;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.project-compare-comp-list,
.project-compare-rule-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.55;
}
.project-compare-comp-name { color: var(--color-text); }
.project-compare-comp-meta { color: var(--color-text-muted); margin-left: 6px; }
.project-compare-rule-id { color: var(--color-text); }
.project-compare-rule-delta { margin-left: 6px; font-variant-numeric: tabular-nums; font-weight: 600; }

.project-compare-dimensions { margin-bottom: 10px; }
.project-compare-dim-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
}
.project-compare-dim-row:last-child { border-bottom: none; }

.project-compare-details-inner .project-compare-summary-bar { margin-bottom: 8px; }
.project-compare-summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-bottom: 10px;
  font-size: 11px;
}
.project-compare-metric { color: var(--color-text); }
.project-compare-metric-findings { font-weight: 600; }

.project-compare-list-block { margin-top: 10px; }

.project-compare-diff-warning,
.project-compare-diff-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 0;
  text-align: center;
  line-height: 1.5;
}

/* Snapshot compare picker modal */
.snapshot-compare-modal {
  position: fixed;
  inset: 0;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.snapshot-compare-modal[hidden] { display: none !important; }
.snapshot-compare-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  cursor: pointer;
}
.snapshot-compare-modal-panel {
  position: relative;
  width: 100%;
  max-width: min(480px, 94vw);
  max-height: min(420px, 85vh);
  overflow: auto;
  background: var(--color-surface-elevated);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 32px 64px -12px rgba(0, 0, 0, 0.45);
  padding: 22px 24px;
}
.snapshot-compare-modal-title { font-size: 17px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px 0; color: var(--color-text); }
.snapshot-compare-modal-helper { font-size: 13px; margin: 0 0 14px 0; line-height: 1.5; }
.snapshot-compare-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.snapshot-compare-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.snapshot-compare-row:hover { background: var(--color-surface-hover); border-color: var(--color-accent); }
.snapshot-compare-row:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.snapshot-compare-empty { font-size: 13px; color: var(--color-text-muted); padding: 12px 0; }
.snapshot-compare-modal-actions { display: flex; justify-content: flex-end; }
.snapshot-compare-modal-close-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text);
  cursor: pointer;
}
.snapshot-compare-modal-close-btn:hover { background: var(--color-surface-hover); }

/* Drawer: minor clusters list */
.drawer-minor-areas-intro {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}
.drawer-minor-clusters-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 1.6;
}
.drawer-minor-cluster-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}
.drawer-minor-cluster-item:last-child { border-bottom: none; }

/* Refactoring Strategy */
.refactoring-strategy-section { margin-bottom: var(--spacing-section); }
.refactoring-strategy-list { margin: 0; padding-left: 24px; }
.refactoring-strategy-list li { margin: 14px 0; font-size: 14px; line-height: 1.6; color: var(--color-text); }
.refactoring-strategy-list li strong { color: var(--color-accent); }
.refactoring-strategy-step { display: block; }
.refactoring-strategy-step strong { display: block; margin-bottom: 4px; }
.refactoring-strategy-desc { display: block; font-size: 13px; color: var(--color-text-secondary); font-weight: 400; margin-left: 0; padding-left: 0; }

/* Top Problematic Table */
.top-problematic-table-wrap { overflow-x: auto; border-radius: var(--radius-lg); background: var(--color-surface-elevated); border: 1px solid var(--color-border); }
.top-problematic-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.top-problematic-table th, .top-problematic-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--color-border); }
.top-problematic-table th { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.top-problematic-table tbody tr:hover { background: var(--color-surface-hover); }
.top-problematic-table tbody tr[data-file-path] { cursor: pointer; }
.top-problematic-table .col-loc, .top-problematic-table .col-deps { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--color-text-muted); }

/* Top Problematic Overview Table */
.top-problematic-overview-table { font-size: 14px; min-width: 400px; }
.top-problematic-overview-table th { font-size: 11px; }
.top-problematic-overview-table th, .top-problematic-overview-table td { padding: 10px 14px; }
.top-problematic-table-row { cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
.top-problematic-table-row:hover { background: rgba(59, 130, 246, 0.06); }
.top-problematic-col-name { font-weight: 600; color: var(--color-text); }
.top-problematic-col-issue.top-problematic-col-smell { font-size: 13px; color: var(--color-text-secondary); font-weight: 400; min-width: 0; }
.top-problematic-col-severity { vertical-align: middle; }
.top-problematic-col-severity .badge-severity { font-size: 10px; padding: 2px 6px; display: inline-block; }
.badge-severity-critical { color: var(--severity-critical-fg); background: var(--severity-critical-bg); border-radius: 4px; }
.badge-severity-high { color: var(--severity-high-fg); background: var(--severity-high-bg); border-radius: 4px; }
.badge-severity-warning { color: var(--severity-warning-fg); background: var(--severity-warning-bg); border-radius: 4px; }
.badge-severity-low { color: var(--severity-low-fg); background: var(--severity-low-bg); border-radius: 4px; }
.top-problematic-col-action { text-align: right; }
.top-problematic-action-link { font-size: 13px; color: var(--color-text-secondary); text-decoration: none; transition: color 0.15s ease; }
.top-problematic-action-link:hover { color: var(--color-accent); }
.view-details-btn-sm { font-size: 12px; padding: 4px 10px; }

/* Top Problematic Compact List (legacy) */
.top-problematic-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.top-problematic-compact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  transition: background 0.15s ease;
}
.top-problematic-compact-item:hover { background: var(--color-surface-hover); }
.top-problematic-compact-item[data-file-path] { cursor: pointer; }
.top-problematic-compact-name { font-size: 15px; font-weight: 600; color: var(--color-text); }
.top-problematic-compact-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.overview-action-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
}
.overview-action-link:hover { text-decoration: underline; }

/* Overview Action Nav */
.overview-action-nav { margin-top: 8px; }
.overview-action-nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}
@media (max-width: 400px) {
  .overview-action-nav-grid { grid-template-columns: 1fr; }
}
.overview-action-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 18px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  text-align: center;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.overview-action-card:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text);
  text-decoration: none;
}
.overview-action-card-primary {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
  font-size: 14px;
}
.overview-action-card-primary:hover {
  background: rgba(59, 130, 246, 0.22);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.overview-action-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* Overview Pattern Preview */
.overview-pattern-preview-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.overview-pattern-preview-empty { padding-bottom: 4px; }
.overview-pattern-empty-state {
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  padding: 6px 0;
  margin-bottom: 6px;
}
.overview-action-secondary {
  opacity: 0.6;
  cursor: default;
  pointer-events: none;
}
.overview-pattern-preview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.overview-pattern-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.overview-pattern-preview-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.overview-pattern-preview-meta { font-size: 12px; color: var(--color-text-muted); }
.overview-pattern-preview-hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.report {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.report-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}
.report-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}
.report-header .meta {
  color: var(--color-text-muted);
  font-size: 13px;
}
.report-header .risk-badge,
.risk-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.report-header .risk-badge.critical,
.risk-badge.critical,
.impact-badge.critical { background: var(--color-critical); color: #fff; }
.report-header .risk-badge.high,
.risk-badge.high,
.impact-badge.high { background: var(--color-high); color: #fff; }
.report-header .risk-badge.medium,
.risk-badge.medium,
.impact-badge.medium { background: var(--color-warning); color: #000; }
.report-header .risk-badge.low,
.risk-badge.low,
.impact-badge.low { background: var(--color-success); color: #fff; }
.impact-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.impact-badge.impact-band.very-high { background: var(--color-critical); color: #fff; }
.impact-badge.impact-band.high { background: var(--color-high); color: #fff; }
.impact-badge.impact-band.medium { background: var(--color-warning); color: #000; }
.impact-badge.impact-band.low { background: var(--color-success); color: #fff; }
.impact-score-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 12px 0;
}
.impact-score-bar {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}
.impact-score-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 4px;
  transition: width 0.3s ease;
}
.impact-score-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 40px;
}
.hotspot-reasons-list {
  margin: 4px 0 12px 0;
  padding-left: 20px;
}
.hotspot-reasons-list li { margin: 4px 0; }
.impact-breakdown-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-border);
  margin: 6px 0 4px 0;
}
.breakdown-segment {
  min-width: 2px;
  transition: width 0.2s;
}
.breakdown-segment:nth-child(1) { background: var(--color-accent); }
.breakdown-segment:nth-child(2) { background: var(--color-high); }
.breakdown-segment:nth-child(3) { background: var(--color-warning); }
.breakdown-segment:nth-child(4) { background: var(--color-critical); }
.breakdown-segment:nth-child(5) { background: var(--color-success); }
.breakdown-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.architecture-refactor-plan {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}
.architecture-refactor-plan-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.architecture-refactor-plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.architecture-refactor-plan-item {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.5;
}
.architecture-refactor-plan-item strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}
.architecture-refactor-plan-item .why-first {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.architecture-refactor-plan-item .why-first ul {
  margin: 4px 0 0 0;
  padding-left: 20px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filters label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.filters select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
}

/* Component Explorer */
.components-page-header {
  margin-bottom: 24px;
}
.components-page-header .page-section-title {
  margin-bottom: 4px;
}
.components-explorer-baseline-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--color-accent);
  background: var(--color-surface-elevated);
  font-size: 12px;
  color: var(--color-text-secondary);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}
.components-explorer-baseline-bar--active {
  border-color: rgba(129, 140, 248, 0.35);
  box-shadow:
    0 0 0 1px rgba(129, 140, 248, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.04) inset;
}
.components-explorer-baseline-bar[hidden] {
  display: none !important;
}
.components-explorer-baseline-main {
  flex: 1;
  min-width: min(200px, 100%);
}
.components-explorer-baseline-line {
  margin: 0 0 6px 0;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.components-explorer-baseline-project-line {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
  letter-spacing: -0.01em;
}
.components-explorer-baseline-summary-line {
  margin: 8px 0 0 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.components-explorer-baseline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  max-width: 100%;
}
.components-explorer-baseline-text {
  margin: 0;
  flex: 1;
  min-width: 180px;
  line-height: 1.45;
}
.components-baseline-clear-btn,
.components-baseline-action-btn {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 12px;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
}
@media (max-width: 520px) {
  .components-explorer-baseline-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .components-explorer-baseline-actions {
    justify-content: flex-start;
  }
}
.components-baseline-action-btn:hover,
.components-baseline-clear-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}
.components-baseline-clear-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}
.components-baseline-clear-btn[hidden] {
  display: none !important;
}

.components-explorer-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
  padding: 18px 20px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.components-explorer-filters-primary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.components-search-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.components-search-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.components-search-wrap .components-search-input {
  flex: 1 1 200px;
  width: 100%;
  max-width: 420px;
  padding: 10px 14px;
`;
