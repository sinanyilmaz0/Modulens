import { TemplateMetrics } from "./template-models";

const INTERPOLATION_REGEX = /\{\{[^}]*\}\}/g;
const PROPERTY_BINDING_REGEX = /\[[\w.-]+\]="[^"]*"/g;
const EVENT_BINDING_REGEX = /\([\w.-]+\)="[^"]*"/g;
const TWO_WAY_BINDING_REGEX = /\[\([\w.-]+\)\]="[^"]*"/g;
const NG_IF_REGEX = /\*ngIf\b/g;
const NG_FOR_REGEX = /\*ngFor\b/g;
const AT_FOR_REGEX = /@for\s*\(/g;
const AT_IF_REGEX = /@if\s*\(/g;
const NG_TEMPLATE_REGEX = /<ng-template\b/g;
const NG_CONTAINER_REGEX = /<ng-container\b/g;
const TRACK_BY_REGEX = /trackBy\s*:/gi;
const TRACK_REGEX = /;\s*track\s*:/g;

/** Method call pattern: identifier followed by ( - excludes pipe syntax like | uppercase */
const METHOD_CALL_IN_INTERPOLATION_REGEX = /\{\{([^}]*)\}\}/g;
const METHOD_CALL_IN_BINDING_REGEX = /="([^"]*)"/g;
const IDENTIFIER_CALL_REGEX = /\b([a-zA-Z_$][\w$]*)\s*\([^)]*\)/g;

const LONG_EXPRESSION_THRESHOLD = 80;

export function extractTemplateMetrics(content: string): TemplateMetrics {
  const lines = content.split(/\r?\n/);
  const lineCount = lines.length;

  const interpolationCount = countMatches(content, INTERPOLATION_REGEX);
  const propertyBindingCount = countMatches(content, PROPERTY_BINDING_REGEX);
  const eventBindingCount = countMatches(content, EVENT_BINDING_REGEX);
  const twoWayBindingCount = countMatches(content, TWO_WAY_BINDING_REGEX);
  const ngIfCount = countMatches(content, NG_IF_REGEX);
  const ngForCount = countMatches(content, NG_FOR_REGEX);
  const atForCount = countMatches(content, AT_FOR_REGEX);
  const atIfCount = countMatches(content, AT_IF_REGEX);
  const ngTemplateCount = countMatches(content, NG_TEMPLATE_REGEX);
  const ngContainerCount = countMatches(content, NG_CONTAINER_REGEX);
  const trackByCount =
    countMatches(content, TRACK_BY_REGEX) + countMatches(content, TRACK_REGEX);

  const methodCallCount = countMethodCalls(content);
  const longExpressionCount = countLongExpressions(content);
  const structuralDepth = computeStructuralDepth(content);

  return {
    lineCount,
    interpolationCount,
    propertyBindingCount,
    eventBindingCount,
    twoWayBindingCount,
    ngIfCount,
    ngForCount,
    atForCount,
    atIfCount,
    ngTemplateCount,
    ngContainerCount,
    structuralDepth,
    methodCallCount,
    longExpressionCount,
    trackByCount,
  };
}

function countMatches(content: string, regex: RegExp): number {
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function countMethodCalls(content: string): number {
  let count = 0;

  let match: RegExpExecArray | null;
  const interpolationRegex = new RegExp(METHOD_CALL_IN_INTERPOLATION_REGEX.source, "g");
  while ((match = interpolationRegex.exec(content)) !== null) {
    const inner = match[1];
    count += countMethodCallsInExpression(inner);
  }

  const bindingRegex = new RegExp(METHOD_CALL_IN_BINDING_REGEX.source, "g");
  while ((match = bindingRegex.exec(content)) !== null) {
    const inner = match[1];
    count += countMethodCallsInExpression(inner);
  }

  return count;
}

function countMethodCallsInExpression(expression: string): number {
  let count = 0;
  const callRegex = new RegExp(IDENTIFIER_CALL_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = callRegex.exec(expression)) !== null) {
    const callText = match[0];
    const callee = match[1]?.toLowerCase() ?? "";

    if (isPipeOrBuiltin(callee)) {
      continue;
    }
    count += 1;
  }

  return count;
}

function isPipeOrBuiltin(name: string): boolean {
  const builtins = new Set([
    "if",
    "else",
    "for",
    "switch",
    "as",
    "let",
    "of",
    "track",
    "null",
    "undefined",
    "true",
    "false",
  ]);
  return builtins.has(name);
}

function countLongExpressions(content: string): number {
  let count = 0;

  let match: RegExpExecArray | null;
  const interpolationRegex = new RegExp(METHOD_CALL_IN_INTERPOLATION_REGEX.source, "g");
  while ((match = interpolationRegex.exec(content)) !== null) {
    const inner = match[1].trim();
    if (inner.length > LONG_EXPRESSION_THRESHOLD) {
      count += 1;
    }
  }

  const bindingRegex = new RegExp(METHOD_CALL_IN_BINDING_REGEX.source, "g");
  while ((match = bindingRegex.exec(content)) !== null) {
    const inner = match[1].trim();
    if (inner.length > LONG_EXPRESSION_THRESHOLD) {
      count += 1;
    }
  }

  return count;
}

function computeStructuralDepth(content: string): number {
  const structuralPatterns = [/\*ngIf\b/, /\*ngFor\b/, /\*ngSwitch\b/, /@if\s*\(/, /@for\s*\(/, /@switch\s*\(/];

  const lines = content.split(/\r?\n/);
  let maxDepth = 0;
  const indentStack: number[] = [-1];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const indent = line.search(/\S/);
    if (indent < 0) continue;

    const hasStructural = structuralPatterns.some((re) => re.test(trimmed));

    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
    }

    if (hasStructural) {
      indentStack.push(indent);
      maxDepth = Math.max(maxDepth, indentStack.length - 1);
    }
  }

  return maxDepth;
}
