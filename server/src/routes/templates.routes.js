const express = require('express');
const { protect } = require('../middleware/auth');
const templateController = require('../controllers/template.controller');

const router = express.Router();

router.get('/', templateController.listTemplates);
router.get('/:templateId', templateController.getTemplate);
router.post('/:templateId/instantiate', protect, templateController.instantiateTemplate);

module.exports = router;
