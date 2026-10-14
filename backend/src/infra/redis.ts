import { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';
import { isHostedRuntime } from '../config/env.config.js';

let client: Redis | null = null;
let initAttempted = false;

function redisUrl(): string {
  return process.env.REDIS_URL?.trim() || '';
}

export function getRedis(): Redis | null {
  if (initAttempted) return client;
  initAttempted = true;

  const url = redisUrl();
  if (!url) {
    if (isHostedRuntime()) {
      logger.error('REDIS_URL is required in production');
    } else {
      logger.info('REDIS_URL unset — using in-process memory cache/rate-limits');
    }
    return null;
  }

  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: false,
      connectTimeout: 8000,
      retryStrategy(times) {
        if (times > 20) return null;
        return Math.min(times * 200, 3000);
      },
    });
    client.on('error', (err: Error) => {
      logger.error({ err: err.message, msg: 'redis error' });
    });
    client.on('ready', () => {
      logger.info('redis ready');
    });
    client.on('end', () => {
      logger.warn('redis connection ended');
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

export function waitForRedis(timeoutMs = 10_000): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return Promise.resolve(false);
  if (redis.status === 'ready') return Promise.resolve(true);

  return new Promise((resolve) => {
    const onReady = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      redis.off('ready', onReady);
      resolve(false);
    }, timeoutMs);
    redis.once('ready', onReady);
  });
}

export async function closeRedis(): Promise<void> {
  if (!client) {
    initAttempted = false;
    return;
  }
  const current = client;
  client = null;
  initAttempted = false;
  try {
    await current.quit();
  } catch {
    current.disconnect();
  }
}
