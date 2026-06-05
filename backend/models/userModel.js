import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Hashing utility using Node crypto (SHA-256)
 */
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

export default User;
