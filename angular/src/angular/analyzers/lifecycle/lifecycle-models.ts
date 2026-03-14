export type LifecycleSeverity = "info" | "warning" | "high" | "critical";
export type LifecycleConfidence = "low" | "medium" | "high";

export type LifecycleHookName =
  | "ngOnInit"
  | "ngOnChanges"
  | "ngOnDestroy"
  | "ngAfterViewInit"
  | "ngAfterViewChecked"
  | "ngAfterContentInit"
  | "ngAfterContentChecked"
  | "ngDoCheck";

export const LIFECYCLE_HOOKS: LifecycleHookName[] = [
  "ngOnInit",
  "ngOnChanges",
  "ngOnDestroy",
  "ngAfterViewInit",
  "ngAfterViewChecked",
  "ngAfterContentInit",
  "ngAfterContentChecked",
  "ngDoCheck",
];

export interface LifecycleWarning {
  code: string;
  severity: LifecycleSeverity;
  confidence: LifecycleConfidence;
  message: string;
  recommendation: string;
}

export interface LifecycleDetectionSignals {
  subscribeCount: number;
  managedSubscribeCount: number;
  riskySubscribeCount: number;
  longLivedRiskyCount: number;
  intervalFromEventRiskyCount: number;
  shortLivedRiskyCount: number;
  unknownRiskyCount: number;
  completionGuaranteedSubscribeCount: number;
  httpLikeSubscribeCount: number;
  takeUntilPairedWithSubscribeCount: number;
  subscriptionAssignedCount: number;
  subscriptionInCompositeCount: number;
  hasUnsubscribe: boolean;
  hasTakeUntil: boolean;
  hasTakeUntilDestroyed: boolean;
  hasTakeOneLikeOperator: boolean;
  hasDestroySignal: boolean;
  destroySignalUsedInTakeUntil: boolean;
  unsubscribeInOnDestroy: boolean;
  setIntervalCount: number;
  clearIntervalCount: number;
  setTimeoutCount: number;
  clearTimeoutCount: number;
  addEventListenerCount: number;
  removeEventListenerCount: number;
  rendererListenCount: number;
  rendererListenCleanupCount: number;
  hasHostListener: boolean;
  listenerPairingMatchCount: number;
  listenerUnmatchedAddCount: number;
  timerIdStoredCount: number;
  timerIdClearedCount: number;
  recursiveSetTimeoutCount: number;
  missingIntervalCleanupCount: number;
  missingTimeoutCleanupCount: number;
  missingEventListenerCleanupCount: number;
  missingRendererListenCleanupCount: number;
  verifiedCleanupCount: number;
}

export interface LifecycleAnalysisContext {
  filePath: string;
  fileName: string;
  className: string;
  targetType: "component" | "directive" | "unknown";
  hooksUsed: LifecycleHookName[];
  hookCount: number;
  inputCount: number;
  hasNgOnChanges: boolean;
  hasNgOnDestroy: boolean;
  isNgOnDestroyEmpty: boolean;
  afterViewInitStatementCount: number;
  signals: LifecycleDetectionSignals;
}

import type { ExplainedScore } from "../../../core/scan-result";

export interface LifecycleAnalysisResult extends LifecycleAnalysisContext {
  warnings: LifecycleWarning[];
  score: number;
  explainedScore?: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  highestSeverity?: LifecycleSeverity;
}

export interface LifecycleSummary {
  totalTargets: number;
  averageScore: number;
  explainedScore: ExplainedScore;
  riskLevel: "Low" | "Medium" | "High";
  totalWarnings: number;
  componentsWithWarnings: number;
  severityCounts: Record<LifecycleSeverity, number>;
  confidenceCounts: Record<LifecycleConfidence, number>;
  manualReviewCount: number;
  highConfidenceWarningCount: number;
  hookUsageCounts: Record<LifecycleHookName, number>;
}
