export {
  computeDecompositionSuggestions,
  type DecompositionEngineInput,
} from "./decomposition-engine";
export type {
  DecompositionSuggestion,
  FocusedDecompositionSuggestion,
  DecompositionPlannerConfig,
  HeuristicExtraction,
} from "./decomposition-models";
export {
  DEFAULT_DECOMPOSITION_PLANNER_CONFIG,
} from "./decomposition-models";
export { formatDecompositionBlueprint } from "./decomposition-blueprint";
export { generateComponentName } from "./decomposition-naming";
