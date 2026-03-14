import type { ScanResult } from "../core/scan-result";
import type { RefactorBlueprint } from "./refactor-plan-models";
import type { ArchitectureHotspot } from "./refactor-plan-models";
import type { ComponentDiagnostic } from "../diagnostic/diagnostic-models";
import type { RefactorTask } from "./refactor-task-models";
import { FAMILY_STRATEGY_TEMPLATES, TARGET_FAMILY_SUFFIXES } from "./family-strategy-templates";
import { DOMINANT_ISSUE_TO_LABEL } from "../diagnostic/diagnostic-clusters";

const MAX_COMPONENT_BLUEPRINTS = 8;
const MAX_FAMILY_BLUEPRINTS = 5;

/** Blueprint content for each family type when template exists */
const FAMILY_BLUEPRINT_CONTENT: Record<
  string,
  {
    proposedShape: string[];
    stateOwnership: string[];
    serviceBoundaries: string[];
    uiBoundaries: string[];
    migrationSteps: string[];
  }
> = {
  "*-detail": {
    proposedShape: [
      "EntityDetailContainerComponent",
      "EntityDetailLayoutComponent",
      "EntityDetailActionPanelComponent",
      "EntityDetailMetadataComponent",
      "BaseDetailService",
    ],
    stateOwnership: [
      "Container: route params, feature flags, parent context",
      "BaseDetailService: entity data, loading state, save state",
    ],
    serviceBoundaries: [
      "BaseDetailService: data loading, load/save logic, validation",
    ],
    uiBoundaries: [
      "Container: layout composition, routing",
      "LayoutComponent: header, action panel, metadata, content sections",
      "ActionPanelComponent: save/cancel, actions",
      "MetadataComponent: readonly metadata display",
    ],
    migrationSteps: [
      "extract readonly presentation blocks",
      "split action panel from metadata and content",
      "abstract data loading into BaseDetailService",
      "isolate load/save logic in service",
      "simplify container to thin composition layer",
    ],
  },
  "*-fragment-player": {
    proposedShape: [
      "FragmentPlayerContainerComponent",
      "FragmentPlayerControlsComponent",
      "FragmentPlayerTimelineComponent",
      "FragmentPlayerMetadataComponent",
      "FragmentPlayerStateService",
    ],
    stateOwnership: [
      "Container: route params, feature flags, parent context",
      "StateService: playback position, volume, playing state, timeline selection",
    ],
    serviceBoundaries: [
      "FragmentPlayerStateService: playback state, timeline position, media metadata",
    ],
    uiBoundaries: [
      "Container: layout, child composition, routing",
      "ControlsComponent: play/pause, volume, fullscreen",
      "TimelineComponent: seek bar, markers",
      "MetadataComponent: title, description, readonly metadata",
    ],
    migrationSteps: [
      "extract readonly presentation blocks",
      "move event-heavy controls",
      "isolate local player state",
      "move data loading into service",
      "simplify container responsibilities",
    ],
  },
  "*-content-files": {
    proposedShape: [
      "ContentFilesContainerComponent",
      "FileListComponent",
      "FileUploadComponent",
      "FileMetadataEditorComponent",
      "ContentFilesService",
    ],
    stateOwnership: [
      "Container: selection context, parent context",
      "ContentFilesService: file list, upload state, metadata",
    ],
    serviceBoundaries: [
      "ContentFilesService: file CRUD, selection, upload orchestration",
    ],
    uiBoundaries: [
      "Container: layout, child composition",
      "FileListComponent: file list, selection UI",
      "FileUploadComponent: upload UI, drop zone",
      "FileMetadataEditorComponent: metadata form",
    ],
    migrationSteps: [
      "split file list from upload UI",
      "extract metadata editor to separate component",
      "move file operations into ContentFilesService",
      "isolate selection state",
      "simplify container to composition only",
    ],
  },
  "*-manage-fragments": {
    proposedShape: [
      "ManageFragmentsContainerComponent",
      "FragmentListComponent",
      "FragmentEditorComponent",
      "FragmentModalComponent",
      "ManageFragmentsService",
    ],
    stateOwnership: [
      "Container: modal visibility, parent context",
      "ManageFragmentsService: fragment list, CRUD state, ordering",
    ],
    serviceBoundaries: [
      "ManageFragmentsService: fragment CRUD, ordering logic",
    ],
    uiBoundaries: [
      "Container: list/editor/modal composition",
      "FragmentListComponent: list, reorder UI",
      "FragmentEditorComponent: edit form",
      "FragmentModalComponent: modal shell",
    ],
    migrationSteps: [
      "split list from editor from modal",
      "extract fragment management to service",
      "decompose template blocks",
      "isolate ordering UI",
      "simplify container orchestration",
    ],
  },
  "*-form": {
    proposedShape: [
      "FormContainerComponent",
      "FormFieldsComponent",
      "FormValidationComponent",
      "BaseFormService",
    ],
    stateOwnership: [
      "Container: parent context, submit trigger",
      "BaseFormService: form state, validation state",
    ],
    serviceBoundaries: [
      "BaseFormService: form building, validation mapping",
    ],
    uiBoundaries: [
      "Container: thin wrapper, submit handler",
      "FormFieldsComponent: presentational form fields",
      "FormValidationComponent: validation display",
    ],
    migrationSteps: [
      "extract thin container",
      "extract form builder logic to BaseFormService",
      "separate validation mapping",
      "move form fields to presentational component",
      "simplify container to submit orchestration only",
    ],
  },
};

/** Generic migration steps by dominant issue when no family template */
const MIGRATION_BY_DOMINANT_ISSUE: Record<string, string[]> = {
  GOD_COMPONENT: [
    "extract readonly presentation blocks",
    "move event-heavy controls to child components",
    "isolate local state into dedicated service",
    "move data loading into service",
    "simplify container to composition only",
  ],
  TEMPLATE_HEAVY_COMPONENT: [
    "extract readonly presentation blocks",
    "move event-heavy controls",
    "split template by logical sections",
    "extract structural directives to child components",
    "simplify container template",
  ],
  ORCHESTRATION_HEAVY_COMPONENT: [
    "extract orchestration logic to service",
    "move data loading into service",
    "isolate UI state",
    "split container from presentation",
    "simplify container responsibilities",
  ],
  CLEANUP_RISK_COMPONENT: [
    "add takeUntilDestroyed or manual unsubscribe",
    "verify timer and listener cleanup",
    "consolidate subscription management",
  ],
  LIFECYCLE_RISKY_COMPONENT: [
    "review lifecycle hook usage",
    "extract complex init logic to service",
    "add proper cleanup",
  ],
};

const DEFAULT_MIGRATION_STEPS = [
  "extract readonly presentation blocks",
  "move event-heavy controls",
  "isolate local state",
  "move data loading into service",
  "simplify container responsibilities",
];

function getCurrentProblemForComponent(diagnostic: ComponentDiagnostic): string {
  const issueLabel = diagnostic.dominantIssue
    ? DOMINANT_ISSUE_TO_LABEL[diagnostic.dominantIssue] ?? diagnostic.dominantIssue
    : "Multiple concerns";
  return `${issueLabel}: ${diagnostic.refactorDirection}`;
}

function getCurrentProblemForFamily(
  familyName: string,
  dominantIssue: string | null,
  hotspotReasons?: string[]
): string {
  const template = FAMILY_STRATEGY_TEMPLATES[familyName];
  const patternPart = template?.patternSummary ?? "repeated architecture";
  const issuePart = dominantIssue
    ? DOMINANT_ISSUE_TO_LABEL[dominantIssue as keyof typeof DOMINANT_ISSUE_TO_LABEL] ?? dominantIssue
    : "god-component pattern";
  if (hotspotReasons && hotspotReasons.length > 0) {
    return `${patternPart}; ${hotspotReasons[0]}`;
  }
  return `${patternPart}; repeated ${issuePart}`;
}

function extractFamilyContextFromFileName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  const suffixes = ["detail", "fragment-player", "content-files", "manage-fragments", "form"];
  for (const suffix of suffixes) {
    if (lower.includes(suffix)) {
      return `*-${suffix}`;
    }
  }
  return null;
}

function buildComponentBlueprint(
  task: RefactorTask,
  diagnostic: ComponentDiagnostic | undefined,
  result: ScanResult
): RefactorBlueprint | null {
  const suggestion = diagnostic?.decompositionSuggestion;
  const fileName = task.filePath.split(/[/\\]/).pop() ?? "";
  const familyContext = extractFamilyContextFromFileName(fileName);
  const familyTemplate = familyContext ? FAMILY_STRATEGY_TEMPLATES[familyContext] : undefined;
  const familyBlueprint = familyContext ? FAMILY_BLUEPRINT_CONTENT[familyContext] : undefined;

  let proposedShape: string[];
  let stateOwnership: string[];
  let serviceBoundaries: string[];
  let uiBoundaries: string[];
  let migrationSteps: string[];

  if (suggestion && (suggestion.extractedComponents.length > 0 || suggestion.extractedServices.length > 0)) {
    const containerName = suggestion.originalComponent.endsWith("Component")
      ? suggestion.originalComponent
      : suggestion.originalComponent + "ContainerComponent";
    proposedShape = [containerName, ...suggestion.extractedComponents, ...suggestion.extractedServices];
    stateOwnership = [
      `Container: route params, parent context`,
      ...suggestion.extractedServices.map((s) => `${s}: state, data`),
    ];
    serviceBoundaries = suggestion.extractedServices.map(
      (s) => `${s}: extracted logic, state management`
    );
    uiBoundaries = [
      "Container: layout, child composition",
      ...suggestion.extractedComponents.map((c) => `${c}: extracted UI block`),
    ];
    migrationSteps =
      suggestion.extractedComponents.length > 0 || suggestion.extractedServices.length > 0
        ? [
            "extract readonly presentation blocks",
            "move event-heavy controls",
            ...suggestion.extractedServices.map((s) => `extract ${s}`),
            "simplify container responsibilities",
          ]
        : DEFAULT_MIGRATION_STEPS;
  } else if (familyBlueprint && familyTemplate) {
    proposedShape = familyBlueprint.proposedShape;
    stateOwnership = familyBlueprint.stateOwnership;
    serviceBoundaries = familyBlueprint.serviceBoundaries;
    uiBoundaries = familyBlueprint.uiBoundaries;
    migrationSteps = familyBlueprint.migrationSteps;
  } else {
    const steps =
      MIGRATION_BY_DOMINANT_ISSUE[task.dominantIssue] ?? DEFAULT_MIGRATION_STEPS;
    proposedShape = [
      `${task.componentName}ContainerComponent`,
      `${task.componentName}ViewComponent`,
      `${task.componentName}StateService`,
    ];
    stateOwnership = [
      "Container: route params, parent context",
      "StateService: local state, data",
    ];
    serviceBoundaries = ["StateService: state management, data loading"];
    uiBoundaries = ["Container: composition", "ViewComponent: presentation"];
    migrationSteps = steps;
  }

  const hint = result.refactorPlan?.componentDecompositionHints.find(
    (h) => h.filePath === task.filePath
  );
  if (hint?.suggestedBlockDecomposition && hint.suggestedBlockDecomposition.length > 0) {
    migrationSteps = [
      ...hint.suggestedBlockDecomposition.map((b) => `extract ${b}`),
      ...migrationSteps.filter((s) => !s.startsWith("extract ") || !hint.suggestedBlockDecomposition!.some((b) => s.includes(b))),
    ].slice(0, 6);
  }

  return {
    targetName: task.componentName,
    targetType: "component",
    currentProblem: diagnostic ? getCurrentProblemForComponent(diagnostic) : task.suggestedAction,
    proposedShape,
    stateOwnership,
    serviceBoundaries,
    uiBoundaries,
    migrationSteps,
  };
}

function buildFamilyBlueprint(hotspot: ArchitectureHotspot): RefactorBlueprint | null {
  const template = FAMILY_STRATEGY_TEMPLATES[hotspot.familyName];
  const blueprintContent = FAMILY_BLUEPRINT_CONTENT[hotspot.familyName];

  if (!template || !blueprintContent) {
    return {
      targetName: hotspot.familyName,
      targetType: "family",
      currentProblem: getCurrentProblemForFamily(
        hotspot.familyName,
        hotspot.dominantIssue,
        hotspot.hotspotReasons
      ),
      proposedShape: template?.suggestedExtractionTargets ?? [
        "ContainerComponent",
        "ViewComponent",
        "StateService",
      ],
      stateOwnership: ["Container: parent context", "StateService: state, data"],
      serviceBoundaries: template?.suggestedServiceBaseAbstraction
        ? [template.suggestedServiceBaseAbstraction]
        : ["StateService: state management"],
      uiBoundaries: template?.suggestedBlockDecomposition ?? ["Container", "View"],
      migrationSteps: template?.suggestedRefactorSteps ?? DEFAULT_MIGRATION_STEPS,
    };
  }

  return {
    targetName: hotspot.familyName,
    targetType: "family",
    currentProblem: getCurrentProblemForFamily(
      hotspot.familyName,
      hotspot.dominantIssue,
      hotspot.hotspotReasons
    ),
    proposedShape: blueprintContent.proposedShape,
    stateOwnership: blueprintContent.stateOwnership,
    serviceBoundaries: blueprintContent.serviceBoundaries,
    uiBoundaries: blueprintContent.uiBoundaries,
    migrationSteps: blueprintContent.migrationSteps,
  };
}

export function computeRefactorBlueprints(result: ScanResult): RefactorBlueprint[] {
  const blueprints: RefactorBlueprint[] = [];
  const seenTargets = new Set<string>();

  const diagByPath = new Map<string, ComponentDiagnostic>(
    (result.diagnosticSummary.componentDiagnostics ?? []).map((d) => [d.filePath, d])
  );

  const highPriorityTasks = (result.refactorTasks ?? [])
    .filter((t) => t.priority === "fix-now" || t.priority === "fix-soon")
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, MAX_COMPONENT_BLUEPRINTS);

  for (const task of highPriorityTasks) {
    if (seenTargets.has(task.filePath)) continue;
    const diagnostic = diagByPath.get(task.filePath);
    const blueprint = buildComponentBlueprint(task, diagnostic, result);
    if (blueprint) {
      blueprints.push(blueprint);
      seenTargets.add(task.filePath);
    }
  }

  const targetSuffixSet = new Set(TARGET_FAMILY_SUFFIXES as readonly string[]);
  const familyHotspots = (result.architectureHotspots ?? []).filter((h) =>
    targetSuffixSet.has(h.familyName)
  );
  const topFamilies = familyHotspots
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, MAX_FAMILY_BLUEPRINTS);

  for (const hotspot of topFamilies) {
    if (seenTargets.has(hotspot.familyName)) continue;
    const blueprint = buildFamilyBlueprint(hotspot);
    if (blueprint) {
      blueprints.push(blueprint);
      seenTargets.add(hotspot.familyName);
    }
  }

  return blueprints;
}
