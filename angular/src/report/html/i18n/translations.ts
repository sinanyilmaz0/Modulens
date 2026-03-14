/**
 * i18n translations for Modulens HTML report.
 * English only.
 */

export interface Translations {
  nav: {
    overview: string;
    components: string;
    patterns: string;
    rules: string;
    structure: string;
    refactorPlan: string;
    groupAnalysis?: string;
    groupReference?: string;
  };
  /** Shared confidence labels for all pages */
  confidenceLabels?: {
    high?: string;
    medium?: string;
    low?: string;
    reviewNeeded?: string;
  };
  /** Reusable tooltip explaining what confidence means */
  confidenceHelpText?: string;
  /** Bucket-specific tooltips */
  confidenceTooltips?: {
    high?: string;
    medium?: string;
    low?: string;
    reviewNeeded?: string;
  };
  overview: {
    title: string;
    fixFirst: string;
    topProblematic: string;
    repeatedPatterns: string;
    reportTitle: string;
    whatHurtsMost: string;
    projectBreakdown: string;
    featureAreaBreakdown?: string;
    packageBreakdown?: string;
    workspaceBreakdown: string;
    featureBreakdown: string;
    sourceRootBreakdown: string;
    otherAreas?: string;
    otherProjects?: string;
    sharedInfrastructure?: string;
    uncategorizedFeatureAreas?: string;
    minorClusters?: string;
    smallerFeatureAreas?: string;
    lowVolumeAreas?: string;
    minorAreasCount?: string;
    minorAreasIntro?: string;
    primaryPressureArea: string;
    mostAffectedStructure: string;
    dominantIssueZone: string;
    criticalComponents: string;
    dominantIssueCoverage: string;
    refactoringStrategy: string;
    recommendationPrefix: string;
    issueExplanation: {
      TEMPLATE_HEAVY_COMPONENT: string;
      GOD_COMPONENT: string;
      CLEANUP_RISK_COMPONENT: string;
      ORCHESTRATION_HEAVY_COMPONENT: string;
      LIFECYCLE_RISKY_COMPONENT: string;
    };
    dimensionTemplate: string;
    dimensionResponsibility: string;
    dimensionLifecycle: string;
    dimensionComponent: string;
    keyFindings: string;
    keyFindingCoverage: string;
    keyFindingDominant: string;
    keyFindingWorstProject: string;
    primaryPressure: string;
    lowSignalClustersMerged?: string;
    otherComponentsAcrossMinorAreas?: string;
    clickToExploreMinorAreas?: string;
    exploreMinorAreas?: string;
    otherFeatureAreas?: string;
    unclassified?: string;
    noDominantArea?: string;
    riskDistributed?: string;
    whatHurtsMostHelper?: string;
    breakdownHelper?: string;
    primaryPressureAreaHelper?: string;
    topProblematicHelper?: string;
    tableHeaderHelper?: string;
    refactoringStrategyHelper?: string;
    metricHintComponents?: string;
    metricHintWarnings?: string;
    metricHintCriticalComponents?: string;
    metricHintDominantIssueCoverage?: string;
    metricSecondaryComponents?: string;
    metricSecondaryWarnings?: string;
    metricSecondaryCriticalComponents?: string;
    metricSecondaryDominantIssueCoverage?: string;
    actionNavTitle?: string;
    actionExploreComponents?: string;
    actionReviewPatterns?: string;
    actionInspectStructure?: string;
    actionOpenRefactorPlan?: string;
    actionOpenComponents?: string;
    actionOpenPatterns?: string;
    mainDiagnosis?: string;
    /** @deprecated Use primarySymptom */
    primaryRisk?: string;
    primarySymptom?: string;
    /** @deprecated Use mostAffectedProject for workspace */
    mostAffectedArea?: string;
    mostAffectedProject?: string;
    mostAffectedForPattern?: string;
    /** @deprecated Use rootCause */
    mainReason?: string;
    rootCause?: string;
    firstAction?: string;
    expectedImpact?: string;
    expectedImpactValue?: string;
    hotspotsByProject?: string;
    metricGroupScale?: string;
    metricGroupRisk?: string;
    metricGroupQuality?: string;
    fixFirstHelper?: string;
    fixFirstShowMore?: string;
    fixFirstShowMoreOne?: string;
    noRepeatedPatternsGood?: string;
    ctaPrimaryTemplate?: string;
    ctaPrimaryOrchestration?: string;
    ctaPrimaryCritical?: string;
    topProblematicIntro?: string;
    actionViewDetailsShort?: string;
    hotspotsHelper?: string;
    scoreExplanation?: string;
    dominantIssueExplanation?: string;
    topRiskExplanation?: string;
    severityExplanation?: string;
  };
  hero: {
    workspaceHealth: string;
    workspaceHealthHelper?: string;
    scoreRingHelper?: string;
    components: string;
    warnings: string;
    hotspots: string;
    templateIndex: string;
  };
  impact: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
  refactorEffort: string;
  scores: {
    overallHealth: string;
    componentQuality: string;
    templateComplexity: string;
    lifecycleCleanup: string;
    responsibility: string;
    verdictNeedsAttention: string;
    verdictAcceptable: string;
    verdictGood: string;
    dimensionHelperComponentQuality?: string;
    dimensionHelperLifecycleCleanup?: string;
    dimensionHelperTemplateComplexity?: string;
    dimensionHelperResponsibility?: string;
  };
  issues: {
    TEMPLATE_HEAVY_COMPONENT: string;
    GOD_COMPONENT: string;
    CLEANUP_RISK_COMPONENT: string;
    ORCHESTRATION_HEAVY_COMPONENT: string;
    LIFECYCLE_RISKY_COMPONENT: string;
  };
  issueExplanations?: {
    TEMPLATE_HEAVY_COMPONENT: string;
    GOD_COMPONENT: string;
    CLEANUP_RISK_COMPONENT: string;
    ORCHESTRATION_HEAVY_COMPONENT: string;
    LIFECYCLE_RISKY_COMPONENT: string;
  };
  severity: {
    critical: string;
    high: string;
    warning: string;
    low: string;
  };
  priority: {
    fixNow: string;
    fixSoon: string;
    monitor: string;
  };
  effort: {
    low: string;
    medium: string;
    high: string;
  };
  actions: {
    viewDetails: string;
    viewPattern: string;
    exportReport: string;
    rerunAnalysis: string;
    resetFilters?: string;
    copySuccessPath?: string;
    copySuccessRefactor?: string;
    copySuccessStrategy?: string;
    copySuccessSteps?: string;
    copyFailed?: string;
    copyFailedAlert?: string;
  };
  empty: {
    noRefactorTasks: string;
    noPatterns: string;
    noComponents: string;
    noHotspots: string;
    noData: string;
    noMatchFilters?: string;
    noMatchFiltersHint?: string;
    noMatchFiltersDetail?: string;
    noRepeatedArchitecture?: string;
    noFeaturePatterns?: string;
  };
  drawer: {
    back?: string;
    summary: string;
    whyRisky: string;
    evidence: string;
    recommendedActions: string;
    firstExtractions: string;
    advancedDetails: string;
    component: string;
    lifecycle: string;
    template: string;
    responsibility: string;
    refactor: string;
    refactorDirection: string;
    path: string;
    componentRole: string;
    quickStats: string;
    whyFlagged: string;
    refactorPlan: string;
    evidenceGroups: string;
    fileContext: string;
    heuristicsDetails: string;
    sourceRoot: string;
    inferredFeatureArea: string;
    sizeEvidence: string;
    templateEvidence: string;
    responsibilityEvidence: string;
    lifecycleEvidence: string;
    suggestedArchitecture: string;
    suggestedComponents: string;
    suggestedServices: string;
    why: string;
    noDominantIssue: string;
    noDominantIssueExplanation: string;
    fallbackDiagnosis?: string;
    roleConfidenceLowHelper: string;
    decompositionConfidenceLowHelper: string;
    whyItMatters?: string;
    relatedConcerns?: string;
    expectedOutcome?: string;
    expectedOutcomeText?: string;
    nextSteps?: string;
    viewInComponents?: string;
    copyRefactor?: string;
    copyRefactorPlan?: string;
    copyPath?: string;
    openInPatterns?: string;
    openInRefactorPlan?: string;
    filterBySameSmell?: string;
    filterBySameProject?: string;
    suggestedFirstRefactor?: string;
    relatedRules?: string;
    similarComponents?: string;
    partOfFamily?: string;
    sharedRefactorOpportunity?: string;
    viewSupportingSignals?: string;
    expectedOutcomeByIssue?: Record<string, string>;
    drawerWhyThisClassification?: string;
    drawerRoleHeuristicHelper?: string;
  };
  evidence: {
    lineCount: string;
    constructorDependencies: string;
    methodCount: string;
    propertyCount: string;
    templateLineCount: string;
    structuralDirectiveCount: string;
    eventBindingCount: string;
    structuralDepth: string;
    subscriptionCount: string;
    timerUsage: string;
    eventListenerUsage: string;
    lifecycleHookCount: string;
    afterViewInitStatementCount: string;
    formGroupCount: string;
    serviceOrchestrationCount: string;
    dependencyCount: string;
  };
  evidenceUnits: Record<string, string>;
  /** Architecture smell type → user-facing label (internal key lookup) */
  architectureSmells?: Record<string, string>;
  /** Family pattern suffix → user-facing label (internal key lookup) */
  familyNames?: Record<string, string>;
  /** Feature pattern type → user-facing label (internal key lookup) */
  featurePatterns?: Record<string, string>;
  filters: {
    project: string;
    sourceRoot?: string;
    allProjects: string;
    allSourceRoots?: string;
    issueType: string;
    allTypes: string;
    severity: string;
    all: string;
    sortBy?: string;
    searchPlaceholder?: string;
    componentRole?: string;
    allRoles?: string;
    sortHighestRisk?: string;
    sortLineCount?: string;
    sortDependencyCount?: string;
    sortTemplateComplexity?: string;
    sortWarningCount?: string;
    sortName?: string;
    pageSize?: string;
  };
  structure: {
    sectionTitle: string;
    summaryTotalConcerns: string;
    summaryCategoriesTriggered: string;
    summaryMostCommon: string;
    summaryHighConfidence?: string;
    summaryMostAffectedArea?: string;
    summaryPrimarySmell?: string;
    mostCommonAccountsFor?: string;
    deepNesting: string;
    sharedDumpingRisk: string;
    genericFolderOveruse: string;
    suspiciousPlacement: string;
    featureBoundaryBlur: string;
    folderDensity: string;
    exploreDetails: string;
    viewDetails?: string;
    inspectFiles?: string;
    viewAffectedFiles?: string;
    viewAffectedFilesTooltip?: string;
    copyRefactor?: string;
    addToPlan?: string;
    recommendedFirstFix?: string;
    whyCommon?: string;
    confidenceHighDisplay?: string;
    confidenceMediumDisplay?: string;
    confidenceLowDisplay?: string;
    confidenceHighTooltip?: string;
    confidenceMediumTooltip?: string;
    confidenceLowTooltip?: string;
    whyItMatters: string;
    samplePaths: string;
    affectedAreas: string;
    refactorDirection: string;
    noConcernsDetected: string;
    noConcernsHelper: string;
    pageHelper?: string;
    confidenceLabel: string;
    confidenceLow: string;
    confidenceMedium: string;
    confidenceHigh: string;
    whyFlaggedHere: string;
    affectedAreasLabel: string;
    sectionWhyItMatters?: string;
    sectionDetectionLogic?: string;
    sectionSamplePaths?: string;
    sectionAffectedAreas?: string;
    sectionRefactorGuidance?: string;
    sectionWhenToIgnore?: string;
    sectionSuggestedNextStep?: string;
    whatToChange?: string;
    whatToAvoid?: string;
    refactorTarget?: string;
    filesAffected?: string;
    mainAreas?: string;
    filesAffectedAcrossAreas?: string;
    areaBreakdownUnavailable?: string;
    multipleAreasAffected?: string;
    repeatedSegments?: string;
    copyPath?: string;
    suggestedFixLabel?: string;
    sortBy?: string;
    sortByImpact?: string;
    sortByConfidence?: string;
    sortByAffectedFiles?: string;
    sortByConcernType?: string;
    filterArea?: string;
    filterConfidence?: string;
    filterImpact?: string;
    filterConcernType?: string;
    filterAllAreas?: string;
    filterAllConfidence?: string;
    filterAllImpact?: string;
    filterAllTypes?: string;
    suspiciousPlacementRefactorStory?: string;
    currentLocation?: string;
    likelyOwningFeature?: string;
    whySuspicious?: string;
    suggestedMove?: string;
    alsoFlaggedAs?: string;
    sectionRefactorOptions?: string;
    refactorOptionMoveToFeature?: string;
    refactorOptionShallowAPI?: string;
    refactorOptionWrapperOnly?: string;
    whenToUse?: string;
    ctaOpenAffectedComponents?: string;
    ctaOpenRefactorPlan?: string;
    ctaCopyMigrationStrategy?: string;
  };
  rules: {
    pageTitle: string;
    summaryTotalRules: string;
    summaryCategories: string;
    summaryTotalFindings?: string;
    summaryTotalFindingsHelper?: string;
    summaryTriggered?: string;
    summaryNotTriggered?: string;
    summaryMostTriggered: string;
    summaryMostTriggeredNone: string;
    pageIdentityPurpose?: string;
    pageIdentityContext?: string;
    pageIdentityAction?: string;
    categoryComponentSize: string;
    categoryTemplateComplexity: string;
    categoryResponsibilityGod: string;
    categoryLifecycleCleanup: string;
    categoryDependencyOrchestration: string;
    triggeredTimes: string;
    notTriggered: string;
    explanation: string;
    whyItMatters: string;
    badExample: string;
    goodExample: string;
    refactorDirection: string;
    viewDetails: string;
    collapse: string;
    filterCategory: string;
    filterSeverity: string;
    filterTriggered: string;
    filterSearch: string;
    showingCount: string;
    filterAll: string;
    pageHelper?: string;
    filterTriggeredOnly: string;
    filterNotTriggered: string;
    workspaceImpact?: string;
    topAffectedComponents?: string;
    viewTriggeredComponents?: string;
    openInComponents?: string;
    investigateRule?: string;
    topRulesToActOnFirst?: string;
    topRulesToActOnFirstHelper?: string;
    triggeredInComponents?: string;
    triggeredInComponentsPlural?: string;
    observedTimes?: string;
    suggestedAction?: string;
    commonFalsePositives?: string;
    openAffectedComponents?: string;
    sortBy?: string;
    sortByPriority?: string;
    sortByAffected?: string;
    sortByCount?: string;
    sortByCategory?: string;
    impactBandInformational?: string;
    impactBandLocalMaintainability?: string;
    impactBandCrossCutting?: string;
    impactBandBehaviorLeakRisk?: string;
  };
  planner: {
    title: string;
    topRefactorTargets: string;
    extractionOpportunities: string;
    quickWins: string;
    showMore: string;
    showMoreTargets?: string;
    copyRefactorSteps: string;
    openInComponents: string;
    openInPatterns: string;
    noExtractionClusters: string;
    noExtractionClustersHint?: string;
    noQuickWins: string;
    noQuickWinsWhy?: string;
    noQuickWinsReassurance?: string;
    noQuickWinsBestFirstStep?: string;
    noQuickWinsHint?: string;
    topRefactorTargetsDesc?: string;
    extractionOpportunitiesDesc?: string;
    quickWinsDesc?: string;
    planningSummaryTopTargets?: string;
    planningSummaryQuickWins?: string;
    planningSummaryExtractionGroups?: string;
    planningSummaryHighestRoi?: string;
    planningSummaryBestImmediateStart?: string;
    planningSummaryBestStartingPoint?: string;
    planningSummaryWhyStartHere?: string;
    planningSummaryWhatUnlocksLater?: string;
    planningSummaryHighestRoiLater?: string;
    planningSummaryPhase1Desc?: string;
    planningSummaryPhase2Desc?: string;
    planningSummaryPhase3Desc?: string;
    phase1Deliverable?: string;
    phase2Deliverable?: string;
    phase3Deliverable?: string;
    planningSummarySuggestedPhase?: string;
    planningSummaryPhase1?: string;
    planningSummaryPhase2?: string;
    planningSummaryPhase3?: string;
    planningSummaryFirstStepsTitle?: string;
    planningSummaryWhereToStart?: string;
    planningSummaryWhatComesNext?: string;
    planningSummaryCrossCutting?: string;
    planningSummaryOneLinerQuickExtract?: string;
    planningSummaryOneLinerTargetsExtract?: string;
    planningSummaryOneLinerTargets?: string;
    planningSummaryOneLinerEmpty?: string;
    sharesRefactorPatternWith?: string;
    sameFamilyAs?: string;
    sameStepsAsAbove?: string;
  };
  patterns: {
    title: string;
    repeatedArchitecture: string;
    featurePatterns: string;
    patternOverview: string;
    explore: string;
    workspaceContext: string;
    workspaceContextTotal: string;
    impactLow: string;
    impactMedium: string;
    impactHigh: string;
    drawerLinesLabel?: string;
    pagePurpose?: string;
    pagePurposeBullet1?: string;
    pagePurposeBullet2?: string;
    crossFamilyVsRepeatedFeatureExplanation?: string;
    crossFamilyShort?: string;
    repeatedFeatureShort?: string;
    dominantFamiliesTitle?: string;
    dominantFamiliesHelper?: string;
    repeatedArchitectureTitle?: string;
    repeatedArchitectureHelper?: string;
    repeatedFeatureImplementationsTitle?: string;
    repeatedFeatureImplementationsHelper?: string;
    repeatedArchitectureEmptyCompact?: string;
    repeatedArchitectureEmptyHint?: string;
    repeatedArchitectureEmptyNext?: string;
    repeatedFeatureEmptyCompact?: string;
    repeatedFeatureEmptyCompactLine2?: string;
    repeatedFeatureEmptyHint?: string;
    repeatedFeatureEmptyNext?: string;
    clickComponentToViewDetails?: string;
    ctaTitle?: string;
    ctaExploreComponents?: string;
    ctaRefactorPlan?: string;
    ctaReviewExtractionOpportunities?: string;
    ctaSeeInRefactorPlan?: string;
    viewDetails?: string;
    ctaOpenInComponents?: string;
    ctaCopyStrategy?: string;
    ctaOpenAffectedComponents?: string;
    ctaOpenRefactorTargets?: string;
    ctaCopyMigrationStrategy?: string;
    affectedArea?: string;
    extractionType?: string;
    architecturalPayoff?: string;
    relatedStructureIssues?: string;
    sameFamilyAsChip?: string;
    sharedRefactorHighlight?: string;
    shortExplanation: {
      TEMPLATE_HEAVY_COMPONENT: string;
      GOD_COMPONENT: string;
      CLEANUP_RISK_COMPONENT: string;
      ORCHESTRATION_HEAVY_COMPONENT: string;
      LIFECYCLE_RISKY_COMPONENT: string;
    };
    meaning: string;
    whyItMatters: string;
    refactorStrategy: string;
    componentsInPattern: string;
    featurePatternsHelper?: string;
    sharedSignalsHelper?: string;
    candidateComponents?: string;
    candidatesShort?: string;
    extractionAndStructure?: string;
    recommendedExtraction?: string;
    suggestedNewStructure?: string;
    sharedArchitectureSignals?: string;
    weakGroupingLabel?: string;
    weakGroupingHelper?: string;
  };
  patternExplanations: {
    TEMPLATE_HEAVY_COMPONENT: { meaning: string; whyItMatters: string; refactorStrategy: string };
    GOD_COMPONENT: { meaning: string; whyItMatters: string; refactorStrategy: string };
    CLEANUP_RISK_COMPONENT: { meaning: string; whyItMatters: string; refactorStrategy: string };
    ORCHESTRATION_HEAVY_COMPONENT: { meaning: string; whyItMatters: string; refactorStrategy: string };
    LIFECYCLE_RISKY_COMPONENT: { meaning: string; whyItMatters: string; refactorStrategy: string };
  };
  components: {
    title: string;
    component: string;
    path: string;
    mainIssue: string;
    risk: string;
    score: string;
    action: string;
    summaryShowing?: string;
    summaryOf?: string;
    summaryRange?: string;
    summaryHelper?: string;
    critical?: string;
    high?: string;
    rolePage?: string;
    roleContainer?: string;
    roleFeature?: string;
    roleShared?: string;
    roleUnknown?: string;
    noDominantIssue?: string;
    showHealthyComponents?: string;
    summaryProblematic?: string;
    summaryFlagged?: string;
    summarySortedBy?: string;
    healthyHidden?: string;
    filterHelper?: string;
    dominantIssueHelper?: string;
    clearAll?: string;
    clearAllFilters?: string;
    partOfFamily?: string;
    sharedRefactorOpportunity?: string;
    filteringBy?: string;
    healthyHiddenChip?: string;
    anomalyMetricsMissingLabel?: string;
    anomalyMetricsMissingHelper?: string;
    anomalySeverityInferredLabel?: string;
    anomalySeverityInferredHelper?: string;
    anomalyGenericLabel?: string;
    anomalyGenericHelper?: string;
    noSingleDominantIssue?: string;
    riskFromCombinedSignals?: string;
    multipleModerateIssuesElevated?: string;
    noSingleDominantButMultiRule?: string;
  };
  severityHint?: {
    critical: string;
    high: string;
    warning: string;
  };
}

export const en: Translations = {
  nav: {
    overview: "Overview",
    components: "Components",
    patterns: "Patterns",
    rules: "Rules",
    structure: "Structure",
    refactorPlan: "Refactor Plan",
    groupAnalysis: "Analysis",
    groupReference: "Reference",
  },
  confidenceLabels: {
    high: "High confidence",
    medium: "Review recommended",
    low: "Derived from code signals",
    reviewNeeded: "Best-effort classification",
  },
  confidenceHelpText:
    "Confidence reflects how strongly the analysis supports this finding. Low confidence = limited signals; verify before acting.",
  confidenceTooltips: {
    high: "Strong structural signal; reliable for prioritization",
    medium: "Likely issue; verify before refactoring",
    low: "Weak indicator; inspect context first",
    reviewNeeded: "Very weak signal; verify context before acting",
  },
  overview: {
    title: "Overview",
    fixFirst: "Fix First",
    topProblematic: "Top Problematic Components",
    repeatedPatterns: "Repeated Patterns",
    reportTitle: "Modulens Report",
    whatHurtsMost: "What hurts most?",
    projectBreakdown: "Project Breakdown",
    featureAreaBreakdown: "Feature Area Breakdown",
    packageBreakdown: "Package Breakdown",
    workspaceBreakdown: "Workspace Breakdown",
    featureBreakdown: "Feature Breakdown",
    sourceRootBreakdown: "Source Root Breakdown",
    otherAreas: "Other areas",
    otherProjects: "Other projects",
    sharedInfrastructure: "Shared & infrastructure",
    uncategorizedFeatureAreas: "Uncategorized feature areas",
    minorClusters: "Minor clusters",
    smallerFeatureAreas: "Smaller feature areas",
    lowVolumeAreas: "Low-volume areas",
    minorAreasCount: "{count} smaller areas",
    minorAreasIntro: "These areas have fewer components but may still carry findings.",
    primaryPressureArea: "Primary pressure area",
    mostAffectedStructure: "Most affected structure",
    dominantIssueZone: "Dominant issue zone",
    criticalComponents: "Top risk components",
    dominantIssueCoverage: "Components with dominant issue",
    refactoringStrategy: "Recommended Refactoring Strategy",
    recommendationPrefix: "Start with",
    issueExplanation: {
      TEMPLATE_HEAVY_COMPONENT: "Large templates, complex bindings. Extract to child components.",
      GOD_COMPONENT: "Too many responsibilities. Split into focused modules.",
      CLEANUP_RISK_COMPONENT: "Memory leaks possible. Add proper cleanup.",
      ORCHESTRATION_HEAVY_COMPONENT: "Heavy service orchestration. Extract to dedicated services.",
      LIFECYCLE_RISKY_COMPONENT: "Lifecycle hook risks. Review subscriptions and listeners.",
    },
    dimensionTemplate: "Template-heavy",
    dimensionResponsibility: "Responsibility-heavy",
    dimensionLifecycle: "Lifecycle-heavy",
    dimensionComponent: "Component-size heavy",
    keyFindings: "Key Findings",
    keyFindingCoverage: "{pct}% of components have a clear dominant issue",
    keyFindingDominant: "{issue} components dominate the workspace",
    keyFindingWorstProject: "{project} project carries the highest warning density",
    primaryPressure: "Primary pressure",
    lowSignalClustersMerged: "Low-signal clusters merged for overview clarity.",
    otherComponentsAcrossMinorAreas: "{components} components across {count} minor areas",
    clickToExploreMinorAreas: "Click to explore minor areas.",
    exploreMinorAreas: "Explore minor areas",
    otherFeatureAreas: "Other feature areas",
    unclassified: "unclassified",
    noDominantArea: "No dominant feature area detected",
    riskDistributed: "Workspace risk is distributed across multiple areas",
    whatHurtsMostHelper: "Click a row to see affected components.",
    breakdownHelper: "Projects/features with most warnings. Primary pressure = main risk dimension.",
    primaryPressureAreaHelper: "The score dimension with the most warnings in this project.",
    topProblematicHelper: "Highest-risk components. Click a row to filter by issue type.",
    topProblematicIntro: "Scan and drill down. Click a row for details.",
    actionViewDetailsShort: "Details",
    tableHeaderHelper: "LOC = lines of code; Deps = constructor dependencies.",
    refactoringStrategyHelper: "Prioritized by impact. Addressing these first reduces the most risk.",
    metricHintComponents: "Total components in workspace",
    metricHintWarnings: "Sum of rule hits across component, lifecycle, template, and responsibility.",
    metricHintCriticalComponents: "Top cross-cutting risk components based on severity and impact (up to 10).",
    metricHintDominantIssueCoverage: "{n} of {total} components",
    metricSecondaryComponents: "Used to compute workspace health.",
    metricSecondaryWarnings: "Sum of all rule violations.",
    metricSecondaryCriticalComponents: "Components that drive the most risk. Prioritized for refactoring.",
    metricSecondaryDominantIssueCoverage: "Components with a clear dominant issue. Easier to target fixes.",
    actionNavTitle: "Where should I go next?",
    actionExploreComponents: "Explore components",
    actionReviewPatterns: "Review repeated patterns",
    actionInspectStructure: "Inspect structure concerns",
    actionOpenRefactorPlan: "Refactor plan",
    actionOpenComponents: "Open Components",
    actionOpenPatterns: "Open Patterns",
    mainDiagnosis: "Main Diagnosis",
    primaryRisk: "Primary symptom",
    primarySymptom: "Primary symptom",
    mostAffectedArea: "Most affected project",
    mostAffectedProject: "Most affected project",
    mostAffectedForPattern: "Most affected area for this pattern",
    mainReason: "Root cause",
    rootCause: "Root cause",
    firstAction: "First action",
    expectedImpact: "Expected impact",
    expectedImpactValue: "Lower warning density and easier maintenance.",
    hotspotsByProject: "Hotspots by project / area",
    hotspotsHelper: "Where risk concentrates. Click to filter by area.",
    metricGroupScale: "Scale",
    metricGroupRisk: "Risk",
    metricGroupQuality: "Quality Dimensions",
    fixFirstHelper: "Prioritized by impact. Fix these first for the best payoff.",
    fixFirstShowMore: "View {count} more",
    fixFirstShowMoreOne: "View remaining",
    noRepeatedPatternsGood: "No repeated patterns. Architecture shows good variety.",
    ctaPrimaryTemplate: "Start with top template-heavy components",
    ctaPrimaryOrchestration: "Start with top orchestration-heavy components",
    ctaPrimaryCritical: "Start with top critical components",
    scoreExplanation: "Score combines component size, template complexity, lifecycle, and responsibility. 7+ = good, 5–7 = acceptable, <5 = needs attention.",
    dominantIssueExplanation: "Dominant issue per component. Based on structural analysis.",
    topRiskExplanation: "Ranked by severity, size, and finding count.",
    severityExplanation: "Critical = highest risk; High = significant; Warning = moderate.",
  },
  hero: {
    workspaceHealth: "Workspace Health",
    workspaceHealthHelper: "Overall score from component size, template complexity, lifecycle, and responsibility.",
    scoreRingHelper: "Higher is better. 7+ = good, 5–7 = acceptable, <5 = needs attention.",
    components: "Components",
    warnings: "Findings",
    hotspots: "Hotspots",
    templateIndex: "Template Complexity",
  },
  impact: {
    critical: "Critical Impact",
    high: "High Impact",
    medium: "Medium Impact",
    low: "Low Impact",
  },
  refactorEffort: "Refactor Effort",
  scores: {
    overallHealth: "Overall Health",
    componentQuality: "Component Quality",
    templateComplexity: "Template Complexity",
    lifecycleCleanup: "Lifecycle & Cleanup",
    responsibility: "Responsibility",
    verdictNeedsAttention: "Needs attention",
    verdictAcceptable: "Acceptable",
    verdictGood: "Good",
    dimensionHelperComponentQuality: "Size, dependencies, and structural complexity.",
    dimensionHelperLifecycleCleanup: "Subscriptions, timers, and ngOnDestroy usage.",
    dimensionHelperTemplateComplexity: "Template size, nesting, and structural directives.",
    dimensionHelperResponsibility: "Number of concerns and orchestration load.",
  },
  issues: {
    TEMPLATE_HEAVY_COMPONENT: "Template Too Complex",
    GOD_COMPONENT: "Too Many Responsibilities",
    CLEANUP_RISK_COMPONENT: "Cleanup / Memory Risk",
    ORCHESTRATION_HEAVY_COMPONENT: "Heavy Service Orchestration",
    LIFECYCLE_RISKY_COMPONENT: "Lifecycle Risky",
  },
  issueExplanations: {
    TEMPLATE_HEAVY_COMPONENT: "Large or complex template detected",
    GOD_COMPONENT: "Component orchestrates too many concerns",
    CLEANUP_RISK_COMPONENT: "Possible memory leaks; add proper cleanup",
    ORCHESTRATION_HEAVY_COMPONENT: "Heavy service orchestration detected",
    LIFECYCLE_RISKY_COMPONENT: "Lifecycle hook risks; review subscriptions",
  },
  severity: {
    critical: "Critical",
    high: "High",
    warning: "Warning",
    low: "Low",
  },
  priority: {
    fixNow: "Fix Now",
    fixSoon: "Fix Soon",
    monitor: "Monitor",
  },
  effort: {
    low: "Low",
    medium: "Medium",
    high: "High",
  },
  actions: {
    viewDetails: "View Details",
    viewPattern: "View Pattern",
    exportReport: "Export Report",
    rerunAnalysis: "Rerun Analysis",
    resetFilters: "Clear filters",
    copySuccessPath: "File path copied",
    copySuccessRefactor: "Recommendation copied",
    copySuccessStrategy: "Strategy copied",
    copySuccessSteps: "Refactor steps copied",
    copyFailed: "Copy failed",
    copyFailedAlert: "Copy failed. Clipboard permission may be unavailable. Try selecting and copying manually.",
  },
  empty: {
    noRefactorTasks: "No refactor tasks yet. Run a full analysis to see prioritized work.",
    noPatterns: "No repeated patterns detected.",
    noComponents: "No problematic components found. Your workspace looks clean.",
    noHotspots: "No architecture hotspots found.",
    noData: "No data.",
    noMatchFilters: "No matches for current filters. Clear filters or adjust criteria.",
    noMatchFiltersHint: "Adjust filters or clear them to see results.",
    noMatchFiltersDetail:
      "Active filters shown as chips above. Clear chips or use the button below to reset.",
    noRepeatedArchitecture: "No strong repeated architecture patterns detected. This usually indicates that there are no high-confidence shared architecture families across components.",
    noFeaturePatterns: "No repeated feature implementations detected. This usually indicates that feature implementations are not duplicated across multiple components.",
  },
  drawer: {
    back: "Back",
    summary: "Summary",
    whyRisky: "Why this is risky",
    evidence: "Evidence",
    recommendedActions: "Recommended actions",
    firstExtractions: "Suggested first extractions",
    advancedDetails: "Advanced details",
    component: "Component",
    lifecycle: "Lifecycle",
    template: "Template",
    responsibility: "Responsibility",
    refactor: "Refactor",
    refactorDirection: "Refactor direction",
    path: "File path",
    componentRole: "Component Role",
    quickStats: "Quick stats",
    whyFlagged: "Why this component is flagged",
    refactorPlan: "Refactor plan",
    evidenceGroups: "Evidence",
    fileContext: "File context",
    heuristicsDetails: "Heuristics & confidence",
    sourceRoot: "Source root",
    inferredFeatureArea: "Inferred feature area",
    sizeEvidence: "Size",
    templateEvidence: "Template",
    responsibilityEvidence: "Responsibility",
    lifecycleEvidence: "Lifecycle",
    suggestedArchitecture: "Suggested Architecture",
    suggestedComponents: "Suggested Components",
    suggestedServices: "Suggested Services",
    why: "Why",
    noDominantIssue: "No single dominant issue",
    noDominantIssueExplanation:
      "Signals are present but no single dominant issue clearly stands out. Review the evidence to decide where to focus.",
    fallbackDiagnosis: "Detailed diagnostics unavailable for this component.",
    roleConfidenceLowHelper: "Role derived from structure; verify if needed.",
    decompositionConfidenceLowHelper: "Based on limited evidence; review before acting.",
    whyItMatters: "Why it matters",
    relatedConcerns: "Related concerns",
    expectedOutcome: "Expected outcome",
    expectedOutcomeText: "Reduced complexity, improved maintainability, better testability.",
    nextSteps: "Next steps",
    viewInComponents: "View in Components",
    copyRefactor: "Copy refactor recommendation",
    copyRefactorPlan: "Copy refactor plan",
    copyPath: "Copy file path",
    openInPatterns: "Open in Patterns",
    openInRefactorPlan: "Open in refactor plan",
    filterBySameSmell: "Filter by same issue type",
    filterBySameProject: "Filter by same project",
    suggestedFirstRefactor: "Suggested first refactor",
    relatedRules: "Related rules",
    similarComponents: "Similar components / same family",
    partOfFamily: "Part of",
    sharedRefactorOpportunity: "Shared refactor opportunity",
    viewSupportingSignals: "View supporting signals",
    expectedOutcomeByIssue: {
      TEMPLATE_HEAVY_COMPONENT: "Lower template complexity and clearer ownership.",
      GOD_COMPONENT: "Focused components with single responsibility.",
      CLEANUP_RISK_COMPONENT: "Proper cleanup; no memory leaks.",
      ORCHESTRATION_HEAVY_COMPONENT: "Thin components; logic in services.",
      LIFECYCLE_RISKY_COMPONENT: "Lightweight hooks; predictable behavior.",
    },
    drawerWhyThisClassification: "Why this classification?",
    drawerRoleHeuristicHelper: "Role derived from structure; verify if needed.",
  },
  severityHint: {
    critical: "Highest risk; fix first",
    high: "High risk; address soon",
    warning: "Moderate risk; monitor",
  },
  evidence: {
    lineCount: "Component size",
    constructorDependencies: "Constructor dependencies",
    methodCount: "Methods",
    propertyCount: "Properties",
    templateLineCount: "Template lines",
    structuralDirectiveCount: "Structural directives",
    eventBindingCount: "Event bindings",
    structuralDepth: "Nesting depth",
    subscriptionCount: "Subscriptions",
    timerUsage: "Timer usage",
    eventListenerUsage: "Event listeners",
    lifecycleHookCount: "Lifecycle hooks",
    afterViewInitStatementCount: "AfterViewInit statements",
    formGroupCount: "Form groups",
    serviceOrchestrationCount: "Service orchestration calls",
    dependencyCount: "Dependencies",
  },
  evidenceUnits: {
    lineCount: "lines",
    templateLineCount: "lines",
    constructorDependencies: "services",
    dependencyCount: "services",
    methodCount: "",
    propertyCount: "",
    structuralDirectiveCount: "",
    eventBindingCount: "",
    structuralDepth: "",
    subscriptionCount: "",
    timerUsage: "",
    eventListenerUsage: "",
    lifecycleHookCount: "",
    afterViewInitStatementCount: "",
    formGroupCount: "",
    serviceOrchestrationCount: "",
  },
  architectureSmells: {
    GOD_PAGE_SMELL: "Overloaded page",
    CONTAINER_EXPLOSION_SMELL: "Overloaded container",
    TEMPLATE_EXPLOSION_SMELL: "Template explosion",
    REPEATED_DETAIL_PAGE_SMELL: "Repeated detail view pattern",
    PLAYER_ORCHESTRATION_SMELL: "Player orchestration",
    FRAGMENT_MANAGEMENT_SMELL: "Fragment management",
    FORM_ORCHESTRATION_SMELL: "Form orchestration",
  },
  familyNames: {
    "*-detail": "Repeated detail view pattern",
    "*-detail-fragment": "Detail fragment pattern",
    "*-fragment-player": "Media player pattern",
    "*-content-files": "Content files pattern",
    "*-manage-fragments": "Fragment management",
    "*-form": "Form pattern",
    "*-list": "List pattern",
    "*-view": "View pattern",
    "*-editor": "Editor pattern",
    "*-card": "Card pattern",
    "*-item": "Item pattern",
  },
  featurePatterns: {
    PLAYER_FEATURE_PATTERN: "Media player pattern",
    DETAIL_PAGE_PATTERN: "Detail page pattern",
    CONTENT_PUBLISH_PATTERN: "Content publish pattern",
    LIST_PAGE_PATTERN: "List page pattern",
    FRAGMENT_MANAGEMENT_PATTERN: "Fragment management pattern",
  },
  filters: {
    project: "Project",
    sourceRoot: "Source Root",
    allProjects: "All projects",
    allSourceRoots: "All source roots",
    issueType: "Issue type",
    allTypes: "All types",
    severity: "Severity",
    all: "All",
    sortBy: "Sort by",
    searchPlaceholder: "Search component, class, path...",
    componentRole: "Component role",
    allRoles: "All roles",
    sortHighestRisk: "Highest risk",
    sortLineCount: "Line count",
    sortDependencyCount: "Dependency count",
    sortTemplateComplexity: "Template complexity",
    sortWarningCount: "Warning count",
    sortName: "Name",
    pageSize: "Per page",
  },
  structure: {
    sectionTitle: "Structural Concerns",
    summaryTotalConcerns: "Total structure concerns",
    summaryCategoriesTriggered: "Concern categories triggered",
    summaryMostCommon: "Most common issue",
    summaryHighConfidence: "High confidence concerns",
    summaryMostAffectedArea: "Most affected area",
    summaryPrimarySmell: "Primary structural smell",
    mostCommonAccountsFor: "{type} accounts for {pct}% of detected structure concerns.",
    deepNesting: "Deep Nesting",
    sharedDumpingRisk: "Shared Dumping Risk",
    genericFolderOveruse: "Generic Folder Overuse",
    suspiciousPlacement: "Suspicious Placement",
    featureBoundaryBlur: "Feature Boundary Blur",
    folderDensity: "Folder Density Concern",
    exploreDetails: "Explore",
    viewDetails: "View details",
    inspectFiles: "Inspect files",
    viewAffectedFiles: "View affected files",
    viewAffectedFilesTooltip: "Filter Components page to affected files",
    copyRefactor: "Copy recommendation",
    addToPlan: "Add to refactor plan",
    recommendedFirstFix: "Recommended first fix",
    whyCommon: "Repeated pages/components/shared nesting detected in affected paths.",
    confidenceHighDisplay: "High confidence",
    confidenceMediumDisplay: "Review recommended",
    confidenceLowDisplay: "Derived from code signals",
    confidenceHighTooltip: "Strong structural signal; reliable for prioritization",
    confidenceMediumTooltip: "Likely issue; verify before refactoring",
    confidenceLowTooltip: "Weak indicator; inspect context first",
    whyItMatters: "Why it matters",
    samplePaths: "Sample paths",
    affectedAreas: "Affected areas",
    refactorDirection: "Refactor direction",
    noConcernsDetected: "No structural concerns detected",
    noConcernsHelper: "Heuristics are conservative. A clean result may indicate healthy organization.",
    pageHelper: "Structure-smell analysis detects organizational concerns. Use cautious interpretation.",
    confidenceLabel: "Confidence",
    confidenceLow: "Low",
    confidenceMedium: "Medium",
    confidenceHigh: "High",
    whyFlaggedHere: "Why this was flagged here",
    affectedAreasLabel: "Likely affected areas",
    sectionWhyItMatters: "Why it matters",
    sectionDetectionLogic: "Detection logic",
    sectionSamplePaths: "Sample paths",
    sectionAffectedAreas: "Affected areas",
    sectionRefactorGuidance: "Refactor guidance",
    sectionWhenToIgnore: "When to ignore",
    sectionSuggestedNextStep: "Suggested next step",
    whatToChange: "What to change",
    whatToAvoid: "What to avoid",
    refactorTarget: "Refactor target structure",
    filesAffected: "{count} files affected",
    mainAreas: "{count} main areas",
    filesAffectedAcrossAreas: "{count} files across {areas} areas",
    areaBreakdownUnavailable: "Breakdown unavailable",
    multipleAreasAffected: "Multiple areas affected",
    repeatedSegments: "Repeated segments",
    copyPath: "Copy path",
    suggestedFixLabel: "Suggested fix",
    sortBy: "Sort by",
    sortByImpact: "Impact",
    sortByConfidence: "Confidence",
    sortByAffectedFiles: "Affected files",
    sortByConcernType: "Concern type",
    filterArea: "Area",
    filterConfidence: "Confidence",
    filterImpact: "Impact",
    filterConcernType: "Concern type",
    filterAllAreas: "All areas",
    filterAllConfidence: "All",
    filterAllImpact: "All",
    filterAllTypes: "All types",
    suspiciousPlacementRefactorStory: "Refactor story",
    currentLocation: "Current location",
    likelyOwningFeature: "Likely owning feature",
    whySuspicious: "Why flagged",
    suggestedMove: "Suggested move",
    alsoFlaggedAs: "Also flagged as {issue}",
    sectionRefactorOptions: "Refactor options",
    refactorOptionMoveToFeature: "Move to owning feature",
    refactorOptionShallowAPI: "Keep public API shallow",
    refactorOptionWrapperOnly: "Leave wrapper in shared only if truly reusable",
    whenToUse: "When to use",
    ctaOpenAffectedComponents: "Open affected components",
    ctaOpenRefactorPlan: "Open refactor plan",
    ctaCopyMigrationStrategy: "Copy migration strategy",
  },
  rules: {
    pageTitle: "Rules",
    summaryTotalRules: "Total rules",
    summaryCategories: "Categories",
    summaryTotalFindings: "Total findings",
    summaryTotalFindingsHelper: "Total findings = sum of all rule hits.",
    summaryTriggered: "Triggered in workspace",
    summaryNotTriggered: "Not triggered",
    summaryMostTriggered: "Most triggered in workspace",
    summaryMostTriggeredNone: "None",
    pageIdentityPurpose: "Architectural rules Modulens uses",
    pageIdentityContext: "How often they triggered in this workspace",
    pageIdentityAction: "How to inspect affected components",
    categoryComponentSize: "Component Size",
    categoryTemplateComplexity: "Template Complexity",
    categoryResponsibilityGod: "Responsibility / God Component",
    categoryLifecycleCleanup: "Lifecycle / Cleanup",
    categoryDependencyOrchestration: "Dependency / Orchestration",
    triggeredTimes: "Triggered {count} times in this workspace",
    notTriggered: "Not triggered",
    explanation: "Explanation",
    whyItMatters: "Why it matters",
    badExample: "Bad example",
    goodExample: "Good example",
    refactorDirection: "Refactor direction",
    viewDetails: "View details",
    collapse: "Collapse",
    filterCategory: "Category",
    filterSeverity: "Severity",
    filterTriggered: "Triggered",
    filterSearch: "Search rules…",
    showingCount: "{shown} of {total} rules",
    filterAll: "All",
    pageHelper: "Rules detect architectural smells. Triggered count shows how often each rule fired in this workspace.",
    filterTriggeredOnly: "Triggered only",
    filterNotTriggered: "Not triggered",
    workspaceImpact: "Workspace impact",
    topAffectedComponents: "Top affected components",
    viewTriggeredComponents: "View triggered components",
    openInComponents: "Open in Components",
    investigateRule: "Investigate",
    topRulesToActOnFirst: "Top rules to act on first",
    topRulesToActOnFirstHelper: "Prioritized by impact, severity, and affected components.",
    triggeredInComponents: "Triggered in {count} component",
    triggeredInComponentsPlural: "Triggered in {count} components",
    observedTimes: "Observed {count} times across workspace",
    suggestedAction: "Suggested action",
    commonFalsePositives: "Common false positive patterns",
    openAffectedComponents: "Open affected components",
    sortBy: "Sort by",
    sortByPriority: "Priority",
    sortByAffected: "Affected components",
    sortByCount: "Violation count",
    sortByCategory: "Category",
    impactBandInformational: "Informational",
    impactBandLocalMaintainability: "Local maintainability risk",
    impactBandCrossCutting: "Cross-cutting maintainability risk",
    impactBandBehaviorLeakRisk: "Behavior / leak risk",
  },
  planner: {
    title: "Refactor Plan",
    topRefactorTargets: "Top Refactor Targets",
    extractionOpportunities: "Extraction Opportunities",
    quickWins: "Quick Wins",
    showMore: "Show more",
    showMoreTargets: "Show {count} more targets",
    copyRefactorSteps: "Copy refactor steps",
    openInComponents: "Open in Components",
    openInPatterns: "Open in Patterns",
    noExtractionClusters: "No reusable extraction clusters detected.",
    noExtractionClustersHint: "Focus on top refactor targets first. Extraction opportunities may appear as patterns emerge.",
    noQuickWins: "No low-effort quick wins identified. Start with Top Refactor Targets.",
    noQuickWinsWhy: "No low-effort, low-coordination quick wins (e.g., subscription cleanup, trackBy fixes).",
    noQuickWinsReassurance: "Focus on Top Refactor Targets or Extraction Opportunities for higher-impact work.",
    noQuickWinsBestFirstStep: "Recommended first step",
    noQuickWinsHint: "Start with the top refactor targets or review extraction opportunities for broader payoff.",
    topRefactorTargetsDesc: "Highest-impact components to refactor first. Prioritized by severity, size, and warning count.",
    extractionOpportunitiesDesc: "Shared patterns across components. Extract once and fix multiple at the same time.",
    quickWinsDesc: "Low-effort, high-impact fixes. Minimal coordination.",
    planningSummaryTopTargets: "Top refactor targets",
    planningSummaryQuickWins: "Quick wins",
    planningSummaryExtractionGroups: "Extraction groups (planning candidates)",
    planningSummaryHighestRoi: "Highest ROI starting point",
    planningSummaryBestImmediateStart: "Best immediate starting point",
    planningSummaryBestStartingPoint: "Best starting point",
    planningSummaryWhyStartHere: "Why start here",
    planningSummaryWhatUnlocksLater: "What unlocks later",
    planningSummaryHighestRoiLater: "Highest ROI later-stage extraction",
    planningSummarySuggestedPhase: "Suggested first phase",
    planningSummaryPhase1: "Phase 1",
    planningSummaryPhase2: "Phase 2",
    planningSummaryPhase3: "Phase 3",
    planningSummaryPhase1Desc: "Stabilize hotspots — low coordination, safe start",
    planningSummaryPhase2Desc: "Extract shared patterns — high-impact component refactors",
    planningSummaryPhase3Desc: "Broader architectural cleanup — cross-cutting extractions",
    phase1Deliverable: "Stabilize lifecycle and cleanup risks; reduce local hotspots",
    phase2Deliverable: "Extract shared patterns; reduce template/orchestration complexity",
    phase3Deliverable: "Consolidate cross-cutting extractions; architectural cleanup",
    planningSummaryFirstStepsTitle: "Your first 3 steps",
    planningSummaryWhereToStart: "Where to start",
    planningSummaryWhatComesNext: "What comes next",
    planningSummaryCrossCutting: "Cross-cutting",
    planningSummaryOneLinerQuickExtract: "Start with quick wins, then tackle high-impact targets and shared extractions.",
    planningSummaryOneLinerTargetsExtract: "Start with 1–2 high-impact template-heavy pages, then apply shared extractions across repeated patterns.",
    planningSummaryOneLinerTargets: "Focus on the top refactor targets first; prioritize by impact and effort.",
    planningSummaryOneLinerEmpty: "Use this plan as your execution roadmap.",
    sharesRefactorPatternWith: "Shares refactor pattern with {count} similar components",
    sameFamilyAs: "Same family as {names}",
    sameStepsAsAbove: "Same steps as above",
  },
  patterns: {
    title: "Patterns",
    repeatedArchitecture: "Cross-Family Architecture Patterns",
    featurePatterns: "Feature Patterns",
    patternOverview: "Architectural Patterns",
    explore: "Explore",
    workspaceContext: "{count} components with dominant architectural issues",
    workspaceContextTotal: "Across {total} total components",
    impactLow: "Low",
    impactMedium: "Medium",
    impactHigh: "High",
    drawerLinesLabel: "Lines",
    pagePurpose:
      "Patterns highlights where your app repeats itself, from shared architecture to copy‑pasted feature code. Architecture patterns and repeated feature implementations are analyzed independently, so one list can be empty while the other still has suggestions.",
    pagePurposeBullet1: "Cross-family architecture patterns — shared structure across feature families.",
    pagePurposeBullet2: "Repeated feature implementations — logic you can extract and reuse.",
    crossFamilyVsRepeatedFeatureExplanation:
      "Cross-family patterns are high-level structure (services, module layout) shared across unrelated features. Repeated feature implementations are concrete logic copy-pasted across components — extract once, fix many.",
    crossFamilyShort: "Shared structure across unrelated feature families (e.g. services, module layout)",
    repeatedFeatureShort: "Same feature logic copy-pasted across components; extract once, fix many",
    dominantFamiliesTitle: "Dominant Pattern Families",
    dominantFamiliesHelper: "Main architectural smell families driving risk across the workspace.",
    repeatedArchitectureTitle: "Cross-Family Architecture Patterns",
    repeatedArchitectureHelper:
      "High-level building blocks (shared services, state flows, module layouts) reused across unrelated feature families.",
    repeatedFeatureImplementationsTitle: "Repeated Feature Implementations",
    repeatedFeatureImplementationsHelper:
      "Concrete, lower-level implementations of similar features that can often be extracted into shared components, services, or utilities.",
    repeatedArchitectureEmptyCompact: "No strong repeated patterns detected. Check Refactor Plan for extraction opportunities.",
    repeatedArchitectureEmptyHint: "Similar feature implementations may still exist below.",
    repeatedArchitectureEmptyNext: "Check Refactor Plan for broader extraction opportunities.",
    repeatedFeatureEmptyCompact: "No strong repeated patterns detected. Check Refactor Plan for extraction opportunities.",
    repeatedFeatureEmptyCompactLine2: "We didn’t find clusters of similar feature logic worth extracting right now.",
    repeatedFeatureEmptyHint: "We didn’t find clusters of similar feature logic worth extracting right now.",
    repeatedFeatureEmptyNext: "Check Refactor Plan or Components for related opportunities.",
    clickComponentToViewDetails: "Click a component for details.",
    ctaTitle: "Where to go next",
    ctaExploreComponents: "Explore Components",
    ctaRefactorPlan: "Open Refactor Plan",
    ctaReviewExtractionOpportunities: "Review Extraction Opportunities",
    ctaSeeInRefactorPlan: "See in Refactor Plan",
    viewDetails: "View details",
    ctaOpenInComponents: "Open in Components",
    ctaCopyStrategy: "Copy refactor strategy",
    ctaOpenAffectedComponents: "Open affected components",
    ctaOpenRefactorTargets: "Open refactor targets",
    ctaCopyMigrationStrategy: "Copy migration strategy",
    affectedArea: "Affected area",
    extractionType: "Extraction type",
    architecturalPayoff: "Architectural payoff",
    relatedStructureIssues: "Related structure issues",
    sameFamilyAsChip: "Same family as: {names}",
    sharedRefactorHighlight: "Shared refactor",
    shortExplanation: {
      TEMPLATE_HEAVY_COMPONENT: "High rendering density and structural complexity; extract child components to reduce template size.",
      GOD_COMPONENT: "Orchestration, state, and presentation mixed; split into focused modules.",
      CLEANUP_RISK_COMPONENT: "Teardown and lifecycle safety; add proper cleanup for subscriptions and listeners.",
      ORCHESTRATION_HEAVY_COMPONENT: "UI coordinating too many services; extract to dedicated orchestration layer.",
      LIFECYCLE_RISKY_COMPONENT: "Subscription and hook usage risks; review lifecycle and teardown.",
    },
    meaning: "Meaning",
    whyItMatters: "Why it matters",
    refactorStrategy: "Refactor strategy",
    componentsInPattern: "Components in this pattern",
    featurePatternsHelper: "Repeated implementations of the same feature across components. Extracting shared logic improves consistency and maintainability.",
    sharedSignalsHelper: "Similar architecture signals (naming, directory, role).",
    candidateComponents: "Candidate components",
    candidatesShort: "Candidates",
    extractionAndStructure: "Extraction & structure",
    recommendedExtraction: "Recommended extraction",
    suggestedNewStructure: "Suggested new structure",
    sharedArchitectureSignals: "Shared architecture signals",
    weakGroupingLabel: "Weak grouping",
    weakGroupingHelper: "Review similarity before extraction",
  },
  patternExplanations: {
    TEMPLATE_HEAVY_COMPONENT: {
      meaning: "Components with 150+ template lines or 4+ structural directive nesting levels.",
      whyItMatters: "Large templates are hard to maintain, obscure structure, and often hide business logic. They hurt change detection and testability.",
      refactorStrategy: "Split template into smaller components; Extract pipes; Reduce nesting",
    },
    GOD_COMPONENT: {
      meaning: "Components that handle too many responsibilities and orchestrate too many concerns.",
      whyItMatters: "God components violate single responsibility, become maintenance bottlenecks, and are hard to test in isolation.",
      refactorStrategy: "Split presentation and orchestration; Extract form logic; Isolate event handlers",
    },
    CLEANUP_RISK_COMPONENT: {
      meaning: "Components with subscriptions or listeners that may not be properly cleaned up.",
      whyItMatters: "Unmanaged subscriptions and listeners cause memory leaks and unexpected behavior. They can leak across route changes.",
      refactorStrategy: "Add ngOnDestroy cleanup; Use takeUntilDestroyed for subscriptions; Store and clear timer/listener handles",
    },
    ORCHESTRATION_HEAVY_COMPONENT: {
      meaning: "Components that coordinate too many services and orchestrate heavy logic.",
      whyItMatters: "Heavy orchestration in components makes testing difficult and couples UI to business logic. Extracting to services improves testability.",
      refactorStrategy: "Split into thin container and presentation components; Extract form/router logic to dedicated services",
    },
    LIFECYCLE_RISKY_COMPONENT: {
      meaning: "Components with risky lifecycle hook usage or heavy logic in hooks.",
      whyItMatters: "Heavy logic in lifecycle hooks causes performance issues and unexpected behavior. Hooks run frequently; keep them lightweight.",
      refactorStrategy: "Move heavy logic out of lifecycle hooks; Consider OnPush; Avoid ngDoCheck/checked hooks",
    },
  },
  components: {
    title: "Components",
    component: "Component",
    path: "Path",
    mainIssue: "Main Issue",
    risk: "Risk",
    score: "Score",
    action: "Action",
    summaryShowing: "Showing",
    summaryOf: "of",
    summaryRange: "Showing {start}-{end} of {total}",
    summaryHelper: "Row counts show findings per component (component + lifecycle + template + responsibility).",
    critical: "critical",
    high: "high",
    rolePage: "Page",
    roleContainer: "Container",
    roleFeature: "Feature",
    roleShared: "Shared",
    roleUnknown: "Unclear",
    noDominantIssue: "No dominant issue",
    noSingleDominantIssue: "No single dominant issue",
    riskFromCombinedSignals: "Risk comes from combined signals",
    multipleModerateIssuesElevated: "Multiple moderate issues; elevated overall risk",
    noSingleDominantButMultiRule:
      "No single dominant issue; multiple rules elevate risk",
    showHealthyComponents: "Show healthy components",
    summaryProblematic: "Showing {range} of {count} problematic components",
    summaryFlagged: "Showing {showing} of {total} flagged components",
    summarySortedBy: "sorted by {sortLabel}",
    healthyHidden: "— {count} healthy components hidden",
    filterHelper: "Filter by architectural smell or severity.",
    dominantIssueHelper: "The primary architectural smell for this component.",
    clearAll: "Clear all",
    clearAllFilters: "Clear all filters",
    partOfFamily: "Part of",
    sharedRefactorOpportunity: "Shared refactor opportunity",
    filteringBy: "Filtering by",
    healthyHiddenChip: "Healthy hidden",
    anomalyMetricsMissingLabel: "Derived from code signals",
    anomalyMetricsMissingHelper:
      "Derived from code signals; review evidence before acting.",
    anomalySeverityInferredLabel: "Severity elevated by combined rule signals",
    anomalySeverityInferredHelper:
      "Based on multiple rule hits; review evidence.",
    anomalyGenericLabel: "Heuristic classification",
    anomalyGenericHelper:
      "Heuristic classification; review evidence before large refactors.",
  },
};

export function getTranslations(): Translations {
  return en;
}
