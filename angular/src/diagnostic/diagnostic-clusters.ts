import type { DiagnosticCluster } from "./diagnostic-models";

/**
 * Maps warning codes (from component, lifecycle, template, responsibility analyzers)
 * to diagnostic clusters for consolidation.
 *
 * IMPORTANT: When adding new warning codes to any analyzer, update this mapping.
 * Unmapped codes will not contribute to cluster scores or dominant issue classification.
 */
export const CODE_TO_CLUSTER: Record<string, DiagnosticCluster> = {
  // Component analyzer
  "component-size": "template_heavy",
  "constructor-dependencies": "god_component",

  // Template analyzer
  LARGE_TEMPLATE: "template_heavy",
  TEMPLATE_METHOD_CALL: "template_heavy",
  HIGH_TEMPLATE_BINDING_DENSITY: "template_heavy",
  DEEP_STRUCTURAL_NESTING: "template_heavy",
  NGFOR_WITHOUT_TRACKBY: "template_heavy",
  LONG_INLINE_TEMPLATE_EXPRESSION: "template_heavy",
  EVENT_BINDING_HEAVY_TEMPLATE: "template_heavy",

  // Lifecycle analyzer - cleanup risk
  SUBSCRIPTION_WITHOUT_DESTROY: "cleanup_risk",
  EMPTY_NG_ON_DESTROY: "cleanup_risk",
  INTERVAL_WITHOUT_CLEANUP: "cleanup_risk",
  LISTENER_WITHOUT_CLEANUP: "cleanup_risk",
  RENDERER_LISTEN_WITHOUT_DISPOSE: "cleanup_risk",
  TIMEOUT_REQUIRES_REVIEW: "cleanup_risk",
  CLEANUP_OWNERSHIP_UNCLEAR: "cleanup_risk",

  // Lifecycle analyzer - lifecycle risky (hooks, not cleanup)
  NG_ON_CHANGES_WITHOUT_INPUT: "lifecycle_risky",
  RISKY_HOOK_USAGE: "lifecycle_risky",
  DOCHECK_USAGE: "lifecycle_risky",
  TOO_MANY_LIFECYCLE_HOOKS: "lifecycle_risky",
  HEAVY_AFTER_VIEW_INIT: "lifecycle_risky",

  // Responsibility analyzer
  GOD_COMPONENT_SMELL: "god_component",
  EXCESSIVE_LOCAL_STATE: "god_component",
  TOO_MANY_PUBLIC_HANDLERS: "god_component",
  UI_STATE_HEAVY_COMPONENT: "god_component",

  // Responsibility analyzer - orchestration
  HEAVY_FORM_ORCHESTRATION: "orchestration_heavy",
  MIXED_PRESENTATION_AND_ORCHESTRATION: "orchestration_heavy",
  NAVIGATION_AND_DATA_LOADING_COUPLED: "orchestration_heavy",
};

export const CLUSTER_TO_DOMINANT_ISSUE: Record<
  DiagnosticCluster,
  "TEMPLATE_HEAVY_COMPONENT" | "GOD_COMPONENT" | "CLEANUP_RISK_COMPONENT" | "ORCHESTRATION_HEAVY_COMPONENT" | "LIFECYCLE_RISKY_COMPONENT"
> = {
  template_heavy: "TEMPLATE_HEAVY_COMPONENT",
  god_component: "GOD_COMPONENT",
  cleanup_risk: "CLEANUP_RISK_COMPONENT",
  orchestration_heavy: "ORCHESTRATION_HEAVY_COMPONENT",
  lifecycle_risky: "LIFECYCLE_RISKY_COMPONENT",
};

export const DOMINANT_ISSUE_PRIORITY: Record<string, number> = {
  CLEANUP_RISK_COMPONENT: 5,
  GOD_COMPONENT: 4,
  TEMPLATE_HEAVY_COMPONENT: 3,
  ORCHESTRATION_HEAVY_COMPONENT: 2,
  LIFECYCLE_RISKY_COMPONENT: 1,
};

/** Internal/snake_case labels (legacy) */
export const DOMINANT_ISSUE_TO_LABEL: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "template_heavy",
  GOD_COMPONENT: "god_component",
  CLEANUP_RISK_COMPONENT: "cleanup_risk",
  ORCHESTRATION_HEAVY_COMPONENT: "orchestration_heavy",
  LIFECYCLE_RISKY_COMPONENT: "lifecycle_risky",
};

/** Human-readable labels for UI (English) */
export const DOMINANT_ISSUE_TO_LABEL_EN: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Template Too Complex",
  GOD_COMPONENT: "Too Many Responsibilities",
  CLEANUP_RISK_COMPONENT: "Cleanup / Memory Risk",
  ORCHESTRATION_HEAVY_COMPONENT: "Heavy Service Orchestration",
  LIFECYCLE_RISKY_COMPONENT: "Lifecycle Risky",
};
