/**
 * Embedded CSS for HTML report.
 * Uses CSS variables for theming; can be extracted to CSS module for React later.
 */
import { REPORT_STYLES_TOKENS_AND_BASE } from "./styles/tokens-and-base";
import { REPORT_STYLES_DASHBOARD_LAYOUT } from "./styles/dashboard-layout";
import { REPORT_STYLES_OVERVIEW_METRICS } from "./styles/overview-metrics";
import { REPORT_STYLES_OVERVIEW_PATTERNS } from "./styles/overview-patterns";
import { REPORT_STYLES_COMPONENT_EXPLORER } from "./styles/component-explorer";
import { REPORT_STYLES_PLANNER_AND_RULES } from "./styles/planner-and-rules";
import { REPORT_STYLES_STRUCTURE_AND_MODAL } from "./styles/structure-and-modal";
import { REPORT_STYLES_PATTERNS_DRAWER } from "./styles/patterns-drawer";

export const REPORT_STYLES = [
  REPORT_STYLES_TOKENS_AND_BASE,
  REPORT_STYLES_DASHBOARD_LAYOUT,
  REPORT_STYLES_OVERVIEW_METRICS,
  REPORT_STYLES_OVERVIEW_PATTERNS,
  REPORT_STYLES_COMPONENT_EXPLORER,
  REPORT_STYLES_PLANNER_AND_RULES,
  REPORT_STYLES_STRUCTURE_AND_MODAL,
  REPORT_STYLES_PATTERNS_DRAWER,
].join("\n");
