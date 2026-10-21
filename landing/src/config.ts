/**
 * Standalone landing → main app.
 * Set VITE_APP_URL on the landing host (e.g. https://app.example.com).
 * Local default is the Vite app on :5173.
 */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'SSC practice';

const LOCAL_APP = 'http://localhost:5173';
const PROD_APP = 'https://ssc-3wex.vercel.app';

export const APP_URL = String(
  import.meta.env.VITE_APP_URL || (import.meta.env.PROD ? PROD_APP : LOCAL_APP),
).replace(/\/+$/, '');

export function navigateToApp(path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  window.location.href = `${APP_URL}${clean === '/' ? '/' : clean}`;
}
