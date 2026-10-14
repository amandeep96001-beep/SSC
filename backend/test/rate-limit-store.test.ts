import { beforeAll, describe, expect, it } from 'vitest';
import type { Options } from 'express-rate-limit';

delete process.env.REDIS_URL;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

const { closeRedis } = await import('../src/infra/redis.js');
const { RedisRateLimitStore } = await import('../src/infra/rate-limit-store.js');

beforeAll(async () => {
  delete process.env.REDIS_URL;
  await closeRedis();
});

describe('memory rate-limit store', () => {
  it('counts hits in the same window', async () => {
    const store = new RedisRateLimitStore('test');
    store.init({ windowMs: 60_000 } as Options);

    const first = await store.increment('ip-1');
    const second = await store.increment('ip-1');
    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);

    await store.resetKey('ip-1');
    const afterReset = await store.increment('ip-1');
    expect(afterReset.totalHits).toBe(1);
  });
});
