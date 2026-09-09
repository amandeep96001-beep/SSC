const SESSION_CLEARED_EVENT = 'examprep:session-cleared';

/** Auth endpoints where 401 means bad credentials, not an expired app session. */
const PUBLIC_AUTH_401 = [
  '/auth/login',
  '/auth/register',
  '/auth/otp/',
  '/auth/password/',
  '/auth/google',
];

function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim();
  const normalize = (url) => (
    url.endsWith('/api') ? url : `${url.replace(/\/+$/, '')}/api`
  );

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

    // Deployed frontend (Vercel / custom domain): same-origin /api → vercel.json rewrite.
    // Never bake a stale VITE_API_URL to an old Render host in production builds.
    if (!isLoopback && (import.meta.env.PROD || hostname.endsWith('vercel.app'))) {
      return '/api';
    }

    if (fromEnv) return normalize(fromEnv);

    // LAN phone testing against a local API on port 5000
    if (!isLoopback) {
      return `${protocol}//${hostname}:5000/api`;
    }
  } else if (fromEnv) {
    return normalize(fromEnv);
  }

  return 'http://localhost:5000/api';
}

const BASE_URL = resolveApiBase();

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('ssc_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function clearClientSession() {
  try {
    localStorage.removeItem('ssc_token');
    localStorage.removeItem('ssc_user');
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT));
  }
}

function shouldClearSessionOn401(endpoint) {
  const path = String(endpoint || '');
  return !PUBLIC_AUTH_401.some((prefix) => path.startsWith(prefix));
}

function handleUnauthorized(endpoint) {
  if (shouldClearSessionOn401(endpoint)) {
    clearClientSession();
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const { timeout = 10000, signal: externalSignal, ...restOptions } = options;

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

  const config = {
    ...restOptions,
    headers,
    signal: controller.signal,
    cache: 'no-store',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }

    const contentType = response.headers.get('content-type');
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text || `Request failed with status ${response.status}` };
    }

    if (response.status === 401) {
      handleUnauthorized(endpoint);
    }

    if (!response.ok) {
      const err = new Error(result.message || `Request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return result;
  } catch (error) {
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
    if (error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw error;
      }
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  }
}

export const apiService = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  addVocabBulkApi: (body, options) => request('/study/vocab/bulk', { method: 'POST', body, ...options }),

  /** Clear storage + notify React (e.g. logout). */
  clearSession: clearClientSession,

  /** Subscribe to session wipe from 401 / logout. Returns unsubscribe. */
  onSessionCleared(handler) {
    if (typeof window === 'undefined') return () => {};
    const fn = () => handler();
    window.addEventListener(SESSION_CLEARED_EVENT, fn);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, fn);
  },

  /** Download CSV (or other non-JSON) with auth headers */
  async download(endpoint, filename) {
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
      handleUnauthorized(endpoint);
    }
    if (!response.ok) {
      let message = `Download failed (${response.status})`;
      try {
        const j = await response.json();
        if (j?.message) message = j.message;
      } catch { /* ignore */ }
      throw new Error(message);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const j = JSON.parse(text);
        throw new Error(j?.message || 'Export failed.');
      } catch (e) {
        if (e.message && e.message !== 'Export failed.' && !e.message.startsWith('Unexpected')) throw e;
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
