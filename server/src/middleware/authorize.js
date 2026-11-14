const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');

function getWebsiteId(req) {
  return (
    req.params.websiteId ||
    req.params.id ||
    req.params.websiteID ||
    req.body?.websiteId ||
    req.query?.websiteId ||
    null
  );
}

// Owner always allowed. Otherwise require membership with one of `roles`.
// Attaches req.website and req.membership ({ role, isOwner }).
function requireWebsiteRole(allowedRoles = ['owner', 'editor', 'viewer']) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
    }
    const websiteId = getWebsiteId(req);
    if (!websiteId) {
      throw new ApiError(400, 'websiteId param missing', 'WEBSITE_ID_MISSING');
    }
    const website = await Website.findById(websiteId);
    if (!website) {
      throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
    }
    const isOwner = website.owner.toString() === req.user.id.toString();
    if (isOwner) {
      req.website = website;
      req.membership = { role: 'owner', isOwner: true };
      return next();
    }
    const membership = await WebsiteMember.findOne({
      websiteId: website._id,
      userId: req.user.id,
    });
    if (!membership) {
      throw new ApiError(403, 'Forbidden: no access to this website', 'FORBIDDEN');
    }
    if (!allowedRoles.includes(membership.role)) {
      throw new ApiError(403, `Forbidden: requires one of [${allowedRoles.join(', ')}]`, 'FORBIDDEN_ROLE');
    }
    req.website = website;
    req.membership = { role: membership.role, isOwner: false, doc: membership };
    return next();
  });
}

function requireOwnerRole() {
  return requireWebsiteRole(['owner']);
}

// Platform-level admin gate: requires an authenticated user whose ACCOUNT role
// is 'admin' (User.role). Independent of per-website membership roles — an
// admin does not need to be a member of a site to administer it.
// Must run after `protect` (req.user is set there); the check below is defense
// in depth so mounting order can never silently bypass the gate.
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
  }
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: admin access required', 'FORBIDDEN_ADMIN');
  }
  return next();
});

module.exports = { requireWebsiteRole, requireOwnerRole, requireAdmin, getWebsiteId };
