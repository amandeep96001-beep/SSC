import { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';

let client: Redis | null = null;
let initAttempted = false;

export function getRedis(): Redis | null {
  if (initAttempted) return client;
  initAttempted = true;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    logger.info('REDIS_URL unset — using in-process memory cache/rate-limits');
    return null;
  }

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 8000,
    });
    client.on('error', (err: Error) => {
      logger.error({ err: err.message, msg: 'redis error' });
    });
    client.on('connect', () => {
      logger.info('redis connected');
    });
    return client;
  } catch (err) {
    logger.error({ err, msg: 'redis failed to init' });
    client = null;
    return null;
  }
}

export function isRedisReady(): boolean {
  return Boolean(client && client.status === 'ready');
}
