const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema(
  {
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    formId: { type: String, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

formSubmissionSchema.index({ websiteId: 1, createdAt: -1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
