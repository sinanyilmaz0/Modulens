export type CanonicalTermId =
  | "finding"
  | "issue"
  | "violation"
  | "concern"
  | "smell"
  | "dominantIssue"
  | "patternFamily"
  | "repeatedImplementation"
  | "extractionOpportunity"
  | "refactorTarget"
  | "topRiskComponent"
  | "affectedComponent";

export interface CanonicalTerm {
  id: CanonicalTermId;
  singular: string;
  plural: string;
  /** Short label suitable for headings / column titles */
  label: string;
  /** Optional helper / tooltip copy */
  description?: string;
}

export const TERMS: Record<CanonicalTermId, CanonicalTerm> = {
  finding: {
    id: "finding",
    singular: "finding",
    plural: "findings",
    label: "Findings",
    description: "Individual rule results detected in your project.",
  },
  issue: {
    id: "issue",
    singular: "issue",
    plural: "issues",
    label: "Issues",
    description:
      "Component-level problem groups that aggregate related findings.",
  },
  violation: {
    id: "violation",
    singular: "violation",
    plural: "violations",
    label: "Rule violations",
    description:
      "Rule-level violations; often one-to-one or many-to-one with findings.",
  },
  concern: {
    id: "concern",
    singular: "structural concern",
    plural: "structural concerns",
    label: "Structural concerns",
    description:
      "Architecture or folder-level structural problems that impact maintainability.",
  },
  smell: {
    id: "smell",
    singular: "architecture smell",
    plural: "architecture smells",
    label: "Architecture smells",
    description:
      "Higher-level architecture smells derived from multiple findings and concerns.",
  },
  dominantIssue: {
    id: "dominantIssue",
    singular: "dominant issue",
    plural: "dominant issues",
    label: "Dominant issues",
    description:
      "The most impactful issue per component based on severity and scope.",
  },
  patternFamily: {
    id: "patternFamily",
    singular: "pattern family",
    plural: "pattern families",
    label: "Pattern families",
    description:
      "Groups of components that implement the same high-level feature pattern.",
  },
  repeatedImplementation: {
    id: "repeatedImplementation",
    singular: "repeated implementation",
    plural: "repeated implementations",
    label: "Repeated implementations",
    description:
      "Similar or identical implementations repeated across multiple components.",
  },
  extractionOpportunity: {
    id: "extractionOpportunity",
    singular: "extraction opportunity",
    plural: "extraction opportunities",
    label: "Extraction opportunities",
    description:
      "Places where shared behavior can be extracted into a dedicated abstraction.",
  },
  refactorTarget: {
    id: "refactorTarget",
    singular: "refactor target",
    plural: "refactor targets",
    label: "Refactor targets",
    description:
      "Concrete files, components, or abstractions proposed as part of the refactor plan.",
  },
  topRiskComponent: {
    id: "topRiskComponent",
    singular: "top risk component",
    plural: "top risk components",
    label: "Top risk components",
    description:
      "Components with the highest combined impact, risk, and complexity scores.",
  },
  affectedComponent: {
    id: "affectedComponent",
    singular: "affected component",
    plural: "affected components",
    label: "Affected components",
    description:
      "Components impacted by a particular issue, finding, or refactor target.",
  },
};

/** Primary noun per high-level view/tab for consistent copy. */
export const VIEW_PRIMARY_TERMS = {
  rules: TERMS.finding,
  components: TERMS.issue,
  structure: TERMS.concern,
  patterns: TERMS.patternFamily,
  refactorPlan: TERMS.refactorTarget,
} as const;

export type SeverityId = "critical" | "high" | "medium" | "low";

export interface SeverityBadge {
  id: SeverityId;
  label: string;
  description?: string;
}

export const SEVERITY_BADGES: Record<SeverityId, SeverityBadge> = {
  critical: {
    id: "critical",
    label: "Critical",
    description:
      "Highest impact issues that should be addressed as a priority.",
  },
  high: {
    id: "high",
    label: "High",
    description: "High impact issues with clear negative consequences.",
  },
  medium: {
    id: "medium",
    label: "Medium",
    description:
      "Moderate-impact issues that are worth fixing but rarely urgent.",
  },
  low: {
    id: "low",
    label: "Low",
    description:
      "Low-impact issues and minor style or structure improvements.",
  },
};

export type RecommendationId = "reviewRecommended" | "signalOnly";

export interface RecommendationBadge {
  id: RecommendationId;
  label: string;
  description?: string;
}

export const RECOMMENDATION_BADGES: Record<
  RecommendationId,
  RecommendationBadge
> = {
  reviewRecommended: {
    id: "reviewRecommended",
    label: "Review recommended",
    description: "Worth a manual review to decide on changes.",
  },
  signalOnly: {
    id: "signalOnly",
    label: "Signal only",
    description:
      "Weak or contextual signal; use it as input, not a mandatory change.",
  },
};

export type ConfidenceId = "high" | "medium" | "weakSignal";

export interface ConfidenceBadge {
  id: ConfidenceId;
  label: string;
  description?: string;
}

export const CONFIDENCE_BADGES: Record<ConfidenceId, ConfidenceBadge> = {
  high: {
    id: "high",
    label: "High confidence",
    description:
      "Backed by strong evidence and multiple consistent signals in the analysis.",
  },
  medium: {
    id: "medium",
    label: "Medium confidence",
    description:
      "Reasonable confidence based on partial evidence or heuristics.",
  },
  weakSignal: {
    id: "weakSignal",
    label: "Weak signal",
    description:
      "Preliminary or noisy signal; treat as a hint, not a hard rule.",
  },
};

export interface OverviewSummaryParams {
  totalFindings: number;
  totalComponents: number;
  criticalIssues: number;
  topRiskComponents: number;
}

export interface PatternsSummaryParams {
  patternFamilies: number;
  repeatedImplementations: number;
  extractionOpportunities: number;
}

export interface StructureSummaryParams {
  structuralConcerns: number;
  affectedModules: number;
  sharedDependencies: number;
}

export interface PlannerSummaryParams {
  refactorTargets: number;
  extractionOpportunities: number;
  affectedComponents: number;
}

export const summaryTemplates = {
  overview(params: OverviewSummaryParams): string {
    const { totalFindings, totalComponents, criticalIssues, topRiskComponents } =
      params;
    return `This project has ${totalFindings} findings across ${totalComponents} components, with ${criticalIssues} critical issues concentrated in ${topRiskComponents} top risk components.`;
  },
  patterns(params: PatternsSummaryParams): string {
    const { patternFamilies, repeatedImplementations, extractionOpportunities } =
      params;
    return `We detected ${patternFamilies} pattern families and ${repeatedImplementations} repeated implementations, suggesting ${extractionOpportunities} extraction opportunities for shared abstractions.`;
  },
  structure(params: StructureSummaryParams): string {
    const { structuralConcerns, affectedModules, sharedDependencies } = params;
    return `The architecture shows ${structuralConcerns} structural concerns, mostly affecting ${affectedModules} modules and ${sharedDependencies} shared dependencies.`;
  },
  planner(params: PlannerSummaryParams): string {
    const { refactorTargets, extractionOpportunities, affectedComponents } =
      params;
    return `The refactor plan proposes ${refactorTargets} refactor targets addressing ${extractionOpportunities} extraction opportunities in ${affectedComponents} affected components.`;
  },
} as const;

export const EMPTY_STATES = {
  patterns: {
    noRepeatedImplementations: "No repeated implementations detected.",
    noStrongExtractionCandidates: "No strong extraction opportunities found.",
  },
  structure: {
    noSignificantConcerns: "No significant structural concerns detected.",
    noHighRiskIssues:
      "Structure checks did not find high-risk issues in this project.",
  },
  rules: {
    noFindingsForScope: "No rule findings for this scope.",
    ruleHasNoFindings:
      "This rule has no findings in the current project state.",
  },
} as const;

