import type { DominantIssueType } from "../diagnostic/diagnostic-models";
import type { FocusedDecompositionSuggestion } from "../angular/intelligence/decomposition/decomposition-models";

export interface RefactorPlan {
  whatToFixFirst: RefactorPriorityItem[];
  quickWins: RefactorQuickWin[];
  familyRefactorStrategies: FamilyRefactorStrategy[];
  componentDecompositionHints: ComponentDecompositionHint[];
  architectureRefactorPlan: ArchitectureRefactorPlanItem[];
  /** Phase-aware top refactor targets, enriched with sequencing-aware copy. */
  topRefactorTargets?: TopRefactorTarget[];
  /** Phase-aware extraction opportunities, enriched with sequencing-aware copy. */
  extractionOpportunities?: ExtractionOpportunity[];
}

export interface RefactorPriorityItem {
  id: string;
  type: "component" | "family";
  filePath?: string;
  familyName?: string;
  description: string;
  impact: number;
  effort: number;
  effortImpactRatio: number;
  source: "lifecycle" | "template" | "responsibility" | "extraction";
}

export interface RefactorQuickWin {
  filePath?: string;
  familyName?: string;
  shortDescription: string;
  reason: string;
}

export interface FamilyRefactorStrategy {
  familyName: string;
  memberCount: number;
  memberFilePaths: string[];
  extractionScore: number;
  patternSummary: string;
  likelySharedConcerns: string[];
  suggestedExtractionTargets: string[];
  suggestedAngularStructure: string;
  suggestedRefactorSteps: string[];
  expectedBenefits: string[];
  suggestedCommonExtraction?: string;
  suggestedServiceBaseAbstraction?: string;
  suggestedComponentSplitDirection?: string;
}

export interface ComponentDecompositionHint {
  filePath: string;
  fileName: string;
  lineCount: number;
  separableBlocks: string[];
  suggestedSplit: string;
  confidence: "low" | "medium" | "high";
  familyContext?: string;
  suggestedBlockDecomposition?: string[];
  familySpecificHints?: string[];
  decompositionSuggestion?: FocusedDecompositionSuggestion;
  expectedImpactPercent?: number;
}

export type ImpactBand = "Very High" | "High" | "Medium" | "Low";

export interface ImpactBreakdown {
  componentCountWeight: number;
  avgLineCountWeight: number;
  warningDensityWeight: number;
  dominantIssueWeight: number;
  repeatedPatternWeight: number;
}

export interface ArchitectureHotspot {
  familyName: string;
  componentCount: number;
  avgLineCount: number;
  dominantIssue: DominantIssueType | null;
  warningDensity: number;
  impactScore: number;
  normalizedImpactScore?: number;
  impactBand?: ImpactBand;
  hotspotReasons?: string[];
  impactBreakdown?: ImpactBreakdown;
  estimatedFixImpact: number;
  estimatedWarningsAffected?: number;
  estimatedComponentsAffected?: number;
  estimatedIssueCoveragePercent?: number;
  roiDisclaimer?: string;
  suggestedRefactor: string[];
  commonIssues: string[];
  playbookSummary: string;
  extractionScore: number;
  memberFilePaths: string[];
  detectedRolePattern?: string;
  roleDescription?: string;
  recommendedArchitectureBlueprint?: string;
}

export interface RefactorROI {
  familyName: string;
  affectedComponents: number;
  warningsReduced: number;
  percentageOfTotalIssues: number;
}

export interface ArchitectureRefactorPlanItem {
  familyName: string;
  impactScore: number;
  normalizedImpactScore?: number;
  impactBand?: string;
  percentageOfTotalIssues: number;
  whyFirst?: string[];
}

export interface FamilyRefactorPlaybook {
  familyName: string;
  patternSummary: string;
  likelySharedConcerns: string[];
  suggestedExtractionTargets: string[];
  suggestedAngularStructure: string;
  refactorSteps: string[];
  expectedBenefits: string[];
}

export interface ArchitectureRoadmapItem {
  rank: number;
  familyName: string;
  reason: string;
  impact: "high" | "medium" | "low";
  suggestedAction: string;
  componentCount: number;
}

export interface RefactorBlueprint {
  targetName: string;
  targetType: "component" | "family";
  currentProblem: string;
  proposedShape: string[];
  stateOwnership: string[];
  serviceBoundaries: string[];
  uiBoundaries: string[];
  migrationSteps: string[];
}

export type ImpactLevel = "Low" | "Medium" | "High";
export type EffortLevel = "Small" | "Medium" | "Large";
export type BulkFixPotential = "Medium" | "High";

/** Phase label for refactor planning */
export type RefactorPhase = 1 | 2 | 3 | 4;

/** ROI / coordination label for refactor targets */
export type RoiLabel = "High ROI" | "Medium ROI" | "Low coordination" | "Cross-cutting";

/** Batch / coordination labels for phase-aware planning */
export type CoordinationLabel =
  | "Phase 1"
  | "Phase 2"
  | "Phase 3"
  | "Phase 4"
  | "Cross-cutting"
  | "Low coordination"
  | "Team-wide"
  | "Needs review"
  | "Safe starting point";

/** Top refactor target: a critical component to refactor first */
export interface TopRefactorTarget {
  componentName: string;
  filePath: string;
  shortPath?: string;
  lineCount: number;
  dependencyCount: number;
  dominantIssue: DominantIssueType | null;
  suggestedRefactor: string;
  refactorSteps: string[];
  possibleExtractions: string[];
  impact: ImpactLevel;
  effort: EffortLevel;
  rankingReason?: string;
  /** 0–100 composite priority score */
  priorityScore?: number;
  /** Human-readable explanation of why this is prioritized */
  whyPrioritized?: string;
  /** Phase label for execution order */
  phase?: RefactorPhase;
  /** ROI or coordination label */
  roiLabel?: RoiLabel;
  /** Why this item is in this phase */
  whyInThisPhase?: string;
  /** Why do before/after other work */
  whyBeforeAfter?: string;
  /** Coordination labels for chip display */
  coordinationLabels?: CoordinationLabel[];
  /** Pattern group ID when multiple targets share same refactor steps */
  patternGroupId?: string;
  /** Number of targets in this pattern group */
  patternGroupSize?: number;
  /** Human-readable pattern label (e.g. "Template logic extraction") */
  patternLabel?: string;
  /** Component-specific one-liner (e.g. "1200 LOC, 8 deps; consider extracting X") */
  componentSpecificNote?: string;
  /** Family name when target belongs to a detected family */
  familyName?: string;
  /** Other component names in same group with same family (for "Same family as X" chip) */
  sameFamilyComponentNames?: string[];
  /** Optional role confidence score reused for planner copy and chips */
  roleConfidence?: number;
  /** Coordination cost for planning (Low / Medium / High) */
  coordinationCost?: "Low" | "Medium" | "High";
}

/** Extraction type for ROI display */
export type ExtractionType = "shared-component" | "facade" | "service" | "utility";

/** Duplication level for ROI display */
export type DuplicationLevel = "low" | "medium" | "high";

/** Extraction opportunity: repeated architecture pattern across components */
export interface ExtractionOpportunity {
  patternName: string;
  componentCount: number;
  whyThisMatters: string;
  recommendedExtractions: string[];
  affectedComponents: string[];
  /** Short sentence on expected benefit */
  expectedBenefit?: string;
  /** Confidence score 0-1 for confidence-aware copy */
  confidence?: number;
  /** Always Phase 3 — shared extractions, cross-cutting */
  phase: 3;
  /** Why this is in Phase 3 */
  whyInThisPhase?: string;
  /** Coordination labels for chip display */
  coordinationLabels?: CoordinationLabel[];
  /** Extraction type for ROI display (shared component / facade / service / utility) */
  extractionType?: ExtractionType;
  /** Shared duplication level based on component count */
  duplicationLevel?: DuplicationLevel;
}

/** Quick win category type for classification */
export type QuickWinCategoryType =
  | "subscription_cleanup"
  | "missing_teardown"
  | "simple_split"
  | "repeated_utility_extraction"
  | "replace_duplicated_helper"
  | "rename_move_low_risk"
  | "trackby_fix"
  | "other";

/** Eligibility factors for quick win scoring (1-5 scale: 1=best, 5=worst) */
export interface QuickWinEligibilityFactors {
  effort: number;
  coordinationScope: number;
  confidence: number;
  blastRadius: number;
  reversibility: number;
  automationPotential: number;
  filesAffected: number;
}

/** Quick win catalog item: small refactor with affected count */
export interface QuickWinCatalogItem {
  issueName: string;
  affectedCount: number;
  explanation: string;
  suggestedFix: string;
  bulkFixPotential?: BulkFixPotential;
  whyMatters?: string;
  categoryType?: QuickWinCategoryType;
  quickWinRationale?: string;
  eligibilityScore?: number;
  passesValidation?: boolean;
  /** Always Phase 1 — quick, low-coordination wins */
  phase: 1;
  /** Why this is in Phase 1 */
  whyInThisPhase?: string;
  /** Coordination labels for chip display */
  coordinationLabels?: CoordinationLabel[];
}
