import mongoose, { Schema } from 'mongoose';
import type { IReminder } from './reminder.interface.js';

const ReminderSchema = new Schema<IReminder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: { type: String, required: true, index: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: false, trim: true, maxlength: 200, default: '' },
    time: { type: String, required: true },
    date: { type: String, required: false, default: null },
    repeat: {
      type: String,
      enum: ['once', 'daily', 'weekdays'],
      default: 'daily',
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    enabled: { type: Boolean, default: true, index: true },
    lastFiredKey: { type: String, required: false, default: null },
    lastFiredAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

ReminderSchema.index({ enabled: 1, time: 1 });
ReminderSchema.index({ enabled: 1, _id: 1 });

const Reminder = mongoose.model<IReminder>('Reminder', ReminderSchema);
export default Reminder;
