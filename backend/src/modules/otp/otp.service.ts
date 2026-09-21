import otpRepository from './otp.repository.js';
import authRepository from '../auth/auth.repository.js';
import { sendOtpEmail } from '../../utils/mail.js';
import {
  generateOtpCode,
  hashOtpCode,
  otpHashesMatch,
  normalizeEmail,
  isValidEmail,
  findUserByEmail,
  resolveRoleByEmail,
} from '../../utils/auth-identity.js';
import { isRecord } from '../../types/domain.js';
import type { OtpPurpose } from '../../types/domain.js';
import type { ConsumeOtpResult, OtpCreateResult } from './otp.interface.js';
import { badRequest, unauthorized, tooManyRequests } from '../../utils/app-errors.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export class OtpService {
  async createAndStoreOtp(
    email: string,
    purpose: OtpPurpose = 'email_verify',
    pendingData: unknown = null,
  ): Promise<OtpCreateResult> {
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await otpRepository.deleteByEmailPurpose(email, purpose);
    await otpRepository.create({
      email,
      purpose,
      codeHash,
      expiresAt,
      attempts: 0,
      pendingData,
    });

    const mail = await sendOtpEmail(email, code, { purpose });
    const debugOtp =
      process.env.SMTP_DEBUG === '1' && process.env.NODE_ENV !== 'production' && !mail.sent
        ? code
        : undefined;

    return { code, mail, debugOtp };
  }

  async consumeOtpChallenge(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<ConsumeOtpResult> {
    const challenge = await otpRepository.findLatest(email, purpose);

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      throw unauthorized('OTP expired. Request a new code.');
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await otpRepository.deleteByEmailPurpose(email, purpose);
      throw tooManyRequests('Too many incorrect attempts. Request a new code.');
    }

    if (!otpHashesMatch(challenge.codeHash, hashOtpCode(code))) {
      challenge.attempts += 1;
      await challenge.save();
      throw unauthorized('Incorrect OTP. Try again.');
    }

    await otpRepository.deleteByEmailPurpose(email, purpose);
    return { pendingData: challenge.pendingData };
  }

  async requestOtp(rawEmail: unknown) {
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      throw badRequest('Enter a valid email address.');
    }

    const user = await findUserByEmail(email);
    const accountEmail = user?.email || email;
    if (user?.emailVerified) {
      return {
        message: 'Email already verified. Sign in with your password.',
        data: { email: accountEmail, alreadyVerified: true },
      };
    }

    const pending = await otpRepository.findLatestLean(email, 'email_verify');
    const pendingData = pending?.pendingData || null;
    const otpEmail = pending?.email || accountEmail;

    if (!user && !pendingData) {
      return {
        message: 'If an account exists for that email, a verification code has been sent.',
        data: { email, mailSent: true },
      };
    }

    const { mail, debugOtp } = await this.createAndStoreOtp(otpEmail, 'email_verify', pendingData);
    return {
      message: mail.sent
        ? 'Verification OTP sent to your email.'
        : 'Could not deliver email. Use the on-screen code (local) or fix SMTP.',
      data: {
        email: otpEmail,
        mailSent: Boolean(mail.sent),
        ...(debugOtp ? { debugOtp } : {}),
      },
    };
  }

  async verifyOtp(rawEmail: unknown, rawCode: unknown) {
    const email = normalizeEmail(rawEmail);
    const code = String(rawCode || '').trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      throw badRequest('Valid email and 6-digit OTP are required.');
    }

    const consumed = await this.consumeOtpChallenge(email, code, 'email_verify');
    let user = await findUserByEmail(email);

    if (!user) {
      if (!isRecord(consumed.pendingData)) {
        throw badRequest('Registration data expired or invalid. Please register again.');
      }
      const pending = consumed.pendingData;
      user = await authRepository.create({
        username: String(pending.username || ''),
        email,
        password: typeof pending.password === 'string' ? pending.password : undefined,
        role: resolveRoleByEmail(email),
        emailVerified: true,
      });
    } else {
      user.emailVerified = true;
      if (resolveRoleByEmail(email) === 'admin') user.role = 'admin';
      await authRepository.save(user);
    }

    return {
      message: 'Email verified. Sign in with your password.',
      data: { email, verified: true },
    };
  }
}

export const otpService = new OtpService();
