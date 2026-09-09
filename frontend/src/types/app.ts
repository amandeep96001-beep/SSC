export type UserRole = 'user' | 'admin';

export type ContentSource = 'mine' | 'global';

export type AppView =
  | 'home'
  | 'drill'
  | 'subjects'
  | 'topics'
  | 'notes'
  | 'test'
  | 'results'
  | 'mock'
  | 'mock_exam_active'
  | 'admin'
  | 'roadmap'
  | 'revision'
  | 'performance'
  | 'analytics'
  | 'competition'
  | 'reminders';

export interface PathContext {
  source?: ContentSource | string | null;
  subject?: string | null;
  topicId?: string | null;
  mockId?: string | null;
}

export interface ParsedAppPath {
  view: string;
  subjectSlug?: string;
  topicId?: string;
  mockId?: string;
}

export interface ProgressRow {
  topicId?: string;
  examId?: string | null;
  subjectName?: string | null;
  score?: number;
  maxScore?: number;
  status?: string;
  elapsedTime?: string;
  attemptNumber?: number;
  timestamp?: string;
}

export interface MockProgressRow {
  mockTestId?: string;
  examId?: string | null;
  title?: string;
  score?: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  accuracy?: number;
  elapsedTime?: string;
  attemptNumber?: number;
  timestamp?: string;
  sectionTimes?: unknown;
}

export interface AppUser {
  id?: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  role?: UserRole | string;
  lastStudyAt?: string | null;
  progress?: ProgressRow[];
  mockProgress?: MockProgressRow[];
  token?: string;
}

export interface ExamMarking {
  correct: number;
  wrong: number;
  unattempted?: number;
}

export interface ExamProfile {
  id: string;
  name: string;
  fullName: string;
  tagline: string;
  accent: string;
  sections: string[];
  mockQuestions: number;
  mockMinutes: number;
  mockSectionLimits: Record<string, number>;
  marking: ExamMarking;
  markingLabel: string;
  coachLabel: string;
  pyqLabel: string;
  subjectsFocus: string[];
  dailyGoals: Array<{ id: string; label: string; view: string }>;
  caTips: string[];
  missFixes: string[];
}

export interface McqQuestion {
  q: string;
  o: string[];
  a: number;
  e?: string;
  section?: string;
  state?: string;
  _id?: string;
  id?: string;
  topicId?: string;
  subject?: string | null;
  category?: string | null;
}

export interface StudyTopic {
  id: string;
  name: string;
  syllabus?: string;
  notes?: string;
  questions?: McqQuestion[];
  ownerId?: string | null;
  subjectName?: string;
  isOwned?: boolean;
}

export interface StudySubject {
  name: string;
  ownerId?: string | null;
  topics?: StudyTopic[];
}

export interface VocabItem {
  _id?: string;
  word: string;
  pos?: string;
  definition: string;
  synonyms?: string[] | string;
  antonyms?: string[] | string;
  options?: string[];
  category: string;
  isImportant?: boolean;
  createdBy?: string;
}

export interface VocabFormState {
  word: string;
  pos: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  options: string;
  category: string;
}

export interface ApiSuccess<T = unknown> {
  status: 'success' | 'ok';
  message?: string;
  data?: T;
  lastStudyAt?: string;
  mailSent?: boolean;
  debugOtp?: string;
}

export interface ApiErrorBody {
  status?: string;
  message?: string;
}

export class HttpError extends Error {
  status?: number;
}

export type JsonRecord = Record<string, unknown>;

export interface SubjectListItem {
  name: string;
  isOwned?: boolean;
  ownerId?: string | null;
}

export interface StickyNote {
  id: string;
  text: string;
  label?: string;
  color: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StudyReminder {
  id: string;
  title: string;
  message?: string;
  time: string;
  date?: string | null;
  repeat?: string;
  timezone?: string;
  enabled?: boolean;
  lastFiredKey?: string | null;
  lastFiredAt?: number;
  createdAt?: number;
}

export interface TestSummary {
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
  elapsedTime: string;
  summaryText: string;
  errorLog?: string;
  sectionTimes?: Record<string, number>;
  isMock?: boolean;
}

export interface MockTestItem {
  _id?: string;
  id?: string;
  title?: string;
  examId?: string;
  questions?: McqQuestion[];
  minutes?: number;
  ownerId?: string | null;
  year?: string;
  date?: string;
  shift?: string;
  questionsCount?: number;
}

export interface TopicNotesPayload {
  notes?: string;
  name?: string;
  syllabus?: string;
  questions?: McqQuestion[];
  topicId?: string;
  id?: string;
  isOwned?: boolean;
}

export interface AuthApiPayload {
  token?: string;
  username?: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  role?: UserRole | string;
  lastStudyAt?: string | null;
  progress?: ProgressRow[];
  mockProgress?: MockProgressRow[];
  needsVerification?: boolean;
  mailSent?: boolean;
  debugOtp?: string;
  verified?: boolean;
  reset?: boolean;
  alreadyVerified?: boolean;
  id?: string;
}

export interface ExamProgressScope {
  examId?: string | null;
  examSubjects?: string[];
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong';
}

export function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
