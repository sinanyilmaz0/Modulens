import * as fs from "fs";
import * as path from "path";

/**
 * Version shown by `modulens --version`, sourced from the package root package.json
 * next to the compiled CLI (`dist/cli` -> `angular/package.json`).
 */
export function readCliPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "../../package.json");
    const content = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content) as { version?: string };
    if (typeof pkg.version === "string" && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    // ignore
  }
  return "0.0.0";
}
