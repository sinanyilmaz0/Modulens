import type { ComponentRole } from "../../../diagnostic/diagnostic-models";
import type { DominantIssueType } from "../../../diagnostic/diagnostic-models";
import type { FeaturePatternType } from "./feature-pattern-models";

export interface FeaturePatternDefinition {
  patternType: FeaturePatternType;
  featureName: string;
  fileNamePatterns: RegExp[];
  requiredRole?: ComponentRole;
  /** Alternative to requiredRole: accept any of these roles */
  acceptedRoles?: ComponentRole[];
  requiredSignals: string[];
  templateSignals: {
    mediaElement?: boolean;
    formGroup?: boolean;
    ngForMin?: number;
    activatedRoute?: boolean;
  };
  responsibilitySignals?: {
    formGroupCountMin?: number;
    formBuilderUsage?: boolean;
    routerUsage?: boolean;
  };
  dominantIssueHints?: DominantIssueType[];
  minInstanceCount: number;
}

export const FEATURE_PATTERN_DEFINITIONS: FeaturePatternDefinition[] = [
  {
    patternType: "PLAYER_FEATURE_PATTERN",
    featureName: "Fragment Player Feature",
    fileNamePatterns: [/-fragment-player$/i, /-player$/i],
    requiredRole: "player",
    requiredSignals: ["video-audio-element", "media-player-service"],
    templateSignals: { mediaElement: true },
    dominantIssueHints: ["TEMPLATE_HEAVY_COMPONENT", "ORCHESTRATION_HEAVY_COMPONENT"],
    minInstanceCount: 2,
  },
  {
    patternType: "DETAIL_PAGE_PATTERN",
    featureName: "Detail Page Feature",
    fileNamePatterns: [/-detail$/i],
    acceptedRoles: ["detail", "page"],
    requiredSignals: ["activated-route"],
    templateSignals: { activatedRoute: true },
    responsibilitySignals: { routerUsage: true },
    minInstanceCount: 2,
  },
  {
    patternType: "CONTENT_PUBLISH_PATTERN",
    featureName: "Content Publish Feature",
    fileNamePatterns: [/-publish-container$/i, /-publish$/i],
    requiredRole: "form",
    requiredSignals: ["form-builder", "form-group-ngform"],
    templateSignals: { formGroup: true },
    responsibilitySignals: { formGroupCountMin: 1, formBuilderUsage: true },
    minInstanceCount: 2,
  },
  {
    patternType: "LIST_PAGE_PATTERN",
    featureName: "List Page Feature",
    fileNamePatterns: [/-list$/i],
    requiredRole: "list",
    requiredSignals: ["ngfor-list"],
    templateSignals: { ngForMin: 2 },
    minInstanceCount: 2,
  },
  {
    patternType: "FRAGMENT_MANAGEMENT_PATTERN",
    featureName: "Fragment Management Feature",
    fileNamePatterns: [/-manage-fragments$/i],
    requiredSignals: [], // Optional: mat-dialog-modal, modal-drawer-usage
    templateSignals: {},
    dominantIssueHints: ["TEMPLATE_HEAVY_COMPONENT"],
    minInstanceCount: 2,
  },
];
