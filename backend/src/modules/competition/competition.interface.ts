export type CompetitionSubject = 'GK' | 'English' | 'Maths' | 'Reasoning' | 'Mixed';

export interface ICompetitionScore {
  username: string;
  subject: CompetitionSubject | string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeTaken: number;
  timestamp: Date;
}

export interface CompetitionQuestionMeta {
  total: number;
  subject: string;
}

export interface SubmitScoreInput {
  subject?: unknown;
  score?: unknown;
  correct?: unknown;
  wrong?: unknown;
  skipped?: unknown;
  accuracy?: unknown;
  timeTaken?: unknown;
}
