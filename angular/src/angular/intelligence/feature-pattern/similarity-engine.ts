import type { TemplateMetrics } from "../../analyzers/template/template-models";
import type { ResponsibilityMetrics } from "../../analyzers/responsibility/responsibility-models";
import type { ComponentRole } from "../../../diagnostic/diagnostic-models";

export const SIMILARITY_THRESHOLD = 0.6;

export interface SimilarityCandidate {
  fileName: string;
  className?: string;
  roleSignals: string[];
  componentRole?: ComponentRole;
  roleConfidence?: number;
  templateMetrics?: TemplateMetrics;
  responsibilityMetrics?: ResponsibilityMetrics;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = Array.from(setA).filter((x) => setB.has(x)).length;
  const union = new Set(Array.from(setA).concat(Array.from(setB))).size;
  return union === 0 ? 1 : intersection / union;
}

function nameSimilarity(fileNameA: string, fileNameB: string): number {
  const baseA = fileNameA.replace(/\.component\.ts$/i, "").toLowerCase();
  const baseB = fileNameB.replace(/\.component\.ts$/i, "").toLowerCase();
  if (baseA === baseB) return 1;

  const partsA = baseA.split(/-/);
  const partsB = baseB.split(/-/);
  const setA = new Set(partsA);
  const setB = new Set(partsB);
  const intersection = Array.from(setA).filter((x) => setB.has(x)).length;
  const union = new Set(Array.from(setA).concat(Array.from(setB))).size;
  const wordOverlap = union === 0 ? 1 : intersection / union;

  const suffixA = partsA.slice(-2).join("-");
  const suffixB = partsB.slice(-2).join("-");
  const suffixMatch = suffixA === suffixB ? 1 : 0;

  return Math.max(wordOverlap, suffixMatch * 0.8);
}

function roleSimilarity(a: SimilarityCandidate, b: SimilarityCandidate): number {
  const roleMatch = a.componentRole && b.componentRole && a.componentRole === b.componentRole ? 1 : 0;
  const confidenceAvg = ((a.roleConfidence ?? 0) + (b.roleConfidence ?? 0)) / 2;
  return roleMatch * 0.7 + confidenceAvg * 0.3;
}

function serviceUsageSimilarity(
  metricsA?: ResponsibilityMetrics,
  metricsB?: ResponsibilityMetrics
): number {
  if (!metricsA || !metricsB) return 0.5;

  const formGroupDiff = Math.abs((metricsA.formGroupCount ?? 0) - (metricsB.formGroupCount ?? 0));
  const formGroupSim = Math.max(0, 1 - formGroupDiff / 3);

  const orchDiff = Math.abs(
    (metricsA.serviceOrchestrationCount ?? 0) - (metricsB.serviceOrchestrationCount ?? 0)
  );
  const orchSim = Math.max(0, 1 - orchDiff / 4);

  return (formGroupSim + orchSim) / 2;
}

function templateComplexitySimilarity(
  metricsA?: TemplateMetrics,
  metricsB?: TemplateMetrics
): number {
  if (!metricsA || !metricsB) return 0.5;

  const lineRatio =
    Math.min(metricsA.lineCount, metricsB.lineCount) /
    Math.max(metricsA.lineCount, metricsB.lineCount, 1);
  const ngForDiff = Math.abs(
    (metricsA.ngForCount ?? 0) + (metricsA.atForCount ?? 0) -
    ((metricsB.ngForCount ?? 0) + (metricsB.atForCount ?? 0))
  );
  const ngForSim = Math.max(0, 1 - ngForDiff / 4);
  const depthDiff = Math.abs((metricsA.structuralDepth ?? 0) - (metricsB.structuralDepth ?? 0));
  const depthSim = Math.max(0, 1 - depthDiff / 3);

  return (lineRatio + ngForSim + depthSim) / 3;
}

export function computeSimilarity(a: SimilarityCandidate, b: SimilarityCandidate): number {
  const nameSim = nameSimilarity(a.fileName, b.fileName);
  const templateSignalsSim = jaccardSimilarity(a.roleSignals, b.roleSignals);
  const roleSim = roleSimilarity(a, b);
  const serviceSim = serviceUsageSimilarity(
    a.responsibilityMetrics,
    b.responsibilityMetrics
  );
  const templateComplexitySim = templateComplexitySimilarity(
    a.templateMetrics,
    b.templateMetrics
  );

  return (
    nameSim * 0.25 +
    templateSignalsSim * 0.25 +
    roleSim * 0.2 +
    serviceSim * 0.15 +
    templateComplexitySim * 0.15
  );
}

export function computeGroupConfidence(members: SimilarityCandidate[]): number {
  if (members.length < 2) return 1;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      sum += computeSimilarity(members[i], members[j]);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}
