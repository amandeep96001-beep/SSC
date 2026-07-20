import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
  /** Required for password login; optional for Google-only users */
  password: { type: String, required: false, select: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
});

const User = mongoose.model('User', UserSchema);

export default User;
