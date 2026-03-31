import type { ScanResult } from "../../core/scan-result";
import {
  buildTopRefactorTargets,
  buildExtractionOpportunities,
  buildQuickWinCatalog,
} from "../../refactor/refactor-planner";
import { getProjectForPath } from "../report-view-model";
import { getConfidenceBucket } from "../../confidence/confidence-labels";
import { buildComponentsExplorerItems } from "./presenter-component-map";

export interface SectionData {
  id: string;
  title: string;
  description?: string;
  items?: unknown[];
  data?: Record<string, unknown>;
}

/**
 * Prepares view-ready section data from ScanResult.
 * Filters are applied client-side in HTML; we attach data-project for filtering.
 */
export function prepareSections(result: ScanResult): SectionData[] {
  const extractionNames = new Set(result.extractionCandidates.map((f) => f.familyName));
  const familiesExcludingExtraction = result.similarComponentFamilies.filter(
    (f) => !extractionNames.has(f.familyName)
  );
  const hotspotsExcludingExtraction = result.repeatedArchitectureHotspots.filter(
    (f) => !extractionNames.has(f.familyName)
  );

  const allFeaturePatterns = result.featurePatterns ?? [];
  const strongFeaturePatterns = allFeaturePatterns.filter((p) => {
    const confidence = p.confidence ?? 0.5;
    const bucket = getConfidenceBucket(confidence);
    return bucket === "high";
  });

  const dc = result.diagnosticSummary.dominantIssueCounts;

  return [
    {
      id: "refactor-blueprints",
      title: "Refactor Blueprints",
      description: "Architectural guidance for high-risk components and repeated families. No code generation—actionable architecture only.",
      items: (result.refactorBlueprints ?? []).map((b) => {
        const task =
          b.targetType === "component"
            ? (result.refactorTasks ?? []).find(
                (t) => t.componentName === b.targetName
              )
            : undefined;
        const project = task?.filePath
          ? getProjectForPath(task.filePath, result.projectBreakdown)
          : null;
        return { ...b, project };
      }),
    },
    {
      id: "refactor-first",
      title: "Refactor First",
      description: "Top 10 prioritized refactors by impact and effort.",
      items: (result.refactorTasks ?? []).slice(0, 10).map((t) => ({
        ...t,
        project: t.filePath ? getProjectForPath(t.filePath, result.projectBreakdown) : null,
      })),
    },
    {
      id: "scores",
      title: "Health Score",
      data: {
        scores: result.scores,
        riskLevel: result.workspaceSummary.riskLevel,
        featurePatternCount: result.featurePatterns?.length ?? 0,
        reusableOpportunities: result.featurePatterns?.filter((p) => p.duplicationRisk === "high").length ?? 0,
      },
    },
    {
      id: "diagnostic-summary",
      title: "Diagnostic Summary",
      data: {
        componentsWithDominantIssue: result.diagnosticSummary.componentsWithDominantIssue,
        totalComponents: result.diagnosticSummary.totalComponents,
        dominantIssueCounts: dc,
      },
    },
    {
      id: "architecture-smells",
      title: "Architecture Smells",
      description: "High-level architecture patterns detected from component and family analysis.",
      items: result.architectureSmells ?? [],
      data: { architectureSmellSummary: result.architectureSmellSummary ?? null },
    },
    {
      id: "feature-patterns",
      title: "Feature Patterns",
      description: "Detected recurring feature architectures. Opportunities for reusable modules.",
      items: strongFeaturePatterns,
    },
    {
      id: "architecture-patterns",
      title: "Repeated Architecture Patterns",
      description: "Component families with shared architecture problems and refactor opportunities. Detected by naming, directory, role, and evidence patterns.",
      items: result.componentFamilies ?? [],
    },
    {
      id: "top-refactor-targets",
      title: "Top Refactor Targets",
      description: "Highest-impact components to refactor first. Prioritized by severity, size, and finding count. Each card explains why it is prioritized and suggests concrete steps.",
      items: buildTopRefactorTargets(result).map((t) => ({
        ...t,
        project: getProjectForPath(t.filePath, result.projectBreakdown),
      })),
    },
    {
      id: "extraction-opportunities",
      title: "Extraction Opportunities",
      description: "Shared patterns across components. Extract once and fix multiple components at the same time — avoid fixing each one individually.",
      items: buildExtractionOpportunities(result),
    },
    {
      id: "quick-wins",
      title: "Quick Wins",
      description: "Start here — low effort, high impact. Mechanical fixes that often apply across many components.",
      items: buildQuickWinCatalog(result),
    },
    {
      id: "top-cross-cutting",
      title: "Top Cross-Cutting Risks",
      items: result.diagnosticSummary.topCrossCuttingRisks.map((d) => ({
        ...d,
        project: getProjectForPath(d.filePath, result.projectBreakdown),
      })),
    },
    {
      id: "similar-families",
      title: "Similar Component Families",
      description: "Families with similar patterns and structure. Lower extraction priority.",
      items: familiesExcludingExtraction.map((f) => ({
        ...f,
        project: f.members[0] ? getProjectForPath(f.members[0].filePath, result.projectBreakdown) : null,
      })),
    },
    {
      id: "hotspots",
      title: "Repeated Architecture Hotspots",
      items: hotspotsExcludingExtraction.map((f) => ({
        ...f,
        project: f.members[0] ? getProjectForPath(f.members[0].filePath, result.projectBreakdown) : null,
      })),
    },
    {
      id: "extraction-candidates",
      title: "Extraction Candidates",
      description: "High-value families for extraction. Large components, repeated architecture.",
      items: result.extractionCandidates.map((f) => ({
        ...f,
        project: f.members[0] ? getProjectForPath(f.members[0].filePath, result.projectBreakdown) : null,
      })),
    },
    {
      id: "top-problematic",
      title: "Top Problematic Components",
      items: result.topProblematicComponents.map((c) => ({
        ...c,
        project: getProjectForPath(c.filePath, result.projectBreakdown),
      })),
    },
    {
      id: "components-explorer",
      title: "Component Explorer",
      items: buildComponentsExplorerItems(result),
      data: {
        totalComponents: result.workspaceSummary.componentCount,
      },
    },
    {
      id: "component-risks",
      title: "Component Risks",
      data: {
        template: result.template.topRisks.map((r) => ({
          ...r,
          project: getProjectForPath(r.filePath, result.projectBreakdown),
        })),
        lifecycle: result.lifecycle.topRisks.map((r) => ({
          ...r,
          project: getProjectForPath(r.filePath, result.projectBreakdown),
        })),
        responsibility: result.responsibility.topRisks.map((r) => ({
          ...r,
          project: getProjectForPath(r.filePath, result.projectBreakdown),
        })),
      },
    },
    {
      id: "common-warnings",
      title: "Common Findings",
      items: result.commonWarnings,
    },
  ];
}
