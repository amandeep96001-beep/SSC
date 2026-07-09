const PROHIBITED = /^\$|\./;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PROHIBITED.test(key)) continue;
    clean[key] = sanitizeValue(value);
  }
  return clean;
}

function sanitizeInPlace(obj) {
  if (!isPlainObject(obj)) return;

  for (const key of Object.keys(obj)) {
    if (PROHIBITED.test(key)) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (isPlainObject(value)) {
      const sanitized = sanitizeObject(value);
      obj[key] = sanitized;
    } else if (Array.isArray(value)) {
      obj[key] = sanitizeValue(value);
    }
  }
}

/**
 * Strips MongoDB operator injection patterns ($gt, $where, etc.)
 * Express 5 compatible — does not reassign read-only req.query.
 */
export function mongoSanitize(req, _res, next) {
  if (req.body && isPlainObject(req.body)) {
    req.body = sanitizeObject(req.body);
  }

  if (req.params && isPlainObject(req.params)) {
    sanitizeInPlace(req.params);
  }

  if (req.query && isPlainObject(req.query)) {
    sanitizeInPlace(req.query);
  }

  next();
}
