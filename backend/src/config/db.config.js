import dns from 'node:dns';
import mongoose from 'mongoose';
import Subject from '../modules/study/subject.model.js';

// Render / Node often prefer IPv6; Atlas shared clusters need IPv4.
dns.setDefaultResultOrder('ipv4first');

const CONNECT_OPTS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  autoSelectFamily: false,
  // Atlas DB users live in admin (path /ssc_prep is the app DB only).
  authSource: 'admin',
};

function normalizeUri(raw) {
  let uri = String(raw || '').trim().replace(/\s+/g, '');
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }
  return uri;
}

async function migrateSubjectIndexes() {
  try {
    await Subject.collection.dropIndex('name_1');
  } catch (err) {
    if (err?.codeName !== 'IndexNotFound' && err?.code !== 27) {
      console.warn('Subject index migrate:', err.message);
    }
  }
  await Subject.syncIndexes();
}

export async function connectDB() {
  const uri = normalizeUri(process.env.MONGODB_URI);
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri, CONNECT_OPTS);
  await migrateSubjectIndexes();
}

export function getDBStatus() {
  return mongoose.connection.readyState === 1;
}
