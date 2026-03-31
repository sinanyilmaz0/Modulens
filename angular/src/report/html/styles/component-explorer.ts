/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_COMPONENT_EXPLORER = `
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
`;
