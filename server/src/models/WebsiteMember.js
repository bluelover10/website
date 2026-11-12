const mongoose = require('mongoose');

const websiteMemberSchema = new mongoose.Schema(
  {
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer', required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

websiteMemberSchema.index({ websiteId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WebsiteMember', websiteMemberSchema);
