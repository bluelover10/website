const { z } = require('zod');

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

module.exports = { inviteMemberSchema, updateMemberRoleSchema };
