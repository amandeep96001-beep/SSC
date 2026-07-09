import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  // bcrypt hashes start with $2
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  // Legacy SHA-256 migration path for existing accounts
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return legacyHash === storedHash;
}

export function isLegacyHash(storedHash) {
  return storedHash && !storedHash.startsWith('$2');
}
