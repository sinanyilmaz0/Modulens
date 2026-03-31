import { glob } from "glob";
import * as path from "path";

export async function findLifecycleTargets(
  workspacePath: string,
  sourceRoot: string
): Promise<string[]> {
  const pattern = path
    .join(sourceRoot, "**/*.{component,directive}.ts")
    .replace(/\\/g, "/");

  const files = await glob(pattern, {
    cwd: workspacePath,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.angular/**"],
  });

  return Array.from(new Set(files));
}
