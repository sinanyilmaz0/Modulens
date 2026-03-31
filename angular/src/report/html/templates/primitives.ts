/**
 * Low-level HTML helpers: escaping, chips, tables, badges, empty states.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ICON_INFO = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4v1"/></svg>`;

export function renderInfoTooltip(explanation: string): string {
  const safe = escapeHtml(explanation);
  return `<span class="info-tooltip" title="${safe}" aria-label="${safe}">${ICON_INFO}</span>`;
}

/** Reusable section header: title + optional helper + optional tooltip in title */
export function renderSectionHeader(
  title: string,
  options?: { helper?: string; titleHtml?: string }
): string {
  const titleEl = options?.titleHtml ?? escapeHtml(title);
  const helperHtml = options?.helper ? `<p class="section-helper text-muted">${escapeHtml(options.helper)}</p>` : "";
  return `<h2 class="page-section-title section-title-caps">${titleEl}</h2>${helperHtml}`;
}

export function renderChip(text: string): string {
  return `<span class="chip">${escapeHtml(text)}</span>`;
}

export function renderChipList(texts: string[]): string {
  if (texts.length === 0) return "—";
  return `<span class="chip-list">${texts.map((t) => renderChip(t)).join("")}</span>`;
}

export type TableCell = string | { __raw: string };

export function raw(html: string): { __raw: string } {
  return { __raw: html };
}

function renderCell(cell: TableCell): string {
  if (typeof cell === "object" && cell && "__raw" in cell) {
    return (cell as { __raw: string }).__raw;
  }
  return escapeHtml(String(cell));
}

export function renderTable(
  headers: string[],
  rows: TableCell[][],
  rowAttrs?: (rowIndex: number) => string,
  columnClasses?: string[]
): string {
  const th = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows.map(
    (row, i) =>
      `<tr ${rowAttrs ? rowAttrs(i) : ""}>${row
        .map(
          (cell, j) =>
            `<td${columnClasses?.[j] ? ` class="${escapeHtml(columnClasses[j])}"` : ""}>${renderCell(cell)}</td>`
        )
        .join("")}</tr>`
  );
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${th}</tr></thead>
        <tbody>${trs.join("")}</tbody>
      </table>
    </div>`;
}

export function renderBadge(text: string, severity: "critical" | "high" | "warning" | "low" | "info"): string {
  return `<span class="badge ${severity}">${escapeHtml(text)}</span>`;
}

export function renderSmellBadge(text: string): string {
  return `<span class="badge badge-smell">${escapeHtml(text)}</span>`;
}

export function renderWarningCard(code: string, count: number): string {
  return `
    <div class="warning-card">
      <div class="code">${escapeHtml(code)}</div>
      <div class="count">${count} occurrences</div>
    </div>`;
}

export function renderEmptyState(message: string, contextual = false): string {
  const cls = contextual ? "empty-state empty-state-contextual" : "empty-state";
  return `<div class="${cls}">${escapeHtml(message)}</div>`;
}
