import { Redis } from 'ioredis';

let client: Redis | null = null;
let initAttempted = false;

export function getRedis(): Redis | null {
  if (initAttempted) return client;
  initAttempted = true;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    console.info('[redis] REDIS_URL unset — using in-process memory cache/rate-limits');
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
      console.error('[redis] error:', err.message);
    });
    client.on('connect', () => {
      console.info('[redis] connected');
    });
    return client;
  } catch (err) {
    console.error('[redis] failed to init:', err instanceof Error ? err.message : err);
    client = null;
    return null;
  }
}

export function isRedisReady(): boolean {
  return Boolean(client && client.status === 'ready');
}
