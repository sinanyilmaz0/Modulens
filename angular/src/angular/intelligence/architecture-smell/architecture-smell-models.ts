export type ArchitectureSmellType =
  | "GOD_PAGE_SMELL"
  | "PLAYER_ORCHESTRATION_SMELL"
  | "TEMPLATE_EXPLOSION_SMELL"
  | "CONTAINER_EXPLOSION_SMELL"
  | "REPEATED_DETAIL_PAGE_SMELL"
  | "FRAGMENT_MANAGEMENT_SMELL"
  | "FORM_ORCHESTRATION_SMELL";

export type SmellSeverity = "low" | "medium" | "high" | "critical";

export interface ArchitectureSmell {
  smellType: ArchitectureSmellType;
  severity: SmellSeverity;
  confidence: number;
  description: string;
  affectedComponents: string[];
  relatedFamilies: string[];
  evidence: string[];
  suggestedArchitecture: string;
  suggestedRefactorActions: string[];
}

export interface ArchitectureSmellSummary {
  totalSmells: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
