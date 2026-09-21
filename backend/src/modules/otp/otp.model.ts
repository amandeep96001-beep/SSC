import mongoose, { Schema } from 'mongoose';
import type { IOtpChallenge } from './otp.interface.js';

const OtpSchema = new Schema<IOtpChallenge>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  purpose: {
    type: String,
    enum: ['email_verify', 'password_reset'],
    default: 'email_verify',
    index: true,
  },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  pendingData: { type: Schema.Types.Mixed },
});

OtpSchema.index({ email: 1, purpose: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpChallenge = mongoose.model<IOtpChallenge>('OtpChallenge', OtpSchema);

export default OtpChallenge;
