const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    pagePath: { type: String, default: '/' },
    type: { type: String, enum: ['view'], default: 'view' },
    referrer: { type: String, default: '' },
    device: { type: String, default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    country: { type: String, default: '' },
    visitorId: { type: String, default: '', index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ websiteId: 1, createdAt: -1 });
analyticsEventSchema.index({ websiteId: 1, pageId: 1 });
// Platform stats run countDocuments({ type: 'view' }) on the biggest collection.
analyticsEventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
