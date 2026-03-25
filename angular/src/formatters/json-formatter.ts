import type { Formatter } from "./types";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import { buildPublicJsonExport } from "../export/public-json-export";

export class JsonFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    return JSON.stringify(buildPublicJsonExport(snapshot), null, 2);
  }
}
