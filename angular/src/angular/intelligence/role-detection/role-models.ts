export type ComponentRole =
  | "page"
  | "container"
  | "detail"
  | "player"
  | "form"
  | "list"
  | "viewer"
  | "editor"
  | "widget"
  | "layout"
  | "modal"
  | "unknown";

export const ALL_COMPONENT_ROLES: ComponentRole[] = [
  "page",
  "container",
  "detail",
  "player",
  "form",
  "list",
  "viewer",
  "editor",
  "widget",
  "layout",
  "modal",
  "unknown",
];

import type { ConfidenceBreakdown } from "../../../confidence/confidence-models";

export interface ComponentRoleResult {
  componentRole: ComponentRole;
  roleConfidence: number;
  roleSignals: string[];
  roleConfidenceBreakdown?: ConfidenceBreakdown;
}
