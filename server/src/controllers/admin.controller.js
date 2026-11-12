// Platform admin controller: server-wide stats and cross-account management.
// Every handler runs behind `protect` + `requireAdmin` (see admin.routes.js) —
// there is NO fallback path here for non-admins.
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const FormSubmission = require('../models/FormSubmission');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const PublishVersion = require('../models/PublishVersion');
const Media = require('../models/Media');
const { unpublishWebsite } = require('../services/publish.service');

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// Search input is interpolated into $regex — escape metacharacters so a user
// cannot craft a catastrophic-backtracking pattern against the DB.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
const getStats = asyncHandler(async (req, res) => {
  const [users, websites, published, pages, media, submissions, views] = await Promise.all([
    User.countDocuments({}),
    Website.countDocuments({}),
    Website.countDocuments({ status: 'published' }),
    Page.countDocuments({}),
    Media.countDocuments({}),
    FormSubmission.countDocuments({}),
    AnalyticsEvent.countDocuments({ type: 'view' }),
  ]);

  const [recentUsers, recentWebsites] = await Promise.all([
    User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt')
      .lean(),
    Website.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name slug status updatedAt owner viewsCount')
      .populate('owner', 'name email')
      .lean(),
  ]);

  return sendSuccess(
    res,
    {
      stats: {
        users,
        websites,
        published,
        drafts: websites - published,
        pages,
        media,
        submissions,
        views,
      },
      recentUsers,
      recentWebsites,
    },
    'Admin stats fetched'
  );
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const search = (req.query.search || '').trim();
  const role = req.query.role;

  const filter = {};
  if (role && ['user', 'admin'].includes(role)) filter.role = role;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email role avatar createdAt')
      .lean(),
  ]);

  // Sites owned per user (one aggregate for the page, not N queries).
  const ids = users.map((u) => u._id);
  const owned = ids.length
    ? await Website.aggregate([
        { $match: { owner: { $in: ids } } },
        { $group: { _id: '$owner', count: { $sum: 1 } } },
      ])
    : [];
  const ownedMap = new Map(owned.map((o) => [o._id.toString(), o.count]));
  const data = users.map((u) => ({ ...u, sitesOwned: ownedMap.get(u._id.toString()) || 0 }));

  return sendSuccess(res, { users: data, total, page, limit, pages: Math.ceil(total / limit) }, 'Users fetched');
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    throw new ApiError(400, 'Role must be "user" or "admin"', 'INVALID_ROLE');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  // Guard: an admin can never change their own role — prevents accidental
  // self-demotion and the "no admin left" lockout state.
  if (user._id.toString() === req.user.id.toString()) {
    throw new ApiError(400, 'You cannot change your own role', 'CANNOT_CHANGE_SELF');
  }
  user.role = role;
  await user.save();
  return sendSuccess(res, { user: user.toSafeJSON() }, 'Role updated');
});

// ---------------------------------------------------------------------------
// Websites (platform-wide)
// ---------------------------------------------------------------------------
const listWebsites = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const search = (req.query.search || '').trim();
  const status = req.query.status;

  const filter = {};
  if (status && ['draft', 'published'].includes(status)) filter.status = status;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

  const [total, websites] = await Promise.all([
    Website.countDocuments(filter),
    Website.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name slug status category owner updatedAt viewsCount')
      .populate('owner', 'name email')
      .lean(),
  ]);

  const ids = websites.map((w) => w._id);
  const counts = ids.length
    ? await Page.aggregate([
        { $match: { websiteId: { $in: ids } } },
        { $group: { _id: '$websiteId', count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const data = websites.map((w) => ({ ...w, pageCount: countMap.get(w._id.toString()) || 0 }));

  return sendSuccess(res, { websites: data, total, page, limit, pages: Math.ceil(total / limit) }, 'Websites fetched');
});

// Admin override: force-delete any website with the SAME full cleanup the
// owner path uses (website.controller.deleteWebsite). No membership required.
const deleteWebsite = asyncHandler(async (req, res) => {
  const website = await Website.findById(req.params.id);
  if (!website) throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  const websiteId = website._id;
  await Promise.all([
    Page.deleteMany({ websiteId }),
    PageVersion.deleteMany({ websiteId }),
    WebsiteMember.deleteMany({ websiteId }),
    FormSubmission.deleteMany({ websiteId }),
    AnalyticsEvent.deleteMany({ websiteId }),
    PublishVersion.deleteMany({ websiteId }),
    Media.deleteMany({ websiteId }),
  ]);
  await website.deleteOne();
  return sendSuccess(res, { deleted: true }, 'Website deleted');
});

// Admin override: take a site offline regardless of who owns it.
const unpublish = asyncHandler(async (req, res) => {
  const website = await unpublishWebsite(req.params.id);
  return sendSuccess(res, { website }, 'Website unpublished');
});

module.exports = {
  getStats,
  listUsers,
  updateUserRole,
  listWebsites,
  deleteWebsite,
  unpublish,
};