/** App brand — single source of truth for product naming */
export const APP_NAME = 'CrackuEx';
export const APP_TAGLINE = 'Crack every exam';
export const APP_VERSION = '2.3';

export function pageTitle(section?: string | null): string {
  return section ? `${section} | ${APP_NAME}` : APP_NAME;
}
