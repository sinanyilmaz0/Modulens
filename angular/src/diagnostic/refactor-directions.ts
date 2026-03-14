import type { DominantIssueType } from "./diagnostic-models";

export const REFACTOR_DIRECTIONS: Record<DominantIssueType, string> = {
  TEMPLATE_HEAVY_COMPONENT:
    "Move template logic into child components or pipes; split large template into smaller blocks.",
  GOD_COMPONENT:
    "Split presentation and orchestration; extract form logic; isolate event handlers.",
  CLEANUP_RISK_COMPONENT:
    "Add ngOnDestroy cleanup; use takeUntilDestroyed for subscriptions; store and clear timer/listener handles.",
  ORCHESTRATION_HEAVY_COMPONENT:
    "Split into thin container (orchestration) and presentation components; extract form/router logic.",
  LIFECYCLE_RISKY_COMPONENT:
    "Move heavy logic out of lifecycle hooks; consider OnPush; avoid ngDoCheck/checked hooks.",
};
