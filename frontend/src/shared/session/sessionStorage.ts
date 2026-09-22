/**
 * Safe client session helpers — never wipe avatar/progress with thin /auth/me payloads.
 */
import type { AppUser, AuthApiPayload, ProgressRow, MockProgressRow } from '@/types/app';
import { isRecord } from '@/types/app';

const TOKEN_KEY = 'ssc_token';
const USER_KEY = 'ssc_user';

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readStoredUser(): AppUser | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (!token || !stored) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed) || typeof parsed.username !== 'string') return null;
    const { password: _password, ...profile } = parsed;
    void _password;
    return profile as unknown as AppUser;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

/**
 * Merge a server profile into the current client user without clobbering
 * fields the slim endpoints intentionally omit (avatar, progress).
 */
export function mergeUserProfile(
  current: AppUser | null,
  incoming: AuthApiPayload | AppUser | Record<string, unknown>,
  opts: { replaceProgress?: boolean } = {},
): AppUser {
  const base: AppUser = current || { username: String(incoming.username || '') };
  const next: AppUser = {
    ...base,
    username: String(incoming.username || base.username),
  };

  if (typeof incoming.id === 'string' && incoming.id) next.id = incoming.id;
  if ('email' in incoming) next.email = (incoming.email as string | null | undefined) ?? null;
  if ('displayName' in incoming) {
    next.displayName = (incoming.displayName as string | null | undefined) ?? null;
  }
  if ('emailVerified' in incoming) next.emailVerified = Boolean(incoming.emailVerified);
  if ('role' in incoming && incoming.role) next.role = incoming.role as AppUser['role'];
  if ('lastStudyAt' in incoming) {
    next.lastStudyAt = (incoming.lastStudyAt as string | null | undefined) ?? null;
  }

  // Slim /auth/me omits avatar unless ?include=avatar — never overwrite with null.
  if (
    'avatarUrl' in incoming
    && incoming.avatarUrl !== null
    && incoming.avatarUrl !== undefined
  ) {
    next.avatarUrl = incoming.avatarUrl as string;
  }

  if (opts.replaceProgress !== false) {
    if (Array.isArray(incoming.progress)) {
      next.progress = incoming.progress as ProgressRow[];
    }
    if (Array.isArray(incoming.mockProgress)) {
      next.mockProgress = incoming.mockProgress as MockProgressRow[];
    }
  }

  return next;
}

/** Persist session after login/google — stores token separately from profile. */
export function persistSession(payload: AuthApiPayload | Record<string, unknown>): AppUser {
  const { token, password: _password, ...rest } = payload as AuthApiPayload & { password?: unknown };
  void _password;
  if (typeof token === 'string' && token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  const profile = mergeUserProfile(null, rest as AuthApiPayload, { replaceProgress: true });
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  return profile;
}

export function writeStoredUser(user: AppUser): void {
  const { token: _t, ...profile } = user as AppUser & { token?: string };
  void _t;
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
}
