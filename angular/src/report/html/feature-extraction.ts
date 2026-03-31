/**
 * Feature extraction helpers for Hot Feature Clusters and adaptive breakdown modes.
 * Infers feature area from file path; supports impact-aware grouping and normalization.
 */

export type {
  FeatureBreakdownItem,
  ComponentWithAnalyses,
  FeatureBreakdownResult,
  ComponentSummaryInput,
  RuleGroup,
} from "./feature-extraction/feature-extraction-types";

export {
  formatAreaLabelForDisplay,
  normalizeFeatureName,
  inferFeatureFromPath,
  inferFeatureFromClassName,
} from "./feature-extraction/feature-inference";

export { getFeatureBreakdownItems } from "./feature-extraction/feature-breakdown";

export { deriveComponentSummaryLine, deriveDominantAction } from "./feature-extraction/component-summary";
