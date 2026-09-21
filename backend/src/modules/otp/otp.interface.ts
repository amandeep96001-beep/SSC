import type { OtpPurpose } from '../../types/domain.js';

export interface IOtpChallenge {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  pendingData?: unknown;
}

export interface OtpCreateResult {
  code: string;
  mail: { sent: boolean };
  debugOtp?: string;
}

export interface ConsumeOtpResult {
  pendingData: unknown;
}
