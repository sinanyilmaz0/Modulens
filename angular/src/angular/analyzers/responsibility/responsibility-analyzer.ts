import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import type { ExplainedScore, ScoreFactor } from "../../../core/scan-result";
import type { ComponentAnalysisResult } from "../component-analyzer";
import type { LifecycleAnalysisResult } from "../lifecycle/lifecycle-models";
import type { TemplateAnalysisResult } from "../template/template-models";
import type { ResponsibilityMetrics } from "./responsibility-models";
import {
  ResponsibilityAnalysisContext,
  ResponsibilityAnalysisResult,
  ResponsibilitySeverity,
  ResponsibilitySummary,
} from "./responsibility-models";
import {
  extractResponsibilityMetrics,
  type ResponsibilityUpstream,
} from "./responsibility-metrics";
import { evaluateResponsibilityRules } from "./responsibility-rules";
import {
  calculateResponsibilityScore,
  getResponsibilityRiskLevel,
} from "./responsibility-score";

const severityPriority: Record<ResponsibilitySeverity, number> = {
  info: 0,
  warning: 1,
  high: 2,
  critical: 3,
};

export function analyzeResponsibility(
  componentPath: string,
  upstream?: ResponsibilityUpstream
): ResponsibilityAnalysisResult {
  const content = fs.readFileSync(componentPath, "utf-8");
  const fileName = path.basename(componentPath);
  const sourceFile = ts.createSourceFile(
    componentPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const componentClass = findComponentClass(sourceFile);

  if (!componentClass) {
    const metrics = createEmptyMetrics(upstream);

    const context: ResponsibilityAnalysisContext = {
      filePath: componentPath,
      fileName,
      className: fileName.replace(".ts", ""),
      metrics,
      lineCount: upstream?.componentResult?.lineCount,
      lifecycleSignals: upstream?.lifecycleResult?.signals,
      templateMetrics: upstream?.templateResult?.metrics,
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

  const className = componentClass.name?.text ?? fileName.replace(".ts", "");
  const metrics = extractResponsibilityMetrics(componentClass, upstream);

  const context: ResponsibilityAnalysisContext = {
    filePath: componentPath,
    fileName,
    className,
    metrics,
    lineCount: upstream?.componentResult?.lineCount,
    lifecycleSignals: upstream?.lifecycleResult?.signals,
    templateMetrics: upstream?.templateResult?.metrics,
  };

  const warnings = evaluateResponsibilityRules(context);
  const explained = calculateResponsibilityScore(context, warnings);

  return {
    ...context,
    warnings,
    score: explained.score,
    explainedScore: { score: explained.score, factors: explained.factors },
    riskLevel: getResponsibilityRiskLevel(explained.score),
    highestSeverity: getHighestSeverity(warnings),
  };
}

export function summarizeResponsibilityResults(
  results: ResponsibilityAnalysisResult[]
): ResponsibilitySummary {
  const severityCounts: Record<ResponsibilitySeverity, number> = {
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
      averageScore: 10,
      explainedScore: { score: 10, factors: [] },
      riskLevel: "Low",
      totalWarnings: 0,
      componentsWithWarnings: 0,
      severityCounts,
      confidenceCounts,
    };
  }

  let scoreTotal = 0;
  let totalWarnings = 0;
  let componentsWithWarnings = 0;
  let highConfidenceWarningCount = 0;
  const factorContributions: Record<string, number[]> = {};

  for (const result of results) {
    scoreTotal += result.score;
    totalWarnings += result.warnings.length;

    if (result.warnings.length > 0) {
      componentsWithWarnings += 1;
    }

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
    "Method Count": 0.2,
    "Public Method Count": 0.15,
    "Property Count": 0.1,
    "UI State Fields": 0.1,
    "Form Intensity": 0.15,
    "Input/Output Count": 0.1,
    "Large Component": 0.1,
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
        description: getResponsibilityFactorDescription(name),
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
    averageScore,
    explainedScore,
    riskLevel: getResponsibilityRiskLevel(averageScore),
    totalWarnings,
    componentsWithWarnings,
    severityCounts,
    confidenceCounts,
  };
}

function getResponsibilityFactorDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Method Count": "High method count",
    "Public Method Count": "Too many public methods",
    "Property Count": "High property count",
    "UI State Fields": "Too many UI state fields",
    "Form Intensity": "Heavy form usage",
    "Input/Output Count": "Too many inputs/outputs",
    "Large Component": "Large component with many methods",
    "Rule Warnings": "Responsibility rule violations",
    "Warning Volume": "Many warnings",
    "Warning Density": "High warning density across workspace",
  };
  return descriptions[name] ?? name;
}

function findComponentClass(
  sourceFile: ts.SourceFile
): ts.ClassDeclaration | undefined {
  let result: ts.ClassDeclaration | undefined;

  sourceFile.forEachChild((node) => {
    if (result || !ts.isClassDeclaration(node)) {
      return;
    }

    const decoratorNames = getDecoratorNames(node);

    if (decoratorNames.includes("Component")) {
      result = node;
    }
  });

  return result;
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

function getHighestSeverity(
  warnings: { severity: ResponsibilitySeverity }[]
): ResponsibilitySeverity | undefined {
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

function createEmptyMetrics(upstream?: ResponsibilityUpstream): ResponsibilityMetrics {
  return {
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
}
