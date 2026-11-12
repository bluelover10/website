const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema(
  {
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    path: { type: String, required: true, default: '/' },
    isHome: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    content: { type: mongoose.Schema.Types.Mixed, default: { id: 'root', type: 'page', props: {}, children: [] } },
    publishedContent: { type: mongoose.Schema.Types.Mixed, default: null },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
pageSchema.index({ websiteId: 1, order: 1 });

module.exports = mongoose.model('Page', pageSchema);
