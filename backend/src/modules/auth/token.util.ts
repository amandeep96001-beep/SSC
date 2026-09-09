import crypto from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { isHostedRuntime } from '../../config/env.config.js';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];
const JWT_ALG = 'HS256' as const;

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  username: string;
  email?: string;
  role?: string;
  tv?: number;
}

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
      userId: user._id.toString(),
      username: user.username,
      email: user.email || undefined,
      role: user.role || 'user',
      tv: user.tokenVersion ?? 0,
    },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALG }
  );
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret(), { algorithms: [JWT_ALG] });
  if (typeof payload === 'string' || !payload || typeof payload !== 'object' || !('userId' in payload)) {
    throw new Error('Invalid token payload');
  }
  return payload as AuthTokenPayload;
}
