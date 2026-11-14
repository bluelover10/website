const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const { trackLimiter } = require('../middleware/rateLimiters');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router({ mergeParams: true });

// Public tracking (rate-limited: anonymous writes are bounded)
router.post('/track', trackLimiter, analyticsController.track);

// Owner analytics — nested style: GET /summary (websiteId from parent params)
router.get('/summary', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), analyticsController.summary);
router.get('/by-page', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), analyticsController.byPage);

// Owner analytics — top-level style: GET /:websiteId/summary
router.get('/:websiteId/summary', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), analyticsController.summary);
router.get('/:websiteId/by-page', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), analyticsController.byPage);

module.exports = router;
