import type { Types } from 'mongoose';

export type CompetitionSubject = 'GK' | 'English' | 'Maths' | 'Reasoning' | 'Mixed';

export interface ICompetitionScore {
  userId: Types.ObjectId;
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
  sessionToken: string;
}

export interface SubmitScoreInput {
  sessionToken: string;
  answers: Array<number | null>;
  timeTaken: number;
  subject?: string;
}

export interface PublicCompetitionQuestion {
  _id: string;
  question: string;
  options: string[];
  subject?: string;
  category?: string;
  explanation?: string;
}
