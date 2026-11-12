const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const WebsiteMember = require('../models/WebsiteMember');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

function ensureOwner(req) {
  if (req.membership?.isOwner || req.membership?.role === 'owner') return;
  throw new ApiError(403, 'Only the website owner can manage members', 'FORBIDDEN');
}

const listMembers = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const members = await WebsiteMember.find({ websiteId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: 1 })
    .lean();
  return sendSuccess(res, { members }, 'Members fetched');
});

const inviteMember = asyncHandler(async (req, res) => {
  ensureOwner(req);
  const websiteId = websiteIdOf(req);
  const { email, role } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(404, 'User with this email not found', 'USER_NOT_FOUND');
  }
  if (req.website.owner.toString() === user._id.toString()) {
    throw new ApiError(400, 'User is already the owner', 'ALREADY_OWNER');
  }
  const existing = await WebsiteMember.findOne({ websiteId, userId: user._id });
  if (existing) {
    throw new ApiError(409, 'User is already a member', 'ALREADY_MEMBER');
  }
  const member = await WebsiteMember.create({
    websiteId,
    userId: user._id,
    role,
    invitedBy: req.user.id,
  });
  return sendSuccess(res, { member }, 'Member invited', 201);
});

const updateMemberRole = asyncHandler(async (req, res) => {
  ensureOwner(req);
  const websiteId = websiteIdOf(req);
  const member = await WebsiteMember.findOne({ _id: req.params.memberId, websiteId });
  if (!member) throw new ApiError(404, 'Member not found', 'MEMBER_NOT_FOUND');
  if (member.role === 'owner') {
    throw new ApiError(400, 'Cannot change owner role', 'CANNOT_CHANGE_OWNER');
  }
  member.role = req.body.role;
  await member.save();
  return sendSuccess(res, { member }, 'Member role updated');
});

const removeMember = asyncHandler(async (req, res) => {
  ensureOwner(req);
  const websiteId = websiteIdOf(req);
  const member = await WebsiteMember.findOne({ _id: req.params.memberId, websiteId });
  if (!member) throw new ApiError(404, 'Member not found', 'MEMBER_NOT_FOUND');
  if (member.role === 'owner') {
    throw new ApiError(400, 'Cannot remove the owner', 'CANNOT_REMOVE_OWNER');
  }
  await member.deleteOne();
  return sendSuccess(res, { removed: true }, 'Member removed');
});

module.exports = { listMembers, inviteMember, updateMemberRole, removeMember };
