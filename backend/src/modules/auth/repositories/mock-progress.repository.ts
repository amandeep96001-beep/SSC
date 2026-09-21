import MockProgress from '../mock-progress.model.js';

export interface MockProgressAttemptFilter {
  username: string;
  mockTestId: string;
  examId?: string;
}

export interface MockProgressCreateData {
  username: string;
  examId?: string | null;
  mockTestId: string;
  title: string;
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
  elapsedTime?: string;
  sectionTimes?: Record<string, unknown> | null;
  attemptNumber: number;
  timestamp: Date;
}

export interface MockProgressListFilter {
  username?: string;
  examId?: string;
}

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
