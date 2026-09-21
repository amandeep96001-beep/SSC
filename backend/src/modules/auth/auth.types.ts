import type { PublicUserPayload } from '../../types/domain.js';

export interface RegisterInput {
  email?: unknown;
  password?: unknown;
  username?: unknown;
}

export interface LoginInput {
  username?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface SessionFallback {
  email?: string | null;
  role?: string;
}

export interface VerificationPayload {
  needsVerification: true;
  email: string;
  mailSent: boolean;
  debugOtp?: string;
}

export interface RegisterResult {
  message: string;
  data: VerificationPayload;
  statusCode: 201;
}

export interface LoginNeedsVerification {
  message: string;
  data: VerificationPayload;
  session: null;
}

export interface LoginSessionResult {
  message?: string;
  data: PublicUserPayload;
  session: true;
}

export type LoginResult = LoginNeedsVerification | LoginSessionResult;

export interface GoogleAuthInput {
  code?: unknown;
  credential?: unknown;
}

export interface PasswordResetVerifyData {
  email: string;
  verified: true;
  resetToken: string;
  resetUrl: string;
  expiresIn: number;
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

export interface AdminSummary {
  userCount: number;
  mockAttemptCount: number;
  syllabusAttemptCount: number;
}

export interface OtpCreateResult {
  code: string;
  mail: { sent: boolean };
  debugOtp?: string;
}

export interface RegistrationPendingData {
  username: string;
  password: string;
  role: 'user' | 'admin';
}
