import type { Formatter } from "./types";
import type { AnalysisSnapshot } from "../core/analysis-snapshot";

export class JsonFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const output = {
      _meta: snapshot.meta,
      result: snapshot.result,
      componentDetailsMap: snapshot.componentDetailsMap,
      sections: snapshot.sections,
      patternData: snapshot.patternData,
      componentsExplorerItems: snapshot.componentsExplorerItems,
    };
    return JSON.stringify(output, null, 2);
  }
}
