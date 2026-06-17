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
    const maths = await TCSQuestion.countDocuments({ subject: 'Maths' });
    const reasoning = await TCSQuestion.countDocuments({ subject: 'Reasoning' });
    return { gk, english, maths, reasoning, total: gk + english + maths + reasoning };
  }

  /**
   * Get up to `limit` related questions from the same category.
   * Falls back to same subject if category has too few.
   */
  static async getRelatedQuestions({ subject, category, excludeQuestion, limit = 10 }) {
    const filter = { subject };
    if (category) filter.category = category;
    if (excludeQuestion) filter.question = { $ne: excludeQuestion };

    let questions = await TCSQuestion.find(filter)
      .limit(limit)
      .select('question options correctAnswer explanation category')
      .lean();

    // If category gave too few results, backfill from same subject
    if (questions.length < limit && category) {
      const ids = questions.map(q => q._id);
      const backfill = await TCSQuestion.find({
        subject,
        _id: { $nin: ids },
        ...(excludeQuestion ? { question: { $ne: excludeQuestion } } : {})
      })
        .limit(limit - questions.length)
        .select('question options correctAnswer explanation category')
        .lean();
      questions = [...questions, ...backfill];
    }

    return questions;
  }
}

export default TCSQuestionRepository;
