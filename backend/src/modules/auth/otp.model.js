import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  /** email_verify | password_reset */
  purpose: {
    type: String,
    enum: ['email_verify', 'password_reset'],
    default: 'email_verify',
    index: true,
  },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
});

OtpSchema.index({ email: 1, purpose: 1 });
// Auto-delete expired OTP docs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpChallenge = mongoose.model('OtpChallenge', OtpSchema);

export default OtpChallenge;
