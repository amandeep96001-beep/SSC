/** App brand — single source of truth for product naming */
export const APP_NAME = 'ExamPrep';
export const APP_TAGLINE = 'SSC CGL · CHSL · MTS';
export const APP_BLURB = 'Structured notes, drills, and full-length mocks for SSC aspirants.';
export const APP_VERSION = '2.0';

export function pageTitle(section) {
  return section ? `${section} | ${APP_NAME}` : APP_NAME;
}
