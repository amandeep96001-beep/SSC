import mongoose from 'mongoose';

const MockProgressSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  examId: { type: String, required: false, index: true, default: null },
  mockTestId: { type: String, required: true },
  title: { type: String, required: true },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  blank: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  elapsedTime: { type: String, required: false },
  sectionTimes: { type: mongoose.Schema.Types.Mixed, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
});

MockProgressSchema.index({ username: 1, examId: 1, mockTestId: 1 });

const MockProgress = mongoose.model('MockProgress', MockProgressSchema);

export default MockProgress;
