import * as ts from "typescript";
import type { ResponsibilityMetrics } from "./responsibility-models";
import type { ComponentAnalysisResult } from "../component-analyzer";
import type { LifecycleAnalysisResult } from "../lifecycle/lifecycle-models";
import type { TemplateMetrics } from "../template/template-models";
import { LIFECYCLE_HOOKS } from "../lifecycle/lifecycle-models";

const UI_STATE_PATTERNS = [
  "selected",
  "current",
  "active",
  "open",
  "isloading",
  "issubmitting",
  "expanded",
  "visible",
  "loading",
  "submitting",
  "ispending",
  "issaving",
  "isopen",
  "isexpanded",
  "isvisible",
  "show",
  "display",
  "hidden",
  "collapsed",
];

export interface ResponsibilityUpstream {
  componentResult: ComponentAnalysisResult;
  lifecycleResult?: LifecycleAnalysisResult;
  templateResult?: { metrics: TemplateMetrics };
}

export function extractResponsibilityMetrics(
  classNode: ts.ClassDeclaration,
  upstream?: ResponsibilityUpstream
): ResponsibilityMetrics {
  const metrics: ResponsibilityMetrics = {
    methodCount: 0,
    publicMethodCount: 0,
    propertyCount: 0,
    inputCount: 0,
    outputCount: 0,
    dependencyCount: upstream?.componentResult?.dependencyCount ?? 0,
    formGroupCount: 0,
    formControlCount: 0,
    formBuilderUsage: false,
    formPatchSetUpdateCount: 0,
    routerUsage: false,
    matDialogUsage: false,
    modalOrDrawerUsage: false,
    serviceOrchestrationCount: 0,
    uiStateFieldCount: 0,
    addEventListenerCount: upstream?.lifecycleResult?.signals?.addEventListenerCount ?? 0,
    setTimeoutCount: upstream?.lifecycleResult?.signals?.setTimeoutCount ?? 0,
    setIntervalCount: upstream?.lifecycleResult?.signals?.setIntervalCount ?? 0,
    rendererListenCount: upstream?.lifecycleResult?.signals?.rendererListenCount ?? 0,
  };

  const injectedParamNames = getInjectedServiceNames(classNode);
  const propertyNames = new Set<string>();

  for (const member of classNode.members) {
    if (ts.isMethodDeclaration(member)) {
      metrics.methodCount += 1;
      const isPrivate = hasModifier(member, ts.SyntaxKind.PrivateKeyword);
      const methodName = member.name && ts.isIdentifier(member.name) ? member.name.text : "";
      const isLifecycleHook = LIFECYCLE_HOOKS.includes(methodName as never);

      if (!isPrivate && !isLifecycleHook) {
        metrics.publicMethodCount += 1;
      }
    }

    if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
      metrics.propertyCount += 1;
      propertyNames.add(member.name.text);

      const propNameLower = member.name.text.toLowerCase();
      if (UI_STATE_PATTERNS.some((p) => propNameLower.includes(p) || propNameLower === p)) {
        metrics.uiStateFieldCount += 1;
      }
    }

    const decoratorNames = getDecoratorNames(member);
    if (decoratorNames.includes("Input")) {
      metrics.inputCount += 1;
    }
    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      isCallByName(member.initializer, "input")
    ) {
      metrics.inputCount += 1;
    }
    if (decoratorNames.includes("Output")) {
      metrics.outputCount += 1;
    }
    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      isCallByName(member.initializer, "output")
    ) {
      metrics.outputCount += 1;
    }
  }

  visitForFormAndOrchestration(classNode, metrics, injectedParamNames);

  return metrics;
}

function getInjectedServiceNames(classNode: ts.ClassDeclaration): Set<string> {
  const names = new Set<string>();

  for (const member of classNode.members) {
    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        if (param.name && ts.isIdentifier(param.name)) {
          names.add(param.name.text);
        }
      }
    }

    if (
      ts.isPropertyDeclaration(member) &&
      member.initializer &&
      isCallByName(member.initializer, "inject") &&
      member.name &&
      ts.isIdentifier(member.name)
    ) {
      names.add(member.name.text);
    }
  }

  return names;
}

function visitForFormAndOrchestration(
  node: ts.Node,
  metrics: ResponsibilityMetrics,
  injectedParamNames: Set<string>
): void {
  if (ts.isCallExpression(node)) {
    const callName = getCallName(node.expression);

    if (callName === "patchValue" || callName === "setValue" || callName === "updateValueAndValidity") {
      metrics.formPatchSetUpdateCount += 1;
    }

    if (callName === "group" || callName === "control" || callName === "array") {
      const baseText = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.expression.getText().toLowerCase()
        : "";
      if (baseText.includes("formbuilder") || baseText.includes("fb")) {
        metrics.formBuilderUsage = true;
      }
    }

    if (ts.isPropertyAccessExpression(node.expression)) {
      const receiver = node.expression.expression;
      const receiverText = receiver.getText().toLowerCase();
      const methodName = node.expression.name.text;

      const receiverName =
        ts.isPropertyAccessExpression(receiver) && ts.isIdentifier(receiver.name)
          ? receiver.name.text
          : ts.isIdentifier(receiver)
            ? receiver.text
            : "";

      if (injectedParamNames.has(receiverName)) {
        metrics.serviceOrchestrationCount += 1;
      }

      if (methodName === "navigate" || methodName === "navigateByUrl") {
        if (receiverText.includes("router")) {
          metrics.routerUsage = true;
        }
      }

      if (methodName === "open") {
        if (receiverText.includes("dialog") || receiverText.includes("matdialog")) {
          metrics.matDialogUsage = true;
        }
        if (
          receiverText.includes("drawer") ||
          receiverText.includes("modal") ||
          receiverText.includes("cdkdialog") ||
          receiverText.includes("dialogref")
        ) {
          metrics.modalOrDrawerUsage = true;
        }
      }
    }

    if (ts.isNewExpression(node.expression)) {
      const ctor = node.expression;
      if (ts.isIdentifier(ctor.expression)) {
        const name = ctor.expression.text;
        if (name === "FormGroup") metrics.formGroupCount += 1;
        if (name === "FormControl") metrics.formControlCount += 1;
      }
    }
  }

  if (ts.isPropertyAccessExpression(node)) {
    const text = node.getText().toLowerCase();
    if (text.includes("formgroup") && (text.includes("group") || text.endsWith("form"))) {
      if (node.name.text === "group" || node.parent && ts.isCallExpression(node.parent)) {
        metrics.formGroupCount += 1;
      }
    }
  }

  if (
    ts.isPropertyDeclaration(node) &&
    node.type &&
    ts.isTypeReferenceNode(node.type) &&
    ts.isIdentifier(node.type.typeName)
  ) {
    const typeName = node.type.typeName.text;
    if (typeName === "FormGroup") metrics.formGroupCount += 1;
    if (typeName === "FormControl") metrics.formControlCount += 1;
  }

  if (
    ts.isVariableDeclaration(node) &&
    node.type &&
    ts.isTypeReferenceNode(node.type) &&
    ts.isIdentifier(node.type.typeName)
  ) {
    const typeName = node.type.typeName.text;
    if (typeName === "FormGroup") metrics.formGroupCount += 1;
    if (typeName === "FormControl") metrics.formControlCount += 1;
  }

  ts.forEachChild(node, (child) =>
    visitForFormAndOrchestration(child, metrics, injectedParamNames)
  );
}

function hasModifier(node: ts.MethodDeclaration, kind: ts.SyntaxKind): boolean {
  if (!node.modifiers) return false;
  return node.modifiers.some((m) => m.kind === kind);
}

function getDecoratorNames(node: ts.Node): string[] {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
  return decorators
    .map((d) => {
      const expr = d.expression;
      if (ts.isIdentifier(expr)) return expr.text;
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
        return expr.expression.text;
      }
      if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
        return expr.expression.name.text;
      }
      return undefined;
    })
    .filter((n): n is string => n !== undefined);
}

function isCallByName(expression: ts.Expression, name: string): boolean {
  if (!ts.isCallExpression(expression)) return false;
  const callName = getCallName(expression.expression);
  return callName === name;
}

function getCallName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return undefined;
}
