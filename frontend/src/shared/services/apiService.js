function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim();
  if (fromEnv) {
    return fromEnv.endsWith('/api') ? fromEnv : `${fromEnv.replace(/\/+$/, '')}/api`;
  }
  // Same-origin /api (Vercel rewrite → Render) when no VITE_API_URL is baked in
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return '/api';
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

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const { timeout = 10000, ...restOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

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

    const contentType = response.headers.get('content-type');
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text || `Request failed with status ${response.status}` };
    }

    if (response.status === 401) {
      localStorage.removeItem('ssc_token');
      localStorage.removeItem('ssc_user');
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
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
      localStorage.removeItem('ssc_token');
      localStorage.removeItem('ssc_user');
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

    // Server sometimes returns JSON error with a 200-ish proxy, or empty body
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

    // UTF-8 BOM so Excel / Sheets show columns correctly
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
    // Revoke after browsers start the download — immediate revoke can yield empty files
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  },
};
