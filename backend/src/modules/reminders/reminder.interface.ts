import type { Types } from 'mongoose';

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

export interface IAppNotification {
  userId: Types.ObjectId;
  title: string;
  body?: string;
  kind?: string;
  reminderId?: Types.ObjectId;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
