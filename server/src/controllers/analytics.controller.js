const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Website = require('../models/Website');
const { trackEvent, getSummary, getByPage } = require('../services/analytics.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString() || req.body?.websiteId;
}

// Public track — no auth required
const track = asyncHandler(async (req, res) => {
  const { websiteId, pageId, pagePath, referrer, device, browser, country, visitorId } = req.body;
  if (!websiteId) throw new ApiError(400, 'websiteId required', 'WEBSITE_ID_MISSING');
  const website = await Website.findById(websiteId).select('_id');
  if (!website) throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  const event = await trackEvent({ websiteId, pageId, pagePath, referrer, device, browser, country, visitorId });
  // Best-effort views counter
  await Website.updateOne({ _id: websiteId }, { $inc: { viewsCount: 1 } });
  return sendSuccess(res, { event }, 'Tracked', 201);
});

const summary = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const data = await getSummary(websiteId, { from: req.query.from, to: req.query.to });
  return sendSuccess(res, data, 'Analytics summary');
});

const byPage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const data = await getByPage(websiteId, {
    page: parseInt(req.query.page, 10) || 1,
    limit: Math.min(100, parseInt(req.query.limit, 10) || 20),
  });
  return sendSuccess(res, data, 'Analytics by page');
});

module.exports = { track, summary, byPage };
