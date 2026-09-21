import ExamConfig from './exam-config.model.js';
import type { IExamConfig } from './exam-config.interface.js';
import { BaseRepository } from '../../base-repository/base.repository.js';

class ExamConfigRepository extends BaseRepository<IExamConfig> {
  constructor() {
    super(ExamConfig);
  }

  async upsert(examId: string, subjects: string[]) {
    return ExamConfig.findOneAndUpdate(
      { examId },
      { examId, subjects },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  }
}

export default new ExamConfigRepository();
