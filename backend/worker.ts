/**
 * Dedicated reminder worker. Set REMINDER_INLINE=0 on the API so only this
 * process owns the queue consumer.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB } from './src/config/db.config.js';
import { validateEnv, isHostedRuntime } from './src/config/env.config.js';
import { startReminderRuntime } from './src/modules/reminders/reminder.runtime.js';
import { logger } from './src/lib/logger.js';
import { waitForRedis } from './src/infra/redis.js';
import { installProcessShutdown } from './src/infra/shutdown.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.basename(here) === 'dist' ? path.resolve(here, '..') : here;

if (!process.env.RENDER) {
  dotenv.config({ path: path.resolve(rootDir, '.env'), override: false });
}

async function start() {
  validateEnv();
  try {
    await connectDB();
  } catch (err) {
    logger.error({ err, msg: 'Worker MongoDB connection failed' });
    if (isHostedRuntime()) process.exit(1);
  }

  if (process.env.REDIS_URL?.trim()) {
    const redisOk = await waitForRedis(10_000);
    if (!redisOk) {
      logger.error('Worker Redis did not become ready');
      if (isHostedRuntime()) process.exit(1);
    }
  }

  process.env.REMINDER_INLINE = '1';
  await startReminderRuntime();
  logger.info('Reminder worker running');
  installProcessShutdown();
}

start().catch((err) => {
  logger.error({ err, msg: 'Worker failed to start' });
  process.exit(1);
});
