/**
 * Presentation helpers for rule ids in the HTML report (not analyzer truth).
 * Inline client script mirrors title resolution via window.__RULES_BY_ID__.
 */

import { getRuleById } from "../../rules/rule-registry";

/** Human title from registry, or the raw id when unknown. */
export function getRuleTitleForDisplay(ruleId: string): string {
  const trimmed = (ruleId || "").trim();
  if (!trimmed) return "";
  return getRuleById(trimmed)?.title ?? trimmed;
}

/**
 * Truncate plain text for compact drawer copy (word boundary when possible).
 */
export function truncatePlainText(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.55) {
    return slice.slice(0, lastSpace).trimEnd() + "…";
  }
  return slice.trimEnd() + "…";
}

/** First sentence or segment before `. ` / `; ` for a short “next step” line. */
export function firstSentenceOrSegment(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+|;\s+/)[0] ?? t;
  const base = cut.length <= maxLen ? cut : truncatePlainText(cut, maxLen);
  return base;
}
