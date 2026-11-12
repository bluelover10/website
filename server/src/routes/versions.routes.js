const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const versionController = require('../controllers/version.controller');

const router = express.Router({ mergeParams: true });

// Standalone access via ?websiteId=... or /api/pages/:pageId/versions style.
// When mounted at /api/versions, websiteId comes from query/body.
// When mounted nested, params flow through mergeParams.
router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), versionController.listVersions);
router.post('/snapshot', protect, requireWebsiteRole(['owner', 'editor']), versionController.createSnapshot);
router.get('/:versionNumber', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), versionController.getVersion);
router.post('/:versionNumber/restore', protect, requireWebsiteRole(['owner', 'editor']), versionController.restore);

module.exports = router;
