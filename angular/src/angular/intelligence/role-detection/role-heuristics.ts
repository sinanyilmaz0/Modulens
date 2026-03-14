import type { ComponentRole } from "./role-models";

/** File name suffix -> role mapping */
export const FILE_NAME_ROLE_MAP: Record<string, ComponentRole> = {
  page: "page",
  container: "container",
  detail: "detail",
  player: "player",
  form: "form",
  list: "list",
  viewer: "viewer",
  editor: "editor",
  modal: "modal",
  layout: "layout",
};

const FILE_SUFFIX_REGEX = /^(.+)-([a-z-]+)\.component\.ts$/i;

export function getRoleFromFileName(fileName: string): ComponentRole | null {
  const match = fileName.match(FILE_SUFFIX_REGEX);
  if (!match) return null;
  const suffix = match[2].toLowerCase();
  return FILE_NAME_ROLE_MAP[suffix] ?? null;
}

/** Template content patterns for role signals */
export const TEMPLATE_SIGNALS = {
  routerOutlet: /<router-outlet\b/i,
  formGroup: /\bformGroup\s*=/i,
  ngForm: /\bngForm\b|#\w+\s*=\s*["']ngForm["']/i,
  video: /<video\b/i,
  audio: /<audio\b/i,
};

/** Component file patterns for dependency signals */
export const COMPONENT_SIGNALS = {
  activatedRoute: /\bactivatedroute\b/i,
  playerService: /\b(player|media|video|audio)(service|state|manager)\b/i,
};

/** High ngFor count threshold for list role */
export const NG_FOR_LIST_THRESHOLD = 2;

/** High dependency count for container role */
export const CONTAINER_DEPENDENCY_THRESHOLD = 6;

/** High service orchestration for container */
export const CONTAINER_ORCHESTRATION_THRESHOLD = 3;
