const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

/**
 * Standard fetch helper that handles request headers, parsing, and custom error formats.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set default content type to JSON
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Default timeout of 10 seconds (10000ms)
  const { timeout = 10000, ...restOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const config = {
    ...restOptions,
    headers,
    signal: controller.signal,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(id);

    // Safeguard response parsing (avoid crashing on HTML/non-JSON pages)
    const contentType = response.headers.get('content-type');
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text || `Request failed with status ${response.status}` };
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend server is running.');
    }
    console.error(`[API Service Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const apiService = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  addVocabBulkApi: (body, options) => request('/study/vocab/bulk', { method: 'POST', body, ...options }),
};
