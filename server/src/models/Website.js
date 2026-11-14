const mongoose = require('mongoose');

const navigationItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    linkType: { type: String, enum: ['page', 'url', 'anchor'], default: 'page' },
    href: { type: String, default: '' },
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    openInNew: { type: Boolean, default: false },
  },
  { _id: true }
);

const websiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    category: { type: String, default: 'general', index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    // Theme is a design-token bag whose canonical shape is defined by the
    // client renderer (see client/src/utils/componentDefaults + ThemePanel).
    // Zod (updateThemeSchema) validates the patch; the model stays flexible.
    theme: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        primary: '#5b4fd6',
        secondary: '#0ea5e9',
        background: '#ffffff',
        text: '#111827',
        accent: '#f59e0b',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
        containerWidth: 1200,
        radius: 8,
        buttonStyle: 'solid',
      },
    },
    navigation: { type: [navigationItemSchema], default: [] },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, default: '' },
      favicon: { type: String, default: '' },
    },
    customDomain: { type: String, default: '', trim: true },
    domainVerified: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    publishedSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

websiteSchema.index({ owner: 1, createdAt: -1 });
// listWebsites sorts by updatedAt (dashboard recency) — keep it indexed.
websiteSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Website', websiteSchema);
