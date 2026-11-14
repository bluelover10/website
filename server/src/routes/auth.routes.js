const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const { registerSchema, loginSchema, updateMeSchema, updatePasswordSchema } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Brute-force protection: strict budget on auth attempts (successful requests
// don't count; skipped under test env).
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', protect, authController.me);
router.patch('/me', protect, validate(updateMeSchema), authController.updateMe);
router.patch('/password', protect, validate(updatePasswordSchema), authController.changePassword);

module.exports = router;
