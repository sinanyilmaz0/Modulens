import type { HeuristicExtraction } from "./decomposition-models";

export const TEMPLATE_HEAVY_COMPONENTS = [
  "HeaderComponent",
  "ListComponent",
  "MetadataComponent",
  "ControlsComponent",
  "SidebarComponent",
];

export const MEDIA_PLAYER_COMPONENTS = [
  "PlayerViewComponent",
  "PlayerControlsComponent",
  "TimelineComponent",
];

export const MEDIA_PLAYER_SERVICES = ["PlayerStateService"];

export const FORM_COMPONENTS = [
  "FormViewComponent",
  "FormFieldsComponent",
];

export const FORM_SERVICES = ["FormStateService"];

export const ORCHESTRATION_COMPONENTS = ["ContainerComponent"];

export const ORCHESTRATION_SERVICES = ["DataService", "StateService"];

export const HEURISTIC_EXTRACTIONS: Record<string, HeuristicExtraction> = {
  template_heavy: {
    type: "template_heavy",
    componentSuffixes: TEMPLATE_HEAVY_COMPONENTS.map((t) =>
      t.replace("Component", "")
    ),
    serviceSuffixes: [],
    architectureName: "Template Decomposition Architecture",
  },
  media_player: {
    type: "media_player",
    componentSuffixes: MEDIA_PLAYER_COMPONENTS.map((t) =>
      t.replace("Component", "")
    ),
    serviceSuffixes: MEDIA_PLAYER_SERVICES.map((s) => s.replace("Service", "")),
    architectureName: "Player Page Architecture",
  },
  form: {
    type: "form",
    componentSuffixes: FORM_COMPONENTS.map((t) => t.replace("Component", "")),
    serviceSuffixes: FORM_SERVICES.map((s) => s.replace("Service", "")),
    architectureName: "Form Architecture",
  },
  orchestration: {
    type: "orchestration",
    componentSuffixes: ORCHESTRATION_COMPONENTS.map((t) =>
      t.replace("Component", "")
    ),
    serviceSuffixes: ORCHESTRATION_SERVICES.map((s) => s.replace("Service", "")),
    architectureName: "Container Architecture",
  },
};
