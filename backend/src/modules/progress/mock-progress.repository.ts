import MockProgress from './mock-progress.model.js';
import type {
  MockProgressAttemptFilter,
  MockProgressCreateData,
  MockProgressListFilter,
} from './progress.interface.js';

const SESSION_MOCK_PROGRESS_LIMIT = Number(process.env.SESSION_MOCK_PROGRESS_LIMIT || 500);

class MockProgressRepository {
  async countAttempts(filter: MockProgressAttemptFilter): Promise<number> {
    return MockProgress.countDocuments(filter);
  }

  async create(data: MockProgressCreateData) {
    return MockProgress.create(data);
  }

  async findByUsername(username: string, limit = SESSION_MOCK_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 2000);
    return MockProgress.find({ username })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  async findFiltered(filter: MockProgressListFilter) {
    return MockProgress.find(filter).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return MockProgress.countDocuments();
  }
}

export default new MockProgressRepository();
