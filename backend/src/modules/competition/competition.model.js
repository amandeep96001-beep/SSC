import mongoose from 'mongoose';

/**
 * Competition Score Schema
 * Stores each user's battle attempt result for leaderboard ranking.
 */
const CompetitionScoreSchema = new mongoose.Schema({
  username:   { type: String, required: true, index: true },
  subject:    { type: String, required: true, enum: ['GK', 'English', 'Maths', 'Reasoning', 'Mixed'], default: 'Mixed' },
  score:      { type: Number, required: true },   // e.g. 8 out of 10
  correct:    { type: Number, required: true },
  wrong:      { type: Number, required: true },
  skipped:    { type: Number, required: true },
  accuracy:   { type: Number, required: true },   // percentage 0-100
  timeTaken:  { type: Number, required: true },   // total seconds taken
  timestamp:  { type: Date, default: Date.now }
});

// Compound index for efficient leaderboard queries (subject + score + time)
CompetitionScoreSchema.index({ subject: 1, score: -1, timeTaken: 1 });

const CompetitionScore = mongoose.model('CompetitionScore', CompetitionScoreSchema);

export default CompetitionScore;
