/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 409;
  } else if (err.message?.includes('JWT_SECRET')) {
    statusCode = 503;
  } else if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    statusCode = 503;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${err.stack}`);
  } else {
    console.error(`[Error Handler] ${err.message}`);
  }

  const safeMessages = {
    400: err.message || 'Invalid request data.',
    409: 'Username is already taken. Choose another.',
    503: err.message?.includes('JWT_SECRET')
      ? 'Server auth is not configured. Set JWT_SECRET on Render.'
      : 'Database unavailable. Try again shortly.',
  };

  res.status(statusCode).json({
    status: 'error',
    message: safeMessages[statusCode]
      || (statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (err.message || 'Internal Server Error')),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
