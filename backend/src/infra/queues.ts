import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { getRedis } from './redis.js';
import { logger } from '../lib/logger.js';

export const REMINDER_QUEUE = 'reminders';

let queue: Queue | null = null;
let worker: Worker | null = null;

function bullConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  return { url, maxRetriesPerRequest: null };
}

export function getReminderQueue(): Queue | null {
  if (queue) return queue;
  const connection = bullConnection();
  if (!connection) return null;
  queue = new Queue(REMINDER_QUEUE, { connection });
  return queue;
}

export async function startReminderWorker(
  processor: () => Promise<void>,
): Promise<Worker | null> {
  if (worker) return worker;
  const connection = bullConnection();
  if (!connection) return null;

  worker = new Worker(
    REMINDER_QUEUE,
    async () => {
      await processor();
    },
    { connection, concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, msg: 'reminder worker job failed' });
  });

  const q = getReminderQueue();
  if (q) {
    await q.upsertJobScheduler(
      'reminder-tick',
      { every: 60_000 },
      {
        name: 'tick',
        data: {},
        opts: {
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      },
    );
  }

  logger.info('Reminder BullMQ worker started');
  return worker;
}

export async function stopReminderWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}

/** True when Redis is configured (BullMQ path available). */
export function canUseReminderQueue(): boolean {
  return Boolean(process.env.REDIS_URL?.trim() && getRedis());
}
