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
    executiveSummary?: string;
    executiveSummaryHelper?: string;
    executiveScaleLabel?: string;
    executiveRiskSignalsLabel?: string;
    executiveAssessmentLabel?: string;
    executiveDetailBelow?: string;
    executivePrimaryFocus?: string;
    executiveFirstStep?: string;
    workspaceRiskLabel?: string;
    basedOnAnalyzerSignals?: string;
    componentsBySeverityLabel?: string;
    priorityFocus?: string;
    priorityFocusHelper?: string;
    priorityFocusEmpty?: string;
    hotspotKindComponent?: string;
    hotspotKindRule?: string;
    recommendedActions?: string;
    recommendedActionsHelper?: string;
    recommendedActionsEmpty?: string;
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
    clearSearch?: string;
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
    noMatchSearch?: string;
    noMatchSearchHint?: string;
    /** When both search and filters may apply */
    noMatchCombinedHint?: string;
    noCompareFilterResults?: string;
    noCompareFilterHint?: string;
    /** Compare mode active but no rows in the scoped project */
    noCompareProjectScope?: string;
    /** Narrowed compare filter yields nothing */
    noComparedComponentsFilter?: string;
    selectBaselineForCompare?: string;
    /** Enable compare from Overview */
    selectBaselineEnableCompare?: string;
    noProjectCompareDiff?: string;
    noCompareDataForBaseline?: string;
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
    suggestedFirstRefactor?: string;
    relatedRules?: string;
    similarComponents?: string;
    partOfFamily?: string;
    sharedRefactorOpportunity?: string;
    viewSupportingSignals?: string;
    expectedOutcomeByIssue?: Record<string, string>;
    drawerWhyThisClassification?: string;
    drawerRoleHeuristicHelper?: string;
    /** Short list from severityNotesForDisplay */
    severityAssessmentTitle?: string;
    /** No dominant issue and zero cross-analyzer warnings */
    diagnosisQuiet?: string;
    /** Warnings/findings but dominance threshold not met */
    diagnosisUnranked?: string;
    compareMiniTitle?: string;
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
    /** Accessible name when placeholder is not sufficient */
    searchAriaLabel?: string;
    /** Short hint below search (what fields are matched) */
    searchHelper?: string;
    componentRole?: string;
    allRoles?: string;
    sortHighestRisk?: string;
    sortLineCount?: string;
    sortDependencyCount?: string;
    sortTemplateComplexity?: string;
    sortWarningCount?: string;
    sortName?: string;
    /** Severity from component data, highest first (CRITICAL → LOW) */
    sortSeverity?: string;
    /** Shown near sort control (accessibility / hint) */
    sortHelper?: string;
    pageSize?: string;
    /** Snapshot compare (Components Explorer) */
    compareBaseline?: string;
    compareAll?: string;
    compareChangedOnly?: string;
    compareWorse?: string;
    compareBetter?: string;
    compareResolved?: string;
    compareNew?: string;
    compareIssueChanged?: string;
    compareFilterHelper?: string;
    /** Tooltip when compare filter is disabled (no baseline selected on any project card). */
    compareFilterDisabledHint?: string;
    /** Project card: embedded compare payload missing for chosen baseline. */
    projectCompareUnavailable?: string;
    /** Project card: no diff entries for this project vs baseline. */
    projectCompareNoDiff?: string;
    /** Expand full-width compare breakdown below the card. */
    projectCompareViewDetails?: string;
    projectCompareHideDetails?: string;
    /** Modal title template, e.g. "{project} — compare details" */
    projectCompareDetailsTitle?: string;
    /** Muted line under modal title */
    projectCompareDetailsSubtitle?: string;
    /** Section headings inside compare detail body */
    projectCompareSectionMetrics?: string;
    projectCompareSectionDimensions?: string;
    projectCompareSectionHighlights?: string;
    /** Chip labels (value shown separately) */
    projectCompareLabelFindingsDelta?: string;
    projectCompareLabelWorsened?: string;
    projectCompareLabelImproved?: string;
    projectCompareLabelResolved?: string;
    /** Dimension row labels */
    projectCompareDimComponent?: string;
    projectCompareDimLifecycle?: string;
    projectCompareDimTemplate?: string;
    projectCompareDimResponsibility?: string;
    /** List block titles */
    projectCompareTopRegressions?: string;
    projectCompareTopImprovements?: string;
    projectCompareRulesIncreasing?: string;
    projectCompareRulesDecreasing?: string;
    /** Component list delta suffix */
    projectCompareWarningsDelta?: string;
    /** Small label above compare controls on project cards */
    projectCompareStripKicker?: string;
    sortDiffImpact?: string;
    sortWorseFirst?: string;
    sortBetterFirst?: string;
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
    /** Rule detail drawer — id label */
    ruleDetailRuleId?: string;
    ruleDetailWhatItDetects?: string;
    ruleDetailNextStep?: string;
    ruleDetailMoreExamples?: string;
    ruleDetailLimited?: string;
    ruleDetailUnknownBody?: string;
    /** Related rules: secondary link to Components filter */
    relatedRulesShowInList?: string;
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
    /** When filtering list to rows without a ranked primary smell */
    showingWithoutRankedPrimary?: string;
    summaryProblematic?: string;
    summaryFlagged?: string;
    summarySortedBy?: string;
    healthyHidden?: string;
    filterHelper?: string;
    dominantIssueHelper?: string;
    clearAll?: string;
    clearAllFilters?: string;
    /** Shown when search text is non-zero; {count} = matches after search + filters (all pages) */
    searchMatchCount?: string;
    /** aria-label for the active-filter chip region */
    activeFiltersRegion?: string;
    /** Remove chip; {label} = chip text */
    chipRemove?: string;
    summaryPrimaryEmpty?: string;
    /** {start} {end} {matching} {listTotal} */
    summaryPrimaryRange?: string;
    /** Appended when workspace total ≠ list length; {workspaceTotal} */
    summaryWorkspaceSegment?: string;
    /** {sortLabel} */
    summarySecondarySorted?: string;
    /** {count} hidden healthy-style rows */
    summarySecondaryHealthyHidden?: string;
    summarySecondarySearch?: string;
    summarySecondaryNoDominantView?: string;
    /** {critical} {high} in current matching set */
    summarySecondarySeverityInView?: string;
    chipSearch?: string;
    chipIssue?: string;
    chipSeverity?: string;
    chipArea?: string;
    chipRule?: string;
    chipProject?: string;
    chipSort?: string;
    chipCompare?: string;
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
    /** Compare strip: {worsened} {improved} {resolved} {new} {issueChanged} — counts in current filtered view */
    summaryCompareStrip?: string;
    compareBadgeNew?: string;
    compareBadgeResolved?: string;
    compareBadgeWorse?: string;
    compareBadgeBetter?: string;
    compareBadgeChanged?: string;
    compareVsBaseline?: string;
    comparePrevWarnings?: string;
    compareCurrWarnings?: string;
    comparePrevIssue?: string;
    compareCurrIssue?: string;
    compareAddedRules?: string;
    compareRemovedRules?: string;
    /** Components Explorer bar when one baseline; {date} */
    explorerBaselineActive?: string;
    /** When multiple project baselines; {count} */
    explorerBaselineActiveMulti?: string;
    explorerBaselineClearAll?: string;
    /** Bar line: "Comparing project: {project}" */
    explorerBaselineComparingProject?: string;
    /** Bar line: "Baseline snapshot: {date}" */
    explorerBaselineSnapshotLabel?: string;
    /** Short counts for baseline bar */
    explorerBaselineSummaryShort?: string;
    explorerChangeBaseline?: string;
    /** Overview project card compare row — same actions as Components bar, compact */
    explorerBaselineCardChange?: string;
    explorerBaselineCardClear?: string;
  };
  severityHint?: {
    critical: string;
    high: string;
    warning: string;
    low?: string;
  };
}

import { enNavAndConfidence } from "./en/nav-and-confidence";
import { enOverview } from "./en/overview";
import { enCoreLabels } from "./en/core-labels";
import { enDrawer } from "./en/drawer";
import { enSeverityHint } from "./en/severity-hint";
import { enEvidenceAndFilters } from "./en/evidence-and-filters";
import { enStructure } from "./en/structure";
import { enRules } from "./en/rules";
import { enPlanner } from "./en/planner";
import { enPatterns } from "./en/patterns";
import { enPatternExplanations } from "./en/pattern-explanations";
import { enComponents } from "./en/components";

export const en: Translations = {
  ...enNavAndConfidence,
  ...enOverview,
  ...enCoreLabels,
  ...enDrawer,
  ...enSeverityHint,
  ...enEvidenceAndFilters,
  ...enStructure,
  ...enRules,
  ...enPlanner,
  ...enPatterns,
  ...enPatternExplanations,
  ...enComponents,
};


export function getTranslations(): Translations {
  return en;
}

