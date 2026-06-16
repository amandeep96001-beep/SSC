import TCSQuestion from '../models/tcsQuestionModel.js';

class TCSQuestionRepository {
  static async getRandomBySubject(subject) {
    const count = await TCSQuestion.countDocuments({ subject });
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    return await TCSQuestion.findOne({ subject }).skip(skip).lean();
  }

  static async getCountBySubject() {
    const gk = await TCSQuestion.countDocuments({ subject: 'GK' });
    const english = await TCSQuestion.countDocuments({ subject: 'English' });
    return { gk, english, total: gk + english };
  }
}

export default TCSQuestionRepository;
