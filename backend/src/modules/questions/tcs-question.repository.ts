import mongoose from 'mongoose';
import TCSQuestion from './tcs-question.model.js';
import drillPerformanceRepository from '../drill/drill-performance.repository.js';
import type {
  ITCSQuestion,
  RelatedQuestionsInput,
  TCSQuestionInsert,
} from './tcs-question.interface.js';

const CORRECT_COOLDOWN_DAYS = 3;
const WRONG_BOOST_DAYS = 7;
const WEAK_POOL_PROBABILITY = 0.70;
const PERF_SCAN_LIMIT = 300;

class TCSQuestionRepository {
  static async findAllQuestionTexts(): Promise<{ question: string }[]> {
    return TCSQuestion.find({}, { question: 1 }).lean();
  }

  static async insertMany(
    questions: TCSQuestionInsert[],
    options: { ordered?: boolean } = {},
  ): Promise<number> {
    if (questions.length === 0) return 0;
    const result = await TCSQuestion.insertMany(questions, { ordered: options.ordered ?? false });
    return result.length;
  }

  static async getRandomBySubject(subject: string) {
    const count = await TCSQuestion.countDocuments({ subject });
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    return await TCSQuestion.findOne({ subject }).skip(skip).lean();
  }

  static async getWeightedQuestion(subject: string, userId: mongoose.Types.ObjectId | string | null | undefined) {
    // No userId / guest → pure random
    if (!userId || !mongoose.isValidObjectId(String(userId))) {
      return this.getRandomBySubject(subject);
    }

    const uid = new mongoose.Types.ObjectId(String(userId));
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - CORRECT_COOLDOWN_DAYS * 86400_000);
    const boostCutoff    = new Date(now.getTime() - WRONG_BOOST_DAYS   * 86400_000);

    const perfRecords = await drillPerformanceRepository.getRecentPerfGrouped(
      uid,
      subject,
      PERF_SCAN_LIMIT,
    );

    if (perfRecords.length === 0) {
      // No history yet — pure random
      return this.getRandomBySubject(subject);
    }

    const weakIds: mongoose.Types.ObjectId[] = [];   // wrong recently
    const coolIds: mongoose.Types.ObjectId[] = [];   // correct recently → in cooldown
    
    for (const r of perfRecords) {
      if (!r.correct && r.seenAt >= boostCutoff) {
        weakIds.push(r._id);
      } else if (r.correct && r.seenAt >= cooldownCutoff) {
        coolIds.push(r._id);
      }
      // else: cooled-down correct → back in fresh pool (no action needed)
    }

    // Decide which pool to draw from
    const useWeakPool = weakIds.length > 0 && Math.random() < WEAK_POOL_PROBABILITY;

    if (useWeakPool) {
      // Pick a random weak question
      const [q] = await TCSQuestion.aggregate([
        { $match: { subject, _id: { $in: weakIds } } },
        { $sample: { size: 1 } },
      ]);
      if (q) return q;
    }

    // Fresh pool: exclude only in-cooldown correct questions
    const excludeIds = coolIds;
    const [q] = await TCSQuestion.aggregate([
      { $match: { subject, ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}) } },
      { $sample: { size: 1 } },
    ]);

    // Absolute fallback (all questions in cooldown — very unlikely)
    return q || this.getRandomBySubject(subject);
  }

  static async findByIdForVerify(id: string) {
    return TCSQuestion.findById(id).select('options correctAnswer').lean();
  }

  static async getCountBySubject() {
    const rows = await TCSQuestion.aggregate<{ _id: string | null; count: number }>([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const bySubject: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const name = row._id || 'Unknown';
      bySubject[name] = row.count;
      total += row.count;
    }

    const subjects = Object.keys(bySubject);

    return {
      total,
      bySubject,
      subjects,
      gk:        bySubject.GK        || 0,
      english:   bySubject.English   || 0,
      maths:     bySubject.Maths     || 0,
      reasoning: bySubject.Reasoning || 0,
    };
  }

  /**
   * Get up to `limit` related questions from the same category.
   * Falls back to same subject if category has too few.
   */
  static async getRelatedQuestions({
    subject,
    category,
    excludeIds = [],
    excludeQuestion,
    limit = 10,
  }: RelatedQuestionsInput) {
    const filter: Record<string, unknown> = { subject };
    if (category) filter.category = category;

    const andConditions: Record<string, unknown>[] = [];
    if (excludeQuestion) {
      andConditions.push({ question: { $ne: String(excludeQuestion) } });
    }
    if (excludeIds.length > 0) {
      const objectIds = excludeIds
        .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
        .map((id) => new mongoose.Types.ObjectId(String(id)));
      if (objectIds.length > 0) {
        andConditions.push({ _id: { $nin: objectIds } });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const questions = await TCSQuestion.aggregate<ITCSQuestion & { _id: mongoose.Types.ObjectId }>([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: { _id: 1, question: 1, options: 1, correctAnswer: 1, explanation: 1, category: 1 } }
    ]);

    return questions;
  }
}

export default TCSQuestionRepository;
