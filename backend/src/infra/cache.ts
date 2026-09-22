import { createHash } from 'node:crypto';
import { getRedis } from './redis.js';

type MemoryEntry = { value: string; expiresAt: number };

const memory = new Map<string, MemoryEntry>();
const MAX_MEMORY_KEYS = Number(process.env.CACHE_MAX_KEYS || 20_000);

function pruneMemory(): void {
  if (memory.size <= MAX_MEMORY_KEYS) return;
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
  if (memory.size <= MAX_MEMORY_KEYS) return;
  const excess = memory.size - MAX_MEMORY_KEYS;
  let removed = 0;
  for (const key of memory.keys()) {
    memory.delete(key);
    removed += 1;
    if (removed >= excess) break;
  }
}

function prefixKey(key: string): string {
  return `ssc:${key}`;
}

export function cacheHash(parts: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
}

export async function cacheGet(key: string): Promise<string | null> {
  const full = prefixKey(key);
  const redis = getRedis();
  if (redis) {
    try {
      return await redis.get(full);
    } catch {
      /* fall through to memory */
    }
  }

  const entry = memory.get(full);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(full);
    return null;
  }
  return entry.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const full = prefixKey(key);
  const ttl = Math.max(1, Math.floor(ttlSeconds));
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(full, value, 'EX', ttl);
      return;
    } catch {
      /* fall through to memory */
    }
  }

  memory.set(full, { value, expiresAt: Date.now() + ttl * 1000 });
  pruneMemory();
}

export async function cacheDel(key: string): Promise<void> {
  const full = prefixKey(key);
  memory.delete(full);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(full);
    } catch {
      /* ignore */
    }
  }
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}
