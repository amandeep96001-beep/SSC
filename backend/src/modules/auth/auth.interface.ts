import type { JwtPayload } from 'jsonwebtoken';
import type { PublicUserPayload } from '../../types/domain.js';

export interface IUser {
  username: string;
  email?: string;
  emailVerified: boolean;
  googleId?: string;
  displayName?: string;
  avatarUrl?: string;
  password?: string;
  role: 'user' | 'admin';
  lastStudyAt?: Date;
  tokenVersion: number;
}

export interface PublicUserSource {
  _id?: { toString(): string } | string;
  id?: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  role?: string;
  lastStudyAt?: Date | string | null;
}

export interface AuthTokenPayload extends JwtPayload {
  typ: 'access';
  userId: string;
  username: string;
  email?: string;
  role?: string;
  tv?: number;
}

export interface PasswordResetTokenPayload extends JwtPayload {
  typ: 'password_reset';
  userId: string;
  email: string;
  tv: number;
}

export interface UpsertUserFromEmailInput {
  email: string;
  googleId?: string;
  displayName?: string;
  emailVerified?: boolean;
}

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

export interface GoogleLoginResult {
  data: PublicUserPayload;
}

export interface RegistrationPendingData {
  username: string;
  password: string;
  role: 'user' | 'admin';
}
