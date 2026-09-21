import Progress from './progress.model.js';
import type {
  ProgressAttemptFilter,
  ProgressCreateData,
  ProgressListFilter,
} from './progress.interface.js';

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
