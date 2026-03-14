import * as fs from "fs";
import type { ComponentAnalysisResult } from "../../analyzers/component-analyzer";
import type { LifecycleAnalysisResult } from "../../analyzers/lifecycle/lifecycle-models";
import type { TemplateAnalysisResult } from "../../analyzers/template/template-models";
import type { ResponsibilityAnalysisResult } from "../../analyzers/responsibility/responsibility-models";
import type { DominantIssueType } from "../../../diagnostic/diagnostic-models";
import { resolveTemplateContent } from "../../analyzers/template/template-analyzer";
import type { ContributingSignal } from "../../../confidence/confidence-models";
import { normalizeConfidence } from "../../../confidence/confidence-normalizer";
import type { ComponentRole, ComponentRoleResult } from "./role-models";
import {
  getRoleFromFileName,
  TEMPLATE_SIGNALS,
  COMPONENT_SIGNALS,
  NG_FOR_LIST_THRESHOLD,
  CONTAINER_DEPENDENCY_THRESHOLD,
  CONTAINER_ORCHESTRATION_THRESHOLD,
} from "./role-heuristics";

const ROLE_WEIGHTS: Record<string, number> = {
  "file-name-pattern": 2.0,
  "router-outlet": 1.5,
  "form-group-ngform": 1.5,
  "video-audio-element": 1.5,
  "ngfor-list": 1.2,
  "activated-route": 1.5,
  "form-builder": 1.2,
  "media-player-service": 1.5,
  "many-dependencies": 1.0,
  "router-usage": 1.2,
  "form-group-count": 1.2,
  "service-orchestration": 1.2,
  "ui-state-fields": 1.0,
  "orchestration-heavy": 1.2,
  "template-heavy-ngfor": 1.0,
  "mat-dialog-modal": 1.5,
  "modal-drawer-usage": 1.2,
};

const SIGNAL_NOTES: Record<string, string> = {
  "file-name-pattern": "File name suffix matches known role",
  "router-outlet": "Template contains router-outlet",
  "form-group-ngform": "Template has formGroup or ngForm",
  "video-audio-element": "Template has video or audio element",
  "ngfor-list": "High ngFor/atFor count in template",
  "activated-route": "Uses ActivatedRoute",
  "form-builder": "Uses FormBuilder or FormGroup",
  "media-player-service": "Player/media service or baseName contains player",
  "many-dependencies": "High dependency count",
  "router-usage": "Uses router",
  "form-group-count": "Multiple FormGroups",
  "service-orchestration": "High service orchestration count",
  "ui-state-fields": "Multiple UI state fields",
  "orchestration-heavy": "Diagnostic: orchestration heavy",
  "template-heavy-ngfor": "Diagnostic: template heavy with ngFor",
  "mat-dialog-modal": "Uses MatDialog",
  "modal-drawer-usage": "Uses modal or drawer",
};

export interface RoleDetectionInput {
  component: ComponentAnalysisResult;
  lifecycleResult?: LifecycleAnalysisResult;
  templateResult?: TemplateAnalysisResult;
  responsibilityResult?: ResponsibilityAnalysisResult;
  dominantIssue?: DominantIssueType | null;
  clusterScores?: Record<string, number>;
}

export function detectComponentRole(input: RoleDetectionInput): ComponentRoleResult {
  const scores: Record<ComponentRole, number> = {
    page: 0,
    container: 0,
    detail: 0,
    player: 0,
    form: 0,
    list: 0,
    viewer: 0,
    editor: 0,
    widget: 0,
    layout: 0,
    modal: 0,
    unknown: 0,
  };

  const signals: string[] = [];

  const {
    component,
    lifecycleResult,
    templateResult,
    responsibilityResult,
    dominantIssue,
    clusterScores = {},
  } = input;

  const metrics = responsibilityResult?.metrics;
  const templateMetrics = templateResult?.metrics;
  const templateContent = getTemplateContent(component.filePath);

  let componentContent = "";
  try {
    componentContent = fs.readFileSync(component.filePath, "utf-8");
  } catch {
    // ignore
  }

  const baseName = component.fileName.replace(/\.component\.ts$/i, "").toLowerCase();

  // File name pattern
  const fileNameRole = getRoleFromFileName(component.fileName);
  if (fileNameRole && fileNameRole !== "unknown") {
    scores[fileNameRole] += ROLE_WEIGHTS["file-name-pattern"] ?? 1;
    signals.push("file-name-pattern");
  }

  // Template signals
  if (templateContent) {
    if (TEMPLATE_SIGNALS.routerOutlet.test(templateContent)) {
      scores.layout += ROLE_WEIGHTS["router-outlet"] ?? 1;
      scores.page += (ROLE_WEIGHTS["router-outlet"] ?? 1) * 0.5;
      signals.push("router-outlet");
    }
    if (TEMPLATE_SIGNALS.formGroup.test(templateContent) || TEMPLATE_SIGNALS.ngForm.test(templateContent)) {
      scores.form += ROLE_WEIGHTS["form-group-ngform"] ?? 1;
      signals.push("form-group-ngform");
    }
    if (TEMPLATE_SIGNALS.video.test(templateContent) || TEMPLATE_SIGNALS.audio.test(templateContent)) {
      scores.player += ROLE_WEIGHTS["video-audio-element"] ?? 1;
      signals.push("video-audio-element");
    }
  }

  // ngFor list signal
  const ngForCount = (templateMetrics?.ngForCount ?? 0) + (templateMetrics?.atForCount ?? 0);
  if (ngForCount >= NG_FOR_LIST_THRESHOLD) {
    scores.list += ROLE_WEIGHTS["ngfor-list"] ?? 1;
    signals.push("ngfor-list");
  }

  // ActivatedRoute
  if (COMPONENT_SIGNALS.activatedRoute.test(componentContent)) {
    scores.page += (ROLE_WEIGHTS["activated-route"] ?? 1) * 0.8;
    scores.detail += (ROLE_WEIGHTS["activated-route"] ?? 1) * 0.6;
    signals.push("activated-route");
  }

  // FormBuilder / FormGroup
  if (metrics?.formBuilderUsage || (metrics?.formGroupCount ?? 0) >= 1) {
    scores.form += ROLE_WEIGHTS["form-builder"] ?? 1;
    if (!signals.includes("form-group-ngform")) signals.push("form-builder");
  }
  if ((metrics?.formGroupCount ?? 0) >= 2) {
    scores.form += ROLE_WEIGHTS["form-group-count"] ?? 1;
    signals.push("form-group-count");
  }

  // Media/player service
  if (COMPONENT_SIGNALS.playerService.test(componentContent) || baseName.includes("player")) {
    scores.player += ROLE_WEIGHTS["media-player-service"] ?? 1;
    signals.push("media-player-service");
  }

  // Container: many dependencies
  if (component.dependencyCount >= CONTAINER_DEPENDENCY_THRESHOLD) {
    scores.container += ROLE_WEIGHTS["many-dependencies"] ?? 1;
    signals.push("many-dependencies");
  }

  // Router usage -> page
  if (metrics?.routerUsage) {
    scores.page += ROLE_WEIGHTS["router-usage"] ?? 1;
    signals.push("router-usage");
  }

  // Service orchestration -> container
  if ((metrics?.serviceOrchestrationCount ?? 0) >= CONTAINER_ORCHESTRATION_THRESHOLD) {
    scores.container += ROLE_WEIGHTS["service-orchestration"] ?? 1;
    signals.push("service-orchestration");
  }

  // UI state fields -> container, player
  if ((metrics?.uiStateFieldCount ?? 0) >= 2) {
    scores.container += (ROLE_WEIGHTS["ui-state-fields"] ?? 1) * 0.5;
    scores.player += (ROLE_WEIGHTS["ui-state-fields"] ?? 1) * 0.5;
    signals.push("ui-state-fields");
  }

  // Diagnostic: ORCHESTRATION_HEAVY -> container
  if (dominantIssue === "ORCHESTRATION_HEAVY_COMPONENT") {
    scores.container += ROLE_WEIGHTS["orchestration-heavy"] ?? 1;
    signals.push("orchestration-heavy");
  }

  // Diagnostic: TEMPLATE_HEAVY + ngFor -> list
  if (dominantIssue === "TEMPLATE_HEAVY_COMPONENT" && ngForCount >= 1) {
    scores.list += ROLE_WEIGHTS["template-heavy-ngfor"] ?? 1;
    signals.push("template-heavy-ngfor");
  }

  // Modal/dialog
  if (metrics?.matDialogUsage) {
    scores.modal += ROLE_WEIGHTS["mat-dialog-modal"] ?? 1;
    signals.push("mat-dialog-modal");
  }
  if (metrics?.modalOrDrawerUsage) {
    scores.modal += ROLE_WEIGHTS["modal-drawer-usage"] ?? 1;
    signals.push("modal-drawer-usage");
  }

  // Detail: fileName detail + activatedRoute
  if (fileNameRole === "detail" && COMPONENT_SIGNALS.activatedRoute.test(componentContent)) {
    scores.detail += 0.8;
  }

  // Editor: form + viewer hybrid
  if (scores.form > 0 && scores.detail > 0) {
    scores.editor += 0.5;
  }

  // Widget: small component, few deps
  if (component.lineCount < 80 && component.dependencyCount <= 3 && Object.values(scores).every((s) => s < 1)) {
    scores.widget += 0.5;
  }

  // Pick dominant role
  const entries = Object.entries(scores) as [ComponentRole, number][];
  const sorted = entries
    .filter(([role]) => role !== "unknown")
    .sort((a, b) => b[1] - a[1]);

  const [chosenRole, dominantScore] = sorted[0] ?? ["unknown", 0];
  const finalRole: ComponentRole = dominantScore > 0 ? chosenRole : "unknown";

  const matchedSignals = Array.from(new Set(signals));
  const contributingSignals: ContributingSignal[] = Object.keys(ROLE_WEIGHTS).map(
    (signal) => ({
      signal,
      weight: ROLE_WEIGHTS[signal] ?? 1,
      matched: matchedSignals.includes(signal),
      note: SIGNAL_NOTES[signal] ?? signal.replace(/-/g, " "),
    })
  );

  const breakdown = normalizeConfidence(contributingSignals);

  return {
    componentRole: finalRole,
    roleConfidence: breakdown.score,
    roleSignals: matchedSignals,
    roleConfidenceBreakdown: breakdown,
  };
}

function getTemplateContent(componentPath: string): string | null {
  const resolved = resolveTemplateContent(componentPath);
  return resolved?.content ?? null;
}
