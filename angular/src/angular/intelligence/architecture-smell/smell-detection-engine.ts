import type { ScanResult } from "../../../core/scan-result";
import { FAMILY_STRATEGY_TEMPLATES } from "../../../refactor/family-strategy-templates";
import type {
  ArchitectureSmell,
  ArchitectureSmellSummary,
  ArchitectureSmellType,
  SmellSeverity,
} from "./architecture-smell-models";
import { runAllSmellHeuristics, type SmellMatch } from "./smell-heuristics";
import { getSmellDescription } from "./smell-storytelling";

function signalCountToConfidence(signalCount: number): number {
  if (signalCount >= 5) return 0.9;
  if (signalCount >= 4) return 0.85;
  if (signalCount >= 3) return 0.7;
  if (signalCount >= 2) return 0.5;
  return 0.35;
}

function computeSeverity(
  match: SmellMatch,
  result: ScanResult
): SmellSeverity {
  const affectedCount = match.affectedPaths.length;
  const totalFindings = result.workspaceSummary.totalFindings || 1;
  const warningsInAffected = match.affectedPaths.reduce((sum, fileName) => {
    const diag = (result.diagnosticSummary.componentDiagnostics ?? []).find(
      (d) => d.fileName === fileName
    );
    return sum + (diag?.totalWarningCount ?? 0);
  }, 0);
  const warningShare = warningsInAffected / totalFindings;

  let score = 0;
  if (affectedCount >= 5) score += 3;
  else if (affectedCount >= 3) score += 2;
  else if (affectedCount >= 1) score += 1;
  if (warningShare > 0.1) score += 2;
  else if (warningShare > 0.05) score += 1;
  if (match.signalCount >= 4) score += 2;
  else if (match.signalCount >= 3) score += 1;

  if (score >= 6) return "critical";
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function getSuggestedArchitectureAndActions(
  smellType: ArchitectureSmellType,
  relatedFamilies: string[]
): { suggestedArchitecture: string; suggestedRefactorActions: string[] } {
  const family = relatedFamilies[0];
  const template = family ? FAMILY_STRATEGY_TEMPLATES[family] : undefined;

  if (template) {
    const suggestedArchitecture =
      template.suggestedAngularStructure ??
      template.suggestedComponentSplitDirection ??
      "Consider splitting by responsibility.";
    const suggestedRefactorActions =
      template.suggestedRefactorSteps?.length > 0
        ? template.suggestedRefactorSteps
        : template.suggestedExtractionTargets?.map((t) => `Extract ${t}`) ?? [
            "Consider extracting shared logic.",
          ];
    return { suggestedArchitecture, suggestedRefactorActions };
  }

  const fallbacks: Record<ArchitectureSmellType, { arch: string; actions: string[] }> = {
    GOD_PAGE_SMELL: {
      arch: "PageContainer + DataLoaderService + Child components",
      actions: [
        "Extract data loading to service",
        "Split routing from presentation",
        "Extract UI sections to child components",
      ],
    },
    PLAYER_ORCHESTRATION_SMELL: {
      arch: "PlayerPage + PlayerControls + Timeline + PlayerStateService",
      actions: [
        "Extract playback state service",
        "Split controls/timeline/view",
        "Isolate listener ownership",
      ],
    },
    TEMPLATE_EXPLOSION_SMELL: {
      arch: "Extract template blocks to child components",
      actions: [
        "Extract repeated blocks to components",
        "Reduce nesting depth",
        "Move logic to methods or services",
      ],
    },
    CONTAINER_EXPLOSION_SMELL: {
      arch: "Thin container + child components + orchestration service",
      actions: [
        "Extract orchestration to service",
        "Split by responsibility",
        "Isolate state management",
      ],
    },
    REPEATED_DETAIL_PAGE_SMELL: {
      arch: "BaseDetailService + EntityDetailContainer + DetailLayoutComponent",
      actions: [
        "Extract shared detail layout",
        "Abstract data loading into service",
        "Split action panel / metadata / content sections",
      ],
    },
    FRAGMENT_MANAGEMENT_SMELL: {
      arch: "Container + list/editor/modal + ManageFragmentsService",
      actions: [
        "Split list/editor/modal",
        "Extract fragment management service",
        "Decompose template blocks",
      ],
    },
    FORM_ORCHESTRATION_SMELL: {
      arch: "Thin container + presentational form + BaseFormService",
      actions: [
        "Extract thin container",
        "Extract form builder logic",
        "Separate validation mapping",
      ],
    },
  };
  const fb = fallbacks[smellType];
  return {
    suggestedArchitecture: fb.arch,
    suggestedRefactorActions: fb.actions,
  };
}

export function computeArchitectureSmells(result: ScanResult): {
  architectureSmells: ArchitectureSmell[];
  architectureSmellSummary: ArchitectureSmellSummary;
} {
  const matches = runAllSmellHeuristics(result);
  const smells: ArchitectureSmell[] = [];
  const summary: ArchitectureSmellSummary = {
    totalSmells: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const match of matches) {
    const confidence = signalCountToConfidence(match.signalCount);
    const severity = computeSeverity(match, result);
    const { suggestedArchitecture, suggestedRefactorActions } =
      getSuggestedArchitectureAndActions(match.smellType, match.relatedFamilies);
    const description = getSmellDescription(match.smellType, {
      componentCount: match.affectedPaths.length,
      familyName: match.relatedFamilies[0],
      evidence: match.evidence,
    });

    smells.push({
      smellType: match.smellType,
      severity,
      confidence,
      description,
      affectedComponents: match.affectedPaths,
      relatedFamilies: match.relatedFamilies,
      evidence: match.evidence,
      suggestedArchitecture,
      suggestedRefactorActions,
    });

    summary.totalSmells++;
    if (severity === "critical") summary.critical++;
    else if (severity === "high") summary.high++;
    else if (severity === "medium") summary.medium++;
    else summary.low++;
  }

  smells.sort((a, b) => {
    const order: Record<SmellSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return order[b.severity] - order[a.severity] || b.confidence - a.confidence;
  });

  return { architectureSmells: smells, architectureSmellSummary: summary };
}
