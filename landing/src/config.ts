/**
 * Standalone Landing Page Configuration
 * 
 * Set VITE_APP_URL in your hosting platform (Vercel / Netlify / Cloudflare / .env)
 * to point to your main application dashboard.
 * Example: VITE_APP_URL=https://app.crackuex.com
 */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'SSC & Competitive Exam Prep Studio';

export const APP_URL = (
  import.meta.env.VITE_APP_URL || 
  (typeof window !== 'undefined' && window.location.port === '5174' 
    ? 'http://localhost:5173' 
    : '/')
);

export function navigateToApp(path = '') {
  const target = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  window.location.href = `${target}${cleanPath === '/' ? '' : cleanPath}`;
}
