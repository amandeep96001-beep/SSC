import mongoose, { Schema } from 'mongoose';
import type { ICompetitionScore } from './competition.interface.js';

const CompetitionScoreSchema = new Schema<ICompetitionScore>({
  username: { type: String, required: true, index: true },
  subject: {
    type: String,
    required: true,
    enum: ['GK', 'English', 'Maths', 'Reasoning', 'Mixed'],
    default: 'Mixed',
  },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  skipped: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

CompetitionScoreSchema.index({ subject: 1, score: -1, timeTaken: 1 });

const CompetitionScore = mongoose.model<ICompetitionScore>('CompetitionScore', CompetitionScoreSchema);

export default CompetitionScore;
