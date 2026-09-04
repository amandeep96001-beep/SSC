import { getDBStatus, getLastDbError } from '../../config/db.config.js';

export function requireDb(req, res, next) {
  if (getDBStatus()) {
    return next();
  }

  const detail = getLastDbError();
  return res.status(503).json({
    status: 'error',
    message:
      'Database is not connected. Check MONGODB_URI on Render and Atlas Network Access (0.0.0.0/0), then restart the service.',
    ...(detail ? { detail } : {}),
  });
}
