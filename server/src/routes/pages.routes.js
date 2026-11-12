const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createPageSchema, updatePageSchema, reorderPagesSchema } = require('../validators/page.validator');
const pageController = require('../controllers/page.controller');
const versionController = require('../controllers/version.controller');

const router = express.Router({ mergeParams: true });

// Versions nested under pages: /:pageId/versions
router.get(
  '/:pageId/versions',
  protect,
  requireWebsiteRole(['owner', 'editor', 'viewer']),
  versionController.listVersions
);
router.post(
  '/:pageId/versions/snapshot',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  versionController.createSnapshot
);
router.get(
  '/:pageId/versions/:versionNumber',
  protect,
  requireWebsiteRole(['owner', 'editor', 'viewer']),
  versionController.getVersion
);
router.post(
  '/:pageId/versions/:versionNumber/restore',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  versionController.restore
);

// Pages
router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), pageController.listPages);
router.post('/', protect, requireWebsiteRole(['owner', 'editor']), validate(createPageSchema), pageController.createPage);
router.post(
  '/reorder',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(reorderPagesSchema),
  pageController.reorderPages
);
router.get('/:pageId', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), pageController.getPage);
router.put('/:pageId', protect, requireWebsiteRole(['owner', 'editor']), validate(updatePageSchema), pageController.updatePage);
router.delete('/:pageId', protect, requireWebsiteRole(['owner', 'editor']), pageController.deletePage);
router.post('/:pageId/duplicate', protect, requireWebsiteRole(['owner', 'editor']), pageController.duplicatePage);
router.post('/:pageId/set-home', protect, requireWebsiteRole(['owner', 'editor']), pageController.setHomePage);

module.exports = router;
