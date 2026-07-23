import mongoose from 'mongoose';

const AppNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: false, trim: true, maxlength: 300, default: '' },
    kind: { type: String, default: 'reminder', index: true },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      required: false,
    },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AppNotificationSchema.index({ userId: 1, createdAt: -1 });

const AppNotification = mongoose.model('AppNotification', AppNotificationSchema);
export default AppNotification;
