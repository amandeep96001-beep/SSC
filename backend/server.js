import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB, getDBStatus } from './src/config/db.config.js';
import { validateEnv } from './src/config/env.config.js';
import { createApp } from './src/app.js';

// Local only — on Render, use dashboard env vars (never override with a stray .env)
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
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Starting without database (local dev only).');
    }
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    const origins = [
      process.env.FRONTEND_URL,
      ...(String(process.env.FRONTEND_URLS || '').split(',')),
    ].map((u) => String(u || '').trim().replace(/\/+$/, '')).filter(Boolean);
    if (origins.length) {
      console.log(`🌐 CORS FRONTEND origins: ${origins.join(', ')}`);
    } else {
      console.warn('⚠️ FRONTEND_URL not set — browsers from other origins will be blocked in strict CORS mode.');
    }
    const nonLocalOrigins = origins.filter((o) => !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o));
    if (process.env.NODE_ENV === 'production' && nonLocalOrigins.length === 0) {
      console.warn(
        '⚠️ FRONTEND_URL is missing or only localhost — set it to your Vercel origin (e.g. https://myexamprep-theta.vercel.app) or browsers will get CORS errors.',
      );
    }
    if (process.env.GOOGLE_CLIENT_ID) {
      console.log('🔐 Google Sign-In: enabled (GIS ID token via POST /api/auth/google)');
    } else {
      console.warn('⚠️ GOOGLE_CLIENT_ID not set — Google Sign-In disabled.');
    }
    if (!getDBStatus()) {
      console.warn('⚠️ Database not connected — auth and data routes will return 503.');
    }
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
