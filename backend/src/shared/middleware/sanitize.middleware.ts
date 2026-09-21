import type { RequestHandler } from 'express';

const PROHIBITED_KEY = /^\$|\./;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isDangerousKey(key: string): boolean {
  return FORBIDDEN_KEYS.has(key) || PROHIBITED_KEY.test(key);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isDangerousKey(key)) continue;
    clean[key] = sanitizeValue(value);
  }
  return clean;
}

function sanitizeInPlace(obj: Record<string, unknown>): void {
  if (!isPlainObject(obj)) return;

  for (const key of Object.keys(obj)) {
    if (isDangerousKey(key)) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (isPlainObject(value)) {
      obj[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      obj[key] = sanitizeValue(value);
    }
  }
}

export const mongoSanitize: RequestHandler = (req, _res, next) => {
  if (req.body && isPlainObject(req.body)) {
    req.body = sanitizeObject(req.body);
  }

  if (req.params && isPlainObject(req.params)) {
    sanitizeInPlace(req.params as unknown as Record<string, unknown>);
  }

  if (req.query && isPlainObject(req.query)) {
    sanitizeInPlace(req.query as unknown as Record<string, unknown>);
  }

  next();
};
