export { detectFeaturePatterns, type FeaturePatternDetectionInput } from "./feature-pattern-detector";
export type { FeaturePattern, FeaturePatternType, DuplicationRisk } from "./feature-pattern-models";
export { FEATURE_PATTERN_DEFINITIONS, type FeaturePatternDefinition } from "./feature-pattern-taxonomy";
export {
  computeSimilarity,
  computeGroupConfidence,
  SIMILARITY_THRESHOLD,
  type SimilarityCandidate,
} from "./similarity-engine";
