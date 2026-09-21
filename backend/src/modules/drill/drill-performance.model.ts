import mongoose, { Schema } from 'mongoose';
import type { IDrillPerformance } from './drill.interface.js';

const DrillPerformanceSchema = new Schema<IDrillPerformance>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'TCSQuestion', required: true },
  subject: { type: String, required: true, index: true },
  correct: { type: Boolean, required: true },
  seenAt: { type: Date, default: Date.now },
}, { timestamps: false, versionKey: false });

DrillPerformanceSchema.index({ userId: 1, questionId: 1 });
DrillPerformanceSchema.index({ seenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const DrillPerformance = mongoose.models.DrillPerformance
  || mongoose.model<IDrillPerformance>('DrillPerformance', DrillPerformanceSchema);

export default DrillPerformance;
