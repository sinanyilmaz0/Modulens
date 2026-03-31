/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_PATTERNS_DRAWER = `
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
