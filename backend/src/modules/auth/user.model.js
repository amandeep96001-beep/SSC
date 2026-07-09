import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 32,
    index: true
  },
  password: { type: String, required: true, select: true }
});

const User = mongoose.model('User', UserSchema);

export default User;
