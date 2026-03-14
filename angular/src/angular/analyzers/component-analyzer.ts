import { glob } from "glob";
import * as path from "path";
import * as fs from "fs";

export type Severity = "WARNING" | "HIGH" | "CRITICAL";

export interface AnalysisIssue {
  type: string;
  message: string;
  severity: Severity;
}

export interface ComponentAnalysisResult {
  filePath: string;
  fileName: string;
  lineCount: number;
  dependencyCount: number;
  issues: AnalysisIssue[];
  highestSeverity?: Severity;
}

export async function findComponents(
  workspacePath: string,
  sourceRoot: string
): Promise<string[]> {
  const pattern = path.join(sourceRoot, "**/*.component.ts").replace(/\\/g, "/");

  const files = await glob(pattern, {
    cwd: workspacePath,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.angular/**"],
  });

  return files;
}

export function analyzeComponent(componentPath: string): ComponentAnalysisResult {
  const content = fs.readFileSync(componentPath, "utf-8");
  const lineCount = content.split(/\r?\n/).length;
  const fileName = path.basename(componentPath);

  const issues: AnalysisIssue[] = [];

  const dependencyCount = getDependencyCount(content);

  const lineSeverity = getLineCountSeverity(lineCount);
  if (lineSeverity) {
    issues.push({
      type: "component-size",
      message: "Component too large",
      severity: lineSeverity,
    });
  }

  const dependencySeverity = getDependencySeverity(dependencyCount);
  if (dependencySeverity) {
    issues.push({
      type: "constructor-dependencies",
      message: "Too many constructor dependencies",
      severity: dependencySeverity,
    });
  }

  const highestSeverity = getHighestSeverity(issues);

  return {
    filePath: componentPath,
    fileName,
    lineCount,
    dependencyCount,
    issues,
    highestSeverity,
  };
}

function getDependencyCount(content: string): number {
  const constructorDependencyCount = getConstructorDependencyCount(content);
  const injectDependencyCount = getInjectFunctionCount(content);

  return constructorDependencyCount + injectDependencyCount;
}

function getConstructorDependencyCount(content: string): number {
  const constructorMatch = content.match(/constructor\s*\(([\s\S]*?)\)/);

  if (!constructorMatch) {
    return 0;
  }

  const paramsBlock = constructorMatch[1].trim();

  if (!paramsBlock) {
    return 0;
  }

  return paramsBlock
    .split(",")
    .map((param) => param.trim())
    .filter((param) => param.length > 0).length;
}

function getInjectFunctionCount(content: string): number {
  const matches = content.match(/\binject\s*\(/g);
  return matches ? matches.length : 0;
}

function getLineCountSeverity(lineCount: number): Severity | undefined {
  if (lineCount > 1200) return "CRITICAL";
  if (lineCount > 800) return "HIGH";
  if (lineCount > 400) return "WARNING";
  return undefined;
}

function getDependencySeverity(dependencyCount: number): Severity | undefined {
  if (dependencyCount >= 12) return "CRITICAL";
  if (dependencyCount >= 9) return "HIGH";
  if (dependencyCount >= 6) return "WARNING";
  return undefined;
}

function getHighestSeverity(issues: AnalysisIssue[]): Severity | undefined {
  if (issues.some((issue) => issue.severity === "CRITICAL")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "HIGH")) return "HIGH";
  if (issues.some((issue) => issue.severity === "WARNING")) return "WARNING";
  return undefined;
}