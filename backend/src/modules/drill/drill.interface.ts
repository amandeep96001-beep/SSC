import type { Types } from 'mongoose';

export interface IDrillPerformance {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  subject: string;
  correct: boolean;
  seenAt: Date;
}

export interface PerfRecord {
  _id: Types.ObjectId;
  correct: boolean;
  seenAt: Date;
}
