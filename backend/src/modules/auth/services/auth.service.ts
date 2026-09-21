import userRepository from '../repositories/user.repository.js';
import progressRepository from '../repositories/progress.repository.js';
import mockProgressRepository from '../repositories/mock-progress.repository.js';
import { hashPassword, verifyPassword, isLegacyHash } from '../password.util.js';
import { signToken } from '../token.util.js';
import {
  normalizeEmail,
  isValidEmail,
  findUserByEmail,
  allocateUsername,
  resolveRoleByEmail,
} from '../authIdentity.util.js';
import { createAndStoreOtp } from './otp.service.js';
import { publicUserPayload, deriveLastStudyAt } from '../auth.helpers.js';
import type { UserDoc } from '../repositories/user.repository.js';
import type {
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
  SessionFallback,
} from '../auth.types.js';
import {
  badRequest,
  conflict,
  unauthorized,
} from '../../../shared/errors/http-error.js';
import type { PublicUserPayload } from '../../../types/domain.js';

function resolveRole(email: string | null | undefined): 'user' | 'admin' {
  return email ? resolveRoleByEmail(normalizeEmail(email)) : 'user';
}

export async function buildSessionPayload(user: UserDoc): Promise<PublicUserPayload> {
  const [progress, mockProgress] = await Promise.all([
    progressRepository.findByUsername(user.username),
    mockProgressRepository.findByUsername(user.username),
  ]);
  const token = signToken(user);
  return publicUserPayload(user, progress, mockProgress, token);
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const { password } = input;
  const email = normalizeEmail(input.email);
  let username = String(input.username || '').trim();

  if (!email || !isValidEmail(email) || !password) {
    throw badRequest('Email and password are required.');
  }

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw conflict('An account with this email already exists. Sign in instead.');
  }

  if (!username) {
    username = await allocateUsername(email.split('@')[0]);
  } else {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw conflict('Username is already taken. Choose another.');
    }
  }

  const hashed = await hashPassword(String(password));
  const role = resolveRole(email);
  const pendingData = { username, password: hashed, role };

  const { mail, debugOtp } = await createAndStoreOtp(email, 'email_verify', pendingData);

  return {
    message: mail.sent
      ? 'Account created. Enter the OTP sent to your email to verify.'
      : 'Account created. We could not deliver email — use the code shown on screen (local debug) or check SMTP settings.',
    data: {
      needsVerification: true,
      email,
      mailSent: Boolean(mail.sent),
      ...(debugOtp ? { debugOtp } : {}),
    },
    statusCode: 201,
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const { password } = input;
  const identifier = String(input.username || input.email || '').trim();
  if (!identifier || !password) {
    throw badRequest('Email/username and password are required.');
  }

  const user = isValidEmail(identifier)
    ? await findUserByEmail(identifier)
    : await userRepository.findByUsername(identifier);

  if (!user || !user.password) {
    throw unauthorized('Invalid email/username or password.');
  }

  const matched = await verifyPassword(String(password), user.password);
  if (!matched) {
    throw unauthorized('Invalid email/username or password.');
  }

  if (user.email && !user.emailVerified && !user.googleId) {
    const { mail, debugOtp } = await createAndStoreOtp(user.email, 'email_verify');
    return {
      message: mail.sent
        ? 'Verify your email with the OTP we sent, then sign in with your password.'
        : 'Verify your email — we could not deliver mail; use the on-screen code (local) or fix SMTP.',
      data: {
        needsVerification: true,
        email: user.email,
        mailSent: Boolean(mail.sent),
        ...(debugOtp ? { debugOtp } : {}),
      },
      session: null,
    };
  }

  if (isLegacyHash(user.password)) {
    user.password = await hashPassword(String(password));
    await userRepository.save(user);
  }

  if (process.env.ADMIN_EMAIL?.trim() && user.email) {
    const expected = resolveRoleByEmail(user.email);
    if (user.role !== expected) {
      user.role = expected;
      await userRepository.save(user);
    }
  }

  return {
    data: await buildSessionPayload(user),
    session: true,
  };
}

export async function getMe(
  userId: string,
  username: string,
  fallback?: SessionFallback,
): Promise<PublicUserPayload> {
  const [progress, mockProgress, dbUser] = await Promise.all([
    progressRepository.findByUsername(username),
    mockProgressRepository.findByUsername(username),
    userRepository.findByIdLean(userId),
  ]);

  const lastStudyAt = deriveLastStudyAt(progress, mockProgress, dbUser?.lastStudyAt ?? null);
  if (lastStudyAt && !dbUser?.lastStudyAt) {
    userRepository.setLastStudyAtIfMissing(userId, lastStudyAt).catch(() => {});
  }

  return publicUserPayload(
    {
      username,
      email: dbUser?.email || fallback?.email || null,
      displayName: dbUser?.displayName || null,
      emailVerified: Boolean(dbUser?.emailVerified),
      role: dbUser?.role || fallback?.role || 'user',
      lastStudyAt: dbUser?.lastStudyAt || lastStudyAt,
    },
    progress,
    mockProgress,
  );
}

export async function logout(userId: string): Promise<{ message: string }> {
  await userRepository.bumpTokenVersion(userId);
  return { message: 'Signed out.' };
}
