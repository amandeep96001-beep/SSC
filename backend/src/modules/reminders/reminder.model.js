import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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

const Reminder = mongoose.model('Reminder', ReminderSchema);
export default Reminder;
