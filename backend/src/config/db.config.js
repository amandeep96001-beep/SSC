import dns from 'node:dns';
import mongoose from 'mongoose';
import Subject from '../modules/study/subject.model.js';
import { isHostedRuntime } from './env.config.js';

// Node 18+ / Render prefer IPv6; Atlas M0/shared clusters are IPv4-only
// unless IPv6 is explicitly enabled. Force IPv4 first so connect does not hang.
dns.setDefaultResultOrder('ipv4first');

const CONNECT_OPTS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  autoSelectFamily: false,
  // Atlas DB users live in the admin database, not the app db in the URI path.
  authSource: 'admin',
};

const READY = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
};

let eventsBound = false;
let retryTimer = null;
let retryDelayMs = 8000;
let postSetupDone = false;
let lastConnectError = null;
let lastConnectAt = null;
let connecting = false;
let initialConnectSucceeded = false;

function normalizeMongoUri(raw) {
  let uri = String(raw || '').trim();
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }
  return uri;
}

function withAtlasParams(raw) {
  const uri = normalizeMongoUri(raw);
  const extras = [];
  if (!/[?&]authSource=/i.test(uri)) extras.push('authSource=admin');
  if (!/[?&]retryWrites=/i.test(uri)) extras.push('retryWrites=true');
  if (!/[?&]w=/i.test(uri)) extras.push('w=majority');
  if (extras.length === 0) return uri;
  return uri.includes('?') ? `${uri}&${extras.join('&')}` : `${uri}?${extras.join('&')}`;
}

function inspectMongoUri(raw) {
  const uri = normalizeMongoUri(raw);
  if (!uri) {
    return { present: false };
  }

  const looksLocal = /:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)[:/]/i.test(uri);
  const hasPlaceholder = /<[^>]+>|YOUR_|changeme/i.test(uri);
  const isSrv = /^mongodb\+srv:/i.test(uri);
  const hasAuthSource = /[?&]authSource=/i.test(uri);

  let hostname = null;
  try {
    const fake = uri.replace(/^mongodb\+srv:/i, 'https:').replace(/^mongodb:/i, 'http:');
    hostname = new URL(fake).hostname || null;
  } catch {
    return {
      present: true,
      parseable: false,
      looksLocal,
      hasPlaceholder,
      isSrv,
      hasAuthSource,
    };
  }

  return {
    present: true,
    parseable: true,
    looksLocal,
    hasPlaceholder,
    isSrv,
    hasAuthSource,
    host: hostname,
  };
}

function recordFailure(err) {
  lastConnectError = err?.message || String(err);
  lastConnectAt = new Date().toISOString();
}

function recordSuccess() {
  lastConnectError = null;
  lastConnectAt = new Date().toISOString();
  initialConnectSucceeded = true;
}

function bindConnectionEvents() {
  if (eventsBound) return;
  eventsBound = true;

  mongoose.connection.on('connected', () => {
    recordSuccess();
    console.log('🔥 MongoDB connected (Atlas ☁️)');
  });
  mongoose.connection.on('reconnected', () => {
    recordSuccess();
    console.log('🔥 MongoDB reconnected');
  });
  mongoose.connection.on('disconnected', () => {
    if (connecting) return;
    console.warn('⚠️ MongoDB disconnected');
    // After a successful handshake, the driver reconnects itself.
    // Re-running mongoose.connect() here races that and can retry with a
    // redacted URI → "bad auth : authentication failed".
    if (!initialConnectSucceeded) {
      scheduleRetry();
    }
  });
  mongoose.connection.on('error', (err) => {
    recordFailure(err);
    console.error('❌ MongoDB error:', err.message);
  });
}

async function runPostConnectSetup() {
  if (postSetupDone) return;
  try {
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
  if (mongoose.connection.readyState === READY.connected) return;
  if (initialConnectSucceeded) return;

  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (
      mongoose.connection.readyState === READY.connected ||
      mongoose.connection.readyState === READY.connecting ||
      initialConnectSucceeded
    ) {
      return;
    }
    try {
      await attemptConnect();
    } catch (err) {
      recordFailure(err);
      console.error('❌ MongoDB retry failed:', err.message);
      retryDelayMs = Math.min(Math.round(retryDelayMs * 1.5), 60000);
      scheduleRetry();
    }
  }, retryDelayMs);
}

async function resetClient() {
  try {
    await mongoose.disconnect();
  } catch {
    // already closed
  }
}

async function attemptConnect() {
  const uri = withAtlasParams(process.env.MONGODB_URI);
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  const info = inspectMongoUri(uri);
  if (isHostedRuntime() && info.looksLocal) {
    throw new Error(
      'MONGODB_URI points at localhost. Render cannot reach MongoDB on your laptop — use the Atlas mongodb+srv:// URI.',
    );
  }
  if (info.hasPlaceholder) {
    throw new Error('MONGODB_URI still contains a placeholder like <password>. Paste the real Atlas URI.');
  }
  if (!info.parseable) {
    throw new Error('MONGODB_URI is not a valid Mongo connection string (remove wrapping quotes).');
  }

  if (mongoose.connection.readyState === READY.connected) {
    return;
  }

  connecting = true;
  try {
    if (mongoose.connection.readyState !== READY.disconnected) {
      await resetClient();
    }

    console.log(
      `🔌 Mongo connecting → ${info.isSrv ? 'srv' : 'std'} ${info.host || '(unknown host)'}`,
    );
    await mongoose.connect(uri, CONNECT_OPTS);
    retryDelayMs = 8000;
    recordSuccess();
    await runPostConnectSetup();
  } finally {
    connecting = false;
  }
}

export const connectDB = async () => {
  const uri = withAtlasParams(process.env.MONGODB_URI);

  if (!normalizeMongoUri(process.env.MONGODB_URI)) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  const info = inspectMongoUri(uri);
  console.log(
    `🗄️  MONGODB_URI host=${info.host || 'unparseable'} srv=${info.isSrv} local=${info.looksLocal} authSource=${info.hasAuthSource}`,
  );
  if (isHostedRuntime() && info.looksLocal) {
    console.error('❌ On Render, MONGODB_URI must be the Atlas mongodb+srv:// string, not localhost.');
  }

  bindConnectionEvents();

  try {
    await attemptConnect();
  } catch (err) {
    recordFailure(err);
    console.error('❌ MongoDB connection failed:', err.message);
    if (/bad auth|authentication failed/i.test(err.message || '')) {
      console.error(
        '   Atlas → Database Access: username/password in MONGODB_URI must match. Reset the user password and update Render.',
      );
    } else {
      console.error(
        '   Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0).',
      );
    }
    scheduleRetry();
  }
};

export const getDBStatus = () => {
  return mongoose.connection.readyState === READY.connected;
};

export const getLastDbError = () => lastConnectError;

export const getDBDiagnostics = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === READY.connected,
    readyState,
    state: states[readyState] || String(readyState),
    lastConnectAt,
    lastError: lastConnectError,
    uri: inspectMongoUri(process.env.MONGODB_URI),
  };
};
