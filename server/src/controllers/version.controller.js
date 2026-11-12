const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const { createVersion } = require('../services/version.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

function pageIdOf(req) {
  return req.params.pageId;
}

const listVersions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const filter = { pageId: pageIdOf(req) };
  const [total, versions] = await Promise.all([
    PageVersion.countDocuments(filter),
    PageVersion.find(filter).sort({ versionNumber: -1 }).skip(skip).limit(limit).populate('snapshotBy', 'name email').lean(),
  ]);
  return sendSuccess(res, { versions, total, page, limit, pages: Math.ceil(total / limit) }, 'Versions fetched');
});

const getVersion = asyncHandler(async (req, res) => {
  const version = await PageVersion.findOne({ pageId: pageIdOf(req), versionNumber: Number(req.params.versionNumber) }).lean();
  if (!version) throw new ApiError(404, 'Version not found', 'VERSION_NOT_FOUND');
  return sendSuccess(res, { version }, 'Version fetched');
});

const createSnapshot = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: pageIdOf(req), ...(websiteId ? { websiteId } : {}) });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  const { version } = await createVersion(page, req.user.id, { force: true });
  return sendSuccess(res, { version }, 'Snapshot created', 201);
});

const restore = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: pageIdOf(req), ...(websiteId ? { websiteId } : {}) });
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
