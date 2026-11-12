// Admin routes — ALL require an authenticated account with User.role === 'admin'.
// protect populates req.user (incl. role); requireAdmin enforces the account role.
const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, requireAdmin);

// Stats
router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

// Websites (platform-wide management)
router.get('/websites', adminController.listWebsites);
router.post('/websites/:id/unpublish', adminController.unpublish);
router.delete('/websites/:id', adminController.deleteWebsite);

module.exports = router;