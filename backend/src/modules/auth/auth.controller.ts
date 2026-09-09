import type { RequestHandler, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import User from './user.model.js';
import type { IUser } from './user.model.js';
import MockProgress from './mock-progress.model.js';
import type { IMockProgress } from './mock-progress.model.js';
import Progress from './progress.model.js';
import type { IProgress } from './progress.model.js';
import OtpChallenge from './otp.model.js';
import { hashPassword, verifyPassword, isLegacyHash } from './password.util.js';
import { signToken } from './token.util.js';
import { sendOtpEmail } from './mail.util.js';
import { verifyGoogleIdToken, exchangeGoogleAuthCode } from './google.util.js';
import {
  normalizeEmail,
  isValidEmail,
  upsertUserFromEmail,
  hashOtpCode,
  otpHashesMatch,
  generateOtpCode,
  allocateUsername,
  resolveRoleByEmail,
} from './authIdentity.util.js';
import {
  isRecord,
  type OtpPurpose,
  type ProgressStatus,
  type PublicUserPayload,
} from '../../types/domain.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

interface PublicUserSource {
  username: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  role?: string;
  lastStudyAt?: Date | string | null;
}

function rowTimestamp(row: unknown): number {
  if (!isRecord(row)) return 0;
  const ts = row.timestamp;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string' || typeof ts === 'number') {
    const t = new Date(ts).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

function deriveLastStudyAt(
  progress: unknown[] = [],
  mockProgress: unknown[] = [],
  stored: Date | string | null = null,
): string | null {
  let max = 0;
  if (stored) {
    const t = new Date(stored).getTime();
    if (!Number.isNaN(t)) max = t;
  }
  for (const row of progress) {
    const t = rowTimestamp(row);
    if (t > max) max = t;
  }
  for (const row of mockProgress) {
    const t = rowTimestamp(row);
    if (t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : null;
}

function publicUserPayload(
  user: PublicUserSource,
  progress: unknown[] = [],
  mockProgress: unknown[] = [],
  token: string | null = null,
): PublicUserPayload {
  const payload: PublicUserPayload = {
    username: user.username,
    email: user.email || null,
    displayName: user.displayName || null,
    emailVerified: Boolean(user.emailVerified),
    role: user.role || 'user',
    lastStudyAt: deriveLastStudyAt(progress, mockProgress, user.lastStudyAt ?? null),
    progress,
    mockProgress
  };
  if (token) payload.token = token;
  return payload;
}

async function touchLastStudyAt(userId: string | undefined) {
  if (!userId) return;
  try {
    await User.updateOne({ _id: userId }, { $set: { lastStudyAt: new Date() } });
  } catch {
    /* non-critical */
  }
}

function csvEscape(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function asCsvRow(row: object): Record<string, unknown> {
  return row as Record<string, unknown>;
}

function mockProgressToCsv(rows: object[]) {
  const cols = [
    'username', 'examId', 'title', 'score', 'correct', 'wrong', 'blank',
    'accuracy', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    const row = asCsvRow(r);
    if (c === 'timestamp') return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
    return csvEscape(row[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

function syllabusProgressToCsv(rows: object[]) {
  const cols = [
    'username', 'examId', 'topicId', 'subjectName', 'score', 'maxScore',
    'status', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    const row = asCsvRow(r);
    if (c === 'timestamp') return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
    return csvEscape(row[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

/** Admin only via ADMIN_EMAIL — no username/code shortcuts (those were privilege-escalation vectors). */
function resolveRole(email: string | null | undefined): 'user' | 'admin' {
  return email ? resolveRoleByEmail(normalizeEmail(email)) : 'user';
}

async function createAndStoreOtp(
  email: string,
  purpose: OtpPurpose = 'email_verify',
  pendingData: unknown = null,
) {
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await OtpChallenge.deleteMany({ email, purpose });
  await OtpChallenge.create({ email, purpose, codeHash, expiresAt, attempts: 0, pendingData });
  const mail = await sendOtpEmail(email, code, { purpose });
  const debugOtp =
    process.env.SMTP_DEBUG === '1' && process.env.NODE_ENV !== 'production' && !mail.sent
      ? code
      : undefined;
  return { code, mail, debugOtp };
}

async function consumeOtpChallenge(email: string, code: string, purpose: OtpPurpose) {
  const challenge = await OtpChallenge.findOne({ email, purpose }).sort({ expiresAt: -1 });
  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, status: 401, message: 'OTP expired. Request a new code.' };
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await OtpChallenge.deleteMany({ email, purpose });
    return { ok: false as const, status: 429, message: 'Too many incorrect attempts. Request a new code.' };
  }
  if (!otpHashesMatch(challenge.codeHash, hashOtpCode(code))) {
    challenge.attempts += 1;
    await challenge.save();
    return { ok: false as const, status: 401, message: 'Incorrect OTP. Try again.' };
  }
  await OtpChallenge.deleteMany({ email, purpose });
  return { ok: true as const, pendingData: challenge.pendingData };
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    let username = String(req.body.username || '').trim();

    if (!email || !isValidEmail(email) || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.',
      });
    }

    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists. Sign in instead.',
      });
    }

    if (!username) {
      username = await allocateUsername(email.split('@')[0]);
    } else {
      const existingUser = await User.findOne({ username }).lean();
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Username is already taken. Choose another.',
        });
      }
    }

    const hashed = await hashPassword(password);
    const role = resolveRole(email);
    
    // Save user details temporarily until OTP verification
    const pendingData = {
      username,
      password: hashed,
      role
    };

    const { mail, debugOtp } = await createAndStoreOtp(email, 'email_verify', pendingData);
    res.status(201).json({
      status: 'success',
      message: mail.sent
        ? 'Account created. Enter the OTP sent to your email to verify.'
        : 'Account created. We could not deliver email — use the code shown on screen (local debug) or check SMTP settings.',
      data: {
        needsVerification: true,
        email,
        mailSent: Boolean(mail.sent),
        ...(debugOtp ? { debugOtp } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { password } = req.body;
    const identifier = String(req.body.username || req.body.email || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email/username and password are required.',
      });
    }

    const user = isValidEmail(identifier)
      ? await User.findOne({ email: normalizeEmail(identifier) })
      : await User.findOne({ username: identifier });

    if (!user || !user.password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email/username or password.',
      });
    }

    const matched = await verifyPassword(password, user.password);
    if (!matched) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email/username or password.',
      });
    }

    if (user.email && !user.emailVerified && !user.googleId) {
      const { mail, debugOtp } = await createAndStoreOtp(user.email, 'email_verify');
      return res.json({
        status: 'success',
        message: mail.sent
          ? 'Verify your email with the OTP we sent, then sign in with your password.'
          : 'Verify your email — we could not deliver mail; use the on-screen code (local) or fix SMTP.',
        data: {
          needsVerification: true,
          email: user.email,
          mailSent: Boolean(mail.sent),
          ...(debugOtp ? { debugOtp } : {}),
        },
      });
    }

    if (isLegacyHash(user.password)) {
      user.password = await hashPassword(password);
      await user.save();
    }

    // Keep role in sync with ADMIN_EMAIL (promote and demote).
    if (process.env.ADMIN_EMAIL?.trim() && user.email) {
      const expected = resolveRoleByEmail(user.email);
      if (user.role !== expected) {
        user.role = expected;
        await user.save();
      }
    }

    return issueSession(user, res);
  } catch (error) {
    next(error);
  }
};

export const saveProgress: RequestHandler = async (req, res, next) => {
  try {
    const { topicId, score, maxScore, elapsedTime, examId, subjectName } = req.body;
    const username = req.user!.username;

    if (!topicId) {
      return res.status(400).json({ status: 'error', message: 'topicId is required.' });
    }

    let status: ProgressStatus = 'red';
    const dynamicMaxScore = maxScore || 50;
    if (score >= (dynamicMaxScore * 0.8)) status = 'green';
    else if (score >= (dynamicMaxScore * 0.4)) status = 'yellow';

    const scopedExamId = examId ? String(examId).trim() : null;
    const scopedSubject = subjectName ? String(subjectName).trim() : null;

    const attemptFilter: { username: string; topicId: string; examId?: string } = { username, topicId };
    if (scopedExamId) attemptFilter.examId = scopedExamId;

    const existingCount = await Progress.countDocuments(attemptFilter);

    await Progress.create({
      username,
      examId: scopedExamId,
      subjectName: scopedSubject,
      topicId,
      score,
      maxScore: dynamicMaxScore,
      status,
      elapsedTime,
      attemptNumber: existingCount + 1,
      timestamp: new Date()
    });

    await touchLastStudyAt(req.user!.id);

    const updatedProgress = await Progress.find({ username }).lean();
    res.json({
      status: 'success',
      data: updatedProgress,
      lastStudyAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const saveMockProgress: RequestHandler = async (req, res, next) => {
  try {
    const {
      mockTestId, title, score, correct, wrong, blank, accuracy,
      elapsedTime, sectionTimes, examId
    } = req.body;
    const username = req.user!.username;

    const scopedExamId = examId ? String(examId).trim() : null;
    const attemptFilter: { username: string; mockTestId: string; examId?: string } = { username, mockTestId };
    if (scopedExamId) attemptFilter.examId = scopedExamId;

    const existingCount = await MockProgress.countDocuments(attemptFilter);

    await MockProgress.create({
      username,
      examId: scopedExamId,
      mockTestId,
      title,
      score,
      correct,
      wrong,
      blank,
      accuracy,
      elapsedTime,
      sectionTimes,
      attemptNumber: existingCount + 1,
      timestamp: new Date()
    });

    await touchLastStudyAt(req.user!.id);

    const updatedMockProgress = await MockProgress.find({ username }).lean();
    res.json({
      status: 'success',
      data: updatedMockProgress,
      lastStudyAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const username = req.user!.username;
    const [progress, mockProgress, dbUser] = await Promise.all([
      Progress.find({ username }).lean(),
      MockProgress.find({ username }).lean(),
      User.findById(req.user!.id).lean(),
    ]);

    const lastStudyAt = deriveLastStudyAt(progress, mockProgress, dbUser?.lastStudyAt ?? null);
    if (lastStudyAt && !dbUser?.lastStudyAt) {
      User.updateOne(
        { _id: req.user!.id },
        { $set: { lastStudyAt: new Date(lastStudyAt) } }
      ).catch(() => {});
    }

    res.json({
      status: 'success',
      data: publicUserPayload(
        {
          username,
          email: dbUser?.email || req.user!.email || null,
          displayName: dbUser?.displayName || null,
          emailVerified: Boolean(dbUser?.emailVerified),
          role: dbUser?.role || req.user!.role || 'user',
          lastStudyAt: dbUser?.lastStudyAt || lastStudyAt,
        },
        progress,
        mockProgress
      )
    });
  } catch (error) {
    next(error);
  }
};

async function issueSession(user: HydratedDocument<IUser>, res: Response, statusCode = 200) {
  const [progress, mockProgress] = await Promise.all([
    Progress.find({ username: user.username }).lean(),
    MockProgress.find({ username: user.username }).lean(),
  ]);
  const token = signToken(user);
  return res.status(statusCode).json({
    status: 'success',
    data: publicUserPayload(user, progress, mockProgress, token),
  });
}

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user!.id }, { $inc: { tokenVersion: 1 } });
    res.json({ status: 'success', message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/otp/request — resend verification code (pending register or existing user) */
export const requestOtp: RequestHandler = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Enter a valid email address.' });
    }

    const user = await User.findOne({ email }).lean();
    if (user?.emailVerified) {
      return res.json({
        status: 'success',
        message: 'Email already verified. Sign in with your password.',
        data: { email, alreadyVerified: true },
      });
    }

    // Pending registration keeps user data on the OTP challenge until verify.
    const pending = await OtpChallenge.findOne({ email, purpose: 'email_verify' })
      .sort({ expiresAt: -1 })
      .lean();
    const pendingData = pending?.pendingData || null;

    if (!user && !pendingData) {
      return res.json({
        status: 'success',
        message: 'If an account exists for that email, a verification code has been sent.',
        data: { email, mailSent: true },
      });
    }

    const { mail, debugOtp } = await createAndStoreOtp(email, 'email_verify', pendingData);
    res.json({
      status: 'success',
      message: mail.sent
        ? 'Verification OTP sent to your email.'
        : 'Could not deliver email. Use the on-screen code (local) or fix SMTP.',
      data: {
        email,
        mailSent: Boolean(mail.sent),
        ...(debugOtp ? { debugOtp } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/otp/verify — marks email verified only; login stays password/Google */
export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid email and 6-digit OTP are required.',
      });
    }

    const consumed = await consumeOtpChallenge(email, code, 'email_verify');
    if (!consumed.ok) {
      return res.status(consumed.status).json({
        status: 'error',
        message: consumed.message,
      });
    }

    let user = await User.findOne({ email });
    
    // If user doesn't exist, this was a registration verification. Create the user now.
    if (!user) {
      if (!isRecord(consumed.pendingData)) {
        return res.status(400).json({
          status: 'error',
          message: 'Registration data expired or invalid. Please register again.',
        });
      }
      const pending = consumed.pendingData;
      user = await User.create({
        username: String(pending.username || ''),
        email,
        password: typeof pending.password === 'string' ? pending.password : undefined,
        role: resolveRoleByEmail(email),
        emailVerified: true,
      });
    } else {
      user.emailVerified = true;
      if (resolveRoleByEmail(email) === 'admin') user.role = 'admin';
      await user.save();
    }

    res.json({
      status: 'success',
      message: 'Email verified. Sign in with your password.',
      data: { email, verified: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/password/forgot
 * Always returns a generic success message (no email enumeration).
 * Sends a password_reset OTP when an account exists for the email.
 */
export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Enter a valid email address.' });
    }

    // Identical response shape whether or not the email exists (no enumeration).
    const generic = {
      status: 'success',
      message: 'If an account exists for that email, a reset code has been sent.',
      data: { email, mailSent: true },
    };

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.json(generic);
    }

    const { debugOtp } = await createAndStoreOtp(email, 'password_reset');
    return res.json({
      ...generic,
      data: {
        ...generic.data,
        ...(debugOtp ? { debugOtp } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/password/reset
 * Body: { email, code, password }
 */
export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const password = req.body.password;

    if (!isValidEmail(email) || !/^\d{6}$/.test(code) || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, 6-digit OTP, and a new password are required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired reset code.',
      });
    }

    const consumed = await consumeOtpChallenge(email, code, 'password_reset');
    if (!consumed.ok) {
      return res.status(consumed.status).json({
        status: 'error',
        message: consumed.message,
      });
    }

    user.password = await hashPassword(password);
    user.emailVerified = true;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    if (resolveRoleByEmail(email) === 'admin') user.role = 'admin';
    await user.save();

    return res.json({
      status: 'success',
      message: 'Password updated. Sign in with your new password.',
      data: { email, reset: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/google
 * Body: { code } — GIS popup auth code (preferred)
 *    or { credential } — GIS ID token (legacy button)
 */
export const loginWithGoogle: RequestHandler = async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
      return res.status(503).json({
        status: 'error',
        message: 'Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing).',
      });
    }

    const { code, credential } = req.body || {};
    if (!code && !credential) {
      return res.status(400).json({
        status: 'error',
        message: 'Google code or credential is required.',
      });
    }

    let profile;
    try {
      profile = code
        ? await exchangeGoogleAuthCode(String(code))
        : await verifyGoogleIdToken(String(credential));
    } catch {
      return res.status(401).json({
        status: 'error',
        message: 'Google sign-in failed. Try again.',
      });
    }

    const user = await upsertUserFromEmail({
      email: profile.email,
      googleId: profile.googleId,
      displayName: profile.name,
      emailVerified: true,
    });
    return issueSession(user, res);
  } catch (error) {
    next(error);
  }
};

/** CSV export — self by default; admin can pass scope=all */
export const exportMockProgressCsv: RequestHandler = async (req, res, next) => {
  try {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const filter: { username?: string; examId?: string } = {};

    if (scope === 'all') {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
      }
    } else {
      filter.username = req.user!.username;
    }
    if (examId) filter.examId = examId;

    const rows = await MockProgress.find(filter).sort({ timestamp: -1 }).lean();
    const csv = mockProgressToCsv(rows);
    const who = scope === 'all' ? 'all' : req.user!.username;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mock-progress-${who}.csv"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
};

export const exportSyllabusProgressCsv: RequestHandler = async (req, res, next) => {
  try {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const filter: { username?: string; examId?: string } = {};

    if (scope === 'all') {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
      }
    } else {
      filter.username = req.user!.username;
    }
    if (examId) filter.examId = examId;

    const rows = await Progress.find(filter).sort({ timestamp: -1 }).lean();
    const csv = syllabusProgressToCsv(rows);
    const who = scope === 'all' ? 'all' : req.user!.username;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="syllabus-progress-${who}.csv"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
};

/** Institute snapshot for admin console */
export const getAdminSummary: RequestHandler = async (req, res, next) => {
  try {
    const [userCount, mockAttemptCount, syllabusAttemptCount] = await Promise.all([
      User.countDocuments(),
      MockProgress.countDocuments(),
      Progress.countDocuments(),
    ]);
    res.json({
      status: 'success',
      data: { userCount, mockAttemptCount, syllabusAttemptCount },
    });
  } catch (error) {
    next(error);
  }
};
