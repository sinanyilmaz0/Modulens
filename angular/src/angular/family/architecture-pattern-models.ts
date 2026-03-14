export interface ArchitecturePatternFamily {
  familyName: string;
  components: string[];
  dominantIssues: string[];
  suggestedRefactor: string;
  /** Full file paths for linking (e.g. drawer); same order as components */
  filePaths?: string[];
}
