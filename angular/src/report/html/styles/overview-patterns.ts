/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_OVERVIEW_PATTERNS = `
  .components-explorer-filters-secondary {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-top: 12px;
  }
  .components-active-filters {
    padding: 10px 12px;
    gap: 6px 10px;
  }
  .active-filter-chip-label {
    max-width: 120px;
  }
}

.section {
  margin-bottom: 40px;
}
.planner-page .section {
  margin-bottom: 56px;
}
.planner-page .section:last-of-type {
  margin-bottom: 0;
}
.section-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}
.section-title-planner {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}
.section-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 20px 0;
}
.section-description {
  margin: 0 0 16px 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
.section.collapsible .section-title {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section.collapsible .section-title::before {
  content: "▼";
  font-size: 10px;
  transition: transform 0.2s;
}
.section.collapsible.collapsed .section-title::before {
  transform: rotate(-90deg);
}
.section.collapsible.collapsed .section-content {
  display: none;
}

/* Planner page layout */
.planner-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (max-width: 768px) {
  .planner-page {
    padding: 0 16px;
  }
}

/* Workspace Health Hero */
.workspace-health-hero {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 40px 32px;
  margin-bottom: 40px;
}
.hero-title {
  margin: 0 0 24px 0 !important;
}
.hero-score-block {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}
.hero-score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.hero-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.hero-ring-bg {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 8;
}
.hero-ring-fill {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}
.hero-score-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: var(--color-text);
}
.hero-score-max {
  font-size: 24px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.hero-risk-badge {
  margin: 0;
}
.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.hero-metric-pill {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 12px 20px;
  box-shadow: var(--shadow);
  min-width: 100px;
}
.hero-metric-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}
.hero-metric-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.dashboard-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
@media (max-width: 900px) {
  .dashboard-summary-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .dashboard-summary-cards { grid-template-columns: 1fr; }
}
.dashboard-summary-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  transition: background 0.15s ease;
}
.dashboard-summary-card:hover {
  background: var(--color-surface-hover);
}
.dashboard-summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.dashboard-summary-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 12px;
}
.dashboard-summary-value.good { color: var(--color-success); }
.dashboard-summary-value.medium { color: var(--color-warning); }
.dashboard-summary-value.bad { color: var(--color-critical); }
.dashboard-summary-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.dashboard-summary-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.dashboard-summary-bar-fill.good { background: var(--color-success); }
.dashboard-summary-bar-fill.medium { background: var(--color-warning); }
.dashboard-summary-bar-fill.bad { background: var(--color-critical); }
.dashboard-summary-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}
.view-details-btn {
  margin-top: 12px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: opacity 0.15s;
}
.view-details-btn:hover {
  opacity: 0.9;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.dashboard-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  transition: background 0.15s ease;
}
.dashboard-card:hover {
  background: var(--color-surface-hover);
}
.dashboard-card .label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.dashboard-card .value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.dashboard-card .value.good { color: var(--color-success); }
.dashboard-card .value.medium { color: var(--color-warning); }
.dashboard-card .value.bad { color: var(--color-critical); }
.dashboard-card .value .risk-badge { font-size: 14px; padding: 4px 12px; display: inline-block; margin-top: 4px; }
.dashboard-card-badge .value { font-size: 1em; }

.score-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.score-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.score-card .label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.score-card .value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.score-card .value.good { color: var(--color-success); }
.score-card .value.medium { color: var(--color-warning); }
.score-card .value.bad { color: var(--color-critical); }

.score-breakdown-collapsible {
  margin-top: 24px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.score-breakdown-collapsible .score-breakdown-heading {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-breakdown-collapsible .score-breakdown-heading::before {
  content: "▼";
  font-size: 10px;
  transition: transform 0.2s;
}
.score-breakdown-collapsible.collapsed .score-breakdown-heading::before {
  transform: rotate(-90deg);
}
.score-breakdown-collapsible.collapsed .score-breakdown-content {
  display: none;
}
.score-breakdown-intro {
  margin: 0 0 16px 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
.score-breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.score-breakdown-item {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
}
.score-breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.score-breakdown-title {
  font-weight: 600;
  font-size: 14px;
}
.score-breakdown-score {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.score-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.score-breakdown-table th,
.score-breakdown-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.score-breakdown-table th {
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}
.score-breakdown-table .factor-contribution {
  font-variant-numeric: tabular-nums;
}
.score-breakdown-table .factor-contribution:not([data-positive]) {
  color: var(--color-critical);
}
.score-breakdown-empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.diagnostic-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.diagnostic-summary-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px;
}
.diagnostic-summary-item .count {
  font-size: 20px;
  font-weight: 600;
}
.diagnostic-summary-item .label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.diagnostic-summary-bar-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px;
}
.diagnostic-summary-bar-item .label { font-size: 12px; color: var(--color-text-muted); margin-bottom: 6px; }
.diagnostic-summary-bar-item .count { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.diagnostic-summary-bar-item .bar-wrap {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}
.diagnostic-summary-bar-item .bar-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  background: var(--color-surface-elevated);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th, td {
  padding: 14px 20px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
th {
  background: rgba(255,255,255,0.02);
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--color-surface-hover); }
tr[data-file-path] { cursor: pointer; }
td.path { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-muted); max-width: 320px; overflow: hidden; text-overflow: ellipsis; }
td.refactor-direction { max-width: 280px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
td.severity { font-weight: 600; }
td.severity.critical { color: var(--color-critical); }
td.severity.high { color: var(--color-high); }
td.severity.warning { color: var(--color-warning); }

/* Fix First section (enhanced, v2 two-column) */
.fix-first-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .fix-first-section { grid-template-columns: 1fr; }
}
.fix-first-card {
  position: relative;
  padding-left: 20px;
  border-left: 4px solid transparent;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.fix-first-card:hover { background: var(--color-surface-hover); }
.fix-first-card.fix-first-accent-critical { border-left-color: var(--color-critical); }
.fix-first-card.fix-first-accent-high { border-left-color: var(--color-high); }
.fix-first-card.fix-first-accent-warning { border-left-color: var(--color-warning); }
.fix-first-card-body {
  padding: 20px 24px;
}
.fix-first-card.fix-first-card-compact .fix-first-card-body { padding: 14px 18px; }
.fix-first-card.fix-first-card-compact .fix-first-component-name { font-size: 16px; }
.fix-first-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.fix-first-component-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}
.fix-first-meta {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.fix-first-card-hidden { display: none; }
.fix-first-show-more-wrap { margin-top: 14px; }
.fix-first-show-more-btn {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
  text-decoration: none;
  transition: color 0.15s ease;
}
.fix-first-show-more-btn:hover { color: var(--color-accent); }
.fix-first-show-more-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.fix-first-explanation {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 10px 0;
}
.fix-first-refactor {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.5;
}
.fix-first-evidence-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.fix-first-evidence-chips .chip { font-size: 11px; padding: 2px 6px; }
.fix-first-card .view-details-btn {
  margin-top: 12px;
}

/* Refactor Planner buckets */
.planner-buckets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
@media (max-width: 900px) {
  .planner-buckets { grid-template-columns: 1fr; }
}
.planner-bucket {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
}
`;
