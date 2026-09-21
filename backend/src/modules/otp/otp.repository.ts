import OtpChallenge from './otp.model.js';
import type { OtpPurpose } from '../../types/domain.js';
import { emailAliases } from '../../utils/email.js';

class OtpRepository {
  async deleteByEmailPurpose(email: string, purpose: OtpPurpose) {
    const aliases = emailAliases(email);
    return OtpChallenge.deleteMany({ email: { $in: aliases }, purpose });
  }

  async create(data: {
    email: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    attempts?: number;
    pendingData?: unknown;
  }) {
    return OtpChallenge.create({
      ...data,
      attempts: data.attempts ?? 0,
    });
  }

  async findLatest(email: string, purpose: OtpPurpose) {
    const aliases = emailAliases(email);
    return OtpChallenge.findOne({ email: { $in: aliases }, purpose }).sort({ expiresAt: -1 });
  }

  async findLatestLean(email: string, purpose: OtpPurpose) {
    const aliases = emailAliases(email);
    return OtpChallenge.findOne({ email: { $in: aliases }, purpose })
      .sort({ expiresAt: -1 })
      .lean();
  }
}

export default new OtpRepository();
