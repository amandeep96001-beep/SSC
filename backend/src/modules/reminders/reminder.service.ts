import mongoose from 'mongoose';
import reminderRepository from './reminder.repository.js';
import notificationRepository from './notification.repository.js';
import userRepository from '../auth/repositories/user.repository.js';
import type { ReminderRepeat } from './reminder.model.js';
import { normalizeTime } from './reminder.time.js';
import { sendReminderEmail } from './reminder.mail.js';
import { badRequest, notFound } from '../../shared/errors/http-error.js';

interface ReminderClientSource {
  toObject?: () => ReminderClientSource;
  _id: unknown;
  title: string;
  message?: string;
  time: string;
  date?: string | null;
  repeat: string;
  timezone?: string;
  enabled?: boolean;
  lastFiredKey?: string | null;
  lastFiredAt?: Date | null;
  createdAt?: Date;
}

function toClient(doc: ReminderClientSource) {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(r._id),
    title: r.title,
    message: r.message || '',
    time: r.time,
    date: r.date || null,
    repeat: r.repeat,
    timezone: r.timezone || 'Asia/Kolkata',
    enabled: Boolean(r.enabled),
    lastFiredKey: r.lastFiredKey || null,
    lastFiredAt: r.lastFiredAt || null,
    createdAt: r.createdAt,
  };
}

async function resolveUserEmail(userId: string, email?: string) {
  if (email) return email;
  const u = await userRepository.findByIdLean(userId);
  return u?.email || undefined;
}

export async function listReminders(userId: string) {
  const rows = await reminderRepository.findByUserId(userId);
  return { count: rows.length, data: rows.map(toClient) };
}

export async function createReminder(
  userId: string,
  username: string,
  userEmail: string | undefined,
  body: Record<string, unknown>,
) {
  const time = normalizeTime(body.time);
  if (!time) {
    throw badRequest('Valid time (HH:mm) is required.');
  }
  const title = String(body.title || '').trim();
  if (!title) {
    throw badRequest('Title is required.');
  }
  const repeat: ReminderRepeat = ['once', 'daily', 'weekdays'].includes(String(body.repeat))
    ? (body.repeat as ReminderRepeat)
    : 'daily';
  const date = repeat === 'once' ? (body.date as string | null) || null : null;
  if (repeat === 'once' && !date) {
    throw badRequest('Date is required for one-time reminders.');
  }

  const email = await resolveUserEmail(userId, userEmail);

  const row = await reminderRepository.create({
    userId: new mongoose.Types.ObjectId(userId),
    username,
    email: email || undefined,
    title,
    message: String(body.message || '').trim().slice(0, 200),
    time,
    date,
    repeat,
    timezone: (body.timezone as string) || 'Asia/Kolkata',
    enabled: body.enabled !== false,
  });

  return { data: toClient(row) };
}

export async function updateReminder(
  userId: string,
  id: string,
  body: Record<string, unknown>,
) {
  const row = await reminderRepository.findOneForUser(id, userId);
  if (!row) {
    throw notFound('Reminder not found.');
  }

  if (body.title != null) {
    const title = String(body.title).trim();
    if (!title) throw badRequest('Title cannot be empty.');
    row.title = title;
  }
  if (body.message != null) row.message = String(body.message).trim().slice(0, 200);
  if (body.time != null) {
    const time = normalizeTime(body.time);
    if (!time) throw badRequest('Invalid time.');
    row.time = time;
    row.lastFiredKey = null;
  }
  if (body.repeat != null && ['once', 'daily', 'weekdays'].includes(String(body.repeat))) {
    row.repeat = body.repeat as ReminderRepeat;
    if (row.repeat !== 'once') row.date = null;
    row.lastFiredKey = null;
  }
  if (body.date != null) row.date = row.repeat === 'once' ? (body.date as string) : null;
  if (typeof body.enabled === 'boolean') row.enabled = body.enabled;
  if (body.timezone) row.timezone = String(body.timezone);

  await row.save();
  return { data: toClient(row) };
}

export async function deleteReminder(userId: string, id: string) {
  const result = await reminderRepository.deleteOneForUser(id, userId);
  if (!result.deletedCount) {
    throw notFound('Reminder not found.');
  }
  return { message: 'Reminder deleted.' };
}

export async function listNotifications(userId: string, unreadOnly: boolean) {
  const rows = await notificationRepository.findByUser(userId, { unreadOnly });
  return {
    count: rows.length,
    data: rows.map((n) => ({
      id: String(n._id),
      title: n.title,
      body: n.body || '',
      kind: n.kind,
      read: Boolean(n.read),
      createdAt: n.createdAt,
    })),
  };
}

export async function markNotificationsRead(userId: string, body: Record<string, unknown>) {
  const ids = Array.isArray(body.ids)
    ? body.ids
        .map(String)
        .filter((id: string) => mongoose.isValidObjectId(id))
        .slice(0, 50)
    : null;
  const result = await notificationRepository.markRead(userId, ids ?? undefined);
  return { modified: result.modifiedCount || 0 };
}

export async function testNotify(userId: string, userEmail: string | undefined) {
  const email = await resolveUserEmail(userId, userEmail);

  const title = 'Study reminder (test)';
  const body = 'This is a test. Real reminders will look like this — email + app alert.';

  const notif = await notificationRepository.create({
    userId: new mongoose.Types.ObjectId(userId),
    title,
    body,
    kind: 'reminder',
    read: true,
  });

  let mail: { sent: boolean; reason?: string } = { sent: false, reason: 'no_email' };
  if (email) {
    mail = await sendReminderEmail({
      email,
      title,
      message: body,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  }

  return {
    data: {
      notificationId: String(notif._id),
      email: email || null,
      mailSent: Boolean(mail.sent),
      mailReason: mail.reason || null,
    },
  };
}
