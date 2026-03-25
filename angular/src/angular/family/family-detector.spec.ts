import { strict as assert } from "node:assert";
import { detectFamilies } from "./family-detector";
import type { FamilyDetectionInput } from "./family-detector";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

function createMockInput(overrides: Partial<FamilyDetectionInput> = {}): FamilyDetectionInput {
  const workspacePath = "/workspace";
  const baseComponents = [
    { filePath: "/workspace/app/user-detail.component.ts", fileName: "user-detail.component.ts", lineCount: 80, dependencyCount: 4, issues: [] },
    { filePath: "/workspace/app/product-detail.component.ts", fileName: "product-detail.component.ts", lineCount: 85, dependencyCount: 5, issues: [] },
    { filePath: "/workspace/app/order-detail.component.ts", fileName: "order-detail.component.ts", lineCount: 90, dependencyCount: 6, issues: [] },
  ];
  const baseDiagnostics = baseComponents.map(() => ({
    filePath: "",
    fileName: "",
    className: "",
    dominantIssue: null,
    supportingIssues: [] as never[],
    refactorDirection: "",
    diagnosticLabel: "No primary ranked issue",
    diagnosticStatus: "quiet" as const,
    clusterScores: {} as never,
    totalWarningCount: 0,
    evidence: [],
    componentRole: "detail" as const,
    roleConfidence: 0.3,
  }));
  const baseTemplates = baseComponents.map((_, i) => ({
    filePath: "",
    fileName: "",
    className: "",
    hasTemplate: true,
    templateSource: "inline" as const,
    metrics: {
      lineCount: 20 + i * 30,
      interpolationCount: 5,
      propertyBindingCount: 10,
      eventBindingCount: 2 + i,
      twoWayBindingCount: 0,
      ngIfCount: 3,
      ngForCount: i,
      atForCount: 0,
      atIfCount: 0,
      ngTemplateCount: 0,
      ngContainerCount: 0,
      structuralDepth: 2 + i,
      methodCallCount: 5,
      longExpressionCount: 0,
      trackByCount: 0,
    },
    warnings: [],
    score: 8,
    riskLevel: "Low" as const,
  }));
  const baseResponsibility = baseComponents.map((_, i) => ({
    filePath: "",
    fileName: "",
    className: "",
    metrics: {
      methodCount: 10,
      publicMethodCount: 5,
      propertyCount: 3,
      inputCount: 2,
      outputCount: 0,
      dependencyCount: 4 + i,
      formGroupCount: i,
      formControlCount: 0,
      formBuilderUsage: false,
      formPatchSetUpdateCount: 0,
      routerUsage: true,
      matDialogUsage: false,
      modalOrDrawerUsage: false,
      serviceOrchestrationCount: 1 + i,
      uiStateFieldCount: 0,
      addEventListenerCount: 0,
      setTimeoutCount: 0,
      setIntervalCount: 0,
      rendererListenCount: 0,
    },
    warnings: [],
    score: 8,
    riskLevel: "Low" as const,
  }));
  const baseLifecycle = new Map(
    baseComponents.map((c) => [
      c.filePath.replace(/\\/g, "/"),
      {
        filePath: c.filePath,
        fileName: c.fileName,
        className: "",
        targetType: "component" as const,
        hooksUsed: ["ngOnInit" as const],
        hookCount: 1,
        inputCount: 0,
        hasNgOnChanges: false,
        hasNgOnDestroy: false,
        isNgOnDestroyEmpty: true,
        afterViewInitStatementCount: 0,
        signals: {
          subscribeCount: 1,
          managedSubscribeCount: 0,
          riskySubscribeCount: 0,
          longLivedRiskyCount: 0,
          intervalFromEventRiskyCount: 0,
          shortLivedRiskyCount: 0,
          unknownRiskyCount: 0,
          completionGuaranteedSubscribeCount: 0,
          httpLikeSubscribeCount: 0,
          takeUntilPairedWithSubscribeCount: 0,
          subscriptionAssignedCount: 0,
          subscriptionInCompositeCount: 0,
          hasUnsubscribe: false,
          hasTakeUntil: false,
          hasTakeUntilDestroyed: false,
          hasTakeOneLikeOperator: false,
          hasDestroySignal: false,
          destroySignalUsedInTakeUntil: false,
          unsubscribeInOnDestroy: false,
          setIntervalCount: 0,
          clearIntervalCount: 0,
          setTimeoutCount: 0,
          clearTimeoutCount: 0,
          addEventListenerCount: 0,
          removeEventListenerCount: 0,
          rendererListenCount: 0,
          rendererListenCleanupCount: 0,
          hasHostListener: false,
          listenerPairingMatchCount: 0,
          listenerUnmatchedAddCount: 0,
          timerIdStoredCount: 0,
          timerIdClearedCount: 0,
          recursiveSetTimeoutCount: 0,
          missingIntervalCleanupCount: 0,
          missingTimeoutCleanupCount: 0,
          missingEventListenerCleanupCount: 0,
          missingRendererListenCleanupCount: 0,
          verifiedCleanupCount: 0,
        },
        warnings: [],
        score: 8,
        riskLevel: "Low" as const,
      },
    ])
  );
  baseDiagnostics.forEach((d, i) => {
    d.filePath = baseComponents[i].filePath;
    d.fileName = baseComponents[i].fileName;
  });
  baseTemplates.forEach((t, i) => {
    t.filePath = baseComponents[i].filePath;
    t.fileName = baseComponents[i].fileName;
  });
  baseResponsibility.forEach((r, i) => {
    r.filePath = baseComponents[i].filePath;
    r.fileName = baseComponents[i].fileName;
  });
  return {
    workspacePath,
    components: baseComponents,
    componentDiagnostics: baseDiagnostics,
    templateResults: baseTemplates,
    responsibilityResults: baseResponsibility,
    lifecycleByPath: baseLifecycle,
    ...overrides,
  };
}

console.log("family-detector");

test("suffix-only detail family (user, product, order) gets low confidence or weak grouping", () => {
  const input = createMockInput();
  const families = detectFamilies(input);
  const detailFamily = families.find((f) => f.familyName === "*-detail");
  if (detailFamily) {
    assert.ok(
      detailFamily.isWeakGrouping || detailFamily.confidence < 0.65,
      "Suffix-only detail family should be weak or low confidence"
    );
  }
});

test("similar form family (user-form, user-settings-form) with aligned metrics can form family", () => {
  const input = createMockInput({
    components: [
      { filePath: "/workspace/app/user-form.component.ts", fileName: "user-form.component.ts", lineCount: 120, dependencyCount: 5, issues: [] },
      { filePath: "/workspace/app/user-settings-form.component.ts", fileName: "user-settings-form.component.ts", lineCount: 115, dependencyCount: 5, issues: [] },
    ],
    componentDiagnostics: [
      { filePath: "", fileName: "", className: "", dominantIssue: "ORCHESTRATION_HEAVY_COMPONENT", supportingIssues: [], refactorDirection: "", diagnosticLabel: "ORCHESTRATION_HEAVY_COMPONENT", diagnosticStatus: "ranked" as const, clusterScores: {} as never, totalWarningCount: 0, evidence: [], componentRole: "form" as const, roleConfidence: 0.8 },
      { filePath: "", fileName: "", className: "", dominantIssue: "ORCHESTRATION_HEAVY_COMPONENT", supportingIssues: [], refactorDirection: "", diagnosticLabel: "ORCHESTRATION_HEAVY_COMPONENT", diagnosticStatus: "ranked" as const, clusterScores: {} as never, totalWarningCount: 0, evidence: [], componentRole: "form" as const, roleConfidence: 0.8 },
    ],
    templateResults: [
      { filePath: "", fileName: "", className: "", hasTemplate: true, templateSource: "inline", metrics: { lineCount: 40, interpolationCount: 5, propertyBindingCount: 15, eventBindingCount: 8, twoWayBindingCount: 0, ngIfCount: 4, ngForCount: 0, atForCount: 0, atIfCount: 0, ngTemplateCount: 0, ngContainerCount: 0, structuralDepth: 3, methodCallCount: 5, longExpressionCount: 0, trackByCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
      { filePath: "", fileName: "", className: "", hasTemplate: true, templateSource: "inline", metrics: { lineCount: 38, interpolationCount: 5, propertyBindingCount: 14, eventBindingCount: 7, twoWayBindingCount: 0, ngIfCount: 4, ngForCount: 0, atForCount: 0, atIfCount: 0, ngTemplateCount: 0, ngContainerCount: 0, structuralDepth: 3, methodCallCount: 5, longExpressionCount: 0, trackByCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
    ],
    responsibilityResults: [
      { filePath: "", fileName: "", className: "", metrics: { methodCount: 12, publicMethodCount: 6, propertyCount: 4, inputCount: 2, outputCount: 0, dependencyCount: 5, formGroupCount: 0, formControlCount: 0, formBuilderUsage: false, formPatchSetUpdateCount: 0, routerUsage: false, matDialogUsage: false, modalOrDrawerUsage: false, serviceOrchestrationCount: 2, uiStateFieldCount: 0, addEventListenerCount: 0, setTimeoutCount: 0, setIntervalCount: 0, rendererListenCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
      { filePath: "", fileName: "", className: "", metrics: { methodCount: 11, publicMethodCount: 6, propertyCount: 4, inputCount: 2, outputCount: 0, dependencyCount: 5, formGroupCount: 0, formControlCount: 0, formBuilderUsage: false, formPatchSetUpdateCount: 0, routerUsage: false, matDialogUsage: false, modalOrDrawerUsage: false, serviceOrchestrationCount: 2, uiStateFieldCount: 0, addEventListenerCount: 0, setTimeoutCount: 0, setIntervalCount: 0, rendererListenCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
    ],
    lifecycleByPath: new Map([
      ["/workspace/app/user-form.component.ts", { filePath: "", fileName: "", className: "", targetType: "component", hooksUsed: ["ngOnInit"], hookCount: 1, inputCount: 0, hasNgOnChanges: false, hasNgOnDestroy: false, isNgOnDestroyEmpty: true, afterViewInitStatementCount: 0, signals: { subscribeCount: 1, managedSubscribeCount: 0, riskySubscribeCount: 0, longLivedRiskyCount: 0, intervalFromEventRiskyCount: 0, shortLivedRiskyCount: 0, unknownRiskyCount: 0, completionGuaranteedSubscribeCount: 0, httpLikeSubscribeCount: 0, takeUntilPairedWithSubscribeCount: 0, subscriptionAssignedCount: 0, subscriptionInCompositeCount: 0, hasUnsubscribe: false, hasTakeUntil: false, hasTakeUntilDestroyed: false, hasTakeOneLikeOperator: false, hasDestroySignal: false, destroySignalUsedInTakeUntil: false, unsubscribeInOnDestroy: false, setIntervalCount: 0, clearIntervalCount: 0, setTimeoutCount: 0, clearTimeoutCount: 0, addEventListenerCount: 0, removeEventListenerCount: 0, rendererListenCount: 0, rendererListenCleanupCount: 0, hasHostListener: false, listenerPairingMatchCount: 0, listenerUnmatchedAddCount: 0, timerIdStoredCount: 0, timerIdClearedCount: 0, recursiveSetTimeoutCount: 0, missingIntervalCleanupCount: 0, missingTimeoutCleanupCount: 0, missingEventListenerCleanupCount: 0, missingRendererListenCleanupCount: 0, verifiedCleanupCount: 0 }, warnings: [], score: 8, riskLevel: "Low" }],
      ["/workspace/app/user-settings-form.component.ts", { filePath: "", fileName: "", className: "", targetType: "component", hooksUsed: ["ngOnInit"], hookCount: 1, inputCount: 0, hasNgOnChanges: false, hasNgOnDestroy: false, isNgOnDestroyEmpty: true, afterViewInitStatementCount: 0, signals: { subscribeCount: 1, managedSubscribeCount: 0, riskySubscribeCount: 0, longLivedRiskyCount: 0, intervalFromEventRiskyCount: 0, shortLivedRiskyCount: 0, unknownRiskyCount: 0, completionGuaranteedSubscribeCount: 0, httpLikeSubscribeCount: 0, takeUntilPairedWithSubscribeCount: 0, subscriptionAssignedCount: 0, subscriptionInCompositeCount: 0, hasUnsubscribe: false, hasTakeUntil: false, hasTakeUntilDestroyed: false, hasTakeOneLikeOperator: false, hasDestroySignal: false, destroySignalUsedInTakeUntil: false, unsubscribeInOnDestroy: false, setIntervalCount: 0, clearIntervalCount: 0, setTimeoutCount: 0, clearTimeoutCount: 0, addEventListenerCount: 0, removeEventListenerCount: 0, rendererListenCount: 0, rendererListenCleanupCount: 0, hasHostListener: false, listenerPairingMatchCount: 0, listenerUnmatchedAddCount: 0, timerIdStoredCount: 0, timerIdClearedCount: 0, recursiveSetTimeoutCount: 0, missingIntervalCleanupCount: 0, missingTimeoutCleanupCount: 0, missingEventListenerCleanupCount: 0, missingRendererListenCleanupCount: 0, verifiedCleanupCount: 0 }, warnings: [], score: 8, riskLevel: "Low" }],
    ]),
  });
  input.componentDiagnostics.forEach((d, i) => {
    d.filePath = input.components[i].filePath;
    d.fileName = input.components[i].fileName;
  });
  input.templateResults.forEach((t, i) => {
    t.filePath = input.components[i].filePath;
    t.fileName = input.components[i].fileName;
  });
  input.responsibilityResults.forEach((r, i) => {
    r.filePath = input.components[i].filePath;
    r.fileName = input.components[i].fileName;
  });
  const families = detectFamilies(input);
  const formFamily = families.find((f) => f.familyName === "*-form");
  assert.ok(formFamily, "Similar form components with aligned metrics should form a family");
  assert.ok(formFamily!.members.length >= 2, "Form family should have at least 2 members");
  assert.ok(!formFamily!.isWeakGrouping, "Aligned form family should not be weak");
});

test("families have confidence and representativeEvidence", () => {
  const input = createMockInput();
  const families = detectFamilies(input);
  for (const f of families) {
    assert.ok(typeof f.confidence === "number", "Family should have confidence");
    assert.ok(f.confidence >= 0 && f.confidence <= 1, "Confidence should be 0-1");
    assert.ok(Array.isArray(f.representativeEvidence ?? []), "representativeEvidence should be array");
  }
});

test("small groups (2-3 members) require higher threshold", () => {
  const input = createMockInput({
    components: [
      { filePath: "/workspace/app/foo-card.component.ts", fileName: "foo-card.component.ts", lineCount: 50, dependencyCount: 3, issues: [] },
      { filePath: "/workspace/app/bar-card.component.ts", fileName: "bar-card.component.ts", lineCount: 45, dependencyCount: 3, issues: [] },
    ],
    componentDiagnostics: [
      { filePath: "", fileName: "", className: "", dominantIssue: null, supportingIssues: [], refactorDirection: "", diagnosticLabel: "No primary ranked issue", diagnosticStatus: "quiet" as const, clusterScores: {} as never, totalWarningCount: 0, evidence: [], componentRole: "widget" as const, roleConfidence: 0.5 },
      { filePath: "", fileName: "", className: "", dominantIssue: null, supportingIssues: [], refactorDirection: "", diagnosticLabel: "No primary ranked issue", diagnosticStatus: "quiet" as const, clusterScores: {} as never, totalWarningCount: 0, evidence: [], componentRole: "widget" as const, roleConfidence: 0.5 },
    ],
    templateResults: [
      { filePath: "", fileName: "", className: "", hasTemplate: true, templateSource: "inline", metrics: { lineCount: 15, interpolationCount: 2, propertyBindingCount: 5, eventBindingCount: 1, twoWayBindingCount: 0, ngIfCount: 1, ngForCount: 0, atForCount: 0, atIfCount: 0, ngTemplateCount: 0, ngContainerCount: 0, structuralDepth: 2, methodCallCount: 2, longExpressionCount: 0, trackByCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
      { filePath: "", fileName: "", className: "", hasTemplate: true, templateSource: "inline", metrics: { lineCount: 14, interpolationCount: 2, propertyBindingCount: 5, eventBindingCount: 1, twoWayBindingCount: 0, ngIfCount: 1, ngForCount: 0, atForCount: 0, atIfCount: 0, ngTemplateCount: 0, ngContainerCount: 0, structuralDepth: 2, methodCallCount: 2, longExpressionCount: 0, trackByCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
    ],
    responsibilityResults: [
      { filePath: "", fileName: "", className: "", metrics: { methodCount: 5, publicMethodCount: 2, propertyCount: 2, inputCount: 1, outputCount: 0, dependencyCount: 3, formGroupCount: 0, formControlCount: 0, formBuilderUsage: false, formPatchSetUpdateCount: 0, routerUsage: false, matDialogUsage: false, modalOrDrawerUsage: false, serviceOrchestrationCount: 0, uiStateFieldCount: 0, addEventListenerCount: 0, setTimeoutCount: 0, setIntervalCount: 0, rendererListenCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
      { filePath: "", fileName: "", className: "", metrics: { methodCount: 5, publicMethodCount: 2, propertyCount: 2, inputCount: 1, outputCount: 0, dependencyCount: 3, formGroupCount: 0, formControlCount: 0, formBuilderUsage: false, formPatchSetUpdateCount: 0, routerUsage: false, matDialogUsage: false, modalOrDrawerUsage: false, serviceOrchestrationCount: 0, uiStateFieldCount: 0, addEventListenerCount: 0, setTimeoutCount: 0, setIntervalCount: 0, rendererListenCount: 0 }, warnings: [], score: 8, riskLevel: "Low" },
    ],
    lifecycleByPath: new Map(),
  });
  input.componentDiagnostics.forEach((d, i) => {
    d.filePath = input.components[i].filePath;
    d.fileName = input.components[i].fileName;
  });
  input.templateResults.forEach((t, i) => {
    t.filePath = input.components[i].filePath;
    t.fileName = input.components[i].fileName;
  });
  input.responsibilityResults.forEach((r, i) => {
    r.filePath = input.components[i].filePath;
    r.fileName = input.components[i].fileName;
  });
  const families = detectFamilies(input);
  const cardFamily = families.find((f) => f.familyName === "*-card");
  if (cardFamily && cardFamily.members.length <= 3) {
    assert.ok(
      cardFamily.extractionScore < 5 || cardFamily.isWeakGrouping || cardFamily.confidence < 0.7,
      "Small suffix-only card family should not be strong extraction candidate"
    );
  }
});
