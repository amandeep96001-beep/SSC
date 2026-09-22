import Reminder from './reminder.model.js';
import type { IReminder } from './reminder.interface.js';
import AppNotification from './notification.model.js';
import User from '../auth/auth.model.js';
import { getZonedParts, isReminderDue, fireKeyFor } from './reminder.time.js';
import { sendReminderEmail } from './reminder.mail.js';
import { getDBStatus } from '../../config/db.config.js';
import { errorMessage } from '../../types/domain.js';
import { logger } from '../../lib/logger.js';
import type { Types } from 'mongoose';

type ReminderDoc = IReminder & { _id: Types.ObjectId };

const BATCH_SIZE = Number(process.env.REMINDER_CRON_BATCH || 1000);

async function resolveReminderEmail(reminder: ReminderDoc) {
  if (reminder.email) return reminder.email;
  try {
    const u = await User.findById(reminder.userId).select('email').lean();
    const email = u?.email || null;
    if (email) {
      await Reminder.updateOne({ _id: reminder._id }, { $set: { email } });
    }
    return email;
  } catch {
    return null;
  }
}

async function fireOneReminder(reminder: ReminderDoc, now: Date, key: string) {
  const claimed = await Reminder.findOneAndUpdate(
    {
      _id: reminder._id,
      enabled: true,
      lastFiredKey: { $ne: key },
    },
    {
      $set: {
        lastFiredKey: key,
        lastFiredAt: now,
        ...(reminder.repeat === 'once' ? { enabled: false } : {}),
      },
    },
    { new: true },
  );
  if (!claimed) return false;

  try {
    await AppNotification.create({
      userId: reminder.userId,
      title: reminder.title,
      body: reminder.message || 'Your study time is here. Open CrackuEx and start.',
      kind: 'reminder',
      reminderId: reminder._id as typeof reminder.userId,
    });
  } catch (err) {
    logger.error({ err, msg: 'reminder notification create failed' });
  }

  try {
    const email = await resolveReminderEmail(claimed as ReminderDoc);
    const mail = await sendReminderEmail({
      email,
      title: reminder.title,
      message: reminder.message,
      time: reminder.time,
    });
    if (mail.sent) {
      logger.info({ email, title: reminder.title, msg: 'reminder email sent' });
    } else {
      logger.info({
        reason: mail.reason || 'unknown',
        userId: reminder.userId,
        msg: 'reminder email skipped',
      });
    }
  } catch (err) {
    logger.error({ err, msg: 'reminder email failed' });
  }

  return true;
}

async function* iterateEnabledReminders() {
  let lastId: Types.ObjectId | null = null;
  const batch = Math.min(Math.max(100, BATCH_SIZE), 5000);

  for (;;) {
    const filter: { enabled: true; _id?: { $gt: Types.ObjectId } } = { enabled: true };
    if (lastId) filter._id = { $gt: lastId };

    const rows = await Reminder.find(filter)
      .sort({ _id: 1 })
      .limit(batch)
      .lean() as ReminderDoc[];

    if (!rows.length) break;
    for (const row of rows) yield row;
    lastId = rows[rows.length - 1]._id;
    if (rows.length < batch) break;
  }
}

/** Shared by BullMQ worker and in-process cron. */
export async function processDueReminders() {
  if (!getDBStatus()) return;

  const now = new Date();
  let fired = 0;
  let scanned = 0;

  for await (const reminder of iterateEnabledReminders()) {
    scanned += 1;
    try {
      const tz = reminder.timezone || 'Asia/Kolkata';
      const parts = getZonedParts(now, tz);
      if (!isReminderDue(reminder, parts)) continue;

      const key = fireKeyFor(reminder, parts.dateISO);
      if (reminder.lastFiredKey === key) continue;

      const didFire = await fireOneReminder(reminder, now, key);
      if (didFire) fired += 1;
    } catch (err) {
      logger.error({
        err,
        reminderId: reminder?._id,
        msg: 'skipped reminder',
      });
    }
  }

  if (fired > 0) {
    logger.info({ scanned, fired, at: now.toISOString(), msg: 'reminders fired' });
  }
}
