import * as path from "path";
import type { ComponentAnalysisResult } from "../analyzers/component-analyzer";
import type { LifecycleAnalysisResult } from "../analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult } from "../analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../analyzers/responsibility/responsibility-models";
import type {
  ComponentDiagnostic,
  ComponentRole,
  DominantIssueType,
} from "../../diagnostic/diagnostic-models";
import { REFACTOR_DIRECTIONS } from "../../diagnostic/refactor-directions";
import { DOMINANT_ISSUE_TO_LABEL } from "../../diagnostic/diagnostic-clusters";
import type { FamilyDetectionInput } from "./family-detector";
import type { ComponentFamilyInsight } from "./component-family-insight-models";
import type { ContributingSignal } from "../../confidence/confidence-models";
import { normalizeConfidence } from "../../confidence/confidence-normalizer";
import { getConfidenceBucket } from "../../confidence/confidence-labels";
import { getConfidenceAwareCopy } from "../../confidence/confidence-copy";

const NAME_SUFFIXES = [
  "fragment-player",
  "manage-fragments",
  "publish-container",
  "content-files",
  "detail",
  "form",
  "list",
  "view",
  "editor",
  "card",
  "item",
  "header",
  "footer",
  "modal",
  "dialog",
  "picker",
  "selector",
] as const;

const NAME_SUFFIX_REGEX = new RegExp(
  `^(.+)-(${NAME_SUFFIXES.join("|")})$`,
  "i"
);

const MIN_FAMILY_SIZE = 3;
const MIN_SHARED_SIGNALS = 2;
const MAX_FAMILIES_OUTPUT = 12;
const MAX_DOMINANT_ISSUES = 3;
const DOMINANT_ISSUE_MIN_RATIO = 0.3;
const COMMON_SIGNAL_MIN_RATIO = 0.5;
const MAX_RECOMMENDED_EXTRACTIONS = 6;
const MIN_RECOMMENDED_EXTRACTIONS = 3;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

const CONFIDENCE_FLOOR = 0.5;

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

function extractFamilySuffix(fileName: string): string | null {
  const baseName = extractBaseName(fileName);
  const match = baseName.match(NAME_SUFFIX_REGEX);
  return match ? match[2].toLowerCase() : null;
}

function getAllPrefixes(baseName: string): string[] {
  const segments = baseName.split("-");
  const prefixes: string[] = [];
  for (let i = 1; i <= segments.length; i++) {
    prefixes.push(segments.slice(0, i).join("-"));
  }
  return prefixes;
}

function suffixToFamilyName(suffix: string): string {
  const words = suffix.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return `${words.join(" ")} Family`;
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

function getWarningCodes(
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined,
  lifecycleResult: LifecycleAnalysisResult | undefined
): string[] {
  const codes: string[] = [];
  for (const issue of component.issues) codes.push(issue.type);
  for (const w of templateResult?.warnings ?? []) codes.push(w.code);
  for (const w of responsibilityResult?.warnings ?? []) codes.push(w.code);
  for (const w of lifecycleResult?.warnings ?? []) codes.push(w.code);
  return codes;
}

function getEvidenceKeys(diag: ComponentDiagnostic | undefined): string[] {
  return (diag?.evidence ?? []).map((e) => e.key);
}

function componentSetKey(filePaths: string[]): string {
  return [...filePaths].sort().join("\0");
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

function computeCommonSignals(
  filePaths: string[],
  diagnosticByPath: Map<string, ComponentDiagnostic>,
  warningCodesByPath: Map<string, string[]>
): string[] {
  const signalCounts = new Map<string, number>();
  const threshold = Math.ceil(filePaths.length * COMMON_SIGNAL_MIN_RATIO);

  for (const fp of filePaths) {
    const diag = diagnosticByPath.get(fp);
    const signals = new Set<string>();

    if (diag?.roleSignals?.length) {
      for (const s of diag.roleSignals) signals.add(`role:${s}`);
    }
    if (diag?.dominantIssue) {
      signals.add(`issue:${DOMINANT_ISSUE_TO_LABEL[diag.dominantIssue] ?? diag.dominantIssue}`);
    }
    for (const key of getEvidenceKeys(diag)) {
      signals.add(`evidence:${key}`);
    }
    for (const code of warningCodesByPath.get(fp) ?? []) {
      signals.add(`warning:${code}`);
    }

    for (const s of Array.from(signals)) {
      signalCounts.set(s, (signalCounts.get(s) ?? 0) + 1);
    }
  }

  return Array.from(signalCounts.entries())
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
}

function generateSharedRefactorOpportunity(
  dominantIssues: string[],
  componentRoles: (ComponentRole | undefined)[],
  confidence: number
): string {
  const hints: string[] = [];
  const bucket = getConfidenceBucket(confidence);

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
    if (r && r !== "unknown") roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
  }
  const topRole = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topRole && ROLE_TO_REFACTOR_HINT[topRole]) {
    hints.push(ROLE_TO_REFACTOR_HINT[topRole]!);
  }

  if (hints.length > 0 && (bucket === "high" || bucket === "medium")) {
    return hints.join(" ");
  }
  return getConfidenceAwareCopy("family-grouping", bucket, "family");
}

function computeRecommendedExtractions(
  filePaths: string[],
  diagnosticByPath: Map<string, ComponentDiagnostic>
): string[] {
  const counts = new Map<string, number>();
  for (const fp of filePaths) {
    const diag = diagnosticByPath.get(fp);
    const ds = diag?.decompositionSuggestion;
    if (!ds) continue;
    for (const c of ds.extractedComponents ?? []) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    for (const s of ds.extractedServices ?? []) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, MAX_RECOMMENDED_EXTRACTIONS)
    .filter((_, i) => i < MAX_RECOMMENDED_EXTRACTIONS);
}

function computeFamilyConfidence(
  filePaths: string[],
  source: "suffix" | "directory" | "prefix" | "role",
  commonSignals: string[],
  dominantIssues: string[],
  componentByPath: Map<string, ComponentAnalysisResult>
): { score: number; contributingSignals: ContributingSignal[] } {
  const sourceSuffix = source === "suffix";
  const sourceDirectory = source === "directory";
  const sourcePrefix = source === "prefix";
  const sourceRole = source === "role";

  const commonSignals1 = commonSignals.length >= 1;
  const commonSignals2 = commonSignals.length >= 2;
  const commonSignals3 = commonSignals.length >= 3;
  const commonSignals4 = commonSignals.length >= 4;
  const commonSignals5 = commonSignals.length >= 5;

  const dominantIssues2Plus = dominantIssues.length >= 2;
  const dominantIssues1 = dominantIssues.length >= 1 && dominantIssues.length < 2;

  const lineCounts = filePaths.map((fp) => componentByPath.get(fp)?.lineCount ?? 0).filter((n) => n > 0);
  let lineCountConsistency = false;
  if (lineCounts.length >= 2) {
    const range = Math.max(...lineCounts) - Math.min(...lineCounts);
    const avg = lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length;
    const consistency = avg > 0 ? Math.max(0, 1 - range / (avg * 0.5)) : 0;
    lineCountConsistency = consistency > 0.3;
  }

  const contributingSignals: ContributingSignal[] = [
    { signal: "source_suffix", weight: 0.25, matched: sourceSuffix, note: "Family from shared name suffix" },
    { signal: "source_directory", weight: 0.2, matched: sourceDirectory, note: "Family from shared directory" },
    { signal: "source_prefix", weight: 0.15, matched: sourcePrefix, note: "Family from shared name prefix" },
    { signal: "source_role", weight: 0.1, matched: sourceRole, note: "Family from shared component role" },
    { signal: "common_signals_1", weight: 0.06, matched: commonSignals1, note: "1+ common signals across members" },
    { signal: "common_signals_2", weight: 0.06, matched: commonSignals2, note: "2+ common signals across members" },
    { signal: "common_signals_3", weight: 0.06, matched: commonSignals3, note: "3+ common signals across members" },
    { signal: "common_signals_4", weight: 0.06, matched: commonSignals4, note: "4+ common signals across members" },
    { signal: "common_signals_5", weight: 0.06, matched: commonSignals5, note: "5+ common signals across members" },
    { signal: "dominant_issues_2+", weight: 0.2, matched: dominantIssues2Plus, note: "2+ shared dominant issues" },
    { signal: "dominant_issues_1", weight: 0.1, matched: dominantIssues1, note: "1 shared dominant issue" },
    { signal: "line_count_consistency", weight: 0.15, matched: lineCountConsistency, note: "Similar line counts across members" },
  ];

  const breakdown = normalizeConfidence(contributingSignals, {
    minEvidenceForHigh: 3,
    minEvidenceForVeryHigh: 4,
    minEvidenceForMax: 5,
  });

  return { score: breakdown.score, contributingSignals: breakdown.contributingSignals };
}

export function detectComponentFamilyInsights(input: FamilyDetectionInput): ComponentFamilyInsight[] {
  const {
    workspacePath,
    components,
    componentDiagnostics,
    templateResults,
    responsibilityResults,
    lifecycleByPath,
  } = input;

  const diagnosticByPath = new Map<string, ComponentDiagnostic>();
  const componentByPath = new Map<string, ComponentAnalysisResult>();
  const warningCodesByPath = new Map<string, string[]>();
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    diagnosticByPath.set(comp.filePath, componentDiagnostics[i]);
    componentByPath.set(comp.filePath, comp);
    warningCodesByPath.set(
      comp.filePath,
      getWarningCodes(comp, templateResults[i], responsibilityResults[i], lifecycleByPath.get(normalizePath(comp.filePath)))
    );
  }

  const rawFamilies: Array<{
    familyKey: string;
    familyName: string;
    filePaths: string[];
    source: "suffix" | "directory" | "prefix" | "role";
  }> = [];

  const suffixToPaths = new Map<string, Set<string>>();
  for (const comp of components) {
    const suffix = extractFamilySuffix(comp.fileName);
    if (suffix) {
      if (!suffixToPaths.has(suffix)) suffixToPaths.set(suffix, new Set<string>());
      suffixToPaths.get(suffix)!.add(comp.filePath);
    }
  }
  for (const [suffix, paths] of Array.from(suffixToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      rawFamilies.push({
        familyKey: `suffix:${suffix}`,
        familyName: suffixToFamilyName(suffix),
        filePaths: Array.from(paths).sort(),
        source: "suffix",
      });
    }
  }

  const dirToPaths = new Map<string, Set<string>>();
  for (const comp of components) {
    const dir = path.dirname(comp.filePath);
    const relDir = path.relative(workspacePath, dir);
    if (!dirToPaths.has(relDir)) dirToPaths.set(relDir, new Set<string>());
    dirToPaths.get(relDir)!.add(comp.filePath);
  }
  for (const [dir, paths] of Array.from(dirToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      rawFamilies.push({
        familyKey: `dir:${dir.replace(/[/\\]/g, "-")}`,
        familyName: dirToFamilyName(dir),
        filePaths: Array.from(paths).sort(),
        source: "directory",
      });
    }
  }

  const prefixToPaths = new Map<string, Set<string>>();
  for (const comp of components) {
    const baseName = extractBaseName(comp.fileName);
    for (const p of getAllPrefixes(baseName)) {
      if (!prefixToPaths.has(p)) prefixToPaths.set(p, new Set<string>());
      prefixToPaths.get(p)!.add(comp.filePath);
    }
  }
  for (const [prefix, paths] of Array.from(prefixToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      rawFamilies.push({
        familyKey: `prefix:${prefix}`,
        familyName: prefixToFamilyName(prefix),
        filePaths: Array.from(paths).sort(),
        source: "prefix",
      });
    }
  }

  const roleToPaths = new Map<ComponentRole, Set<string>>();
  for (const comp of components) {
    const diag = diagnosticByPath.get(comp.filePath);
    const role = diag?.componentRole ?? "unknown";
    if (role !== "unknown") {
      if (!roleToPaths.has(role)) roleToPaths.set(role, new Set<string>());
      roleToPaths.get(role)!.add(comp.filePath);
    }
  }
  for (const [role, paths] of Array.from(roleToPaths.entries())) {
    if (paths.size >= MIN_FAMILY_SIZE) {
      rawFamilies.push({
        familyKey: `role:${role}`,
        familyName: roleToFamilyName(role),
        filePaths: Array.from(paths).sort(),
        source: "role",
      });
    }
  }

  const seenKeys = new Set<string>();
  const deduped: typeof rawFamilies = [];
  for (const f of rawFamilies) {
    const key = componentSetKey(f.filePaths);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(f);
  }

  const insights: ComponentFamilyInsight[] = [];

  for (const f of deduped) {
    const isSubset = deduped.some(
      (other) =>
        other !== f &&
        other.filePaths.length > f.filePaths.length &&
        f.filePaths.every((p) => other.filePaths.includes(p))
    );
    if (isSubset) continue;
    const dominantIssues = aggregateDominantIssues(f.filePaths, diagnosticByPath);
    const commonSignals = computeCommonSignals(f.filePaths, diagnosticByPath, warningCodesByPath);

    const sharedSignalCount = dominantIssues.length + commonSignals.filter((s) => !s.startsWith("issue:")).length;
    if (sharedSignalCount < MIN_SHARED_SIGNALS) continue;

    const diagnostics = f.filePaths.map((fp) => diagnosticByPath.get(fp));
    const { score: confidence, contributingSignals: familyContributingSignals } = computeFamilyConfidence(
      f.filePaths,
      f.source,
      commonSignals,
      dominantIssues,
      componentByPath
    );

    if (confidence < CONFIDENCE_FLOOR) continue;

    const sharedRefactorOpportunity = generateSharedRefactorOpportunity(
      dominantIssues,
      diagnostics.map((d) => d?.componentRole),
      confidence
    );
    const recommendedExtractions = computeRecommendedExtractions(f.filePaths, diagnosticByPath);
    const humanSignals = commonSignals
      .map((s) => {
        const m = s.match(/^(role|warning|evidence):(.+)$/);
        return m ? m[2].replace(/-/g, " ") : s;
      })
      .filter((s) => !dominantIssues.includes(s));

    const componentsList = f.filePaths.map((fp) => {
      const comp = componentByPath.get(fp);
      const diag = diagnosticByPath.get(fp);
      return {
        className: diag?.className ?? comp?.fileName?.replace(/\.component\.ts$/i, "") ?? "",
        fileName: comp?.fileName ?? path.basename(fp),
        filePath: fp,
        dominantIssue: diag?.dominantIssue
          ? (DOMINANT_ISSUE_TO_LABEL[diag.dominantIssue] ?? diag.dominantIssue)
          : "",
      };
    });

    insights.push({
      familyKey: f.familyKey,
      familyName: f.familyName,
      confidenceBreakdown: { score: confidence, contributingSignals: familyContributingSignals },
      components: componentsList,
      commonSignals: humanSignals.slice(0, 8),
      dominantIssues,
      sharedRefactorOpportunity,
      recommendedExtractions: recommendedExtractions.length >= MIN_RECOMMENDED_EXTRACTIONS
        ? recommendedExtractions
        : recommendedExtractions.length > 0
          ? recommendedExtractions
          : [],
      confidence,
    });
  }

  return insights
    .sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.05) return confDiff;
      return b.components.length - a.components.length;
    })
    .slice(0, MAX_FAMILIES_OUTPUT);
}
