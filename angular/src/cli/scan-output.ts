import * as path from "path";
import { getReportsDirectory } from "./snapshot-file";

export type ScanCliFormat = "html" | "json";

export function slugifyWorkspaceName(name: string): string {
  const slug = name
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
  return slug || "workspace";
}

export function parseScanFormat(raw: string): ScanCliFormat | null {
  const n = raw.trim().toLowerCase();
  if (n === "html" || n === "json") {
    return n;
  }
  return null;
}

export type ResolvedScanTarget =
  | { kind: "file"; absolutePath: string }
  | { kind: "stdout" };

export type ResolveScanOutputResult =
  | { ok: true; target: ResolvedScanTarget }
  | { ok: false; message: string };

export function resolveScanOutput(options: {
  format: ScanCliFormat;
  outputOption: string | undefined;
  workspaceRootAbsolute: string;
  cwd: string;
}): ResolveScanOutputResult {
  const { format, outputOption, workspaceRootAbsolute, cwd } = options;
  const workspaceName = path.basename(workspaceRootAbsolute);
  const slug = slugifyWorkspaceName(workspaceName);

  if (
    outputOption === undefined ||
    outputOption === "" ||
    outputOption.trim().length === 0
  ) {
    const ext = format === "html" ? "html" : "json";
    const fileName = `modulens-angular-report-${slug}.${ext}`;
    const reportsDir = getReportsDirectory(workspaceRootAbsolute);
    return {
      ok: true,
      target: { kind: "file", absolutePath: path.join(reportsDir, fileName) },
    };
  }

  if (outputOption === "-") {
    if (format === "html") {
      return {
        ok: false,
        message:
          "HTML reports cannot be written to stdout. Omit --output or pass a file path, or use --format json with --output -.",
      };
    }
    return { ok: true, target: { kind: "stdout" } };
  }

  return {
    ok: true,
    target: { kind: "file", absolutePath: path.resolve(cwd, outputOption) },
  };
}

export function shouldOpenBrowser(format: ScanCliFormat, noOpen: boolean): boolean {
  if (format !== "html") {
    return false;
  }
  return !noOpen;
}
