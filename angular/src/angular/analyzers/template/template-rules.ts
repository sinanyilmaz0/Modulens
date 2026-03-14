import {
  TemplateAnalysisContext,
  TemplateConfidence,
  TemplateSeverity,
  TemplateWarning,
} from "./template-models";

interface TemplateRule {
  code: string;
  evaluate: (context: TemplateAnalysisContext) => TemplateWarning | undefined;
}

const LARGE_TEMPLATE_LINE_THRESHOLD = 150;
const BINDING_DENSITY_THRESHOLD = 2;
const STRUCTURAL_DEPTH_THRESHOLD = 4;
const EVENT_BINDING_HEAVY_THRESHOLD = 8;

const templateRules: TemplateRule[] = [
  {
    code: "LARGE_TEMPLATE",
    evaluate: (context) => {
      if (!context.hasTemplate || context.metrics.lineCount <= LARGE_TEMPLATE_LINE_THRESHOLD) {
        return undefined;
      }
      const severity: TemplateSeverity =
        context.metrics.lineCount >= 250 ? "high" : "warning";
      return {
        code: "LARGE_TEMPLATE",
        severity,
        confidence: "high" as TemplateConfidence,
        message: `Template is very large (${context.metrics.lineCount} lines).`,
        recommendation:
          "Consider splitting into smaller child components or using ng-template for reusable blocks.",
      };
    },
  },
  {
    code: "TEMPLATE_METHOD_CALL",
    evaluate: (context) => {
      if (!context.hasTemplate || context.metrics.methodCallCount === 0) {
        return undefined;
      }
      return {
        code: "TEMPLATE_METHOD_CALL",
        severity: "warning",
        confidence: "medium",
        message: `Method call(s) in template detected (${context.metrics.methodCallCount}).`,
        recommendation:
          "Move to component property or use a pipe to avoid repeated execution on change detection.",
      };
    },
  },
  {
    code: "HIGH_TEMPLATE_BINDING_DENSITY",
    evaluate: (context) => {
      if (!context.hasTemplate || context.metrics.lineCount === 0) {
        return undefined;
      }
      const totalBindings =
        context.metrics.interpolationCount +
        context.metrics.propertyBindingCount +
        context.metrics.eventBindingCount;
      const density = totalBindings / context.metrics.lineCount;
      if (density <= BINDING_DENSITY_THRESHOLD) {
        return undefined;
      }
      return {
        code: "HIGH_TEMPLATE_BINDING_DENSITY",
        severity: "info",
        confidence: "medium",
        message: `High binding density (${density.toFixed(1)} bindings per line).`,
        recommendation:
          "Consider extracting sub-templates or reducing bindings to improve maintainability.",
      };
    },
  },
  {
    code: "DEEP_STRUCTURAL_NESTING",
    evaluate: (context) => {
      if (!context.hasTemplate || context.metrics.structuralDepth < STRUCTURAL_DEPTH_THRESHOLD) {
        return undefined;
      }
      return {
        code: "DEEP_STRUCTURAL_NESTING",
        severity: "warning",
        confidence: "medium",
        message: `Deep structural directive nesting (depth: ${context.metrics.structuralDepth}).`,
        recommendation:
          "Flatten structure with ng-container or extract nested blocks into child components.",
      };
    },
  },
  {
    code: "NGFOR_WITHOUT_TRACKBY",
    evaluate: (context) => {
      if (
        !context.hasTemplate ||
        context.metrics.ngForCount === 0 ||
        context.metrics.trackByCount > 0
      ) {
        return undefined;
      }
      return {
        code: "NGFOR_WITHOUT_TRACKBY",
        severity: "warning",
        confidence: "high",
        message: `*ngFor without trackBy (${context.metrics.ngForCount} occurrence(s)).`,
        recommendation:
          "Add trackBy function for list performance and stable DOM identity.",
      };
    },
  },
  {
    code: "LONG_INLINE_TEMPLATE_EXPRESSION",
    evaluate: (context) => {
      if (!context.hasTemplate || context.metrics.longExpressionCount === 0) {
        return undefined;
      }
      return {
        code: "LONG_INLINE_TEMPLATE_EXPRESSION",
        severity: "info",
        confidence: "medium",
        message: `Long inline expression(s) detected (${context.metrics.longExpressionCount}).`,
        recommendation:
          "Extract complex expressions to component properties or pipes for readability.",
      };
    },
  },
  {
    code: "EVENT_BINDING_HEAVY_TEMPLATE",
    evaluate: (context) => {
      if (
        !context.hasTemplate ||
        context.metrics.eventBindingCount <= EVENT_BINDING_HEAVY_THRESHOLD
      ) {
        return undefined;
      }
      return {
        code: "EVENT_BINDING_HEAVY_TEMPLATE",
        severity: "warning",
        confidence: "medium",
        message: `Many event bindings (${context.metrics.eventBindingCount}).`,
        recommendation:
          "Consider event delegation or consolidating handlers to reduce template complexity.",
      };
    },
  },
];

export function evaluateTemplateRules(
  context: TemplateAnalysisContext
): TemplateWarning[] {
  const warnings: TemplateWarning[] = [];

  for (const rule of templateRules) {
    const warning = rule.evaluate(context);

    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}
