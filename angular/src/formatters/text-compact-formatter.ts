import type { Formatter } from "./types";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import {
  getDominantIssueUserLabel,
  getFamilyNameUserLabel,
  getFeaturePatternUserLabel,
} from "../report/labels/internal-to-user-labels";
import {
  formatLifecycleWarning,
  formatTemplateWarning,
  formatResponsibilityWarning,
  MAX_WARNINGS_PER_RISK,
} from "./format-helpers";

const COMPACT_TOP_RISKS = 5;
const COMPACT_TOP_PROBLEMATIC = 5;
const COMPACT_TOP_FAMILIES = 5;
const COMPACT_TOP_PER_ANALYZER = 3;

export class TextCompactFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const result = snapshot.result;
    const lines: string[] = [];

    lines.push("Modulens (compact)");
    lines.push("----------------------");
    lines.push(`Workspace: ${result.workspacePath}`);
    lines.push("");

    lines.push("Health Score");
    lines.push(`- Overall: ${result.scores.overall}/10 | Component: ${result.scores.component.score} | Lifecycle: ${result.scores.lifecycle.score} | Template: ${result.scores.template.score} | Responsibility: ${result.scores.responsibility.score}`);
    lines.push(`- Risk Level: ${result.workspaceSummary.riskLevel}`);
    lines.push("");

    lines.push("Diagnostic Summary");
    lines.push("------------------");
    lines.push(
      `Components with dominant issue: ${result.diagnosticSummary.componentsWithDominantIssue} / ${result.diagnosticSummary.totalComponents}`
    );
    const dc = result.diagnosticSummary.dominantIssueCounts;
    const dcParts: string[] = [];
    if (dc.TEMPLATE_HEAVY_COMPONENT > 0) dcParts.push(`${getDominantIssueUserLabel("TEMPLATE_HEAVY_COMPONENT")}: ${dc.TEMPLATE_HEAVY_COMPONENT}`);
    if (dc.GOD_COMPONENT > 0) dcParts.push(`${getDominantIssueUserLabel("GOD_COMPONENT")}: ${dc.GOD_COMPONENT}`);
    if (dc.CLEANUP_RISK_COMPONENT > 0) dcParts.push(`${getDominantIssueUserLabel("CLEANUP_RISK_COMPONENT")}: ${dc.CLEANUP_RISK_COMPONENT}`);
    if (dc.ORCHESTRATION_HEAVY_COMPONENT > 0) dcParts.push(`${getDominantIssueUserLabel("ORCHESTRATION_HEAVY_COMPONENT")}: ${dc.ORCHESTRATION_HEAVY_COMPONENT}`);
    if (dc.LIFECYCLE_RISKY_COMPONENT > 0) dcParts.push(`${getDominantIssueUserLabel("LIFECYCLE_RISKY_COMPONENT")}: ${dc.LIFECYCLE_RISKY_COMPONENT}`);
    if (dcParts.length > 0) lines.push(`- ${dcParts.join(" | ")}`);
    lines.push("");

    if (result.refactorPlan) {
      lines.push("Refactor Planner");
      lines.push("---------------");
      const wf = result.refactorPlan.whatToFixFirst.slice(0, 3);
      if (wf.length > 0) {
        wf.forEach((item, i) => {
          const label = item.filePath?.split(/[/\\]/).pop() ?? (getFamilyNameUserLabel(item.familyName) || "?");
          lines.push(`  ${i + 1}. ${label} (impact: ${item.impact}, effort: ${item.effort})`);
        });
      }
      const qw = result.refactorPlan.quickWins.slice(0, 3);
      if (qw.length > 0) {
        lines.push("  Quick wins: " + qw.map((w) => w.filePath?.split(/[/\\]/).pop() ?? (getFamilyNameUserLabel(w.familyName) || "?")).join(", "));
      }
      const strategies = result.refactorPlan.familyRefactorStrategies.slice(0, 3);
      if (strategies.length > 0) {
        lines.push("  Family strategies: " + strategies.map((s) => `${getFamilyNameUserLabel(s.familyName)} (${s.memberCount})`).join(", "));
      }
      lines.push("");
    }

    const featurePatterns = result.featurePatterns ?? [];
    if (featurePatterns.length > 0) {
      const reusableCount = featurePatterns.filter((p) => p.duplicationRisk === "high").length;
      lines.push("Feature Patterns");
      lines.push("----------------");
      lines.push(`Detected: ${featurePatterns.length} | Reusable Opportunities: ${reusableCount}`);
      featurePatterns.slice(0, 5).forEach((p) => {
        lines.push(`- ${getFeaturePatternUserLabel(p.patternType)}: ${p.instanceCount} implementations`);
      });
      lines.push("");
    }

    const architectureHotspots = (result.architectureHotspots ?? []).slice(0, COMPACT_TOP_FAMILIES);
    if (architectureHotspots.length > 0) {
      lines.push("Architecture Hotspots");
      lines.push("--------------------");
      architectureHotspots.forEach((h, i) => {
        const score = h.normalizedImpactScore ?? h.impactScore;
        const band = h.impactBand ?? "";
        const bandStr = band ? ` (${band})` : "";
        const firstReason = h.hotspotReasons?.[0];
        const whyStr = firstReason ? ` - ${firstReason}` : "";
        const roiStr =
          h.estimatedComponentsAffected != null || h.estimatedIssueCoveragePercent != null
            ? ` - ~${h.estimatedComponentsAffected ?? h.componentCount} components, ~${h.estimatedIssueCoveragePercent ?? 0}% of warnings`
            : "";
        lines.push(`${i + 1}. ${getFamilyNameUserLabel(h.familyName)}: Impact ${score}${bandStr}${whyStr}${roiStr}`);
      });
      lines.push("");
    }

    const extractionFamilyNames = new Set(
      result.extractionCandidates.map((f) => f.familyName)
    );
    const familiesExcludingExtraction = result.similarComponentFamilies
      .filter((f) => !extractionFamilyNames.has(f.familyName))
      .slice(0, COMPACT_TOP_FAMILIES);
    const hotspotsExcludingExtraction = result.repeatedArchitectureHotspots.filter(
      (f) => !extractionFamilyNames.has(f.familyName)
    );

    const topRisks = result.diagnosticSummary.topCrossCuttingRisks.slice(0, COMPACT_TOP_RISKS);
    if (topRisks.length > 0) {
      lines.push("Top Cross-Cutting Risks");
      lines.push("----------------------");
      topRisks.forEach((d, i) => {
        lines.push(
          `${i + 1}. ${d.fileName} (${d.className ?? d.fileName}) - ${d.diagnosticLabel}`
        );
        lines.push(`   Refactor: ${d.refactorDirection}`);
      });
      lines.push("");
    }

    if (familiesExcludingExtraction.length > 0) {
      lines.push("Similar Component Families");
      lines.push("-------------------------");
      familiesExcludingExtraction.forEach((f, i) => {
        lines.push(
          `${i + 1}. ${getFamilyNameUserLabel(f.familyName)} (${f.members.length} components) - ${f.refactorDirection}`
        );
      });
      lines.push("");
    }

    if (hotspotsExcludingExtraction.length > 0) {
      lines.push("Repeated Architecture Hotspots");
      lines.push("------------------------------");
      hotspotsExcludingExtraction.forEach((f) => {
        const shareCount = f.members.filter(
          (m) => m.dominantIssue === f.commonDominantIssue
        ).length;
        lines.push(
          `- ${getFamilyNameUserLabel(f.familyName)}: ${shareCount}/${f.members.length} share ${getDominantIssueUserLabel(f.commonDominantIssue!)}`
        );
      });
      lines.push("");
    }

    if (result.extractionCandidates.length > 0) {
      lines.push("Extraction Candidates");
      lines.push("---------------------");
      result.extractionCandidates.forEach((f, i) => {
        const suggestion =
          f.familyName === "*-list"
            ? "Extract: list container + item component."
            : f.familyName === "*-detail"
              ? "Extract: detail layout + shared data loading."
              : f.familyName === "*-manage-fragments"
                ? "Extract: fragment management service."
                : "Extract shared logic into base class or service.";
        lines.push(
          `${i + 1}. ${getFamilyNameUserLabel(f.familyName)}: ${f.members.length} components, avg ${f.avgLineCount} lines. ${suggestion}`
        );
      });
      lines.push("");
    }

    const topProblematic = result.topProblematicComponents.slice(0, COMPACT_TOP_PROBLEMATIC);
    if (topProblematic.length > 0) {
      lines.push("Top Problematic Components");
      topProblematic.forEach((c, i) => {
        lines.push(
          `${i + 1}. ${c.fileName} - ${c.lineCount} lines - ${c.dependencyCount} deps - ${c.highestSeverity ?? "N/A"}`
        );
      });
      lines.push("");
    }

    lines.push("Analyzer Summary");
    lines.push("---------------");
    const ls = result.lifecycle.summary;
    const ts = result.template.summary;
    const rs = result.responsibility.summary;
    lines.push(`- Lifecycle: ${ls.averageScore}/10 (${ls.riskLevel}) - ${ls.totalWarnings} warnings`);
    lines.push(`- Template: ${ts.averageScore}/10 (${ts.riskLevel}) - ${ts.totalWarnings} warnings`);
    lines.push(`- Responsibility: ${rs.averageScore}/10 (${rs.riskLevel}) - ${rs.totalWarnings} warnings`);
    lines.push("");

    if (result.commonWarnings.length > 0) {
      lines.push("Common Warnings");
      lines.push("--------------");
      result.commonWarnings.forEach((w) => {
        lines.push(`- ${w.code}: ${w.count}`);
      });
      lines.push("");
    }

    const topTemplate = result.template.topRisks.slice(0, COMPACT_TOP_PER_ANALYZER);
    if (topTemplate.length > 0) {
      lines.push("Top Template Risks");
      topTemplate.forEach((r, i) => {
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(`${i + 1}. ${r.fileName} - score ${r.score}/10`);
        if (actionable.length > 0) {
          actionable.slice(0, 1).forEach((w) => {
            lines.push(`   - ${formatTemplateWarning(w)}`);
          });
        }
      });
      lines.push("");
    }

    const topResp = result.responsibility.topRisks.slice(0, COMPACT_TOP_PER_ANALYZER);
    if (topResp.length > 0) {
      lines.push("Top Responsibility Risks");
      topResp.forEach((r, i) => {
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(`${i + 1}. ${r.fileName} - score ${r.score}/10`);
        if (actionable.length > 0) {
          actionable.slice(0, 1).forEach((w) => {
            lines.push(`   - ${formatResponsibilityWarning(w)}`);
          });
        }
      });
      lines.push("");
    }

    const topLifecycle = result.lifecycle.topRisks.slice(0, COMPACT_TOP_PER_ANALYZER);
    if (topLifecycle.length > 0) {
      lines.push("Top Lifecycle Risks");
      topLifecycle.forEach((r, i) => {
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(`${i + 1}. ${r.fileName} - score ${r.score}/10`);
        if (actionable.length > 0) {
          actionable.slice(0, 1).forEach((w) => {
            lines.push(`   - ${formatLifecycleWarning(w)}`);
          });
        }
      });
      lines.push("");
    }

    lines.push("----------------");

    return lines.join("\n");
  }
}
