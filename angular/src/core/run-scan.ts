import { getAngularProjects } from "../angular/workspace/workspace-reader";
import {
  getAngularProjectsWithNames,
  selectBreakdownMode,
} from "../angular/workspace/workspace-type-detector";
import {
  findComponents,
  analyzeComponent,
  type ComponentAnalysisResult,
} from "../angular/analyzers/component-analyzer";
import {
  analyzeLifecycle,
  findLifecycleTargets,
  summarizeLifecycleResults,
} from "../angular/analyzers/lifecycle/lifecycle-analyzer";
import type {
  LifecycleAnalysisResult,
  LifecycleConfidence,
  LifecycleSeverity,
} from "../angular/analyzers/lifecycle/lifecycle-models";
import {
  analyzeTemplate,
  summarizeTemplateResults,
} from "../angular/analyzers/template/template-analyzer";
import type { TemplateAnalysisResult } from "../angular/analyzers/template/template-models";
import {
  analyzeResponsibility,
  summarizeResponsibilityResults,
} from "../angular/analyzers/responsibility/responsibility-analyzer";
import type { ResponsibilityAnalysisResult } from "../angular/analyzers/responsibility/responsibility-models";
import {
  consolidateDiagnostics,
  type ConsolidationInput,
} from "../diagnostic/diagnostic-consolidator";
import type { DominantIssueType } from "../diagnostic/diagnostic-models";
import {
  detectFamilies,
  type FamilyDetectionInput,
} from "../angular/family/family-detector";
import { detectComponentFamilyInsights } from "../angular/family/component-family-intelligence";
import { detectFeaturePatterns } from "../angular/intelligence/feature-pattern";
import { computeRefactorPlan } from "../refactor/refactor-planner";
import { computeRefactorTasks } from "../refactor/refactor-priority-engine";
import { getFeatureBreakdownItems } from "../report/html/feature-extraction";
import { computeArchitectureIntelligence } from "../angular/intelligence";
import { enrichExplainedScore } from "./explanationBuilder";
import { computeComponentScore } from "./scoringEngine";
import { sortComponentsByImpact } from "./rankingEngine";
import { getDiagnosticRiskScore } from "../diagnostic/diagnostic-consolidator";
import { computeRefactorBlueprints } from "../refactor/refactor-blueprint-generator";
import { computeDecompositionSuggestions } from "../angular/intelligence/decomposition";
import { computeStructureConcerns } from "./structure-analyzer";
import { validateMetricsConsistency } from "./metrics-validation";
import { createAnalysisSnapshot } from "./analysis-snapshot";
import type { AnalysisSnapshot } from "./analysis-snapshot";
import { validateSnapshotParity } from "./snapshot-validation";
import { ModulensError } from "./modulens-error";
import type {
  ScanResult,
  WorkspaceSummary,
  Scores,
  ProjectBreakdownItem,
  DiagnosticSummary,
  LifecycleSection,
  TemplateSection,
  ResponsibilitySection,
  CleanupStats,
  CommonWarning,
} from "./scan-result";

const RISK_WARNING_DENSITY_HIGH_THRESHOLD = 3;
const RISK_DOMINANT_RATIO_THRESHOLD = 0.7;
const TOP_RISKS_COUNT = 10;
const TOP_PROBLEMATIC_COUNT = 10;
const MANUAL_REVIEW_COUNT = 8;
const COMMON_WARNINGS_TOP = 7;

const severityRank: Record<LifecycleSeverity, number> = {
  info: 0,
  warning: 1,
  high: 2,
  critical: 3,
};

const confidenceRank: Record<LifecycleConfidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function getHighestWarningSeverityRank(result: LifecycleAnalysisResult): number {
  if (result.warnings.length === 0) return -1;
  return Math.max(...result.warnings.map((w) => severityRank[w.severity]));
}

function getHighestWarningConfidenceRank(result: LifecycleAnalysisResult): number {
  if (result.warnings.length === 0) return -1;
  return Math.max(...result.warnings.map((w) => confidenceRank[w.confidence]));
}

function getTemplateSeverityRank(severity: string): number {
  return severity === "critical" ? 3 : severity === "high" ? 2 : severity === "warning" ? 1 : 0;
}

function computeCommonWarnings(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): CommonWarning[] {
  const codeCounts = new Map<string, number>();

  for (const c of components) {
    for (const issue of c.issues) {
      codeCounts.set(issue.type, (codeCounts.get(issue.type) ?? 0) + 1);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }

  return Array.from(codeCounts.entries())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, COMMON_WARNINGS_TOP)
    .map(([code, count]) => ({ code, count }));
}

function computeAllRuleViolationCounts(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): Record<string, number> {
  const codeCounts = new Map<string, number>();

  for (const c of components) {
    for (const issue of c.issues) {
      codeCounts.set(issue.type, (codeCounts.get(issue.type) ?? 0) + 1);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }

  return Object.fromEntries(codeCounts);
}

function normalizePathForMatch(p: string): string {
  return p.replace(/\\/g, "/");
}

function computeRuleToAffectedComponents(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): Record<string, string[]> {
  const componentPaths = new Set(components.map((c) => normalizePathForMatch(c.filePath)));
  const ruleToPaths = new Map<string, Set<string>>();

  const add = (ruleId: string, filePath: string) => {
    if (!componentPaths.has(normalizePathForMatch(filePath))) return;
    let set = ruleToPaths.get(ruleId);
    if (!set) {
      set = new Set();
      ruleToPaths.set(ruleId, set);
    }
    set.add(filePath);
  };

  for (const c of components) {
    for (const issue of c.issues) {
      add(issue.type, c.filePath);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }

  return Object.fromEntries(
    Array.from(ruleToPaths.entries()).map(([k, v]) => [k, Array.from(v)])
  );
}

function buildWarningsAndRecommendations(result: ScanResult): string[] {
  const recs: string[] = [];

  const add = (r: string) => {
    if (r && !recs.includes(r)) recs.push(r);
  };

  const hasExtraction = result.extractionCandidates.length > 0;
  const lowOverall = result.scores.overall < 5;

  if (lowOverall && hasExtraction) {
    add(
      "Overall score is low. Focus on top cross-cutting risks and extraction candidates first."
    );
  } else if (lowOverall) {
    add("Overall score is low. Focus on top cross-cutting risks and extraction candidates first.");
  } else if (hasExtraction) {
    add(
      `Found ${result.extractionCandidates.length} extraction candidates. Review similar component families for refactoring.`
    );
  }

  if (result.diagnosticSummary.dominantIssueCounts.CLEANUP_RISK_COMPONENT > 0) {
    add("Address cleanup risks: ensure subscriptions and listeners are properly disposed in ngOnDestroy.");
  }
  if (result.diagnosticSummary.dominantIssueCounts.GOD_COMPONENT > 0) {
    add("Consider splitting god components: extract logic into services or child components.");
  }
  if (result.diagnosticSummary.dominantIssueCounts.TEMPLATE_HEAVY_COMPONENT > 0) {
    add("Simplify template-heavy components: move logic to methods or extract sub-components.");
  }
  if (result.lifecycle.cleanupStats.likelyUnmanagedSubscriptions > 0) {
    add("Unmanaged subscriptions detected. Use takeUntilDestroyed or manual unsubscribe in ngOnDestroy.");
  }

  const highRiskPatterns = result.featurePatterns?.filter((p) => p.duplicationRisk === "high") ?? [];
  if (highRiskPatterns.length > 0) {
    add(
      `This project implements ${highRiskPatterns.length} feature pattern(s) with high duplication risk. Consider extracting shared modules.`
    );
    const playerPattern = highRiskPatterns.find((p) => p.patternType === "PLAYER_FEATURE_PATTERN");
    if (playerPattern && playerPattern.instanceCount >= 4) {
      add(
        `This project implements ${playerPattern.instanceCount} independent media player features with nearly identical architecture. A shared player module could reduce duplication.`
      );
    }
  }

  return recs;
}

export async function runScan(workspacePath: string): Promise<AnalysisSnapshot | null> {
  const sourceRoots = getAngularProjects(workspacePath);
  const projectInfos = getAngularProjectsWithNames(workspacePath);
  if (sourceRoots.length === 0) {
    return null;
  }

  const projectResults: Array<{
    sourceRoot: string;
    components: ComponentAnalysisResult[];
    warningCount: number;
    lifecycleResults: LifecycleAnalysisResult[];
    templateResults: TemplateAnalysisResult[];
    responsibilityResults: ResponsibilityAnalysisResult[];
  }> = [];

  for (const root of sourceRoots) {
    const componentPaths = await findComponents(workspacePath, root);
    const lifecycleTargetPaths = await findLifecycleTargets(workspacePath, root);

    const analyzedComponents = componentPaths.map((p) => analyzeComponent(p));
    const analyzedLifecycle = lifecycleTargetPaths.map((p) => analyzeLifecycle(p));
    const analyzedTemplates = componentPaths.map((p) => analyzeTemplate(p));

    const lifecycleByPath = new Map(
      analyzedLifecycle.map((r) => [normalizePathForMatch(r.filePath), r] as const)
    );

    const responsibilityResults = componentPaths.map((componentPath, i) =>
      analyzeResponsibility(componentPath, {
        componentResult: analyzedComponents[i],
        lifecycleResult: lifecycleByPath.get(normalizePathForMatch(componentPath)),
        templateResult: analyzedTemplates[i],
      })
    );

    const warningCount = analyzedComponents.filter((c) => c.issues.length > 0).length;

    projectResults.push({
      sourceRoot: root,
      components: analyzedComponents,
      warningCount,
      lifecycleResults: analyzedLifecycle,
      templateResults: analyzedTemplates,
      responsibilityResults,
    });
  }

  const allComponents = projectResults.flatMap((p) => p.components);
  const allLifecycleResults = projectResults.flatMap((p) => p.lifecycleResults);
  const allTemplateResults = projectResults.flatMap((p) => p.templateResults);
  const allResponsibilityResults = projectResults.flatMap(
    (p) => p.responsibilityResults
  );
  const allLifecycleByPath = new Map(
    allLifecycleResults.map((r) => [normalizePathForMatch(r.filePath), r] as const)
  );
  const totalComponentsWithFindings = allComponents.filter((c) => c.issues.length > 0).length;

  const diagnosticSummaryRaw = consolidateDiagnostics({
    components: allComponents,
    lifecycleByPath: allLifecycleByPath,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
  } satisfies ConsolidationInput);

  const decompositionSuggestions = computeDecompositionSuggestions({
    components: allComponents,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
  });
  for (const d of diagnosticSummaryRaw.componentDiagnostics) {
    const suggestion = decompositionSuggestions.get(d.filePath);
    if (suggestion && suggestion.strategy !== "aggressive") {
      d.decompositionSuggestion = suggestion;
    }
  }

  const lifecycleSummary = summarizeLifecycleResults(allLifecycleResults);
  const templateSummary = summarizeTemplateResults(allTemplateResults);
  const responsibilitySummary =
    summarizeResponsibilityResults(allResponsibilityResults);

  const componentsBySeverity = {
    warning: allComponents.filter((c) => c.highestSeverity === "WARNING").length,
    high: allComponents.filter((c) => c.highestSeverity === "HIGH").length,
    critical: allComponents.filter((c) => c.highestSeverity === "CRITICAL").length,
  };

  const totalFindings =
    lifecycleSummary.totalWarnings +
    templateSummary.totalWarnings +
    responsibilitySummary.totalWarnings +
    allComponents.reduce((sum, c) => sum + c.issues.length, 0);
  const warningDensity =
    allComponents.length > 0 ? totalFindings / allComponents.length : 0;
  const componentsWithDominantIssue =
    diagnosticSummaryRaw.componentDiagnostics.filter(
      (d) => d.dominantIssue !== null
    ).length;
  const dominantRatio =
    allComponents.length > 0
      ? componentsWithDominantIssue / allComponents.length
      : 0;

  const componentScore = computeComponentScore({
    componentsBySeverity,
    warningDensity,
  });

  const overallScore = Number(
    (
      (componentScore.score +
        lifecycleSummary.averageScore +
        templateSummary.averageScore +
        responsibilitySummary.averageScore) /
      4
    ).toFixed(1)
  );

  let riskLevel = "Low";
  if (overallScore < 4) {
    riskLevel = "High";
  } else if (overallScore < 7) {
    riskLevel = "Medium";
  }
  if (riskLevel === "Medium" && overallScore < 5 && warningDensity > 2) {
    riskLevel = "High";
  }
  if (
    riskLevel === "Medium" &&
    overallScore < 7 &&
    warningDensity > RISK_WARNING_DENSITY_HIGH_THRESHOLD
  ) {
    riskLevel = "High";
  }
  if (
    riskLevel === "Low" &&
    overallScore < 6 &&
    dominantRatio > RISK_DOMINANT_RATIO_THRESHOLD
  ) {
    riskLevel = "Medium";
  }

  const topProblematicComponents = sortComponentsByImpact(
    allComponents,
    allTemplateResults,
    allResponsibilityResults,
    diagnosticSummaryRaw.componentDiagnostics,
    getDiagnosticRiskScore
  ).slice(0, TOP_PROBLEMATIC_COUNT);

  const topLifecycleRisks = [...allLifecycleResults]
    .filter(
      (r) =>
        r.warnings.some((w) => w.confidence !== "low") || r.score < 6
    )
    .sort((a, b) => {
      const severityDelta =
        getHighestWarningSeverityRank(b) - getHighestWarningSeverityRank(a);
      if (severityDelta !== 0) return severityDelta;
      const confidenceDelta =
        getHighestWarningConfidenceRank(b) - getHighestWarningConfidenceRank(a);
      if (confidenceDelta !== 0) return confidenceDelta;
      return a.score - b.score || b.warnings.length - a.warnings.length;
    })
    .slice(0, TOP_RISKS_COUNT);

  const manualReviewResults = [...allLifecycleResults]
    .filter((r) => r.warnings.some((w) => w.confidence === "low"))
    .sort((a, b) => a.score - b.score || b.warnings.length - a.warnings.length)
    .slice(0, MANUAL_REVIEW_COUNT);

  const topTemplateRisks = [...allTemplateResults]
    .filter(
      (r) =>
        r.hasTemplate &&
        (r.warnings.some((w) => w.confidence !== "low") || r.score < 6)
    )
    .sort((a, b) => {
      const aSeverity = Math.max(
        ...a.warnings.map((w) => getTemplateSeverityRank(w.severity)),
        -1
      );
      const bSeverity = Math.max(
        ...b.warnings.map((w) => getTemplateSeverityRank(w.severity)),
        -1
      );
      if (bSeverity !== aSeverity) return bSeverity - aSeverity;
      return a.score - b.score || b.warnings.length - a.warnings.length;
    })
    .slice(0, TOP_RISKS_COUNT);

  const topResponsibilityRisks = [...allResponsibilityResults]
    .filter(
      (r) =>
        r.warnings.some((w) => w.confidence !== "low") || r.score < 6
    )
    .sort((a, b) => {
      const aSeverity = Math.max(
        ...a.warnings.map((w) => getTemplateSeverityRank(w.severity)),
        -1
      );
      const bSeverity = Math.max(
        ...b.warnings.map((w) => getTemplateSeverityRank(w.severity)),
        -1
      );
      if (bSeverity !== aSeverity) return bSeverity - aSeverity;
      return a.score - b.score || b.warnings.length - a.warnings.length;
    })
    .slice(0, TOP_RISKS_COUNT);

  const cleanupStats: CleanupStats = {
    verifiedCleanupTargets: allLifecycleResults.filter(
      (r) => r.signals.verifiedCleanupCount > 0
    ).length,
    totalLifecycleTargets: allLifecycleResults.length,
    likelyUnmanagedSubscriptions: allLifecycleResults.filter((r) =>
      r.warnings.some(
        (w) =>
          w.code === "SUBSCRIPTION_WITHOUT_DESTROY" &&
          w.confidence === "high" &&
          (w.severity === "high" || w.severity === "critical")
      )
    ).length,
  };

  const dominantIssueCounts: Record<DominantIssueType, number> = {
    TEMPLATE_HEAVY_COMPONENT: 0,
    GOD_COMPONENT: 0,
    CLEANUP_RISK_COMPONENT: 0,
    ORCHESTRATION_HEAVY_COMPONENT: 0,
    LIFECYCLE_RISKY_COMPONENT: 0,
  };
  const roleCounts: Record<
    import("../diagnostic/diagnostic-models").ComponentRole,
    number
  > = {
    page: 0,
    container: 0,
    detail: 0,
    player: 0,
    form: 0,
    list: 0,
    viewer: 0,
    editor: 0,
    widget: 0,
    layout: 0,
    modal: 0,
    unknown: 0,
  };
  for (const d of diagnosticSummaryRaw.componentDiagnostics) {
    if (d.dominantIssue) {
      dominantIssueCounts[d.dominantIssue]++;
    }
    if (d.componentRole) {
      roleCounts[d.componentRole]++;
    }
  }

  const detectedFamilies = detectFamilies({
    workspacePath,
    components: allComponents,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
    lifecycleByPath: allLifecycleByPath,
  } satisfies FamilyDetectionInput);

  const componentFamilies = detectComponentFamilyInsights({
    workspacePath,
    components: allComponents,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
    lifecycleByPath: allLifecycleByPath,
  } satisfies FamilyDetectionInput);

  const featurePatterns = detectFeaturePatterns({
    workspacePath,
    components: allComponents,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
    lifecycleByPath: allLifecycleByPath,
  });

  const hotspotFamilies = detectedFamilies.filter(
    (f) =>
      f.commonDominantIssue &&
      f.members.length >= 2 &&
      f.members.filter((m) => m.dominantIssue === f.commonDominantIssue)
        .length >=
        f.members.length * 0.5
  );

  const EXTRACTION_MIN_CONFIDENCE = 0.6;
  const EXTRACTION_MIN_CONFIDENCE_SMALL = 0.7;
  const SMALL_GROUP_SIZE = 3;
  const extractionCandidates = detectedFamilies
    .filter((f) => {
      if (f.isWeakGrouping) return false;
      const isSmall = f.members.length <= SMALL_GROUP_SIZE;
      const minScore = isSmall ? 5 : 4;
      const minConf = isSmall ? EXTRACTION_MIN_CONFIDENCE_SMALL : EXTRACTION_MIN_CONFIDENCE;
      return (
        f.extractionScore >= minScore &&
        (f.confidence ?? 0) >= minConf
      );
    })
    .slice(0, 5);

  let projectBreakdown: ProjectBreakdownItem[];
  let otherMinorClusters: ProjectBreakdownItem[] | undefined;

  if (projectResults.length > 1) {
    projectBreakdown = projectResults.map((p) => ({
      sourceRoot: p.sourceRoot,
      components: p.components.length,
      componentsWithFindings: p.warningCount,
      componentFindings: p.components.reduce((s, c) => s + c.issues.length, 0),
      lifecycleTargets: p.lifecycleResults.length,
      lifecycleFindings: p.lifecycleResults.reduce(
        (sum, r) => sum + r.warnings.length,
        0
      ),
      templateFindings: p.templateResults.reduce(
        (sum, r) => sum + r.warnings.length,
        0
      ),
      responsibilityFindings: p.responsibilityResults.reduce(
        (sum, r) => sum + r.warnings.length,
        0
      ),
    }));
  } else {
    const p = projectResults[0]!;
    const lifecycleByPathLocal = new Map(
      p.lifecycleResults.map((r) => [normalizePathForMatch(r.filePath), r] as const)
    );
    const componentsWithAnalyses = p.components.map((c, i) => ({
      filePath: c.filePath,
      componentFindings: c.issues.length,
      lifecycleFindings: lifecycleByPathLocal.get(normalizePathForMatch(c.filePath))?.warnings.length ?? 0,
      templateFindings: p.templateResults[i]?.warnings.length ?? 0,
      responsibilityFindings: p.responsibilityResults[i]?.warnings.length ?? 0,
    }));
    const breakdownResult = getFeatureBreakdownItems(
      componentsWithAnalyses,
      topProblematicComponents.map((c) => c.filePath)
    );
    projectBreakdown = breakdownResult.items;
    otherMinorClusters = breakdownResult.otherMinorClusters;
  }

  const workspaceSummary: WorkspaceSummary = {
    projectCount: projectResults.length,
    componentCount: allComponents.length,
    riskLevel,
    totalFindings,
  };

  const scores: Scores = {
    overall: overallScore,
    component: componentScore,
    lifecycle: enrichExplainedScore(lifecycleSummary.explainedScore),
    template: enrichExplainedScore(templateSummary.explainedScore),
    responsibility: enrichExplainedScore(responsibilitySummary.explainedScore),
  };

  const diagnosticSummary: DiagnosticSummary = {
    componentsWithDominantIssue,
    totalComponents: allComponents.length,
    dominantIssueCounts,
    topCrossCuttingRisks: diagnosticSummaryRaw.topCrossCuttingRisks,
    roleCounts,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
  };

  const lifecycleSection: LifecycleSection = {
    summary: lifecycleSummary,
    topRisks: topLifecycleRisks,
    manualReview: manualReviewResults,
    cleanupStats,
  };

  const templateSection: TemplateSection = {
    summary: templateSummary,
    topRisks: topTemplateRisks,
  };

  const responsibilitySection: ResponsibilitySection = {
    summary: responsibilitySummary,
    topRisks: topResponsibilityRisks,
  };

  const commonWarnings = computeCommonWarnings(
    allComponents,
    allLifecycleResults,
    allTemplateResults,
    allResponsibilityResults
  );

  const ruleViolationCounts = computeAllRuleViolationCounts(
    allComponents,
    allLifecycleResults,
    allTemplateResults,
    allResponsibilityResults
  );

  const ruleToAffectedComponents = computeRuleToAffectedComponents(
    allComponents,
    allLifecycleResults,
    allTemplateResults,
    allResponsibilityResults
  );

  const refactorTasks = computeRefactorTasks({
    components: allComponents,
    templateResults: allTemplateResults,
    responsibilityResults: allResponsibilityResults,
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
  });

  const result: ScanResult = {
    workspacePath,
    generatedAt: new Date().toISOString(),
    workspaceSummary,
    scores,
    projectBreakdown,
    otherMinorClusters,
    breakdownMode: selectBreakdownMode(projectInfos, sourceRoots),
    topProblematicComponents,
    diagnosticSummary,
    similarComponentFamilies: detectedFamilies,
    repeatedArchitectureHotspots: hotspotFamilies,
    extractionCandidates,
    lifecycle: lifecycleSection,
    template: templateSection,
    responsibility: responsibilitySection,
    commonWarnings,
    ruleViolationCounts,
    ruleToAffectedComponents,
    warningsAndRecommendations: [],
    // Full analyzer outputs for reporting/export pipelines.
    allComponents,
    allLifecycleResults,
    allTemplateResults,
    allResponsibilityResults,
    componentsBySeverity,
    refactorPlan: {
      whatToFixFirst: [],
      quickWins: [],
      familyRefactorStrategies: [],
      componentDecompositionHints: [],
      architectureRefactorPlan: [],
    },
    refactorTasks,
    architectureHotspots: [],
    familyRefactorPlaybooks: [],
    architectureRoadmap: [],
    featurePatterns,
    componentFamilies,
  };

  result.warningsAndRecommendations = buildWarningsAndRecommendations(result);
  validateMetricsConsistency(result);
  result.refactorPlan = computeRefactorPlan(result);
  const intelligence = computeArchitectureIntelligence(result);
  result.architectureHotspots = intelligence.architectureHotspots;
  result.familyRefactorPlaybooks = intelligence.familyRefactorPlaybooks;
  result.architectureRoadmap = intelligence.architectureRoadmap;
  result.refactorROI = intelligence.refactorROI;
  result.architectureSmells = intelligence.architectureSmells;
  result.architectureSmellSummary = intelligence.architectureSmellSummary;
  if (result.refactorPlan) {
    result.refactorPlan.architectureRefactorPlan =
      intelligence.architectureRefactorPlan;
  }
  result.refactorBlueprints = computeRefactorBlueprints(result);
  result.structureConcerns = computeStructureConcerns({
    componentPaths: allComponents.map((c) => c.filePath),
    componentDiagnostics: diagnosticSummaryRaw.componentDiagnostics,
    workspacePath,
  });

  const snapshot = createAnalysisSnapshot(result);
  const validation = validateSnapshotParity(snapshot);
  if (!validation.valid) {
    throw new ModulensError(
      "Snapshot parity validation failed. Fix metrics before release.",
      "SNAPSHOT_VALIDATION_FAILED",
      validation
    );
  }
  return snapshot;
}
