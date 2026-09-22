import type { Types } from 'mongoose';
import type { ProgressStatus } from '../../types/domain.js';

export interface IProgress {
  userId: Types.ObjectId;
  username: string;
  examId?: string | null;
  subjectName?: string | null;
  topicId: string;
  score: number;
  maxScore: number;
  status: ProgressStatus;
  elapsedTime?: string;
  attemptNumber: number;
  timestamp: Date;
}

export interface IMockProgress {
  userId: Types.ObjectId;
  username: string;
  examId?: string | null;
  mockTestId: string;
  title: string;
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
  elapsedTime?: string;
  sectionTimes?: unknown;
  attemptNumber: number;
  timestamp: Date;
}

export interface SaveProgressInput {
  topicId: string;
  score?: number;
  maxScore?: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  elapsedTime?: string;
  examId?: string;
  subjectName?: string;
}

export interface SaveMockProgressInput {
  mockTestId: string;
  title: string;
  score?: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy?: number;
  elapsedTime?: string;
  sectionTimes?: Record<string, unknown>;
  examId?: string;
}

export interface ProgressExportOptions {
  scope: string;
  examId: string | null;
  userId: string;
  username: string;
  role: string;
}

export interface ProgressAttemptFilter {
  userId: string;
  topicId: string;
  examId?: string;
}

export interface ProgressCreateData {
  userId: Types.ObjectId | string;
  username: string;
  examId?: string | null;
  subjectName?: string | null;
  topicId: string;
  score: number;
  maxScore: number;
  status: ProgressStatus;
  elapsedTime?: string;
  attemptNumber: number;
  timestamp: Date;
}

export interface ProgressListFilter {
  userId?: string;
  username?: string;
  examId?: string;
}

export interface MockProgressAttemptFilter {
  userId: string;
  mockTestId: string;
  examId?: string;
}

export interface MockProgressCreateData {
  userId: Types.ObjectId | string;
  username: string;
  examId?: string | null;
  mockTestId: string;
  title: string;
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
  elapsedTime?: string;
  sectionTimes?: Record<string, unknown> | null;
  attemptNumber: number;
  timestamp: Date;
}

export interface MockProgressListFilter {
  userId?: string;
  username?: string;
  examId?: string;
}
