import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { TemplateAnalysisResult } from "../angular/analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../angular/analyzers/responsibility/responsibility-models";
import type {
  ComponentDiagnostic,
  DominantIssueType,
  DiagnosticCluster,
} from "../diagnostic/diagnostic-models";
import { CLUSTER_TO_DOMINANT_ISSUE } from "../diagnostic/diagnostic-clusters";
import { REFACTOR_DIRECTIONS } from "../diagnostic/refactor-directions";
import type { RefactorTask } from "./refactor-task-models";
import { computeRawImpactScore as computeRawImpactScoreFromEngine } from "../core/rankingEngine";

export interface RefactorPriorityInput {
  components: ComponentAnalysisResult[];
  templateResults: TemplateAnalysisResult[];
  responsibilityResults: ResponsibilityAnalysisResult[];
  componentDiagnostics: ComponentDiagnostic[];
}

const DOMINANT_ISSUE_LABELS: Record<string, string> = {
  TEMPLATE_HEAVY_COMPONENT: "Template Heavy",
  GOD_COMPONENT: "God Component",
  CLEANUP_RISK_COMPONENT: "Cleanup Risk",
  ORCHESTRATION_HEAVY_COMPONENT: "Orchestration Heavy",
  LIFECYCLE_RISKY_COMPONENT: "Lifecycle Risky",
};

const EFFORT_BY_ISSUE: Record<DominantIssueType, "low" | "medium" | "high"> = {
  TEMPLATE_HEAVY_COMPONENT: "low",
  CLEANUP_RISK_COMPONENT: "low",
  LIFECYCLE_RISKY_COMPONENT: "medium",
  ORCHESTRATION_HEAVY_COMPONENT: "medium",
  GOD_COMPONENT: "high",
};

const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical: 1.5,
  CRITICAL: 1.5,
  high: 1.2,
  HIGH: 1.2,
  warning: 1.0,
  WARNING: 1.0,
  info: 0.8,
  INFO: 0.8,
};

function normalizeSeverity(severity: string | undefined): "critical" | "high" | "warning" | "info" {
  if (!severity) return "info";
  const s = severity.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "warning") return "warning";
  return "info";
}

function getEffectiveSeverity(
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined
): "critical" | "high" | "warning" | "info" {
  const compSeverity = normalizeSeverity(component.highestSeverity);
  const templateSeverity = templateResult?.highestSeverity
    ? normalizeSeverity(templateResult.highestSeverity)
    : "info";
  const respSeverity = responsibilityResult?.highestSeverity
    ? normalizeSeverity(responsibilityResult.highestSeverity)
    : "info";

  const rank = { critical: 4, high: 3, warning: 2, info: 1 };
  const maxRank = Math.max(
    rank[compSeverity],
    rank[templateSeverity],
    rank[respSeverity]
  );
  if (maxRank === 4) return "critical";
  if (maxRank === 3) return "high";
  if (maxRank === 2) return "warning";
  return "info";
}

function getDominantIssueFromClusterScores(
  clusterScores: Record<DiagnosticCluster, number>
): DominantIssueType | null {
  const entries = Object.entries(clusterScores) as [DiagnosticCluster, number][];
  const sorted = entries
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top) return null;
  return CLUSTER_TO_DOMINANT_ISSUE[top[0]];
}

function getDominantIssueLabel(dominantIssue: DominantIssueType | null): string {
  if (!dominantIssue) return "No single dominant issue (combined signals)";
  return DOMINANT_ISSUE_LABELS[dominantIssue] ?? dominantIssue;
}

function getPriority(
  severity: "critical" | "high" | "warning" | "info",
  lineCount: number,
  dependencyCount: number,
  templateLineCount: number,
  eventBindingCount: number,
  dominantIssue: DominantIssueType | null,
  totalWarningCount: number
): { priority: "fix-now" | "fix-soon" | "monitor"; whyNow: string[] } {
  const whyNow: string[] = [];

  if (severity === "critical") {
    whyNow.push("CRITICAL severity");
    return { priority: "fix-now", whyNow };
  }
  if (lineCount > 1000) {
    whyNow.push(`Exceeds 1000 lines (${lineCount})`);
    return { priority: "fix-now", whyNow };
  }
  if (dominantIssue === "GOD_COMPONENT" && dependencyCount >= 6) {
    whyNow.push(`God component with ${dependencyCount} dependencies`);
    return { priority: "fix-now", whyNow };
  }
  if (templateLineCount >= 350 && eventBindingCount >= 15) {
    whyNow.push(`Template-heavy (${templateLineCount} lines, ${eventBindingCount} event bindings)`);
    return { priority: "fix-now", whyNow };
  }

  if (severity === "high") {
    whyNow.push("HIGH severity");
    return { priority: "fix-soon", whyNow };
  }
  if (lineCount > 600) {
    whyNow.push(`Large component (${lineCount} lines)`);
    return { priority: "fix-soon", whyNow };
  }
  if (totalWarningCount >= 10) {
    whyNow.push(`${totalWarningCount} warnings`);
    return { priority: "fix-soon", whyNow };
  }

  whyNow.push("Monitor for future refactoring");
  return { priority: "monitor", whyNow };
}

function getEffort(
  dominantIssue: DominantIssueType | null,
  lineCount: number,
  methodCount: number,
  propertyCount: number,
  serviceOrchestrationCount: number,
  formGroupCount: number,
  templateLineCount: number
): "low" | "medium" | "high" {
  if (dominantIssue) {
    if (dominantIssue === "GOD_COMPONENT") return "high";
    if (
      dominantIssue === "ORCHESTRATION_HEAVY_COMPONENT" &&
      (lineCount > 500 || methodCount > 15 || propertyCount > 20)
    ) {
      return "high";
    }
    return EFFORT_BY_ISSUE[dominantIssue];
  }

  const hasOrchestration = serviceOrchestrationCount > 3 || formGroupCount > 2;
  const hasHeavyState = methodCount > 12 || propertyCount > 15;
  const isLarge = lineCount > 600 || templateLineCount > 300;

  if (hasOrchestration && (hasHeavyState || isLarge)) return "high";
  if (hasOrchestration || hasHeavyState) return "medium";
  return "low";
}


function normalizeImpactScores(rawScores: number[]): number[] {
  if (rawScores.length === 0) return [];
  const min = Math.min(...rawScores);
  const max = Math.max(...rawScores);
  const range = max - min;
  if (range === 0) return rawScores.map(() => 50);
  return rawScores.map((r) => Math.round(Math.max(0, Math.min(100, ((r - min) / range) * 100))));
}

const PRIORITY_ORDER = { "fix-now": 0, "fix-soon": 1, monitor: 2 };

export function computeRefactorTasks(input: RefactorPriorityInput): RefactorTask[] {
  const { components, templateResults, responsibilityResults, componentDiagnostics } = input;
  const taskData: Array<{
    task: Omit<RefactorTask, "impactScore">;
    rawImpactScore: number;
  }> = [];

  for (let i = 0; i < componentDiagnostics.length; i++) {
    const diagnostic = componentDiagnostics[i];
    const component = components[i];
    const templateResult = templateResults[i];
    const responsibilityResult = responsibilityResults[i];

    const hasDominantIssue = diagnostic.dominantIssue !== null;
    const hasIssues = component.issues.length > 0 || diagnostic.totalWarningCount > 0;

    if (!hasDominantIssue && !hasIssues) continue;

    const lineCount = component.lineCount;
    const dependencyCount = component.dependencyCount;
    const templateLineCount = templateResult?.metrics?.lineCount ?? 0;
    const eventBindingCount = templateResult?.metrics?.eventBindingCount ?? 0;
    const structuralDirectiveCount =
      (templateResult?.metrics?.ngIfCount ?? 0) +
      (templateResult?.metrics?.ngForCount ?? 0) +
      (templateResult?.metrics?.atForCount ?? 0) +
      (templateResult?.metrics?.atIfCount ?? 0);
    const structuralDepth = templateResult?.metrics?.structuralDepth ?? 0;
    const methodCount = responsibilityResult?.metrics?.methodCount ?? 0;
    const propertyCount = responsibilityResult?.metrics?.propertyCount ?? 0;
    const serviceOrchestrationCount =
      responsibilityResult?.metrics?.serviceOrchestrationCount ?? 0;
    const formGroupCount = responsibilityResult?.metrics?.formGroupCount ?? 0;

    const dominantIssue =
      diagnostic.dominantIssue ??
      getDominantIssueFromClusterScores(diagnostic.clusterScores);
    const severity = getEffectiveSeverity(
      component,
      templateResult,
      responsibilityResult
    );
  const severityMult = SEVERITY_MULTIPLIER[severity] ?? 0.8;

    const { priority, whyNow } = getPriority(
      severity,
      lineCount,
      dependencyCount,
      templateLineCount,
      eventBindingCount,
      dominantIssue,
      diagnostic.totalWarningCount
    );

    const effort = getEffort(
      dominantIssue,
      lineCount,
      methodCount,
      propertyCount,
      serviceOrchestrationCount,
      formGroupCount,
      templateLineCount
    );

    const rawImpactScore = computeRawImpactScoreFromEngine(
      lineCount,
      dependencyCount,
      methodCount,
      templateLineCount,
      structuralDirectiveCount,
      structuralDepth,
      eventBindingCount,
      serviceOrchestrationCount,
      diagnostic.totalWarningCount,
      severityMult,
      dominantIssue
    );

    const componentName =
      diagnostic.className ?? component.fileName.replace(".component.ts", "");
    const suggestedAction =
      dominantIssue && REFACTOR_DIRECTIONS[dominantIssue]
        ? REFACTOR_DIRECTIONS[dominantIssue]
        : diagnostic.refactorDirection || "Review and refactor.";

    taskData.push({
      task: {
        componentName,
        filePath: component.filePath,
        dominantIssue: getDominantIssueLabel(dominantIssue),
        priority,
        effort,
        whyNow,
        suggestedAction,
      },
      rawImpactScore,
    });
  }

  const rawScores = taskData.map((t) => t.rawImpactScore);
  const normalizedScores = normalizeImpactScores(rawScores);

  const tasks: RefactorTask[] = taskData.map((t, idx) => ({
    ...t.task,
    impactScore: normalizedScores[idx],
  }));

  return tasks.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.impactScore - a.impactScore;
  });
}
