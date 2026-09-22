/**
 * Re-export the app's typed HTTP errors so modules can import from one place:
 *   import { badRequest, notFound } from '../../lib/errors.js';
 */
export {
  HttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  gone,
  tooManyRequests,
  serviceUnavailable,
  isHttpError,
} from '../utils/app-errors.js';
