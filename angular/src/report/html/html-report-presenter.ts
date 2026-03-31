/**
 * HTML report presenter: paths, severity, component maps, sections, and labels.
 * Split across presenter-*.ts modules; this file re-exports the public API.
 */

export { normalizePath, getComponentDetailEntry } from "./presenter-paths";
export {
  type CanonicalSeverityCode,
  normalizeSeverityCode,
  toCanonicalSeverityOrNull,
  severityCodeToClass,
} from "./presenter-severity";
export {
  type ComponentDetailEntry,
  type ComponentsExplorerItem,
  buildComponentDetailsMap,
  buildComponentsExplorerItems,
} from "./presenter-component-map";
export { type SectionData, prepareSections } from "./presenter-sections";
export {
  NO_DOMINANT_ISSUE_SENTINEL,
  formatDominantIssue,
  isNoDominantIssue,
  formatSmellType,
  formatFamilyName,
  formatFeaturePattern,
  getDominantIssueExplanation,
} from "./presenter-labels";
