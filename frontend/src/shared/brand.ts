/** App brand — single source of truth for product naming + SEO */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'Crack every exam';
export const APP_VERSION = '2.3';

/** Production site origin — set VITE_SITE_URL when you buy the domain (no trailing slash). */
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export const SEO_DEFAULT_TITLE =
  'CrackuEx — SSC CGL, CHSL, GD, CPO and MTS practice';

export const SEO_DEFAULT_DESCRIPTION =
  'Free SSC CGL, CHSL, GD, CPO and MTS practice: topic notes, speed drills, mocks and revision. ' +
  'Each exam follows its own official notice — patterns are not the same.';

export const SEO_KEYWORDS = [
  'SSC CGL notes',
  'SSC CHSL practice',
  'SSC GD syllabus',
  'SSC CPO preparation',
  'SSC MTS practice',
  'percentage tricks for SSC',
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
