import type { Formatter } from "./types";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import {
  getArchitectureSmellUserLabel,
  getFamilyNameUserLabel,
  getFeaturePatternUserLabel,
} from "../report/labels/internal-to-user-labels";

export class SummaryFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const result = snapshot.result;
    const lines: string[] = [];

    lines.push("Modulens - Summary");
    lines.push("=======================");
    lines.push(`Workspace: ${result.workspacePath}`);
    lines.push("");

    lines.push("Scores");
    lines.push("------");
    lines.push(`Overall: ${result.scores.overall}/10 | Risk: ${result.workspaceSummary.riskLevel}`);
    lines.push(`Component: ${result.scores.component.score} | Lifecycle: ${result.scores.lifecycle.score} | Template: ${result.scores.template.score} | Responsibility: ${result.scores.responsibility.score}`);
    lines.push("");

    lines.push("Overview");
    lines.push("--------");
    lines.push(`Projects: ${result.workspaceSummary.projectCount} | Components: ${result.workspaceSummary.componentCount}`);
    lines.push(
      `Components with dominant issue: ${result.diagnosticSummary.componentsWithDominantIssue}/${result.diagnosticSummary.totalComponents}`
    );
    lines.push("");

    if (result.diagnosticSummary.roleCounts) {
      lines.push("Architecture Roles");
      lines.push("------------------");
      const rc = result.diagnosticSummary.roleCounts;
      const roles = [
        "page",
        "container",
        "detail",
        "player",
        "form",
        "list",
        "viewer",
        "editor",
        "widget",
        "layout",
        "modal",
        "unknown",
      ] as const;
      for (const role of roles) {
        const count = rc[role] ?? 0;
        if (count > 0) {
          lines.push(`${role}: ${count}`);
        }
      }
      lines.push("");
    }

    if (result.refactorPlan) {
      const wf = result.refactorPlan.whatToFixFirst.slice(0, 3);
      const qw = result.refactorPlan.quickWins.slice(0, 3);
      if (wf.length > 0 || qw.length > 0) {
        lines.push("Refactor Planner");
        lines.push("---------------");
        if (wf.length > 0) {
          lines.push("What to Fix First:");
          wf.forEach((item, i) => {
            const label = item.filePath?.split(/[/\\]/).pop() ?? (getFamilyNameUserLabel(item.familyName) || "?");
            lines.push(`  ${i + 1}. ${label}`);
          });
        }
        if (qw.length > 0) {
          lines.push("Quick Wins:");
          qw.forEach((w) => {
            const label = w.filePath?.split(/[/\\]/).pop() ?? (getFamilyNameUserLabel(w.familyName) || "?");
            lines.push(`  - ${label}: ${w.shortDescription}`);
          });
        }
        lines.push("");
      }
    }

    const architectureSmells = result.architectureSmells ?? [];
    if (architectureSmells.length > 0) {
      lines.push("Architecture Smells");
      lines.push("------------------");
      architectureSmells.forEach((s) => {
        const compCount = s.affectedComponents.length;
        lines.push(`- ${getArchitectureSmellUserLabel(s.smellType)} (${s.severity}, ${compCount} components)`);
      });
      lines.push("");
    }

    const featurePatterns = result.featurePatterns ?? [];
    if (featurePatterns.length > 0) {
      const reusableCount = featurePatterns.filter((p) => p.duplicationRisk === "high").length;
      lines.push("Feature Patterns");
      lines.push("----------------");
      lines.push(`Detected: ${featurePatterns.length} | Reusable Opportunities: ${reusableCount}`);
      featurePatterns.forEach((p) => {
        lines.push(`- ${getFeaturePatternUserLabel(p.patternType)}: ${p.instanceCount} implementations`);
      });
      lines.push("");
    }

    if (result.extractionCandidates.length > 0) {
      lines.push("Extraction Candidates");
      lines.push("---------------------");
      result.extractionCandidates.forEach((f, i) => {
        lines.push(`${i + 1}. ${getFamilyNameUserLabel(f.familyName)}: ${f.members.length} components`);
      });
      lines.push("");
    }

    const decompositionTargets = (result.diagnosticSummary.componentDiagnostics ?? []).filter(
      (d) => d.decompositionSuggestion
    );
    if (decompositionTargets.length > 0) {
      lines.push("Architecture Decomposition");
      lines.push("-------------------------");
      lines.push(`components with decomposition suggestions: ${decompositionTargets.length}`);
      lines.push("");
      lines.push("top decomposition targets:");
      const topTargets = [...decompositionTargets]
        .sort(
          (a, b) =>
            (b.decompositionSuggestion?.confidence ?? 0) -
            (a.decompositionSuggestion?.confidence ?? 0)
        )
        .slice(0, 5);
      topTargets.forEach((d, i) => {
        const name = d.decompositionSuggestion?.originalComponent ?? d.className ?? d.fileName;
        lines.push(`  ${i + 1}. ${name}`);
      });
      lines.push("");
    }

    if (result.commonWarnings.length > 0) {
      lines.push("Top Warnings");
      lines.push("------------");
      result.commonWarnings.slice(0, 5).forEach((w) => {
        lines.push(`- ${w.code}: ${w.count}`);
      });
      lines.push("");
    }

    if (result.warningsAndRecommendations.length > 0) {
      lines.push("Recommendations");
      lines.push("--------------");
      result.warningsAndRecommendations.forEach((r) => {
        lines.push(`- ${r}`);
      });
    }

    lines.push("");
    lines.push("=======================");

    return lines.join("\n");
  }
}
