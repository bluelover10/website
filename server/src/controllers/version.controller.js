const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const { createVersion } = require('../services/version.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

// A missing pageId used to fall through into Mongo as `{ pageId: undefined }`,
// which Mongoose strips — producing an EMPTY filter that matched versions of
// EVERY page in the database (cross-tenant leak). pageId is mandatory.
function requiredPageId(req) {
  const pageId = req.params.pageId;
  if (!pageId) throw new ApiError(400, 'pageId is required', 'PAGE_ID_MISSING');
  return pageId;
}

// When a websiteId is present (nested routes and standalone alias), verify the
// requested page actually belongs to that website before touching versions.
async function assertPageInWebsite(pageId, websiteId) {
  if (!websiteId) return;
  const page = await Page.findOne({ _id: pageId, websiteId }).select('_id').lean();
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
}

const listVersions = asyncHandler(async (req, res) => {
  const pageId = requiredPageId(req);
  await assertPageInWebsite(pageId, websiteIdOf(req));
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const filter = { pageId };
  const [total, versions] = await Promise.all([
    PageVersion.countDocuments(filter),
    PageVersion.find(filter).sort({ versionNumber: -1 }).skip(skip).limit(limit).populate('snapshotBy', 'name email').lean(),
  ]);
  return sendSuccess(res, { versions, total, page, limit, pages: Math.ceil(total / limit) }, 'Versions fetched');
});

const getVersion = asyncHandler(async (req, res) => {
  const pageId = requiredPageId(req);
  await assertPageInWebsite(pageId, websiteIdOf(req));
  const version = await PageVersion.findOne({ pageId, versionNumber: Number(req.params.versionNumber) }).lean();
  if (!version) throw new ApiError(404, 'Version not found', 'VERSION_NOT_FOUND');
  return sendSuccess(res, { version }, 'Version fetched');
});

const createSnapshot = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: requiredPageId(req), ...(websiteId ? { websiteId } : {}) });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  const { version } = await createVersion(page, req.user.id, { force: true });
  return sendSuccess(res, { version }, 'Snapshot created', 201);
});

const restore = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: requiredPageId(req), ...(websiteId ? { websiteId } : {}) });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  const version = await PageVersion.findOne({ pageId: page._id, versionNumber: Number(req.params.versionNumber) });
  if (!version) throw new ApiError(404, 'Version not found', 'VERSION_NOT_FOUND');
  // Save current state first so restore is undoable
  await createVersion(page, req.user.id, { force: true });
  page.content = version.content;
  await page.save();
  return sendSuccess(res, { page }, 'Version restored');
});

module.exports = { listVersions, getVersion, createSnapshot, restore };
