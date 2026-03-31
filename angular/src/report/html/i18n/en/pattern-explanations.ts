import type { Translations } from "../translations";

export const enPatternExplanations: Pick<Translations, "patternExplanations"> = {
  patternExplanations: {
    TEMPLATE_HEAVY_COMPONENT: {
      meaning: "Components with 150+ template lines or 4+ structural directive nesting levels.",
      whyItMatters: "Large templates are hard to maintain, obscure structure, and often hide business logic. They hurt change detection and testability.",
      refactorStrategy: "Split template into smaller components; Extract pipes; Reduce nesting",
    },
    GOD_COMPONENT: {
      meaning: "Components that handle too many responsibilities and orchestrate too many concerns.",
      whyItMatters: "God components violate single responsibility, become maintenance bottlenecks, and are hard to test in isolation.",
      refactorStrategy: "Split presentation and orchestration; Extract form logic; Isolate event handlers",
    },
    CLEANUP_RISK_COMPONENT: {
      meaning: "Components with subscriptions or listeners that may not be properly cleaned up.",
      whyItMatters: "Unmanaged subscriptions and listeners cause memory leaks and unexpected behavior. They can leak across route changes.",
      refactorStrategy: "Add ngOnDestroy cleanup; Use takeUntilDestroyed for subscriptions; Store and clear timer/listener handles",
    },
    ORCHESTRATION_HEAVY_COMPONENT: {
      meaning: "Components that coordinate too many services and orchestrate heavy logic.",
      whyItMatters: "Heavy orchestration in components makes testing difficult and couples UI to business logic. Extracting to services improves testability.",
      refactorStrategy: "Split into thin container and presentation components; Extract form/router logic to dedicated services",
    },
    LIFECYCLE_RISKY_COMPONENT: {
      meaning: "Components with risky lifecycle hook usage or heavy logic in hooks.",
      whyItMatters: "Heavy logic in lifecycle hooks causes performance issues and unexpected behavior. Hooks run frequently; keep them lightweight.",
      refactorStrategy: "Move heavy logic out of lifecycle hooks; Consider OnPush; Avoid ngDoCheck/checked hooks",
    },
  },
};
