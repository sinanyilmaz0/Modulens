import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { LifecycleAnalysisResult, LifecycleWarning } from "../angular/analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult, TemplateWarning } from "../angular/analyzers/template/template-models";
import type {
  ResponsibilityAnalysisResult,
  ResponsibilityWarning,
} from "../angular/analyzers/responsibility/responsibility-models";
import type {
  ComponentDiagnostic,
  DiagnosisEvidence,
  DiagnosticCluster,
  DiagnosticStatus,
  DiagnosticSummaryResult,
  DominantIssueType,
} from "./diagnostic-models";
import { detectComponentRole } from "../angular/intelligence/role-detection";
import {
  CODE_TO_CLUSTER,
  CLUSTER_TO_DOMINANT_ISSUE,
  DOMINANT_ISSUE_PRIORITY,
} from "./diagnostic-clusters";
import { REFACTOR_DIRECTIONS } from "./refactor-directions";
import { buildRankingReason } from "../core/explanationBuilder";
import { getCompositeRiskScore as getCompositeRiskScoreFromEngine } from "../core/rankingEngine";

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 2,
  warning: 1,
  info: 0.5,
  CRITICAL: 4,
  HIGH: 2,
  WARNING: 1,
};

const CONFIDENCE_WEIGHT: Record<string, number> = {
  high: 1,
  medium: 0.8,
  low: 0.5,
};

const EMPTY_CLUSTER_SCORES: Record<DiagnosticCluster, number> = {
  template_heavy: 0,
  god_component: 0,
  cleanup_risk: 0,
  orchestration_heavy: 0,
  lifecycle_risky: 0,
};

const TOP_RISKS_COUNT = 10;
const DOMINANT_ISSUE_MIN_SCORE = 1.5;
const DOMINANT_CLUSTER_RATIO = 0.4;
const SUPPORTING_ISSUE_MIN_SCORE = 0.8;
const MAX_SUPPORTING_ISSUES = 3;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

export interface ConsolidationInput {
  components: ComponentAnalysisResult[];
  lifecycleByPath: Map<string, LifecycleAnalysisResult>;
  templateResults: TemplateAnalysisResult[];
  responsibilityResults: ResponsibilityAnalysisResult[];
}

export function consolidateDiagnostics(
  input: ConsolidationInput
): DiagnosticSummaryResult {
  const { components, lifecycleByPath, templateResults, responsibilityResults } =
    input;

  const componentDiagnostics: ComponentDiagnostic[] = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const templateResult = templateResults[i];
    const responsibilityResult = responsibilityResults[i];
    const lifecycleResult = lifecycleByPath.get(normalizePath(component.filePath));

    const diagnostic = buildComponentDiagnostic(
      component,
      lifecycleResult,
      templateResult,
      responsibilityResult
    );
    componentDiagnostics.push(diagnostic);
  }

  const withDominant = componentDiagnostics
    .map((d, i) => ({ diagnostic: d, component: components[i], template: templateResults[i], responsibility: responsibilityResults[i] }))
    .filter((x) => x.diagnostic.dominantIssue !== null);

  const topCrossCuttingRisks = withDominant
    .sort((a, b) => {
      const scoreA = getCompositeRiskScoreFromEngine(
        getDiagnosticRiskScore(a.diagnostic),
        { dominantIssue: a.diagnostic.dominantIssue, component: a.component, templateResult: a.template, responsibilityResult: a.responsibility }
      );
      const scoreB = getCompositeRiskScoreFromEngine(
        getDiagnosticRiskScore(b.diagnostic),
        { dominantIssue: b.diagnostic.dominantIssue, component: b.component, templateResult: b.template, responsibilityResult: b.responsibility }
      );
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.diagnostic.totalWarningCount - a.diagnostic.totalWarningCount;
    })
    .slice(0, TOP_RISKS_COUNT)
    .map((x) => x.diagnostic);

  return {
    componentDiagnostics,
    topCrossCuttingRisks,
  };
}

function buildComponentDiagnostic(
  component: ComponentAnalysisResult,
  lifecycleResult: LifecycleAnalysisResult | undefined,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined
): ComponentDiagnostic {
  const clusterScores = { ...EMPTY_CLUSTER_SCORES };
  let totalWarningCount = 0;

  for (const issue of component.issues) {
    const cluster = CODE_TO_CLUSTER[issue.type];
    if (cluster) {
      const severityWeight = SEVERITY_WEIGHT[issue.severity] ?? 1;
      const confidenceWeight = 1;
      const weight = severityWeight * confidenceWeight;
      clusterScores[cluster] += weight;
      totalWarningCount++;
    }
  }

  for (const warning of lifecycleResult?.warnings ?? []) {
    addWarningToClusterScores(warning, clusterScores);
    totalWarningCount++;
  }

  for (const warning of templateResult?.warnings ?? []) {
    addTemplateWarningToClusterScores(warning, clusterScores);
    totalWarningCount++;
  }

  for (const warning of responsibilityResult?.warnings ?? []) {
    addResponsibilityWarningToClusterScores(warning, clusterScores);
    totalWarningCount++;
  }

  const dominantIssue = pickDominantIssue(clusterScores);
  const supportingIssues = getSupportingIssues(clusterScores, dominantIssue);
  const refactorDirection = dominantIssue
    ? REFACTOR_DIRECTIONS[dominantIssue]
    : "";
  const diagnosticStatus: DiagnosticStatus = dominantIssue
    ? "ranked"
    : totalWarningCount > 0
      ? "unranked"
      : "quiet";
  const diagnosticLabel = dominantIssue
    ? dominantIssue
    : totalWarningCount > 0
      ? "Findings present; no primary ranked issue"
      : "No primary ranked issue";

  const triggeredRuleIds = new Set<string>();
  for (const issue of component.issues) {
    triggeredRuleIds.add(issue.type);
  }
  for (const warning of lifecycleResult?.warnings ?? []) {
    triggeredRuleIds.add(warning.code);
  }
  for (const warning of templateResult?.warnings ?? []) {
    triggeredRuleIds.add(warning.code);
  }
  for (const warning of responsibilityResult?.warnings ?? []) {
    triggeredRuleIds.add(warning.code);
  }

  const className =
    responsibilityResult?.className ??
    templateResult?.className ??
    lifecycleResult?.className ??
    component.fileName.replace(".component.ts", "");

  const roleResult = detectComponentRole({
    component,
    lifecycleResult,
    templateResult,
    responsibilityResult,
    dominantIssue,
    clusterScores,
  });

  const evidence = buildEvidenceForDominantIssue(
    dominantIssue,
    component,
    lifecycleResult,
    templateResult,
    responsibilityResult
  );

  const rankingReason = buildRankingReason(
    component,
    templateResult,
    responsibilityResult,
    dominantIssue
  );

  return {
    filePath: component.filePath,
    fileName: component.fileName,
    className,
    dominantIssue,
    supportingIssues,
    refactorDirection,
    diagnosticLabel,
    diagnosticStatus,
    clusterScores,
    totalWarningCount,
    evidence,
    componentRole: roleResult.componentRole,
    roleConfidence: roleResult.roleConfidence,
    roleSignals: roleResult.roleSignals,
    roleConfidenceBreakdown: roleResult.roleConfidenceBreakdown,
    rankingReason,
    triggeredRuleIds: Array.from(triggeredRuleIds),
  };
}

function buildEvidenceForDominantIssue(
  dominantIssue: DominantIssueType | null,
  component: ComponentAnalysisResult,
  lifecycleResult: LifecycleAnalysisResult | undefined,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined
): DiagnosisEvidence[] {
  if (!dominantIssue) return [];

  const evidence: DiagnosisEvidence[] = [];
  const signals = lifecycleResult?.signals;
  const templateMetrics = templateResult?.metrics;
  const responsibilityMetrics = responsibilityResult?.metrics;

  switch (dominantIssue) {
    case "GOD_COMPONENT":
      evidence.push({
        key: "lineCount",
        value: component.lineCount,
        description: "Component file is very large",
      });
      evidence.push({
        key: "constructorDependencies",
        value: component.dependencyCount,
        description: "Too many injected services",
      });
      evidence.push({
        key: "methodCount",
        value: responsibilityMetrics?.methodCount ?? 0,
        description: "High number of methods indicates multiple responsibilities",
      });
      if ((responsibilityMetrics?.propertyCount ?? 0) > 0) {
        evidence.push({
          key: "propertyCount",
          value: responsibilityMetrics!.propertyCount,
          description: "Many properties suggest mixed concerns",
        });
      }
      break;

    case "TEMPLATE_HEAVY_COMPONENT":
      evidence.push({
        key: "templateLineCount",
        value: templateMetrics?.lineCount ?? 0,
        description: "Template is large",
      });
      evidence.push({
        key: "structuralDirectiveCount",
        value:
          (templateMetrics?.ngIfCount ?? 0) +
          (templateMetrics?.ngForCount ?? 0) +
          (templateMetrics?.atForCount ?? 0) +
          (templateMetrics?.atIfCount ?? 0),
        description: "Many structural directives increase complexity",
      });
      evidence.push({
        key: "eventBindingCount",
        value: templateMetrics?.eventBindingCount ?? 0,
        description: "High event binding count",
      });
      evidence.push({
        key: "structuralDepth",
        value: templateMetrics?.structuralDepth ?? 0,
        description: "Deep nesting in template",
      });
      break;

    case "CLEANUP_RISK_COMPONENT":
      evidence.push({
        key: "subscriptionCount",
        value: signals?.subscribeCount ?? 0,
        description: "Subscriptions that may need cleanup",
      });
      evidence.push({
        key: "timerUsage",
        value: (signals?.setIntervalCount ?? 0) + (signals?.setTimeoutCount ?? 0),
        description: "Timers (setInterval/setTimeout) require cleanup",
      });
      evidence.push({
        key: "eventListenerUsage",
        value:
          (signals?.addEventListenerCount ?? 0) + (signals?.rendererListenCount ?? 0),
        description: "Event listeners that may need removal",
      });
      break;

    case "ORCHESTRATION_HEAVY_COMPONENT":
      evidence.push({
        key: "formGroupCount",
        value: responsibilityMetrics?.formGroupCount ?? 0,
        description: "Form orchestration complexity",
      });
      evidence.push({
        key: "serviceOrchestrationCount",
        value: responsibilityMetrics?.serviceOrchestrationCount ?? 0,
        description: "Many service calls indicate orchestration",
      });
      evidence.push({
        key: "dependencyCount",
        value: component.dependencyCount,
        description: "Many injected dependencies",
      });
      break;

    case "LIFECYCLE_RISKY_COMPONENT":
      evidence.push({
        key: "lifecycleHookCount",
        value: lifecycleResult?.hookCount ?? 0,
        description: "Many lifecycle hooks increase complexity",
      });
      evidence.push({
        key: "afterViewInitStatementCount",
        value: lifecycleResult?.afterViewInitStatementCount ?? 0,
        description: "Heavy logic in AfterViewInit",
      });
      break;
  }

  return evidence;
}

function addWarningToClusterScores(
  warning: LifecycleWarning,
  clusterScores: Record<DiagnosticCluster, number>
): void {
  const cluster = CODE_TO_CLUSTER[warning.code];
  if (cluster) {
    const severityWeight = SEVERITY_WEIGHT[warning.severity] ?? 1;
    const confidenceWeight = CONFIDENCE_WEIGHT[warning.confidence] ?? 0.8;
    clusterScores[cluster] += severityWeight * confidenceWeight;
  }
}

function addTemplateWarningToClusterScores(
  warning: TemplateWarning,
  clusterScores: Record<DiagnosticCluster, number>
): void {
  const cluster = CODE_TO_CLUSTER[warning.code];
  if (cluster) {
    const severityWeight = SEVERITY_WEIGHT[warning.severity] ?? 1;
    const confidenceWeight = CONFIDENCE_WEIGHT[warning.confidence] ?? 0.8;
    clusterScores[cluster] += severityWeight * confidenceWeight;
  }
}

function addResponsibilityWarningToClusterScores(
  warning: ResponsibilityWarning,
  clusterScores: Record<DiagnosticCluster, number>
): void {
  const cluster = CODE_TO_CLUSTER[warning.code];
  if (cluster) {
    const severityWeight = SEVERITY_WEIGHT[warning.severity] ?? 1;
    const confidenceWeight = CONFIDENCE_WEIGHT[warning.confidence] ?? 0.8;
    clusterScores[cluster] += severityWeight * confidenceWeight;
  }
}

function pickDominantIssue(
  clusterScores: Record<DiagnosticCluster, number>
): DominantIssueType | null {
  const entries = Object.entries(clusterScores) as [DiagnosticCluster, number][];
  const eligible = entries.filter(([, score]) => score >= DOMINANT_ISSUE_MIN_SCORE);

  if (eligible.length === 0) return null;

  const totalClusterScore = entries.reduce((sum, [, s]) => sum + s, 0);
  if (totalClusterScore <= 0) return null;

  const sorted = [...eligible].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const priorityA = DOMINANT_ISSUE_PRIORITY[CLUSTER_TO_DOMINANT_ISSUE[a[0]]] ?? 0;
    const priorityB = DOMINANT_ISSUE_PRIORITY[CLUSTER_TO_DOMINANT_ISSUE[b[0]]] ?? 0;
    return priorityB - priorityA;
  });

  const topScore = sorted[0][1];
  if (topScore < totalClusterScore * DOMINANT_CLUSTER_RATIO) {
    return null;
  }

  return CLUSTER_TO_DOMINANT_ISSUE[sorted[0][0]];
}

function getSupportingIssues(
  clusterScores: Record<DiagnosticCluster, number>,
  dominantIssue: DominantIssueType | null
): DominantIssueType[] {
  const dominantCluster = dominantIssue
    ? (Object.entries(CLUSTER_TO_DOMINANT_ISSUE).find(
        ([, issue]) => issue === dominantIssue
      )?.[0] as DiagnosticCluster | undefined)
    : undefined;

  const candidates: [DiagnosticCluster, number][] = [];
  for (const [cluster, score] of Object.entries(clusterScores) as [
    DiagnosticCluster,
    number
  ][]) {
    if (score >= SUPPORTING_ISSUE_MIN_SCORE && cluster !== dominantCluster) {
      candidates.push([cluster, score]);
    }
  }
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates
    .slice(0, MAX_SUPPORTING_ISSUES)
    .map(([cluster]) => CLUSTER_TO_DOMINANT_ISSUE[cluster]);
}

export function getDiagnosticRiskScore(diagnostic: ComponentDiagnostic): number {
  if (diagnostic.dominantIssue === null) return 0;
  const dominantCluster = Object.entries(CLUSTER_TO_DOMINANT_ISSUE).find(
    ([, issue]) => issue === diagnostic.dominantIssue
  )?.[0] as DiagnosticCluster | undefined;
  if (!dominantCluster) return 0;
  const baseScore = diagnostic.clusterScores[dominantCluster];
  const supportingBonus = diagnostic.supportingIssues.length * 0.5;
  return baseScore + supportingBonus;
}

