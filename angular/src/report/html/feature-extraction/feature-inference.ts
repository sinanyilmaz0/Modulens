/**
 * Feature label inference from paths and class names.
 */

import {
  INFRASTRUCTURE_FOLDERS,
  NOISE_FOLDER_NAMES,
  PARENT_FEATURE_PATTERNS,
  FEATURE_NORMALIZE_ALIASES,
  AREA_DISPLAY_ALIASES,
} from "./feature-extraction-constants";

/**
 * Format raw area/project value for display in Patterns. Returns short user-friendly label.
 * Use everywhere "Most affected area" is shown for consistency.
 */
export function formatAreaLabelForDisplay(rawArea: string | null | undefined): string {
  if (!rawArea || rawArea === "—") return "—";
  const normalized = rawArea.replace(/\\/g, "/").toLowerCase().trim();
  if (!normalized) return "—";
  const alias = AREA_DISPLAY_ALIASES[normalized];
  if (alias) return alias;
  if (INFRASTRUCTURE_FOLDERS.has(normalized)) return "infrastructure";
  if (normalized.includes("/")) {
    const appsMatch = normalized.match(/(?:^|\/)apps?\/([^/]+)/i);
    if (appsMatch) {
      const name = (appsMatch[1] ?? "app").toLowerCase();
      return AREA_DISPLAY_ALIASES[name] ?? name.replace(/-/g, " ");
    }
    const libsMatch = normalized.match(/(?:^|\/)libs\/([^/]+)/i);
    if (libsMatch) {
      const name = (libsMatch[1] ?? "lib").toLowerCase();
      return AREA_DISPLAY_ALIASES[name] ?? name.replace(/-/g, " ");
    }
    const segments = normalized.split("/").filter((s) => s && !["src", "app", "lib", "dist", "projects"].includes(s.toLowerCase()));
    const candidate = segments[segments.length - 1] ?? segments[0];
    if (candidate && !candidate.includes(".") && candidate.length <= 20) {
      const lower = candidate.toLowerCase();
      return AREA_DISPLAY_ALIASES[lower] ?? FEATURE_NORMALIZE_ALIASES[lower] ?? candidate.replace(/-/g, " ");
    }
  }
  return rawArea.length <= 20 ? rawArea.replace(/-/g, " ") : rawArea.slice(0, 18).replace(/-/g, " ") + "…";
}

export function normalizeFeatureName(name: string): string {
  const lower = name.toLowerCase();
  return FEATURE_NORMALIZE_ALIASES[lower] ?? FEATURE_NORMALIZE_ALIASES[name] ?? name;
}

/**
 * Infer a feature label from a file path.
 * Priority: features? > pages? > modules? > app (excluding infrastructure).
 * Paths under shared/common/ui/etc. return "infrastructure".
 * app.component.ts never treated as feature.
 */
export function inferFeatureFromPath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] ?? "";

  if (fileName === "app.component.ts") {
    return null;
  }

  const libsMatch = normalized.match(/(?:^|\/)libs\/([^/]+)/i);
  if (libsMatch) {
    const name = libsMatch[1] ?? "";
    if (name && !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) return name;
  }

  const appsMatch = normalized.match(/(?:^|\/)apps\/([^/]+)/i);
  if (appsMatch) {
    const name = appsMatch[1] ?? "";
    if (name && !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) return name;
  }

  if (/\/(?:admin|admin-panel|adminpanel)(?:\/|$)/i.test(normalized)) return "admin";
  if (/\/(?:public|public-area|publicarea)(?:\/|$)/i.test(normalized)) return "public";

  const featurePatterns = [
    /(?:^|\/)features?\/([^/]+)/i,
    /(?:^|\/)pages?\/([^/]+)/i,
    /(?:^|\/)modules?\/([^/]+)/i,
    /(?:^|\/)views?\/([^/]+)/i,
    /(?:^|\/)containers?\/([^/]+)/i,
  ];

  for (const pattern of featurePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const name = match[1] ?? "";
      if (
        name &&
        !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase()) &&
        !NOISE_FOLDER_NAMES.has(name.toLowerCase())
      ) {
        return name;
      }
    }
  }

  const appMatch = normalized.match(/(?:^|\/)app\/([^/]+)/i);
  if (appMatch) {
    const name = appMatch[1];
    if (name) {
      if (INFRASTRUCTURE_FOLDERS.has(name.toLowerCase())) {
        return "infrastructure";
      }
      if (NOISE_FOLDER_NAMES.has(name.toLowerCase())) {
        return null;
      }
      return name;
    }
  }

  const componentIdx = segments.findIndex((s) => s.endsWith(".component.ts"));
  if (componentIdx > 0) {
    const parent = segments[componentIdx - 1];
    if (
      parent &&
      !parent.includes(".") &&
      !INFRASTRUCTURE_FOLDERS.has(parent.toLowerCase()) &&
      !NOISE_FOLDER_NAMES.has(parent.toLowerCase())
    ) {
      return parent;
    }
  }

  const parentFeature = inferParentFeatureFromPath(normalized);
  if (parentFeature) return parentFeature;

  return null;
}

/**
 * When direct inference returns null, scan path for features?/X, pages?/X, modules?/X
 * and return the deepest non-infrastructure X. Reduces "other" by assigning to parent feature.
 */
function inferParentFeatureFromPath(normalized: string): string | null {
  let best: { name: string; priority: number; index: number } | null = null;
  for (let p = 0; p < PARENT_FEATURE_PATTERNS.length; p++) {
    const pattern = new RegExp(PARENT_FEATURE_PATTERNS[p].source, "gi");
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(normalized)) !== null) {
      const name = m[1] ?? "";
      if (
        name &&
        !INFRASTRUCTURE_FOLDERS.has(name.toLowerCase()) &&
        !NOISE_FOLDER_NAMES.has(name.toLowerCase())
      ) {
        if (
          !best ||
          m.index > best.index ||
          (m.index === best.index && p < best.priority)
        ) {
          best = { name, priority: p, index: m.index };
        }
      }
    }
  }
  return best?.name ?? null;
}

/**
 * Infer feature from component class name (e.g. AdminDashboardComponent -> admin-dashboard).
 */
export function inferFeatureFromClassName(className: string): string | null {
  if (!className) return null;
  const base = className
    .replace(/Component$/, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return base || null;
}

