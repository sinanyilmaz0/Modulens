import type { Translations } from "../translations";

export const enSeverityHint: Pick<Translations, "severityHint"> = {
  severityHint: {
    critical: "Highest risk; fix first",
    high: "High risk; address soon",
    warning: "Moderate risk; monitor",
    low: "Lower priority; findings may still warrant review",
  },
};
