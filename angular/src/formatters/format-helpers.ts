import type { LifecycleWarning } from "../angular/analyzers/lifecycle/lifecycle-models";
import type { TemplateWarning } from "../angular/analyzers/template/template-models";
import type { ResponsibilityWarning } from "../angular/analyzers/responsibility/responsibility-models";

const TOP_RISKS_MAX_WARNINGS_PER_COMPONENT = 3;

export const MAX_WARNINGS_PER_RISK = TOP_RISKS_MAX_WARNINGS_PER_COMPONENT;

export function formatLifecycleWarning(warning: LifecycleWarning): string {
  return `[${warning.code}] ${warning.message} (${warning.severity}, confidence: ${warning.confidence})`;
}

export function formatTemplateWarning(warning: TemplateWarning): string {
  return `[${warning.code}] ${warning.message} (${warning.severity}, confidence: ${warning.confidence})`;
}

export function formatResponsibilityWarning(warning: ResponsibilityWarning): string {
  return `[${warning.code}] ${warning.message} (${warning.severity}, confidence: ${warning.confidence})`;
}

export function formatSeverityCounts(
  counts: Record<string, number>,
  keys: string[]
): string {
  const hasAny = keys.some((k) => (counts[k] ?? 0) > 0);
  if (!hasAny) return "No findings.";
  return keys.map((k) => `${k}: ${counts[k] ?? 0}`).join(", ");
}
