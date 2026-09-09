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
    400: error.message || 'Invalid request data.',
    409: 'Username is already taken. Choose another.',
    503: error.message?.includes('JWT_SECRET')
      ? 'Server auth is not configured. Set JWT_SECRET on Render.'
      : 'Database unavailable. Try again shortly.',
  };

  res.status(statusCode).json({
    status: 'error',
    message: safeMessages[statusCode]
      || (statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (error.message || 'Internal Server Error')),
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};

export const notFound: RequestHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
