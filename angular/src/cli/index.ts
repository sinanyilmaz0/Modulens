#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { runScan } from "../core/run-scan";
import { getFormatter } from "../formatters";
import { ModulensError } from "../core/modulens-error";
import { readCliPackageVersion } from "./package-version";
import {
  parseScanFormat,
  resolveScanOutput,
  shouldOpenBrowser,
  type ScanCliFormat,
} from "./scan-output";

function resolveWorkspacePath(input: string): string {
  return path.resolve(process.cwd(), input);
}

function ensureWorkspaceDirectory(p: string): void {
  if (!fs.existsSync(p)) {
    throw new ModulensError(
      `Workspace path does not exist: ${p}. Run 'modulens scan' to scan current directory.`,
      "WORKSPACE_NOT_FOUND"
    );
  }
  const stat = fs.statSync(p);
  if (!stat.isDirectory()) {
    throw new ModulensError(
      `Workspace path is not a directory: ${p}. Pass a folder path.`,
      "WORKSPACE_NOT_DIRECTORY"
    );
  }
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

interface ScanCommandOptions {
  format: string;
  output?: string;
  /**
   * Commander maps `--no-open` to `open: false` (default `open: true`), not `noOpen`.
   */
  open?: boolean;
}

async function handleScan(
  workspacePathArg: string,
  scanOptions: ScanCommandOptions
): Promise<void> {
  const formatParsed = parseScanFormat(scanOptions.format ?? "html");
  if (formatParsed === null) {
    console.error(
      `[Modulens] Invalid --format "${scanOptions.format}". Use "html" or "json".`
    );
    process.exitCode = 1;
    return;
  }
  const format: ScanCliFormat = formatParsed;

  const resolvedPath = resolveWorkspacePath(workspacePathArg);
  const noOpen = scanOptions.open === false;
  const outputResolved = resolveScanOutput({
    format,
    outputOption: scanOptions.output,
    workspaceRootAbsolute: resolvedPath,
    cwd: process.cwd(),
  });

  if (!outputResolved.ok) {
    console.error(`[Modulens] ${outputResolved.message}`);
    process.exitCode = 1;
    return;
  }
  const outputTarget = outputResolved.target;
  const jsonToStdout = format === "json" && outputTarget.kind === "stdout";

  const logInfo = jsonToStdout ? console.error.bind(console) : console.log.bind(console);
  const logWarn = console.warn.bind(console);

  try {
    ensureWorkspaceDirectory(resolvedPath);

    logInfo(`[Modulens] Scanning workspace: ${resolvedPath}`);

    const snapshot = await runScan(resolvedPath);
    if (snapshot === null) {
      console.error(
        `[Modulens] No Angular projects found in workspace: ${resolvedPath}. Ensure angular.json exists and defines projects.`
      );
      process.exitCode = 1;
      return;
    }

    const formatter = getFormatter(format);
    const payload = formatter.format(snapshot);

    if (outputTarget.kind === "stdout") {
      process.stdout.write(payload);
      if (!payload.endsWith("\n")) {
        process.stdout.write("\n");
      }
      logInfo("[Modulens] JSON report written to stdout.");
      return;
    }

    const outPath = outputTarget.absolutePath;
    fs.writeFileSync(outPath, payload, "utf-8");
    logInfo(`[Modulens] Report generated at: ${outPath}`);

    if (shouldOpenBrowser(format, noOpen)) {
      logInfo("[Modulens] Opening report in your default browser...");
      try {
        await openInDefaultBrowser(outPath);
      } catch {
        logWarn(
          "[Modulens] Report generated, but could not open browser automatically."
        );
        logWarn(`[Modulens] Please open the file manually: ${outPath}`);
      }
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
    console.error(
      "[Modulens] An error occurred while scanning. Run with DEBUG=1 for details."
    );
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

const CLI_NAME = "modulens";
const CLI_TAGLINE =
  "Scan Angular workspaces and generate architecture health reports (HTML or JSON).";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_TAGLINE)
    .version(
      readCliPackageVersion(),
      "-v, --version",
      "Show Modulens version"
    );

  const scanCommand = program
    .command("scan")
    .argument(
      "[workspacePath]",
      "Optional path to the Angular workspace (defaults to current directory)."
    )
    .option(
      "--format <type>",
      'Report format: "html" or "json"',
      "html"
    )
    .option(
      "-o, --output <path>",
      "Write report to this path. Use - with --format json to print JSON to stdout."
    )
    .option(
      "--no-open",
      "Do not open the HTML report in a browser (ignored for JSON output)"
    )
    .description(
      "Scan an Angular workspace (current directory by default). By default writes an HTML report in the workspace and opens it in your browser."
    )
    .action(async (workspacePathArg: string | undefined, options: ScanCommandOptions) => {
      const effectivePath =
        workspacePathArg && workspacePathArg.trim().length > 0
          ? workspacePathArg
          : ".";
      await handleScan(effectivePath, {
        format: options.format,
        output: options.output,
        open: options.open,
      });
    });

  scanCommand.addHelpText(
    "after",
    `
Examples:
  modulens scan                          # HTML report in workspace + open browser
  modulens scan . --no-open              # HTML report only
  modulens scan ./my-workspace --format json
  modulens scan . --format json --output -
  modulens scan . --format html -o ./out/report.html --no-open
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
