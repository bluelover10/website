const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { inviteMemberSchema, updateMemberRoleSchema } = require('../validators/member.validator');
const memberController = require('../controllers/member.controller');
const WebsiteMember = require('../models/WebsiteMember');

const router = express.Router({ mergeParams: true });

router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), memberController.listMembers);
router.post('/invite', protect, requireWebsiteRole(['owner']), validate(inviteMemberSchema), memberController.inviteMember);

// Standalone member routes: resolve the owning website from the member document
// itself, then run the normal owner-only role check. (When mounted nested,
// :websiteId is already present and the pre-handler is a no-op.)
function withResolvedWebsiteId() {
  return async (req, res, next) => {
    if (!req.params.websiteId) {
      try {
        const member = await WebsiteMember.findById(req.params.memberId).select('websiteId').lean();
        if (member) req.params.websiteId = String(member.websiteId);
      } catch {
        // fall through — role check/controller produce the proper error
      }
    }
    return next();
  };
}

router.patch(
  '/:memberId',
  protect,
  withResolvedWebsiteId(),
  requireWebsiteRole(['owner']),
  validate(updateMemberRoleSchema),
  memberController.updateMemberRole
);
router.delete('/:memberId', protect, withResolvedWebsiteId(), requireWebsiteRole(['owner']), memberController.removeMember);

module.exports = router;
