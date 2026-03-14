import * as fs from "fs";
import * as path from "path";
import type { BreakdownMode } from "../../core/scan-result";
import { safeReadJsonFile } from "../../core/file-utils";
import { ModulensError } from "../../core/modulens-error";

export interface AngularProjectInfo {
  name: string;
  sourceRoot: string;
}

interface AngularJsonProjects {
  [projectName: string]: { sourceRoot?: string };
}

/**
 * Read angular.json and return project names with their source roots.
 */
export function getAngularProjectsWithNames(workspacePath: string): AngularProjectInfo[] {
  const angularJsonPath = path.join(workspacePath, "angular.json");
  if (!fs.existsSync(angularJsonPath)) return [];

  const angularJson = safeReadJsonFile<{ projects?: AngularJsonProjects }>(
    angularJsonPath,
    { fileDescription: "angular.json" }
  );

  const projects = angularJson.projects;
  if (!projects || typeof projects !== "object") {
    throw new ModulensError(
      "angular.json has invalid structure. Expected 'projects' with sourceRoot entries.",
      "INVALID_ANGULAR_JSON"
    );
  }

  const result: AngularProjectInfo[] = [];
  for (const projectName in projects) {
    const project = projects[projectName];
    if (project?.sourceRoot) {
      result.push({ name: projectName, sourceRoot: project.sourceRoot });
    }
  }
  return result;
}

/**
 * Select breakdown mode based on workspace structure.
 * - multi-project + libs/apps mix => source-root or package
 * - multi-project => project
 * - single-project => feature-area
 */
export function selectBreakdownMode(
  projectInfos: AngularProjectInfo[],
  sourceRoots: string[]
): BreakdownMode {
  if (sourceRoots.length === 0) return "feature-area";

  if (sourceRoots.length > 1) {
    const hasLibs = projectInfos.some((p) =>
      p.name.toLowerCase().startsWith("libs/")
    );
    const hasApps = projectInfos.some((p) =>
      p.name.toLowerCase().startsWith("apps/")
    );
    const hasProjects = projectInfos.some((p) =>
      p.name.toLowerCase().startsWith("projects/")
    );
    const isMixedMonorepo = hasLibs && (hasApps || hasProjects);

    if (isMixedMonorepo && hasLibs) {
      return "package";
    }
    if (isMixedMonorepo) {
      return "source-root";
    }
    return "project";
  }

  return "feature-area";
}
