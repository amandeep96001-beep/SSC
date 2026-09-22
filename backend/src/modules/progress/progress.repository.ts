import Progress from './progress.model.js';
import type {
  ProgressAttemptFilter,
  ProgressCreateData,
  ProgressListFilter,
} from './progress.interface.js';

/** Cap session payloads so multi-year power users don't blow login/me responses. */
const SESSION_PROGRESS_LIMIT = Number(process.env.SESSION_PROGRESS_LIMIT || 1500);

class ProgressRepository {
  async countAttempts(filter: ProgressAttemptFilter): Promise<number> {
    return Progress.countDocuments(filter);
  }

  async create(data: ProgressCreateData) {
    return Progress.create(data);
  }

  async findByUsername(username: string, limit = SESSION_PROGRESS_LIMIT) {
    const capped = Math.min(Math.max(1, limit), 5000);
    return Progress.find({ username })
      .sort({ timestamp: -1 })
      .limit(capped)
      .lean();
  }

  async findFiltered(filter: ProgressListFilter) {
    return Progress.find(filter).sort({ timestamp: -1 }).lean();
  }

  async countAll(): Promise<number> {
    return Progress.countDocuments();
  }
}

export default new ProgressRepository();
