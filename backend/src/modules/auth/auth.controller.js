import User from './user.model.js';
import MockProgress from './mock-progress.model.js';
import Progress from './progress.model.js';
import OtpChallenge from './otp.model.js';
import { hashPassword, verifyPassword, isLegacyHash } from './password.util.js';
import { signToken } from './token.util.js';
import { sendOtpEmail } from './mail.util.js';
import { verifyGoogleIdToken } from './google.util.js';
import {
  normalizeEmail,
  isValidEmail,
  upsertUserFromEmail,
  hashOtpCode,
  generateOtpCode,
  allocateUsername,
  resolveRoleByEmail,
} from './authIdentity.util.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function publicUserPayload(user, progress = [], mockProgress = [], token = null) {
  const payload = {
    username: user.username,
    email: user.email || null,
    displayName: user.displayName || null,
    emailVerified: Boolean(user.emailVerified),
    role: user.role || 'user',
    progress,
    mockProgress
  };
  if (token) payload.token = token;
  return payload;
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function mockProgressToCsv(rows) {
  const cols = [
    'username', 'examId', 'title', 'score', 'correct', 'wrong', 'blank',
    'accuracy', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    if (c === 'timestamp') return csvEscape(r.timestamp ? new Date(r.timestamp).toISOString() : '');
    return csvEscape(r[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

function syllabusProgressToCsv(rows) {
  const cols = [
    'username', 'examId', 'topicId', 'subjectName', 'score', 'maxScore',
    'status', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    if (c === 'timestamp') return csvEscape(r.timestamp ? new Date(r.timestamp).toISOString() : '');
    return csvEscape(r[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

function resolveRole(username, adminCode, email) {
  const byEmail = email ? resolveRoleByEmail(normalizeEmail(email)) : 'user';
  if (byEmail === 'admin') return 'admin';
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const code = process.env.ADMIN_CODE || 'examprep-admin';
  if (String(username).trim().toLowerCase() === adminUser) return 'admin';
  if (adminCode && String(adminCode) === code) return 'admin';
  return 'user';
}

async function createAndStoreOtp(email) {
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await OtpChallenge.deleteMany({ email });
  await OtpChallenge.create({ email, codeHash, expiresAt, attempts: 0 });
  const mail = await sendOtpEmail(email, code);
  return { code, mail };
}

export const register = async (req, res, next) => {
  try {
    const { password, adminCode } = req.body;
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
    const role = resolveRole(username, adminCode, email);
    await User.create({
      username,
      email,
      password: hashed,
      role,
      emailVerified: false,
    });

    const { mail } = await createAndStoreOtp(email);
    const payload = {
      status: 'success',
      message: mail.sent
        ? 'Account created. Enter the OTP sent to your email to verify.'
        : 'Account created. Enter the OTP to verify your email.',
      data: {
        needsVerification: true,
        email,
      },
    };
    if (mail.debugOtp) payload.data.debugOtp = mail.debugOtp;
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
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
      const { mail } = await createAndStoreOtp(user.email);
      const payload = {
        status: 'success',
        message: 'Verify your email with the OTP we sent, then sign in with your password.',
        data: {
          needsVerification: true,
          email: user.email,
        },
      };
      if (mail.debugOtp) payload.data.debugOtp = mail.debugOtp;
      return res.json(payload);
    }

    if (isLegacyHash(user.password)) {
      user.password = await hashPassword(password);
      await user.save();
    }

    // Keep admin in sync with ADMIN_EMAIL
    if (user.email && resolveRoleByEmail(user.email) === 'admin' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    return issueSession(user, res);
  } catch (error) {
    next(error);
  }
};

export const saveProgress = async (req, res, next) => {
  try {
    const { topicId, score, maxScore, elapsedTime, examId, subjectName } = req.body;
    const username = req.user.username;

    if (!topicId) {
      return res.status(400).json({ status: 'error', message: 'topicId is required.' });
    }

    let status = 'red';
    const dynamicMaxScore = maxScore || 50;
    if (score >= (dynamicMaxScore * 0.8)) status = 'green';
    else if (score >= (dynamicMaxScore * 0.4)) status = 'yellow';

    const scopedExamId = examId ? String(examId).trim() : null;
    const scopedSubject = subjectName ? String(subjectName).trim() : null;

    const attemptFilter = { username, topicId };
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

    const updatedProgress = await Progress.find({ username }).lean();
    res.json({ status: 'success', data: updatedProgress });
  } catch (error) {
    next(error);
  }
};

export const saveMockProgress = async (req, res, next) => {
  try {
    const {
      mockTestId, title, score, correct, wrong, blank, accuracy,
      elapsedTime, sectionTimes, examId
    } = req.body;
    const username = req.user.username;

    const scopedExamId = examId ? String(examId).trim() : null;
    const attemptFilter = { username, mockTestId };
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

    const updatedMockProgress = await MockProgress.find({ username }).lean();
    res.json({ status: 'success', data: updatedMockProgress });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const username = req.user.username;
    const [progress, mockProgress, dbUser] = await Promise.all([
      Progress.find({ username }).lean(),
      MockProgress.find({ username }).lean(),
      User.findById(req.user.id).lean(),
    ]);

    res.json({
      status: 'success',
      data: publicUserPayload(
        {
          username,
          email: dbUser?.email || req.user.email || null,
          displayName: dbUser?.displayName || null,
          role: req.user.role || 'user',
        },
        progress,
        mockProgress
      )
    });
  } catch (error) {
    next(error);
  }
};

async function issueSession(user, res, statusCode = 200) {
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

/** POST /auth/otp/request — resend verification code (not login) */
export const requestOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Enter a valid email address.' });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found for this email. Register first.',
      });
    }

    if (user.emailVerified) {
      return res.json({
        status: 'success',
        message: 'Email already verified. Sign in with your password.',
        data: { email, alreadyVerified: true },
      });
    }

    const { mail } = await createAndStoreOtp(email);
    const payload = {
      status: 'success',
      message: mail.sent
        ? 'Verification OTP sent to your email.'
        : 'Verification OTP generated (check server logs if email failed).',
      data: { email },
    };
    if (mail.debugOtp) payload.data.debugOtp = mail.debugOtp;
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

/** POST /auth/otp/verify — marks email verified only; login stays password/Google */
export const verifyOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid email and 6-digit OTP are required.',
      });
    }

    const challenge = await OtpChallenge.findOne({ email }).sort({ expiresAt: -1 });
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({
        status: 'error',
        message: 'OTP expired. Request a new code.',
      });
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await OtpChallenge.deleteMany({ email });
      return res.status(429).json({
        status: 'error',
        message: 'Too many incorrect attempts. Request a new code.',
      });
    }

    const ok = challenge.codeHash === hashOtpCode(code);
    if (!ok) {
      challenge.attempts += 1;
      await challenge.save();
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect OTP. Try again.',
      });
    }

    await OtpChallenge.deleteMany({ email });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found for this email.',
      });
    }

    user.emailVerified = true;
    if (resolveRoleByEmail(email) === 'admin') user.role = 'admin';
    await user.save();

    res.json({
      status: 'success',
      message: 'Email verified. Sign in with your password.',
      data: { email, verified: true },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/google */
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        status: 'error',
        message: 'Google credential is required.',
      });
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(credential);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: err.message || 'Google sign-in failed.',
      });
    }

    const user = await upsertUserFromEmail({
      email: profile.email,
      googleId: profile.googleId,
      displayName: profile.name,
    });
    return issueSession(user, res);
  } catch (error) {
    next(error);
  }
};

/** CSV export — self by default; admin can pass scope=all */
export const exportMockProgressCsv = async (req, res, next) => {
  try {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const filter = {};

    if (scope === 'all') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
      }
    } else {
      filter.username = req.user.username;
    }
    if (examId) filter.examId = examId;

    const rows = await MockProgress.find(filter).sort({ timestamp: -1 }).lean();
    const csv = mockProgressToCsv(rows);
    const who = scope === 'all' ? 'all' : req.user.username;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mock-progress-${who}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportSyllabusProgressCsv = async (req, res, next) => {
  try {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const filter = {};

    if (scope === 'all') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
      }
    } else {
      filter.username = req.user.username;
    }
    if (examId) filter.examId = examId;

    const rows = await Progress.find(filter).sort({ timestamp: -1 }).lean();
    const csv = syllabusProgressToCsv(rows);
    const who = scope === 'all' ? 'all' : req.user.username;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="syllabus-progress-${who}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/** Institute snapshot for admin console */
export const getAdminSummary = async (req, res, next) => {
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
