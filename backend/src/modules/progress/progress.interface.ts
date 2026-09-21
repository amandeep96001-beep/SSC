import type { ProgressStatus } from '../../types/domain.js';

export interface IProgress {
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
  topicId?: unknown;
  score?: number;
  maxScore?: number;
  elapsedTime?: unknown;
  examId?: unknown;
  subjectName?: unknown;
}

export interface SaveMockProgressInput {
  mockTestId?: unknown;
  title?: unknown;
  score?: unknown;
  correct?: unknown;
  wrong?: unknown;
  blank?: unknown;
  accuracy?: unknown;
  elapsedTime?: unknown;
  sectionTimes?: unknown;
  examId?: unknown;
}

export interface ProgressExportOptions {
  scope: string;
  examId: string | null;
  username: string;
  role: string;
}

export interface ProgressAttemptFilter {
  username: string;
  topicId: string;
  examId?: string;
}

export interface ProgressCreateData {
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
  username?: string;
  examId?: string;
}

export interface MockProgressAttemptFilter {
  username: string;
  mockTestId: string;
  examId?: string;
}

export interface MockProgressCreateData {
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
  username?: string;
  examId?: string;
}
