/** App brand — single source of truth for product naming + SEO */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'Crack every exam';
export const APP_VERSION = '2.3';

/** Production site origin — set VITE_SITE_URL when you buy the domain (no trailing slash). */
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export const SEO_DEFAULT_TITLE =
  'CrackuEx — Competitive Exam Prep';

export const SEO_DEFAULT_DESCRIPTION =
  'Free competitive exam preparation — drills, mocks, notes, vocabulary and revision decks. ' +
  'Study calm, practice daily, and sit for the exam ready.';

export const SEO_KEYWORDS = [
  'competitive exam preparation',
  'exam mock test',
  'exam practice app',
  'multiplication tables drill',
  'vocabulary practice',
  'fraction percentage conversion',
  'CrackuEx',
].join(', ');

export function pageTitle(section?: string | null): string {
  if (!section) return SEO_DEFAULT_TITLE;
  return `${section} | ${APP_NAME} — Exam Prep`;
}

export function absoluteUrl(path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!SITE_URL) return p;
  return `${SITE_URL}${p}`;
}
