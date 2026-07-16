import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || 'dev-only-change-in-production';
}

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
    },
    getSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
