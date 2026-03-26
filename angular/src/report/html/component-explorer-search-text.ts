/**
 * Builds a single lowercase substring-search blob for component explorer rows (HTML `data-search`).
 * Keeps logic testable without the DOM or report templates.
 */

export const DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH = 1024;
const DEFAULT_MAX_SNIPPET_LENGTH = 200;

export interface ComponentExplorerSearchTextInput {
  displayName: string;
  className?: string | null;
  filePath: string;
  mainIssueFormatted: string;
  diagnosticLabel?: string | null;
  patternKey?: string | null;
  familyName?: string | null;
  project?: string | null;
  componentRole?: string | null;
  inferredFeatureArea?: string | null;
  sourceRoot?: string | null;
  triggeredRuleIds?: readonly string[];
  ruleTitles?: readonly string[];
  summaryLine?: string | null;
  actionSuggestion?: string | null;
}

function pushPart(parts: string[], value: string | null | undefined): void {
  if (value == null) return;
  const t = String(value).trim();
  if (t) parts.push(t);
}

function truncateSnippet(s: string, maxLen: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen);
}

/** Collapse whitespace and lowercase for client substring match. */
export function normalizeExplorerSearchBlob(blob: string): string {
  return blob.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * @param maxBlobLength - Cap total blob size to limit HTML attribute growth on large workspaces.
 */
export function buildComponentExplorerSearchText(
  input: ComponentExplorerSearchTextInput,
  options?: { maxBlobLength?: number; maxSnippetLength?: number }
): string {
  const maxBlob = options?.maxBlobLength ?? DEFAULT_MAX_EXPLORER_SEARCH_BLOB_LENGTH;
  const maxSnippet = options?.maxSnippetLength ?? DEFAULT_MAX_SNIPPET_LENGTH;

  const parts: string[] = [];

  pushPart(parts, input.displayName);
  pushPart(parts, input.className);
  pushPart(parts, input.filePath);
  pushPart(parts, input.mainIssueFormatted);
  pushPart(parts, input.diagnosticLabel);
  pushPart(parts, input.patternKey);
  pushPart(parts, input.familyName);
  pushPart(parts, input.project);
  pushPart(parts, input.componentRole);
  pushPart(parts, input.inferredFeatureArea);
  pushPart(parts, input.sourceRoot);

  for (const id of input.triggeredRuleIds ?? []) {
    pushPart(parts, id);
  }
  for (const title of input.ruleTitles ?? []) {
    pushPart(parts, title);
  }

  if (input.summaryLine) {
    pushPart(parts, truncateSnippet(input.summaryLine, maxSnippet));
  }
  if (input.actionSuggestion) {
    pushPart(parts, truncateSnippet(input.actionSuggestion, maxSnippet));
  }

  let blob = normalizeExplorerSearchBlob(parts.join(" "));
  if (blob.length > maxBlob) {
    blob = blob.slice(0, maxBlob);
    const lastSpace = blob.lastIndexOf(" ");
    if (lastSpace > maxBlob * 0.5) {
      blob = blob.slice(0, lastSpace);
    }
  }
  return blob;
}
