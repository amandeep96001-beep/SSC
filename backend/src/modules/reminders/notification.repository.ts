import AppNotification from './notification.model.js';
import type { IAppNotification } from './notification.model.js';

class NotificationRepository {
  async findByUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const filter: { userId: string; read?: boolean } = { userId };
    if (options.unreadOnly) filter.read = false;
    return AppNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(options.limit ?? 40)
      .lean();
  }

  async create(data: Partial<IAppNotification>) {
    return AppNotification.create(data);
  }

  async markRead(userId: string, ids?: string[]) {
    const filter: { userId: string; read: boolean; _id?: { $in: unknown[] } } = {
      userId,
      read: false,
    };
    if (ids?.length) filter._id = { $in: ids };
    return AppNotification.updateMany(filter, { $set: { read: true } });
  }
}

export default new NotificationRepository();
