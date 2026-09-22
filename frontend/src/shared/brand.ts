/** App brand — single source of truth for product naming + SEO */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'Crack every exam';
export const APP_VERSION = '2.3';

/** Production site origin — set VITE_SITE_URL when you buy the domain (no trailing slash). */
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export const SEO_DEFAULT_TITLE =
  'CrackuEx — SSC CGL, CHSL, GD, Banking & Railways Exam Prep';

export const SEO_DEFAULT_DESCRIPTION =
  'Free SSC exam preparation app for CGL, CHSL, GD, CPO, MTS, Banking and Railways. ' +
  'Practice tables, fractions, vocabulary, PYQ mocks, notes, daily drills and revision decks — built for serious aspirants.';

export const SEO_KEYWORDS = [
  'SSC exam preparation',
  'SSC CGL mock test',
  'SSC CHSL practice',
  'SSC GD Constable',
  'SSC CPO',
  'SSC MTS',
  'banking exam prep',
  'IBPS PO',
  'SBI PO',
  'railway NTPC',
  'multiplication tables drill',
  'SSC vocabulary',
  'fraction percentage conversion',
  'CrackuEx',
].join(', ');

export function pageTitle(section?: string | null): string {
  if (!section) return SEO_DEFAULT_TITLE;
  return `${section} | ${APP_NAME} — SSC Exam Prep`;
}

export function absoluteUrl(path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!SITE_URL) return p;
  return `${SITE_URL}${p}`;
}
