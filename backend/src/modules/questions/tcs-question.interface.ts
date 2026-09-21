import type { Types } from 'mongoose';

export interface ITCSQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  subject: string;
  category: string;
  year?: number | null;
  isImportant?: boolean;
}

export type TCSQuestionInsert = Pick<
  ITCSQuestion,
  'question' | 'options' | 'correctAnswer' | 'explanation' | 'subject' | 'category' | 'year' | 'isImportant'
>;

export interface RelatedQuestionsInput {
  subject: string;
  category?: string | null;
  excludeIds?: Array<string | Types.ObjectId>;
  excludeQuestion?: string | null;
  limit?: number;
}

export interface SubjectUploadRow {
  inserted: number;
  duplicates: number;
  invalid: number;
  received: number;
}

export interface UploadStats {
  inserted: number;
  duplicates: number;
  invalid: number;
  received: number;
}

export interface TcsStatsData {
  total: number;
  bySubject: Record<string, number>;
  subjects: string[];
  gk: number;
  english: number;
  maths: number;
  reasoning: number;
}

export interface BulkUploadSuccess {
  kind: 'success';
  statusCode: 200 | 201;
  message: string;
  data: UploadStats & {
    bySubject?: Record<string, SubjectUploadRow>;
    stats: TcsStatsData;
  };
}

export interface BulkUploadPartialSuccess {
  kind: 'partial_success';
  message: string;
}

export type BulkUploadResult = BulkUploadSuccess | BulkUploadPartialSuccess;

export interface UserAddSuccess {
  kind: 'success';
  statusCode: 200 | 201;
  message: string;
  data: UploadStats & { stats: TcsStatsData };
}

export interface UserAddPartialSuccess {
  kind: 'partial_success';
  message: string;
}

export type UserAddResult = UserAddSuccess | UserAddPartialSuccess;
