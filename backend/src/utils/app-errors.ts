export class HttpError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(statusCode: number, message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export function badRequest(message = 'Invalid request data.'): HttpError {
  return new HttpError(400, message);
}

export function unauthorized(message = 'Unauthorized.'): HttpError {
  return new HttpError(401, message);
}

export function forbidden(message = 'Forbidden.'): HttpError {
  return new HttpError(403, message);
}

export function notFound(message = 'Not found.'): HttpError {
  return new HttpError(404, message);
}

export function conflict(message = 'Conflict.'): HttpError {
  return new HttpError(409, message);
}

export function gone(message = 'Gone.'): HttpError {
  return new HttpError(410, message);
}

export function tooManyRequests(message = 'Too many requests.'): HttpError {
  return new HttpError(429, message);
}

export function serviceUnavailable(message = 'Service temporarily unavailable. Try again shortly.'): HttpError {
  return new HttpError(503, message);
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
