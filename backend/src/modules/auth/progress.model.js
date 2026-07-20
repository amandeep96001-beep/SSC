import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  examId: { type: String, required: false, index: true, default: null },
  subjectName: { type: String, required: false, default: null },
  topicId: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 50 },
  status: { type: String, enum: ['red', 'yellow', 'green'], required: true },
  elapsedTime: { type: String, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
});

ProgressSchema.index({ username: 1, examId: 1, topicId: 1 });

const Progress = mongoose.model('Progress', ProgressSchema);

export default Progress;
