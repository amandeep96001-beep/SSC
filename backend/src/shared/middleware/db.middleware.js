import { getDBStatus, getLastDbError } from '../../config/db.config.js';

export function requireDb(req, res, next) {
  if (getDBStatus()) {
    return next();
  }

  const detail = getLastDbError();
  const authFailed = /bad auth|authentication failed/i.test(detail || '');
  return res.status(503).json({
    status: 'error',
    message: authFailed
      ? 'MongoDB authentication failed. On Render, MONGODB_URI user/password must match Atlas → Database Access. Reset the DB user password, update the URI (no quotes), and restart.'
      : 'Database is not connected. Check MONGODB_URI on Render and Atlas Network Access (0.0.0.0/0), then restart the service.',
    ...(detail ? { detail } : {}),
  });
}
