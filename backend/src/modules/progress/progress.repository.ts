import Progress from './progress.model.js';
import type {
  ProgressAttemptFilter,
  ProgressCreateData,
  ProgressListFilter,
} from './progress.interface.js';

/** Cap session payloads so multi-year power users don't blow login/me responses. */
const SESSION_PROGRESS_LIMIT = Number(process.env.SESSION_PROGRESS_LIMIT || 50);

class ProgressRepository {
  async countAttempts(filter: ProgressAttemptFilter): Promise<number> {
    return Progress.countDocuments({
      userId: filter.userId,
      topicId: filter.topicId,
      ...(filter.examId ? { examId: filter.examId } : {}),
    });
  }

  async create(data: ProgressCreateData) {
    return Progress.create(data);
  }

  async findByUserId(userId: string, limit = SESSION_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 5000);
    return Progress.find({ userId })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  /** @deprecated Prefer findByUserId — kept for migration dual-read. */
  async findByUsername(username: string, limit = SESSION_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 5000);
    return Progress.find({ username })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  async findFiltered(filter: ProgressListFilter) {
    const query: Record<string, unknown> = {};
    if (filter.userId) query.userId = filter.userId;
    else if (filter.username) query.username = filter.username;
    if (filter.examId) query.examId = filter.examId;
    return Progress.find(query).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return Progress.countDocuments();
  }

  async findPageByUserId(userId: string, opts: { limit: number; before?: Date }) {
    const query: Record<string, unknown> = { userId };
    if (opts.before) query.timestamp = { $lt: opts.before };
    return Progress.find(query)
      .sort({ timestamp: -1 })
      .limit(opts.limit)
      .lean();
  }
}

export default new ProgressRepository();
