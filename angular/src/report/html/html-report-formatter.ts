import type { Formatter } from "../../formatters/types";
import type { AnalysisSnapshot } from "../../core/analysis-snapshot";
import { precomputeSnapshotComparisons } from "../snapshot-compare-precompute";
import {
  filterSummariesForWorkspace,
  listWorkspaceSnapshotSummaries,
} from "../snapshot-history";
import { renderHtmlReport } from "./html-report-view";

export class HtmlReportFormatter implements Formatter {
  format(snapshot: AnalysisSnapshot): string {
    const debug = process.env.ANGULAR_DOCTOR_DEBUG === "1";
    const raw = listWorkspaceSnapshotSummaries(snapshot.meta.workspacePath, {
      excludeSnapshotHash: snapshot.snapshotHash,
    });
    const snapshotHistory = filterSummariesForWorkspace(raw, snapshot.meta.workspacePath);
    const snapshotComparisons = precomputeSnapshotComparisons(snapshot, snapshotHistory);
    return renderHtmlReport(snapshot, { debug, snapshotHistory, snapshotComparisons });
  }
}
