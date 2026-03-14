import type { ComponentAnalysisResult } from "../../analyzers/component-analyzer";
import type { TemplateAnalysisResult } from "../../analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../../analyzers/responsibility/responsibility-models";
import type { ComponentDiagnostic, DominantIssueType } from "../../../diagnostic/diagnostic-models";
import type { ComponentRole } from "../role-detection/role-models";
import { resolveTemplateContent } from "../../analyzers/template/template-analyzer";
import { TEMPLATE_SIGNALS, COMPONENT_SIGNALS } from "../role-detection/role-heuristics";
import type { FocusedDecompositionSuggestion } from "./decomposition-models";
import type { HeuristicExtraction } from "./decomposition-models";
import {
  DEFAULT_DECOMPOSITION_PLANNER_CONFIG,
  type DecompositionPlannerConfig,
} from "./decomposition-models";
import { HEURISTIC_EXTRACTIONS } from "./decomposition-heuristics";
import {
  EXTRACTION_PRIORITY_ORDER,
  hasEvidenceForExtraction,
  buildExtractionEvidenceContext,
} from "./decomposition-evidence";
import {
  extractComponentPrefix,
  generateComponentName,
  buildServiceName,
} from "./decomposition-naming";
import type { ContributingSignal } from "../../../confidence/confidence-models";
import { normalizeConfidence } from "../../../confidence/confidence-normalizer";

const TARGET_DOMINANT_ISSUES = new Set<DominantIssueType>([
  "GOD_COMPONENT",
  "TEMPLATE_HEAVY_COMPONENT",
  "ORCHESTRATION_HEAVY_COMPONENT",
]);

const MIN_LINE_COUNT = 600;
const MIN_CLUSTER_SCORE = 4;
const TEMPLATE_HEAVY_LINES = 200;
const FORM_CONTROL_THRESHOLD = 5;
const ORCHESTRATION_DEPS_THRESHOLD = 6;
const ORCHESTRATION_SERVICE_THRESHOLD = 4;

export interface DecompositionEngineInput {
  components: ComponentAnalysisResult[];
  componentDiagnostics: ComponentDiagnostic[];
  templateResults: TemplateAnalysisResult[];
  responsibilityResults: ResponsibilityAnalysisResult[];
}

function getTotalClusterScore(diagnostic: ComponentDiagnostic): number {
  return Object.values(diagnostic.clusterScores).reduce((a, b) => a + b, 0);
}

function isTargetComponent(
  component: ComponentAnalysisResult,
  diagnostic: ComponentDiagnostic
): boolean {
  if (component.lineCount <= MIN_LINE_COUNT) return false;
  if (!diagnostic.dominantIssue || !TARGET_DOMINANT_ISSUES.has(diagnostic.dominantIssue)) {
    return false;
  }
  const clusterScore = getTotalClusterScore(diagnostic);
  return clusterScore > MIN_CLUSTER_SCORE;
}

function getTemplateContent(filePath: string): string | null {
  const resolved = resolveTemplateContent(filePath);
  return resolved?.content ?? null;
}

function hasMediaPlayerSignals(
  filePath: string,
  componentContent: string,
  componentRole?: ComponentRole,
  roleSignals?: string[]
): boolean {
  const templateContent = getTemplateContent(filePath);
  if (templateContent && (TEMPLATE_SIGNALS.video.test(templateContent) || TEMPLATE_SIGNALS.audio.test(templateContent))) {
    return true;
  }
  if (componentContent && COMPONENT_SIGNALS.playerService.test(componentContent)) {
    return true;
  }
  if (componentRole === "player") return true;
  if (roleSignals?.some((s) => s === "video-audio-element" || s === "media-player-service")) {
    return true;
  }
  return false;
}

function getComponentContent(filePath: string): string {
  try {
    const fs = require("fs");
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function detectHeuristics(
  input: DecompositionEngineInput,
  filePath: string,
  diagnostic: ComponentDiagnostic,
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined
): HeuristicExtraction[] {
  const heuristics: HeuristicExtraction[] = [];
  const componentContent = getComponentContent(filePath);

  const templateLines = templateResult?.metrics?.lineCount ?? 0;
  if (templateLines > TEMPLATE_HEAVY_LINES) {
    heuristics.push(HEURISTIC_EXTRACTIONS.template_heavy);
  }

  const hasMediaPlayer = hasMediaPlayerSignals(
    filePath,
    componentContent,
    diagnostic.componentRole,
    diagnostic.roleSignals
  );
  if (hasMediaPlayer) {
    heuristics.push(HEURISTIC_EXTRACTIONS.media_player);
  }

  const formBuilderUsage = responsibilityResult?.metrics?.formBuilderUsage ?? false;
  const formGroupCount = responsibilityResult?.metrics?.formGroupCount ?? 0;
  const formControlCount = responsibilityResult?.metrics?.formControlCount ?? 0;
  if (formBuilderUsage || formGroupCount >= 2 || formControlCount >= FORM_CONTROL_THRESHOLD) {
    heuristics.push(HEURISTIC_EXTRACTIONS.form);
  }

  const depCount = component.dependencyCount;
  const serviceOrchestration = responsibilityResult?.metrics?.serviceOrchestrationCount ?? 0;
  const routerUsage = responsibilityResult?.metrics?.routerUsage ?? false;
  if (
    depCount >= ORCHESTRATION_DEPS_THRESHOLD ||
    serviceOrchestration >= ORCHESTRATION_SERVICE_THRESHOLD ||
    routerUsage
  ) {
    heuristics.push(HEURISTIC_EXTRACTIONS.orchestration);
  }

  return heuristics;
}

/** Service suffix priority: higher-value first */
const SERVICE_PRIORITY_ORDER = ["PlayerState", "FormState", "Data", "State"];

function filterAndPrioritizeExtractions(
  heuristics: HeuristicExtraction[],
  evidenceContext: ReturnType<typeof buildExtractionEvidenceContext>,
  config: DecompositionPlannerConfig
): { componentSuffixes: string[]; serviceSuffixes: string[]; architectureName: string } {
  const componentCandidates = new Set<string>();
  const serviceCandidates = new Set<string>();
  const architectureNames: string[] = [];

  const heuristicOrder = ["media_player", "form", "orchestration", "template_heavy"];
  const sorted = [...heuristics].sort(
    (a, b) => heuristicOrder.indexOf(a.type) - heuristicOrder.indexOf(b.type)
  );

  for (const h of sorted) {
    for (const s of h.componentSuffixes) {
      if (hasEvidenceForExtraction(s, evidenceContext)) {
        componentCandidates.add(s);
      }
    }
    for (const s of h.serviceSuffixes) {
      serviceCandidates.add(s);
    }
    architectureNames.push(h.architectureName);
  }

  const orderedComponents = EXTRACTION_PRIORITY_ORDER.filter((s) =>
    componentCandidates.has(s)
  );
  const cappedComponents = orderedComponents.slice(
    0,
    config.maxExtractedComponents
  );

  const orderedServices = Array.from(serviceCandidates).sort((a, b) => {
    const ia = SERVICE_PRIORITY_ORDER.indexOf(a);
    const ib = SERVICE_PRIORITY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const cappedServices = orderedServices.slice(0, config.maxExtractedServices);

  const primaryArch = architectureNames[0] ?? "Decomposition Architecture";
  const architectureName =
    architectureNames.length > 1
      ? `${primaryArch} + ${architectureNames.slice(1).join(", ")}`
      : primaryArch;

  return {
    componentSuffixes: cappedComponents,
    serviceSuffixes: cappedServices,
    architectureName,
  };
}

function assignStrategy(
  componentCount: number,
  serviceCount: number
): "minimal" | "moderate" | "aggressive" {
  const total = componentCount + serviceCount;
  if (total <= 2) return "minimal";
  if (total <= 4) return "moderate";
  return "aggressive";
}

function buildReasoning(
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined,
  heuristics: HeuristicExtraction[]
): string[] {
  const reasons: string[] = [];

  if (component.lineCount > 1000) {
    reasons.push("component exceeds 1000 lines");
  } else if (component.lineCount > 600) {
    reasons.push("component exceeds 600 lines");
  }

  const templateLines = templateResult?.metrics?.lineCount ?? 0;
  if (templateLines > 200) {
    reasons.push("template-heavy component");
  }

  const hasMediaPlayer = heuristics.some((h) => h.type === "media_player");
  if (hasMediaPlayer) {
    reasons.push("template contains complex playback UI");
    reasons.push("player state and UI are mixed");
  }

  const hasForm = heuristics.some((h) => h.type === "form");
  if (hasForm) {
    reasons.push("form orchestration mixed with presentation");
  }

  const hasOrchestration = heuristics.some((h) => h.type === "orchestration");
  if (hasOrchestration) {
    reasons.push("many dependencies and service orchestration");
  }

  return reasons.slice(0, 5);
}

function computeDecompositionConfidence(
  heuristics: HeuristicExtraction[],
  dominantIssue: DominantIssueType | null,
  componentRole: ComponentRole | undefined,
  lineCount: number
): { score: number; contributingSignals: ContributingSignal[] } {
  const heuristicCount3Plus = heuristics.length >= 3;
  const heuristicCount2 = heuristics.length === 2;
  const heuristicCount1 = heuristics.length === 1;

  const dominantMatch =
    dominantIssue === "GOD_COMPONENT" ||
    dominantIssue === "TEMPLATE_HEAVY_COMPONENT" ||
    dominantIssue === "ORCHESTRATION_HEAVY_COMPONENT";

  const roleMatch =
    (componentRole === "player" && heuristics.some((h) => h.type === "media_player")) ||
    (componentRole === "form" && heuristics.some((h) => h.type === "form")) ||
    (componentRole === "container" && heuristics.some((h) => h.type === "orchestration"));

  const lineCount1000Plus = lineCount > 1000;

  const contributingSignals: ContributingSignal[] = [
    { signal: "heuristic_count_3+", weight: 0.35, matched: heuristicCount3Plus, note: "3+ decomposition heuristics detected" },
    { signal: "heuristic_count_2", weight: 0.25, matched: heuristicCount2, note: "2 decomposition heuristics detected" },
    { signal: "heuristic_count_1", weight: 0.15, matched: heuristicCount1, note: "1 decomposition heuristic detected" },
    { signal: "dominant_issue_match", weight: 0.2, matched: dominantMatch, note: "Dominant issue aligns with decomposition target" },
    { signal: "role_heuristic_match", weight: 0.2, matched: roleMatch, note: "Component role aligns with heuristic type" },
    { signal: "line_count_1000+", weight: 0.1, matched: lineCount1000Plus, note: "Component exceeds 1000 lines" },
  ];

  const breakdown = normalizeConfidence(contributingSignals, {
    minEvidenceForHigh: 2,
    minEvidenceForVeryHigh: 3,
    minEvidenceForMax: 4,
  });

  return { score: breakdown.score, contributingSignals: breakdown.contributingSignals };
}

export function computeDecompositionSuggestions(
  input: DecompositionEngineInput,
  config: DecompositionPlannerConfig = DEFAULT_DECOMPOSITION_PLANNER_CONFIG
): Map<string, FocusedDecompositionSuggestion> {
  const result = new Map<string, FocusedDecompositionSuggestion>();
  const componentByPath = new Map(
    input.components.map((c) => [c.filePath, c] as const)
  );
  const templateByPath = new Map(
    input.templateResults.map((t) => [t.filePath, t] as const)
  );
  const responsibilityByPath = new Map(
    input.responsibilityResults.map((r) => [r.filePath, r] as const)
  );

  for (const diagnostic of input.componentDiagnostics) {
    const component = componentByPath.get(diagnostic.filePath);
    if (!component) continue;
    if (!isTargetComponent(component, diagnostic)) continue;

    const templateResult = templateByPath.get(diagnostic.filePath);
    const responsibilityResult = responsibilityByPath.get(diagnostic.filePath);

    const heuristics = detectHeuristics(
      input,
      diagnostic.filePath,
      diagnostic,
      component,
      templateResult,
      responsibilityResult
    );

    if (heuristics.length === 0) continue;

    const evidenceContext = buildExtractionEvidenceContext(
      diagnostic.filePath,
      templateResult?.metrics ?? null,
      component.dependencyCount,
      responsibilityResult?.metrics?.serviceOrchestrationCount ?? 0,
      responsibilityResult?.metrics?.routerUsage ?? false,
      responsibilityResult?.metrics
        ? {
            formBuilderUsage:
              responsibilityResult.metrics.formBuilderUsage ?? false,
            formGroupCount: responsibilityResult.metrics.formGroupCount ?? 0,
            formControlCount: responsibilityResult.metrics.formControlCount ?? 0,
          }
        : undefined
    );

    const filtered = filterAndPrioritizeExtractions(
      heuristics,
      evidenceContext,
      config
    );

    if (
      filtered.componentSuffixes.length === 0 &&
      filtered.serviceSuffixes.length === 0
    ) {
      continue;
    }

    const className =
      diagnostic.className ??
      component.fileName.replace(".component.ts", "").replace(/-/g, "");
    const prefix = extractComponentPrefix(className);

    const extractedComponents = filtered.componentSuffixes.map((s) =>
      generateComponentName(prefix, s)
    );
    const extractedServices = filtered.serviceSuffixes.map((s) =>
      buildServiceName(prefix, s)
    );

    const reasoning = buildReasoning(
      component,
      templateResult,
      responsibilityResult,
      heuristics
    );

    const { score: confidence, contributingSignals } = computeDecompositionConfidence(
      heuristics,
      diagnostic.dominantIssue,
      diagnostic.componentRole,
      component.lineCount
    );

    if (confidence < config.confidenceThreshold) continue;

    const strategy = assignStrategy(
      extractedComponents.length,
      extractedServices.length
    );

    const suggestion: FocusedDecompositionSuggestion = {
      originalComponent: className,
      suggestedArchitecture: filtered.architectureName,
      extractedComponents,
      extractedServices,
      reasoning,
      confidence,
      strategy,
      confidenceBreakdown: { score: confidence, contributingSignals },
    };

    result.set(diagnostic.filePath, suggestion);
  }

  return result;
}
