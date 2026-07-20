import crypto from 'crypto';
import User from './user.model.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

export function resolveRoleByEmail(email) {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
  if (adminEmail && email === adminEmail) return 'admin';
  return 'user';
}

function slugFromEmail(email) {
  const local = String(email).split('@')[0] || 'user';
  const cleaned = local.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
  return cleaned.length >= 3 ? cleaned : `${cleaned}user`;
}

function slugFromName(name, email) {
  if (name) {
    const cleaned = String(name).replace(/[^a-zA-Z0-9_ ]/g, '').trim().replace(/\s+/g, '_').slice(0, 24);
    if (cleaned.length >= 3) return cleaned;
  }
  return slugFromEmail(email);
}

/** Unique username for progress keyed by username */
export async function allocateUsername(seed) {
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

export async function upsertUserFromEmail({ email, googleId, displayName, emailVerified }) {
  const normalized = normalizeEmail(email);
  let user = await User.findOne({
    $or: [
      { email: normalized },
      ...(googleId ? [{ googleId }] : []),
    ],
  });

  const role = resolveRoleByEmail(normalized);
  const markVerified = emailVerified === true || Boolean(googleId);

  if (!user) {
    const username = await allocateUsername(slugFromName(displayName, normalized));
    user = await User.create({
      username,
      email: normalized,
      googleId: googleId || undefined,
      displayName: displayName || undefined,
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
      user.googleId = googleId;
      dirty = true;
    }
    if (displayName && user.displayName !== displayName) {
      user.displayName = displayName;
      dirty = true;
    }
    if (markVerified && !user.emailVerified) {
      user.emailVerified = true;
      dirty = true;
    }
    if (role === 'admin' && user.role !== 'admin') {
      user.role = 'admin';
      dirty = true;
    }
    if (dirty) await user.save();
  }

  return user;
}

export function hashOtpCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}
