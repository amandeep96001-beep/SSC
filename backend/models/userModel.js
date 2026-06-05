import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Hashing utility using Node crypto (SHA-256)
 */
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const TopicProgressSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  score: { type: Number, required: true },
  status: { type: String, enum: ['red', 'yellow', 'green'], required: true },
  elapsedTime: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

const MockProgressSchema = new mongoose.Schema({
  mockTestId: { type: String, required: true },
  title: { type: String, required: true },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  blank: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  elapsedTime: { type: String, required: false },
  sectionTimes: { type: mongoose.Schema.Types.Mixed, required: false },
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  progress: [TopicProgressSchema],
  mockProgress: [MockProgressSchema]
});

const User = mongoose.model('User', UserSchema);

export default User;
