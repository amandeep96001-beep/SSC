import authRepository from './auth.repository.js';
import progressRepository from '../progress/progress.repository.js';
import mockProgressRepository from '../progress/mock-progress.repository.js';
import { hashPassword, verifyPassword, isLegacyHash } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';
import {
  normalizeEmail,
  isValidEmail,
  findUserByEmail,
  allocateUsername,
  resolveRoleByEmail,
  upsertUserFromEmail,
} from '../../utils/auth-identity.js';
import { OtpService } from '../otp/otp.service.js';
import { publicUserPayload, deriveLastStudyAt } from './auth.helpers.js';
import { verifyGoogleIdToken, exchangeGoogleAuthCode } from './google.util.js';
import type { UserDoc } from './auth.repository.js';
import type {
  GoogleAuthInput,
  GoogleLoginResult,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
  SessionFallback,
} from './auth.interface.js';
import {
  badRequest,
  conflict,
  unauthorized,
  serviceUnavailable,
} from '../../utils/app-errors.js';
import type { PublicUserPayload } from '../../types/domain.js';

function resolveRole(email: string | null | undefined): 'user' | 'admin' {
  return email ? resolveRoleByEmail(normalizeEmail(email)) : 'user';
}

export class AuthService {
  constructor(private readonly otpService = new OtpService()) {}

  async buildSessionPayload(user: UserDoc): Promise<PublicUserPayload> {
    const [progress, mockProgress] = await Promise.all([
      progressRepository.findByUsername(user.username),
      mockProgressRepository.findByUsername(user.username),
    ]);
    const token = signToken(user);
    return publicUserPayload(user, progress, mockProgress, token);
  }

  async register(input: RegisterInput): Promise<RegisterResult> {
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
      const existingUser = await authRepository.findByUsername(username);
      if (existingUser) {
        throw conflict('Username is already taken. Choose another.');
      }
    }

    const hashed = await hashPassword(String(password));
    const role = resolveRole(email);
    const pendingData = { username, password: hashed, role };

    const { mail, debugOtp } = await this.otpService.createAndStoreOtp(
      email,
      'email_verify',
      pendingData,
    );

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

  async login(input: LoginInput): Promise<LoginResult> {
    const { password } = input;
    const identifier = String(input.username || input.email || '').trim();
    if (!identifier || !password) {
      throw badRequest('Email/username and password are required.');
    }

    const user = isValidEmail(identifier)
      ? await findUserByEmail(identifier)
      : await authRepository.findByUsername(identifier);

    if (!user || !user.password) {
      throw unauthorized('Invalid email/username or password.');
    }

    const matched = await verifyPassword(String(password), user.password);
    if (!matched) {
      throw unauthorized('Invalid email/username or password.');
    }

    if (user.email && !user.emailVerified && !user.googleId) {
      const { mail, debugOtp } = await this.otpService.createAndStoreOtp(user.email, 'email_verify');
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
      await authRepository.save(user);
    }

    if (process.env.ADMIN_EMAIL?.trim() && user.email) {
      const expected = resolveRoleByEmail(user.email);
      if (user.role !== expected) {
        user.role = expected;
        await authRepository.save(user);
      }
    }

    return {
      data: await this.buildSessionPayload(user),
      session: true,
    };
  }

  async getMe(
    userId: string,
    username: string,
    fallback?: SessionFallback,
  ): Promise<PublicUserPayload> {
    const [progress, mockProgress, dbUser] = await Promise.all([
      progressRepository.findByUsername(username),
      mockProgressRepository.findByUsername(username),
      authRepository.findByIdLean(userId),
    ]);

    const lastStudyAt = deriveLastStudyAt(progress, mockProgress, dbUser?.lastStudyAt ?? null);
    if (lastStudyAt && !dbUser?.lastStudyAt) {
      authRepository.setLastStudyAtIfMissing(userId, lastStudyAt).catch(() => {});
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

  async logout(userId: string): Promise<{ message: string }> {
    await authRepository.bumpTokenVersion(userId);
    return { message: 'Signed out.' };
  }

  async loginWithGoogle(input: GoogleAuthInput): Promise<GoogleLoginResult> {
    if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
      throw serviceUnavailable('Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing).');
    }

    const { code, credential } = input || {};
    if (!code && !credential) {
      throw badRequest('Google code or credential is required.');
    }

    if (code && !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
      throw serviceUnavailable('Google code sign-in is unavailable. Use the Google button (ID token) instead.');
    }

    let profile;
    try {
      profile = credential
        ? await verifyGoogleIdToken(String(credential))
        : await exchangeGoogleAuthCode(String(code));
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      if (detail.includes('GOOGLE_CLIENT_SECRET')) {
        throw serviceUnavailable('Google code sign-in is unavailable on this server.');
      }
      if (detail.includes('not verified')) {
        throw unauthorized('Your Google email is not verified. Verify it with Google, then try again.');
      }
      throw unauthorized('Google sign-in failed. Try again.');
    }

    const user = await upsertUserFromEmail({
      email: profile.email,
      googleId: profile.googleId,
      displayName: profile.name,
      emailVerified: true,
    });

    return { data: await this.buildSessionPayload(user) };
  }
}

export const authService = new AuthService();
