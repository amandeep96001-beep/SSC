import mongoose, { Schema, Types } from 'mongoose';

export interface IDrillPerformance {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  subject: string;
  correct: boolean;
  seenAt: Date;
}

/**
 * Tracks per-user per-question drill performance.
 * Used by the weighted drill algorithm to prioritise weak questions
 * and cool down recently-correct ones.
 *
 * TTL index on seenAt: records auto-expire after 30 days.
 */
const DrillPerformanceSchema = new Schema<IDrillPerformance>({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'TCSQuestion', required: true },
  subject:    { type: String, required: true, index: true },
  correct:    { type: Boolean, required: true },
  seenAt:     { type: Date, default: Date.now },
}, { timestamps: false, versionKey: false });

// Fast lookup: "for this user, what's the latest result for this question?"
DrillPerformanceSchema.index({ userId: 1, questionId: 1 });

// Auto-purge old records after 30 days
DrillPerformanceSchema.index({ seenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const DrillPerformance = mongoose.models.DrillPerformance
  || mongoose.model<IDrillPerformance>('DrillPerformance', DrillPerformanceSchema);

export default DrillPerformance;
