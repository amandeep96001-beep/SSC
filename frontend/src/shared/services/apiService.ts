import { HttpError, errorMessage } from '@/types/app';

const SESSION_CLEARED_EVENT = 'examprep:session-cleared';

/** Auth endpoints where 401 means bad credentials, not an expired app session. */
const PUBLIC_AUTH_401 = [
  '/auth/login',
  '/auth/register',
  '/auth/otp/',
  '/auth/password/',
  '/auth/google',
];

export interface ApiJson {
  status?: string;
  message?: string;
  code?: string;
  requestId?: string;
  data?: unknown;
  meta?: unknown;
  details?: unknown;
  mailSent?: boolean;
  debugOtp?: string;
  lastStudyAt?: string;
  [key: string]: unknown;
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  timeout?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

function resolveApiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim();
  const normalize = (url: string) => (
    url.endsWith('/api') ? url : `${url.replace(/\/+$/, '')}/api`
  );

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!isLoopback && (import.meta.env.PROD || hostname.endsWith('vercel.app'))) {
      return '/api';
    }

    if (fromEnv) return normalize(fromEnv);

    if (!isLoopback) {
      return `${protocol}//${hostname}:5000/api`;
    }
  } else if (fromEnv) {
    return normalize(fromEnv);
  }

  return 'http://localhost:5000/api';
}

const BASE_URL = resolveApiBase();

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('ssc_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function clearClientSession(detail?: { code?: string; message?: string }): void {
  try {
    localStorage.removeItem('ssc_token');
    localStorage.removeItem('ssc_user');
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT, { detail: detail || {} }));
  }
}

function shouldClearSessionOn401(endpoint: string): boolean {
  const path = String(endpoint || '');
  return !PUBLIC_AUTH_401.some((prefix) => path.startsWith(prefix));
}

function handleUnauthorized(endpoint: string, result?: ApiJson): void {
  if (shouldClearSessionOn401(endpoint)) {
    clearClientSession({
      code: typeof result?.code === 'string' ? result.code : undefined,
      message: typeof result?.message === 'string' ? result.message : undefined,
    });
  }
}

function toHttpError(result: ApiJson, status: number): HttpError {
  const message = result.message || `Request failed with status ${status}`;
  return new HttpError(message, {
    status,
    code: typeof result.code === 'string' ? result.code : undefined,
    requestId: typeof result.requestId === 'string' ? result.requestId : undefined,
    details: result.details,
  });
}

async function request(endpoint: string, options: RequestOptions = {}): Promise<ApiJson> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const { timeout = 10000, signal: externalSignal, body, ...restOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(id);
      const err = new Error('Request aborted');
      err.name = 'AbortError';
      throw err;
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    signal: controller.signal,
    cache: 'no-store',
  };

  if (body !== undefined && typeof body === 'object') {
    config.body = JSON.stringify(body);
  } else if (typeof body === 'string') {
    config.body = body;
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }

    const contentType = response.headers.get('content-type');
    let result: ApiJson;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json() as ApiJson;
    } else {
      const text = await response.text();
      result = { message: text || `Request failed with status ${response.status}` };
    }

    // Prefer server request id; fall back to response header.
    const headerId = response.headers.get('x-request-id');
    if (!result.requestId && headerId) result.requestId = headerId;

    if (response.status === 401) {
      handleUnauthorized(endpoint, result);
    }

    if (!response.ok) {
      throw toHttpError(result, response.status);
    }

    return result;
  } catch (error) {
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw error;
      }
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  }
}

export const apiService = {
  get: (endpoint: string, options?: RequestOptions) =>
    request(endpoint, { method: 'GET', ...options }),
  post: (endpoint: string, body?: unknown, options?: RequestOptions) =>
    request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint: string, body?: unknown, options?: RequestOptions) =>
    request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint: string, body?: unknown, options?: RequestOptions) =>
    request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint: string, options?: RequestOptions) =>
    request(endpoint, { method: 'DELETE', ...options }),
  addVocabBulkApi: (body: unknown, options?: RequestOptions) =>
    request('/study/vocab/bulk', { method: 'POST', body, ...options }),

  clearSession: clearClientSession,

  onSessionCleared(handler: (detail?: { code?: string; message?: string }) => void) {
    if (typeof window === 'undefined') return () => {};
    const fn = (event: Event) => {
      const detail = (event as CustomEvent<{ code?: string; message?: string }>).detail;
      handler(detail);
    };
    window.addEventListener(SESSION_CLEARED_EVENT, fn);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, fn);
  },

  async download(endpoint: string, filename?: string) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
        ...getAuthHeaders(),
      },
      cache: 'no-store',
    });
    if (response.status === 401) {
      let detail: ApiJson | undefined;
      try {
        detail = await response.clone().json() as ApiJson;
      } catch { /* ignore */ }
      handleUnauthorized(endpoint, detail);
    }
    if (!response.ok) {
      let message = `Download failed (${response.status})`;
      let code: string | undefined;
      let requestId: string | undefined;
      try {
        const j = await response.json() as ApiJson;
        if (j?.message) message = j.message;
        if (typeof j?.code === 'string') code = j.code;
        if (typeof j?.requestId === 'string') requestId = j.requestId;
      } catch { /* ignore */ }
      throw new HttpError(message, { status: response.status, code, requestId });
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const j = JSON.parse(text) as { message?: string };
        throw new Error(j?.message || 'Export failed.');
      } catch (e) {
        const msg = errorMessage(e);
        if (msg && msg !== 'Export failed.' && !msg.startsWith('Unexpected')) throw e;
        throw new Error('Export failed — unexpected server response.');
      }
    }

    if (!text || !String(text).trim()) {
      throw new Error('Export file was empty.');
    }

    const withBom = text.charCodeAt(0) === 0xfeff ? text : `\uFEFF${text}`;
    const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'export.csv';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  },
};
