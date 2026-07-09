import mongoose from 'mongoose';
import TCSQuestion from './tcs-question.model.js';

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
  static async getRelatedQuestions({ subject, category, excludeIds = [], excludeQuestion, limit = 10 }) {
    const filter = { subject };
    if (category) filter.category = category;

    const andConditions = [];
    if (excludeQuestion) {
      andConditions.push({ question: { $ne: excludeQuestion } });
    }
    if (excludeIds && excludeIds.length > 0) {
      const objectIds = excludeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (objectIds.length > 0) {
        andConditions.push({ _id: { $nin: objectIds } });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    let questions = await TCSQuestion.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: { _id: 1, question: 1, options: 1, correctAnswer: 1, explanation: 1, category: 1 } }
    ]);

    return questions;
  }
}

export default TCSQuestionRepository;
