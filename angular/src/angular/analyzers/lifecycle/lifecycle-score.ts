import type { ScoreFactor } from "../../../core/scan-result";
import {
  LifecycleAnalysisContext,
  LifecycleConfidence,
  LifecycleSeverity,
  LifecycleWarning,
} from "./lifecycle-models";

const severityWeight: Record<LifecycleSeverity, number> = {
  info: 0.15,
  warning: 0.45,
  high: 1.1,
  critical: 2.2,
};

const confidenceWeight: Record<LifecycleConfidence, number> = {
  low: 0.5,
  medium: 0.8,
  high: 1,
};

function addFactor(
  factors: ScoreFactor[],
  name: string,
  weight: number,
  contribution: number,
  description: string
): void {
  if (contribution !== 0) {
    factors.push({ name, weight, contribution, description });
  }
}

export function calculateLifecycleScore(
  context: LifecycleAnalysisContext,
  warnings: LifecycleWarning[]
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let score = 10;

  if (context.hookCount >= 6) {
    score -= 0.8;
    addFactor(factors, "Hook Count", 0.1, -0.8, "Many lifecycle hooks");
  }

  if (context.hooksUsed.includes("ngDoCheck")) {
    score -= 1.2;
    addFactor(factors, "ngDoCheck", 0.15, -1.2, "ngDoCheck used");
  }

  if (
    context.hooksUsed.includes("ngAfterViewChecked") ||
    context.hooksUsed.includes("ngAfterContentChecked")
  ) {
    score -= 0.8;
    addFactor(
      factors,
      "AfterView/ContentChecked",
      0.1,
      -0.8,
      "ngAfterViewChecked or ngAfterContentChecked used"
    );
  }

  if (context.hasNgOnChanges && context.inputCount === 0) {
    score -= 0.4;
    addFactor(
      factors,
      "ngOnChanges Without Inputs",
      0.05,
      -0.4,
      "ngOnChanges with no inputs"
    );
  }

  if (context.signals.riskySubscribeCount > 0) {
    const baseSubscriptionPenalty =
      !context.hasNgOnDestroy
        ? 1 + context.signals.riskySubscribeCount * 1.2
        : 0.6 + context.signals.riskySubscribeCount * 0.7;

    const maxPenalty = !context.hasNgOnDestroy ? 3.5 : 2.5;
    const penalty = Math.min(maxPenalty, baseSubscriptionPenalty);
    score -= penalty;
    addFactor(
      factors,
      "Risky Subscriptions",
      0.25,
      -penalty,
      "Unmanaged subscriptions detected"
    );
  }

  if (context.signals.managedSubscribeCount > 0) {
    const bonus = Math.min(1.2, context.signals.managedSubscribeCount * 0.25);
    score += bonus;
    addFactor(
      factors,
      "Managed Subscriptions",
      0.1,
      bonus,
      "Properly managed subscriptions"
    );
  }

  if (context.signals.missingIntervalCleanupCount > 0) {
    const penalty = Math.min(3, context.signals.missingIntervalCleanupCount * 1.5);
    score -= penalty;
    addFactor(
      factors,
      "Missing Interval Cleanup",
      0.2,
      -penalty,
      "setInterval without clearInterval"
    );
  }

  if (context.signals.missingEventListenerCleanupCount > 0) {
    const penalty = Math.min(2.5, context.signals.missingEventListenerCleanupCount * 1.3);
    score -= penalty;
    addFactor(
      factors,
      "Missing Listener Cleanup",
      0.2,
      -penalty,
      "addEventListener without removeEventListener"
    );
  }

  if (context.signals.missingTimeoutCleanupCount > 0) {
    const penalty = Math.min(1.2, context.signals.missingTimeoutCleanupCount * 0.4);
    score -= penalty;
    addFactor(
      factors,
      "Missing Timeout Cleanup",
      0.1,
      -penalty,
      "setTimeout without clearTimeout"
    );
  }

  if (context.signals.missingRendererListenCleanupCount > 0) {
    const penalty = Math.min(2.5, context.signals.missingRendererListenCleanupCount * 1.3);
    score -= penalty;
    addFactor(
      factors,
      "Missing Renderer Listen Cleanup",
      0.2,
      -penalty,
      "Renderer.listen without cleanup"
    );
  }

  if (context.signals.verifiedCleanupCount > 0) {
    const bonus = Math.min(1.5, context.signals.verifiedCleanupCount * 0.2);
    score += bonus;
    addFactor(
      factors,
      "Verified Cleanup",
      0.1,
      bonus,
      "Proper cleanup verified"
    );
  }

  const weightedWarningPenalty = warnings.reduce((total, warning) => {
    return total + severityWeight[warning.severity] * confidenceWeight[warning.confidence];
  }, 0);

  const rulePenalty = Math.min(3.5, weightedWarningPenalty * 0.35);
  score -= rulePenalty;
  if (rulePenalty > 0) {
    addFactor(factors, "Rule Warnings", 0.35, -rulePenalty, "Lifecycle rule violations");
  }

  let volumePenalty = 0;
  if (warnings.length >= 7) {
    volumePenalty = 1.2;
    score -= 1.2;
  } else if (warnings.length >= 4) {
    volumePenalty = 0.8;
    score -= 0.8;
  }
  if (volumePenalty > 0) {
    addFactor(factors, "Warning Volume", 0.15, -volumePenalty, "Many warnings");
  }

  const clampedScore = Math.min(10, Math.max(0, score));
  return {
    score: Number(clampedScore.toFixed(1)),
    factors,
  };
}

export function getLifecycleRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 4.5) {
    return "High";
  }

  if (score < 8) {
    return "Medium";
  }

  return "Low";
}
