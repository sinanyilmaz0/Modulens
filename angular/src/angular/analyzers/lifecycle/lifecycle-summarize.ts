import type { ExplainedScore, ScoreFactor } from "../../../core/scan-result";
import {
  LIFECYCLE_HOOKS,
  type LifecycleAnalysisResult,
  type LifecycleConfidence,
  type LifecycleHookName,
  type LifecycleSeverity,
  type LifecycleSummary,
} from "./lifecycle-models";
import { getLifecycleRiskLevel } from "./lifecycle-score";

function getLifecycleFactorDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Hook Count": "Many lifecycle hooks",
    "ngDoCheck": "ngDoCheck used",
    "AfterView/ContentChecked": "ngAfterViewChecked or ngAfterContentChecked used",
    "ngOnChanges Without Inputs": "ngOnChanges with no inputs",
    "Risky Subscriptions": "Unmanaged subscriptions detected",
    "Managed Subscriptions": "Properly managed subscriptions",
    "Missing Interval Cleanup": "setInterval without clearInterval",
    "Missing Listener Cleanup": "addEventListener without removeEventListener",
    "Missing Timeout Cleanup": "setTimeout without clearTimeout",
    "Missing Renderer Listen Cleanup": "Renderer.listen without cleanup",
    "Verified Cleanup": "Proper cleanup verified",
    "Rule Warnings": "Lifecycle rule violations",
    "Warning Volume": "Many warnings",
    "Warning Density": "High warning density across workspace",
  };
  return descriptions[name] ?? name;
}

function createEmptyHookUsageCount(): Record<LifecycleHookName, number> {
  return LIFECYCLE_HOOKS.reduce((counts, hook) => {
    counts[hook] = 0;
    return counts;
  }, {} as Record<LifecycleHookName, number>);
}

export function summarizeLifecycleResults(
  results: LifecycleAnalysisResult[]
): LifecycleSummary {
  const emptyHookCounts = createEmptyHookUsageCount();

  if (results.length === 0) {
    return {
      totalTargets: 0,
      averageScore: 10,
      explainedScore: { score: 10, factors: [] },
      riskLevel: "Low",
      totalWarnings: 0,
      componentsWithWarnings: 0,
      severityCounts: {
        info: 0,
        warning: 0,
        high: 0,
        critical: 0,
      },
      confidenceCounts: {
        low: 0,
        medium: 0,
        high: 0,
      },
      manualReviewCount: 0,
      highConfidenceWarningCount: 0,
      hookUsageCounts: emptyHookCounts,
    };
  }

  const severityCounts: Record<LifecycleSeverity, number> = {
    info: 0,
    warning: 0,
    high: 0,
    critical: 0,
  };

  const confidenceCounts: Record<LifecycleConfidence, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  const hookUsageCounts = createEmptyHookUsageCount();

  let scoreTotal = 0;
  let totalWarnings = 0;
  let componentsWithWarnings = 0;
  let manualReviewCount = 0;
  let highConfidenceWarningCount = 0;
  const factorContributions: Record<string, number[]> = {};

  for (const result of results) {
    scoreTotal += result.score;

    for (const hook of result.hooksUsed) {
      hookUsageCounts[hook] += 1;
    }

    totalWarnings += result.warnings.length;

    if (result.warnings.length > 0) {
      componentsWithWarnings += 1;
    }

    for (const warning of result.warnings) {
      severityCounts[warning.severity] += 1;
      confidenceCounts[warning.confidence] += 1;

      if (warning.confidence === "low") {
        manualReviewCount += 1;
      }

      if (warning.confidence === "high") {
        highConfidenceWarningCount += 1;
      }
    }

    if (result.explainedScore?.factors) {
      for (const f of result.explainedScore.factors) {
        if (!factorContributions[f.name]) factorContributions[f.name] = [];
        factorContributions[f.name].push(f.contribution);
      }
    }
  }

  const baseAverageScore = scoreTotal / results.length;
  const warningDensity = totalWarnings / results.length;
  const criticalDensity = severityCounts.critical / results.length;
  const highConfidenceDensity = highConfidenceWarningCount / results.length;
  const densityPenalty = Math.min(
    4,
    warningDensity * 0.8 + criticalDensity * 4 + highConfidenceDensity * 1.5
  );

  const adjustedAverage = Math.max(0, Math.min(10, baseAverageScore - densityPenalty));
  const averageScore = Number(adjustedAverage.toFixed(1));

  const factorWeights: Record<string, number> = {
    "Hook Count": 0.1,
    "ngDoCheck": 0.15,
    "AfterView/ContentChecked": 0.1,
    "ngOnChanges Without Inputs": 0.05,
    "Risky Subscriptions": 0.25,
    "Managed Subscriptions": 0.1,
    "Missing Interval Cleanup": 0.2,
    "Missing Listener Cleanup": 0.2,
    "Missing Timeout Cleanup": 0.1,
    "Missing Renderer Listen Cleanup": 0.2,
    "Verified Cleanup": 0.1,
    "Rule Warnings": 0.35,
    "Warning Volume": 0.15,
  };

  const aggregatedFactors: ScoreFactor[] = Object.entries(factorContributions).map(
    ([name, contributions]) => {
      const avgContribution =
        contributions.reduce((a, b) => a + b, 0) / contributions.length;
      return {
        name,
        weight: factorWeights[name] ?? 0.1,
        contribution: Number(avgContribution.toFixed(2)),
        description: getLifecycleFactorDescription(name),
      };
    }
  );

  if (densityPenalty > 0) {
    aggregatedFactors.push({
      name: "Warning Density",
      weight: 0.15,
      contribution: -densityPenalty,
      description: "High warning density across workspace",
    });
  }

  const explainedScore: ExplainedScore = {
    score: averageScore,
    factors: aggregatedFactors,
  };

  return {
    totalTargets: results.length,
    averageScore,
    explainedScore,
    riskLevel: getLifecycleRiskLevel(averageScore),
    totalWarnings,
    componentsWithWarnings,
    severityCounts,
    confidenceCounts,
    manualReviewCount,
    highConfidenceWarningCount,
    hookUsageCounts,
  };
}
