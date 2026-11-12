const mongoose = require('mongoose');

const templatePageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    theme: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    pages: { type: [templatePageSchema], default: [] },
    isPublic: { type: Boolean, default: true, index: true },
    seedVersion: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
