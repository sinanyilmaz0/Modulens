import type { ConfidenceBreakdown, ContributingSignal } from "./confidence-models";

export interface NormalizeOptions {
  /** Minimum matched signals to allow score > 0.8. Default 3. */
  minEvidenceForHigh?: number;
  /** Minimum matched signals to allow score > 0.95. Default 4. */
  minEvidenceForVeryHigh?: number;
  /** Minimum matched signals to allow score === 1.0. Default 5. */
  minEvidenceForMax?: number;
}

const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  minEvidenceForHigh: 3,
  minEvidenceForVeryHigh: 4,
  minEvidenceForMax: 5,
};

/**
 * Normalizes confidence from weighted matched signals.
 * - Raw score = sum of weights for matched signals / sum of all weights (0-1)
 * - Cap at 0.8 unless matchedSignalsCount >= 3
 * - Cap at 0.95 unless matchedSignalsCount >= 4 and raw score very high
 * - Never return 1.0 unless evidence is exceptional (5+ matched signals)
 */
export function normalizeConfidence(
  signals: ContributingSignal[],
  options?: NormalizeOptions
): ConfidenceBreakdown {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const matchedWeight = signals.reduce(
    (sum, s) => sum + (s.matched ? s.weight : 0),
    0
  );
  const matchedCount = signals.filter((s) => s.matched).length;

  let rawScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  // Apply evidence-based caps to avoid inflated certainty
  let score = rawScore;
  if (matchedCount < opts.minEvidenceForHigh) {
    score = Math.min(score, 0.8);
  }
  if (matchedCount < opts.minEvidenceForVeryHigh) {
    score = Math.min(score, 0.95);
  }
  // Only allow 1.0 with exceptional evidence (5+ signals and very strong raw score)
  if (matchedCount < opts.minEvidenceForMax || rawScore < 0.95) {
    score = Math.min(score, 0.99);
  }

  score = Math.round(score * 100) / 100;
  score = Math.max(0, Math.min(1, score));

  return {
    score,
    contributingSignals: signals,
  };
}
