const express = require('express');
const { protect } = require('../middleware/auth');
const { requireWebsiteRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { inviteMemberSchema, updateMemberRoleSchema } = require('../validators/member.validator');
const memberController = require('../controllers/member.controller');

const router = express.Router({ mergeParams: true });

router.get('/', protect, requireWebsiteRole(['owner', 'editor', 'viewer']), memberController.listMembers);
router.post('/invite', protect, requireWebsiteRole(['owner']), validate(inviteMemberSchema), memberController.inviteMember);
router.patch('/:memberId', protect, requireWebsiteRole(['owner']), validate(updateMemberRoleSchema), memberController.updateMemberRole);
router.delete('/:memberId', protect, requireWebsiteRole(['owner']), memberController.removeMember);

module.exports = router;
