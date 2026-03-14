/**
 * Impact-first ranking engine for components.
 * Balances severity, dependency count, template complexity, orchestration, and LOC.
 * LOC is not the dominant factor.
 */

import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { TemplateAnalysisResult } from "../angular/analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../angular/analyzers/responsibility/responsibility-models";
import type { ComponentDiagnostic, DominantIssueType } from "../diagnostic/diagnostic-models";

/** Impact-first weights: severity > dependency > template > orchestration > cleanup > LOC > event */
const LINE_WEIGHT_COEF = 0.008;
const LINE_WEIGHT_CAP = 8;
const DEPENDENCY_WEIGHT = 12;
const TEMPLATE_COMPLEXITY_COEF = 0.25;
const STRUCTURAL_DEPTH_MULT = 2;
const ORCHESTRATION_WEIGHT = 4;
const EVENT_BINDING_DENSITY = 0.4;
const CLEANUP_RISK_BONUS = 6;
const METHOD_WEIGHT = 1;
const PROPERTY_WEIGHT_COEF = 0.5;
const PROPERTY_WEIGHT_CAP = 10;

export interface CompositeRiskInput {
  clusterScore: number;
  dominantIssue: DominantIssueType | null;
  component: ComponentAnalysisResult;
  templateResult?: TemplateAnalysisResult;
  responsibilityResult?: ResponsibilityAnalysisResult;
}

/**
 * Computes size/impact contribution for ranking.
 * Used by both composite risk (diagnostics) and refactor impact.
 */
export function computeSizeImpact(input: CompositeRiskInput): number {
  const { dominantIssue, component, templateResult, responsibilityResult } =
    input;
  const lineCount = component.lineCount;
  const dependencyCount = component.dependencyCount;
  const templateLineCount = templateResult?.metrics?.lineCount ?? 0;
  const eventBindingCount = templateResult?.metrics?.eventBindingCount ?? 0;
  const structuralDepth = templateResult?.metrics?.structuralDepth ?? 0;
  const structuralDirectiveCount =
    (templateResult?.metrics?.ngIfCount ?? 0) +
    (templateResult?.metrics?.ngForCount ?? 0) +
    (templateResult?.metrics?.atForCount ?? 0) +
    (templateResult?.metrics?.atIfCount ?? 0);
  const methodCount = responsibilityResult?.metrics?.methodCount ?? 0;
  const propertyCount = responsibilityResult?.metrics?.propertyCount ?? 0;
  const serviceOrchestrationCount =
    responsibilityResult?.metrics?.serviceOrchestrationCount ?? 0;

  const lineWeight = Math.min(lineCount * LINE_WEIGHT_COEF, LINE_WEIGHT_CAP);
  const dependencyWeight = dependencyCount * DEPENDENCY_WEIGHT;
  const methodWeight = methodCount * METHOD_WEIGHT;
  const templateComplexity =
    (structuralDepth * STRUCTURAL_DEPTH_MULT +
      eventBindingCount +
      structuralDirectiveCount) *
    TEMPLATE_COMPLEXITY_COEF;
  const orchestrationWeight = serviceOrchestrationCount * ORCHESTRATION_WEIGHT;
  const eventBindingWeight = eventBindingCount * EVENT_BINDING_DENSITY;
  const propertyWeight = Math.min(
    propertyCount * PROPERTY_WEIGHT_COEF,
    PROPERTY_WEIGHT_CAP
  );

  let impact =
    lineWeight +
    dependencyWeight +
    methodWeight +
    templateComplexity +
    orchestrationWeight +
    eventBindingWeight +
    propertyWeight;

  if (dominantIssue === "CLEANUP_RISK_COMPONENT") {
    impact += CLEANUP_RISK_BONUS;
  }

  return impact;
}

/**
 * Composite risk score for ranking components.
 * clusterScore * 2 + sizeImpact.
 */
export function getCompositeRiskScore(
  clusterScore: number,
  input: Omit<CompositeRiskInput, "clusterScore">
): number {
  const sizeImpact = computeSizeImpact({ ...input, clusterScore: 0 });
  return clusterScore * 2 + sizeImpact;
}

/**
 * Computes raw impact score for refactor tasks.
 * Uses same impact-first weights; includes warning count and severity multiplier.
 */
export function computeRawImpactScore(
  lineCount: number,
  dependencyCount: number,
  methodCount: number,
  templateLineCount: number,
  structuralDirectiveCount: number,
  structuralDepth: number,
  eventBindingCount: number,
  serviceOrchestrationCount: number,
  totalWarningCount: number,
  severityMultiplier: number,
  dominantIssue: DominantIssueType | null
): number {
  const lineWeight = Math.min(lineCount * LINE_WEIGHT_COEF, LINE_WEIGHT_CAP);
  const dependencyWeight = dependencyCount * DEPENDENCY_WEIGHT;
  const methodWeight = methodCount * METHOD_WEIGHT;
  const templateComplexity =
    (structuralDepth * STRUCTURAL_DEPTH_MULT +
      eventBindingCount +
      structuralDirectiveCount) *
    TEMPLATE_COMPLEXITY_COEF;
  const orchestrationWeight = serviceOrchestrationCount * ORCHESTRATION_WEIGHT;
  const eventBindingWeight = eventBindingCount * EVENT_BINDING_DENSITY;
  const warningWeight = totalWarningCount * 2;

  let raw =
    (lineWeight +
      dependencyWeight +
      methodWeight +
      templateComplexity +
      orchestrationWeight +
      eventBindingWeight +
      warningWeight) *
    severityMultiplier;

  if (dominantIssue === "CLEANUP_RISK_COMPONENT") {
    raw += CLEANUP_RISK_BONUS * severityMultiplier;
  }

  return raw;
}

/**
 * Sorts components by composite risk score (impact-first).
 * Returns indices into the original arrays for components with issues.
 */
export function sortComponentsByImpact(
  components: ComponentAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[],
  componentDiagnostics: ComponentDiagnostic[],
  getClusterScore: (d: ComponentDiagnostic) => number
): ComponentAnalysisResult[] {
  const withScores = components
    .map((c, i) => {
      const diagnostic = componentDiagnostics[i];
      const templateResult = templateResults[i];
      const responsibilityResult = responsibilityResults[i];
      const clusterScore = getClusterScore(diagnostic);
      const score = getCompositeRiskScore(clusterScore, {
        dominantIssue: diagnostic.dominantIssue,
        component: c,
        templateResult,
        responsibilityResult,
      });
      return { component: c, score };
    })
    .filter((x) => x.component.issues.length > 0);

  withScores.sort((a, b) => b.score - a.score);
  return withScores.map((x) => x.component);
}
