import * as path from "path";
import type { ComponentAnalysisResult } from "../analyzers/component-analyzer";
import type { FamilyDetectionInput } from "./family-detector";
import type { ComponentDiagnostic, ComponentRole, DominantIssueType } from "../../diagnostic/diagnostic-models";
import { REFACTOR_DIRECTIONS } from "../../diagnostic/refactor-directions";
import { DOMINANT_ISSUE_TO_LABEL } from "../../diagnostic/diagnostic-clusters";
import type { ArchitecturePatternFamily } from "./architecture-pattern-models";

const MIN_FAMILY_SIZE = 2;
const MAX_FAMILIES_OUTPUT = 15;
const MAX_DOMINANT_ISSUES = 3;
const DOMINANT_ISSUE_MIN_RATIO = 0.3;

const ROLE_TO_REFACTOR_HINT: Partial<Record<ComponentRole, string>> = {
  player: "Extract shared PlayerStateService.",
  editor: "Extract shared EditorStateService or form logic.",
  form: "Extract shared form validation and state handling.",
  detail: "Extract shared detail loading and presentation logic.",
  list: "Extract shared list data loading and pagination.",
};

function extractBaseName(fileName: string): string {
  return fileName.replace(/\.component\.ts$/i, "").toLowerCase();
}

function getAllPrefixes(baseName: string): string[] {
  const segments = baseName.split("-");
  const prefixes: string[] = [];
  for (let i = 1; i <= segments.length; i++) {
    prefixes.push(segments.slice(0, i).join("-"));
  }
  return prefixes;
}

function prefixToFamilyName(prefix: string): string {
  const words = prefix.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return `${words.join(" ")} Family`;
}

function dirToFamilyName(dirName: string): string {
  const base = path.basename(dirName) || dirName;
  const words = base.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return `${words.join(" ")} Directory Family`;
}

function roleToFamilyName(role: ComponentRole): string {
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return `${label} Role Family`;
}

function aggregateDominantIssues(
  filePaths: string[],
  diagnosticByPath: Map<string, ComponentDiagnostic>
): string[] {
  const counts = new Map<string, number>();
  for (const fp of filePaths) {
    const diag = diagnosticByPath.get(fp);
    const issue = diag?.dominantIssue;
    if (issue) {
      const label = DOMINANT_ISSUE_TO_LABEL[issue] ?? issue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  const total = filePaths.length;
  return Array.from(counts.entries())
    .filter(([, count]) => count >= Math.ceil(total * DOMINANT_ISSUE_MIN_RATIO))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_DOMINANT_ISSUES)
    .map(([label]) => label);
}

function generateSuggestedRefactor(
  dominantIssues: string[],
  familyName: string,
  componentRoles: (ComponentRole | undefined)[]
): string {
  const hints: string[] = [];

  const labelToIssue: Record<string, DominantIssueType> = {};
  for (const [k, v] of Object.entries(DOMINANT_ISSUE_TO_LABEL)) {
    labelToIssue[v] = k as DominantIssueType;
  }

  if (dominantIssues.length > 0) {
    const topLabel = dominantIssues[0];
    const issue = labelToIssue[topLabel];
    if (issue && REFACTOR_DIRECTIONS[issue]) {
      hints.push(REFACTOR_DIRECTIONS[issue]);
    }
  }

  const roleCounts = new Map<ComponentRole, number>();
  for (const r of componentRoles) {
    if (r && r !== "unknown") {
      roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
    }
  }
  const topRole = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topRole && ROLE_TO_REFACTOR_HINT[topRole]) {
    hints.push(ROLE_TO_REFACTOR_HINT[topRole]!);
  }

  return hints.length > 0 ? hints.join(" ") : "Consider extracting shared logic into a service or base class.";
}

function componentSetKey(filePaths: string[]): string {
  return [...filePaths].sort().join("\0");
}

export function detectComponentFamilies(input: FamilyDetectionInput): ArchitecturePatternFamily[] {
  const {
    workspacePath,
    components,
    componentDiagnostics,
  } = input;

  const diagnosticByPath = new Map<string, ComponentDiagnostic>();
  const componentByPath = new Map<string, ComponentAnalysisResult>();
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    diagnosticByPath.set(comp.filePath, componentDiagnostics[i]);
    componentByPath.set(comp.filePath, comp);
  }

  const rawFamilies: Array<{
    familyName: string;
    filePaths: string[];
    source: "prefix" | "directory" | "role";
  }> = [];

  // 1. Prefix grouping
  const prefixToPaths = new Map<string, Set<string>>();
  for (const comp of components) {
    const baseName = extractBaseName(comp.fileName);
    const prefixes = getAllPrefixes(baseName);
    for (const p of prefixes) {
      if (!prefixToPaths.has(p)) prefixToPaths.set(p, new Set());
      prefixToPaths.get(p)!.add(comp.filePath);
    }
  }
  for (const [prefix, paths] of Array.from(prefixToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      const sortedPaths: string[] = Array.from(paths).sort();
      rawFamilies.push({
        familyName: prefixToFamilyName(prefix),
        filePaths: sortedPaths,
        source: "prefix",
      });
    }
  }

  // 2. Directory grouping
  const dirToPaths = new Map<string, Set<string>>();
  for (const comp of components) {
    const dir = path.dirname(comp.filePath);
    const relDir = path.relative(workspacePath, dir);
    if (!dirToPaths.has(relDir)) dirToPaths.set(relDir, new Set());
    dirToPaths.get(relDir)!.add(comp.filePath);
  }
  for (const [dir, paths] of Array.from(dirToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      const sortedPaths: string[] = Array.from(paths).sort();
      rawFamilies.push({
        familyName: dirToFamilyName(dir),
        filePaths: sortedPaths,
        source: "directory",
      });
    }
  }

  // 3. Role grouping
  const roleToPaths = new Map<ComponentRole, Set<string>>();
  for (const comp of components) {
    const diag = diagnosticByPath.get(comp.filePath);
    const role = diag?.componentRole ?? "unknown";
    if (!roleToPaths.has(role)) roleToPaths.set(role, new Set());
    roleToPaths.get(role)!.add(comp.filePath);
  }
  for (const [role, paths] of Array.from(roleToPaths.entries())) {
    if (role !== "unknown" && paths.size >= MIN_FAMILY_SIZE) {
      const sortedPaths: string[] = Array.from(paths).sort();
      rawFamilies.push({
        familyName: roleToFamilyName(role),
        filePaths: sortedPaths,
        source: "role",
      });
    }
  }

  // Deduplicate: keep one family per unique component set, prefer more specific (prefix > directory > role, then by size)
  const seenKeys = new Set<string>();
  const deduped: typeof rawFamilies = [];
  const sourceOrder = { prefix: 0, directory: 1, role: 2 };
  for (const f of rawFamilies) {
    const key = componentSetKey(f.filePaths);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(f);
  }

  // Build output
  const families: ArchitecturePatternFamily[] = deduped.map((f) => {
    const fileNames = f.filePaths.map((fp) => componentByPath.get(fp)?.fileName ?? path.basename(fp));
    const diagnostics = f.filePaths.map((fp) => diagnosticByPath.get(fp));
    const dominantIssues = aggregateDominantIssues(f.filePaths, diagnosticByPath);
    const componentRoles = diagnostics.map((d) => d?.componentRole);
    const suggestedRefactor = generateSuggestedRefactor(
      dominantIssues,
      f.familyName,
      componentRoles
    );
    return {
      familyName: f.familyName,
      components: fileNames,
      dominantIssues,
      suggestedRefactor,
      filePaths: f.filePaths,
    };
  });

  return families
    .sort((a, b) => b.components.length - a.components.length)
    .slice(0, MAX_FAMILIES_OUTPUT);
}
