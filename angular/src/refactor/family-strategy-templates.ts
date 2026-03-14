/**
 * Family suffix -> rich refactor strategy templates.
 * Used for *-detail, *-fragment-player, *-content-files, *-manage-fragments, *-form.
 * Heuristic-based; uses tentative language (likely, suggested, probable).
 */

export interface FamilyStrategyTemplate {
  patternSummary: string;
  likelySharedConcerns: string[];
  suggestedExtractionTargets: string[];
  suggestedAngularStructure: string;
  suggestedRefactorSteps: string[];
  expectedBenefits: string[];
  suggestedCommonExtraction?: string;
  suggestedServiceBaseAbstraction?: string;
  suggestedComponentSplitDirection?: string;
  suggestedBlockDecomposition: string[];
  familySpecificHintSnippets: string[];
}

export const FAMILY_STRATEGY_TEMPLATES: Record<string, FamilyStrategyTemplate> = {
  "*-detail": {
    patternSummary: "Entity display + load/save pattern",
    likelySharedConcerns: [
      "shared detail layout",
      "data loading abstraction",
      "action panel / metadata / content sections",
    ],
    suggestedExtractionTargets: [
      "BaseDetailService",
      "EntityDetailContainer",
      "EntityDetailView",
    ],
    suggestedAngularStructure:
      "Thin container + DetailLayoutComponent + DetailDataLoaderService",
    suggestedRefactorSteps: [
      "Extract shared detail layout",
      "Abstract data loading into service",
      "Split action panel / metadata / content sections",
    ],
    expectedBenefits: [
      "Reusable layout across detail views",
      "Consistent loading behavior",
      "Testable data layer",
    ],
    suggestedCommonExtraction: "Load/save logic, validation",
    suggestedServiceBaseAbstraction: "BaseDetailService, DetailStateService",
    suggestedComponentSplitDirection:
      "Split presentation and data loading; extract to BaseDetailService",
    suggestedBlockDecomposition: ["header", "action panel", "metadata", "content"],
    familySpecificHintSnippets: [
      "Extract orchestration service",
      "Isolate data loading from presentation",
    ],
  },
  "*-fragment-player": {
    patternSummary: "Media playback + controls",
    likelySharedConcerns: [
      "playback state",
      "controls/header/content split",
      "shared player orchestration",
    ],
    suggestedExtractionTargets: [
      "FragmentPlayerService",
      "FragmentPlayerControlsComponent",
      "FragmentTimelineComponent",
    ],
    suggestedAngularStructure:
      "PlayerContainer + controls/header/content children + FragmentPlayerService",
    suggestedRefactorSteps: [
      "Extract shared player shell",
      "Move playback logic to shared service/facade",
      "Isolate feature-specific rendering slots",
    ],
    expectedBenefits: [
      "Reusable player logic",
      "Isolated UI concerns",
    ],
    suggestedCommonExtraction: "Playback state, controls",
    suggestedServiceBaseAbstraction: "FragmentPlayerService",
    suggestedComponentSplitDirection:
      "Extract playback logic to FragmentPlayerService; keep UI thin",
    suggestedBlockDecomposition: ["header", "controls", "content"],
    familySpecificHintSnippets: [
      "Extract playback state service",
      "Split controls from content",
    ],
  },
  "*-content-files": {
    patternSummary: "File list + upload/download",
    likelySharedConcerns: [
      "file list",
      "upload",
      "metadata editor",
      "file orchestration",
    ],
    suggestedExtractionTargets: [
      "ContentFilesService",
      "FileListComponent",
      "FileUploadComponent",
    ],
    suggestedAngularStructure:
      "FileContainer + list/upload/metadata children + ContentFilesService",
    suggestedRefactorSteps: [
      "Split file list / upload / metadata editor",
      "Extract orchestration service",
      "Reusable file-item or file-table component",
    ],
    expectedBenefits: [
      "Clear separation",
      "Shared file operations",
    ],
    suggestedCommonExtraction: "File CRUD, selection",
    suggestedServiceBaseAbstraction: "ContentFilesService",
    suggestedComponentSplitDirection:
      "Extract file operations to ContentFilesService; split list vs upload UI",
    suggestedBlockDecomposition: ["file list", "upload", "metadata editor"],
    familySpecificHintSnippets: [
      "Extract file orchestration service",
      "Split list vs upload vs metadata editor",
    ],
  },
  "*-manage-fragments": {
    patternSummary: "Fragment CRUD + ordering",
    likelySharedConcerns: [
      "list/editor/modal orchestration",
      "fragment management",
    ],
    suggestedExtractionTargets: [
      "ManageFragmentsService",
      "list component",
      "editor component",
      "modal component",
    ],
    suggestedAngularStructure:
      "Container + list/editor/modal + ManageFragmentsService",
    suggestedRefactorSteps: [
      "Split list/editor/modal",
      "Extract fragment management service",
      "Decompose template blocks",
    ],
    expectedBenefits: [
      "Testable CRUD logic",
      "Reusable UI blocks",
    ],
    suggestedCommonExtraction: "Fragment operations",
    suggestedServiceBaseAbstraction: "ManageFragmentsService",
    suggestedComponentSplitDirection:
      "Extract fragment CRUD to ManageFragmentsService; keep ordering UI separate",
    suggestedBlockDecomposition: ["list", "editor", "modal"],
    familySpecificHintSnippets: [
      "Extract fragment management service",
      "Split list/editor/modal orchestration",
    ],
  },
  "*-form": {
    patternSummary: "FormGroup + validation + submit",
    likelySharedConcerns: [
      "thin container",
      "presentational form",
      "form builder",
      "validation mapping",
    ],
    suggestedExtractionTargets: [
      "BaseFormService",
      "presentational form component",
      "validation mapping",
    ],
    suggestedAngularStructure:
      "Thin container + presentational form + BaseFormService",
    suggestedRefactorSteps: [
      "Extract thin container",
      "Extract form builder logic",
      "Separate validation mapping",
    ],
    expectedBenefits: [
      "Reusable forms",
      "Testable validation",
    ],
    suggestedCommonExtraction: "Form building, validation",
    suggestedServiceBaseAbstraction: "BaseFormService",
    suggestedComponentSplitDirection:
      "Extract form logic to BaseFormService; split form UI from orchestration",
    suggestedBlockDecomposition: ["form container", "form fields", "validation block"],
    familySpecificHintSnippets: [
      "Extract form builder logic",
      "Separate validation mapping",
    ],
  },
};

export const TARGET_FAMILY_SUFFIXES = [
  "*-detail",
  "*-fragment-player",
  "*-content-files",
  "*-manage-fragments",
  "*-form",
] as const;
