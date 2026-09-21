import otpRepository from '../repositories/otp.repository.js';
import { sendOtpEmail } from '../mail.util.js';
import {
  generateOtpCode,
  hashOtpCode,
  otpHashesMatch,
} from '../authIdentity.util.js';
import type { OtpPurpose } from '../../../types/domain.js';
import type { OtpCreateResult } from '../auth.types.js';
import { unauthorized, tooManyRequests } from '../../../shared/errors/http-error.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export interface ConsumeOtpResult {
  pendingData: unknown;
}

export async function createAndStoreOtp(
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

export async function consumeOtpChallenge(
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
