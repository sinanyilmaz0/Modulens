import * as fs from "fs";
import { ModulensError } from "./modulens-error";

/**
 * Safely read a text file. Throws ModulensError on failure.
 */
export function safeReadTextFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr?.code === "ENOENT") {
      throw new ModulensError(
        `File not found: ${filePath}`,
        "FILE_NOT_FOUND",
        err
      );
    }
    throw new ModulensError(
      `Could not read file: ${filePath}`,
      "FILE_READ_ERROR",
      err
    );
  }
}

export interface SafeReadJsonOptions {
  /** Human-readable file description for error messages (e.g. "angular.json") */
  fileDescription?: string;
}

/**
 * Safely read and parse a JSON file. Throws ModulensError on failure.
 */
export function safeReadJsonFile<T = unknown>(
  filePath: string,
  options?: SafeReadJsonOptions
): T {
  const desc = options?.fileDescription ?? filePath;
  let content: string;
  try {
    content = safeReadTextFile(filePath);
  } catch (e) {
    throw e;
  }
  try {
    return JSON.parse(content) as T;
  } catch (err) {
    throw new ModulensError(
      `Could not parse ${desc}. Check file is valid JSON.`,
      "JSON_PARSE_ERROR",
      err
    );
  }
}
