import crypto from 'crypto';
import User from './user.model.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

/**
 * Addresses that may refer to the same mailbox.
 * Gmail ignores dots / plus-tags — older validator.normalizeEmail() also rewrote those,
 * so DB rows may be either dotted or collapsed.
 */
export function emailAliases(raw: unknown): string[] {
  const email = normalizeEmail(raw);
  if (!email) return [];
  const out = new Set<string>([email]);
  const at = email.lastIndexOf('@');
  if (at <= 0) return [...out];
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const base = local.split('+')[0].replace(/\./g, '');
    out.add(`${base}@gmail.com`);
    out.add(`${base}@googlemail.com`);
  }
  return [...out];
}

export async function findUserByEmail(raw: unknown) {
  const aliases = emailAliases(raw);
  if (!aliases.length) return null;
  return User.findOne({ email: { $in: aliases } });
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function resolveRoleByEmail(email: string): 'user' | 'admin' {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
  if (adminEmail && email === adminEmail) return 'admin';
  return 'user';
}

function slugFromEmail(email: string): string {
  const local = String(email).split('@')[0] || 'user';
  const cleaned = local.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
  return cleaned.length >= 3 ? cleaned : `${cleaned}user`;
}

function slugFromName(name: unknown, email: string): string {
  if (name) {
    const cleaned = String(name).replace(/[^a-zA-Z0-9_ ]/g, '').trim().replace(/\s+/g, '_').slice(0, 24);
    if (cleaned.length >= 3) return cleaned;
  }
  return slugFromEmail(email);
}

/** Unique username for progress keyed by username */
export async function allocateUsername(seed: unknown): Promise<string> {
  let base = String(seed || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
  if (base.length < 3) base = `user${base}`;
  let candidate = base.slice(0, 32);
  let n = 0;
  while (await User.exists({ username: candidate })) {
    n += 1;
    const suffix = String(n);
    candidate = `${base.slice(0, 32 - suffix.length - 1)}_${suffix}`;
    if (n > 500) {
      candidate = `u_${crypto.randomBytes(4).toString('hex')}`;
      break;
    }
  }
  return candidate;
}

export async function upsertUserFromEmail({
  email,
  googleId,
  displayName,
  emailVerified,
}: {
  email: unknown;
  googleId?: unknown;
  displayName?: unknown;
  emailVerified?: unknown;
}) {
  const normalized = normalizeEmail(email);
  let user = await User.findOne({
    $or: [
      { email: { $in: emailAliases(normalized) } },
      ...(googleId ? [{ googleId: String(googleId) }] : []),
    ],
  });

  const role = resolveRoleByEmail(normalized);
  const markVerified = emailVerified === true || Boolean(googleId);

  if (!user) {
    const username = await allocateUsername(slugFromName(displayName, normalized));
    user = await User.create({
      username,
      email: normalized,
      googleId: googleId ? String(googleId) : undefined,
      displayName: displayName ? String(displayName) : undefined,
      emailVerified: markVerified,
      role,
    });
  } else {
    let dirty = false;
    if (!user.email) {
      user.email = normalized;
      dirty = true;
    }
    if (googleId && !user.googleId) {
      user.googleId = String(googleId);
      dirty = true;
    }
    if (displayName && user.displayName !== displayName) {
      user.displayName = String(displayName);
      dirty = true;
    }
    if (markVerified && !user.emailVerified) {
      user.emailVerified = true;
      dirty = true;
    }
    if (process.env.ADMIN_EMAIL?.trim() && user.role !== role) {
      user.role = role;
      dirty = true;
    }
    if (dirty) await user.save();
  }

  return user;
}

export function hashOtpCode(code: string): string {
  const pepper = process.env.OTP_PEPPER || process.env.JWT_SECRET || 'dev-otp-pepper';
  return crypto.createHmac('sha256', pepper).update(String(code)).digest('hex');
}

export function otpHashesMatch(stored: string, computed: string): boolean {
  const a = Buffer.from(String(stored));
  const b = Buffer.from(String(computed));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}
