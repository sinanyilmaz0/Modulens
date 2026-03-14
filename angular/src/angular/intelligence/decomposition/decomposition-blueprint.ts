/** Minimal shape for blueprint formatting - supports both suggestion types */
interface BlueprintSuggestion {
  originalComponent: string;
  extractedComponents: string[];
  extractedServices: string[];
}

/**
 * Formats a decomposition suggestion as a tree-style blueprint string.
 * Example:
 * PlayerPage
 *  ├ PlayerView
 *  ├ PlayerControls
 *  ├ FragmentTimeline
 *  └ PlayerStateService
 */
export function formatDecompositionBlueprint(
  suggestion: BlueprintSuggestion,
  rootName?: string
): string {
  const root = rootName ?? suggestion.originalComponent.replace("Component", "");
  const items = [
    ...suggestion.extractedComponents.map((c) =>
      c.replace("Component", "")
    ),
    ...suggestion.extractedServices.map((s) =>
      s.replace("Service", "")
    ),
  ];

  if (items.length === 0) {
    return root;
  }

  const lines: string[] = [root];
  for (let i = 0; i < items.length; i++) {
    const isLast = i === items.length - 1;
    const prefix = isLast ? " └ " : " ├ ";
    lines.push(`${prefix}${items[i]}`);
  }

  return lines.join("\n");
}
