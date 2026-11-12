const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateThemeSchema,
  updateNavigationSchema,
  updateSeoSchema,
  updateSettingsSchema,
} = require('../validators/website.validator');
const websiteController = require('../controllers/website.controller');

const pagesRouter = require('./pages.routes');
const membersRouter = require('./members.routes');
const mediaRouter = require('./media.routes');
const formsRouter = require('./forms.routes');
const analyticsRouter = require('./analytics.routes');

const router = express.Router();

// ---- Public routes (no auth) — must be registered before authed routes ----
// Published site snapshot for the public renderer: /api/websites/slug/:slug
router.get('/slug/:slug', websiteController.getPublishedSite);
// Backwards-compatible alias: /api/websites/published/:slug
router.get('/published/:slug', websiteController.getPublishedSite);

// Create a website from a public template (templateId in path).
router.post('/from-template/:templateId', protect, websiteController.createFromTemplate);

// Nested resources (must be registered before /:websiteId routes that could clash —
// express matches in order, but /:websiteId/pages is distinct from /:websiteId so order is safe)
router.use('/:websiteId/pages', pagesRouter);
router.use('/:websiteId/members', membersRouter);
router.use('/:websiteId/media', mediaRouter);
router.use('/:websiteId/forms', formsRouter);
router.use('/:websiteId/analytics', analyticsRouter);

// Website collection
router.get('/', protect, websiteController.listWebsites);
router.post('/', protect, validate(createWebsiteSchema), websiteController.createWebsite);

// Single website
router.get('/:websiteId', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), websiteController.getWebsite);
router.put(
  '/:websiteId',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(updateWebsiteSchema),
  websiteController.updateWebsite
);
router.delete('/:websiteId', protect, requireWebsiteRole(['owner']), websiteController.deleteWebsite);

// Duplicate
router.post('/:websiteId/duplicate', protect, requireWebsiteRole(['owner', 'editor']), websiteController.duplicateWebsite);

// Publish flow
router.post('/:websiteId/publish', protect, requireWebsiteRole(['owner', 'editor']), websiteController.publish);
router.post('/:websiteId/unpublish', protect, requireWebsiteRole(['owner', 'editor']), websiteController.unpublish);

// Theme / navigation / seo / settings
router.put(
  '/:websiteId/theme',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(updateThemeSchema),
  websiteController.updateTheme
);
router.put(
  '/:websiteId/navigation',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(updateNavigationSchema),
  websiteController.updateNavigation
);
router.put(
  '/:websiteId/seo',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(updateSeoSchema),
  websiteController.updateSeo
);
router.put(
  '/:websiteId/settings',
  protect,
  requireWebsiteRole(['owner', 'editor']),
  validate(updateSettingsSchema),
  websiteController.updateSettings
);

module.exports = router;
