import userRepository from '../repositories/user.repository.js';
import otpRepository from '../repositories/otp.repository.js';
import {
  normalizeEmail,
  isValidEmail,
  findUserByEmail,
  resolveRoleByEmail,
} from '../authIdentity.util.js';
import { isRecord } from '../../../types/domain.js';
import { createAndStoreOtp, consumeOtpChallenge } from './otp.service.js';
import { badRequest } from '../../../shared/errors/http-error.js';

export async function requestOtp(rawEmail: unknown) {
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

  const { mail, debugOtp } = await createAndStoreOtp(otpEmail, 'email_verify', pendingData);
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

export async function verifyOtp(rawEmail: unknown, rawCode: unknown) {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || '').trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    throw badRequest('Valid email and 6-digit OTP are required.');
  }

  const consumed = await consumeOtpChallenge(email, code, 'email_verify');

  let user = await findUserByEmail(email);

  if (!user) {
    if (!isRecord(consumed.pendingData)) {
      throw badRequest('Registration data expired or invalid. Please register again.');
    }
    const pending = consumed.pendingData;
    user = await userRepository.create({
      username: String(pending.username || ''),
      email,
      password: typeof pending.password === 'string' ? pending.password : undefined,
      role: resolveRoleByEmail(email),
      emailVerified: true,
    });
  } else {
    user.emailVerified = true;
    if (resolveRoleByEmail(email) === 'admin') user.role = 'admin';
    await userRepository.save(user);
  }

  return {
    message: 'Email verified. Sign in with your password.',
    data: { email, verified: true },
  };
}
