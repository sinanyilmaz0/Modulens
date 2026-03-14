import type { OutputFormat } from "./types";
import { JsonFormatter } from "./json-formatter";
import { TextFullFormatter } from "./text-full-formatter";
import { TextCompactFormatter } from "./text-compact-formatter";
import { SummaryFormatter } from "./summary-formatter";
import { HtmlReportFormatter } from "../report/html/html-report-formatter";
import type { Formatter } from "./types";

export type { OutputFormat, Formatter } from "./types";
export { JsonFormatter } from "./json-formatter";
export { TextFullFormatter } from "./text-full-formatter";
export { TextCompactFormatter } from "./text-compact-formatter";
export { SummaryFormatter } from "./summary-formatter";
export { HtmlReportFormatter } from "../report/html/html-report-formatter";

export function getFormatter(format: OutputFormat): Formatter {
  switch (format) {
    case "json":
      return new JsonFormatter();
    case "html":
      return new HtmlReportFormatter();
    case "text":
    case "full":
      return new TextFullFormatter();
    case "compact":
      return new TextCompactFormatter();
    case "summary":
      return new SummaryFormatter();
    default:
      return new TextFullFormatter();
  }
}

export function inferFormatFromOutputPath(outputPath: string): OutputFormat {
  const lower = outputPath.toLowerCase();
  if (lower.endsWith(".json")) {
    return "json";
  }
  if (lower.endsWith(".html")) {
    return "html";
  }
  return "text";
}
