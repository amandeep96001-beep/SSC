import User from './auth.model.js';
import type { IUser } from './auth.interface.js';
import type { HydratedDocument } from 'mongoose';
import { emailAliases, normalizeEmail } from '../../utils/email.js';

export type UserDoc = HydratedDocument<IUser>;

class AuthRepository {
  async findById(id: string) {
    return User.findById(id);
  }

  async findByIdLean(id: string, projection?: Record<string, 0 | 1>) {
    const q = User.findById(id);
    if (projection) q.select(projection);
    return q.lean();
  }

  async findByUsername(username: string) {
    return User.findOne({ username });
  }

  async findByUsernameWithPassword(username: string) {
    return User.findOne({ username }).select('+password');
  }

  async findByEmail(raw: unknown) {
    const aliases = emailAliases(raw);
    if (!aliases.length) return null;
    return User.findOne({ email: { $in: aliases } });
  }

  async findByEmailWithPassword(raw: unknown) {
    const aliases = emailAliases(raw);
    if (!aliases.length) return null;
    return User.findOne({ email: { $in: aliases } }).select('+password');
  }

  async findByEmailOrGoogleId(email: string, googleId?: string | null) {
    const normalized = normalizeEmail(email);
    return User.findOne({
      $or: [
        { email: { $in: emailAliases(normalized) } },
        ...(googleId ? [{ googleId: String(googleId) }] : []),
      ],
    });
  }

  async existsByUsername(username: string) {
    return User.exists({ username });
  }

  async create(data: Partial<IUser>) {
    return User.create(data);
  }

  async save(user: UserDoc) {
    return user.save();
  }

  async touchLastStudyAt(userId: string | undefined) {
    if (!userId) return;
    try {
      await User.updateOne({ _id: userId }, { $set: { lastStudyAt: new Date() } });
    } catch {
      /* non-critical */
    }
  }

  async bumpTokenVersion(userId: string): Promise<number> {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } },
      { new: true, select: 'tokenVersion' },
    ).lean();
    const { invalidateAuthUser } = await import('../../infra/auth-cache.js');
    await invalidateAuthUser(userId);
    return updated?.tokenVersion ?? 0;
  }

  async setLastStudyAtIfMissing(userId: string, lastStudyAt: string) {
    return User.updateOne(
      { _id: userId },
      { $set: { lastStudyAt: new Date(lastStudyAt) } },
    );
  }

  async countAll() {
    return User.countDocuments();
  }
}

export default new AuthRepository();
