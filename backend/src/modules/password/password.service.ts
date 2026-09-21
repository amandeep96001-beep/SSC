import authRepository from '../auth/auth.repository.js';
import otpRepository from '../otp/otp.repository.js';
import { hashPassword } from '../../utils/password.js';
import {
  signPasswordResetToken,
  verifyPasswordResetToken,
  PASSWORD_RESET_TTL_SEC,
} from '../../utils/token.js';
import {
  normalizeEmail,
  isValidEmail,
  findUserByEmail,
  resolveRoleByEmail,
} from '../../utils/auth-identity.js';
import { OtpService } from '../otp/otp.service.js';
import type { PasswordResetVerifyData } from './password.interface.js';
import { badRequest, unauthorized } from '../../utils/app-errors.js';

interface ForgotPasswordResult {
  message: string;
  data: { email: string; mailSent: boolean; debugOtp?: string };
}

interface ResetPasswordResult {
  message: string;
  data: { email: string; reset: true };
}

function frontendOrigin(): string {
  return String(process.env.FRONTEND_URL || 'http://localhost:5173')
    .trim()
    .replace(/\/+$/, '');
}

function buildPasswordResetUrl(token: string): string {
  return `${frontendOrigin()}/?reset=${encodeURIComponent(token)}`;
}

export class PasswordService {
  constructor(private readonly otpService = new OtpService()) {}

  async forgotPassword(rawEmail: unknown): Promise<ForgotPasswordResult> {
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      throw badRequest('Enter a valid email address.');
    }

    const generic: ForgotPasswordResult = {
      message: 'If an account exists for that email, a reset code has been sent.',
      data: { email, mailSent: true },
    };

    const user = await findUserByEmail(email);
    if (!user?.email) return generic;

    const accountEmail = user.email;
    const { mail, debugOtp } = await this.otpService.createAndStoreOtp(accountEmail, 'password_reset');
    return {
      message: generic.message,
      data: {
        email: accountEmail,
        mailSent: Boolean(mail.sent),
        ...(debugOtp ? { debugOtp } : {}),
      },
    };
  }

  async verifyPasswordResetOtp(
    rawEmail: unknown,
    rawCode: unknown,
  ): Promise<{ message: string; data: PasswordResetVerifyData }> {
    const email = normalizeEmail(rawEmail);
    const code = String(rawCode || '').trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      throw badRequest('Valid email and 6-digit OTP are required.');
    }

    const user = await findUserByEmail(email);
    if (!user?.email) {
      throw unauthorized('Invalid or expired reset code.');
    }

    await this.otpService.consumeOtpChallenge(user.email, code, 'password_reset');

    const resetToken = signPasswordResetToken({
      _id: user._id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    return {
      message: 'Code verified. Open the secure link to choose a new password.',
      data: {
        email: user.email,
        verified: true,
        resetToken,
        resetUrl: buildPasswordResetUrl(resetToken),
        expiresIn: PASSWORD_RESET_TTL_SEC,
      },
    };
  }

  async resetPassword(rawToken: unknown, password: unknown): Promise<ResetPasswordResult> {
    const token = String(rawToken || '').trim();
    if (!token || !password) {
      throw badRequest('A valid reset link and a new password are required.');
    }

    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch {
      throw unauthorized('This reset link is invalid or has expired. Request a new code.');
    }

    const user = await authRepository.findById(payload.userId);
    if (!user?.email || normalizeEmail(user.email) !== normalizeEmail(payload.email)) {
      throw unauthorized('This reset link is invalid or has expired. Request a new code.');
    }

    if ((user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
      throw unauthorized('This reset link was already used. Request a new code if you still need to reset.');
    }

    user.password = await hashPassword(String(password));
    user.emailVerified = true;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    if (resolveRoleByEmail(user.email) === 'admin') user.role = 'admin';
    await authRepository.save(user);
    await otpRepository.deleteByEmailPurpose(user.email, 'password_reset');

    return {
      message: 'Password updated. Sign in with your new password.',
      data: { email: user.email, reset: true },
    };
  }
}

export const passwordService = new PasswordService();
