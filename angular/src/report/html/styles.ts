/**
 * Embedded CSS for HTML report.
 * Uses CSS variables for theming; can be extracted to CSS module for React later.
 */
export const REPORT_STYLES = `
:root {
  --color-bg: #0f1419;
  --color-surface: #161b22;
  --color-surface-hover: #1f2937;
  --color-surface-elevated: #1c222d;
  --color-border: rgba(255,255,255,0.08);
  --color-border-strong: rgba(255,255,255,0.14);
  --color-text: #e6edf3;
  --color-text-muted: #8b949e;
  --color-text-secondary: #b1bac4;
  --color-accent: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-high: #f97316;
  --color-critical: #ef4444;
  --color-bg-muted: #1e2636;
  --color-accent-muted: rgba(59,130,246,0.15);
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.12);
  --sidebar-width: 200px;
  --spacing-section: 48px;
  --spacing-card: 24px;

  /* Severity design tokens */
  --severity-critical-fg: #fecaca;
  --severity-critical-bg: rgba(239, 68, 68, 0.16);
  --severity-critical-row-border: #dc2626;
  --severity-critical-row-bg: linear-gradient(90deg, rgba(220, 38, 38, 0.06) 0%, transparent 100%);
  --severity-critical-row-bg-hover: linear-gradient(90deg, rgba(220, 38, 38, 0.1) 0%, var(--color-surface-hover) 100%);

  --severity-high-fg: #fed7aa;
  --severity-high-bg: rgba(234, 88, 12, 0.16);
  --severity-high-row-border: #ea580c;
  --severity-high-row-bg: linear-gradient(90deg, rgba(234, 88, 12, 0.04) 0%, transparent 100%);
  --severity-high-row-bg-hover: linear-gradient(90deg, rgba(234, 88, 12, 0.08) 0%, var(--color-surface-hover) 100%);

  --severity-warning-fg: #fcd34d;
  --severity-warning-bg: rgba(245, 158, 11, 0.18);
  --severity-warning-row-border: rgba(255, 255, 255, 0.2);
  --severity-warning-row-bg: transparent;
  --severity-warning-row-bg-hover: var(--color-surface-hover);

  /* LOW: calm teal/cyan, clearly distinct but not too loud */
  --severity-low-fg: #a5f3fc;
  --severity-low-bg: rgba(34, 211, 238, 0.18);
  --severity-low-row-border: rgba(34, 211, 238, 0.7);
  --severity-low-row-bg: linear-gradient(90deg, rgba(34, 211, 238, 0.05) 0%, transparent 100%);
  --severity-low-row-bg-hover: linear-gradient(90deg, rgba(34, 211, 238, 0.1) 0%, var(--color-surface-hover) 100%);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  min-height: 100vh;
}
.section-title-caps {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 16px 0;
}
.text-muted { color: var(--color-text-secondary); font-size: 14px; line-height: 1.5; }
.section-helper { font-size: 13px; color: var(--color-text-secondary); line-height: 1.55; margin: 0px 0 12px 0; }

/* Info tooltip */
.info-tooltip {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: var(--color-text-muted);
  cursor: help;
  vertical-align: middle;
}
.info-tooltip:hover { color: var(--color-text-secondary); }
.info-tooltip svg { display: block; }

/* Dashboard layout */
.report-dashboard {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-surface);
  box-shadow: 1px 0 0 0 var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.sidebar-brand {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 1px 0 0 var(--color-border);
}
.sidebar-brand-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.sidebar-brand-subtitle {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  opacity: 0.9;
}
.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}
.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s, background 0.2s;
  min-width: 0;
  overflow: hidden;
}
.sidebar-nav .nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.nav-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.8;
}
.sidebar-nav a.active .nav-icon { opacity: 1; color: inherit; }
.sidebar-nav a:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}
.sidebar-nav a.active {
  color: var(--color-accent);
  background: var(--color-accent-muted);
  border-left: 3px solid var(--color-accent);
  padding-left: 17px;
}
.sidebar-nav-group { margin-bottom: 12px; }
.sidebar-nav-group-reference {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.sidebar-nav-group-label {
  padding: 8px 20px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  opacity: 0.8;
}
.main {
  margin-left: var(--sidebar-width);
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px;
  background: var(--color-bg);
  box-shadow: 0 1px 0 0 var(--color-border);
}
.top-bar-left {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.workspace-meta {
  font-size: 13px;
  color: var(--color-text-muted);
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.export-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-surface);
  border: none;
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: var(--shadow);
}
.export-btn:hover {
  background: var(--color-surface-hover);
}
.content {
  flex: 1;
  min-height: 0;
  padding: 32px;
  overflow-y: auto;
  overflow-x: hidden;
}
.dashboard-page {
  display: none;
  max-width: 1200px;
  margin: 0 auto;
}
.dashboard-page.active {
  display: block;
}
.page-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 20px 0;
}
.overview-section {
  margin-bottom: var(--spacing-section);
}
.overview-section:last-child { margin-bottom: 0; }

.overview-insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 4px;
}
.overview-insight-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 18px;
}
.overview-insight-card-wide {
  grid-column: 1 / -1;
}
@media (min-width: 900px) {
  .overview-insight-grid {
    grid-template-columns: 1fr 1fr;
  }
  .overview-insight-card-wide {
    grid-column: 1 / -1;
  }
}
.overview-insight-card-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin: 0 0 10px 0;
}
.overview-insight-list {
  margin: 0;
  padding-left: 18px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.55;
}
.overview-insight-list li { margin-bottom: 6px; }
.overview-insight-footnote {
  font-size: 12px;
  margin: 12px 0 0 0;
}
.overview-insight-empty {
  font-size: 14px;
  margin: 8px 0 0 0;
}
.overview-hotspot-list {
  list-style: none;
  margin: 12px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.overview-hotspot-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.overview-hotspot-rank {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-bg-muted);
  border-radius: 6px;
}
.overview-hotspot-body { min-width: 0; flex: 1; }
.overview-hotspot-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 4px;
}
.overview-hotspot-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 15px;
}
button.overview-hotspot-name-link {
  font: inherit;
  font-weight: 600;
  font-size: 15px;
  color: var(--color-accent);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 3px;
}
button.overview-hotspot-name-link:hover {
  color: var(--color-text);
}
.overview-hotspot-kind {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 2px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}
.overview-hotspot-subtitle {
  font-size: 12px;
  font-family: var(--font-mono);
  margin-bottom: 6px;
  word-break: break-all;
}
.overview-hotspot-reason {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.overview-recommended-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.55;
}
.overview-recommended-list li { margin-bottom: 8px; }

/* Overview Hero (2-column) */
.overview-hero {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 32px 36px;
  margin-bottom: var(--spacing-section);
  border: 1px solid var(--color-border);
}
.overview-hero-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin: 0 0 20px 0; }
.overview-hero-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(280px, 1.8fr);
  gap: 32px;
  align-items: start;
}
@media (max-width: 768px) {
  .overview-hero-grid { grid-template-columns: 1fr; }
}
.overview-hero-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.overview-hero-score-ring {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}
.overview-hero-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.overview-hero-ring-bg { fill: none; stroke: var(--color-border); stroke-width: 8; }
.overview-hero-ring-fill { fill: none; stroke: var(--color-accent); stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 0.3s ease; }
.overview-hero-score-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.overview-hero-score-max { font-size: 18px; font-weight: 500; color: var(--color-text-muted); }
.overview-hero-score-helper { font-size: 13px; line-height: 1.5; color: var(--color-text-secondary); margin: 0; }
.overview-hero-score-breakdown { display: flex; flex-direction: column; gap: 8px; }
.overview-hero-score-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.overview-hero-score-mini-label { flex: 0 0 100px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.overview-hero-score-mini-bar { flex: 1; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; min-width: 40px; }
.overview-hero-score-mini-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease; }
.overview-hero-score-mini-fill.good { background: var(--color-success); }
.overview-hero-score-mini-fill.medium { background: var(--color-warning); }
.overview-hero-score-mini-fill.bad { background: var(--color-critical); }
.overview-hero-score-mini-value { font-weight: 600; font-variant-numeric: tabular-nums; min-width: 28px; }
.overview-hero-score-mini-value.good { color: var(--color-success); }
.overview-hero-score-mini-value.medium { color: var(--color-warning); }
.overview-hero-score-mini-value.bad { color: var(--color-critical); }
.overview-hero-right {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.overview-hero-risk-badge { margin: 0; padding: 4px 10px; font-size: 11px; font-weight: 500; opacity: 0.95; }
.overview-hero-risk-badge.high { background: rgba(249, 115, 22, 0.2); color: var(--color-high); border: 1px solid rgba(249, 115, 22, 0.4); }
.overview-hero-summary { font-size: 15px; line-height: 1.6; color: var(--color-text); margin: 0; }
.overview-hero-key-findings { margin: 0; }
.overview-hero-key-findings-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin: 0 0 6px 0; }
.overview-hero-key-findings-list { margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.6; color: var(--color-text-secondary); }
.overview-hero-key-findings-list li { margin-bottom: 4px; }
.overview-hero-chips { display: flex; flex-wrap: wrap; gap: 10px; }
.overview-hero-chip {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.overview-hero-recommendation {
  padding: 12px 16px;
  background: rgba(59,130,246,0.08);
  border-radius: var(--radius);
  border-left: 3px solid var(--color-accent);
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}
.overview-hero-quick-nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.overview-hero-quick-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
}
.overview-hero-quick-link:hover { color: var(--color-accent); text-decoration: underline; }

/* Main Diagnosis block */
.main-diagnosis-block { margin-bottom: 8px; }
.main-diagnosis-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin: 0 0 10px 0; }
.main-diagnosis-list { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 13px; line-height: 1.5; }
.main-diagnosis-list dt { color: var(--color-text-muted); font-weight: 500; }
.main-diagnosis-list dd { margin: 0; color: var(--color-text); max-width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }


/* Overview Metrics Grouped */
.overview-metrics-grouped {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: var(--spacing-section);
}
.metric-group {
  padding: 16px 20px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.metric-group-scale { border-left: 3px solid var(--color-accent); }
.metric-group-risk { border-left: 3px solid var(--color-warning); }
.metric-group-quality { border-left: 3px solid var(--color-success); }
.metric-group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin: 0 0 16px 0;
}
.metric-group-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-card);
}
.metric-group-quality .metric-group-cards {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 900px) {
  .metric-group-cards { grid-template-columns: repeat(2, 1fr); }
  .metric-group-quality .metric-group-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .metric-group-cards { grid-template-columns: 1fr; }
  .metric-group-quality .metric-group-cards { grid-template-columns: 1fr; }
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-card);
  margin-bottom: var(--spacing-section);
}
.project-breakdown-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--color-border);
  transition: background 0.15s ease;
}
.project-breakdown-card:hover { background: var(--color-surface-hover); }
.project-breakdown-card.project-breakdown-worst { border-color: rgba(239,68,68,0.3); }
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
.components-search-wrap {
  width: 100%;
}
.components-search-wrap .components-search-input {
  width: 100%;
  max-width: 420px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
}
.components-search-wrap .components-search-input::placeholder {
  color: var(--color-text-muted);
}
.components-explorer-filters-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
}
.components-explorer-filters-secondary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.components-show-healthy-wrap {
  white-space: nowrap;
}
.components-explorer-filters label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.components-explorer-filters select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
}

.components-active-filters {
  display: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.active-filter-chip-label {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.active-filter-chip-remove {
  padding: 0 2px;
  font-size: 14px;
  line-height: 1;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 2px;
}
.active-filter-chip-remove:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}
.active-filter-clear-all {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  cursor: pointer;
  margin-left: 4px;
}
.active-filter-clear-all:hover {
  color: var(--color-accent);
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}

.components-summary-strip {
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 18px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  line-height: 1.45;
  background: var(--color-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.component-explorer-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.component-explorer-row {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(80px, auto);
  align-items: center;
  gap: 12px 20px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  border-left: 4px solid transparent;
}
.component-explorer-row:nth-child(odd) {
  background: rgba(255, 255, 255, 0.01);
}
.component-explorer-row:hover {
  background: var(--color-surface-hover) !important;
}
.component-explorer-row:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
.component-explorer-row.component-explorer-row-selected {
  background: rgba(59, 130, 246, 0.08) !important;
  border-left-color: var(--color-accent);
}
.component-explorer-row.severity-critical {
  border-left-color: var(--severity-critical-row-border);
  background: var(--severity-critical-row-bg) !important;
}
.component-explorer-row.severity-critical:hover {
  background: var(--severity-critical-row-bg-hover) !important;
}
.component-explorer-row.severity-high {
  border-left-color: var(--severity-high-row-border);
  background: var(--severity-high-row-bg) !important;
}
.component-explorer-row.severity-high:hover {
  background: var(--severity-high-row-bg-hover) !important;
}
.component-explorer-row.severity-warning {
  border-left-color: var(--severity-warning-row-border);
}
.component-explorer-row.severity-low {
  border-left-color: var(--severity-low-row-border);
  background: var(--severity-low-row-bg) !important;
}
.component-explorer-row.severity-low:hover {
  background: var(--severity-low-row-bg-hover) !important;
}
.comp-row-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.comp-row-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
  flex: 1;
  min-width: 0;
}
.comp-row-smell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  min-width: 0;
}
.comp-row-smell .badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 7px;
  opacity: 0.9;
}
.severity-pill {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.severity-pill-critical {
  background: var(--severity-critical-bg);
  color: var(--severity-critical-fg);
}
.severity-pill-high {
  background: var(--severity-high-bg);
  color: var(--severity-high-fg);
}
.severity-pill-warning {
  background: var(--severity-warning-bg);
  color: var(--severity-warning-fg);
}
.severity-pill-low {
  background: var(--severity-low-bg);
  color: var(--severity-low-fg);
}
.comp-row-summary {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 10px;
  min-width: 0;
}
.component-explorer-action,
.comp-row-family-badge {
  display: inline-block;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 2px 6px;
  background: var(--color-surface-elevated);
  border-radius: 4px;
}
.component-explorer-action,
.component-explorer-summary {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  opacity: 0.95;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.comp-row-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.comp-row-action {
  flex-shrink: 0;
}
.metric-chip {
  font-size: 10px;
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.data-quality-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.4);
}
.role-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  opacity: 0.9;
}
.role-badge-definite {
  color: var(--color-text-secondary);
  border-color: rgba(255, 255, 255, 0.18);
}
.role-badge-likely {
  color: var(--color-text-secondary);
  opacity: 0.9;
  border-color: rgba(255, 255, 255, 0.15);
}
.role-badge-muted {
  color: var(--color-text-muted);
  opacity: 0.8;
  font-weight: 500;
}
.role-confidence-text {
  margin-left: 6px;
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}
.component-explorer-view-btn {
  padding: 5px 11px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.component-explorer-row:hover .component-explorer-view-btn {
  color: var(--color-text-secondary);
}
.component-explorer-view-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.component-explorer-view-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.components-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  flex-wrap: wrap;
}
.pagination-btn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.pagination-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pagination-page {
  padding: 4px 10px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.pagination-page:hover {
  background: var(--color-surface-hover);
}
.pagination-page.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}
.pagination-ellipsis {
  padding: 0 4px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.pagination-current {
  font-size: 13px;
  color: var(--color-text-muted);
}

.components-explorer-empty {
  text-align: center;
  padding: 48px 32px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  margin-bottom: 24px;
}
.components-explorer-empty-title {
  margin: 0 0 8px 0;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 500;
}
.components-explorer-empty p {
  margin: 0 0 8px 0;
  color: var(--color-text-muted);
  font-size: 15px;
}
.components-explorer-empty-hint {
  margin: 0 0 24px 0 !important;
  font-size: 13px !important;
  color: var(--color-text-secondary) !important;
  opacity: 0.95;
  max-width: 400px;
  margin-left: auto !important;
  margin-right: auto !important;
}
.components-explorer-empty-actions {
  margin: 0 !important;
}
.components-empty-state-filtered .components-explorer-empty-actions {
  margin-top: 8px !important;
}
.btn-secondary {
  padding: 8px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: var(--color-surface-hover);
}
.btn-primary {
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-accent, #2563eb);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:hover {
  background: var(--color-accent-hover, #1d4ed8);
  color: #fff;
}

@media (max-width: 900px) {
  .component-explorer-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto auto;
    gap: 8px 16px;
    padding: 12px 16px;
  }
  .comp-row-primary {
    grid-column: 1;
    grid-row: 1;
  }
  .comp-row-action {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
  }
  .comp-row-smell {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .comp-row-summary {
    grid-column: 1 / -1;
    grid-row: 3;
  }
  .components-explorer-filters {
    padding: 16px;
  }
  .components-explorer-filters-primary {
    gap: 12px;
  }
  .components-search-wrap .components-search-input {
    max-width: none;
  }
  .components-explorer-filters-row {
    gap: 16px;
  }
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
    max-width: 80px;
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
.planner-bucket-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}
.planner-bucket-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.planner-bucket-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

/* Reusable planner UI patterns */
.compact-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.rationale-row {
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-muted);
  padding: 4px 0;
}
.action-footer-hierarchy {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.action-footer-primary { }
.action-footer-secondary { }
.action-footer-tertiary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-left: auto;
}
.empty-guidance-panel {
  padding: 20px 24px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  text-align: center;
}
.empty-guidance-message {
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 8px;
}
.empty-guidance-reassurance {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 8px;
}
.empty-guidance-best-step {
  font-size: 13px;
  margin-top: 8px;
}
.empty-guidance-best-step a {
  color: var(--color-accent);
  text-decoration: none;
}
.empty-guidance-best-step a:hover { text-decoration: underline; }
.empty-guidance-hint {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}
.empty-guidance-links {
  font-size: 13px;
}
.empty-guidance-link {
  color: var(--color-accent);
  text-decoration: none;
}
.empty-guidance-link:hover { text-decoration: underline; }

/* Top Refactor Targets */
.top-refactor-target-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
}
.top-refactor-target-card .card-title { font-size: 15px; }
.refactor-target-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.refactor-target-meta-compact {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.refactor-target-meta-compact .compact-meta-row { margin: 0; }
.refactor-target-meta-compact .dominant-issue-badge { margin-left: 4px; }
.refactor-target-path-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.refactor-target-path {
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.9;
  font-family: var(--font-mono);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.refactor-target-path-copy {
  flex-shrink: 0;
}
.refactor-target-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.refactor-target-meta-row {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.refactor-target-issue {
  font-size: 12px;
  color: var(--color-warning);
}
.refactor-target-suggested {
  font-size: 13px;
  color: var(--color-text);
}
.refactor-target-extractions {
  font-size: 12px;
  margin-top: 4px;
}
.refactor-target-extractions ul {
  margin: 6px 0 0 0;
  padding-left: 18px;
}
.impact-badge, .effort-badge, .dominant-issue-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  text-align: center;
}
.impact-badge { background: rgba(88,166,255,0.15); color: var(--color-accent); }
.effort-badge { background: rgba(150,150,150,0.15); color: var(--color-text-muted); }
.dominant-issue-badge { background: rgba(210,153,34,0.2); color: var(--color-warning); }
.refactor-target-ranking {
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}
.refactor-target-steps {
  margin-top: 8px;
  padding-top: 8px;
}
.refactor-target-steps ul {
  margin: 6px 0 0 0;
  padding-left: 18px;
}
.refactor-target-why-now {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 6px;
}
.refactor-target-component-note {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-muted);
  padding: 6px 10px;
  background: rgba(88, 166, 255, 0.04);
  border-radius: 6px;
  border-left: 2px solid rgba(88, 166, 255, 0.2);
}
.refactor-target-component-note strong {
  font-weight: 500;
  color: var(--color-text);
}
.refactor-target-steps-collapsed {
  margin-top: 8px;
  font-size: 12px;
}
.refactor-target-steps-collapsed summary {
  cursor: pointer;
  color: var(--color-accent);
  font-weight: 500;
}
.refactor-target-steps-collapsed ul {
  margin: 8px 0 0 0;
  padding-left: 18px;
}
.planner-chip-pattern-group {
  background: rgba(88, 166, 255, 0.12);
  color: var(--color-accent);
}
.planner-chip-same-family {
  background: rgba(100, 180, 100, 0.12);
  color: var(--color-success, #5a9e5a);
}
/* Planner Button System */
.planner-btn-primary,
.planner-cta-primary {
  min-height: 36px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s, opacity 0.15s;
  text-decoration: none;
}
.planner-btn-primary:hover,
.planner-cta-primary:hover {
  background: var(--color-accent-hover, rgba(59, 130, 246, 0.9));
}
.planner-btn-primary:active,
.planner-cta-primary:active { opacity: 0.95; }
.planner-btn-primary:disabled,
.planner-cta-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.planner-btn-secondary,
.planner-cta-secondary {
  min-height: 36px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s, border-color 0.15s;
  text-decoration: none;
}
.planner-btn-secondary:hover,
.planner-cta-secondary:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}
.planner-btn-secondary:active,
.planner-cta-secondary:active { opacity: 0.9; }

.planner-btn-tertiary,
.planner-cta-tertiary {
  min-height: 28px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: color 0.15s, background 0.15s;
  text-decoration: none;
}
.planner-btn-tertiary:hover,
.planner-cta-tertiary:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.planner-btn-utility {
  min-height: 24px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: color 0.15s, background 0.15s;
}
.planner-btn-utility:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.refactor-target-actions,
.planner-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.action-footer-hierarchy .view-details-btn,
.refactor-target-actions .view-details-btn {
  margin-top: 0;
  padding: 10px 20px;
  min-height: 36px;
  color: #fff;
}
.planner-nav-link {
  color: inherit;
  text-decoration: none;
}
.planner-nav-link:hover { text-decoration: none; }
.planner-nav-link:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.planner-nav-link.planner-btn-secondary:hover { color: var(--color-text); }
.planner-target-hidden { display: none; }
.planner-targets-list { position: relative; }
.planner-show-more-btn {
  display: block;
  margin: 20px auto 0;
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid var(--color-accent);
  background: transparent;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.planner-show-more-btn:hover { background: rgba(88,166,255,0.1); }

/* Extraction Opportunities */
.extraction-opportunity-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
}
.extraction-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.extraction-count-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(88, 166, 255, 0.15);
  color: var(--color-accent);
}
.extraction-roi-row {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}
.extraction-summary {
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-text);
  padding: 8px 10px;
  background: rgba(88, 166, 255, 0.06);
  border-radius: 6px;
  border-left: 3px solid var(--color-accent);
}
.extraction-affected {
  margin-top: 4px;
  padding-bottom: 8px;
}
.extraction-cta {
  margin-top: 10px;
  align-self: flex-start;
}
.extraction-meta {
  font-size: 12px;
  color: var(--color-text-muted);
}
.extraction-recommended {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.extraction-recommended ul {
  margin: 6px 0 0 0;
  padding-left: 18px;
}
.extraction-affected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.extraction-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.extraction-chip-more {
  color: var(--color-accent);
}
.extraction-chip-hidden {
  display: none;
}
.extraction-affected-expanded .extraction-chip-hidden {
  display: inline-block;
}
.extraction-expand-btn {
  cursor: pointer;
}
.extraction-why {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 4px;
}
.extraction-opportunity-card .planner-nav-link {
}

/* Quick Win Catalog */
.quick-win-catalog-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  border: 1px solid var(--color-border);
}
.quick-win-card-emphasized {
  border-left: 4px solid var(--color-accent);
  background: rgba(88, 166, 255, 0.04);
}
.quick-win-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.quick-win-count-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(34, 139, 34, 0.2);
  color: var(--color-success);
}
.quick-win-catalog-card .card-title {
  font-size: 15px;
}
.quick-win-meta {
  font-size: 11px;
  color: var(--color-text-muted);
}
.quick-win-explanation {
  font-size: 13px;
  color: var(--color-text);
}
.quick-win-why {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
}
.quick-win-rationale {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-top: 6px;
}
.quick-win-fix {
  font-size: 14px;
  color: var(--color-accent);
  font-weight: 500;
}
.quick-win-bulk { margin-top: 4px; }
.quick-win-cta {
  margin-top: 16px;
  align-self: flex-start;
}
.bulk-fix-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border);
}
.bulk-fix-badge.bulk-fix-high { background: rgba(88,166,255,0.2); color: var(--color-accent); }
.bulk-fix-badge.bulk-fix-medium { background: rgba(210,153,34,0.2); color: var(--color-warning); }

.card-list { display: flex; flex-direction: column; gap: 12px; }

/* Rules page - compact rule cards */
.rule-card-compact {
  padding: 12px 16px;
  margin-bottom: 8px;
}
.rule-card-compact[data-triggered="true"] {
  border-left: 3px solid var(--color-warning);
}
.rules-card-list { gap: 8px; }
.rule-card-compact .rule-card-header {
  cursor: pointer;
  padding: 0;
  margin: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-card-compact .rule-card-header:hover {
  background: transparent;
}
.rule-card-header-top {
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
  padding: 8px 0;
}
.patterns-page-purpose-minimal {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.patterns-page-purpose-label {
  font-weight: 500;
  color: var(--color-text);
}

.patterns-page-purpose-bullets {
  margin: 6px 0 0 0;
  padding-left: 20px;
}

.pattern-empty-state {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 14px 18px;
  margin-bottom: 20px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.pattern-empty-message {
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.pattern-empty-hint {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.pattern-empty-next {
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 12px;
}
.pattern-empty-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.pattern-empty-link {
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: none;
}
.pattern-empty-link:hover {
  text-decoration: underline;
}

.patterns-repeated-arch-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 12px 16px;
  margin-bottom: 24px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
}

.patterns-repeated-feature-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 12px 16px;
  margin-bottom: 24px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
}

.patterns-empty-line2 {
  font-size: 12px;
  opacity: 0.9;
}

.patterns-cta-block {
  margin-top: 32px;
  padding: 20px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.patterns-cta-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px 0;
}

.patterns-cta-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.patterns-cta-link {
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: none;
}

.patterns-cta-link:hover {
  text-decoration: underline;
}
.patterns-cta-link.patterns-cta-primary {
  font-weight: 600;
}

.pattern-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.pattern-card {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pattern-card-meta {
  display: flex;
  gap: 12px;
  align-items: baseline;
  font-size: 14px;
  color: var(--color-text-muted);
}

.pattern-card-count {
  font-weight: 500;
}

.pattern-card-pct {
  font-size: 12px;
  opacity: 0.9;
}

.pattern-card-impact-badge {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
}

.pattern-card-impact-low .pattern-card-impact-badge {
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-text);
}

.pattern-card-impact-medium .pattern-card-impact-badge {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-text);
}

.pattern-card-impact-high .pattern-card-impact-badge {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-text);
}

.pattern-card-color-template { border-left: 3px solid rgba(245, 158, 11, 0.6); }
.pattern-card-color-god { border-left: 3px solid rgba(239, 68, 68, 0.6); }
.pattern-card-color-cleanup { border-left: 3px solid rgba(234, 179, 8, 0.6); }
.pattern-card-color-orchestration { border-left: 3px solid rgba(139, 92, 246, 0.6); }
.pattern-card-color-lifecycle { border-left: 3px solid rgba(59, 130, 246, 0.6); }

.pattern-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pattern-card-header .pattern-card-title {
  flex: 1;
  min-width: 0;
}
.pattern-card-header .pattern-card-impact-badge {
  flex-shrink: 0;
}
.pattern-card-area,
.pattern-card-action,
.pattern-card-example {
  font-size: 12px;
  color: var(--color-text-muted);
}
.pattern-card-primary {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
}

.pattern-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.pattern-card-explanation {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.4;
  flex: 1;
}

.pattern-card .pattern-explore-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.feature-pattern-card-collapsible {
  border: 1px solid var(--color-border);
}
.feature-pattern-card-compact .feature-pattern-card-header {
  padding: 12px 16px;
}
.feature-pattern-card-compact .feature-pattern-card-body .feature-pattern-section {
  margin-bottom: 10px;
}
.feature-pattern-card-compact .feature-pattern-card-body .feature-pattern-section:last-child {
  margin-bottom: 0;
}
.feature-pattern-refactor-hint {
  font-size: 12px;
  color: var(--color-accent);
  margin-top: 6px;
}
.feature-pattern-candidate-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.feature-pattern-candidate-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
}
.feature-pattern-candidate-row:hover {
  background: var(--color-surface-hover);
}
.feature-pattern-candidate-line1 {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.feature-pattern-candidate-name {
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feature-pattern-candidate-metrics {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.feature-pattern-candidate-path {
  font-size: 11px;
  color: var(--color-text-muted);
  padding-left: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feature-pattern-section-grouped .pattern-section-title {
  margin-bottom: 8px;
}
.feature-pattern-refactor-compact {
  margin: 0 0 8px 0;
  padding-left: 18px;
}
.feature-pattern-refactor-compact li {
  margin: 2px 0;
}
.feature-pattern-architecture-compact {
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 8px;
}
.feature-pattern-signals-inline {
  font-size: 12px;
  margin-top: 6px;
}
.feature-pattern-component-list-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.feature-pattern-component-row-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
}
.feature-pattern-component-row-compact:hover {
  background: var(--color-surface-hover);
}
.feature-pattern-row-name {
  font-weight: 500;
  color: var(--color-text);
  min-width: 0;
  flex: 1;
}
.feature-pattern-row-path {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feature-pattern-row-metrics {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.feature-pattern-card-header {
  cursor: pointer;
  padding: 14px 16px;
}

.feature-pattern-card-header:hover {
  background: var(--color-surface-hover);
}

.feature-pattern-card-summary {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 6px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.feature-pattern-see-in-planner {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: none;
}
.feature-pattern-see-in-planner:hover { text-decoration: underline; }
.feature-pattern-card-expand-btn {
  margin-top: 4px;
}

.feature-pattern-card-body {
  padding: 10px 12px 12px 12px;
  border-top: 1px solid var(--color-border);
}

.feature-pattern-card-body .feature-pattern-meta {
  margin-top: 8px;
}

.feature-pattern-section-primary {
  margin-bottom: 10px;
}

.feature-pattern-section-primary .pattern-section-title {
  font-size: 12px;
}

.feature-pattern-component-row {
  margin-top: 8px;
}

.pattern-drawer-quick-summary {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}
.pattern-drawer-explanation {
  margin-bottom: 20px;
}
.pattern-drawer-compact .pattern-drawer-section {
  margin-bottom: 12px;
}
.pattern-drawer-cta-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.pattern-component-row-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
  background: var(--color-bg-muted);
}
.pattern-component-row-compact:hover {
  background: var(--color-surface-elevated);
}
.pattern-component-row-compact .pattern-component-name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans);
}
.pattern-component-row-compact .pattern-component-path {
  flex-shrink: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
}
.pattern-component-metrics {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.pattern-component-list-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pattern-drawer-section {
  margin-bottom: 16px;
}

.pattern-drawer-section:last-child {
  margin-bottom: 0;
}

.pattern-drawer-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.pattern-drawer-explanation p,
.pattern-drawer-components p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
}

.pattern-drawer-components {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.pattern-drawer-components-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 8px 0;
}

.pattern-component-main {
  flex: 1;
}

.pattern-component-action {
  font-size: 11px;
  color: var(--color-accent);
  margin-top: 6px;
  display: inline-block;
}

.pattern-component-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.pattern-component-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.pattern-component-row {
  padding: 12px 14px;
  background: var(--color-bg-muted);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease;
}

.pattern-component-row:hover {
  background: var(--color-surface-elevated);
}

.pattern-component-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
}

.pattern-component-path {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
  font-family: var(--font-mono);
}

.pattern-component-evidence {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.pattern-component-evidence .evidence-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--color-accent-muted);
  border-radius: 4px;
  color: var(--color-text);
}
`;
