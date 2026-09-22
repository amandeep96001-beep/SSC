import { apiService, type ApiJson, type RequestOptions } from '@/shared/services/apiService';
import type { AuthApiPayload, ProgressRow, MockProgressRow } from '@/types/app';

export const authApi = {
  login: (body: { username?: string; email?: string; password: string }, opts?: RequestOptions) =>
    apiService.post('/auth/login', body, opts),

  register: (body: { email: string; password: string; username?: string }, opts?: RequestOptions) =>
    apiService.post('/auth/register', body, { timeout: 25000, ...opts }),

  google: (body: { code?: string; credential?: string }, opts?: RequestOptions) =>
    apiService.post('/auth/google', body, opts),

  /** Profile refresh. Pass includeAvatar when the UI needs the photo. */
  me: (opts?: { includeAvatar?: boolean } & RequestOptions) => {
    const q = opts?.includeAvatar ? '?include=avatar' : '';
    const { includeAvatar: _i, ...rest } = opts || {};
    void _i;
    return apiService.get(`/auth/me${q}`, rest);
  },

  updateProfile: (
    body: { displayName?: string | null; avatarUrl?: string | null },
    opts?: RequestOptions,
  ) => apiService.patch('/auth/me', body, { timeout: 30000, ...opts }),

  logout: (opts?: RequestOptions) => apiService.post('/auth/logout', undefined, opts),

  requestOtp: (body: { email: string }, opts?: RequestOptions) =>
    apiService.post('/auth/otp/request', body, { timeout: 20000, ...opts }),

  verifyOtp: (body: { email: string; code: string }, opts?: RequestOptions) =>
    apiService.post('/auth/otp/verify', body, opts),

  forgotPassword: (body: { email: string }, opts?: RequestOptions) =>
    apiService.post('/auth/password/forgot', body, { timeout: 35000, ...opts }),

  verifyPasswordResetOtp: (body: { email: string; code: string }, opts?: RequestOptions) =>
    apiService.post('/auth/password/verify-otp', body, { timeout: 20000, ...opts }),

  resetPassword: (body: { token: string; password: string }, opts?: RequestOptions) =>
    apiService.post('/auth/password/reset', body, { timeout: 20000, ...opts }),

  saveProgress: (body: unknown, opts?: RequestOptions) =>
    apiService.post('/auth/progress', body, opts),

  saveMockProgress: (body: unknown, opts?: RequestOptions) =>
    apiService.post('/auth/mock-progress', body, opts),

  listProgress: (opts?: { limit?: number; before?: string } & RequestOptions) => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    const q = params.toString();
    return apiService.get(`/auth/progress${q ? `?${q}` : ''}`, opts);
  },

  listMockProgress: (opts?: { limit?: number; before?: string } & RequestOptions) => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    const q = params.toString();
    return apiService.get(`/auth/mock-progress${q ? `?${q}` : ''}`, opts);
  },
};

export function asAuthPayload(value: unknown): AuthApiPayload | null {
  if (!value || typeof value !== 'object') return null;
  return value as AuthApiPayload;
}

export type { ApiJson, ProgressRow, MockProgressRow };
