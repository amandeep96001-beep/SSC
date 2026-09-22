import { processDueReminders } from './reminder.processor.js';
import { startReminderCron, stopReminderCron } from './reminder.cron.js';
import {
  canUseReminderQueue,
  startReminderWorker,
  stopReminderWorker,
} from '../../infra/queues.js';
import { logger } from '../../lib/logger.js';

/**
 * Prefer BullMQ when Redis is available (multi-instance safe).
 * Fall back to in-process cron for local / Redis-less deploys.
 */
export async function startReminderRuntime(): Promise<void> {
  if (String(process.env.REMINDER_CRON || '1') === '0') {
    logger.info('Reminders disabled via REMINDER_CRON=0');
    return;
  }

  if (canUseReminderQueue()) {
    await startReminderWorker(processDueReminders);
    return;
  }

  logger.info('REDIS_URL unset — using in-process reminder cron');
  startReminderCron();
}

export async function stopReminderRuntime(): Promise<void> {
  stopReminderCron();
  await stopReminderWorker();
}
