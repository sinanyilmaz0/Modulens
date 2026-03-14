import type { RefactorPhase } from "./refactor-plan-models";
import type { PlannerPhaseFacts } from "./refactor-planner";

export type PhaseBucket = "foundation" | "crossCutting";

export interface WorkspaceSequencingState {
  hasPhase1Or2Targets: boolean;
  startingPhase?: 1 | 2 | 3;
}

export function getPhaseBucket(phase: RefactorPhase): PhaseBucket {
  if (phase === 1 || phase === 2) return "foundation";
  return "crossCutting";
}

export function buildWorkspaceSequencingState(
  facts: PlannerPhaseFacts
): WorkspaceSequencingState {
  const hasPhase1Or2Targets = facts.hasPhase1Targets || facts.hasPhase2Targets;
  return {
    hasPhase1Or2Targets,
    startingPhase: facts.suggestedPhase,
  };
}

export function buildTargetSequencingCopy(
  phase: RefactorPhase | undefined,
  state: WorkspaceSequencingState | undefined
): string | undefined {
  if (!phase || !state) return undefined;
  const bucket = getPhaseBucket(phase);
  const { hasPhase1Or2Targets, startingPhase } = state;

  if (bucket === "foundation") {
    if (hasPhase1Or2Targets) {
      return "Lays the foundation for later cross-cutting and architectural changes.";
    }
    return "Local refactor with low coordination; safe to run in parallel with cross-cutting work.";
  }

  const hasEarlyPhasesRecommended =
    hasPhase1Or2Targets && (startingPhase === 1 || startingPhase === 2);

  if (!hasEarlyPhasesRecommended) {
    return "Cross-cutting work that is safe to start now — no Phase 1–2 blockers were detected in this workspace.";
  }

  return "Best tackled after you stabilize key Phase 1–2 component fixes, so shared changes rest on a reliable base.";
}

export function buildExtractionSequencingCopy(
  state: WorkspaceSequencingState | undefined
): string | undefined {
  if (!state) return undefined;
  const { hasPhase1Or2Targets, startingPhase } = state;
  const hasEarlyPhasesRecommended =
    hasPhase1Or2Targets && (startingPhase === 1 || startingPhase === 2);

  if (!hasEarlyPhasesRecommended) {
    return "You can extract this shared logic now; there are no earlier Phase 1–2 refactors in the way.";
  }

  return "Plan this extraction after completing key Phase 1–2 refactors, so shared abstractions reflect your stabilized design.";
}

export function buildDetailsSequencingCopy(
  phase: RefactorPhase | undefined,
  state: WorkspaceSequencingState | undefined
): string | undefined {
  if (!phase || !state) return undefined;
  const bucket = getPhaseBucket(phase);
  const { hasPhase1Or2Targets, startingPhase } = state;
  const hasEarlyPhasesRecommended =
    hasPhase1Or2Targets && (startingPhase === 1 || startingPhase === 2);

  if (bucket === "foundation") {
    if (hasEarlyPhasesRecommended) {
      return "Early-phase foundation work that unblocks later cross-cutting refactors.";
    }
    return "Foundation work that can move in parallel with cross-cutting changes.";
  }

  if (!hasEarlyPhasesRecommended) {
    return "Phase 3 cross-cutting refactor that is safe to start early — Modulens did not detect any Phase 1–2 blockers.";
  }

  return "Phase 3 cross-cutting refactor designed to follow Phase 1–2 clean-up, so shared changes land on a stable base.";
}

