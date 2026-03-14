import type { BreakdownMode } from "../../core/scan-result";
import type { Translations } from "./i18n/translations";
import { formatTemplate } from "./format-template";

export interface BreakdownNouns {
  mode: BreakdownMode | "cluster";
  /** Singular noun used in sentences, e.g. "project", "feature area" */
  singular: string;
  /** Plural noun used in helper text, e.g. "projects", "feature areas" */
  plural: string;
}

export function getBreakdownNouns(
  breakdownMode: BreakdownMode | undefined
): BreakdownNouns {
  switch (breakdownMode) {
    case "project":
      return { mode: "project", singular: "project", plural: "projects" };
    case "feature-area":
      return { mode: "feature-area", singular: "feature area", plural: "feature areas" };
    case "source-root":
      return { mode: "source-root", singular: "source root", plural: "source roots" };
    case "package":
      return { mode: "package", singular: "package", plural: "packages" };
    default:
      return { mode: "cluster", singular: "cluster", plural: "clusters" };
  }
}

export function formatWorstBucketFinding(
  label: string,
  density: string,
  breakdownMode: BreakdownMode | undefined,
  t: Translations
): string {
  const nouns = getBreakdownNouns(breakdownMode);
  if (nouns.mode === "project") {
    return formatTemplate(
      t.overview.keyFindingWorstProject,
      { project: label },
      {
        fallback: "Warning density is distributed across multiple projects",
        context: "overview.keyFindingWorstProject",
      }
    );
  }

  const base = "{area} " + nouns.singular + " carries the highest warning density";
  return base.replace("{area}", label).replace("{density}", density);
}

