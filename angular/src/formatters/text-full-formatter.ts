import type { Formatter } from "./types";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";
import {
  getDominantIssueUserLabel,
  getArchitectureSmellUserLabel,
  getFamilyNameUserLabel,
  getFeaturePatternUserLabel,
} from "../report/labels/internal-to-user-labels";
import { LIFECYCLE_HOOKS } from "../angular/analyzers/lifecycle/lifecycle-models";
import {
  formatLifecycleWarning,
  formatTemplateWarning,
  formatResponsibilityWarning,
  MAX_WARNINGS_PER_RISK,
} from "./format-helpers";

export class TextFullFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const result = snapshot.result;
    const lines: string[] = [];

    lines.push("Modulens");
    lines.push("----------------");
    lines.push(`Workspace: ${result.workspacePath}`);
    lines.push("");

    lines.push("Health Score");
    lines.push(`- Overall: ${result.scores.overall}/10`);
    lines.push(`- Component Size: ${result.scores.component.score}/10`);
    lines.push(`- Lifecycle: ${result.scores.lifecycle.score}/10`);
    lines.push(`- Template: ${result.scores.template.score}/10`);
    lines.push(`- Responsibility: ${result.scores.responsibility.score}/10`);
    lines.push(`- Risk Level: ${result.workspaceSummary.riskLevel}`);
    lines.push("");

    lines.push("Diagnostic Summary");
    lines.push("------------------");
    lines.push(
      `Components with dominant issue: ${result.diagnosticSummary.componentsWithDominantIssue} / ${result.diagnosticSummary.totalComponents}`
    );
    const dc = result.diagnosticSummary.dominantIssueCounts;
    if (dc.TEMPLATE_HEAVY_COMPONENT > 0) lines.push(`- ${getDominantIssueUserLabel("TEMPLATE_HEAVY_COMPONENT")}: ${dc.TEMPLATE_HEAVY_COMPONENT}`);
    if (dc.GOD_COMPONENT > 0) lines.push(`- ${getDominantIssueUserLabel("GOD_COMPONENT")}: ${dc.GOD_COMPONENT}`);
    if (dc.CLEANUP_RISK_COMPONENT > 0) lines.push(`- ${getDominantIssueUserLabel("CLEANUP_RISK_COMPONENT")}: ${dc.CLEANUP_RISK_COMPONENT}`);
    if (dc.ORCHESTRATION_HEAVY_COMPONENT > 0) lines.push(`- ${getDominantIssueUserLabel("ORCHESTRATION_HEAVY_COMPONENT")}: ${dc.ORCHESTRATION_HEAVY_COMPONENT}`);
    if (dc.LIFECYCLE_RISKY_COMPONENT > 0) lines.push(`- ${getDominantIssueUserLabel("LIFECYCLE_RISKY_COMPONENT")}: ${dc.LIFECYCLE_RISKY_COMPONENT}`);
    lines.push("");

    if (result.refactorPlan) {
      const hasWhatToFixFirst = result.refactorPlan.whatToFixFirst.length > 0;
      const hasQuickWins = result.refactorPlan.quickWins.length > 0;
      const hasFamilyStrategies = result.refactorPlan.familyRefactorStrategies.length > 0;
      const hasDecompositionHints = result.refactorPlan.componentDecompositionHints.length > 0;
      const hasArchitecturePlan = (result.refactorPlan.architectureRefactorPlan ?? []).length > 0;
      const hasAnyRefactorContent =
        hasWhatToFixFirst ||
        hasQuickWins ||
        hasFamilyStrategies ||
        hasDecompositionHints ||
        hasArchitecturePlan;

      if (hasAnyRefactorContent) {
        lines.push("Refactor Planner");
        lines.push("---------------");
      }

      if (hasWhatToFixFirst) {
        lines.push("What to Fix First");
        result.refactorPlan.whatToFixFirst.forEach((item, i) => {
          const label = item.filePath
            ? item.filePath.split(/[/\\]/).pop() ?? item.filePath
            : item.familyName ?? "unknown";
          lines.push(
            `  ${i + 1}. ${label} - ${item.description.slice(0, 80)}${item.description.length > 80 ? "..." : ""} (impact: ${item.impact}, effort: ${item.effort}, ratio: ${item.effortImpactRatio.toFixed(1)})`
          );
        });
        lines.push("");
      }

      if (hasQuickWins) {
        lines.push("Quick Wins");
        result.refactorPlan.quickWins.forEach((w) => {
          const label = w.filePath
            ? w.filePath.split(/[/\\]/).pop() ?? w.filePath
            : w.familyName ?? "unknown";
          lines.push(`  - ${label}: ${w.shortDescription} (${w.reason})`);
        });
        lines.push("");
      }

      if (hasFamilyStrategies) {
        lines.push("Family Refactor Strategies");
        result.refactorPlan.familyRefactorStrategies.forEach((f) => {
          lines.push(`  ${getFamilyNameUserLabel(f.familyName)} (${f.memberCount} components):`);
          lines.push(`    Pattern: ${f.patternSummary}`);
          lines.push(`    Likely shared: ${f.likelySharedConcerns.join(", ")}`);
          lines.push(`    Suggested extraction: ${f.suggestedExtractionTargets.join(", ")}`);
          lines.push(`    Suggested structure: ${f.suggestedAngularStructure}`);
          lines.push(`    Steps: ${f.suggestedRefactorSteps.join("; ")}`);
          lines.push(`    Expected benefits: ${f.expectedBenefits.join(", ")}`);
          lines.push("");
        });
      }

      if (hasDecompositionHints) {
        lines.push("Suggested First Extractions");
        result.refactorPlan.componentDecompositionHints.forEach((h) => {
          const familyLabel = h.familyContext ? ` [${h.familyContext}]` : "";
          lines.push(`  - ${h.fileName} (${h.lineCount} lines)${familyLabel}: ${h.separableBlocks.join(", ")}`);
          lines.push(`    ${h.suggestedSplit} [${h.confidence} confidence]`);
          if (h.suggestedBlockDecomposition && h.suggestedBlockDecomposition.length > 0) {
            lines.push(`    Blocks: ${h.suggestedBlockDecomposition.join(", ")}`);
          }
          if (h.familySpecificHints && h.familySpecificHints.length > 0) {
            lines.push(`    Family hints: ${h.familySpecificHints.join("; ")}`);
          }
        });
        lines.push("");
      }

      if (hasArchitecturePlan) {
        lines.push("Architecture Refactor Plan");
        result.refactorPlan.architectureRefactorPlan!.forEach((item, i) => {
          const score = item.normalizedImpactScore ?? item.impactScore;
          const band = item.impactBand ? ` (${item.impactBand})` : "";
          lines.push(`  ${i + 1}. ${getFamilyNameUserLabel(item.familyName)} - Impact: ${score}${band} - Fixing removes ${item.percentageOfTotalIssues}% of issues`);
          if (item.whyFirst && item.whyFirst.length > 0) {
            lines.push("    Why first:");
            item.whyFirst.forEach((r) => lines.push(`    - ${r}`));
          }
        });
        lines.push("");
      }
    }

    const architectureSmells = result.architectureSmells ?? [];
    if (architectureSmells.length > 0) {
      lines.push("Top Architecture Smells");
      lines.push("----------------------");
      architectureSmells.forEach((s, i) => {
        lines.push(`${i + 1}. ${getArchitectureSmellUserLabel(s.smellType)} - ${s.severity} (${Math.round(s.confidence * 100)}% confidence)`);
        lines.push(`   Affects: ${s.affectedComponents.length} components`);
        if (s.relatedFamilies.length > 0) {
          lines.push(`   Families: ${s.relatedFamilies.join(", ")}`);
        }
        lines.push(`   Why: ${s.description}`);
        lines.push(`   Suggested architecture: ${s.suggestedArchitecture}`);
        if (s.suggestedRefactorActions.length > 0) {
          lines.push("   Refactor actions:");
          s.suggestedRefactorActions.forEach((a) => lines.push(`   - ${a}`));
        }
        if (s.affectedComponents.length > 0) {
          lines.push(`   Components: ${s.affectedComponents.slice(0, 5).join(", ")}${s.affectedComponents.length > 5 ? ` (+${s.affectedComponents.length - 5} more)` : ""}`);
        }
        lines.push("");
      });
      lines.push("");
    }

    const architectureHotspots = result.architectureHotspots ?? [];
    if (architectureHotspots.length > 0) {
      lines.push("Architecture Hotspots");
      lines.push("--------------------");
      architectureHotspots.forEach((h, i) => {
        const score = h.normalizedImpactScore ?? h.impactScore;
        const band = h.impactBand ? ` (${h.impactBand})` : "";
        lines.push(`${i + 1}. ${getFamilyNameUserLabel(h.familyName)} - Impact: ${score}${band}`);
        lines.push(`   Components: ${h.componentCount} · Avg size: ${h.avgLineCount} lines · Dominant: ${h.dominantIssue ? getDominantIssueUserLabel(h.dominantIssue) : "—"}`);
        if (h.hotspotReasons && h.hotspotReasons.length > 0) {
          lines.push("   Why this is a hotspot:");
          h.hotspotReasons.forEach((r) => lines.push(`   - ${r}`));
        }
        const compAffected = h.estimatedComponentsAffected ?? h.componentCount;
        const covPercent = h.estimatedIssueCoveragePercent ?? 0;
        const warnAffected = h.estimatedWarningsAffected;
        lines.push(`   Approx. ROI: ~${compAffected} components, ~${covPercent}% of warnings${warnAffected != null ? ` (~${warnAffected} warnings)` : ""} (heuristic estimate)`);
        if (h.suggestedRefactor.length > 0) {
          lines.push(`   Suggested: ${h.suggestedRefactor.slice(0, 2).join("; ")}`);
        }
        lines.push("");
      });
      lines.push("");
    }

    const featurePatterns = result.featurePatterns ?? [];
    if (featurePatterns.length > 0) {
      lines.push("Detected Feature Patterns");
      lines.push("-------------------------");
      featurePatterns.forEach((p) => {
        lines.push(`${getFeaturePatternUserLabel(p.patternType)} (${p.instanceCount} implementations)`);
        if (p.components.length > 0) {
          lines.push(`  - ${p.components.slice(0, 4).join(", ")}${p.components.length > 4 ? `, ...` : ""}`);
        }
        lines.push("");
      });
      lines.push("");
    }

    const extractionFamilyNames = new Set(
      result.extractionCandidates.map((f) => f.familyName)
    );
    const familiesExcludingExtraction = result.similarComponentFamilies.filter(
      (f) => !extractionFamilyNames.has(f.familyName)
    );
    const hotspotsExcludingExtraction = result.repeatedArchitectureHotspots.filter(
      (f) => !extractionFamilyNames.has(f.familyName)
    );

    if (result.diagnosticSummary.topCrossCuttingRisks.length > 0) {
      lines.push("Top Cross-Cutting Risks");
      lines.push("----------------------");
      result.diagnosticSummary.topCrossCuttingRisks.forEach((d, i) => {
        lines.push(
          `${i + 1}. ${d.fileName} (${d.className ?? d.fileName}) - ${d.diagnosticLabel}`
        );
        lines.push(`   ${d.filePath}`);
        lines.push(`   Refactor: ${d.refactorDirection}`);
        if (d.supportingIssues.length > 0) {
          lines.push(
            `   Supporting: ${d.supportingIssues.map((s) => getDominantIssueUserLabel(s)).join(", ")}`
          );
        }
        lines.push("");
      });
      lines.push("");
    }

    if (familiesExcludingExtraction.length > 0) {
      lines.push("Similar Component Families");
      lines.push("-------------------------");
      familiesExcludingExtraction.forEach((family, i) => {
        const totalLines = family.members.reduce((s, m) => s + m.lineCount, 0);
        const lineReduction = Math.round(totalLines * 0.3);
        lines.push(
          `${i + 1}. ${getFamilyNameUserLabel(family.familyName)} (${family.members.length} components)`
        );
        family.members.forEach((m) => {
          lines.push(`   - ${m.fileName}`);
        });
        if (family.commonDominantIssue) {
          lines.push(
            `   Common dominant issue: ${getDominantIssueUserLabel(family.commonDominantIssue)}`
          );
        }
        if (family.commonWarningPatterns.length > 0) {
          lines.push(
            `   Common warnings: ${family.commonWarningPatterns.slice(0, 5).join(", ")}${family.commonWarningPatterns.length > 5 ? "..." : ""}`
          );
        }
        lines.push(`   Refactor: ${family.refactorDirection}`);
        if (family.members.length >= 2 && totalLines > 200) {
          lines.push(
            `   Why: Repeated architecture; extraction could reduce ~${lineReduction} lines.`
          );
        }
        lines.push("");
      });
      lines.push("");
    }

    if (hotspotsExcludingExtraction.length > 0) {
      lines.push("Repeated Architecture Hotspots");
      lines.push("------------------------------");
      hotspotsExcludingExtraction.forEach((family) => {
        const shareCount = family.members.filter(
          (m) => m.dominantIssue === family.commonDominantIssue
        ).length;
        const lineMin = Math.min(...family.members.map((m) => m.lineCount));
        const lineMax = Math.max(...family.members.map((m) => m.lineCount));
        lines.push(
          `- ${getFamilyNameUserLabel(family.familyName)}: ${shareCount}/${family.members.length} components share ${getDominantIssueUserLabel(family.commonDominantIssue!)}; similar line counts (${lineMin}-${lineMax}).`
        );
        lines.push("  Likely copy-paste or repeated pattern.");
      });
      lines.push("");
    }

    if (result.extractionCandidates.length > 0) {
      lines.push("Extraction Candidates");
      lines.push("---------------------");
      result.extractionCandidates.forEach((family, i) => {
        const suggestion =
          family.familyName === "*-list"
            ? "Extract: list container + item component."
            : family.familyName === "*-detail"
              ? "Extract: detail layout + shared data loading."
              : family.familyName === "*-manage-fragments"
                ? "Extract: fragment management service."
                : "Extract shared logic into base class or service.";
        lines.push(
          `${i + 1}. ${getFamilyNameUserLabel(family.familyName)}: ${family.members.length} components, avg ${family.avgLineCount} lines. ${suggestion}`
        );
      });
      lines.push("");
    }

    const ls = result.lifecycle.summary;
    const ts = result.template.summary;
    const rs = result.responsibility.summary;

    lines.push("Summary");
    lines.push(`- Total projects: ${result.workspaceSummary.projectCount}`);
    lines.push(`- Total components: ${result.workspaceSummary.componentCount}`);
    const totalComponentsWithFindings = result.componentsBySeverity.warning + result.componentsBySeverity.high + result.componentsBySeverity.critical;
    if (totalComponentsWithFindings > 0) lines.push(`- Components with findings: ${totalComponentsWithFindings}`);
    lines.push(`- Total lifecycle targets: ${ls.totalTargets}`);
    if (ls.totalWarnings > 0) lines.push(`- Total lifecycle warnings: ${ls.totalWarnings}`);
    if (ts.totalWarnings > 0) lines.push(`- Total template warnings: ${ts.totalWarnings}`);
    if (rs.totalWarnings > 0) lines.push(`- Total responsibility warnings: ${rs.totalWarnings}`);
    if (result.componentsBySeverity.warning > 0) lines.push(`- Components (warning): ${result.componentsBySeverity.warning}`);
    if (result.componentsBySeverity.high > 0) lines.push(`- Components (high): ${result.componentsBySeverity.high}`);
    if (result.componentsBySeverity.critical > 0) lines.push(`- Components (critical): ${result.componentsBySeverity.critical}`);
    lines.push("");

    lines.push("Project Breakdown");
    for (const p of result.projectBreakdown) {
      lines.push(
        `- ${p.sourceRoot}: ${p.components} components, ${p.componentsWithFindings} with findings, ${p.lifecycleTargets} lifecycle targets, ${p.lifecycleFindings} lifecycle findings, ${p.templateFindings} template findings, ${p.responsibilityFindings} responsibility findings`
      );
    }
    lines.push("");

    if (result.topProblematicComponents.length > 0) {
      lines.push("Top Problematic Components");
      result.topProblematicComponents.forEach((c, i) => {
        lines.push(
          `${i + 1}. ${c.fileName} - ${c.lineCount} lines - ${c.dependencyCount} deps - ${c.highestSeverity ?? "N/A"}`
        );
        lines.push(`   ${c.filePath}`);
        if (c.issues.length > 0) {
          lines.push("   Issues:");
          c.issues.forEach((issue) => {
            lines.push(`   - ${issue.message} (${issue.severity})`);
          });
        }
        lines.push("");
      });
      lines.push("");
    }

    lines.push("Lifecycle Health");
    lines.push(`- Average lifecycle score: ${ls.averageScore}/10`);
    lines.push(`- Lifecycle risk level: ${ls.riskLevel}`);
    lines.push(`- Targets with warnings: ${ls.componentsWithWarnings}`);
    if (
      ls.severityCounts.info === 0 &&
      ls.severityCounts.warning === 0 &&
      ls.severityCounts.high === 0 &&
      ls.severityCounts.critical === 0
    ) {
      lines.push("- Severity: No findings.");
    } else {
      if (ls.severityCounts.info > 0) lines.push(`- Info: ${ls.severityCounts.info}`);
      if (ls.severityCounts.warning > 0) lines.push(`- Warning: ${ls.severityCounts.warning}`);
      if (ls.severityCounts.high > 0) lines.push(`- High: ${ls.severityCounts.high}`);
      if (ls.severityCounts.critical > 0) lines.push(`- Critical: ${ls.severityCounts.critical}`);
    }
    lines.push(`- Confidence high: ${ls.confidenceCounts.high}`);
    lines.push(`- Confidence medium: ${ls.confidenceCounts.medium}`);
    lines.push(`- Confidence low: ${ls.confidenceCounts.low}`);
    lines.push(`- Needs manual review: ${ls.manualReviewCount}`);
    lines.push(`- High-confidence findings: ${ls.highConfidenceWarningCount}`);
    lines.push("");

    lines.push("Template Health");
    lines.push(`- Average template score: ${ts.averageScore}/10`);
    lines.push(`- Template risk level: ${ts.riskLevel}`);
    lines.push(`- Components with template warnings: ${ts.componentsWithWarnings}`);
    if (
      ts.severityCounts.info === 0 &&
      ts.severityCounts.warning === 0 &&
      ts.severityCounts.high === 0 &&
      ts.severityCounts.critical === 0
    ) {
      lines.push("- Severity: No findings.");
    } else {
      if (ts.severityCounts.info > 0) lines.push(`- Info: ${ts.severityCounts.info}`);
      if (ts.severityCounts.warning > 0) lines.push(`- Warning: ${ts.severityCounts.warning}`);
      if (ts.severityCounts.high > 0) lines.push(`- High: ${ts.severityCounts.high}`);
      if (ts.severityCounts.critical > 0) lines.push(`- Critical: ${ts.severityCounts.critical}`);
    }
    lines.push(`- Components without template: ${ts.componentsWithoutTemplate}`);
    lines.push("");

    lines.push("Responsibility Health");
    lines.push(`- Average responsibility score: ${rs.averageScore}/10`);
    lines.push(`- Responsibility risk level: ${rs.riskLevel}`);
    lines.push(`- Components with responsibility warnings: ${rs.componentsWithWarnings}`);
    if (
      rs.severityCounts.info === 0 &&
      rs.severityCounts.warning === 0 &&
      rs.severityCounts.high === 0 &&
      rs.severityCounts.critical === 0
    ) {
      lines.push("- Severity: No findings.");
    } else {
      if (rs.severityCounts.info > 0) lines.push(`- Info: ${rs.severityCounts.info}`);
      if (rs.severityCounts.warning > 0) lines.push(`- Warning: ${rs.severityCounts.warning}`);
      if (rs.severityCounts.high > 0) lines.push(`- High: ${rs.severityCounts.high}`);
      if (rs.severityCounts.critical > 0) lines.push(`- Critical: ${rs.severityCounts.critical}`);
    }
    lines.push("");

    if (result.commonWarnings.length > 0) {
      lines.push("Common Warnings");
      lines.push("--------------");
      result.commonWarnings.forEach((w) => {
        lines.push(`- ${w.code}: ${w.count} occurrences`);
      });
      lines.push("");
    }

    if (result.template.topRisks.length > 0) {
      lines.push("Top Template Risks");
      result.template.topRisks.forEach((r, i) => {
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(
          `${i + 1}. ${r.fileName} (${r.className}) - score ${r.score}/10`
        );
        lines.push(`   ${r.filePath}`);
        if (actionable.length > 0) {
          const displayed = actionable.slice(0, MAX_WARNINGS_PER_RISK);
          lines.push("   Warnings:");
          displayed.forEach((w) => {
            lines.push(`   - ${formatTemplateWarning(w)}`);
            lines.push(`     Recommendation: ${w.recommendation}`);
          });
          if (actionable.length > displayed.length) {
            lines.push(`   ... +${actionable.length - displayed.length} more`);
          }
        } else {
          lines.push("   Warnings: none (score-driven risk).");
        }
        lines.push("");
      });
      lines.push("");
    }

    if (result.responsibility.topRisks.length > 0) {
      lines.push("Top Responsibility Risks");
      result.responsibility.topRisks.forEach((r, i) => {
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(
          `${i + 1}. ${r.fileName} (${r.className}) - score ${r.score}/10`
        );
        lines.push(`   ${r.filePath}`);
        if (actionable.length > 0) {
          const displayed = actionable.slice(0, MAX_WARNINGS_PER_RISK);
          lines.push("   Warnings:");
          displayed.forEach((w) => {
            lines.push(`   - ${formatResponsibilityWarning(w)}`);
            lines.push(`     Recommendation: ${w.recommendation}`);
          });
          if (actionable.length > displayed.length) {
            lines.push(`   ... +${actionable.length - displayed.length} more`);
          }
        } else {
          lines.push("   Warnings: none (score-driven risk).");
        }
        lines.push("");
      });
      lines.push("");
    }

    lines.push("Cleanup Pattern Analysis");
    lines.push(
      `- Verified cleanup targets: ${result.lifecycle.cleanupStats.verifiedCleanupTargets}/${result.lifecycle.cleanupStats.totalLifecycleTargets}`
    );
    lines.push(
      `- Likely long-lived subscriptions without cleanup (high confidence): ${result.lifecycle.cleanupStats.likelyUnmanagedSubscriptions}`
    );
    lines.push("");

    lines.push("Lifecycle Hook Usage");
    for (const hook of LIFECYCLE_HOOKS) {
      lines.push(`- ${hook}: ${ls.hookUsageCounts[hook]}`);
    }
    lines.push("");

    if (result.lifecycle.topRisks.length > 0) {
      lines.push("Top Lifecycle Risks");
      result.lifecycle.topRisks.forEach((r, i) => {
        const hooksText = r.hooksUsed.length > 0 ? r.hooksUsed.join(", ") : "none";
        const actionable = r.warnings.filter((w) => w.confidence !== "low");
        lines.push(
          `${i + 1}. ${r.fileName} (${r.className}) - ${r.targetType} - score ${r.score}/10 - hooks: ${r.hookCount}`
        );
        lines.push(`   ${r.filePath}`);
        lines.push(`   Hooks: ${hooksText}`);
        if (actionable.length > 0) {
          const displayed = actionable.slice(0, MAX_WARNINGS_PER_RISK);
          lines.push("   Actionable warnings:");
          displayed.forEach((w) => {
            lines.push(`   - ${formatLifecycleWarning(w)}`);
            lines.push(`     Recommendation: ${w.recommendation}`);
          });
          if (actionable.length > displayed.length) {
            lines.push(`   ... +${actionable.length - displayed.length} more`);
          }
        } else {
          lines.push("   Actionable warnings: none (score-driven risk).");
        }
        lines.push("");
      });
      lines.push("");
    }

    if (result.lifecycle.manualReview.length > 0) {
      lines.push("Needs Manual Review");
      result.lifecycle.manualReview.forEach((r, i) => {
        const reviewWarnings = r.warnings.filter((w) => w.confidence === "low");
        lines.push(
          `${i + 1}. ${r.fileName} (${r.className}) - score ${r.score}/10`
        );
        lines.push(`   ${r.filePath}`);
        reviewWarnings.forEach((w) => {
          lines.push(`   - ${formatLifecycleWarning(w)}`);
        });
        lines.push("");
      });
      lines.push("");
    }

    lines.push("");
    lines.push("----------------");

    return lines.join("\n");
  }
}
