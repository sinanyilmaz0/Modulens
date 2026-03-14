/**
 * Centralized severity resolution for Modulens.
 * Single source of truth for final severity, rule-derived severity, and risk-score severity.
 */

export type CanonicalSeverityCode = "CRITICAL" | "HIGH" | "WARNING" | "LOW";

export type SeverityConfidence = "measured" | "inferred" | "low";

export interface RuleHistogram {
  critical: number;
  high: number;
  warning: number;
  info: number;
}

export interface SeverityResolutionInput {
  /** From component-size analyzer (highestSeverity). Null when component has no size/dependency issues. */
  baseSeverity: CanonicalSeverityCode | null;
  ruleHistogram: RuleHistogram;
  /** 0–100 combined risk score from rules + metrics. */
  computedRiskScore: number;
  dominantIssue: string | null;
  triggeredRuleIds: string[];
}

export interface SeverityResolutionResult {
  baseSeverity: CanonicalSeverityCode | null;
  /** Derived from rule histogram (highest severity among triggered rules). */
  ruleDerivedSeverity: CanonicalSeverityCode;
  /** Derived from computedRiskScore thresholds. */
  riskScoreSeverity: CanonicalSeverityCode;
  /** Final reconciled severity for display. */
  finalSeverity: CanonicalSeverityCode;
  /** Human-readable explanation of the decision. */
  explanation: string[];
  /** measured = baseSeverity present; inferred = rule/risk only; low = weak signals. */
  confidence: SeverityConfidence;
  /** Debug/telemetry only; not shown in user report. */
  _internalAnomaly?: "base-missing-rule-elevated";
}

const SEVERITY_ORDER: Record<CanonicalSeverityCode, number> = {
  CRITICAL: 4,
  HIGH: 3,
  WARNING: 2,
  LOW: 1,
};

function maxSeverity(a: CanonicalSeverityCode, b: CanonicalSeverityCode): CanonicalSeverityCode {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

function deriveRuleSeverity(histogram: RuleHistogram): CanonicalSeverityCode {
  if (histogram.critical > 0) return "CRITICAL";
  if (histogram.high > 0) return "HIGH";
  if (histogram.warning > 0) return "WARNING";
  return "LOW";
}

function deriveRiskScoreSeverity(score: number): CanonicalSeverityCode {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "WARNING";
  return "LOW";
}

/**
 * Resolves final severity from base (component-size), rule histogram, and risk score.
 * Single deterministic decision function.
 */
export function resolveFinalSeverity(input: SeverityResolutionInput): SeverityResolutionResult {
  const { baseSeverity, ruleHistogram, computedRiskScore } = input;
  const ruleDerivedSeverity = deriveRuleSeverity(ruleHistogram);
  const riskScoreSeverity = deriveRiskScoreSeverity(computedRiskScore);
  const explanation: string[] = [];

  if (baseSeverity != null) {
    // Measured path: baseSeverity from component-size analysis (line count, dependency count).
    let finalSeverity: CanonicalSeverityCode = baseSeverity;
    if (SEVERITY_ORDER[riskScoreSeverity] > SEVERITY_ORDER[baseSeverity]) {
      finalSeverity = maxSeverity(baseSeverity, riskScoreSeverity);
      explanation.push(
        `Base severity ${baseSeverity} from component-size; elevated to ${finalSeverity} by risk score (${computedRiskScore}).`
      );
    } else {
      explanation.push(`Base severity ${baseSeverity} from component-size analysis (line count, dependencies).`);
    }
    return {
      baseSeverity,
      ruleDerivedSeverity,
      riskScoreSeverity,
      finalSeverity,
      explanation,
      confidence: "measured",
    };
  }

  // Inferred path: no baseSeverity; rely on rule histogram and risk score.
  let finalSeverity: CanonicalSeverityCode;
  if (ruleDerivedSeverity === "CRITICAL" && computedRiskScore >= 50) {
    finalSeverity = "CRITICAL";
    explanation.push(
      `Critical rules triggered; risk score ${computedRiskScore} supports CRITICAL. No component-size baseline.`
    );
  } else if (ruleDerivedSeverity === "CRITICAL" && computedRiskScore >= 25) {
    finalSeverity = "HIGH";
    explanation.push(
      `Critical rules triggered; risk score ${computedRiskScore} supports HIGH. No component-size baseline.`
    );
  } else if (ruleDerivedSeverity === "HIGH" && computedRiskScore >= 50) {
    finalSeverity = "HIGH";
    explanation.push(
      `High-severity rules triggered; risk score ${computedRiskScore} supports HIGH. No component-size baseline.`
    );
  } else if (ruleDerivedSeverity === "HIGH" && computedRiskScore >= 25) {
    finalSeverity = "WARNING";
    explanation.push(
      `High-severity rules triggered; risk score ${computedRiskScore} supports WARNING. No component-size baseline.`
    );
  } else if (computedRiskScore >= 75) {
    finalSeverity = "CRITICAL";
    explanation.push(
      `Risk score ${computedRiskScore} indicates CRITICAL. No component-size baseline.`
    );
  } else if (computedRiskScore >= 50) {
    finalSeverity = "HIGH";
    explanation.push(
      `Risk score ${computedRiskScore} indicates HIGH. No component-size baseline.`
    );
  } else if (computedRiskScore >= 25) {
    finalSeverity = "WARNING";
    explanation.push(
      `Risk score ${computedRiskScore} indicates WARNING. No component-size baseline.`
    );
  } else {
    finalSeverity = "LOW";
    explanation.push(
      `Risk score ${computedRiskScore} indicates LOW. No component-size baseline.`
    );
  }

  return {
    baseSeverity: null,
    ruleDerivedSeverity,
    riskScoreSeverity,
    finalSeverity,
    explanation,
    confidence: "inferred",
    _internalAnomaly: "base-missing-rule-elevated",
  };
}
