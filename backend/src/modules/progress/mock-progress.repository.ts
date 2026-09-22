import MockProgress from './mock-progress.model.js';
import type {
  MockProgressAttemptFilter,
  MockProgressCreateData,
  MockProgressListFilter,
} from './progress.interface.js';

const SESSION_MOCK_PROGRESS_LIMIT = Number(process.env.SESSION_MOCK_PROGRESS_LIMIT || 30);

class MockProgressRepository {
  async countAttempts(filter: MockProgressAttemptFilter): Promise<number> {
    return MockProgress.countDocuments({
      userId: filter.userId,
      mockTestId: filter.mockTestId,
      ...(filter.examId ? { examId: filter.examId } : {}),
    });
  }

  async create(data: MockProgressCreateData) {
    return MockProgress.create(data);
  }

  async findByUserId(userId: string, limit = SESSION_MOCK_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 2000);
    return MockProgress.find({ userId })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  /** @deprecated Prefer findByUserId — kept for migration dual-read. */
  async findByUsername(username: string, limit = SESSION_MOCK_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 2000);
    return MockProgress.find({ username })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  async findFiltered(filter: MockProgressListFilter) {
    const query: Record<string, unknown> = {};
    if (filter.userId) query.userId = filter.userId;
    else if (filter.username) query.username = filter.username;
    if (filter.examId) query.examId = filter.examId;
    return MockProgress.find(query).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return MockProgress.countDocuments();
  }

  async findPageByUserId(userId: string, opts: { limit: number; before?: Date }) {
    const query: Record<string, unknown> = { userId };
    if (opts.before) query.timestamp = { $lt: opts.before };
    return MockProgress.find(query)
      .sort({ timestamp: -1 })
      .limit(opts.limit)
      .lean();
  }
}

export default new MockProgressRepository();
