const FAMILY_SUFFIXES = [
  "FragmentPlayer",
  "ContentFiles",
  "ManageFragments",
  "Detail",
  "Form",
];

const MAX_SEGMENTS = 3;

/**
 * Splits a PascalCase string into word segments.
 * Example: "PodcastEpisodePlayer" -> ["Podcast", "Episode", "Player"]
 */
function splitPascalCase(s: string): string[] {
  if (!s) return [];
  return s.split(/(?=[A-Z])/).filter(Boolean);
}

/**
 * Generates a natural Angular component name from a base component name and a role/section.
 * Implements: no repeated words, no redundant context, max 3 segments, Angular naming.
 *
 * @param baseName - Parent component name or prefix (e.g. "PodcastEpisodePlayer")
 * @param role - Section/role suffix (e.g. "PlayerView", "Controls", "Timeline")
 * @returns PascalCase component name with "Component" suffix
 */
export function generateComponentName(baseName: string, role: string): string {
  const baseWords = splitPascalCase(baseName.replace(/Component$/i, ""));
  const roleWords = splitPascalCase(role.replace(/Component$/i, ""));

  if (roleWords.length === 0) {
    const limited = baseWords.slice(-MAX_SEGMENTS);
    return limited.join("") + "Component";
  }

  // Deduplicate: remove role words that overlap with end of base
  let overlap = 0;
  for (let i = 0; i < Math.min(baseWords.length, roleWords.length); i++) {
    if (
      baseWords[baseWords.length - 1 - i].toLowerCase() ===
      roleWords[i].toLowerCase()
    ) {
      overlap++;
    } else {
      break;
    }
  }
  const dedupedRole = roleWords.slice(overlap);

  // Combine, remove consecutive duplicates, limit to 3 segments
  let combined = [...baseWords, ...dedupedRole];
  combined = combined.filter(
    (w, i) => combined[i - 1]?.toLowerCase() !== w.toLowerCase()
  );
  const limited = combined.slice(-MAX_SEGMENTS);

  return limited.join("") + "Component";
}

function kebabToPascal(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/**
 * Extracts a prefix from component class name for naming extracted components.
 * Removes "Component" suffix and optionally shortens by removing family suffixes
 * to avoid redundancy (e.g. PromotionalVideoFragmentPlayer -> PromotionalVideo).
 */
export function extractComponentPrefix(className: string): string {
  let base = className.replace(/Component$/i, "");
  if (base.includes("-")) {
    base = kebabToPascal(base);
  }
  for (const suffix of FAMILY_SUFFIXES) {
    if (base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return base || className;
}

/**
 * Converts generic suffix to component name with prefix.
 * Example: PlayerView + PromotionalVideoFragmentPlayer -> PromotionalVideoFragmentPlayerViewComponent
 */
export function buildComponentName(
  prefix: string,
  genericSuffix: string
): string {
  const suffix = genericSuffix.endsWith("Component")
    ? genericSuffix
    : `${genericSuffix}Component`;
  return `${prefix}${suffix.replace("Component", "")}Component`;
}

/**
 * Converts generic suffix to service name with prefix.
 * Example: PlayerState + PromotionalVideoFragmentPlayer -> PromotionalVideoFragmentPlayerStateService
 */
export function buildServiceName(
  prefix: string,
  genericSuffix: string
): string {
  const suffix = genericSuffix.endsWith("Service")
    ? genericSuffix
    : `${genericSuffix}Service`;
  return `${prefix}${suffix.replace("Service", "")}Service`;
}
