import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash) return false;

  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return legacyHash === storedHash;
}

export function isLegacyHash(storedHash?: string | null): boolean {
  return Boolean(storedHash && !storedHash.startsWith('$2'));
}
