import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok, created } from '../../shared/utils/api-response.js';
import * as reminderService from './reminder.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export const listReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.listReminders(req.user!.id);
  return ok(res, result);
});

export const createReminder = asyncHandler(async (req, res) => {
  const result = await reminderService.createReminder(
    req.user!.id,
    req.user!.username,
    req.user!.email,
    req.body,
  );
  return created(res, result);
});

export const updateReminder = asyncHandler(async (req, res) => {
  const result = await reminderService.updateReminder(req.user!.id, paramStr(req.params.id), req.body);
  return ok(res, result);
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const result = await reminderService.deleteReminder(req.user!.id, paramStr(req.params.id));
  return ok(res, result);
});

export const listNotifications = asyncHandler(async (req, res) => {
  const unreadOnly = String(req.query.unread || '') === '1';
  const result = await reminderService.listNotifications(req.user!.id, unreadOnly);
  return ok(res, result);
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const result = await reminderService.markNotificationsRead(req.user!.id, req.body);
  return ok(res, result);
});

export const testNotify = asyncHandler(async (req, res) => {
  const result = await reminderService.testNotify(req.user!.id, req.user!.email);
  return ok(res, result);
});
