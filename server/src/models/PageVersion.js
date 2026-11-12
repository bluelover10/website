const mongoose = require('mongoose');

const pageVersionSchema = new mongoose.Schema(
  {
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    versionNumber: { type: Number, required: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    snapshotBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pageVersionSchema.index({ pageId: 1, versionNumber: 1 }, { unique: true });
pageVersionSchema.index({ pageId: 1, createdAt: -1 });

module.exports = mongoose.model('PageVersion', pageVersionSchema);
