const express = require('express');
const fsp = require('fs').promises;
const { protect } = require('../middleware/auth');
const { requireWebsiteRole, getWebsiteId } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const mediaController = require('../controllers/media.controller');

const router = express.Router({ mergeParams: true });

// NOTE: upload runs BEFORE requireWebsiteRole so that websiteId sent as a
// multipart form field is parsed (req.body is empty until multer runs).
// Everything after multer is wrapped so a failed authz/content check never
// leaves an orphaned file on disk.

// Content sniffing right after the write: declared mime type is client-controlled.
const { verifyUploadedImage } = require('../middleware/upload');

// Run the role check; if it fails, delete the freshly written temp file.
function roleCheckWithCleanup(allowedRoles) {
  return (req, res, next) => {
    requireWebsiteRole(allowedRoles)(req, res, (err) => {
      if (err && req.file) {
        fsp.unlink(req.file.path).catch(() => {});
        req.file = null;
      }
      next(err);
    });
  };
}

// GET serves two modes:
// - websiteId scoped (nested /websites/:websiteId/media mount or ?websiteId=)
//   → strict per-site role check, as everywhere else.
// - unscoped (standalone /api/media alias, used by the dashboard media library)
//   → no site is addressed, so there is nothing to role-check here; listMedia
//   tenant-scopes the query to every site the caller owns or is a member of.
router.get(
  '/',
  protect,
  (req, res, next) => {
    if (!getWebsiteId(req)) return next();
    requireWebsiteRole(['owner', 'editor', 'viewer'])(req, res, next);
  },
  mediaController.listMedia
);
router.post(
  '/',
  protect,
  upload.single('file'),
  verifyUploadedImage,
  roleCheckWithCleanup(['owner', 'editor']),
  mediaController.uploadMedia
);
router.delete('/:mediaId', protect, requireWebsiteRole(['owner', 'editor']), mediaController.deleteMedia);

module.exports = router;
