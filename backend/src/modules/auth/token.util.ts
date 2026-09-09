import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  username: string;
  email?: string;
  role?: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || 'dev-only-change-in-production';
}

export function signToken(user: { _id: { toString(): string }; username: string; email?: string | null; role?: string }): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      email: user.email || undefined,
      role: user.role || 'user',
    },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === 'string' || !payload || typeof payload !== 'object' || !('userId' in payload)) {
    throw new Error('Invalid token payload');
  }
  return payload as AuthTokenPayload;
}
