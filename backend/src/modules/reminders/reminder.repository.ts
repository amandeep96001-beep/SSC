import Reminder from './reminder.model.js';
import type { IReminder } from './reminder.model.js';
import type { HydratedDocument } from 'mongoose';

export type ReminderDoc = HydratedDocument<IReminder>;

class ReminderRepository {
  async findByUserId(userId: string) {
    return Reminder.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async create(data: Partial<IReminder>) {
    return Reminder.create(data);
  }

  async findOneForUser(id: string, userId: string) {
    return Reminder.findOne({ _id: id, userId });
  }

  async deleteOneForUser(id: string, userId: string) {
    return Reminder.deleteOne({ _id: id, userId });
  }
}

export default new ReminderRepository();
