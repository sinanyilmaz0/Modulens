import type { TemplateMetrics } from "../../analyzers/template/template-models";
import { resolveTemplateContent } from "../../analyzers/template/template-analyzer";
import { TEMPLATE_SIGNALS } from "../role-detection/role-heuristics";

/** Extraction prioritization order: highest value first */
export const EXTRACTION_PRIORITY_ORDER = [
  "Controls",
  "Timeline",
  "Metadata",
  "Header",
  "List",
  "Sidebar",
  "Container",
  "PlayerView",
  "PlayerControls",
  "FormView",
  "FormFields",
] as const;

export type ExtractionSuffix = (typeof EXTRACTION_PRIORITY_ORDER)[number];

/** Template content patterns for evidence-based extraction */
export const EXTRACTION_TEMPLATE_SIGNALS = {
  timeline: /\b(timeline|progress|seek|duration|currentTime|mat-slider|mat-progress|range\s*input)\b/i,
  metadata: /\b(info|details|meta|description|desc|summary)\b/i,
  header: /\b(header|nav|toolbar|mat-toolbar|mat-header)\b/i,
  sidebar: /\b(sidebar|aside|mat-sidenav|sidenav)\b/i,
};

const EVENT_BINDING_THRESHOLD = 15;
const NG_FOR_LIST_THRESHOLD = 2;

export interface ExtractionEvidenceContext {
  templateContent: string | null;
  templateMetrics: TemplateMetrics | null;
  depCount: number;
  serviceOrchestration: number;
  routerUsage: boolean;
  formBuilderUsage?: boolean;
  formGroupCount?: number;
  formControlCount?: number;
}

function getTemplateContent(filePath: string): string | null {
  const resolved = resolveTemplateContent(filePath);
  return resolved?.content ?? null;
}

/**
 * Check if there is evidence to suggest extracting a Controls component.
 * Evidence: high event binding count.
 */
export function hasControlsEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const eventCount = context.templateMetrics?.eventBindingCount ?? 0;
  return eventCount >= EVENT_BINDING_THRESHOLD;
}

/**
 * Check if there is evidence to suggest extracting a Timeline component.
 * Evidence: template contains timeline/progress/seek/duration/currentTime/mat-slider patterns.
 */
export function hasTimelineEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const content = context.templateContent ?? "";
  return EXTRACTION_TEMPLATE_SIGNALS.timeline.test(content);
}

/**
 * Check if there is evidence to suggest extracting a Metadata component.
 * Evidence: template contains info/details/meta/description sections.
 */
export function hasMetadataEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const content = context.templateContent ?? "";
  return EXTRACTION_TEMPLATE_SIGNALS.metadata.test(content);
}

/**
 * Check if there is evidence to suggest extracting a Header component.
 * Evidence: template contains header/nav/toolbar patterns.
 */
export function hasHeaderEvidence(context: ExtractionEvidenceContext): boolean {
  const content = context.templateContent ?? "";
  return EXTRACTION_TEMPLATE_SIGNALS.header.test(content);
}

/**
 * Check if there is evidence to suggest extracting a List component.
 * Evidence: ngFor/atFor count is high.
 */
export function hasListEvidence(context: ExtractionEvidenceContext): boolean {
  const ngFor = context.templateMetrics?.ngForCount ?? 0;
  const atFor = context.templateMetrics?.atForCount ?? 0;
  return ngFor + atFor >= NG_FOR_LIST_THRESHOLD;
}

/**
 * Check if there is evidence to suggest extracting a Sidebar component.
 * Evidence: template contains sidebar/aside/mat-sidenav patterns.
 */
export function hasSidebarEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const content = context.templateContent ?? "";
  return EXTRACTION_TEMPLATE_SIGNALS.sidebar.test(content);
}

/**
 * Check if there is evidence to suggest extracting a Container component.
 * Evidence: orchestration heuristic (deps, service orchestration, router).
 */
export function hasContainerEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const ORCHESTRATION_DEPS_THRESHOLD = 6;
  const ORCHESTRATION_SERVICE_THRESHOLD = 4;
  return (
    context.depCount >= ORCHESTRATION_DEPS_THRESHOLD ||
    context.serviceOrchestration >= ORCHESTRATION_SERVICE_THRESHOLD ||
    context.routerUsage
  );
}

/** PlayerView: video/audio elements in template */
export function hasPlayerViewEvidence(
  context: ExtractionEvidenceContext
): boolean {
  const content = context.templateContent ?? "";
  return TEMPLATE_SIGNALS.video.test(content) || TEMPLATE_SIGNALS.audio.test(content);
}

/** PlayerControls: same as Controls - high event bindings */
export function hasPlayerControlsEvidence(
  context: ExtractionEvidenceContext
): boolean {
  return hasControlsEvidence(context);
}

/** FormView/FormFields: form heuristic */
export function hasFormEvidence(context: ExtractionEvidenceContext): boolean {
  const FORM_CONTROL_THRESHOLD = 5;
  return (
    (context.formBuilderUsage ?? false) ||
    (context.formGroupCount ?? 0) >= 2 ||
    (context.formControlCount ?? 0) >= FORM_CONTROL_THRESHOLD
  );
}

const EVIDENCE_CHECKERS: Record<
  string,
  (ctx: ExtractionEvidenceContext) => boolean
> = {
  Controls: hasControlsEvidence,
  Timeline: hasTimelineEvidence,
  Metadata: hasMetadataEvidence,
  Header: hasHeaderEvidence,
  List: hasListEvidence,
  Sidebar: hasSidebarEvidence,
  Container: hasContainerEvidence,
  PlayerView: hasPlayerViewEvidence,
  PlayerControls: hasPlayerControlsEvidence,
  FormView: hasFormEvidence,
  FormFields: hasFormEvidence,
};

export function hasEvidenceForExtraction(
  suffix: string,
  context: ExtractionEvidenceContext
): boolean {
  const checker = EVIDENCE_CHECKERS[suffix];
  if (!checker) return false;
  return checker(context);
}

export function buildExtractionEvidenceContext(
  filePath: string,
  templateMetrics: TemplateMetrics | null,
  depCount: number,
  serviceOrchestration: number,
  routerUsage: boolean,
  formContext?: {
    formBuilderUsage: boolean;
    formGroupCount: number;
    formControlCount: number;
  }
): ExtractionEvidenceContext {
  return {
    templateContent: getTemplateContent(filePath),
    templateMetrics,
    depCount,
    serviceOrchestration,
    routerUsage,
    formBuilderUsage: formContext?.formBuilderUsage,
    formGroupCount: formContext?.formGroupCount,
    formControlCount: formContext?.formControlCount,
  };
}
