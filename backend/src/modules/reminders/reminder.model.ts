import mongoose, { Schema, Types } from 'mongoose';

export type ReminderRepeat = 'once' | 'daily' | 'weekdays';

export interface IReminder {
  userId: Types.ObjectId;
  username: string;
  email?: string;
  title: string;
  message?: string;
  time: string;
  date?: string | null;
  repeat: ReminderRepeat;
  timezone?: string;
  enabled: boolean;
  lastFiredKey?: string | null;
  lastFiredAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    /** Local time HH:mm */
    time: { type: String, required: true },
    /** YYYY-MM-DD for one-time reminders */
    date: { type: String, required: false, default: null },
    repeat: {
      type: String,
      enum: ['once', 'daily', 'weekdays'],
      default: 'daily',
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    enabled: { type: Boolean, default: true, index: true },
    /** Prevents double-fire: `${dateISO}:${time}` */
    lastFiredKey: { type: String, required: false, default: null },
    lastFiredAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

ReminderSchema.index({ enabled: 1, time: 1 });

const Reminder = mongoose.model<IReminder>('Reminder', ReminderSchema);
export default Reminder;
