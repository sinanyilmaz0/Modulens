import type { Formatter } from "../../formatters/types";
import type { AnalysisSnapshot } from "../../core/analysis-snapshot";
import { renderHtmlReport } from "./html-report-view";

export class HtmlReportFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const debug = process.env.ANGULAR_DOCTOR_DEBUG === "1";
    return renderHtmlReport(snapshot, { debug });
  }
}
