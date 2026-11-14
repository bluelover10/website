// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;

  // Never leak raw driver/stack messages for unexpected 500s in production.
  let message = err.message || 'Internal server error';
  if (isProd && statusCode >= 500) {
    message = 'Internal server error';
  }
  const errorCode = err.errorCode || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');

  if (!isProd && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}]`, err.message, err.stack || '');
  } else if (isProd) {
    // Production: log server-side only, never return internals.
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}]`, statusCode, err.errorCode || '', err.message);
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
      // Do not echo the raw user-supplied value back.
      message: `Invalid ${err.path || 'identifier'}`,
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
  // Multer upload errors map to proper status codes (not 500).
  if (err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const friendly = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : 'Upload failed';
    return res.status(status).json({
      success: false,
      message: friendly,
      errorCode: err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
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
