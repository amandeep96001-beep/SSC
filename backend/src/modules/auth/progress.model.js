import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  topicId: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 50 },
  status: { type: String, enum: ['red', 'yellow', 'green'], required: true },
  elapsedTime: { type: String, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
});

const Progress = mongoose.model('Progress', ProgressSchema);

export default Progress;
