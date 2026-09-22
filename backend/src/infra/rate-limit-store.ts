import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { getRedis } from './redis.js';

/**
 * Redis-backed store for express-rate-limit so limits stay correct across
 * multiple API instances. Falls back to the default memory store when Redis
 * is unavailable.
 */
export class RedisRateLimitStore implements Store {
  prefix: string;
  windowMs = 60_000;
  #local = new Map<string, { hits: number; resetTime: number }>();

  constructor(prefix = 'rl') {
    this.prefix = `ssc:rl:${prefix}:`;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const redis = getRedis();
    const full = `${this.prefix}${key}`;
    const now = Date.now();

    if (redis) {
      try {
        const hits = await redis.incr(full);
        if (hits === 1) {
          await redis.pexpire(full, this.windowMs);
        }
        const pttl = await redis.pttl(full);
        const resetTime = new Date(now + (pttl > 0 ? pttl : this.windowMs));
        return { totalHits: hits, resetTime };
      } catch {
        /* fall through */
      }
    }

    let entry = this.#local.get(full);
    if (!entry || entry.resetTime <= now) {
      entry = { hits: 0, resetTime: now + this.windowMs };
      this.#local.set(full, entry);
    }
    entry.hits += 1;
    return { totalHits: entry.hits, resetTime: new Date(entry.resetTime) };
  }

  async decrement(key: string): Promise<void> {
    const redis = getRedis();
    const full = `${this.prefix}${key}`;
    if (redis) {
      try {
        await redis.decr(full);
        return;
      } catch {
        /* fall through */
      }
    }
    const entry = this.#local.get(full);
    if (entry && entry.hits > 0) entry.hits -= 1;
  }

  async resetKey(key: string): Promise<void> {
    const redis = getRedis();
    const full = `${this.prefix}${key}`;
    this.#local.delete(full);
    if (redis) {
      try {
        await redis.del(full);
      } catch {
        /* ignore */
      }
    }
  }
}

export function createRateLimitStore(prefix: string): Store | undefined {
  // Always return our store — it uses Redis when available, memory otherwise.
  return new RedisRateLimitStore(prefix);
}
