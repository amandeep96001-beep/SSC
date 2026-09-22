import CompetitionScore from './competition.model.js';
import TCSQuestion from '../questions/tcs-question.model.js';
import type { Types } from 'mongoose';

class CompetitionRepository {
  async sampleQuestions(matchFilter: object, size: number) {
    return TCSQuestion.aggregate([
      { $match: matchFilter },
      { $sample: { size } },
      {
        $project: {
          question: 1,
          options: 1,
          correctAnswer: 1,
          subject: 1,
          category: 1,
          explanation: 1,
        },
      },
    ]);
  }

  async createScore(data: {
    userId: Types.ObjectId | string;
    username: string;
    subject: string;
    score: number;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
    timeTaken: number;
  }) {
    return CompetitionScore.create(data);
  }

  async findPersonalBest(userId: string, subject: string) {
    return CompetitionScore.findOne(
      { userId, subject },
      null,
      { sort: { score: -1, timeTaken: 1 } },
    ).lean();
  }

  async countBetterScores(subject: string, scoreN: number, timeTakenN: number) {
    return CompetitionScore.countDocuments({
      subject,
      $or: [
        { score: { $gt: scoreN } },
        { score: scoreN, timeTaken: { $lt: timeTakenN } },
      ],
    });
  }

  async leaderboard(subject: string) {
    return CompetitionScore.aggregate([
      { $match: { subject } },
      { $sort: { score: -1, timeTaken: 1 } },
      {
        $group: {
          _id: '$username',
          bestScore: { $first: '$score' },
          bestAccuracy: { $first: '$accuracy' },
          bestTimeTaken: { $first: '$timeTaken' },
          correct: { $first: '$correct' },
          wrong: { $first: '$wrong' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { bestScore: -1, bestTimeTaken: 1 } },
      { $limit: 10 },
      {
        $project: {
          username: '$_id',
          bestScore: 1,
          bestAccuracy: 1,
          bestTimeTaken: 1,
          correct: 1,
          wrong: 1,
          timestamp: 1,
          _id: 0,
        },
      },
    ]);
  }
}

export default new CompetitionRepository();
