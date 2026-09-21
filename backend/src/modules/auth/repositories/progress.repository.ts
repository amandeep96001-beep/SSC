import Progress from '../progress.model.js';
import type { ProgressStatus } from '../../../types/domain.js';

export interface ProgressAttemptFilter {
  username: string;
  topicId: string;
  examId?: string;
}

export interface ProgressCreateData {
  username: string;
  examId?: string | null;
  subjectName?: string | null;
  topicId: string;
  score: number;
  maxScore: number;
  status: ProgressStatus;
  elapsedTime?: string;
  attemptNumber: number;
  timestamp: Date;
}

export interface ProgressListFilter {
  username?: string;
  examId?: string;
}

class ProgressRepository {
  async countAttempts(filter: ProgressAttemptFilter): Promise<number> {
    return Progress.countDocuments(filter);
  }

  async create(data: ProgressCreateData) {
    return Progress.create(data);
  }

  async findByUsername(username: string) {
    return Progress.find({ username }).lean();
  }

  async findFiltered(filter: ProgressListFilter) {
    return Progress.find(filter).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return Progress.countDocuments();
  }
}

export default new ProgressRepository();
