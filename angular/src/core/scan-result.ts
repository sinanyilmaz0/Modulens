import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { LifecycleAnalysisResult, LifecycleSummary } from "../angular/analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult, TemplateSummary } from "../angular/analyzers/template/template-models";
import type { ResponsibilityAnalysisResult, ResponsibilitySummary } from "../angular/analyzers/responsibility/responsibility-models";
import type {
  ComponentDiagnostic,
  ComponentRole,
  DominantIssueType,
} from "../diagnostic/diagnostic-models";
import type { ComponentFamily } from "../angular/family/family-models";
import type { ComponentFamilyInsight } from "../angular/family/component-family-insight-models";
import type {
  RefactorPlan,
  ArchitectureHotspot,
  FamilyRefactorPlaybook,
  ArchitectureRoadmapItem,
  RefactorROI,
  RefactorBlueprint,
} from "../refactor/refactor-plan-models";
import type { RefactorTask } from "../refactor/refactor-task-models";
import type {
  ArchitectureSmell,
  ArchitectureSmellSummary,
} from "../angular/intelligence/architecture-smell";
import type { FeaturePattern } from "../angular/intelligence/feature-pattern";
import type { StructureAnalysisResult } from "./structure-models";

export interface WorkspaceSummary {
  projectCount: number;
  componentCount: number;
  riskLevel: string;
  /** Total individual findings across all rules (component + lifecycle + template + responsibility). */
  totalFindings: number;
}

export interface ScoreFactor {
  name: string;
  weight: number;
  contribution: number;
  description: string;
}

export interface ExplainedScore {
  score: number;
  factors: ScoreFactor[];
  /** Short user-facing explanation of main score drivers */
  shortExplanation?: string;
}

export interface Scores {
  overall: number;
  component: ExplainedScore;
  lifecycle: ExplainedScore;
  template: ExplainedScore;
  responsibility: ExplainedScore;
}

export interface ProjectBreakdownItem {
  sourceRoot: string;
  components: number;
  /** Components with ≥1 finding in this project/cluster. */
  componentsWithFindings: number;
  /** Sum of component issues (c.issues.length) in this project/cluster. Used for total findings. */
  componentFindings?: number;
  lifecycleTargets: number;
  lifecycleFindings: number;
  templateFindings: number;
  responsibilityFindings: number;
  /** For merged groups (e.g. infrastructure): path segments for getProjectForPath matching */
  pathSegments?: string[];
}

export interface DiagnosticSummary {
  componentsWithDominantIssue: number;
  totalComponents: number;
  dominantIssueCounts: Record<DominantIssueType, number>;
  topCrossCuttingRisks: ComponentDiagnostic[];
  roleCounts?: Record<ComponentRole, number>;
  componentDiagnostics?: ComponentDiagnostic[];
}

export interface CleanupStats {
  verifiedCleanupTargets: number;
  totalLifecycleTargets: number;
  likelyUnmanagedSubscriptions: number;
}

export interface LifecycleSection {
  summary: LifecycleSummary;
  topRisks: LifecycleAnalysisResult[];
  manualReview: LifecycleAnalysisResult[];
  cleanupStats: CleanupStats;
}

export interface TemplateSection {
  summary: TemplateSummary;
  topRisks: TemplateAnalysisResult[];
}

export interface ResponsibilitySection {
  summary: ResponsibilitySummary;
  topRisks: ResponsibilityAnalysisResult[];
}

export interface CommonWarning {
  code: string;
  count: number;
}

export type BreakdownMode = "project" | "feature-area" | "source-root" | "package";

export interface ScanResult {
  workspacePath: string;
  generatedAt: string;
  workspaceSummary: WorkspaceSummary;
  scores: Scores;
  projectBreakdown: ProjectBreakdownItem[];
  /** Minor clusters within "other" (feature mode only); shown when user expands other card */
  otherMinorClusters?: ProjectBreakdownItem[];
  breakdownMode?: BreakdownMode;
  topProblematicComponents: ComponentAnalysisResult[];
  diagnosticSummary: DiagnosticSummary;
  similarComponentFamilies: ComponentFamily[];
  repeatedArchitectureHotspots: ComponentFamily[];
  extractionCandidates: ComponentFamily[];
  lifecycle: LifecycleSection;
  template: TemplateSection;
  responsibility: ResponsibilitySection;
  commonWarnings: CommonWarning[];
  /** Per-rule violation counts for Rules page. Keys are rule IDs (e.g. component-size, LARGE_TEMPLATE). */
  ruleViolationCounts: Record<string, number>;
  /** Per-rule affected component file paths for Rules page workspace impact. Keys are rule IDs. */
  ruleToAffectedComponents?: Record<string, string[]>;
  warningsAndRecommendations: string[];
  /**
   * Full analyzer outputs for all analyzed components/targets.
   * Used by reporting/export pipelines to avoid relying solely on topRisks/topProblematicComponents.
   * Optional for backward compatibility with older snapshots.
   */
  allComponents?: ComponentAnalysisResult[];
  allLifecycleResults?: LifecycleAnalysisResult[];
  allTemplateResults?: TemplateAnalysisResult[];
  allResponsibilityResults?: ResponsibilityAnalysisResult[];
  /** Components whose highest severity falls into each bucket (component-level, not finding-level). */
  componentsBySeverity: {
    warning: number;
    high: number;
    critical: number;
  };
  refactorPlan?: RefactorPlan;
  refactorTasks?: RefactorTask[];
  architectureHotspots?: ArchitectureHotspot[];
  familyRefactorPlaybooks?: FamilyRefactorPlaybook[];
  architectureRoadmap?: ArchitectureRoadmapItem[];
  refactorROI?: RefactorROI[];
  architectureSmells?: ArchitectureSmell[];
  architectureSmellSummary?: ArchitectureSmellSummary;
  featurePatterns?: FeaturePattern[];
  componentFamilies?: ComponentFamilyInsight[];
  refactorBlueprints?: RefactorBlueprint[];
  structureConcerns?: StructureAnalysisResult;
}
