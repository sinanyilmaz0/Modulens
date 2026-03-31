export type CanonicalSeverityCode = "CRITICAL" | "HIGH" | "WARNING" | "LOW";

export function normalizeSeverityCode(raw: string | undefined | null): CanonicalSeverityCode {
  if (!raw) return "LOW";
  const s = raw.toUpperCase();
  if (s === "CRITICAL") return "CRITICAL";
  if (s === "HIGH") return "HIGH";
  if (s === "WARNING") return "WARNING";
  if (s === "LOW") return "LOW";
  if (s === "INFO") return "LOW";
  return "LOW";
}

export function toCanonicalSeverityOrNull(raw: string | undefined | null): CanonicalSeverityCode | null {
  if (!raw) return null;
  const s = raw.toUpperCase();
  if (s === "CRITICAL") return "CRITICAL";
  if (s === "HIGH") return "HIGH";
  if (s === "WARNING") return "WARNING";
  if (s === "LOW") return "LOW";
  if (s === "INFO") return "LOW";
  return null;
}

export function severityCodeToClass(sev: CanonicalSeverityCode): "critical" | "high" | "warning" | "low" {
  return sev.toLowerCase() as "critical" | "high" | "warning" | "low";
}
