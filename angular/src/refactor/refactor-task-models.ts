export interface RefactorTask {
  componentName: string;
  filePath: string;
  dominantIssue: string;
  priority: "fix-now" | "fix-soon" | "monitor";
  impactScore: number;
  effort: "low" | "medium" | "high";
  whyNow: string[];
  suggestedAction: string;
}
