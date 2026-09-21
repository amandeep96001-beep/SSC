import mongoose from 'mongoose';
import DrillPerformance from '../drill-performance.model.js';

export interface PerfRecord {
  _id: mongoose.Types.ObjectId;
  correct: boolean;
  seenAt: Date;
}

class DrillPerformanceRepository {
  async createSafe(
    userId: string | mongoose.Types.ObjectId | null | undefined,
    questionId: string | mongoose.Types.ObjectId | null | undefined,
    subject: string,
    correct: boolean,
  ): Promise<void> {
    if (!userId || !questionId) return;
    try {
      await DrillPerformance.create({
        userId: new mongoose.Types.ObjectId(String(userId)),
        questionId: new mongoose.Types.ObjectId(String(questionId)),
        subject,
        correct,
        seenAt: new Date(),
      });
    } catch {
      // ignore non-critical write failures
    }
  }

  async getRecentPerfGrouped(
    userId: mongoose.Types.ObjectId,
    subject: string,
    limit: number,
  ): Promise<PerfRecord[]> {
    return DrillPerformance.aggregate<PerfRecord>([
      { $match: { userId, subject } },
      { $sort: { seenAt: -1 } },
      { $limit: limit },
      {
        $group: {
          _id: '$questionId',
          correct: { $first: '$correct' },
          seenAt: { $first: '$seenAt' },
        },
      },
    ]);
  }
}

export default new DrillPerformanceRepository();
