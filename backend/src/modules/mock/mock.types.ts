import type { Types } from 'mongoose';
import type { IMockQuestion, IMockTest } from './mock-test.model.js';

export interface CreateMockTestInput {
  title?: string;
  year?: string | number;
  date?: string;
  shift?: string;
  questions?: unknown[];
  examId?: string;
}

export interface MockQuestionInput {
  section: string;
  q: string;
  o: unknown;
  a: number;
  e?: string;
}

export interface MockTestListItem {
  _id: Types.ObjectId | string;
  title: string;
  examId: string;
  year: string;
  date: string;
  shift: string;
  createdAt: Date;
  questionsCount: number;
}

export interface CreateMockTestResult {
  id: Types.ObjectId | string;
  title: string;
  examId: string;
  questionsCount: number;
}

export type MockTestDocument = IMockTest & { _id: Types.ObjectId; questions: IMockQuestion[] };
