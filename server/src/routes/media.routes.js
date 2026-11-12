const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const mediaController = require('../controllers/media.controller');

const router = express.Router({ mergeParams: true });

// NOTE: upload runs BEFORE requireWebsiteRole so that websiteId sent as a
// multipart form field is parsed (req.body is empty until multer runs).
router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), mediaController.listMedia);
router.post('/', protect, upload.single('file'), requireWebsiteRole(['owner', 'editor']), mediaController.uploadMedia);
router.delete('/:mediaId', protect, requireWebsiteRole(['owner', 'editor']), mediaController.deleteMedia);

module.exports = router;
