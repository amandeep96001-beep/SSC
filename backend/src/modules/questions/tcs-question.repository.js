import mongoose from 'mongoose';
import TCSQuestion from './tcs-question.model.js';
import DrillPerformance from '../drill/drill-performance.model.js';

// How many days before a correctly-answered question can reappear
const CORRECT_COOLDOWN_DAYS = 3;
// How many days a wrong answer stays in the "high priority" pool
const WRONG_BOOST_DAYS = 7;
// % chance of picking from the weak pool when it's non-empty (0–1)
const WEAK_POOL_PROBABILITY = 0.70;
// Max performance records to scan per request (keeps queries fast)
const PERF_SCAN_LIMIT = 300;

class TCSQuestionRepository {
  static async getRandomBySubject(subject) {
    const count = await TCSQuestion.countDocuments({ subject });
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    return await TCSQuestion.findOne({ subject }).skip(skip).lean();
  }

  /**
   * Weighted selection for drill sessions.
   *
   * Algorithm:
   *  1. Load user's recent DrillPerformance for this subject (last PERF_SCAN_LIMIT records).
   *  2. Classify question IDs:
   *       - "weak"  : answered wrong within WRONG_BOOST_DAYS → HIGH priority
   *       - "cool"  : answered correctly within CORRECT_COOLDOWN_DAYS → skip (cooldown)
   *       - "fresh" : everything else (unseen or cooled-down correct) → NORMAL priority
   *  3. With WEAK_POOL_PROBABILITY, try to serve a "weak" question.
   *     Otherwise (or if weak pool is empty) serve a "fresh" question.
   *  4. Falls back to pure random if no performance data exists yet.
   *
   * @param {string} subject
   * @param {mongoose.Types.ObjectId|string|null} userId
   * @returns {Promise<object|null>}
   */
  static async getWeightedQuestion(subject, userId) {
    // No userId → pure random (unauthenticated or first drill)
    if (!userId) return this.getRandomBySubject(subject);

    const uid = new mongoose.Types.ObjectId(String(userId));
    const now = new Date();
    const cooldownCutoff = new Date(now - CORRECT_COOLDOWN_DAYS * 86400_000);
    const boostCutoff    = new Date(now - WRONG_BOOST_DAYS   * 86400_000);

    // Load most recent result per question for this user+subject
    const perfRecords = await DrillPerformance.aggregate([
      { $match: { userId: uid, subject } },
      { $sort: { seenAt: -1 } },
      { $limit: PERF_SCAN_LIMIT },
      // Latest result per question
      {
        $group: {
          _id: '$questionId',
          correct: { $first: '$correct' },
          seenAt:  { $first: '$seenAt' },
        }
      }
    ]);

    if (perfRecords.length === 0) {
      // No history yet — pure random
      return this.getRandomBySubject(subject);
    }

    const weakIds   = [];   // wrong recently
    const coolIds   = [];   // correct recently → in cooldown
    
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

  static async getCountBySubject() {
    const rows = await TCSQuestion.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const bySubject = {};
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

    const questions = await TCSQuestion.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: { _id: 1, question: 1, options: 1, correctAnswer: 1, explanation: 1, category: 1 } }
    ]);

    return questions;
  }
}

export default TCSQuestionRepository;
