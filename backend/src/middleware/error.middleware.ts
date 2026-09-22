import type { ErrorRequestHandler, RequestHandler } from 'express';
import { errorMessage, isRecord, mongoErrorCode } from '../types/domain.js';
import { HttpError, isHttpError, notFound as notFoundError } from '../utils/app-errors.js';
import { logger } from '../lib/logger.js';

interface AppError extends Error {
  code?: number | string;
  statusCode?: number;
  details?: unknown;
}

function asAppError(err: unknown): AppError {
  if (err instanceof Error) return err as AppError;
  const wrapped = new Error(errorMessage(err)) as AppError;
  if (isRecord(err) && typeof err.code === 'number') wrapped.code = err.code;
  return wrapped;
}

function resolveStatusCode(error: AppError): number {
  if (isHttpError(error) || typeof error.statusCode === 'number') {
    return error.statusCode!;
  }

  if (error.name === 'ValidationError') return 400;
  if (mongoErrorCode(error) === 11000 || error.code === 11000) return 409;
  if (error.message?.includes('JWT_SECRET')) return 503;
  if (error.name === 'MongoServerError' || error.name === 'MongooseError') return 503;
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return 401;

  return 500;
}

function resolveErrorCode(error: AppError, statusCode: number): string {
  if (isHttpError(error) && error.code) return error.code;
  if (typeof error.code === 'string' && Number.isNaN(Number(error.code))) return error.code;

  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[statusCode] || 'INTERNAL_ERROR';
}

const SAFE_MESSAGES: Record<number, string> = {
  400: 'Invalid request data.',
  401: 'Unauthorized.',
  403: 'Forbidden.',
  404: 'Not found.',
  409: 'That account could not be created. Try a different username or sign in.',
  429: 'Too many requests.',
  503: 'Service temporarily unavailable. Try again shortly.',
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const error = asAppError(err);
  const statusCode = resolveStatusCode(error);
  const code = resolveErrorCode(error, statusCode);
  const requestId = req.requestId;
  const isProd = process.env.NODE_ENV === 'production';

  logger.error({
    err: error,
    requestId,
    code,
    statusCode,
    path: req.originalUrl || req.url,
    method: req.method,
    userId: req.user?.id,
    msg: error.message,
  });

  let clientMessage: string;
  if (isProd) {
    if (!isHttpError(error)) {
      clientMessage = SAFE_MESSAGES[statusCode] || 'Internal server error';
    } else {
      clientMessage = error.message || SAFE_MESSAGES[statusCode] || 'Request failed';
    }
  } else {
    clientMessage = error.message || SAFE_MESSAGES[statusCode] || 'Internal Server Error';
  }

  const body: Record<string, unknown> = {
    status: 'error',
    code,
    message: clientMessage,
    requestId: requestId || undefined,
  };

  if (isHttpError(error) && error.details !== undefined && statusCode < 500) {
    body.details = error.details;
  }

  if (!isProd) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};

export const notFound: RequestHandler = (_req, _res, next) => {
  next(notFoundError('Not found.'));
};

export { HttpError };
