// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.errorCode || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}]`, message, err.stack || '');
  }

  // Mongoose validation / cast / duplicate handling
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: Object.values(err.errors || {}).map((e) => e.message),
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      errorCode: 'INVALID_ID',
    });
  }
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${fields || 'unique field'}`,
      errorCode: 'DUPLICATE_KEY',
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(err.errors && err.errors.length ? { errors: err.errors } : {}),
  });
}

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
  });
}

module.exports = { errorHandler, notFound };
