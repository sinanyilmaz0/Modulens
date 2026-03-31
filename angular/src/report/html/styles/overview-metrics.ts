/**
 * Embedded CSS fragment for HTML report.
 */
export const REPORT_STYLES_OVERVIEW_METRICS = `
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
}
.components-search-wrap .components-search-input::placeholder {
  color: var(--color-text-muted);
}
.components-search-clear {
  flex: 0 0 auto;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.components-search-clear:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
}
.components-search-clear:focus-visible {
  outline: 2px solid var(--color-accent, #3b82f6);
  outline-offset: 2px;
}
.components-search-helper {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  max-width: 52rem;
}
.components-search-match-count {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.components-search-match-count:empty {
  display: none;
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
  max-width: 220px;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.components-summary-primary {
  font-weight: 600;
  color: var(--color-text);
}
.components-summary-secondary {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.components-sort-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.components-sort-label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.components-sort-helper {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  max-width: 28rem;
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
`;
