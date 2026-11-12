const mongoose = require('mongoose');

const publishVersionSchema = new mongoose.Schema(
  {
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    versionNumber: { type: Number, required: true },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pagesSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    theme: { type: mongoose.Schema.Types.Mixed, default: null },
    navigation: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

publishVersionSchema.index({ websiteId: 1, versionNumber: 1 }, { unique: true });
publishVersionSchema.index({ websiteId: 1, createdAt: -1 });

module.exports = mongoose.model('PublishVersion', publishVersionSchema);
