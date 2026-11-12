const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const mediaController = require('../controllers/media.controller');

const router = express.Router({ mergeParams: true });

router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), mediaController.listMedia);
router.post('/', protect, requireWebsiteRole(['owner', 'editor']), upload.single('file'), mediaController.uploadMedia);
router.delete('/:mediaId', protect, requireWebsiteRole(['owner', 'editor']), mediaController.deleteMedia);

module.exports = router;
