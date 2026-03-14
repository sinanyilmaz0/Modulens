import type { ScanResult } from "../../../core/scan-result";
import type { ArchitectureSmellType } from "./architecture-smell-models";

/** Context for a single component used by heuristics */
export interface ComponentSmellContext {
  filePath: string;
  fileName: string;
  lineCount: number;
  dependencyCount: number;
  componentRole?: string;
  roleConfidence?: number;
  dominantIssue?: string | null;
  templateLines?: number;
  templateScore?: number;
  structuralDepth?: number;
  eventBindingCount?: number;
  methodCallCount?: number;
  serviceOrchestrationCount?: number;
  methodCount?: number;
  formGroupCount?: number;
  formPatchSetUpdateCount?: number;
  routerUsage?: boolean;
  subscribeCount?: number;
  setTimeoutCount?: number;
  addEventListenerCount?: number;
  familyName?: string | null;
}

const GOD_PAGE_SIGNALS = [
  (ctx: ComponentSmellContext) => ctx.componentRole === "page",
  (ctx: ComponentSmellContext) => ctx.lineCount > 700,
  (ctx: ComponentSmellContext) =>
    ctx.dominantIssue === "GOD_COMPONENT" || ctx.dominantIssue === "TEMPLATE_HEAVY_COMPONENT",
  (ctx: ComponentSmellContext) => ctx.dependencyCount >= 5 || ctx.routerUsage === true,
];

const PLAYER_ORCHESTRATION_SIGNALS = [
  (ctx: ComponentSmellContext) =>
    ctx.componentRole === "player" || ctx.familyName === "*-fragment-player",
  (ctx: ComponentSmellContext) => (ctx.templateScore ?? 10) < 6,
  (ctx: ComponentSmellContext) =>
    (ctx.subscribeCount ?? 0) > 2 ||
    (ctx.setTimeoutCount ?? 0) > 0 ||
    (ctx.addEventListenerCount ?? 0) > 0,
  (ctx: ComponentSmellContext) => ctx.familyName === "*-fragment-player",
];

const TEMPLATE_EXPLOSION_SIGNALS = [
  (ctx: ComponentSmellContext) => (ctx.templateLines ?? 0) > 150,
  (ctx: ComponentSmellContext) => (ctx.structuralDepth ?? 0) > 5,
  (ctx: ComponentSmellContext) =>
    (ctx.eventBindingCount ?? 0) > 15 || (ctx.methodCallCount ?? 0) > 20,
];

const CONTAINER_EXPLOSION_SIGNALS = [
  (ctx: ComponentSmellContext) => ctx.componentRole === "container",
  (ctx: ComponentSmellContext) =>
    (ctx.serviceOrchestrationCount ?? 0) >= 4 || (ctx.methodCount ?? 0) >= 15,
  (ctx: ComponentSmellContext) => ctx.lineCount > 400,
];

function countMatchingSignals(
  ctx: ComponentSmellContext,
  signals: Array<(c: ComponentSmellContext) => boolean>
): { count: number; evidence: string[] } {
  const evidence: string[] = [];
  let count = 0;
  for (const fn of signals) {
    if (fn(ctx)) {
      count++;
      evidence.push(fn.toString().slice(0, 80));
    }
  }
  return { count, evidence };
}

function buildComponentContext(
  result: ScanResult,
  filePath: string
): ComponentSmellContext | null {
  const diag = (result.diagnosticSummary.componentDiagnostics ?? []).find(
    (d) => d.filePath === filePath
  );
  const comp = result.topProblematicComponents.find((c) => c.filePath === filePath);
  const template = result.template.topRisks.find((r) => r.filePath === filePath);
  const responsibility = result.responsibility.topRisks.find((r) => r.filePath === filePath);
  const lifecycle = result.lifecycle.topRisks.find((r) => r.filePath === filePath);

  if (!diag && !comp && !template && !responsibility) return null;

  const lineCount =
    comp?.lineCount ??
    responsibility?.lineCount ??
    template?.metrics?.lineCount ??
    0;

  let familyName: string | null = null;
  for (const family of [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
    ...result.similarComponentFamilies,
  ]) {
    if (family.members.some((m) => m.filePath === filePath)) {
      familyName = family.familyName;
      break;
    }
  }

  return {
    filePath,
    fileName: diag?.fileName ?? comp?.fileName ?? filePath.split(/[/\\]/).pop() ?? "",
    lineCount,
    dependencyCount: comp?.dependencyCount ?? responsibility?.metrics?.dependencyCount ?? 0,
    componentRole: diag?.componentRole,
    roleConfidence: diag?.roleConfidence,
    dominantIssue: diag?.dominantIssue ?? null,
    templateLines: template?.metrics?.lineCount ?? responsibility?.templateMetrics?.lineCount,
    templateScore: template?.score ?? responsibility?.templateMetrics ? 10 : undefined,
    structuralDepth: template?.metrics?.structuralDepth ?? responsibility?.templateMetrics?.structuralDepth,
    eventBindingCount: template?.metrics?.eventBindingCount ?? responsibility?.templateMetrics?.eventBindingCount,
    methodCallCount: template?.metrics?.methodCallCount ?? responsibility?.templateMetrics?.methodCallCount,
    serviceOrchestrationCount: responsibility?.metrics?.serviceOrchestrationCount,
    methodCount: responsibility?.metrics?.methodCount,
    formGroupCount: responsibility?.metrics?.formGroupCount,
    formPatchSetUpdateCount: responsibility?.metrics?.formPatchSetUpdateCount,
    routerUsage: responsibility?.metrics?.routerUsage,
    subscribeCount: lifecycle?.signals?.subscribeCount ?? responsibility?.lifecycleSignals?.subscribeCount,
    setTimeoutCount: lifecycle?.signals?.setTimeoutCount ?? responsibility?.lifecycleSignals?.setTimeoutCount,
    addEventListenerCount:
      lifecycle?.signals?.addEventListenerCount ?? responsibility?.lifecycleSignals?.addEventListenerCount,
    familyName,
  };
}

function getComponentPaths(result: ScanResult): string[] {
  const paths = new Set<string>();
  for (const d of result.diagnosticSummary.componentDiagnostics ?? []) {
    paths.add(d.filePath);
  }
  for (const c of result.topProblematicComponents) {
    paths.add(c.filePath);
  }
  for (const r of result.template.topRisks) {
    paths.add(r.filePath);
  }
  for (const r of result.responsibility.topRisks) {
    paths.add(r.filePath);
  }
  return Array.from(paths);
}

export interface SmellMatch {
  smellType: ArchitectureSmellType;
  signalCount: number;
  evidence: string[];
  affectedPaths: string[];
  relatedFamilies: string[];
}

export function detectGodPageSmell(result: ScanResult): SmellMatch | null {
  const evidence: string[] = [];
  const affectedPaths: string[] = [];
  let maxSignalCount = 0;

  for (const filePath of getComponentPaths(result)) {
    const ctx = buildComponentContext(result, filePath);
    if (!ctx) continue;
    const { count } = countMatchingSignals(ctx, GOD_PAGE_SIGNALS);
    if (count >= 3) {
      affectedPaths.push(ctx.fileName);
      maxSignalCount = Math.max(maxSignalCount, count);
      if (count >= 4) evidence.push(`role=page`);
      if (ctx.lineCount > 700) evidence.push(`lineCount>700`);
      if (ctx.dominantIssue === "GOD_COMPONENT" || ctx.dominantIssue === "TEMPLATE_HEAVY_COMPONENT")
        evidence.push(`dominantIssue=${ctx.dominantIssue}`);
      if (ctx.dependencyCount >= 5) evidence.push(`dependencyCount>=5`);
      if (ctx.routerUsage) evidence.push(`routerUsage`);
    }
  }

  if (affectedPaths.length === 0) return null;
  return {
    smellType: "GOD_PAGE_SMELL",
    signalCount: maxSignalCount,
    evidence: Array.from(new Set(evidence)).slice(0, 6),
    affectedPaths,
    relatedFamilies: [],
  };
}

export function detectPlayerOrchestrationSmell(result: ScanResult): SmellMatch | null {
  const evidence: string[] = [];
  const affectedPaths: string[] = [];
  const relatedFamilies: string[] = [];
  let maxSignalCount = 0;

  const playerFamily = [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
  ].find((f) => f.familyName === "*-fragment-player");
  if (playerFamily) relatedFamilies.push("*-fragment-player");

  for (const m of playerFamily?.members ?? []) {
    const ctx = buildComponentContext(result, m.filePath);
    if (!ctx) continue;
    ctx.familyName = "*-fragment-player";
    const { count } = countMatchingSignals(ctx, PLAYER_ORCHESTRATION_SIGNALS);
    if (count >= 2) {
      affectedPaths.push(m.fileName);
      maxSignalCount = Math.max(maxSignalCount, count);
      if (ctx.componentRole === "player") evidence.push("role=player");
      if (ctx.familyName) evidence.push(`family=${ctx.familyName}`);
      if ((ctx.templateScore ?? 10) < 6) evidence.push("templateScore<6");
      if ((ctx.subscribeCount ?? 0) > 2) evidence.push("subscribeCount>2");
      if ((ctx.setTimeoutCount ?? 0) > 0) evidence.push("setTimeoutCount>0");
      if ((ctx.addEventListenerCount ?? 0) > 0) evidence.push("addEventListenerCount>0");
      evidence.push("repeated family pattern");
    }
  }

  if (playerFamily && affectedPaths.length === 0) {
    for (const m of playerFamily.members) {
      affectedPaths.push(m.fileName);
    }
    evidence.push("family=*-fragment-player", "repeated player pattern");
    maxSignalCount = 2;
  }

  if (affectedPaths.length === 0) return null;
  return {
    smellType: "PLAYER_ORCHESTRATION_SMELL",
    signalCount: Math.max(maxSignalCount, 2),
    evidence: Array.from(new Set(evidence)).slice(0, 6),
    affectedPaths,
    relatedFamilies,
  };
}

export function detectTemplateExplosionSmell(result: ScanResult): SmellMatch | null {
  const evidence: string[] = [];
  const affectedPaths: string[] = [];
  let maxSignalCount = 0;

  for (const filePath of getComponentPaths(result)) {
    const ctx = buildComponentContext(result, filePath);
    if (!ctx) continue;
    const { count } = countMatchingSignals(ctx, TEMPLATE_EXPLOSION_SIGNALS);
    if (count >= 2) {
      affectedPaths.push(ctx.fileName);
      maxSignalCount = Math.max(maxSignalCount, count);
      if ((ctx.templateLines ?? 0) > 150) evidence.push("templateLines>150");
      if ((ctx.structuralDepth ?? 0) > 5) evidence.push("structuralDepth>5");
      if ((ctx.eventBindingCount ?? 0) > 15) evidence.push("eventBindingCount>15");
      if ((ctx.methodCallCount ?? 0) > 20) evidence.push("methodCallCount>20");
    }
  }

  if (affectedPaths.length === 0) return null;
  return {
    smellType: "TEMPLATE_EXPLOSION_SMELL",
    signalCount: maxSignalCount,
    evidence: Array.from(new Set(evidence)).slice(0, 6),
    affectedPaths,
    relatedFamilies: [],
  };
}

export function detectContainerExplosionSmell(result: ScanResult): SmellMatch | null {
  const evidence: string[] = [];
  const affectedPaths: string[] = [];
  let maxSignalCount = 0;

  for (const filePath of getComponentPaths(result)) {
    const ctx = buildComponentContext(result, filePath);
    if (!ctx) continue;
    const { count } = countMatchingSignals(ctx, CONTAINER_EXPLOSION_SIGNALS);
    if (count >= 2) {
      affectedPaths.push(ctx.fileName);
      maxSignalCount = Math.max(maxSignalCount, count);
      if (ctx.componentRole === "container") evidence.push("role=container");
      if ((ctx.serviceOrchestrationCount ?? 0) >= 4) evidence.push("serviceOrchestrationCount>=4");
      if ((ctx.methodCount ?? 0) >= 15) evidence.push("methodCount>=15");
      if (ctx.lineCount > 400) evidence.push("lineCount>400");
    }
  }

  if (affectedPaths.length === 0) return null;
  return {
    smellType: "CONTAINER_EXPLOSION_SMELL",
    signalCount: maxSignalCount,
    evidence: Array.from(new Set(evidence)).slice(0, 6),
    affectedPaths,
    relatedFamilies: [],
  };
}

export function detectRepeatedDetailPageSmell(result: ScanResult): SmellMatch | null {
  const detailFamily = [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
    ...result.similarComponentFamilies,
  ].find((f) => f.familyName === "*-detail");
  if (!detailFamily || detailFamily.members.length < 3 || detailFamily.avgLineCount < 500)
    return null;

  return {
    smellType: "REPEATED_DETAIL_PAGE_SMELL",
    signalCount: 3,
    evidence: [
      "family=*-detail",
      `members.length>=3 (${detailFamily.members.length})`,
      `avgLineCount>500 (${Math.round(detailFamily.avgLineCount)})`,
    ],
    affectedPaths: detailFamily.members.map((m) => m.fileName),
    relatedFamilies: ["*-detail"],
  };
}

export function detectFragmentManagementSmell(result: ScanResult): SmellMatch | null {
  const manageFamily = [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
    ...result.similarComponentFamilies,
  ].find((f) => f.familyName === "*-manage-fragments");
  if (!manageFamily || manageFamily.members.length < 2 || manageFamily.avgLineCount < 800)
    return null;

  return {
    smellType: "FRAGMENT_MANAGEMENT_SMELL",
    signalCount: 3,
    evidence: [
      "family=*-manage-fragments",
      `members.length>=2 (${manageFamily.members.length})`,
      `avgLineCount>800 (${Math.round(manageFamily.avgLineCount)})`,
    ],
    affectedPaths: manageFamily.members.map((m) => m.fileName),
    relatedFamilies: ["*-manage-fragments"],
  };
}

export function detectFormOrchestrationSmell(result: ScanResult): SmellMatch | null {
  const evidence: string[] = [];
  const affectedPaths: string[] = [];
  const relatedFamilies: string[] = [];

  const formFamily = [
    ...result.extractionCandidates,
    ...result.repeatedArchitectureHotspots,
    ...result.similarComponentFamilies,
  ].find((f) => f.familyName === "*-form");
  if (formFamily) relatedFamilies.push("*-form");

  for (const m of formFamily?.members ?? []) {
    const ctx = buildComponentContext(result, m.filePath);
    if (!ctx) continue;
    const formGroupOk = (ctx.formGroupCount ?? 0) >= 2;
    const formPatchOk = (ctx.formPatchSetUpdateCount ?? 0) >= 5;
    const routerOk = ctx.routerUsage === true;
    if ((formGroupOk || formPatchOk) && routerOk) {
      affectedPaths.push(m.fileName);
      if (formGroupOk) evidence.push("formGroupCount>=2");
      if (formPatchOk) evidence.push("formPatchSetUpdateCount>=5");
      evidence.push("routerUsage");
    } else if (formGroupOk || formPatchOk) {
      affectedPaths.push(m.fileName);
      if (formGroupOk) evidence.push("formGroupCount>=2");
      if (formPatchOk) evidence.push("formPatchSetUpdateCount>=5");
    }
  }

  if (affectedPaths.length === 0) return null;
  return {
    smellType: "FORM_ORCHESTRATION_SMELL",
    signalCount: 2,
    evidence: Array.from(new Set(evidence)).slice(0, 6),
    affectedPaths,
    relatedFamilies,
  };
}

export function runAllSmellHeuristics(result: ScanResult): SmellMatch[] {
  const matches: SmellMatch[] = [];
  const detectors = [
    detectGodPageSmell,
    detectPlayerOrchestrationSmell,
    detectTemplateExplosionSmell,
    detectContainerExplosionSmell,
    detectRepeatedDetailPageSmell,
    detectFragmentManagementSmell,
    detectFormOrchestrationSmell,
  ];
  for (const detect of detectors) {
    const match = detect(result);
    if (match) matches.push(match);
  }
  return matches;
}
