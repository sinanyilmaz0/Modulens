import {
  LifecycleAnalysisContext,
  LifecycleWarning,
} from "./lifecycle-models";

interface LifecycleRule {
  code: string;
  evaluate: (context: LifecycleAnalysisContext) => LifecycleWarning | undefined;
}

const lifecycleRules: LifecycleRule[] = [
  {
    code: "NG_ON_CHANGES_WITHOUT_INPUT",
    evaluate: (context) => {
      if (!context.hasNgOnChanges || context.inputCount > 0) {
        return undefined;
      }

      return {
        code: "NG_ON_CHANGES_WITHOUT_INPUT",
        severity: "info",
        confidence: "low",
        message: "ngOnChanges is implemented but no local @Input/input() usage was detected.",
        recommendation: "Confirm inputs are not inherited from a base class, then remove ngOnChanges if unnecessary.",
      };
    },
  },
  {
    code: "RISKY_HOOK_USAGE",
    evaluate: (context) => {
      const riskyHooks = context.hooksUsed.filter(
        (hook) => hook === "ngAfterViewChecked" || hook === "ngAfterContentChecked"
      );

      if (riskyHooks.length === 0) {
        return undefined;
      }

      return {
        code: "RISKY_HOOK_USAGE",
        severity: "warning",
        confidence: "medium",
        message: `Checked lifecycle hooks detected: ${riskyHooks.join(", ")}.`,
        recommendation: "Keep checked hooks only when necessary and validate change-detection cost.",
      };
    },
  },
  {
    code: "DOCHECK_USAGE",
    evaluate: (context) => {
      if (!context.hooksUsed.includes("ngDoCheck")) {
        return undefined;
      }

      return {
        code: "DOCHECK_USAGE",
        severity: "warning",
        confidence: "medium",
        message: "ngDoCheck usage detected.",
        recommendation: "Verify this hook is required and uses a narrow, efficient custom check.",
      };
    },
  },
  {
    code: "SUBSCRIPTION_WITHOUT_DESTROY",
    evaluate: (context) => {
      const {
        riskySubscribeCount,
        longLivedRiskyCount,
        intervalFromEventRiskyCount,
        shortLivedRiskyCount,
        unknownRiskyCount,
        subscriptionAssignedCount,
        subscriptionInCompositeCount,
      } = context.signals;

      if (riskySubscribeCount === 0) {
        return undefined;
      }

      const hasStrongCleanupSignal =
        context.signals.unsubscribeInOnDestroy ||
        context.signals.hasTakeUntilDestroyed ||
        context.signals.takeUntilPairedWithSubscribeCount > 0 ||
        context.signals.destroySignalUsedInTakeUntil;

      const hasSubscriptionOwnership =
        subscriptionAssignedCount > 0 || subscriptionInCompositeCount > 0;

      if (!context.hasNgOnDestroy && !hasStrongCleanupSignal) {
        if (intervalFromEventRiskyCount >= 1) {
          return {
            code: "SUBSCRIPTION_WITHOUT_DESTROY",
            severity: "critical",
            confidence: "high",
            message: `${intervalFromEventRiskyCount} interval/fromEvent subscription(s) appear unmanaged and ngOnDestroy is missing.`,
            recommendation:
              "Add ngOnDestroy cleanup or use takeUntil/takeUntilDestroyed for event/timer streams.",
          };
        }

        if (longLivedRiskyCount >= 1) {
          const routeFormStore = longLivedRiskyCount;
          return {
            code: "SUBSCRIPTION_WITHOUT_DESTROY",
            severity: "high",
            confidence: "high",
            message: `${longLivedRiskyCount} likely long-lived subscription(s) (route/form/store) without cleanup.`,
            recommendation:
              "Add ngOnDestroy cleanup or move subscriptions to takeUntil/takeUntilDestroyed-safe chains.",
          };
        }

        if (unknownRiskyCount >= 1 && shortLivedRiskyCount === 0) {
          return {
            code: "SUBSCRIPTION_WITHOUT_DESTROY",
            severity: "warning",
            confidence: "medium",
            message: `${unknownRiskyCount} subscription(s) may require manual cleanup review.`,
            recommendation:
              "Verify each subscribe() path and ensure cleanup in ngOnDestroy or completion guarantees.",
          };
        }

        if (shortLivedRiskyCount >= 1 && longLivedRiskyCount === 0 && unknownRiskyCount === 0) {
          return {
            code: "SUBSCRIPTION_WITHOUT_DESTROY",
            severity: "info",
            confidence: "low",
            message: `${shortLivedRiskyCount} HTTP or completion-guaranteed subscription(s) without explicit takeUntil (low risk).`,
            recommendation:
              "Consider adding takeUntilDestroyed for consistency; HTTP/take(1) chains typically complete on their own.",
          };
        }

        return {
          code: "SUBSCRIPTION_WITHOUT_DESTROY",
          severity: "warning",
          confidence: "medium",
          message: `${riskySubscribeCount} subscribe() call(s) appear unmanaged and ngOnDestroy is missing.`,
          recommendation:
            "Add ngOnDestroy cleanup or move subscriptions to takeUntil/takeUntilDestroyed-safe chains.",
        };
      }

      if (!hasStrongCleanupSignal) {
        const message = hasSubscriptionOwnership
          ? `${riskySubscribeCount} subscription(s) assigned or in composite; verify cleanup in ngOnDestroy.`
          : `${riskySubscribeCount} subscription(s) may require explicit cleanup review.`;

        return {
          code: "SUBSCRIPTION_WITHOUT_DESTROY",
          severity: "warning",
          confidence: "low",
          message,
          recommendation:
            "Check each subscribe() path and verify cleanup in ngOnDestroy or completion guarantees.",
        };
      }

      return undefined;
    },
  },
  {
    code: "EMPTY_NG_ON_DESTROY",
    evaluate: (context) => {
      if (!context.hasNgOnDestroy || !context.isNgOnDestroyEmpty) {
        return undefined;
      }

      const hasResourceSignals =
        context.signals.subscribeCount > 0 ||
        context.signals.setIntervalCount > 0 ||
        context.signals.setTimeoutCount > 0 ||
        context.signals.addEventListenerCount > 0 ||
        context.signals.rendererListenCount > 0;

      if (hasResourceSignals) {
        return {
          code: "EMPTY_NG_ON_DESTROY",
          severity: "warning",
          confidence: "medium",
          message: "ngOnDestroy is present but empty while resource usage was detected.",
          recommendation: "Add cleanup logic or prove resources are auto-completing and externally managed.",
        };
      }

      return {
        code: "EMPTY_NG_ON_DESTROY",
        severity: "info",
        confidence: "low",
        message: "ngOnDestroy is present but currently empty.",
        recommendation: "Remove the hook if it is intentionally unused.",
      };
    },
  },
  {
    code: "INTERVAL_WITHOUT_CLEANUP",
    evaluate: (context) => {
      if (context.signals.missingIntervalCleanupCount === 0) {
        return undefined;
      }
      return {
        code: "INTERVAL_WITHOUT_CLEANUP",
        severity: "high",
        confidence: "high",
        message: `${context.signals.missingIntervalCleanupCount} interval handle(s) may escape teardown cleanup.`,
        recommendation:
          "Store setInterval return value and call clearInterval in ngOnDestroy.",
      };
    },
  },
  {
    code: "LISTENER_WITHOUT_CLEANUP",
    evaluate: (context) => {
      const unmatched = context.signals.listenerUnmatchedAddCount;
      if (unmatched === 0 && context.signals.missingEventListenerCleanupCount === 0) {
        return undefined;
      }
      const count = Math.max(unmatched, context.signals.missingEventListenerCleanupCount);
      return {
        code: "LISTENER_WITHOUT_CLEANUP",
        severity: "high",
        confidence: "high",
        message: `${count} DOM listener registration(s) appear unmatched.`,
        recommendation:
          "Call removeEventListener with the same target, event, and handler in ngOnDestroy.",
      };
    },
  },
  {
    code: "TIMEOUT_REQUIRES_REVIEW",
    evaluate: (context) => {
      if (context.signals.missingTimeoutCleanupCount === 0) {
        return undefined;
      }
      const recursiveCount = context.signals.recursiveSetTimeoutCount;
      const ownershipUnclear =
        context.signals.setTimeoutCount > 0 &&
        context.signals.timerIdStoredCount < context.signals.setTimeoutCount;

      let severity: "warning" | "high" = "warning";
      let confidence: "low" | "medium" | "high" = "medium";
      if (recursiveCount > 0 || context.signals.missingTimeoutCleanupCount >= 3) {
        severity = "high";
        confidence = "high";
      } else if (ownershipUnclear) {
        confidence = "low";
      }

      return {
        code: "TIMEOUT_REQUIRES_REVIEW",
        severity,
        confidence,
        message: `${context.signals.missingTimeoutCleanupCount} timeout handle(s) may escape teardown cleanup.`,
        recommendation:
          "Store setTimeout return value and call clearTimeout in ngOnDestroy; verify recursive timeout chains.",
      };
    },
  },
  {
    code: "RENDERER_LISTEN_WITHOUT_DISPOSE",
    evaluate: (context) => {
      if (context.signals.missingRendererListenCleanupCount === 0) {
        return undefined;
      }
      return {
        code: "RENDERER_LISTEN_WITHOUT_DISPOSE",
        severity: "high",
        confidence: "high",
        message: `${context.signals.missingRendererListenCleanupCount} Renderer2.listen() call(s) without dispose.`,
        recommendation:
          "Store the returned cleanup function and invoke it in ngOnDestroy.",
      };
    },
  },
  {
    code: "CLEANUP_OWNERSHIP_UNCLEAR",
    evaluate: (context) => {
      const hasTimers =
        context.signals.setIntervalCount > 0 ||
        context.signals.setTimeoutCount > 0;
      const hasListeners =
        context.signals.addEventListenerCount > 0 || context.signals.rendererListenCount > 0;
      const ownershipUnclear =
        hasTimers &&
        context.signals.timerIdStoredCount === 0 &&
        context.signals.timerIdClearedCount === 0;
      const listenerOwnershipUnclear =
        hasListeners &&
        context.signals.listenerPairingMatchCount === 0 &&
        context.signals.listenerUnmatchedAddCount > 0;

      if (!ownershipUnclear && !listenerOwnershipUnclear) {
        return undefined;
      }
      if (
        context.signals.missingIntervalCleanupCount > 0 ||
        context.signals.missingEventListenerCleanupCount > 0 ||
        context.signals.missingTimeoutCleanupCount > 0 ||
        context.signals.missingRendererListenCleanupCount > 0
      ) {
        return undefined;
      }

      return {
        code: "CLEANUP_OWNERSHIP_UNCLEAR",
        severity: "warning",
        confidence: "low",
        message: "Timer/listener ownership unclear; verify cleanup in ngOnDestroy.",
        recommendation:
          "Ensure timer IDs and listener references are stored and released on teardown.",
      };
    },
  },
  {
    code: "TOO_MANY_LIFECYCLE_HOOKS",
    evaluate: (context) => {
      if (context.hookCount < 6 || !hasComplexityPressure(context)) {
        return undefined;
      }

      return {
        code: "TOO_MANY_LIFECYCLE_HOOKS",
        severity: "warning",
        confidence: "medium",
        message: `Class uses ${context.hookCount} lifecycle hooks with additional risk signals.`,
        recommendation: "Split responsibilities or move heavy lifecycle behavior into dedicated services.",
      };
    },
  },
  {
    code: "HEAVY_AFTER_VIEW_INIT",
    evaluate: (context) => {
      const hasAfterViewInit = context.hooksUsed.includes("ngAfterViewInit");

      if (!hasAfterViewInit || context.afterViewInitStatementCount < 12) {
        return undefined;
      }

      const isVeryHeavy = context.afterViewInitStatementCount >= 20;

      return {
        code: "HEAVY_AFTER_VIEW_INIT",
        severity: isVeryHeavy ? "warning" : "info",
        confidence: isVeryHeavy ? "medium" : "low",
        message: `ngAfterViewInit contains ${context.afterViewInitStatementCount} top-level statements.`,
        recommendation: "Consider moving heavy setup to helper methods/services and keep hook logic focused.",
      };
    },
  },
];

export function evaluateLifecycleRules(
  context: LifecycleAnalysisContext
): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];

  for (const rule of lifecycleRules) {
    const warning = rule.evaluate(context);

    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}

function hasComplexityPressure(context: LifecycleAnalysisContext): boolean {
  return (
    context.hooksUsed.includes("ngDoCheck") ||
    context.hooksUsed.includes("ngAfterViewChecked") ||
    context.hooksUsed.includes("ngAfterContentChecked") ||
    context.signals.riskySubscribeCount > 0 ||
    context.signals.missingIntervalCleanupCount > 0 ||
    context.signals.missingEventListenerCleanupCount > 0 ||
    context.signals.missingRendererListenCleanupCount > 0
  );
}
