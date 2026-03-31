import type { Translations } from "../translations";

export const enNavAndConfidence: Pick<Translations, "nav" | "confidenceLabels" | "confidenceHelpText" | "confidenceTooltips"> = {
  nav: {
    overview: "Overview",
    components: "Components",
    patterns: "Patterns",
    rules: "Rules",
    structure: "Structure",
    refactorPlan: "Refactor Plan",
    groupAnalysis: "Analysis",
    groupReference: "Reference",
  },
  confidenceLabels: {
    high: "High confidence",
    medium: "Review recommended",
    low: "Derived from code signals",
    reviewNeeded: "Best-effort classification",
  },
  confidenceHelpText:
    "Confidence reflects how strongly the analysis supports this finding. Low confidence = limited signals; verify before acting.",
  confidenceTooltips: {
    high: "Strong structural signal; reliable for prioritization",
    medium: "Likely issue; verify before refactoring",
    low: "Weak indicator; inspect context first",
    reviewNeeded: "Very weak signal; verify context before acting",
  },
};
