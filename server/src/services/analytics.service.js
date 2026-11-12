const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');

async function trackEvent(payload) {
  const event = await AnalyticsEvent.create({
    websiteId: payload.websiteId,
    pageId: payload.pageId || null,
    pagePath: payload.pagePath || '/',
    type: 'view',
    referrer: payload.referrer || '',
    device: payload.device || 'unknown',
    browser: payload.browser || 'unknown',
    country: payload.country || '',
    visitorId: payload.visitorId || '',
  });
  return event;
}

async function getSummary(websiteId, { from, to } = {}) {
  const match = { websiteId: new mongoose.Types.ObjectId(websiteId) };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  const now = Date.now();
  const windowMatch = (ms) => ({
    websiteId: new mongoose.Types.ObjectId(websiteId),
    createdAt: { $gte: new Date(now - ms) },
  });
  const [totals, byPage, byDay, todayAgg, weekAgg, monthAgg] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          _id: 0,
          views: 1,
          uniqueVisitors: {
            $size: {
              $filter: { input: '$uniqueVisitors', as: 'v', cond: { $ne: ['$$v', ''] } },
            },
          },
        },
      },
    ]),
    AnalyticsEvent.aggregate([
      { $match: match },
      { $group: { _id: '$pagePath', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, pagePath: '$_id', views: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 60 },
      { $project: { _id: 0, date: '$_id', views: 1 } },
    ]),
    // Rolling windows for dashboard cards
    AnalyticsEvent.countDocuments(windowMatch(24 * 3600 * 1000)),
    AnalyticsEvent.countDocuments(windowMatch(7 * 24 * 3600 * 1000)),
    AnalyticsEvent.countDocuments(windowMatch(30 * 24 * 3600 * 1000)),
  ]);
  return {
    views: totals[0]?.views || 0,
    uniqueVisitors: totals[0]?.uniqueVisitors || 0,
    today: todayAgg,
    week: weekAgg,
    month: monthAgg,
    byPage,
    byDay,
  };
}

async function getByPage(websiteId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const matchId = new mongoose.Types.ObjectId(websiteId);
  const [rows, totalAgg] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { websiteId: matchId } },
      {
        $group: {
          _id: { pageId: '$pageId', pagePath: '$pagePath' },
          views: { $sum: 1 },
          lastViewedAt: { $max: '$createdAt' },
        },
      },
      { $sort: { views: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { websiteId: matchId } },
      { $group: { _id: { pageId: '$pageId', pagePath: '$pagePath' } } },
      { $count: 'total' },
    ]),
  ]);
  return {
    rows: rows.map((r) => ({
      pageId: r._id.pageId,
      pagePath: r._id.pagePath,
      views: r.views,
      lastViewedAt: r.lastViewedAt,
    })),
    total: totalAgg[0]?.total || 0,
    page,
    limit,
  };
}

module.exports = { trackEvent, getSummary, getByPage };
