import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { getRedis } from './redis.js';
import { isHostedRuntime } from '../config/env.config.js';
import { logger } from '../lib/logger.js';
import { errorMessage } from '../types/domain.js';

const INCR_EXPIRE = `
local n = redis.call('INCR', KEYS[1])
if n == 1 or redis.call('PTTL', KEYS[1]) < 0 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return {n, redis.call('PTTL', KEYS[1])}
`;

let lastWarnAt = 0;

function warnRedis(err: unknown): void {
  const now = Date.now();
  if (now - lastWarnAt < 30_000) return;
  lastWarnAt = now;
  logger.warn({ err: errorMessage(err), msg: 'redis rate-limit failed' });
}

/**
 * Redis-backed store for express-rate-limit so limits stay correct across
 * API instances. Memory is local-only; hosted Redis errors fail open (allow).
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
        const raw = await redis.eval(INCR_EXPIRE, 1, full, String(this.windowMs));
        const pair = Array.isArray(raw) ? raw : [1, this.windowMs];
        const hits = Number(pair[0]) || 1;
        const pttl = Number(pair[1]);
        const resetTime = new Date(now + (pttl > 0 ? pttl : this.windowMs));
        return { totalHits: hits, resetTime };
      } catch (err) {
        warnRedis(err);
        if (isHostedRuntime()) {
          return { totalHits: 1, resetTime: new Date(now + this.windowMs) };
        }
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
      } catch (err) {
        warnRedis(err);
        if (isHostedRuntime()) return;
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
      } catch (err) {
        warnRedis(err);
      }
    }
  }
}

export function createRateLimitStore(prefix: string): Store | undefined {
  return new RedisRateLimitStore(prefix);
}
