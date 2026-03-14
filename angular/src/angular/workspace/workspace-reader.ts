import * as fs from "fs";
import * as path from "path";
import { safeReadJsonFile } from "../../core/file-utils";
import { ModulensError } from "../../core/modulens-error";

interface AngularJsonProjects {
  [projectName: string]: { sourceRoot?: string };
}

export function getAngularProjects(projectPath: string): string[] {
  const angularJsonPath = path.join(projectPath, "angular.json");

  if (!fs.existsSync(angularJsonPath)) {
    return [];
  }

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

  const sourceRoots: string[] = [];
  for (const projectName in projects) {
    const project = projects[projectName];
    if (project?.sourceRoot) {
      sourceRoots.push(project.sourceRoot);
    }
  }

  return sourceRoots;
}
