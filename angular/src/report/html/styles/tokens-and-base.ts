/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_TOKENS_AND_BASE = `

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
`;
