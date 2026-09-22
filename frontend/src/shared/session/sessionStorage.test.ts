import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeUserProfile,
  persistSession,
  readStoredUser,
  clearStoredSession,
} from '@/shared/session/sessionStorage';

describe('sessionStorage', () => {
  beforeEach(() => {
    clearStoredSession();
    localStorage.clear();
  });

  it('does not wipe avatar when slim profile has avatarUrl null', () => {
    const current = {
      username: 'aman',
      id: 'u1',
      avatarUrl: 'data:image/png;base64,abc',
      progress: [{ topicId: 't1', score: 10 }],
    };
    const next = mergeUserProfile(current, {
      username: 'aman',
      id: 'u1',
      avatarUrl: null,
      role: 'admin',
    });
    expect(next.avatarUrl).toBe('data:image/png;base64,abc');
    expect(next.role).toBe('admin');
    expect(next.progress?.[0]?.topicId).toBe('t1');
  });

  it('updates avatar when server sends a real value', () => {
    const next = mergeUserProfile(
      { username: 'aman', avatarUrl: 'old' },
      { username: 'aman', avatarUrl: 'new-url' },
    );
    expect(next.avatarUrl).toBe('new-url');
  });

  it('persistSession stores token and profile', () => {
    const profile = persistSession({
      token: 'jwt-token',
      username: 'aman',
      id: 'abc123',
      email: 'a@b.com',
    });
    expect(profile.id).toBe('abc123');
    expect(localStorage.getItem('ssc_token')).toBe('jwt-token');
    expect(readStoredUser()?.username).toBe('aman');
  });
});
