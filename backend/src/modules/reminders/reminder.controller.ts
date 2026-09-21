import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { ReminderService } from './reminder.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export class ReminderController {
  constructor(private readonly reminderService = new ReminderService()) {}

  listReminders = asyncHandler(async (req, res) => {
    const result = await this.reminderService.listReminders(req.user!.id);
    return ok(res, result);
  });

  createReminder = asyncHandler(async (req, res) => {
    const result = await this.reminderService.createReminder(
      req.user!.id,
      req.user!.username,
      req.user!.email,
      req.body,
    );
    return created(res, result);
  });

  updateReminder = asyncHandler(async (req, res) => {
    const result = await this.reminderService.updateReminder(
      req.user!.id,
      paramStr(req.params.id),
      req.body,
    );
    return ok(res, result);
  });

  deleteReminder = asyncHandler(async (req, res) => {
    const result = await this.reminderService.deleteReminder(req.user!.id, paramStr(req.params.id));
    return ok(res, result);
  });

  listNotifications = asyncHandler(async (req, res) => {
    const unreadOnly = String(req.query.unread || '') === '1';
    const result = await this.reminderService.listNotifications(req.user!.id, unreadOnly);
    return ok(res, result);
  });

  markNotificationsRead = asyncHandler(async (req, res) => {
    const result = await this.reminderService.markNotificationsRead(req.user!.id, req.body);
    return ok(res, result);
  });

  testNotify = asyncHandler(async (req, res) => {
    const result = await this.reminderService.testNotify(req.user!.id, req.user!.email);
    return ok(res, result);
  });
}

export const reminderController = new ReminderController();
