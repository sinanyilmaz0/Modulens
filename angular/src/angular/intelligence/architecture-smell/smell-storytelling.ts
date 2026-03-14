import type { ArchitectureSmellType } from "./architecture-smell-models";

export interface StorytellingContext {
  componentCount?: number;
  familyName?: string;
  avgLineCount?: number;
  evidence?: string[];
}

const SMELL_DESCRIPTIONS: Record<
  ArchitectureSmellType,
  (ctx: StorytellingContext) => string
> = {
  GOD_PAGE_SMELL: () =>
    "This page component mixes routing, data loading, orchestration and UI rendering in a single large unit.",
  PLAYER_ORCHESTRATION_SMELL: (ctx) =>
    ctx.componentCount && ctx.componentCount > 1
      ? `This family mixes playback orchestration, UI rendering and event ownership across ${ctx.componentCount} large components.`
      : "This family mixes playback orchestration, UI rendering and event ownership across multiple large components.",
  TEMPLATE_EXPLOSION_SMELL: () =>
    "Templates are deeply nested with many event handlers and method calls, making maintenance difficult.",
  CONTAINER_EXPLOSION_SMELL: () =>
    "Container components carry too many responsibilities: orchestration, state and handlers in one place.",
  REPEATED_DETAIL_PAGE_SMELL: (ctx) =>
    ctx.componentCount
      ? `Multiple detail components (${ctx.componentCount}) repeat the same layout and data-loading pattern.`
      : "Multiple detail components repeat the same layout and data-loading pattern.",
  FRAGMENT_MANAGEMENT_SMELL: (ctx) =>
    ctx.componentCount
      ? `Repeated modal/list/editor orchestration across ${ctx.componentCount} fragment management components.`
      : "Repeated modal/list/editor orchestration across fragment management components.",
  FORM_ORCHESTRATION_SMELL: () =>
    "Form builder, validation, state and routing are mixed together in form components.",
};

export function getSmellDescription(
  smellType: ArchitectureSmellType,
  ctx: StorytellingContext = {}
): string {
  const fn = SMELL_DESCRIPTIONS[smellType];
  return fn ? fn(ctx) : `Architecture smell detected: ${smellType}`;
}
