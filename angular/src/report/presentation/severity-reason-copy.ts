/**
 * Maps internal severity-resolution explanations to short, user-facing notes.
 * Internal analyzer strings stay in anomalyReasons; this output is for HTML drawer and JSON.
 */

const METRICS_INCOMPLETE =
  /Warnings present but complexity metrics for this component are missing or incomplete\.?/i;

function hasNoComponentSizeBaseline(s: string): boolean {
  return /No component-size baseline\.?/i.test(s);
}

function softenBaseSeverityLine(line: string): string {
  return line
    .replace(/component-size analysis/gi, "file size and dependency analysis")
    .replace(/component-size;/gi, "file size and dependencies;")
    .replace(/from component-size\b/gi, "from file size and dependencies");
}

/**
 * Deterministic, product-safe lines for UI and public JSON.
 * Omits raw internal phrasing such as "No component-size baseline."
 */
export function mapSeverityReasonsForDisplay(reasons: readonly string[] | undefined): string[] | undefined {
  if (!reasons?.length) return undefined;

  const trimmed = reasons.map((r) => r.trim()).filter(Boolean);
  if (trimmed.length === 0) return undefined;

  const out: string[] = [];
  let handledMetricsNote = false;
  let handledBaselineFallback = false;

  for (const line of trimmed) {
    if (METRICS_INCOMPLETE.test(line)) {
      if (!handledMetricsNote) {
        out.push(
          "Rule findings are present, but size and complexity metrics are incomplete—treat this severity as advisory and confirm in context."
        );
        handledMetricsNote = true;
      }
      continue;
    }

    if (line.includes("Base severity") && /component-size|file size and dependenc/i.test(line)) {
      out.push(softenBaseSeverityLine(line));
      continue;
    }

    if (hasNoComponentSizeBaseline(line)) {
      const withoutBaseline = line.replace(/\s*No component-size baseline\.?/gi, "").trim();
      if (withoutBaseline.length > 0) {
        const softened = softenBaseSeverityLine(withoutBaseline);
        const withNote =
          softened +
          " Without file-size metrics, the level leans on rules and the aggregate risk score—verify in your codebase.";
        out.push(withNote);
      } else if (!handledBaselineFallback) {
        out.push(
          "This level reflects triggered rules and the aggregate risk score; file-size metrics did not add an independent anchor."
        );
        handledBaselineFallback = true;
      }
      continue;
    }

    out.push(softenBaseSeverityLine(line));
  }

  const deduped = [...new Set(out.map((s) => s.replace(/\s+/g, " ").trim()))].filter(Boolean);
  return deduped.length ? deduped : undefined;
}
