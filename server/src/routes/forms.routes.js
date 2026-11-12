const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { submitFormSchema } = require('../validators/form.validator');
const formController = require('../controllers/form.controller');

const router = express.Router({ mergeParams: true });

// Public submission (nested): POST /api/websites/:websiteId/forms/submit
router.post('/submit', validate(submitFormSchema), formController.submitForm);
// Public submission (top-level alias): POST /api/forms/:websiteId/submit
router.post('/:websiteId/submit', validate(submitFormSchema), formController.submitForm);

// Owner/editor listing (nested or top-level with :websiteId param)
router.get('/', protect, requireWebsiteRole(['owner', 'editor']), formController.listSubmissions);
router.get('/:websiteId', protect, requireWebsiteRole(['owner', 'editor']), formController.listSubmissions);
router.delete('/:submissionId', protect, requireWebsiteRole(['owner', 'editor']), formController.deleteSubmission);
router.delete('/:websiteId/:submissionId', protect, requireWebsiteRole(['owner', 'editor']), async (req, res, next) => {
  req.params.submissionId = req.params.submissionId;
  return formController.deleteSubmission(req, res, next);
});

module.exports = router;
