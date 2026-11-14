const rateLimit = require('express-rate-limit');

// All limiters are skipped under Jest (NODE_ENV=test) so the 39-test suite can
// issue many requests from the same IP without tripping limits.
const isTest = process.env.NODE_ENV === 'test';

const skipIfTest = () => isTest;

// Strict limiter for authentication endpoints (brute-force protection).
// Successful requests don't count toward the budget, so normal users are
// unaffected while repeated failures get throttled fast.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipIfTest,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.', errorCode: 'RATE_LIMITED' },
});

// Public contact-form submission — small budget per IP.
const formSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
  message: { success: false, message: 'Too many submissions from this address. Try again later.', errorCode: 'RATE_LIMITED' },
});

// Public analytics tracking — one event per page view per visitor; generous
// but bounded so it cannot be used to flood the DB.
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
  message: { success: false, message: 'Tracking rate exceeded.', errorCode: 'RATE_LIMITED' },
});

module.exports = { authLimiter, formSubmitLimiter, trackLimiter };
