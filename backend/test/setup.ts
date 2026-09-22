process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.REMINDER_CRON = '0';
process.env.SESSION_PROGRESS_LIMIT = '50';
delete process.env.REDIS_URL;

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Express } from 'express';

let mongo: MongoMemoryServer | null = null;

export async function setupTestApp(): Promise<Express> {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const { createApp } = await import('../src/app.js');
  return createApp();
}

export async function teardownTestApp(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
}
