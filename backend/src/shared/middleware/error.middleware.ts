import type { ErrorRequestHandler, RequestHandler } from 'express';
import { errorMessage, isRecord, mongoErrorCode } from '../../types/domain.js';

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

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  void req;
  void next;
  const error = asAppError(err);
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (mongoErrorCode(error) === 11000 || error.code === 11000) {
    statusCode = 409;
  } else if (error.message?.includes('JWT_SECRET')) {
    statusCode = 503;
  } else if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
    statusCode = 503;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${error.stack}`);
  } else {
    console.error(`[Error Handler] ${error.message}`);
  }

  const safeMessages: Record<number, string> = {
    400: 'Invalid request data.',
    404: 'Not found.',
    409: 'That account could not be created. Try a different username or sign in.',
    503: 'Service temporarily unavailable. Try again shortly.',
  };

  const isProd = process.env.NODE_ENV === 'production';
  const clientMessage = isProd
    ? (safeMessages[statusCode]
      || (statusCode >= 500 ? 'Internal server error' : (error.message || 'Request failed')))
    : (safeMessages[statusCode] && statusCode >= 500
      ? safeMessages[statusCode]
      : (error.message || 'Internal Server Error'));

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 400 && error.message && !isProd
      ? error.message
      : clientMessage,
    stack: isProd ? undefined : error.stack
  });
};

export const notFound: RequestHandler = (req, res, next) => {
  const error = new Error('Not found.');
  res.status(404);
  next(error);
};
