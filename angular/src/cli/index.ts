#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { runScan } from "../core/run-scan";
import { getFormatter } from "../formatters";
import { ModulensError } from "../core/modulens-error";

function resolveWorkspacePath(input: string): string {
  return path.resolve(process.cwd(), input);
}

function ensureWorkspaceDirectory(p: string): void {
  if (!fs.existsSync(p)) {
    process.exitCode = 1;
    throw new ModulensError(
      `Workspace path does not exist: ${p}. Run 'modulens scan' to scan current directory.`,
      "WORKSPACE_NOT_FOUND"
    );
  }
  const stat = fs.statSync(p);
  if (!stat.isDirectory()) {
    process.exitCode = 1;
    throw new ModulensError(
      `Workspace path is not a directory: ${p}. Pass a folder path.`,
      "WORKSPACE_NOT_DIRECTORY"
    );
  }
}

function slugifyWorkspaceName(name: string): string {
  const slug = name
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
  return slug || "workspace";
}

function openInDefaultBrowser(targetPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const platform = process.platform;

    let command: string;
    let args: string[];

    if (platform === "win32") {
      command = "cmd";
      // Empty title argument ("") is required so that paths with spaces work correctly.
      args = ["/c", "start", "", targetPath];
    } else if (platform === "darwin") {
      command = "open";
      args = [targetPath];
    } else {
      command = "xdg-open";
      args = [targetPath];
    }

    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true,
    });

    child.on("error", (err) => {
      reject(err);
    });

    // Detach and resolve immediately; we don't need to wait for the browser to close.
    child.unref();
    resolve();
  });
}

async function handleScan(workspacePathArg: string): Promise<void> {
  try {
    const resolvedPath = resolveWorkspacePath(workspacePathArg);
    ensureWorkspaceDirectory(resolvedPath);

    console.log(`[Modulens] Scanning workspace: ${resolvedPath}`);

    const snapshot = await runScan(resolvedPath);
    if (snapshot === null) {
      console.error(
        `[Modulens] No Angular projects found in workspace: ${resolvedPath}. Ensure angular.json exists and defines projects.`
      );
      process.exitCode = 1;
      return;
    }

    const htmlFormatter = getFormatter("html");
    const html = htmlFormatter.format(snapshot);

    const workspaceName = path.basename(resolvedPath);
    const slug = slugifyWorkspaceName(workspaceName);
    const htmlFileName = `modulens-angular-report-${slug}.html`;
    const htmlOutputPath = path.join(resolvedPath, htmlFileName);

    fs.writeFileSync(htmlOutputPath, html, "utf-8");
    console.log(`[Modulens] Report generated at: ${htmlOutputPath}`);
    console.log("[Modulens] Opening report in your default browser...");

    try {
      await openInDefaultBrowser(htmlOutputPath);
    } catch (openError) {
      console.warn(
        "[Modulens] Report generated, but could not open browser automatically."
      );
      console.warn(
        `[Modulens] Please open the file manually: ${htmlOutputPath}`
      );
    }
  } catch (error) {
    if (error instanceof ModulensError) {
      console.error(`[Modulens] ${error.message}`);
      if (process.env.DEBUG && error.cause) {
        console.error(error.cause);
      }
      process.exitCode = 1;
      return;
    }
    console.error("[Modulens] An error occurred while scanning. Run with DEBUG=1 for details.");
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

const CLI_NAME = "modulens";
const CLI_TAGLINE =
  "Scan Angular workspaces and generate an HTML health report.";
const CLI_VERSION = "0.1.0";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_TAGLINE)
    .version(CLI_VERSION, "-v, --version", "Show Modulens version");

  const scanCommand = program
    .command("scan")
    .argument(
      "[workspacePath]",
      "Optional path to the Angular workspace (defaults to current directory)."
    )
    .description(
      "Scan an Angular workspace (current directory by default) and open an HTML health report in your browser."
    )
    .action(async (workspacePathArg?: string) => {
      const effectivePath =
        workspacePathArg && workspacePathArg.trim().length > 0
          ? workspacePathArg
          : ".";
      await handleScan(effectivePath);
    });

  scanCommand.addHelpText(
    "after",
    `
Examples:
  modulens scan             # scan current directory
  modulens scan .           # scan current directory (explicit)
  modulens scan ./my-workspace
`
  );

  if (process.argv.length <= 2) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

void main().catch((error) => {
  console.error("[Modulens] Failed to execute CLI.");
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exitCode = 1;
});
