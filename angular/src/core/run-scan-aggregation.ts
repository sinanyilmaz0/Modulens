import type { ComponentAnalysisResult } from "../angular/analyzers/component-analyzer";
import type { LifecycleAnalysisResult } from "../angular/analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult } from "../angular/analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../angular/analyzers/responsibility/responsibility-models";
import type { ScanResult, CommonWarning } from "./scan-result";

const COMMON_WARNINGS_TOP = 7;

export function normalizePathForMatch(p: string): string {
  return p.replace(/\\/g, "/");
}

export function computeCommonWarnings(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): CommonWarning[] {
  const codeCounts = new Map<string, number>();

  for (const c of components) {
    for (const issue of c.issues) {
      codeCounts.set(issue.type, (codeCounts.get(issue.type) ?? 0) + 1);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }

  return Array.from(codeCounts.entries())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, COMMON_WARNINGS_TOP)
    .map(([code, count]) => ({ code, count }));
}

export function computeAllRuleViolationCounts(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): Record<string, number> {
  const codeCounts = new Map<string, number>();

  for (const c of components) {
    for (const issue of c.issues) {
      codeCounts.set(issue.type, (codeCounts.get(issue.type) ?? 0) + 1);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      codeCounts.set(w.code, (codeCounts.get(w.code) ?? 0) + 1);
    }
  }

  return Object.fromEntries(codeCounts);
}

export function computeRuleToAffectedComponents(
  components: ComponentAnalysisResult[],
  lifecycleResults: LifecycleAnalysisResult[],
  templateResults: TemplateAnalysisResult[],
  responsibilityResults: ResponsibilityAnalysisResult[]
): Record<string, string[]> {
  const componentPaths = new Set(components.map((c) => normalizePathForMatch(c.filePath)));
  const ruleToPaths = new Map<string, Set<string>>();

  const add = (ruleId: string, filePath: string) => {
    if (!componentPaths.has(normalizePathForMatch(filePath))) return;
    let set = ruleToPaths.get(ruleId);
    if (!set) {
      set = new Set();
      ruleToPaths.set(ruleId, set);
    }
    set.add(filePath);
  };

  for (const c of components) {
    for (const issue of c.issues) {
      add(issue.type, c.filePath);
    }
  }
  for (const r of lifecycleResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }
  for (const r of templateResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }
  for (const r of responsibilityResults) {
    for (const w of r.warnings) {
      add(w.code, r.filePath);
    }
  }

  return Object.fromEntries(
    Array.from(ruleToPaths.entries()).map(([k, v]) => [k, Array.from(v)])
  );
}

export function buildWarningsAndRecommendations(result: ScanResult): string[] {
  const recs: string[] = [];

  const add = (r: string) => {
    if (r && !recs.includes(r)) recs.push(r);
  };

  const hasExtraction = result.extractionCandidates.length > 0;
  const lowOverall = result.scores.overall < 5;

  if (lowOverall && hasExtraction) {
    add(
      "Overall score is low. Focus on top cross-cutting risks and extraction candidates first."
    );
  } else if (lowOverall) {
    add("Overall score is low. Focus on top cross-cutting risks and extraction candidates first.");
  } else if (hasExtraction) {
    add(
      `Found ${result.extractionCandidates.length} extraction candidates. Review similar component families for refactoring.`
    );
  }

  if (result.diagnosticSummary.dominantIssueCounts.CLEANUP_RISK_COMPONENT > 0) {
    add("Address cleanup risks: ensure subscriptions and listeners are properly disposed in ngOnDestroy.");
  }
  if (result.diagnosticSummary.dominantIssueCounts.GOD_COMPONENT > 0) {
    add("Consider splitting god components: extract logic into services or child components.");
  }
  if (result.diagnosticSummary.dominantIssueCounts.TEMPLATE_HEAVY_COMPONENT > 0) {
    add("Simplify template-heavy components: move logic to methods or extract sub-components.");
  }
  if (result.lifecycle.cleanupStats.likelyUnmanagedSubscriptions > 0) {
    add("Unmanaged subscriptions detected. Use takeUntilDestroyed or manual unsubscribe in ngOnDestroy.");
  }

  const highRiskPatterns = result.featurePatterns?.filter((p) => p.duplicationRisk === "high") ?? [];
  if (highRiskPatterns.length > 0) {
    add(
      `This project implements ${highRiskPatterns.length} feature pattern(s) with high duplication risk. Consider extracting shared modules.`
    );
    const playerPattern = highRiskPatterns.find((p) => p.patternType === "PLAYER_FEATURE_PATTERN");
    if (playerPattern && playerPattern.instanceCount >= 4) {
      add(
        `This project implements ${playerPattern.instanceCount} independent media player features with nearly identical architecture. A shared player module could reduce duplication.`
      );
    }
  }

  return recs;
}
