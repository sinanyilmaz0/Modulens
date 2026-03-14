import type {
  ResponsibilityAnalysisContext,
  ResponsibilityConfidence,
  ResponsibilitySeverity,
  ResponsibilityWarning,
} from "./responsibility-models";

interface ResponsibilityRule {
  code: string;
  evaluate: (context: ResponsibilityAnalysisContext) => ResponsibilityWarning | undefined;
}

const GOD_COMPONENT_METHOD_THRESHOLD = 15;
const GOD_COMPONENT_METHOD_HIGH = 25;
const GOD_COMPONENT_PROPERTY_THRESHOLD = 12;
const GOD_COMPONENT_PROPERTY_HIGH = 20;
const GOD_COMPONENT_IO_THRESHOLD = 8;
const GOD_COMPONENT_IO_HIGH = 12;
const GOD_COMPONENT_LINE_THRESHOLD = 400;

const HEAVY_FORM_PATCH_THRESHOLD = 5;
const HEAVY_FORM_PATCH_HIGH = 10;
const HEAVY_FORM_GROUP_THRESHOLD = 2;

const EXCESSIVE_LOCAL_STATE_THRESHOLD = 5;

const TOO_MANY_PUBLIC_HANDLERS_THRESHOLD = 8;
const TOO_MANY_PUBLIC_HANDLERS_HIGH = 12;

const MIXED_ORCHESTRATION_SOURCES = 3;

const UI_STATE_HEAVY_THRESHOLD = 3;
const UI_STATE_METHOD_THRESHOLD = 10;

const responsibilityRules: ResponsibilityRule[] = [
  {
    code: "GOD_COMPONENT_SMELL",
    evaluate: (context) => {
      const { metrics, lineCount } = context;
      const totalComplexity =
        metrics.methodCount + metrics.propertyCount + metrics.inputCount + metrics.outputCount;
      const lineCountOk = (lineCount ?? 0) >= GOD_COMPONENT_LINE_THRESHOLD;

      if (!lineCountOk && totalComplexity < 30) {
        return undefined;
      }

      const methodHeavy =
        metrics.methodCount >= GOD_COMPONENT_METHOD_HIGH ||
        metrics.propertyCount >= GOD_COMPONENT_PROPERTY_HIGH ||
        metrics.inputCount + metrics.outputCount >= GOD_COMPONENT_IO_HIGH;

      const methodWarning =
        metrics.methodCount >= GOD_COMPONENT_METHOD_THRESHOLD ||
        metrics.propertyCount >= GOD_COMPONENT_PROPERTY_THRESHOLD ||
        metrics.inputCount + metrics.outputCount >= GOD_COMPONENT_IO_THRESHOLD;

      if (!methodWarning && !methodHeavy) {
        return undefined;
      }

      const severity: ResponsibilitySeverity = methodHeavy ? "high" : "warning";
      const confidence: ResponsibilityConfidence = "medium";

      return {
        code: "GOD_COMPONENT_SMELL",
        severity,
        confidence,
        message: `Component has high responsibility density: ${metrics.methodCount} methods, ${metrics.propertyCount} properties, ${metrics.inputCount} inputs, ${metrics.outputCount} outputs${lineCount ? `, ${lineCount} lines` : ""}.`,
        recommendation:
          "Split into smaller focused components. Extract presentation, orchestration, or form logic into dedicated child components or services.",
      };
    },
  },
  {
    code: "HEAVY_FORM_ORCHESTRATION",
    evaluate: (context) => {
      const { metrics } = context;
      const formIntensity = metrics.formGroupCount + metrics.formPatchSetUpdateCount;

      if (metrics.formGroupCount < HEAVY_FORM_GROUP_THRESHOLD && formIntensity < HEAVY_FORM_PATCH_THRESHOLD) {
        return undefined;
      }

      const severity: ResponsibilitySeverity =
        formIntensity >= HEAVY_FORM_PATCH_HIGH ? "high" : "warning";
      const confidence: ResponsibilityConfidence = "medium";

      return {
        code: "HEAVY_FORM_ORCHESTRATION",
        severity,
        confidence,
        message: `Heavy form orchestration: ${metrics.formGroupCount} FormGroup(s), ${metrics.formPatchSetUpdateCount} patch/set/update call(s).`,
        recommendation:
          "Extract form logic into a dedicated form service or child component. Consider reactive forms with FormBuilder in a separate layer.",
      };
    },
  },
  {
    code: "EXCESSIVE_LOCAL_STATE",
    evaluate: (context) => {
      if (context.metrics.uiStateFieldCount < EXCESSIVE_LOCAL_STATE_THRESHOLD) {
        return undefined;
      }

      return {
        code: "EXCESSIVE_LOCAL_STATE",
        severity: "warning",
        confidence: "medium",
        message: `Excessive local UI state: ${context.metrics.uiStateFieldCount} state-like fields (selected, isLoading, open, etc.).`,
        recommendation:
          "Consolidate UI state into a single state object or move to a dedicated state service. Consider signals for reactive state.",
      };
    },
  },
  {
    code: "TOO_MANY_PUBLIC_HANDLERS",
    evaluate: (context) => {
      const count = context.metrics.publicMethodCount;

      if (count < TOO_MANY_PUBLIC_HANDLERS_THRESHOLD) {
        return undefined;
      }

      const severity: ResponsibilitySeverity =
        count >= TOO_MANY_PUBLIC_HANDLERS_HIGH ? "high" : "warning";
      const confidence: ResponsibilityConfidence = "medium";

      return {
        code: "TOO_MANY_PUBLIC_HANDLERS",
        severity,
        confidence,
        message: `Too many public methods (${count}) exposed to template or external callers.`,
        recommendation:
          "Delegate to services, extract event handlers into child components, or group related handlers.",
      };
    },
  },
  {
    code: "MIXED_PRESENTATION_AND_ORCHESTRATION",
    evaluate: (context) => {
      const { metrics } = context;
      const sources: string[] = [];

      if (metrics.formGroupCount > 0 || metrics.formBuilderUsage) sources.push("form");
      if (metrics.routerUsage) sources.push("router");
      if (metrics.matDialogUsage || metrics.modalOrDrawerUsage) sources.push("dialog/modal");
      if (metrics.serviceOrchestrationCount >= 3) sources.push("service orchestration");

      if (sources.length < MIXED_ORCHESTRATION_SOURCES) {
        return undefined;
      }

      return {
        code: "MIXED_PRESENTATION_AND_ORCHESTRATION",
        severity: "warning",
        confidence: "medium",
        message: `Component mixes presentation with orchestration: ${sources.join(", ")}.`,
        recommendation:
          "Split into a thin container component (orchestration) and presentation components. Use smart/dumb component pattern.",
      };
    },
  },
  {
    code: "NAVIGATION_AND_DATA_LOADING_COUPLED",
    evaluate: (context) => {
      if (!context.metrics.routerUsage || !context.lifecycleSignals) {
        return undefined;
      }

      const hasSubscribe = context.lifecycleSignals.subscribeCount > 0;
      const hasHttpLike = context.lifecycleSignals.httpLikeSubscribeCount > 0;

      if (!hasSubscribe && !hasHttpLike) {
        return undefined;
      }

      return {
        code: "NAVIGATION_AND_DATA_LOADING_COUPLED",
        severity: "info",
        confidence: "low",
        message:
          "Router usage combined with subscription/data loading. Navigation and data fetching may be tightly coupled.",
        recommendation:
          "Consider resolving data in route guards or a dedicated resolver. Decouple navigation from data loading.",
      };
    },
  },
  {
    code: "UI_STATE_HEAVY_COMPONENT",
    evaluate: (context) => {
      const { metrics } = context;

      if (
        metrics.uiStateFieldCount < UI_STATE_HEAVY_THRESHOLD ||
        metrics.methodCount < UI_STATE_METHOD_THRESHOLD
      ) {
        return undefined;
      }

      return {
        code: "UI_STATE_HEAVY_COMPONENT",
        severity: "info",
        confidence: "medium",
        message: `Many UI state fields (${metrics.uiStateFieldCount}) with high method count (${metrics.methodCount}).`,
        recommendation:
          "Extract UI state management. Consider a dedicated state slice or ViewModel pattern.",
      };
    },
  },
];

export function evaluateResponsibilityRules(
  context: ResponsibilityAnalysisContext
): ResponsibilityWarning[] {
  const warnings: ResponsibilityWarning[] = [];

  for (const rule of responsibilityRules) {
    const warning = rule.evaluate(context);

    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}
