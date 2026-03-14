import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import type { ExplainedScore, ScoreFactor } from "../../../core/scan-result";
import {
  TemplateAnalysisContext,
  TemplateAnalysisResult,
  TemplateMetrics,
  TemplateSeverity,
  TemplateSummary,
} from "./template-models";
import { extractTemplateMetrics } from "./template-metrics";
import { evaluateTemplateRules } from "./template-rules";
import { calculateTemplateScore, getTemplateRiskLevel } from "./template-score";

const severityPriority: Record<TemplateSeverity, number> = {
  info: 0,
  warning: 1,
  high: 2,
  critical: 3,
};

function createEmptyMetrics(): TemplateMetrics {
  return {
    lineCount: 0,
    interpolationCount: 0,
    propertyBindingCount: 0,
    eventBindingCount: 0,
    twoWayBindingCount: 0,
    ngIfCount: 0,
    ngForCount: 0,
    atForCount: 0,
    atIfCount: 0,
    ngTemplateCount: 0,
    ngContainerCount: 0,
    structuralDepth: 0,
    methodCallCount: 0,
    longExpressionCount: 0,
    trackByCount: 0,
  };
}

export interface ResolvedTemplate {
  content: string;
  source: "inline" | "external";
  templatePath?: string;
}

export function resolveTemplateContent(
  componentPath: string,
  content?: string
): ResolvedTemplate | null {
  const fileContent = content ?? fs.readFileSync(componentPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    componentPath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const componentConfig = findComponentConfig(sourceFile);
  if (!componentConfig) {
    return null;
  }

  const templateValue = getPropertyStringValue(componentConfig, "template");
  if (templateValue !== undefined) {
    return {
      content: templateValue,
      source: "inline",
    };
  }

  const templateUrlValue = getPropertyStringValue(componentConfig, "templateUrl");
  if (templateUrlValue !== undefined) {
    const componentDir = path.dirname(componentPath);
    const templatePath = path.resolve(componentDir, templateUrlValue);

    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, "utf-8");
      return {
        content: templateContent,
        source: "external",
        templatePath,
      };
    }
  }

  return null;
}

function findComponentConfig(
  sourceFile: ts.SourceFile
): ts.ObjectLiteralExpression | undefined {
  let config: ts.ObjectLiteralExpression | undefined;

  sourceFile.forEachChild((node) => {
    if (config || !ts.isClassDeclaration(node)) {
      return;
    }

    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];

    for (const decorator of decorators) {
      const expr = decorator.expression;
      if (!ts.isCallExpression(expr)) continue;

      const callee = expr.expression;
      const decoratorName =
        ts.isIdentifier(callee)
          ? callee.text
          : ts.isPropertyAccessExpression(callee)
            ? callee.name.text
            : null;

      if (decoratorName !== "Component") continue;

      if (expr.arguments.length > 0) {
        const arg = expr.arguments[0];
        if (ts.isObjectLiteralExpression(arg)) {
          config = arg;
          return;
        }
      }
    }
  });

  return config;
}

function getPropertyStringValue(
  obj: ts.ObjectLiteralExpression,
  propertyName: string
): string | undefined {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !prop.name) continue;

    const name =
      ts.isIdentifier(prop.name)
        ? prop.name.text
        : ts.isComputedPropertyName(prop.name)
          ? undefined
          : undefined;

    if (name !== propertyName) continue;

    const initializer = prop.initializer;
    if (ts.isStringLiteral(initializer)) {
      return initializer.text;
    }
    if (ts.isNoSubstitutionTemplateLiteral(initializer)) {
      return initializer.text;
    }
    if (ts.isTemplateExpression(initializer)) {
      return initializer.head.text + initializer.templateSpans.map((s) => s.literal.text).join("");
    }
  }

  return undefined;
}

function getComponentClassName(sourceFile: ts.SourceFile): string {
  const content = sourceFile.getFullText();
  const fileName = path.basename(sourceFile.fileName);
  const fallback = fileName.replace(/\.component\.ts$/, "");

  let className: string | undefined;

  sourceFile.forEachChild((node) => {
    if (className || !ts.isClassDeclaration(node)) return;
    const decoratorNames = getDecoratorNames(node);
    if (decoratorNames.includes("Component")) {
      className = node.name?.text ?? fallback;
    }
  });

  return className ?? fallback;
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

export function analyzeTemplate(componentPath: string): TemplateAnalysisResult {
  const content = fs.readFileSync(componentPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    componentPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const fileName = path.basename(componentPath);
  const className = getComponentClassName(sourceFile);

  const resolved = resolveTemplateContent(componentPath, content);

  if (!resolved) {
    const context: TemplateAnalysisContext = {
      filePath: componentPath,
      fileName,
      className,
      hasTemplate: false,
      templateSource: "none",
      metrics: createEmptyMetrics(),
    };

    return {
      ...context,
      warnings: [],
      score: 10,
      explainedScore: { score: 10, factors: [] },
      riskLevel: "Low",
      highestSeverity: undefined,
    };
  }

  const metrics = extractTemplateMetrics(resolved.content);

  const context: TemplateAnalysisContext = {
    filePath: componentPath,
    fileName,
    className,
    hasTemplate: true,
    templateSource: resolved.source,
    templatePath: resolved.templatePath,
    metrics,
  };

  const warnings = evaluateTemplateRules(context);
  const explained = calculateTemplateScore(context, warnings);

  return {
    ...context,
    warnings,
    score: explained.score,
    explainedScore: { score: explained.score, factors: explained.factors },
    riskLevel: getTemplateRiskLevel(explained.score),
    highestSeverity: getHighestSeverity(warnings),
  };
}

function getHighestSeverity(
  warnings: { severity: TemplateSeverity }[]
): TemplateSeverity | undefined {
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

export function summarizeTemplateResults(
  results: TemplateAnalysisResult[]
): TemplateSummary {
  const severityCounts: Record<TemplateSeverity, number> = {
    info: 0,
    warning: 0,
    high: 0,
    critical: 0,
  };

  const confidenceCounts: Record<"low" | "medium" | "high", number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  if (results.length === 0) {
    return {
      totalComponents: 0,
      componentsWithTemplate: 0,
      componentsWithoutTemplate: 0,
      averageScore: 10,
      explainedScore: { score: 10, factors: [] },
      riskLevel: "Low",
      totalWarnings: 0,
      componentsWithWarnings: 0,
      severityCounts,
      confidenceCounts,
    };
  }

  const withTemplate = results.filter((r) => r.hasTemplate);
  const withoutTemplate = results.filter((r) => !r.hasTemplate);
  const withWarnings = results.filter((r) => r.warnings.length > 0);

  let scoreTotal = 0;
  let totalWarnings = 0;
  let highConfidenceWarningCount = 0;

  const factorContributions: Record<string, number[]> = {};

  for (const result of results) {
    scoreTotal += result.score;
    totalWarnings += result.warnings.length;

    for (const warning of result.warnings) {
      severityCounts[warning.severity] += 1;
      confidenceCounts[warning.confidence] += 1;
      if (warning.confidence === "high") {
        highConfidenceWarningCount += 1;
      }
    }

    if (result.explainedScore?.factors) {
      for (const f of result.explainedScore.factors) {
        if (!factorContributions[f.name]) factorContributions[f.name] = [];
        factorContributions[f.name].push(f.contribution);
      }
    }
  }

  const baseAverageScore = scoreTotal / results.length;
  const warningDensity = totalWarnings / results.length;
  const criticalDensity = severityCounts.critical / results.length;
  const highConfidenceDensity = highConfidenceWarningCount / results.length;
  const densityPenalty = Math.min(
    4,
    warningDensity * 0.8 + criticalDensity * 4 + highConfidenceDensity * 1.5
  );
  const adjustedAverage = Math.max(0, Math.min(10, baseAverageScore - densityPenalty));
  const averageScore = Number(adjustedAverage.toFixed(1));

  const factorWeights: Record<string, number> = {
    "Template Size": 0.4,
    "Method Call Density": 0.25,
    "Binding Density": 0.1,
    "Structural Depth": 0.15,
    "ngFor Without trackBy": 0.2,
    "Long Expressions": 0.1,
    "Event Bindings": 0.2,
    "Rule Warnings": 0.35,
    "Warning Volume": 0.15,
  };

  const aggregatedFactors: ScoreFactor[] = Object.entries(factorContributions).map(
    ([name, contributions]) => {
      const avgContribution =
        contributions.reduce((a, b) => a + b, 0) / contributions.length;
      return {
        name,
        weight: factorWeights[name] ?? 0.1,
        contribution: Number(avgContribution.toFixed(2)),
        description: getFactorDescription(name),
      };
    }
  );

  if (densityPenalty > 0) {
    aggregatedFactors.push({
      name: "Warning Density",
      weight: 0.15,
      contribution: -densityPenalty,
      description: "High warning density across workspace",
    });
  }

  const explainedScore: ExplainedScore = {
    score: averageScore,
    factors: aggregatedFactors,
  };

  return {
    totalComponents: results.length,
    componentsWithTemplate: withTemplate.length,
    componentsWithoutTemplate: withoutTemplate.length,
    averageScore,
    explainedScore,
    riskLevel: getTemplateRiskLevel(averageScore),
    totalWarnings,
    componentsWithWarnings: withWarnings.length,
    severityCounts,
    confidenceCounts,
  };
}

function getFactorDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Template Size": "Large template detected",
    "Method Call Density": "High method calls in template",
    "Binding Density": "High binding density",
    "Structural Depth": "Deep structural directives",
    "ngFor Without trackBy": "ngFor missing trackBy",
    "Long Expressions": "Complex expressions",
    "Event Bindings": "High number of event bindings",
    "Rule Warnings": "Template rule violations",
    "Warning Volume": "Many warnings",
    "Warning Density": "High warning density across workspace",
  };
  return descriptions[name] ?? name;
}
