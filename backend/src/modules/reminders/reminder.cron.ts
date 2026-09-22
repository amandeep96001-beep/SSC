import { processDueReminders } from './reminder.processor.js';
import { getDBStatus } from '../../config/db.config.js';
import { errorMessage } from '../../types/domain.js';
import { logger } from '../../lib/logger.js';

let started = false;
let timerId: ReturnType<typeof setInterval> | null = null;
let tickInFlight = false;

/**
 * In-process fallback when Redis / BullMQ is unavailable.
 * Uses the same atomic claim logic as the worker path.
 */
export function startReminderCron() {
  if (started) return;
  if (String(process.env.REMINDER_CRON || '1') === '0') {
    logger.info('reminders:cron disabled via REMINDER_CRON=0');
    return;
  }

  const tick = () => {
    if (tickInFlight) return;
    if (!getDBStatus()) return;
    tickInFlight = true;
    processDueReminders()
      .catch((err: unknown) => {
        logger.error({ err: errorMessage(err), msg: 'reminders:cron tick failed' });
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
  logger.info('reminders:cron scheduled (every 60s)');
}

export function stopReminderCron() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  started = false;
}
