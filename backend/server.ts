import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB, getDBStatus } from './src/config/db.config.js';
import { validateEnv, isHostedRuntime } from './src/config/env.config.js';
import { createApp } from './src/app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.basename(here) === 'dist' ? path.resolve(here, '..') : here;

// Local only — Render uses dashboard env vars.
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
    console.error('MongoDB connection failed:', err instanceof Error ? err.message : err);
    // Hosted: do not serve traffic without a database (auth/progress would 503/401).
    if (isHostedRuntime()) {
      process.exit(1);
    }
  }

  const app = createApp();

  const { startReminderCron } = await import('./src/modules/reminders/reminder.cron.js');
  startReminderCron();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if (!getDBStatus()) {
      console.warn('Database not connected — DB routes will return 503');
    }
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
