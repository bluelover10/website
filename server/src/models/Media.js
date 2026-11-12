const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

mediaSchema.index({ websiteId: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
