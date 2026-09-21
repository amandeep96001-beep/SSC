import mongoose, { Schema } from 'mongoose';
import type { IUser } from './auth.interface.js';

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 48,
    index: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true,
  },
  displayName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 80,
  },
  password: { type: String, required: false, select: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  lastStudyAt: {
    type: Date,
    required: false,
    index: true,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
