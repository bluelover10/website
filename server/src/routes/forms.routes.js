const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { formSubmitLimiter } = require('../middleware/rateLimiters');
const { submitFormSchema } = require('../validators/form.validator');
const formController = require('../controllers/form.controller');
const FormSubmission = require('../models/FormSubmission');

const router = express.Router({ mergeParams: true });

// Public submission (nested): POST /api/websites/:websiteId/forms/submit
router.post('/submit', formSubmitLimiter, validate(submitFormSchema), formController.submitForm);
// Public submission (top-level alias): POST /api/forms/:websiteId/submit
router.post('/:websiteId/submit', formSubmitLimiter, validate(submitFormSchema), formController.submitForm);

// Owner/editor listing (nested or top-level with :websiteId param)
router.get('/', protect, requireWebsiteRole(['owner', 'editor']), formController.listSubmissions);
router.get('/:websiteId', protect, requireWebsiteRole(['owner', 'editor']), formController.listSubmissions);

// Standalone delete by submission id: resolve the owning website from the
// submission document itself, then run the normal role check.
router.delete('/:submissionId', protect, async (req, res, next) => {
  if (!req.params.websiteId) {
    try {
      const submission = await FormSubmission.findById(req.params.submissionId).select('websiteId').lean();
      if (submission) req.params.websiteId = String(submission.websiteId);
    } catch {
      // fall through — role check/controller produce the proper error
    }
  }
  return next();
}, requireWebsiteRole(['owner', 'editor']), formController.deleteSubmission);

router.delete('/:websiteId/:submissionId', protect, requireWebsiteRole(['owner', 'editor']), formController.deleteSubmission);

module.exports = router;
