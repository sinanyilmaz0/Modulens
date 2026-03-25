/**
 * Strips internal severity/debug fields from objects embedded in the HTML report script tags.
 * The live snapshot in memory remains full-fidelity; only the serialized client payload is reduced.
 */

import type { ConfidenceBreakdown } from "../../confidence/confidence-models";
import type { ComponentDetailEntry, ComponentsExplorerItem } from "./html-report-presenter";

const MAX_CONTRIBUTING_SIGNALS = 8;
const MAX_ROLE_SIGNAL_FALLBACK = 4;
const MAX_DECOMP_REASONING_LINES = 24;

type ClientComponentDetail = Omit<
  ComponentDetailEntry,
  "confidence" | "anomalyFlag" | "anomalyReasons" | "roleSignals"
>;

function stripComponentDetail(entry: ComponentDetailEntry): Omit<ComponentDetailEntry, "confidence" | "anomalyFlag" | "anomalyReasons"> {
  const { confidence: _c, anomalyFlag: _a, anomalyReasons: _r, ...rest } = entry;
  return rest;
}

/** Matched-only signals for HTML client; `weight` omitted to save bytes (browser code does not use it). */
function slimConfidenceBreakdown(bd: ConfidenceBreakdown | undefined): ConfidenceBreakdown | undefined {
  if (!bd?.contributingSignals?.length) return undefined;
  const matched = bd.contributingSignals.filter((s) => s.matched);
  const signals = matched.slice(0, MAX_CONTRIBUTING_SIGNALS).map((s) => ({
    signal: s.signal,
    matched: true as const,
    note: s.note,
  })) as ConfidenceBreakdown["contributingSignals"];
  if (!signals.length) return undefined;
  return { score: bd.score, contributingSignals: signals };
}

function buildSlimRoleBreakdown(entry: ComponentDetailEntry): ConfidenceBreakdown | undefined {
  const slimmed = slimConfidenceBreakdown(entry.roleConfidenceBreakdown);
  if (slimmed?.contributingSignals?.length) return slimmed;
  if (entry.roleSignals?.length && entry.roleConfidence != null) {
    return {
      score: entry.roleConfidence,
      contributingSignals: entry.roleSignals.slice(0, MAX_ROLE_SIGNAL_FALLBACK).map((sig) => ({
        signal: sig,
        matched: true,
        note: "",
      })) as ConfidenceBreakdown["contributingSignals"],
    };
  }
  return undefined;
}

function slimLifecycle(lc: NonNullable<ComponentDetailEntry["lifecycle"]>): NonNullable<ComponentDetailEntry["lifecycle"]> {
  const out: NonNullable<ComponentDetailEntry["lifecycle"]> = {};
  if (lc.subscribeCount != null) out.subscribeCount = lc.subscribeCount;
  if (lc.riskySubscribeCount != null) out.riskySubscribeCount = lc.riskySubscribeCount;
  if (lc.addEventListenerCount != null) out.addEventListenerCount = lc.addEventListenerCount;
  return out;
}

function slimTemplate(tmpl: NonNullable<ComponentDetailEntry["template"]>): NonNullable<ComponentDetailEntry["template"]> {
  const out: NonNullable<ComponentDetailEntry["template"]> = {};
  if (tmpl.lineCount != null) out.lineCount = tmpl.lineCount;
  if (tmpl.methodCallCount != null) out.methodCallCount = tmpl.methodCallCount;
  return out;
}

function slimResponsibility(r: NonNullable<ComponentDetailEntry["responsibility"]>): NonNullable<ComponentDetailEntry["responsibility"]> {
  const out: NonNullable<ComponentDetailEntry["responsibility"]> = {};
  if (r.serviceOrchestrationCount != null) out.serviceOrchestrationCount = r.serviceOrchestrationCount;
  return out;
}

function slimDecompositionSuggestion(
  ds: NonNullable<ComponentDetailEntry["decompositionSuggestion"]>
): NonNullable<ComponentDetailEntry["decompositionSuggestion"]> {
  const reasoning =
    ds.reasoning && ds.reasoning.length > MAX_DECOMP_REASONING_LINES
      ? ds.reasoning.slice(0, MAX_DECOMP_REASONING_LINES)
      : ds.reasoning;
  const confidenceBreakdown = slimConfidenceBreakdown(ds.confidenceBreakdown);
  return {
    ...ds,
    reasoning,
    confidenceBreakdown,
  };
}

function slimComponentDetailForHtml(entry: ComponentDetailEntry): ClientComponentDetail {
  const base = stripComponentDetail(entry);
  const { roleSignals: _dropSignals, roleConfidenceBreakdown: _dropBd, ...withoutRoleRaw } = base;
  const roleConfidenceBreakdown = buildSlimRoleBreakdown(entry);

  const out: Record<string, unknown> = { ...withoutRoleRaw };
  if (roleConfidenceBreakdown) {
    out.roleConfidenceBreakdown = roleConfidenceBreakdown;
  }

  if (entry.decompositionSuggestion) {
    out.decompositionSuggestion = slimDecompositionSuggestion(entry.decompositionSuggestion);
  }

  if (entry.lifecycle) {
    const sl = slimLifecycle(entry.lifecycle);
    if (Object.keys(sl).length) out.lifecycle = sl;
    else delete out.lifecycle;
  }

  if (entry.template) {
    const st = slimTemplate(entry.template);
    if (Object.keys(st).length) out.template = st;
    else delete out.template;
  }

  if (entry.responsibility) {
    const sr = slimResponsibility(entry.responsibility);
    if (Object.keys(sr).length) out.responsibility = sr;
    else delete out.responsibility;
  }

  return out as ClientComponentDetail;
}

/** Per-component drawer payload: no raw confidence / anomaly internals; slim heuristics for HTML size. */
export function buildHtmlClientComponentDetailsMap(
  map: Record<string, ComponentDetailEntry>
): Record<string, ClientComponentDetail> {
  const out: Record<string, ClientComponentDetail> = {};
  for (const k of Object.keys(map)) {
    out[k] = slimComponentDetailForHtml(map[k]!);
  }
  return out;
}

type ClientExplorerItem = Omit<
  ComponentsExplorerItem,
  "confidence" | "anomalyFlag" | "anomalyReasons"
>;

function stripExplorerItem(item: ComponentsExplorerItem): ClientExplorerItem {
  const { confidence: _c, anomalyFlag: _a, anomalyReasons: _r, ...rest } = item;
  return rest;
}

/** Explorer list: keep scoring/severity for UI; drop internal anomaly/confidence enums and raw reasons. */
export function buildHtmlClientExplorerItems(items: readonly ComponentsExplorerItem[]): ClientExplorerItem[] {
  return items.map(stripExplorerItem);
}
