import type { ScanResult } from "../core/scan-result";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";

export type OutputFormat = "json" | "text" | "full" | "compact" | "summary" | "html";

export interface Formatter {
  format(snapshot: AnalysisSnapshot): string;
}
