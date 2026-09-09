import Reminder from './reminder.model.js';
import AppNotification from './notification.model.js';
import User from '../auth/user.model.js';
import { getZonedParts, isReminderDue, fireKeyFor } from './reminder.time.js';
import { sendReminderEmail } from './reminder.mail.js';
import { getDBStatus } from '../../config/db.config.js';

let started = false;
let timerId = null;
let tickInFlight = false;

async function resolveReminderEmail(reminder) {
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

async function fireOneReminder(reminder, now, key) {
  // Atomic claim — prevents overlapping ticks from double-firing the same slot.
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
      body: reminder.message || 'Your study time is here. Open ExamPrep and start.',
      kind: 'reminder',
      reminderId: reminder._id,
    });
  } catch (err) {
    console.error('[reminders:cron] notification create failed:', err.message);
  }

  try {
    const email = await resolveReminderEmail(claimed);
    const mail = await sendReminderEmail({
      email,
      title: reminder.title,
      message: reminder.message,
      time: reminder.time,
    });
    if (mail.sent) {
      console.info(`[reminders:cron] email sent → ${email} (${reminder.title})`);
    } else {
      console.info(
        `[reminders:cron] email skipped (${mail.reason || 'unknown'}) for ${reminder.username || reminder.userId}`
      );
    }
  } catch (err) {
    console.error('[reminders:cron] email failed:', err.message);
  }

  return true;
}

async function processDueReminders() {
  if (!getDBStatus()) return;

  const now = new Date();
  const enabled = await Reminder.find({ enabled: true }).limit(500).lean();
  let fired = 0;

  for (const reminder of enabled) {
    try {
      const tz = reminder.timezone || 'Asia/Kolkata';
      const parts = getZonedParts(now, tz);
      if (!isReminderDue(reminder, parts)) continue;

      const key = fireKeyFor(reminder, parts.dateISO);
      if (reminder.lastFiredKey === key) continue;

      const didFire = await fireOneReminder(reminder, now, key);
      if (didFire) fired += 1;
    } catch (err) {
      // One bad timezone / document must not abort the whole tick.
      console.error(
        `[reminders:cron] skipped reminder ${reminder?._id}:`,
        err.message
      );
    }
  }

  if (fired > 0) {
    console.info(`[reminders:cron] fired ${fired} reminder(s) at ${now.toISOString()}`);
  }
}

/**
 * Minute ticker — fires due study reminders (email + in-app notification).
 */
export function startReminderCron() {
  if (started) return;
  if (String(process.env.REMINDER_CRON || '1') === '0') {
    console.info('[reminders:cron] disabled via REMINDER_CRON=0');
    return;
  }

  const tick = () => {
    if (tickInFlight) return;
    tickInFlight = true;
    processDueReminders()
      .catch((err) => {
        console.error('[reminders:cron] tick failed:', err.message);
      })
      .finally(() => {
        tickInFlight = false;
      });
  };

  const msToNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(() => {
    tick();
    timerId = setInterval(tick, 60_000);
  }, Math.min(msToNextMinute, 60_000));

  started = true;
  console.info('[reminders:cron] scheduled (every 60s) — study reminders');
}
