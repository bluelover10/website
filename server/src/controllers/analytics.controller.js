const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Website = require('../models/Website');
const { trackEvent, getSummary, getByPage } = require('../services/analytics.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString() || req.body?.websiteId;
}

// Public track payload is fully untrusted: clamp every string to a tight max
// so anonymous callers can't write multi-KB junk into the analytics collection
// (the old code stored req.body verbatim).
const clamp = (v, max, fallback = '') =>
  typeof v === 'string' && v.length ? v.slice(0, max) : fallback;

// Public track — no auth required
const track = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const websiteId = body.websiteId;
  if (!websiteId) throw new ApiError(400, 'websiteId required', 'WEBSITE_ID_MISSING');
  const website = await Website.findById(websiteId).select('_id');
  if (!website) throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  const event = await trackEvent({
    websiteId,
    pageId: typeof body.pageId === 'string' && body.pageId.length <= 50 ? body.pageId : null,
    pagePath: clamp(body.pagePath, 300, '/'),
    referrer: clamp(body.referrer, 500),
    device: clamp(body.device, 40, 'unknown'),
    browser: clamp(body.browser, 40, 'unknown'),
    country: clamp(body.country, 60),
    visitorId: clamp(body.visitorId, 64),
  });
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
