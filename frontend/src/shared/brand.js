/** App brand — single source of truth for product naming */
export const APP_NAME = 'ExamPrep';
export const APP_VERSION = '2.1';

export function pageTitle(section) {
  return section ? `${section} | ${APP_NAME}` : APP_NAME;
}
