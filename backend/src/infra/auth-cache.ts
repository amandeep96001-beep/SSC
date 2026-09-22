import { cacheDel, cacheGetJson, cacheSetJson } from '../infra/cache.js';

export type CachedAuthUser = {
  id: string;
  username: string;
  email?: string;
  role: string;
  tokenVersion: number;
};

const AUTH_TTL_SEC = Number(process.env.AUTH_CACHE_TTL_SEC || 45);

function authCacheKey(userId: string): string {
  return `auth:user:${userId}`;
}

export async function getCachedAuthUser(userId: string): Promise<CachedAuthUser | null> {
  return cacheGetJson<CachedAuthUser>(authCacheKey(userId));
}

export async function setCachedAuthUser(user: CachedAuthUser): Promise<void> {
  await cacheSetJson(authCacheKey(user.id), user, AUTH_TTL_SEC);
}

export async function invalidateAuthUser(userId: string): Promise<void> {
  await cacheDel(authCacheKey(userId));
}
