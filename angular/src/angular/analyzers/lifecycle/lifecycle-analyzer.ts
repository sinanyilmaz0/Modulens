import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {
  LIFECYCLE_HOOKS,
  LifecycleAnalysisContext,
  LifecycleAnalysisResult,
  LifecycleConfidence,
  LifecycleDetectionSignals,
  LifecycleHookName,
  LifecycleSeverity,
} from "./lifecycle-models";
import { evaluateLifecycleRules } from "./lifecycle-rules";
import { calculateLifecycleScore, getLifecycleRiskLevel } from "./lifecycle-score";
export { findLifecycleTargets } from "./lifecycle-file-discovery";
export { summarizeLifecycleResults } from "./lifecycle-summarize";

const severityPriority: Record<LifecycleSeverity, number> = {
  info: 0,
  warning: 1,
  high: 2,
  critical: 3,
};

const HTTP_METHOD_NAMES = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "request",
]);

export function analyzeLifecycle(filePath: string): LifecycleAnalysisResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const angularClassInfo = findAngularClass(sourceFile);

  if (!angularClassInfo) {
    return {
      ...createBaseContext(filePath, fileName),
      warnings: [],
      score: 10,
      explainedScore: { score: 10, factors: [] },
      riskLevel: "Low",
      highestSeverity: undefined,
    };
  }

  const { classNode, targetType } = angularClassInfo;
  const className = classNode.name?.text ?? fileName.replace(".ts", "");
  const methodMap = getMethodMap(classNode);

  const hooksUsed = LIFECYCLE_HOOKS.filter((hook) => methodMap.has(hook));
  const ngOnDestroyMethod = methodMap.get("ngOnDestroy");
  const ngAfterViewInitMethod = methodMap.get("ngAfterViewInit");

  const context: LifecycleAnalysisContext = {
    filePath,
    fileName,
    className,
    targetType,
    hooksUsed,
    hookCount: hooksUsed.length,
    inputCount: getInputCount(classNode),
    hasNgOnChanges: hooksUsed.includes("ngOnChanges"),
    hasNgOnDestroy: hooksUsed.includes("ngOnDestroy"),
    isNgOnDestroyEmpty:
      ngOnDestroyMethod !== undefined &&
      (ngOnDestroyMethod.body === undefined || ngOnDestroyMethod.body.statements.length === 0),
    afterViewInitStatementCount: ngAfterViewInitMethod?.body?.statements.length ?? 0,
    signals: collectDetectionSignals(classNode),
  };

  const warnings = evaluateLifecycleRules(context);
  const explained = calculateLifecycleScore(context, warnings);

  return {
    ...context,
    warnings,
    score: explained.score,
    explainedScore: { score: explained.score, factors: explained.factors },
    riskLevel: getLifecycleRiskLevel(explained.score),
    highestSeverity: getHighestSeverity(warnings),
  };
}

function createBaseContext(filePath: string, fileName: string): LifecycleAnalysisContext {
  return {
    filePath,
    fileName,
    className: fileName.replace(".ts", ""),
    targetType: "unknown",
    hooksUsed: [],
    hookCount: 0,
    inputCount: 0,
    hasNgOnChanges: false,
    hasNgOnDestroy: false,
    isNgOnDestroyEmpty: false,
    afterViewInitStatementCount: 0,
    signals: createEmptySignals(),
  };
}

function findAngularClass(
  sourceFile: ts.SourceFile
):
  | {
      classNode: ts.ClassDeclaration;
      targetType: "component" | "directive";
    }
  | undefined {
  let result:
    | {
        classNode: ts.ClassDeclaration;
        targetType: "component" | "directive";
      }
    | undefined;

  sourceFile.forEachChild((node) => {
    if (result || !ts.isClassDeclaration(node)) {
      return;
    }

    const decoratorNames = getDecoratorNames(node);

    if (decoratorNames.includes("Component")) {
      result = {
        classNode: node,
        targetType: "component",
      };
      return;
    }

    if (decoratorNames.includes("Directive")) {
      result = {
        classNode: node,
        targetType: "directive",
      };
    }
  });

  return result;
}

function getMethodMap(classNode: ts.ClassDeclaration): Map<LifecycleHookName, ts.MethodDeclaration> {
  const methodMap = new Map<LifecycleHookName, ts.MethodDeclaration>();

  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member) || !member.name || !ts.isIdentifier(member.name)) {
      continue;
    }

    const methodName = member.name.text as LifecycleHookName;

    if (LIFECYCLE_HOOKS.includes(methodName)) {
      methodMap.set(methodName, member);
    }
  }

  return methodMap;
}

function getInputCount(classNode: ts.ClassDeclaration): number {
  let inputCount = 0;

  for (const member of classNode.members) {
    const decoratorNames = getDecoratorNames(member);

    if (decoratorNames.includes("Input")) {
      inputCount += 1;
      continue;
    }

    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      isCallByName(member.initializer, "input")
    ) {
      inputCount += 1;
    }
  }

  return inputCount;
}

interface ListenerCallInfo {
  targetKey: string;
  eventName: string;
  handlerKey: string;
}

interface TimerCallInfo {
  assignedTo: string | undefined;
  inCallback: boolean;
}

interface RendererListenInfo {
  assignedTo: string | undefined;
}

interface EventTimerCleanupData {
  addListenerCalls: ListenerCallInfo[];
  removeListenerCalls: ListenerCallInfo[];
  setTimeoutCalls: TimerCallInfo[];
  setIntervalCalls: TimerCallInfo[];
  clearTimeoutVars: string[];
  clearIntervalVars: string[];
  rendererListenCalls: RendererListenInfo[];
  callCalleeKeys: string[];
}

function collectDetectionSignals(classNode: ts.ClassDeclaration): LifecycleDetectionSignals {
  const signals = createEmptySignals();
  const methodCallCounts = new Map<string, Record<string, number>>();
  const eventTimerData: EventTimerCleanupData = {
    addListenerCalls: [],
    removeListenerCalls: [],
    setTimeoutCalls: [],
    setIntervalCalls: [],
    clearTimeoutVars: [],
    clearIntervalVars: [],
    rendererListenCalls: [],
    callCalleeKeys: [],
  };

  for (const member of classNode.members) {
    let methodName: string | undefined;

    if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
      methodName = member.name.text;
      if (getDecoratorNames(member).includes("HostListener")) {
        signals.hasHostListener = true;
      }
    } else if (ts.isConstructorDeclaration(member)) {
      methodName = "constructor";
    }

    visitNode(member, undefined, methodName, signals, methodCallCounts, eventTimerData);
  }

  const onDestroyCalls = methodCallCounts.get("ngOnDestroy");
  const onDestroyClearInterval = onDestroyCalls?.clearInterval ?? 0;
  const onDestroyClearTimeout = onDestroyCalls?.clearTimeout ?? 0;
  const onDestroyRemoveEventListener = onDestroyCalls?.removeEventListener ?? 0;

  const { pairingMatchCount: listenerPairingMatchCount, unmatchedAddCount: listenerUnmatchedAddCount } =
    computeListenerPairing(eventTimerData.addListenerCalls, eventTimerData.removeListenerCalls);

  const { storedCount: timerIdStoredCount, clearedCount: timerIdClearedCount } =
    computeTimerPairing(
      eventTimerData.setTimeoutCalls,
      eventTimerData.setIntervalCalls,
      eventTimerData.clearTimeoutVars,
      eventTimerData.clearIntervalVars
    );

  const { rendererListenCleanupCount } = computeRendererListenPairing(
    eventTimerData.rendererListenCalls,
    eventTimerData.callCalleeKeys
  );

  signals.listenerPairingMatchCount = listenerPairingMatchCount;
  signals.listenerUnmatchedAddCount = listenerUnmatchedAddCount;
  signals.timerIdStoredCount = timerIdStoredCount;
  signals.timerIdClearedCount = timerIdClearedCount;
  signals.recursiveSetTimeoutCount = eventTimerData.setTimeoutCalls.filter((c) => c.inCallback).length;
  signals.rendererListenCleanupCount = rendererListenCleanupCount;

  signals.missingIntervalCleanupCount = Math.max(
    0,
    signals.setIntervalCount - Math.max(signals.clearIntervalCount, onDestroyClearInterval)
  );
  signals.missingTimeoutCleanupCount = Math.max(
    0,
    signals.setTimeoutCount - Math.max(signals.clearTimeoutCount, onDestroyClearTimeout)
  );
  signals.missingEventListenerCleanupCount = Math.max(
    0,
    signals.addEventListenerCount - Math.max(signals.removeEventListenerCount, onDestroyRemoveEventListener)
  );
  signals.missingEventListenerCleanupCount = Math.max(
    signals.missingEventListenerCleanupCount,
    listenerUnmatchedAddCount
  );
  signals.missingRendererListenCleanupCount = Math.max(
    0,
    signals.rendererListenCount - rendererListenCleanupCount
  );

  signals.verifiedCleanupCount =
    Math.min(signals.setIntervalCount, Math.max(signals.clearIntervalCount, onDestroyClearInterval)) +
    Math.min(signals.setTimeoutCount, Math.max(signals.clearTimeoutCount, onDestroyClearTimeout)) +
    Math.min(
      signals.addEventListenerCount,
      Math.max(signals.removeEventListenerCount, onDestroyRemoveEventListener)
    ) +
    Math.min(signals.rendererListenCount, rendererListenCleanupCount) +
    (signals.unsubscribeInOnDestroy ? 1 : 0) +
    (signals.takeUntilPairedWithSubscribeCount > 0 ? 1 : 0) +
    (signals.hasTakeUntilDestroyed ? 1 : 0);

  return signals;
}

function computeListenerPairing(
  addCalls: ListenerCallInfo[],
  removeCalls: ListenerCallInfo[]
): { pairingMatchCount: number; unmatchedAddCount: number } {
  const usedRemove = new Set<number>();
  let pairingMatchCount = 0;

  for (const add of addCalls) {
    const matchIdx = removeCalls.findIndex(
      (remove, i) =>
        !usedRemove.has(i) &&
        remove.targetKey === add.targetKey &&
        remove.eventName === add.eventName &&
        remove.handlerKey === add.handlerKey &&
        add.handlerKey !== ""
    );
    if (matchIdx >= 0) {
      usedRemove.add(matchIdx);
      pairingMatchCount += 1;
    }
  }

  return {
    pairingMatchCount,
    unmatchedAddCount: addCalls.length - pairingMatchCount,
  };
}

function computeTimerPairing(
  setTimeoutCalls: TimerCallInfo[],
  setIntervalCalls: TimerCallInfo[],
  clearTimeoutVars: string[],
  clearIntervalVars: string[]
): { storedCount: number; clearedCount: number } {
  const storedCount =
    setTimeoutCalls.filter((c) => c.assignedTo !== undefined).length +
    setIntervalCalls.filter((c) => c.assignedTo !== undefined).length;
  const storedVars = new Set<string>();
  for (const c of setTimeoutCalls) {
    if (c.assignedTo) storedVars.add(c.assignedTo);
  }
  for (const c of setIntervalCalls) {
    if (c.assignedTo) storedVars.add(c.assignedTo);
  }
  let clearedCount = 0;
  for (const v of clearTimeoutVars) {
    if (storedVars.has(v)) clearedCount += 1;
  }
  for (const v of clearIntervalVars) {
    if (storedVars.has(v)) clearedCount += 1;
  }
  return { storedCount, clearedCount };
}

function computeRendererListenPairing(
  listenCalls: RendererListenInfo[],
  callCalleeKeys: string[]
): { rendererListenCleanupCount: number } {
  const assignedVars = new Set<string>();
  for (const c of listenCalls) {
    if (c.assignedTo) assignedVars.add(c.assignedTo);
  }
  let rendererListenCleanupCount = 0;
  for (const key of callCalleeKeys) {
    if (assignedVars.has(key)) rendererListenCleanupCount += 1;
  }
  return { rendererListenCleanupCount };
}

function visitNode(
  node: ts.Node,
  parent: ts.Node | undefined,
  methodName: string | undefined,
  signals: LifecycleDetectionSignals,
  methodCallCounts: Map<string, Record<string, number>>,
  eventTimerData: EventTimerCleanupData,
  insideSetTimeoutCallback = false
): void {
  if (ts.isIdentifier(node) && isDestroySignalName(node.text)) {
    signals.hasDestroySignal = true;
  }

  if (ts.isPropertyAccessExpression(node) && isDestroySignalName(node.name.text)) {
    signals.hasDestroySignal = true;
  }

  if (
    ts.isPropertyDeclaration(node) &&
    node.name &&
    ts.isIdentifier(node.name) &&
    isDestroySignalName(node.name.text)
  ) {
    signals.hasDestroySignal = true;
  }

  if (ts.isCallExpression(node)) {
    const callName = getCallName(node.expression);

    if (
      ts.isIdentifier(node.expression) ||
      ts.isPropertyAccessExpression(node.expression)
    ) {
      eventTimerData.callCalleeKeys.push(node.expression.getText());
    }

    if (callName) {
      incrementMethodCallCount(methodCallCounts, methodName, callName);
    }

    if (callName === "subscribe") {
      signals.subscribeCount += 1;

      const subscribeAnalysis = analyzeSubscribeCall(node);
      const cleanupOwnership = detectCleanupOwnership(node, parent);

      if (cleanupOwnership.assigned) {
        signals.subscriptionAssignedCount += 1;
      }
      if (cleanupOwnership.inComposite) {
        signals.subscriptionInCompositeCount += 1;
      }

      if (subscribeAnalysis.usesTakeUntil) {
        signals.hasTakeUntil = true;
        signals.takeUntilPairedWithSubscribeCount += 1;
      }

      if (subscribeAnalysis.usesTakeUntilDestroyed) {
        signals.hasTakeUntilDestroyed = true;
      }

      if (subscribeAnalysis.usesDestroySignalInTakeUntil) {
        signals.destroySignalUsedInTakeUntil = true;
      }

      if (subscribeAnalysis.usesTakeOneLike) {
        signals.hasTakeOneLikeOperator = true;
        signals.completionGuaranteedSubscribeCount += 1;
      }

      if (subscribeAnalysis.isHttpLike) {
        signals.httpLikeSubscribeCount += 1;
      }

      if (subscribeAnalysis.isManaged) {
        signals.managedSubscribeCount += 1;
      } else {
        signals.riskySubscribeCount += 1;

        const sourceType = subscribeAnalysis.sourceClassification;
        if (sourceType === "intervalFromEvent") {
          signals.intervalFromEventRiskyCount += 1;
          signals.longLivedRiskyCount += 1;
        } else if (sourceType === "longLived") {
          signals.longLivedRiskyCount += 1;
        } else if (sourceType === "shortLived") {
          signals.shortLivedRiskyCount += 1;
        } else {
          signals.unknownRiskyCount += 1;
        }
      }
    }

    if (callName === "unsubscribe") {
      signals.hasUnsubscribe = true;

      if (methodName === "ngOnDestroy") {
        signals.unsubscribeInOnDestroy = true;
      }
    }

    if (callName === "takeUntil") {
      signals.hasTakeUntil = true;

      if (node.arguments.some((argument) => expressionContainsDestroySignal(argument))) {
        signals.destroySignalUsedInTakeUntil = true;
      }
    }

    if (callName === "takeUntilDestroyed") {
      signals.hasTakeUntilDestroyed = true;
    }

    if (callName === "take" && isTakeOneCall(node)) {
      signals.hasTakeOneLikeOperator = true;
    }

    if (callName === "first" || callName === "single") {
      signals.hasTakeOneLikeOperator = true;
    }

    if (callName === "setInterval") {
      signals.setIntervalCount += 1;
      const timerInfo = analyzeTimerCall(node, parent);
      eventTimerData.setIntervalCalls.push(timerInfo);
    }

    if (callName === "clearInterval") {
      signals.clearIntervalCount += 1;
      const varKey = getTimerClearVarKey(node);
      if (varKey) eventTimerData.clearIntervalVars.push(varKey);
    }

    if (callName === "setTimeout") {
      signals.setTimeoutCount += 1;
      const timerInfo = analyzeTimerCall(node, parent);
      timerInfo.inCallback = insideSetTimeoutCallback;
      eventTimerData.setTimeoutCalls.push(timerInfo);
    }

    if (callName === "clearTimeout") {
      signals.clearTimeoutCount += 1;
      const varKey = getTimerClearVarKey(node);
      if (varKey) eventTimerData.clearTimeoutVars.push(varKey);
    }

    if (callName === "addEventListener") {
      signals.addEventListenerCount += 1;
      const info = analyzeEventListenerCall(node, "add");
      if (info) eventTimerData.addListenerCalls.push(info);
    }

    if (callName === "removeEventListener") {
      signals.removeEventListenerCount += 1;
      const info = analyzeEventListenerCall(node, "remove");
      if (info) eventTimerData.removeListenerCalls.push(info);
    }

    if (callName === "listen" && isRendererListenCall(node)) {
      signals.rendererListenCount += 1;
      const info = analyzeRendererListenCall(node, parent);
      eventTimerData.rendererListenCalls.push(info);
    }
  }

  const isInsideSetTimeoutCallback =
    insideSetTimeoutCallback ||
    (parent &&
      ts.isCallExpression(parent) &&
      getCallName(parent.expression) === "setTimeout" &&
      parent.arguments[0] === node);

  ts.forEachChild(node, (child) => {
    let nextMethodName = methodName;

    if (ts.isMethodDeclaration(child) && child.name && ts.isIdentifier(child.name)) {
      nextMethodName = child.name.text;
    } else if (ts.isConstructorDeclaration(child)) {
      nextMethodName = "constructor";
    }

    visitNode(
      child,
      node,
      nextMethodName,
      signals,
      methodCallCounts,
      eventTimerData,
      isInsideSetTimeoutCallback
    );
  });
}

function getExpressionKey(expr: ts.Expression): string {
  return expr.getText();
}

function analyzeEventListenerCall(
  callExpression: ts.CallExpression,
  _kind: "add" | "remove"
): ListenerCallInfo | undefined {
  if (callExpression.arguments.length < 2) return undefined;
  const target = callExpression.expression;
  if (!ts.isPropertyAccessExpression(target)) return undefined;
  const targetExpr = target.expression;
  const targetKey = getExpressionKey(targetExpr);
  const eventArg = callExpression.arguments[0];
  const eventName = ts.isStringLiteral(eventArg) ? eventArg.text : eventArg.getText();
  const handlerArg = callExpression.arguments[1];
  const handlerKey =
    ts.isIdentifier(handlerArg) || ts.isPropertyAccessExpression(handlerArg)
      ? handlerArg.getText()
      : "";
  return { targetKey, eventName, handlerKey };
}

function analyzeTimerCall(
  callExpression: ts.CallExpression,
  parent: ts.Node | undefined
): TimerCallInfo {
  let assignedTo: string | undefined;
  if (parent && ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    if (parent.right === callExpression && ts.isPropertyAccessExpression(parent.left)) {
      assignedTo = parent.left.getText();
    } else if (parent.right === callExpression && ts.isIdentifier(parent.left)) {
      assignedTo = parent.left.getText();
    }
  }
  return { assignedTo, inCallback: false };
}

function getTimerClearVarKey(callExpression: ts.CallExpression): string | undefined {
  if (callExpression.arguments.length < 1) return undefined;
  const arg = callExpression.arguments[0];
  if (ts.isIdentifier(arg) || ts.isPropertyAccessExpression(arg)) {
    return arg.getText();
  }
  return undefined;
}

function isRendererListenCall(callExpression: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(callExpression.expression)) return false;
  const name = callExpression.expression.name.text;
  if (name !== "listen") return false;
  const base = callExpression.expression.expression;
  const baseText = base.getText().toLowerCase();
  return baseText.includes("renderer") || baseText.includes("renderer2");
}

function analyzeRendererListenCall(
  callExpression: ts.CallExpression,
  parent: ts.Node | undefined
): RendererListenInfo {
  let assignedTo: string | undefined;
  if (parent && ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    if (parent.right === callExpression) {
      const left = parent.left;
      if (ts.isPropertyAccessExpression(left) || ts.isIdentifier(left)) {
        assignedTo = left.getText();
      }
    }
  }
  return { assignedTo };
}

function incrementMethodCallCount(
  methodCallCounts: Map<string, Record<string, number>>,
  methodName: string | undefined,
  callName: string
): void {
  if (!methodName) {
    return;
  }

  const existing = methodCallCounts.get(methodName) ?? {};
  existing[callName] = (existing[callName] ?? 0) + 1;
  methodCallCounts.set(methodName, existing);
}

function detectCleanupOwnership(
  subscribeCall: ts.CallExpression,
  parent: ts.Node | undefined
): { assigned: boolean; inComposite: boolean } {
  if (!parent) {
    return { assigned: false, inComposite: false };
  }

  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    if (parent.right === subscribeCall) {
      return { assigned: true, inComposite: false };
    }
  }

  if (ts.isCallExpression(parent)) {
    const calleeName = getCallName(parent.expression);
    if (calleeName === "add" && parent.arguments.some((arg) => arg === subscribeCall)) {
      return { assigned: false, inComposite: true };
    }
  }

  return { assigned: false, inComposite: false };
}

function getObservableSourceRoot(expression: ts.Expression): ts.Expression {
  if (ts.isCallExpression(expression)) {
    const callee = expression.expression;
    const callName = getCallName(callee);
    if (callName === "pipe" && ts.isPropertyAccessExpression(callee)) {
      return getObservableSourceRoot(callee.expression);
    }
  }

  return expression;
}

type SourceClassification = "longLived" | "intervalFromEvent" | "shortLived" | "unknown";

function classifyObservableSource(
  streamExpression: ts.Expression,
  isHttpLike: boolean,
  usesTakeOneLike: boolean
): SourceClassification {
  if (isHttpLike || usesTakeOneLike) {
    return "shortLived";
  }

  const root = getObservableSourceRoot(streamExpression);

  if (ts.isCallExpression(root)) {
    const calleeName = getCallName(root.expression);
    if (calleeName) {
      const lower = calleeName.toLowerCase();
      if (
        lower === "fromevent" ||
        lower === "interval" ||
        lower === "timer"
      ) {
        return "intervalFromEvent";
      }
      if (
        lower === "merge" ||
        lower === "combinelatest" ||
        lower === "concat"
      ) {
        return "longLived";
      }
      if (lower === "select" && expressionLooksStore(root.expression)) {
        return "longLived";
      }
    }
  }

  if (ts.isPropertyAccessExpression(root)) {
    const propName = root.name.text.toLowerCase();
    if (
      propName === "valuechanges" ||
      propName === "statuschanges"
    ) {
      return "longLived";
    }
    if (
      propName === "events" &&
      expressionLooksRouter(root.expression)
    ) {
      return "longLived";
    }
    if (
      (propName === "params" ||
        propName === "queryparams" ||
        propName === "data" ||
        propName === "parammap" ||
        propName === "queryparammap") &&
      expressionLooksActivatedRoute(root.expression)
    ) {
      return "longLived";
    }
    if (expressionLooksSubject(root)) {
      return "longLived";
    }
  }

  return "unknown";
}

function expressionLooksRouter(expression: ts.Expression): boolean {
  const text = expression.getText().toLowerCase();
  return text.includes("router");
}

function expressionLooksActivatedRoute(expression: ts.Expression): boolean {
  const text = expression.getText().toLowerCase();
  return text.includes("route") || text.includes("activatedroute");
}

function expressionLooksStore(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) {
    const text = expression.expression.getText().toLowerCase();
    return text.includes("store");
  }
  return false;
}

function expressionLooksSubject(node: ts.PropertyAccessExpression): boolean {
  const baseText = node.expression.getText().toLowerCase();
  const propText = node.name.text;
  if (propText.endsWith("$")) {
    return true;
  }
  return (
    baseText.includes("subject") ||
    baseText.includes("behaviorsubject") ||
    baseText.includes("replaysubject")
  );
}

function analyzeSubscribeCall(callExpression: ts.CallExpression): {
  isManaged: boolean;
  usesTakeUntil: boolean;
  usesTakeUntilDestroyed: boolean;
  usesTakeOneLike: boolean;
  usesDestroySignalInTakeUntil: boolean;
  isHttpLike: boolean;
  sourceClassification: SourceClassification;
} {
  if (!ts.isPropertyAccessExpression(callExpression.expression)) {
    return {
      isManaged: false,
      usesTakeUntil: false,
      usesTakeUntilDestroyed: false,
      usesTakeOneLike: false,
      usesDestroySignalInTakeUntil: false,
      isHttpLike: false,
      sourceClassification: "unknown",
    };
  }

  const streamExpression = callExpression.expression.expression;
  const pipeOperators = extractPipeOperators(streamExpression);

  const takeOperator = pipeOperators.find((operator) => operator.name === "take");
  const usesTakeOneLike =
    pipeOperators.some((operator) =>
      operator.name === "first" || operator.name === "single"
    ) || (takeOperator !== undefined && isTakeOneCall(takeOperator.callExpression));

  const takeUntilOperator = pipeOperators.find((operator) => operator.name === "takeUntil");
  const usesTakeUntil = takeUntilOperator !== undefined;
  const usesDestroySignalInTakeUntil =
    takeUntilOperator !== undefined &&
    takeUntilOperator.callExpression.arguments.some((argument) =>
      expressionContainsDestroySignal(argument)
    );

  const usesTakeUntilDestroyed = pipeOperators.some(
    (operator) => operator.name === "takeUntilDestroyed"
  );

  const isHttpLike = isHttpLikeObservable(streamExpression);

  const sourceClassification = classifyObservableSource(
    streamExpression,
    isHttpLike,
    usesTakeOneLike
  );

  return {
    isManaged:
      usesTakeUntil || usesTakeUntilDestroyed || usesTakeOneLike || isHttpLike,
    usesTakeUntil,
    usesTakeUntilDestroyed,
    usesTakeOneLike,
    usesDestroySignalInTakeUntil,
    isHttpLike,
    sourceClassification,
  };
}

function extractPipeOperators(
  expression: ts.Expression
): Array<{ name: string; callExpression: ts.CallExpression }> {
  if (!ts.isCallExpression(expression)) {
    return [];
  }

  const callName = getCallName(expression.expression);

  if (callName !== "pipe") {
    return extractPipeOperatorsFromNestedExpression(expression.expression);
  }

  const operators: Array<{ name: string; callExpression: ts.CallExpression }> = [];

  for (const argument of expression.arguments) {
    if (!ts.isCallExpression(argument)) {
      continue;
    }

    const operatorName = getCallName(argument.expression);

    if (operatorName) {
      operators.push({
        name: operatorName,
        callExpression: argument,
      });
    }
  }

  return operators;
}

function extractPipeOperatorsFromNestedExpression(
  expression: ts.Expression
): Array<{ name: string; callExpression: ts.CallExpression }> {
  if (ts.isPropertyAccessExpression(expression)) {
    return extractPipeOperators(expression.expression);
  }

  if (ts.isCallExpression(expression)) {
    return extractPipeOperators(expression);
  }

  return [];
}

function isTakeOneCall(callExpression: ts.CallExpression): boolean {
  if (callExpression.arguments.length !== 1) {
    return false;
  }

  const firstArgument = callExpression.arguments[0];

  if (ts.isNumericLiteral(firstArgument)) {
    return firstArgument.text === "1";
  }

  return firstArgument.getText() === "1";
}

function isHttpLikeObservable(expression: ts.Expression): boolean {
  if (ts.isCallExpression(expression)) {
    return isHttpLikeObservableCall(expression) || isHttpLikeObservable(expression.expression);
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return isHttpLikeObservable(expression.expression);
  }

  return false;
}

function isHttpLikeObservableCall(callExpression: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(callExpression.expression)) {
    return false;
  }

  const methodName = callExpression.expression.name.text;

  if (!HTTP_METHOD_NAMES.has(methodName)) {
    return false;
  }

  return expressionLooksHttpClient(callExpression.expression.expression);
}

function expressionLooksHttpClient(expression: ts.Expression): boolean {
  if (ts.isIdentifier(expression)) {
    return expression.text.toLowerCase().includes("http");
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return (
      expression.name.text.toLowerCase().includes("http") ||
      expressionLooksHttpClient(expression.expression)
    );
  }

  return false;
}

function expressionContainsDestroySignal(expression: ts.Node): boolean {
  if (ts.isIdentifier(expression) && isDestroySignalName(expression.text)) {
    return true;
  }

  if (ts.isPropertyAccessExpression(expression) && isDestroySignalName(expression.name.text)) {
    return true;
  }

  let containsDestroySignal = false;

  ts.forEachChild(expression, (child) => {
    if (containsDestroySignal) {
      return;
    }

    if (expressionContainsDestroySignal(child)) {
      containsDestroySignal = true;
    }
  });

  return containsDestroySignal;
}

function isDestroySignalName(name: string): boolean {
  return /^destroy(ed)?\$?$/i.test(name) || /^destroy\$/i.test(name) || /^destroyed\$/i.test(name);
}

function createEmptySignals(): LifecycleDetectionSignals {
  return {
    subscribeCount: 0,
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
  };
}

function getDecoratorNames(node: ts.Node): string[] {
  const decorators = getDecorators(node);

  return decorators
    .map((decorator) => getDecoratorName(decorator))
    .filter((name): name is string => name !== undefined);
}

function getDecorators(node: ts.Node): readonly ts.Decorator[] {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }

  return ts.getDecorators(node) ?? [];
}

function getDecoratorName(decorator: ts.Decorator): string | undefined {
  const { expression } = decorator;

  if (ts.isCallExpression(expression)) {
    if (ts.isIdentifier(expression.expression)) {
      return expression.expression.text;
    }

    if (ts.isPropertyAccessExpression(expression.expression)) {
      return expression.expression.name.text;
    }
  }

  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  return undefined;
}

function isCallByName(expression: ts.Expression, name: string): boolean {
  if (!ts.isCallExpression(expression)) {
    return false;
  }

  const callName = getCallName(expression.expression);
  return callName === name;
}

function getCallName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return undefined;
}

function getHighestSeverity(
  warnings: { severity: LifecycleSeverity }[]
): LifecycleSeverity | undefined {
  if (warnings.length === 0) {
    return undefined;
  }

  let highest = warnings[0].severity;

  for (const warning of warnings) {
    if (severityPriority[warning.severity] > severityPriority[highest]) {
      highest = warning.severity;
    }
  }

  return highest;
}
