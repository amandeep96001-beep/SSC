export class HttpError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options?: { cause?: unknown; code?: string; details?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = options?.code || statusToCode(statusCode);
    this.details = options?.details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  withDetails(details: unknown): this {
    return new HttpError(this.statusCode, this.message, {
      code: this.code,
      details,
      cause: this.cause,
    }) as this;
  }
}

function statusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    410: 'GONE',
    429: 'TOO_MANY_REQUESTS',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] || 'INTERNAL_ERROR';
}

export function badRequest(message = 'Invalid request data.', code = 'BAD_REQUEST'): HttpError {
  return new HttpError(400, message, { code });
}

export function unauthorized(message = 'Unauthorized.', code = 'UNAUTHORIZED'): HttpError {
  return new HttpError(401, message, { code });
}

export function forbidden(message = 'Forbidden.', code = 'FORBIDDEN'): HttpError {
  return new HttpError(403, message, { code });
}

export function notFound(message = 'Not found.', code = 'NOT_FOUND'): HttpError {
  return new HttpError(404, message, { code });
}

export function conflict(message = 'Conflict.', code = 'CONFLICT'): HttpError {
  return new HttpError(409, message, { code });
}

export function gone(message = 'Gone.', code = 'GONE'): HttpError {
  return new HttpError(410, message, { code });
}

export function tooManyRequests(message = 'Too many requests.', code = 'TOO_MANY_REQUESTS'): HttpError {
  return new HttpError(429, message, { code });
}

export function serviceUnavailable(
  message = 'Service temporarily unavailable. Try again shortly.',
  code = 'SERVICE_UNAVAILABLE',
): HttpError {
  return new HttpError(503, message, { code });
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
