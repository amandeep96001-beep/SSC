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
  maxScore: { type: Number, default: 50 },
  status: { type: String, enum: ['red', 'yellow', 'green'], required: true },
  elapsedTime: { type: String, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
});


const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  progress: [TopicProgressSchema]
});

const User = mongoose.model('User', UserSchema);

export default User;
