import ExamConfig from './exam-config.model.js';

class ExamConfigRepository {
  async findAll() {
    return ExamConfig.find({}).lean();
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
