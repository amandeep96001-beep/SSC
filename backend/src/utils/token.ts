/** JWT and password-reset token helpers for authentication. */
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { isHostedRuntime } from '../config/env.config.js';
import type { AuthTokenPayload, PasswordResetTokenPayload } from '../modules/auth/auth.interface.js';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];
const JWT_ALG = 'HS256' as const;

let ephemeralDevSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (isHostedRuntime()) {
    throw new Error('JWT_SECRET must be set in production');
  }

  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(48).toString('hex');
    console.warn('[auth] JWT_SECRET is unset — using an ephemeral secret. Sessions reset on restart.');
  }
  return ephemeralDevSecret;
}

export function signToken(user: {
  _id: { toString(): string };
  username: string;
  email?: string | null;
  role?: string;
  tokenVersion?: number;
}): string {
  return jwt.sign(
    {
      typ: 'access',
      userId: user._id.toString(),
      username: user.username,
      email: user.email || undefined,
      role: user.role || 'user',
      tv: user.tokenVersion ?? 0,
    },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALG },
  );
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret(), { algorithms: [JWT_ALG] });
  if (
    typeof payload === 'string'
    || !payload
    || typeof payload !== 'object'
    || payload.typ !== 'access'
    || typeof payload.userId !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }
  return payload as AuthTokenPayload;
}

/** Short-lived, single-purpose JWT issued only after a successful password-reset OTP. */
export const PASSWORD_RESET_TTL_SEC = 15 * 60;

export function signPasswordResetToken(user: {
  _id: { toString(): string };
  email: string;
  tokenVersion?: number;
}): string {
  return jwt.sign(
    {
      typ: 'password_reset',
      userId: user._id.toString(),
      email: user.email,
      tv: user.tokenVersion ?? 0,
    },
    getSecret(),
    { expiresIn: PASSWORD_RESET_TTL_SEC, algorithm: JWT_ALG },
  );
}

export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
  const payload = jwt.verify(token, getSecret(), { algorithms: [JWT_ALG] });
  if (
    typeof payload === 'string'
    || !payload
    || typeof payload !== 'object'
    || payload.typ !== 'password_reset'
    || typeof payload.userId !== 'string'
    || typeof payload.email !== 'string'
  ) {
    throw new Error('Invalid password reset token');
  }
  return payload as PasswordResetTokenPayload;
}
