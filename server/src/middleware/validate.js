const ApiError = require('../utils/ApiError');

// validate(schema, source='body') — zod validator factory.
// Usage: router.post('/', validate(createSchema), controller)
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
      const parsed = schema.parse(data);
      if (source === 'query') req.query = parsed;
      else if (source === 'params') req.params = parsed;
      else req.body = parsed;
      return next();
    } catch (err) {
      if (err && (err.name === 'ZodError' || err.issues || err.errors)) {
        const issues = err.issues || err.errors || [];
        const errors = issues.map((e) => ({
          path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        }));
        return next(new ApiError(400, errors[0]?.message || 'Validation failed', 'VALIDATION_ERROR', errors));
      }
      return next(err);
    }
  };
}

module.exports = validate;
