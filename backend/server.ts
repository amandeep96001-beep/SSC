import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB } from './src/config/db.config.js';
import { validateEnv, isHostedRuntime } from './src/config/env.config.js';
import { createApp } from './src/app.js';
import { logger } from './src/lib/logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.basename(here) === 'dist' ? path.resolve(here, '..') : here;

if (!process.env.RENDER) {
  dotenv.config({
    path: path.resolve(rootDir, '.env'),
    override: false,
  });
}

const PORT = process.env.PORT || 5000;

async function start() {
  validateEnv();

  try {
    await connectDB();
  } catch (err) {
    logger.error({ err, msg: 'MongoDB connection failed' });
    if (isHostedRuntime()) {
      process.exit(1);
    }
  }

  const app = createApp();

  // Inline reminders (BullMQ when Redis is set, else in-process cron).
  // Dedicated workers set REMINDER_INLINE=0 and run worker.ts instead.
  if (String(process.env.REMINDER_INLINE || '1') !== '0') {
    const { startReminderRuntime } = await import('./src/modules/reminders/reminder.runtime.js');
    await startReminderRuntime();
  }

  app.listen(PORT, () => {
    logger.info({ port: PORT, msg: 'Server listening' });
  });
}

start().catch((err) => {
  logger.error({ err, msg: 'Failed to start server' });
  process.exit(1);
});
