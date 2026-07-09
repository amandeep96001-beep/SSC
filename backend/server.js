import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './src/config/db.config.js';
import { validateEnv, getEnvHealth } from './src/config/env.config.js';
import { createApp } from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  validateEnv();

  try {
    await connectDB();
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Starting without database (local dev only).');
    }
  }

  const app = createApp();

  app.get('/health', (req, res) => {
    res.json({
      status: getDBStatus() ? 'ok' : 'degraded',
      uptime: process.uptime(),
      db: getDBStatus() ? 'connected' : 'disconnected',
      env: getEnvHealth(),
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    if (!getDBStatus()) {
      console.warn('⚠️ Database not connected — auth and data routes will return 503.');
    }
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
