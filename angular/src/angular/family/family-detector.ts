import * as path from "path";
import type { ComponentAnalysisResult } from "../analyzers/component-analyzer";
import type {
  LifecycleAnalysisResult,
  LifecycleDetectionSignals,
} from "../analyzers/lifecycle/lifecycle-models";
import type {
  TemplateAnalysisResult,
  TemplateMetrics,
} from "../analyzers/template/template-models";
import type {
  ResponsibilityAnalysisResult,
  ResponsibilityMetrics,
} from "../analyzers/responsibility/responsibility-models";
import type {
  ComponentDiagnostic,
  ComponentRole,
  DominantIssueType,
} from "../../diagnostic/diagnostic-models";
import { REFACTOR_DIRECTIONS } from "../../diagnostic/refactor-directions";
import { DOMINANT_ISSUE_TO_LABEL } from "../../diagnostic/diagnostic-clusters";
import { normalizeConfidence } from "../../confidence/confidence-normalizer";
import type { ContributingSignal } from "../../confidence/confidence-models";
import type { ComponentFamily, ComponentFamilyMember } from "./family-models";
import {
  normalizePath,
  extractFamilySuffix,
  getBaseNameParts,
  computeNameSimilarityScore,
} from "./family-detector-naming";

const FAMILY_SCORE_THRESHOLD = 0.5;
const FAMILY_SCORE_THRESHOLD_SMALL = 0.65;
const MIN_FAMILY_SIZE = 2;
const SMALL_GROUP_SIZE = 3;
const MAX_FAMILIES_OUTPUT = 10;
const MIN_EXTRACTION_SCORE = 2;
const MIN_EXTRACTION_SCORE_SMALL = 5;
const MIN_AVG_LINES = 40;
const EXTRACTION_MIN_CONFIDENCE = 0.6;
const EXTRACTION_MIN_CONFIDENCE_SMALL = 0.7;
const WEAK_GROUPING_THRESHOLD = 0.5;
const ROLE_CONFIDENCE_GATE = 0.4;
const UNKNOWN_ROLE_RATIO_GATE = 0.5;

export interface FamilyDetectionInput {
  workspacePath: string;
  components: ComponentAnalysisResult[];
  componentDiagnostics: ComponentDiagnostic[];
  templateResults: TemplateAnalysisResult[];
  responsibilityResults: ResponsibilityAnalysisResult[];
  lifecycleByPath: Map<string, LifecycleAnalysisResult>;
}

interface MemberWithContext extends ComponentFamilyMember {
  templateMetrics?: TemplateMetrics;
  responsibilityMetrics?: ResponsibilityMetrics;
  lifecycleSignals?: LifecycleDetectionSignals;
  hooksUsed?: string[];
}

function getWarningCodes(
  component: ComponentAnalysisResult,
  templateResult: TemplateAnalysisResult | undefined,
  responsibilityResult: ResponsibilityAnalysisResult | undefined,
  lifecycleResult: LifecycleAnalysisResult | undefined
): string[] {
  const codes: string[] = [];
  for (const issue of component.issues) {
    codes.push(issue.type);
  }
  for (const w of templateResult?.warnings ?? []) {
    codes.push(w.code);
  }
  for (const w of responsibilityResult?.warnings ?? []) {
    codes.push(w.code);
  }
  for (const w of lifecycleResult?.warnings ?? []) {
    codes.push(w.code);
  }
  return codes;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = Array.from(setA).filter((x) => setB.has(x)).length;
  const union = new Set(Array.from(setA).concat(Array.from(setB))).size;
  return union === 0 ? 1 : intersection / union;
}

function folderStructureBonus(
  filePaths: string[],
  workspacePath: string
): number {
  if (filePaths.length < 2) return 1;

  const dirs = filePaths.map((fp) => path.dirname(fp));
  const depths = dirs.map((d) => {
    const rel = path.relative(workspacePath, d);
    return rel.split(path.sep).filter(Boolean).length;
  });
  const depthRange = Math.max(...depths) - Math.min(...depths);
  const depthOk = depthRange <= 1 ? 1 : Math.max(0, 1 - depthRange / 4);

  const lastSegments = dirs.map((d) => path.basename(d).toLowerCase());
  const uniqueLast = new Set(lastSegments).size;
  const segmentOk = uniqueLast <= 2 ? 1 : Math.max(0, 1 - (uniqueLast - 2) / 4);

  return (depthOk + segmentOk) / 2;
}

function numericSimilarity(
  values: number[],
  toleranceRatio: number,
  minTolerance?: number
): number {
  if (values.length < 2) return 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const tol = Math.max(min * toleranceRatio, minTolerance ?? 0);
  return range <= tol ? 1 : Math.max(0, 1 - range / (min || 1));
}

function computeArchitecturalSimilarity(members: MemberWithContext[]): {
  templateStructure: number;
  sharedDirective: number;
  dependencyProfile: number;
  eventBinding: number;
  lifecyclePattern: number;
  orchestration: number;
  roleSim: number;
  dominantOk: number;
  warningJaccard: number;
} {
  if (members.length < 2) {
    return {
      templateStructure: 1,
      sharedDirective: 1,
      dependencyProfile: 1,
      eventBinding: 1,
      lifecyclePattern: 1,
      orchestration: 1,
      roleSim: 1,
      dominantOk: 1,
      warningJaccard: 1,
    };
  }
  const lineCounts = members.map((m) => m.templateMetrics?.lineCount ?? m.lineCount);
  const ngForCounts = members.map(
    (m) =>
      (m.templateMetrics?.ngForCount ?? 0) + (m.templateMetrics?.atForCount ?? 0)
  );
  const structuralDepths = members.map(
    (m) => m.templateMetrics?.structuralDepth ?? 0
  );
  const eventBindings = members.map(
    (m) => m.templateMetrics?.eventBindingCount ?? 0
  );
  const templateStructure =
    (numericSimilarity(lineCounts, 0.4, 15) +
      numericSimilarity(ngForCounts, 0.5, 1) +
      numericSimilarity(structuralDepths, 0.5, 1) +
      numericSimilarity(eventBindings, 0.5, 3)) /
    4;

  const ngIfCounts = members.map((m) => m.templateMetrics?.ngIfCount ?? 0);
  const ngTemplateCounts = members.map(
    (m) => m.templateMetrics?.ngTemplateCount ?? 0
  );
  const ngContainerCounts = members.map(
    (m) => m.templateMetrics?.ngContainerCount ?? 0
  );
  const directiveVecs = members.map((m) => [
    (m.templateMetrics?.ngIfCount ?? 0) > 0 ? "ngIf" : "",
    (m.templateMetrics?.ngForCount ?? 0) + (m.templateMetrics?.atForCount ?? 0) >
    0
      ? "ngFor"
      : "",
    (m.templateMetrics?.ngTemplateCount ?? 0) > 0 ? "ngTemplate" : "",
    (m.templateMetrics?.ngContainerCount ?? 0) > 0 ? "ngContainer" : "",
  ].filter(Boolean));
  let sharedDirectiveSum = 0;
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const setA = new Set(directiveVecs[i]);
      const setB = new Set(directiveVecs[j]);
      const inter = directiveVecs[i].filter((x) => setB.has(x)).length;
      const un = new Set([...directiveVecs[i], ...directiveVecs[j]]).size;
      sharedDirectiveSum += un === 0 ? 1 : inter / un;
      count++;
    }
  }
  const sharedDirective = count > 0 ? sharedDirectiveSum / count : 0.5;

  const deps = members.map((m) => m.dependencyCount);
  const orchCounts = members.map(
    (m) => m.responsibilityMetrics?.serviceOrchestrationCount ?? 0
  );
  const dependencyProfile = numericSimilarity(deps, 0.4, 2);
  const eventBinding = numericSimilarity(eventBindings, 0.5, 5);
  const orchestration = numericSimilarity(orchCounts, 0.5, 2);

  let lifecycleSum = 0;
  let lifecycleCount = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const hooksA = new Set(members[i].hooksUsed ?? []);
      const hooksB = new Set(members[j].hooksUsed ?? []);
      const subA = members[i].lifecycleSignals?.subscribeCount ?? 0;
      const subB = members[j].lifecycleSignals?.subscribeCount ?? 0;
      const hookInter = Array.from(hooksA).filter((x) => hooksB.has(x)).length;
      const hookUn = new Set(Array.from(hooksA).concat(Array.from(hooksB))).size;
      const hookSim = hookUn === 0 ? 1 : hookInter / hookUn;
      const subSim = Math.max(
        0,
        1 - Math.abs(subA - subB) / Math.max(subA, subB, 1)
      );
      lifecycleSum += (hookSim + subSim) / 2;
      lifecycleCount++;
    }
  }
  const lifecyclePattern =
    lifecycleCount > 0 ? lifecycleSum / lifecycleCount : 0.5;

  const roleMatchCount = members.filter(
    (m) => m.componentRole && m.componentRole !== "unknown"
  ).length;
  const roleConfidences = members
    .map((m) => m.roleConfidence ?? 0)
    .filter((c) => c > 0);
  const avgRoleConf = roleConfidences.length
    ? roleConfidences.reduce((a, b) => a + b, 0) / roleConfidences.length
    : 0;
  const roleCounts = new Map<ComponentRole, number>();
  for (const m of members) {
    if (m.componentRole && m.componentRole !== "unknown") {
      roleCounts.set(m.componentRole, (roleCounts.get(m.componentRole) ?? 0) + 1);
    }
  }
  const sameRole =
    roleCounts.size <= 1 && roleMatchCount >= members.length * 0.5 ? 1 : 0.5;
  const roleSim = sameRole * 0.7 + Math.min(1, avgRoleConf) * 0.3;

  const dominantIssues = members.map((m) => m.dominantIssue);
  const sameDominant = dominantIssues.every(
    (d) => d === dominantIssues[0] && d !== null
  );
  const dominantOk = sameDominant ? 1 : 0.5;

  let jaccardSum = 0;
  let jaccardCount = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      jaccardSum += jaccardSimilarity(members[i].warningCodes, members[j].warningCodes);
      jaccardCount++;
    }
  }
  const warningJaccard = jaccardCount > 0 ? jaccardSum / jaccardCount : 0.5;

  return {
    templateStructure,
    sharedDirective,
    dependencyProfile,
    eventBinding,
    lifecyclePattern,
    orchestration,
    roleSim,
    dominantOk,
    warningJaccard,
  };
}

function computeFamilyConfidence(
  members: MemberWithContext[],
  arch: ReturnType<typeof computeArchitecturalSimilarity>,
  nameScore: number,
  folderBonus: number,
  commonDominantIssue: DominantIssueType | null
): { score: number; contributingSignals: ContributingSignal[] } {
  const avgRoleConf =
    members.reduce((s, m) => s + (m.roleConfidence ?? 0), 0) / members.length;
  const unknownCount = members.filter(
    (m) => !m.componentRole || m.componentRole === "unknown"
  ).length;
  const unknownRatio = unknownCount / members.length;
  const roleGate = avgRoleConf < 0.5 ? 0.5 : 1;
  const roleSimWeight = roleGate;

  const signals: ContributingSignal[] = [
    {
      signal: "name_similarity",
      weight: 0.1,
      matched: nameScore >= 0.5,
      note: "Name/prefix similarity beyond suffix",
    },
    {
      signal: "path_similarity",
      weight: 0.08,
      matched: folderBonus >= 0.5,
      note: "Path/directory similarity",
    },
    {
      signal: "template_structure",
      weight: 0.18,
      matched: arch.templateStructure >= 0.5,
      note: "Similar template structure",
    },
    {
      signal: "shared_directive",
      weight: 0.12,
      matched: arch.sharedDirective >= 0.4,
      note: "Shared directive usage",
    },
    {
      signal: "dependency_profile",
      weight: 0.12,
      matched: arch.dependencyProfile >= 0.5,
      note: "Similar dependency profile",
    },
    {
      signal: "event_binding",
      weight: 0.08,
      matched: arch.eventBinding >= 0.5,
      note: "Similar event binding patterns",
    },
    {
      signal: "lifecycle_pattern",
      weight: 0.1,
      matched: arch.lifecyclePattern >= 0.5,
      note: "Similar lifecycle patterns",
    },
    {
      signal: "orchestration",
      weight: 0.08,
      matched: arch.orchestration >= 0.5,
      note: "Similar orchestration shape",
    },
    {
      signal: "role_similarity",
      weight: 0.06 * roleSimWeight,
      matched: arch.roleSim >= 0.5 && unknownRatio < UNKNOWN_ROLE_RATIO_GATE,
      note: "Similar component roles",
    },
    {
      signal: "dominant_issue",
      weight: 0.08,
      matched: !!commonDominantIssue,
      note: "Shared dominant issue",
    },
    {
      signal: "warning_jaccard",
      weight: 0.06,
      matched: arch.warningJaccard >= 0.3,
      note: "Overlapping warning patterns",
    },
  ];

  const breakdown = normalizeConfidence(signals, {
    minEvidenceForHigh: 3,
    minEvidenceForVeryHigh: 4,
    minEvidenceForMax: 5,
  });

  let score = breakdown.score;
  if (avgRoleConf < ROLE_CONFIDENCE_GATE || unknownRatio > UNKNOWN_ROLE_RATIO_GATE) {
    score = Math.min(score, 0.65);
  }
  return { score, contributingSignals: breakdown.contributingSignals };
}

function detectOutliers(
  members: MemberWithContext[],
  avgLineCount: number,
  avgDependencyCount: number
): { outliers: MemberWithContext[]; coreMembers: MemberWithContext[] } {
  if (members.length < 3) {
    return { outliers: [], coreMembers: members };
  }
  const outliers: MemberWithContext[] = [];
  const coreMembers: MemberWithContext[] = [];
  const lineThreshold = avgLineCount * 0.4;
  const depDiffThreshold = 3;
  const avgWarningCount =
    members.reduce((s, m) => s + m.warningCodes.length, 0) / members.length;

  for (const m of members) {
    let outlierScore = 0;
    if (m.lineCount < lineThreshold) outlierScore++;
    if (
      m.warningCodes.length < 2 &&
      avgWarningCount > 4 &&
      members.some((x) => x.warningCodes.length > 6)
    )
      outlierScore++;
    if (Math.abs(m.dependencyCount - avgDependencyCount) > depDiffThreshold)
      outlierScore++;
    const roleCounts = new Map<ComponentRole, number>();
    for (const o of members) {
      if (o.componentRole && o.componentRole !== "unknown") {
        roleCounts.set(o.componentRole, (roleCounts.get(o.componentRole) ?? 0) + 1);
      }
    }
    const topRole = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (
      topRole &&
      m.componentRole &&
      m.componentRole !== topRole &&
      (m.roleConfidence ?? 0) > 0.6
    )
      outlierScore++;
    const tm = m.templateMetrics;
    const others = members.filter((x) => x !== m);
    const avgNgFor =
      others.reduce(
        (s, x) =>
          s + (x.templateMetrics?.ngForCount ?? 0) + (x.templateMetrics?.atForCount ?? 0),
        0
      ) / others.length;
    const myNgFor = (tm?.ngForCount ?? 0) + (tm?.atForCount ?? 0);
    if (avgNgFor > 2 && myNgFor === 0) outlierScore++;
    if (outlierScore >= 2) {
      outliers.push(m);
    } else {
      coreMembers.push(m);
    }
  }
  return {
    outliers,
    coreMembers: coreMembers.length > 0 ? coreMembers : members,
  };
}

function generateRepresentativeEvidence(
  members: MemberWithContext[],
  commonDominantIssue: DominantIssueType | null,
  arch: ReturnType<typeof computeArchitecturalSimilarity>
): string[] {
  const evidence: string[] = [];
  if (
    arch.templateStructure >= 0.5 ||
    (arch.sharedDirective >= 0.4 && arch.eventBinding >= 0.4)
  ) {
    evidence.push("Similar template structure (ngFor, event bindings)");
  }
  if (arch.orchestration >= 0.5) {
    evidence.push("Similar orchestration shape");
  }
  if (arch.lifecyclePattern >= 0.5) {
    evidence.push("Similar lifecycle patterns");
  }
  if (arch.sharedDirective >= 0.4) {
    evidence.push("Shared structural directive usage");
  }
  if (commonDominantIssue) {
    const label = DOMINANT_ISSUE_TO_LABEL[commonDominantIssue] ?? commonDominantIssue;
    evidence.push(`Shared dominant issue: ${label}`);
  }
  return evidence;
}

function computeCommonWarningPatterns(members: ComponentFamilyMember[]): string[] {
  if (members.length === 0) return [];
  const codeCounts = new Map<string, number>();
  for (const m of members) {
    for (const code of m.warningCodes) {
      codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
    }
  }
  const threshold = Math.ceil(members.length * 0.5);
  return Array.from(codeCounts.entries())
    .filter(([, count]) => count >= threshold)
    .map(([code]) => code)
    .slice(0, 8);
}

const ROLE_PATTERN_LABELS: Record<string, string> = {
  "player-page": "Player Page",
  "player-container": "Player Container",
  "detail-container": "Detail Container",
  "detail-page": "Detail Page",
  "form-container": "Form Container",
  "list-container": "List Container",
  "page-container": "Page Container",
};

function computeRoleDistribution(
  members: ComponentFamilyMember[]
): Record<ComponentRole, number> {
  const dist: Record<ComponentRole, number> = {
    page: 0,
    container: 0,
    detail: 0,
    player: 0,
    form: 0,
    list: 0,
    viewer: 0,
    editor: 0,
    widget: 0,
    layout: 0,
    modal: 0,
    unknown: 0,
  };
  for (const m of members) {
    if (m.componentRole && m.componentRole !== "unknown") {
      dist[m.componentRole]++;
    }
  }
  return dist;
}

function computeDetectedRolePattern(
  roleDistribution: Record<ComponentRole, number>,
  familyName: string
): string {
  const entries = (Object.entries(roleDistribution) as [ComponentRole, number][])
    .filter(([, count]) => count > 0 && count !== undefined)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return "";

  const [topRole, topCount] = entries[0];
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const second = entries[1];

  if (second && second[1] >= total * 0.3) {
    const key = `${topRole}-${second[0]}`;
    return ROLE_PATTERN_LABELS[key] ?? `${capitalize(topRole)} ${capitalize(second[0])}`;
  }

  const roleLabels: Record<ComponentRole, string> = {
    page: "Page",
    container: "Container",
    detail: "Detail",
    player: "Player",
    form: "Form",
    list: "List",
    viewer: "Viewer",
    editor: "Editor",
    widget: "Widget",
    layout: "Layout",
    modal: "Modal",
    unknown: "Unclear",
  };
  return roleLabels[topRole] ?? capitalize(topRole);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function computeExtractionScore(family: ComponentFamily): number {
  let score = 0;
  score += Math.min(4, family.members.length) * 1.5;
  score += family.commonDominantIssue ? 2 : 0;
  score += family.commonWarningPatterns.length * 0.3;
  score += family.avgLineCount > 150 ? 1 : 0;
  score += family.avgLineCount > 250 ? 1 : 0;
  return Math.min(10, score);
}

export function detectFamilies(input: FamilyDetectionInput): ComponentFamily[] {
  const {
    workspacePath,
    components,
    componentDiagnostics,
    templateResults,
    responsibilityResults,
    lifecycleByPath,
  } = input;

  const suffixToIndices = new Map<string, number[]>();
  for (let i = 0; i < components.length; i++) {
    const suffix = extractFamilySuffix(components[i].fileName);
    if (suffix) {
      const arr = suffixToIndices.get(suffix) ?? [];
      arr.push(i);
      suffixToIndices.set(suffix, arr);
    }
  }

  const families: ComponentFamily[] = [];

  for (const [familyName, indices] of Array.from(suffixToIndices)) {
    if (indices.length < MIN_FAMILY_SIZE) continue;

    let membersRaw: MemberWithContext[] = indices.map((i) => {
      const comp = components[i];
      const diag = componentDiagnostics[i];
      const template = templateResults[i];
      const resp = responsibilityResults[i];
      const lifecycle = lifecycleByPath.get(normalizePath(comp.filePath));

      const warningCodes = getWarningCodes(comp, template, resp, lifecycle);

      return {
        filePath: comp.filePath,
        fileName: comp.fileName,
        className: diag?.className,
        lineCount: comp.lineCount,
        dependencyCount: comp.dependencyCount,
        templateScore: template?.score ?? 10,
        responsibilityScore: resp?.score ?? 10,
        dominantIssue: diag?.dominantIssue ?? null,
        warningCodes,
        componentRole: diag?.componentRole,
        roleConfidence: diag?.roleConfidence,
        templateMetrics: template?.metrics,
        responsibilityMetrics: resp?.metrics,
        lifecycleSignals: lifecycle?.signals,
        hooksUsed: lifecycle?.hooksUsed ?? [],
      };
    });

    // Dedupe by filePath to avoid duplicate components
    const seenPaths = new Set<string>();
    let members: MemberWithContext[] = membersRaw.filter((m) => {
      if (seenPaths.has(m.filePath)) return false;
      seenPaths.add(m.filePath);
      return true;
    });

    if (members.length < MIN_FAMILY_SIZE) continue;

    const filePaths = members.map((m) => m.filePath);
    const fileNames = members.map((m) => m.fileName);
    const folderBonus = folderStructureBonus(filePaths, workspacePath);
    const nameScore = computeNameSimilarityScore(fileNames, familyName);
    const arch = computeArchitecturalSimilarity(members);

    const familyScore =
      nameScore * 0.1 +
      folderBonus * 0.08 +
      arch.templateStructure * 0.18 +
      arch.sharedDirective * 0.12 +
      arch.dependencyProfile * 0.12 +
      arch.eventBinding * 0.08 +
      arch.lifecyclePattern * 0.1 +
      arch.orchestration * 0.08 +
      arch.roleSim * 0.06 +
      arch.dominantOk * 0.08 +
      arch.warningJaccard * 0.06;

    const threshold =
      members.length <= SMALL_GROUP_SIZE
        ? FAMILY_SCORE_THRESHOLD_SMALL
        : FAMILY_SCORE_THRESHOLD;
    if (familyScore < threshold) continue;

    const commonDominantIssue = (() => {
      const counts = new Map<DominantIssueType | null, number>();
      for (const m of members) {
        const k = m.dominantIssue;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const sorted = Array.from(counts.entries())
        .filter(([k]) => k !== null)
        .sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] ?? null;
    })();

    const commonWarningPatterns = computeCommonWarningPatterns(members);
    const avgLineCount =
      members.reduce((s, m) => s + m.lineCount, 0) / members.length;
    const avgDependencyCount =
      members.reduce((s, m) => s + m.dependencyCount, 0) / members.length;
    const refactorDirection = commonDominantIssue
      ? REFACTOR_DIRECTIONS[commonDominantIssue]
      : "Consider extracting shared logic into base class or service.";

    const roleDistribution = computeRoleDistribution(members);
    const detectedRolePattern = computeDetectedRolePattern(roleDistribution, familyName);

    const { score: confidence } = computeFamilyConfidence(
      members,
      arch,
      nameScore,
      folderBonus,
      commonDominantIssue
    );

    const avgRoleConf =
      members.reduce((s, m) => s + (m.roleConfidence ?? 0), 0) / members.length;
    const unknownCount = members.filter(
      (m) => !m.componentRole || m.componentRole === "unknown"
    ).length;
    const unknownRatio = unknownCount / members.length;
    const roleGatedConfidence =
      avgRoleConf < ROLE_CONFIDENCE_GATE || unknownRatio > UNKNOWN_ROLE_RATIO_GATE
        ? Math.min(confidence, 0.65)
        : confidence;

    const { outliers, coreMembers } = detectOutliers(
      members,
      avgLineCount,
      avgDependencyCount
    );
    const hasOutliers = outliers.length > 0;
    const isSmallFamily = members.length <= SMALL_GROUP_SIZE;
    const isWeakGrouping =
      roleGatedConfidence < WEAK_GROUPING_THRESHOLD ||
      (hasOutliers && isSmallFamily && members.length <= 4);

    const baseMembers: ComponentFamilyMember[] = members.map((m) => ({
      filePath: m.filePath,
      fileName: m.fileName,
      className: m.className,
      lineCount: m.lineCount,
      dependencyCount: m.dependencyCount,
      templateScore: m.templateScore,
      responsibilityScore: m.responsibilityScore,
      dominantIssue: m.dominantIssue,
      warningCodes: m.warningCodes,
      componentRole: m.componentRole,
      roleConfidence: m.roleConfidence,
    }));

    const family: ComponentFamily = {
      familyName,
      members: baseMembers,
      commonDominantIssue,
      commonWarningPatterns,
      avgLineCount: Math.round(avgLineCount),
      avgDependencyCount: Number(avgDependencyCount.toFixed(1)),
      extractionScore: 0,
      refactorDirection,
      roleDistribution,
      detectedRolePattern,
      confidence: roleGatedConfidence,
      isWeakGrouping: isWeakGrouping || undefined,
      weakGroupingLabel: isWeakGrouping
        ? "Review similarity before extraction"
        : undefined,
      representativeEvidence: generateRepresentativeEvidence(
        members,
        commonDominantIssue,
        arch
      ),
      outliers:
        outliers.length > 0
          ? outliers.map((o) => ({
              filePath: o.filePath,
              fileName: o.fileName,
              className: o.className,
              lineCount: o.lineCount,
              dependencyCount: o.dependencyCount,
              templateScore: o.templateScore,
              responsibilityScore: o.responsibilityScore,
              dominantIssue: o.dominantIssue,
              warningCodes: o.warningCodes,
              componentRole: o.componentRole,
              roleConfidence: o.roleConfidence,
            }))
          : undefined,
      coreMembers:
        coreMembers.length > 0 && coreMembers.length < members.length
          ? coreMembers.map((c) => ({
              filePath: c.filePath,
              fileName: c.fileName,
              className: c.className,
              lineCount: c.lineCount,
              dependencyCount: c.dependencyCount,
              templateScore: c.templateScore,
              responsibilityScore: c.responsibilityScore,
              dominantIssue: c.dominantIssue,
              warningCodes: c.warningCodes,
              componentRole: c.componentRole,
              roleConfidence: c.roleConfidence,
            }))
          : undefined,
    };
    family.extractionScore = computeExtractionScore(family);

    // Filter low-value families
    const minExtraction =
      isSmallFamily ? MIN_EXTRACTION_SCORE_SMALL : MIN_EXTRACTION_SCORE;
    if (family.extractionScore < minExtraction) continue;
    if (family.avgLineCount < MIN_AVG_LINES) continue;

    families.push(family);
  }

  return families
    .sort((a, b) => {
      const scoreDiff = b.extractionScore - a.extractionScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.members.length - a.members.length;
    })
    .slice(0, MAX_FAMILIES_OUTPUT);
}
