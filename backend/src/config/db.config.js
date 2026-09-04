import mongoose from 'mongoose';
import Subject from '../modules/study/subject.model.js';

const CONNECT_OPTS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  // Render (and many PaaS hosts) resolve Atlas SRV to IPv6 first; Atlas often
  // only accepts IPv4. Forcing IPv4 avoids a silent connect timeout.
  family: 4,
};

let eventsBound = false;
let retryTimer = null;
let retryDelayMs = 8000;
let postSetupDone = false;

function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  mongoose.connection.on('connected', () => {
    console.log('🔥 MongoDB connected (Atlas ☁️)');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('🔥 MongoDB reconnected');
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected — will retry');
    scheduleRetry();
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });
}

async function runPostConnectSetup() {
  if (postSetupDone) return;
  try {
    // Drop legacy unique-on-name index so users can create personal subjects
    try {
      await Subject.collection.dropIndex('name_1');
      console.log('🧹 Dropped legacy Subject.name unique index');
    } catch (err) {
      if (err?.codeName !== 'IndexNotFound' && err?.code !== 27) {
        console.warn('Subject index migrate note:', err.message);
      }
    }
    await Subject.syncIndexes();
    postSetupDone = true;
  } catch (error) {
    console.warn('⚠️ Post-connection setup warning:', error.message);
  }
}

function scheduleRetry() {
  if (retryTimer) return;
  if (mongoose.connection.readyState === 1) return;

  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      return;
    }
    try {
      await attemptConnect();
    } catch (err) {
      console.error('❌ MongoDB retry failed:', err.message);
      retryDelayMs = Math.min(Math.round(retryDelayMs * 1.5), 60000);
      scheduleRetry();
    }
  }, retryDelayMs);
}

async function attemptConnect() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri, CONNECT_OPTS);
  retryDelayMs = 8000;
  await runPostConnectSetup();
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  bindConnectionEvents();

  try {
    await attemptConnect();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error(
      '   Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0).',
    );
    console.error('   Then restart the Render service so it reconnects.');
    scheduleRetry();
    // Do not exit: keep serving /health and retry in the background so
    // allowing Atlas IPs takes effect without a full redeploy.
  }
};

export const getDBStatus = () => {
  return mongoose.connection.readyState === 1;
};
