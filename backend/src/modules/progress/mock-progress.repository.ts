import MockProgress from './mock-progress.model.js';
import type {
  MockProgressAttemptFilter,
  MockProgressCreateData,
  MockProgressListFilter,
} from './progress.interface.js';

class MockProgressRepository {
  async countAttempts(filter: MockProgressAttemptFilter): Promise<number> {
    return MockProgress.countDocuments(filter);
  }

  async create(data: MockProgressCreateData) {
    return MockProgress.create(data);
  }

  async findByUsername(username: string) {
    return MockProgress.find({ username }).lean();
  }

  async findFiltered(filter: MockProgressListFilter) {
    return MockProgress.find(filter).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return MockProgress.countDocuments();
  }
}

export default new MockProgressRepository();
