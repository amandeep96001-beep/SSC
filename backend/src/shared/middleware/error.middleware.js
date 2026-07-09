/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${err.stack}`);
  } else {
    console.error(`[Error Handler] ${err.message}`);
  }

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'Internal Server Error'),
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
