import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

delete process.env.REDIS_URL;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

const { closeRedis } = await import('../src/infra/redis.js');
const {
  cacheDel,
  cacheGet,
  cacheGetJson,
  cacheSet,
  cacheSetJson,
  resetMemoryCache,
} = await import('../src/infra/cache.js');

beforeAll(async () => {
  delete process.env.REDIS_URL;
  await closeRedis();
});

afterEach(() => {
  resetMemoryCache();
  vi.useRealTimers();
});

describe('memory cache', () => {
  it('sets and gets a value', async () => {
    await cacheSet('k1', 'v1', 60);
    expect(await cacheGet('k1')).toBe('v1');
  });

  it('round-trips JSON', async () => {
    await cacheSetJson('j1', { a: 1 }, 60);
    expect(await cacheGetJson<{ a: number }>('j1')).toEqual({ a: 1 });
  });

  it('deletes a key', async () => {
    await cacheSet('k3', 'v3', 60);
    await cacheDel('k3');
    expect(await cacheGet('k3')).toBeNull();
  });

  it('expires after TTL', async () => {
    vi.useFakeTimers();
    await cacheSet('k2', 'v2', 1);
    vi.advanceTimersByTime(1100);
    expect(await cacheGet('k2')).toBeNull();
  });
});
