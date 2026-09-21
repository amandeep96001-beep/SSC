import type { ErrorRequestHandler, RequestHandler } from 'express';
import { errorMessage, isRecord, mongoErrorCode } from '../../types/domain.js';
import { HttpError, isHttpError, notFound as notFoundError } from '../errors/http-error.js';

interface AppError extends Error {
  code?: number | string;
  statusCode?: number;
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

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  void req;
  void next;

  const error = asAppError(err);
  const statusCode = resolveStatusCode(error);

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${error.stack}`);
  } else {
    console.error(`[Error Handler] ${error.message}`);
  }

  const safeMessages: Record<number, string> = {
    400: 'Invalid request data.',
    401: 'Unauthorized.',
    403: 'Forbidden.',
    404: 'Not found.',
    409: 'That account could not be created. Try a different username or sign in.',
    429: 'Too many requests.',
    503: 'Service temporarily unavailable. Try again shortly.',
  };

  const isProd = process.env.NODE_ENV === 'production';
  const operational = isHttpError(error) || (typeof error.statusCode === 'number' && error.statusCode < 500);

  let clientMessage: string;
  if (isProd) {
    if (statusCode >= 500 && !operational) {
      clientMessage = safeMessages[statusCode] || 'Internal server error';
    } else {
      clientMessage = error.message || safeMessages[statusCode] || 'Request failed';
    }
  } else {
    clientMessage = error.message || safeMessages[statusCode] || 'Internal Server Error';
  }

  res.status(statusCode).json({
    status: 'error',
    message: clientMessage,
    stack: isProd ? undefined : error.stack,
  });
};

export const notFound: RequestHandler = (_req, _res, next) => {
  next(notFoundError('Not found.'));
};

export { HttpError };
