import type { Types } from 'mongoose';

export interface IWrongLog {
  userId: Types.ObjectId;
  question: string;
  correctAnswer?: string;
  userAnswer?: string;
  options?: string[] | null;
  placeholder?: string | null;
  explanation?: string | null;
  category?: string | null;
  type?: string;
  word?: string | null;
  revealDefinition?: string | null;
  revealSynonyms?: string[] | null;
  revealAntonyms?: string[] | null;
  pos?: string | null;
  wrongCount: number;
  lastWrongAt: Date;
}

export interface WrongLogUpsertInput {
  question: string;
  correctAnswer?: string;
  userAnswer?: string;
  options?: string[] | null;
  placeholder?: string | null;
  explanation?: string | null;
  category?: string | null;
  type?: string;
  word?: string | null;
  revealDefinition?: string | null;
  revealSynonyms?: string[] | null;
  revealAntonyms?: string[] | null;
  pos?: string | null;
}
