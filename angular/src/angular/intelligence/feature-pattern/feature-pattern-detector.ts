import * as fs from "fs";
import type { ComponentAnalysisResult } from "../../analyzers/component-analyzer";
import type { LifecycleAnalysisResult } from "../../analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult } from "../../analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../../analyzers/responsibility/responsibility-models";
import type { ComponentDiagnostic } from "../../../diagnostic/diagnostic-models";
import { resolveTemplateContent } from "../../analyzers/template/template-analyzer";
import { TEMPLATE_SIGNALS, COMPONENT_SIGNALS } from "../role-detection/role-heuristics";
import { FAMILY_STRATEGY_TEMPLATES } from "../../../refactor/family-strategy-templates";
import {
  FEATURE_PATTERN_DEFINITIONS,
  type FeaturePatternDefinition,
} from "./feature-pattern-taxonomy";
import type { FeaturePattern, FeaturePatternType, DuplicationRisk } from "./feature-pattern-models";
import {
  computeGroupConfidence,
  SIMILARITY_THRESHOLD,
  type SimilarityCandidate,
} from "./similarity-engine";

export interface FeaturePatternDetectionInput {
  workspacePath: string;
  components: ComponentAnalysisResult[];
  componentDiagnostics: ComponentDiagnostic[];
  templateResults: TemplateAnalysisResult[];
  responsibilityResults: ResponsibilityAnalysisResult[];
  lifecycleByPath: Map<string, LifecycleAnalysisResult>;
}

const PATTERN_TO_FAMILY_SUFFIX: Record<FeaturePatternType, string> = {
  PLAYER_FEATURE_PATTERN: "*-fragment-player",
  DETAIL_PAGE_PATTERN: "*-detail",
  CONTENT_PUBLISH_PATTERN: "*-publish",
  LIST_PAGE_PATTERN: "*-list",
  FRAGMENT_MANAGEMENT_PATTERN: "*-manage-fragments",
};

function getTemplateContent(componentPath: string): string | null {
  try {
    const resolved = resolveTemplateContent(componentPath);
    return resolved?.content ?? null;
  } catch {
    return null;
  }
}

function matchesFileNamePatterns(fileName: string, patterns: RegExp[]): boolean {
  const baseName = fileName.replace(/\.component\.ts$/i, "");
  return patterns.some((p) => p.test(baseName));
}

function hasTemplateSignal(
  def: FeaturePatternDefinition,
  templateContent: string | null,
  templateResult: TemplateAnalysisResult | undefined,
  componentContent: string
): boolean {
  const { templateSignals } = def;
  if (templateSignals.mediaElement && templateContent) {
    if (!TEMPLATE_SIGNALS.video.test(templateContent) && !TEMPLATE_SIGNALS.audio.test(templateContent)) {
      return false;
    }
  }
  if (templateSignals.formGroup && templateContent) {
    if (!TEMPLATE_SIGNALS.formGroup.test(templateContent) && !TEMPLATE_SIGNALS.ngForm.test(templateContent)) {
      return false;
    }
  }
  if (templateSignals.ngForMin != null && templateResult) {
    const ngForCount = (templateResult.metrics?.ngForCount ?? 0) + (templateResult.metrics?.atForCount ?? 0);
    if (ngForCount < templateSignals.ngForMin) return false;
  }
  if (templateSignals.activatedRoute && !COMPONENT_SIGNALS.activatedRoute.test(componentContent)) {
    return false;
  }
  return true;
}

function hasResponsibilitySignals(
  def: FeaturePatternDefinition,
  responsibilityResult: ResponsibilityAnalysisResult | undefined
): boolean {
  const sigs = def.responsibilitySignals;
  if (!sigs) return true;
  if (sigs.formGroupCountMin != null) {
    const count = responsibilityResult?.metrics?.formGroupCount ?? 0;
    if (count < sigs.formGroupCountMin) return false;
  }
  if (sigs.formBuilderUsage && !responsibilityResult?.metrics?.formBuilderUsage) {
    return false;
  }
  if (sigs.routerUsage && !responsibilityResult?.metrics?.routerUsage) {
    return false;
  }
  return true;
}

function matchesPattern(
  def: FeaturePatternDefinition,
  diagnostic: ComponentDiagnostic,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined,
  templateContent: string | null,
  componentContent: string
): boolean {
  if (!matchesFileNamePatterns(diagnostic.fileName, def.fileNamePatterns)) {
    return false;
  }

  if (def.requiredRole || def.acceptedRoles) {
    const role = diagnostic.componentRole;
    const roleConfidence = diagnostic.roleConfidence ?? 0;
    if (!role || role === "unknown") return false;
    if (roleConfidence < 0.5) return false;
    if (def.requiredRole && role !== def.requiredRole) return false;
    if (def.acceptedRoles && def.acceptedRoles.length > 0 && !def.acceptedRoles.includes(role)) {
      return false;
    }
  }

  const roleSignals = diagnostic.roleSignals ?? [];
  const requiredMatchCount = Math.ceil(def.requiredSignals.length * 0.5);
  if (def.requiredSignals.length > 0) {
    const matched = def.requiredSignals.filter((s) => roleSignals.includes(s)).length;
    if (matched < requiredMatchCount) {
      if (def.patternType === "FRAGMENT_MANAGEMENT_PATTERN") {
        const hasModalSignal = roleSignals.some(
          (s) => s === "mat-dialog-modal" || s === "modal-drawer-usage"
        );
        if (!hasModalSignal && def.dominantIssueHints?.length) {
          const hasDominantHint = def.dominantIssueHints.includes(
            diagnostic.dominantIssue as Parameters<typeof def.dominantIssueHints.includes>[0]
          );
          if (!hasDominantHint) return false;
        }
      } else {
        return false;
      }
    }
  }

  if (!hasTemplateSignal(def, templateContent, templateResult, componentContent)) {
    return false;
  }

  if (!hasResponsibilitySignals(def, responsibilityResult)) {
    return false;
  }

  return true;
}

function getDuplicationRisk(instanceCount: number): DuplicationRisk {
  if (instanceCount >= 4) return "high";
  if (instanceCount >= 3) return "medium";
  return "low";
}

function getStrategyForPattern(patternType: FeaturePatternType): {
  architecturalPattern: string;
  recommendation: string;
  suggestedRefactor: string[];
  sharedSignals: string[];
} {
  const familySuffix = PATTERN_TO_FAMILY_SUFFIX[patternType];
  const template = FAMILY_STRATEGY_TEMPLATES[familySuffix];

  if (template) {
    const architecturalPattern = template.suggestedAngularStructure;
    const recommendation = template.suggestedComponentSplitDirection ?? "Extract shared logic.";
    const suggestedRefactor =
      template.suggestedRefactorSteps?.length > 0
        ? template.suggestedRefactorSteps
        : template.suggestedExtractionTargets.map((t) => `Extract ${t}`);
    const sharedSignals = template.likelySharedConcerns;
    return { architecturalPattern, recommendation, suggestedRefactor, sharedSignals };
  }

  const fallbacks: Record<FeaturePatternType, { pattern: string; recommendation: string; refactor: string[] }> = {
    PLAYER_FEATURE_PATTERN: {
      pattern: "Player Page + Controls + Timeline + PlayerStateService",
      recommendation: "Extract reusable player module",
      refactor: [
        "Extract shared player shell",
        "Move playback logic to shared service/facade",
        "Isolate feature-specific rendering slots",
      ],
    },
    DETAIL_PAGE_PATTERN: {
      pattern: "Detail Layout + Data Loader + Metadata",
      recommendation: "Extract shared detail layout and data loading",
      refactor: ["Create shared detail module", "Extract BaseDetailService", "Extract EntityDetailContainer"],
    },
    CONTENT_PUBLISH_PATTERN: {
      pattern: "Form Container + Upload + Metadata Forms",
      recommendation: "Extract shared publish/form module",
      refactor: ["Create shared publish module", "Extract form builder logic", "Extract upload component"],
    },
    LIST_PAGE_PATTERN: {
      pattern: "List Container + Filter/Search + Pagination",
      recommendation: "Extract shared list module",
      refactor: ["Create shared list module", "Extract list container", "Extract filter component"],
    },
    FRAGMENT_MANAGEMENT_PATTERN: {
      pattern: "Container + list/editor/modal + ManageFragmentsService",
      recommendation: "Extract fragment management service",
      refactor: ["Extract ManageFragmentsService", "Split list/editor/modal", "Decompose template blocks"],
    },
  };

  const fb = fallbacks[patternType];
  return {
    architecturalPattern: fb.pattern,
    recommendation: fb.recommendation,
    suggestedRefactor: fb.refactor,
    sharedSignals: ["repeated architecture", "similar structure"],
  };
}

export function detectFeaturePatterns(input: FeaturePatternDetectionInput): FeaturePattern[] {
  const {
    components,
    componentDiagnostics,
    templateResults,
    responsibilityResults,
  } = input;

  const results: FeaturePattern[] = [];
  const seenFilePaths = new Set<string>();

  let componentContentCache: Map<string, string> | null = null;
  let templateContentCache: Map<string, string | null> | null = null;

  function getComponentContent(filePath: string): string {
    if (!componentContentCache) {
      componentContentCache = new Map();
      for (const c of components) {
        try {
          componentContentCache.set(c.filePath, fs.readFileSync(c.filePath, "utf-8"));
        } catch {
          componentContentCache.set(c.filePath, "");
        }
      }
    }
    return componentContentCache.get(filePath) ?? "";
  }

  function getTemplateContentCached(filePath: string): string | null {
    if (!templateContentCache) {
      templateContentCache = new Map();
      for (const c of components) {
        templateContentCache.set(c.filePath, getTemplateContent(c.filePath));
      }
    }
    return templateContentCache.get(filePath) ?? null;
    }

  const componentByPath = new Map(components.map((c) => [c.filePath, c]));
  const templateByPath = new Map(
    components.map((c, i) => [c.filePath, templateResults[i]])
  );
  const responsibilityByPath = new Map(
    components.map((c, i) => [c.filePath, responsibilityResults[i]])
  );

  for (const def of FEATURE_PATTERN_DEFINITIONS) {
    const matches: Array<{
      diagnostic: ComponentDiagnostic;
      templateResult: TemplateAnalysisResult | undefined;
      responsibilityResult: ResponsibilityAnalysisResult | undefined;
    }> = [];

    for (const diagnostic of componentDiagnostics) {
      if (seenFilePaths.has(diagnostic.filePath)) continue;

      const templateResult = templateByPath.get(diagnostic.filePath);
      const responsibilityResult = responsibilityByPath.get(diagnostic.filePath);
      const templateContent = getTemplateContentCached(diagnostic.filePath);
      const componentContent = getComponentContent(diagnostic.filePath);

      if (
        matchesPattern(
          def,
          diagnostic,
          templateResult,
          responsibilityResult,
          templateContent,
          componentContent
        )
      ) {
        matches.push({ diagnostic, templateResult, responsibilityResult });
      }
    }

    if (matches.length < def.minInstanceCount) continue;

    const candidates: SimilarityCandidate[] = matches.map((m) => ({
      fileName: m.diagnostic.fileName,
      className: m.diagnostic.className,
      roleSignals: m.diagnostic.roleSignals ?? [],
      componentRole: m.diagnostic.componentRole,
      roleConfidence: m.diagnostic.roleConfidence,
      templateMetrics: m.templateResult?.metrics,
      responsibilityMetrics: m.responsibilityResult?.metrics,
    }));

    const avgSimilarity = computeGroupConfidence(candidates);
    if (avgSimilarity < SIMILARITY_THRESHOLD) continue;

    const expectedSignals = def.requiredSignals.length || 1;
    const matchedSignals = Array.from(new Set(candidates.flatMap((c) => c.roleSignals)));
    const signalRatio = Math.min(1, matchedSignals.length / Math.max(1, expectedSignals));
    const confidence = Math.min(1, (signalRatio * 0.5 + avgSimilarity * 0.5));

    const strategy = getStrategyForPattern(def.patternType);

    const featurePattern: FeaturePattern = {
      patternType: def.patternType,
      featureName: def.featureName,
      instanceCount: matches.length,
      confidence: Math.round(confidence * 100) / 100,
      components: matches.map((m) => {
        const cn = m.diagnostic.className;
        if (cn) return cn;
        const base = m.diagnostic.fileName.replace(/\.component\.ts$/i, "");
        return base.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("") + "Component";
      }),
      filePaths: matches.map((m) => m.diagnostic.filePath),
      sharedSignals: strategy.sharedSignals,
      architecturalPattern: strategy.architecturalPattern,
      duplicationRisk: getDuplicationRisk(matches.length),
      recommendation: strategy.recommendation,
      suggestedRefactor: strategy.suggestedRefactor,
    };

    results.push(featurePattern);
    for (const m of matches) {
      seenFilePaths.add(m.diagnostic.filePath);
    }
  }

  return results.sort((a, b) => b.instanceCount - a.instanceCount);
}
