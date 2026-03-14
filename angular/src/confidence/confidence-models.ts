export interface ContributingSignal {
  signal: string;
  weight: number;
  matched: boolean;
  note: string;
}

export interface ConfidenceBreakdown {
  score: number;
  contributingSignals: ContributingSignal[];
}
