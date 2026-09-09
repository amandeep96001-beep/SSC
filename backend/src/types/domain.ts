export type UserRole = 'user' | 'admin';

export type OtpPurpose = 'email_verify' | 'password_reset';

export type ProgressStatus = 'red' | 'yellow' | 'green';

export interface Timestamped {
  timestamp?: Date | string | null;
}

export interface PublicUserPayload {
  username: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: string;
  lastStudyAt: string | null;
  progress: unknown[];
  mockProgress: unknown[];
  token?: string;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mongoErrorCode(err: unknown): number | undefined {
  if (isRecord(err) && typeof err.code === 'number') return err.code;
  return undefined;
}

export function mongoErrorCodeName(err: unknown): string | undefined {
  if (isRecord(err) && typeof err.codeName === 'string') return err.codeName;
  return undefined;
}
