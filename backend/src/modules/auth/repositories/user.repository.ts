import User from '../user.model.js';
import type { IUser } from '../user.model.js';
import type { HydratedDocument } from 'mongoose';
import { emailAliases, normalizeEmail } from '../email.util.js';

export type UserDoc = HydratedDocument<IUser>;

class UserRepository {
  async findById(id: string) {
    return User.findById(id);
  }

  async findByIdLean(id: string) {
    return User.findById(id).lean();
  }

  async findByUsername(username: string) {
    return User.findOne({ username });
  }

  async findByEmail(raw: unknown) {
    const aliases = emailAliases(raw);
    if (!aliases.length) return null;
    return User.findOne({ email: { $in: aliases } });
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

  async bumpTokenVersion(userId: string) {
    return User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
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

export default new UserRepository();
