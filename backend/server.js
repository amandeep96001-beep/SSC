import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB, getDBStatus } from './src/config/db.config.js';
import { validateEnv } from './src/config/env.config.js';
import { createApp } from './src/app.js';

// Local only — Render uses dashboard env vars.
if (!process.env.RENDER) {
  dotenv.config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env'),
    override: false,
  });
}

const PORT = process.env.PORT || 5000;

async function start() {
  validateEnv();

  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
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
