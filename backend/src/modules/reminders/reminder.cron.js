import Reminder from './reminder.model.js';
import AppNotification from './notification.model.js';
import User from '../auth/user.model.js';
import { getZonedParts, isReminderDue, fireKeyFor } from './reminder.time.js';
import { sendReminderEmail } from './reminder.mail.js';
import { getDBStatus } from '../../config/db.config.js';

let started = false;
let timerId = null;

async function resolveReminderEmail(reminder) {
  if (reminder.email) return reminder.email;
  try {
    const u = await User.findById(reminder.userId).select('email').lean();
    const email = u?.email || null;
    if (email) {
      reminder.email = email;
      // persist for next fire without another lookup
      await Reminder.updateOne({ _id: reminder._id }, { $set: { email } });
    }
    return email;
  } catch {
    return null;
  }
}

async function processDueReminders() {
  if (!getDBStatus()) return;

  const now = new Date();
  const enabled = await Reminder.find({ enabled: true }).limit(500);
  let fired = 0;

  for (const reminder of enabled) {
    const tz = reminder.timezone || 'Asia/Kolkata';
    const parts = getZonedParts(now, tz);
    if (!isReminderDue(reminder, parts)) continue;

    const key = fireKeyFor(reminder, parts.dateISO);
    if (reminder.lastFiredKey === key) continue;

    reminder.lastFiredKey = key;
    reminder.lastFiredAt = now;
    if (reminder.repeat === 'once') {
      reminder.enabled = false;
    }
    await reminder.save();

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
      const email = await resolveReminderEmail(reminder);
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

    fired += 1;
  }

  if (fired > 0) {
    console.info(`[reminders:cron] fired ${fired} reminder(s) at ${now.toISOString()}`);
  }
}

/**
 * Minute ticker — fires due study reminders (email + in-app notification).
 * Uses setInterval so we don't need an extra cron package.
 */
export function startReminderCron() {
  if (started) return;
  if (String(process.env.REMINDER_CRON || '1') === '0') {
    console.info('[reminders:cron] disabled via REMINDER_CRON=0');
    return;
  }

  const tick = () => {
    processDueReminders().catch((err) => {
      console.error('[reminders:cron] tick failed:', err.message);
    });
  };

  // Align roughly to clock minutes, then every 60s
  const msToNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(() => {
    tick();
    timerId = setInterval(tick, 60_000);
  }, Math.min(msToNextMinute, 60_000));

  started = true;
  console.info('[reminders:cron] scheduled (every 60s) — study reminders');
}

export function stopReminderCron() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  started = false;
}
